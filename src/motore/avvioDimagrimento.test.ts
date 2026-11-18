import { describe, expect, it } from 'vitest';
import { RECUPERI_DEFAULT } from '../data/tabelle';
import { cambiaObiettivo, massimaliSalvati, nuovoBloccoPreservazione, serveRientro } from './moduli';
import { nuovoBlocco } from './generatore';
import { proponiPiano } from './pianificatore';
import { pianoDimagrimento } from './preservazione';
import type { CaricoProfilo, ParametriGeneratore, Profilo } from '../tipi';

// Regola di avvio del Dimagrimento (SPEC_PIANIFICATORE §4.3, soglie dell'utente del 18/11): subito in Preservazione solo
// con allenamento regolare da almeno 1 mese e massimali salvati; altrimenti Test + 3 cicli di Fase 1 del Blocco 1.
// La durata scelta comprende test e rientro (3 mesi = 13 settimane in tutto).
const par: ParametriGeneratore = { N: 4, T: 60, priorita: [], esclusi: [], esperienza: 'intermedio', preset: 'uomo_base', bloccoBreve: false };
const imp = { arrotondamento: 0.5 as const, fattore_lavoro: 0.9, recuperi: RECUPERI_DEFAULT, suoni: true, vibrazione: true, notifiche: false, stripping: false };
const profilo: Pick<Profilo, 'sostituzioni' | 'esercizi_personalizzati' | 'impostazioni'> = { sostituzioni: {}, esercizi_personalizzati: [], impostazioni: imp };
const oggi = new Date().toISOString();
const massimali: Record<string, CaricoProfilo> = {
  squat: { esercizio_id: 'squat', kg: 55, rip: 5, modo: 'stima', massimale: 62, data: oggi, origine: 'test' },
  panca_piana: { esercizio_id: 'panca_piana', kg: 75, rip: 5, modo: 'stima', massimale: 84.5, data: oggi, origine: 'test' },
  stacco_da_terra: { esercizio_id: 'stacco_da_terra', kg: 77.5, rip: 5, modo: 'stima', massimale: 87.5, data: oggi, origine: 'test' },
};
const ob = (regolare?: boolean) => ({ tipo: 'definizione' as const, dal: oggi, settimane: 13, energia: 'deficit' as const, regolare });

describe('Dimagrimento: regola di avvio', () => {
  it('pianoDimagrimento: 13 cicli totali; con rientro T + 3 + 9, senza T + 12, senza test 13', () => {
    expect(pianoDimagrimento(13, true, true)).toEqual({ test: true, rientro: 3, seq: [77, 82, 82, 82, 'S', 77, 82, 82, 'S'] });
    const senza = pianoDimagrimento(13, true, false);
    expect(senza.rientro).toBe(0);
    expect(senza.seq.length).toBe(12);
    expect(senza.seq.at(-1)).toBe('S');
    expect(pianoDimagrimento(13, false, false).seq.length).toBe(13);
    // Durata troppo corta per il rientro: resta la sola Preservazione.
    expect(pianoDimagrimento(6, true, true).rientro).toBe(0);
  });

  it('serveRientro: al primo avvio conta solo la regolarità; dopo servono regolarità e massimali salvati', () => {
    expect(serveRientro({ regolare: true }, {}, true)).toBe(false);
    expect(serveRientro({ regolare: false }, {}, true)).toBe(true);
    expect(serveRientro({ regolare: true }, massimali)).toBe(false);
    expect(serveRientro({}, massimali)).toBe(false); // assente = regolare
    expect(serveRientro({ regolare: false }, massimali)).toBe(true);
    const senzaStacco = { squat: massimali.squat, panca_piana: massimali.panca_piana };
    expect(massimaliSalvati(senzaStacco)).toBe(false);
    expect(serveRientro({ regolare: true }, senzaStacco)).toBe(true);
  });

  it('blocco con rientro: test e Fase 1 del Blocco 1, poi Preservazione sugli stessi esercizi; 13 settimane in tutto', () => {
    const b = nuovoBloccoPreservazione(par, { ...profilo, obiettivoAttivo: ob(false) }, 13, true, 1, false, true);
    expect(b.sedute.length).toBe(13 * 4);
    expect(b.stato).toBe('test');
    expect(b.tappe?.map((t) => [t.modulo, t.cicli])).toEqual([['test', 1], ['rientro', 3], ['preservazione', 9]]);
    const rientro = b.sedute.filter((s) => s.modulo === 'rientro');
    expect(rientro.length).toBe(12);
    expect(rientro.every((s) => s.fase === 'fase1' && s.bloccoRif === 1)).toBe(true);
    expect([...new Set(rientro.map((s) => s.rigaTabella))]).toEqual([1, 3, 5]);
    expect(b.sedute.slice(0, 4).every((s) => s.fase === 'test')).toBe(true);
    // Fase 1 del Blocco 1: la panca segue la tabella R1, non il 77 % fisso.
    const pancaR = rientro[0].esercizi.find((e) => e.esercizio_id === 'panca_piana' && e.ruolo === 'R1');
    expect(pancaR).toBeDefined();
    expect(pancaR?.percentuale).toBeUndefined();
    // Primo ciclo di Preservazione: fondamentali 3×5 @77 %.
    const primaP = b.sedute.find((s) => s.modulo === 'preservazione')!;
    expect(primaP.cicloTipo).toBe(77);
    const r1 = b.sedute.filter((s) => s.ciclo === primaP.ciclo).flatMap((s) => s.esercizi).filter((e) => e.ruolo === 'R1');
    expect(r1.length).toBeGreaterThan(0);
    expect(r1.every((e) => e.serie === 3 && e.rip === 5 && e.percentuale === 0.77)).toBe(true);
    // Un solo test copre tutti i carichi: ogni esercizio con carico è nelle sedute di test.
    const testati = new Set(b.sedute.filter((s) => s.fase === 'test').flatMap((s) => s.esercizi.map((e) => e.esercizio_id)));
    const usati = b.sedute.filter((s) => s.fase !== 'test').flatMap((s) => s.esercizi).filter((e) => !e.senza_carico && !e.eredita_da && !e.resistenza);
    expect([...new Set(usati.filter((e) => !testati.has(e.esercizio_id)).map((e) => e.esercizio_id))]).toEqual([]);
  });

  it('senza rientro: test dentro la durata e Preservazione sul Blocco 3 (13 settimane in tutto)', () => {
    const b = nuovoBloccoPreservazione(par, { ...profilo, obiettivoAttivo: ob(true) }, 13, true, 1);
    expect(b.sedute.length).toBe(13 * 4);
    expect(b.tappe?.map((t) => t.modulo)).toEqual(['test', 'preservazione']);
    expect(b.sedute.some((s) => s.modulo === 'rientro')).toBe(false);
  });

  it('cambio obiettivo: regolare con massimali → subito con ponte; non regolare → rientro (senza test se i carichi ci sono)', () => {
    const massa = nuovoBlocco(par, profilo, 1);
    for (const s of massa.sedute) if (s.ciclo <= 3) s.stato = 'completata';
    const tutti: Record<string, CaricoProfilo> = { ...massimali };
    for (const s of massa.sedute) for (const e of s.esercizi) if (!tutti[e.esercizio_id]) tutti[e.esercizio_id] = { esercizio_id: e.esercizio_id, kg: 20, rip: 10, modo: 'serie_unica', data: oggi, origine: 'test' };
    const p = { ...profilo, carichi: tutti, parametri: par };
    const subito = cambiaObiettivo(massa, p, ob(true)).nuovo;
    expect(subito.sedute[0].cicloTipo).toBe('ponte');
    expect(subito.sedute.some((s) => s.modulo === 'rientro')).toBe(false);
    const rientro = cambiaObiettivo(massa, p, ob(false)).nuovo;
    expect(rientro.sedute.some((s) => s.fase === 'test')).toBe(false);
    expect(rientro.sedute[0].modulo).toBe('rientro');
    expect(rientro.sedute.length).toBe(13 * 4);
    // Senza nessun carico: test + rientro.
    const vuoto = cambiaObiettivo(massa, { ...profilo, carichi: {}, parametri: par }, ob(true)).nuovo;
    expect(vuoto.sedute[0].fase).toBe('test');
    expect(vuoto.sedute[4].modulo).toBe('rientro');
  });

  it('anteprima: 3 mesi = 13 settimane in tutto, con le tappe e il perché del rientro', () => {
    const [con] = proponiPiano({ obiettivo: 'definizione', settimane: 13, N: 4, rientro: true });
    expect(con.settimane).toBe(13);
    expect(con.tappe?.map((t) => [t.modulo, t.cicli])).toEqual([['test', 1], ['rientro', 3], ['preservazione', 9]]);
    expect(con.perche).toContain('Fase 1 del Blocco 1');
    const [senza] = proponiPiano({ obiettivo: 'definizione', settimane: 13, N: 4 });
    expect(senza.settimane).toBe(13);
    expect(senza.tappe?.map((t) => [t.modulo, t.cicli])).toEqual([['test', 1], ['preservazione', 12]]);
  });
});
