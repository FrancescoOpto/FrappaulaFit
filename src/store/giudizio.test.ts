import { describe, expect, it, vi, beforeEach } from 'vitest';

// Il salvataggio su IndexedDB non serve qui: si prova solo la logica dello stato.
vi.mock('./db', async (orig) => ({ ...(await orig<typeof import('./db')>()), salvaChiave: vi.fn(async () => {}), salvaMeta: vi.fn(async () => {}) }));

import { RECUPERI_DEFAULT } from '../data/tabelle';
import { nuovoBlocco } from '../motore/generatore';
import { valutaRicalcolo } from '../motore/ricalcolo';
import type { ParametriGeneratore, Profilo } from '../tipi';
import { STATO_VUOTO } from './db';
import { aggiornaSerie, chiaveCorrente, iniziaSeduta, stato } from './stato';

// Giudizio "Facile / Giusto / Al limite" sull'ultima serie (SPEC_PIANIFICATORE §7.2): arriva dopo "Serie fatta",
// quindi cambiarlo deve rifare il ricalcolo del massimale (fondamentali) o togliere la proposta di +1 passo (gli altri).
const par: ParametriGeneratore = { N: 4, T: 60, priorita: [], esclusi: [], esperienza: 'intermedio', preset: 'uomo_base', bloccoBreve: false };
const profilo = {
  id: 'p', nome: 'Prova', sesso: 'M', parametri: par, creato: '2026-11-17', sostituzioni: {}, esercizi_personalizzati: [],
  impostazioni: { arrotondamento: 0.5, fattore_lavoro: 0.9, recuperi: RECUPERI_DEFAULT, suoni: true, vibrazione: true, notifiche: false, stripping: false, modalita_prova: true },
} as unknown as Profilo;

async function preparaSeduta() {
  const b = nuovoBlocco(par, profilo, 1);
  b.test = {};
  for (const s of b.sedute) for (const e of s.esercizi) b.test[e.esercizio_id] = { kg: 60, rip: 10, modo: 'stima', rm1: 90, data: '2026-11-01' } as never;
  stato.value = { ...STATO_VUOTO, profilo, blocco: b, registro: {} };
  const s = b.sedute.find((x) => x.fase !== 'test' && x.esercizi.some((e) => e.ruolo === 'R1') && x.esercizi.some((e) => e.ruolo === 'C'))!;
  await iniziaSeduta(s.id);
  return s;
}

/** Fa tutte le serie dell'esercizio; l'ultima con `kg` e le ripetizioni previste. */
async function faiTutte(sedutaId: string, slot: number, kgUltima?: number) {
  const serie = stato.value.registro[sedutaId].esercizi[slot].serie;
  for (const x of serie) {
    const ultima = x.n === serie[serie.length - 1].n;
    await aggiornaSerie(sedutaId, slot, x.n, { kg: ultima ? kgUltima : undefined, rip: x.rip_prev, fatta: true });
  }
  return serie[serie.length - 1];
}

describe('Giudizio dell\'ultima serie', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fondamentale: il giudizio dato dopo "Serie fatta" rifà il ricalcolo; cambiandolo torna il massimale giusto', async () => {
    const s = await preparaSeduta();
    const e = s.esercizi.find((x) => x.ruolo === 'R1')!;
    const prima = stato.value.registro[s.id].esercizi[e.slot].serie;
    const kg = (prima[prima.length - 1].kg_piano ?? prima[prima.length - 1].kg_prev) + 20;
    const ultima = await faiTutte(s.id, e.slot, kg);
    const rip = ultima.rip_prev;
    const atteso = (rir: number) => {
      const esito = valutaRicalcolo(90, kg, rip, rir);
      return esito.aggiorna ? esito.stima : 90;
    };
    const rm1 = () => stato.value.blocco!.test[e.esercizio_id].rm1;
    expect(rm1()).toBe(atteso(0));
    await aggiornaSerie(s.id, e.slot, ultima.n, { sforzo: 'facile' });
    expect(rm1()).toBe(atteso(2));
    expect(atteso(2)).toBeGreaterThan(atteso(1));
    expect(atteso(1)).toBeGreaterThan(atteso(0));
    expect(atteso(0)).toBeGreaterThan(90);
    await aggiornaSerie(s.id, e.slot, ultima.n, { sforzo: 'giusto' });
    expect(rm1()).toBe(atteso(1));
    await aggiornaSerie(s.id, e.slot, ultima.n, { sforzo: 'limite' });
    expect(rm1()).toBe(atteso(0));
  });

  it('fondamentale: senza ricalcolo valido, "Al limite" dopo "Facile" riporta il massimale e il carico scelto', async () => {
    const s = await preparaSeduta();
    const e = s.esercizi.find((x) => x.ruolo === 'R1')!;
    const prima = stato.value.registro[s.id].esercizi[e.slot].serie;
    const piano = prima[prima.length - 1].kg_piano ?? prima[prima.length - 1].kg_prev;
    // Un aumento piccolo: con 0 ripetizioni di riserva non basta, con 2 sì.
    let kg = piano + 0.5;
    while (valutaRicalcolo(90, kg, prima[0].rip_prev, 0).aggiorna || !valutaRicalcolo(90, kg, prima[0].rip_prev, 2).aggiorna) kg += 0.5;
    const ultima = await faiTutte(s.id, e.slot, kg);
    const rm1 = () => stato.value.blocco!.test[e.esercizio_id].rm1;
    expect(rm1()).toBe(90);
    await aggiornaSerie(s.id, e.slot, ultima.n, { sforzo: 'facile' });
    expect(rm1()).toBeGreaterThan(90);
    expect(stato.value.blocco!.carichiCorrenti?.[chiaveCorrente(e)]).toBeUndefined();
    await aggiornaSerie(s.id, e.slot, ultima.n, { sforzo: 'limite' });
    expect(rm1()).toBe(90);
    expect(stato.value.blocco!.carichiCorrenti?.[chiaveCorrente(e)]).toBeDefined();
  });

  it('complementare: "Facile" propone +1 passo, passare a "Giusto" toglie la proposta', async () => {
    const s = await preparaSeduta();
    const e = s.esercizi.find((x) => x.ruolo === 'C')!;
    const ultima = await faiTutte(s.id, e.slot);
    const chiave = chiaveCorrente(e);
    await aggiornaSerie(s.id, e.slot, ultima.n, { sforzo: 'facile' });
    const proposta = stato.value.blocco!.carichiCorrenti?.[chiave];
    expect(proposta?.origine).toBe('proposta');
    expect(proposta?.kg).toBeGreaterThan(ultima.kg_prev);
    await aggiornaSerie(s.id, e.slot, ultima.n, { sforzo: 'giusto' });
    expect(stato.value.blocco!.carichiCorrenti?.[chiave]).toBeUndefined();
    await aggiornaSerie(s.id, e.slot, ultima.n, { sforzo: 'facile' });
    expect(stato.value.blocco!.carichiCorrenti?.[chiave]?.origine).toBe('proposta');
  });
});
