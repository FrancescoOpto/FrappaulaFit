import { describe, expect, it } from 'vitest';
import { BLOCCO2_4G } from '../data/blocco2';
import { ESERCIZI_PER_ID } from '../data/esercizi';
import { RECUPERI_DEFAULT } from '../data/tabelle';
import { contenitorePer } from '../data/contenitori';
import { eserciziDaTestare, generaSettimana, nuovoBlocco } from './generatore';
import { prescrizione } from './prescrizione';
import type { ParametriGeneratore, Profilo } from '../tipi';

// Blocco 2 dell'app di riferimento (BLOCCO2_programma.md): struttura, tabelle per slot, varianti per fase.
const par: ParametriGeneratore = { N: 4, T: 60, priorita: [], esclusi: [], esperienza: 'intermedio', preset: 'uomo_base', bloccoBreve: false };
const profilo: Pick<Profilo, 'sostituzioni' | 'esercizi_personalizzati' | 'impostazioni'> = {
  sostituzioni: {},
  esercizi_personalizzati: [],
  impostazioni: { arrotondamento: 0.5, fattore_lavoro: 0.9, recuperi: RECUPERI_DEFAULT, suoni: true, vibrazione: true, notifiche: false, stripping: false },
};

describe('Blocco 2 a 4 giorni (§A1): struttura', () => {
  it('tutti gli esercizi esistono in libreria, comprese le varianti', () => {
    for (const s of BLOCCO2_4G.sessioni) for (const slot of s.slot) {
      expect(ESERCIZI_PER_ID[slot.default], slot.default).toBeDefined();
      for (const v of Object.values(slot.varianti ?? {})) { const id = typeof v === 'string' ? v : v.id; expect(ESERCIZI_PER_ID[id], id).toBeDefined(); }
    }
  });
  it('9/8/9/8 esercizi; panca, squat, stacco una volta come R1; giorno C senza R1; nessun L', () => {
    expect(BLOCCO2_4G.sessioni.map((s) => s.slot.length)).toEqual([9, 8, 9, 8]);
    const r1 = BLOCCO2_4G.sessioni.map((s) => s.slot.filter((x) => x.ruolo === 'R1').map((x) => x.default));
    expect(r1).toEqual([['panca_piana'], ['squat'], [], ['stacco_da_terra']]);
    expect(BLOCCO2_4G.sessioni.flatMap((s) => s.slot).some((x) => x.ruolo === 'L')).toBe(false);
  });
  it('contenitorePer sceglie il Blocco 2 solo per uomo a 4 giorni nel blocco 2', () => {
    expect(contenitorePer(4, 'uomo_base', 2).id).toBe('b2u4');
    expect(contenitorePer(4, 'uomo_base', 1).id).toBe('b1u4');
    expect(contenitorePer(4, 'uomo_base', 3).id).toBe('u4');
    expect(contenitorePer(3, 'uomo_base', 2).id).toBe('u3');
    expect(contenitorePer(4, 'donna_glutei', 2).id).toBe('d4');
  });
  it('programma fisso: nessun taglio per tempo, esercizi intatti anche a 60 minuti', () => {
    const r = generaSettimana(par, profilo, 2);
    expect(r.contenitore.id).toBe('b2u4');
    expect(r.sessioni.map((s) => s.esercizi.length)).toEqual([9, 8, 9, 8]);
    expect(r.sessioni[0].esercizi[6].serie).toBe(4); // push down 4×10 non ridotto
  });
});

describe('Blocco 2: tabelle per slot e varianti per fase (§A2, §A4)', () => {
  const b = nuovoBlocco(par, profilo, 2);
  b.test = {
    panca_piana: { esercizio_id: 'panca_piana', kg: 80, rip: 4, modo: 'stima', rm1: 87.5 },
    squat: { esercizio_id: 'squat', kg: 50, rip: 5, modo: 'stima', rm1: 56.5 },
    stacco_da_terra: { esercizio_id: 'stacco_da_terra', kg: 80, rip: 5, modo: 'stima', rm1: 90 },
    military_press: { esercizio_id: 'military_press', kg: 22, rip: 10, modo: 'serie_unica' },
    panca_manubri: { esercizio_id: 'panca_manubri', kg: 26, rip: 10, modo: 'serie_unica' },
    spinte_manubri_seduto: { esercizio_id: 'spinte_manubri_seduto', kg: 20, rip: 10, modo: 'serie_unica' },
    push_down_corda: { esercizio_id: 'push_down_corda', kg: 35, rip: 12, modo: 'serie_unica' },
    croci_cavi: { esercizio_id: 'croci_cavi', kg: 20, rip: 12, modo: 'serie_unica' },
    curl_panca_inclinata: { esercizio_id: 'curl_panca_inclinata', kg: 10, rip: 12, modo: 'serie_unica' },
  };
  const seduta = (fase: string, cicloFase: number, giorno: number) => b.sedute.find((s) => s.fase === fase && s.cicloFase === cicloFase && s.giorno === giorno)!;
  const pr = (fase: string, c: number, g: number, id: string) => {
    const s = seduta(fase, c, g);
    const e = s.esercizi.find((x) => x.esercizio_id === id)!;
    const p = prescrizione(e, s, b.test, profilo.impostazioni);
    return `${p.serie}x${p.rip}@${p.kg}`;
  };

  it('68 sedute; W1 giorno A: panca 4x5@61.5, W13 4x5@65.5, W57 4x3@74.5, scarico 3x7@57', () => {
    expect(b.sedute.length).toBe(68);
    expect(pr('fase1', 1, 1, 'panca_piana')).toBe('4x5@61.5');
    expect(pr('fase1', 4, 1, 'panca_piana')).toBe('4x5@65.5');
    expect(pr('fase3', 5, 1, 'panca_piana')).toBe('4x3@74.5');
    expect(pr('scarico', 1, 1, 'panca_piana')).toBe('3x7@57');
  });
  it('giorno B: squat 39,5 → 48; military R3b 3x9@22 al ciclo 4 di F1, 4x10 al c5 di F2, scarico 3x10', () => {
    expect(pr('fase1', 1, 2, 'squat')).toBe('4x5@39.5');
    expect(pr('fase3', 5, 2, 'squat')).toBe('4x3@48');
    expect(pr('scarico', 1, 2, 'squat')).toBe('3x7@36.5');
    expect(pr('fase1', 4, 2, 'military_press')).toBe('3x9@22');
    expect(pr('fase2', 5, 2, 'military_press')).toBe('4x10@22');
    expect(pr('scarico', 1, 2, 'military_press')).toBe('3x10@22');
  });
  it('giorno C: spinte manubri R3c (F2 c5 3x10, scarico 2x10); giorno D: spinte seduto tabella R2, stacco 63 → 76,5', () => {
    expect(pr('fase2', 5, 3, 'panca_manubri')).toBe('3x10@26');
    expect(pr('scarico', 1, 3, 'panca_manubri')).toBe('2x10@26');
    expect(pr('fase1', 3, 4, 'spinte_manubri_seduto')).toBe('4x8@20');
    expect(pr('fase3', 5, 4, 'spinte_manubri_seduto')).toBe('3x6@20');
    expect(pr('fase1', 1, 4, 'stacco_da_terra')).toBe('4x5@63');
    expect(pr('fase3', 5, 4, 'stacco_da_terra')).toBe('4x3@76.5');
    expect(pr('scarico', 1, 4, 'stacco_da_terra')).toBe('3x7@58.5');
  });
  it('varianti: croci cavi (F1) → cavi alti (F2) → seduto (F3); scarico usa la Fase 2; push down torna in F3 con 3x12', () => {
    const slotCroci = (fase: string, c: number) => seduta(fase, c, 1).esercizi[2];
    expect(slotCroci('fase1', 1).esercizio_id).toBe('croci_cavi');
    expect(slotCroci('fase2', 1).esercizio_id).toBe('croci_cavi_alti');
    expect(slotCroci('fase3', 1).esercizio_id).toBe('croci_cavi_seduto');
    expect(slotCroci('scarico', 1).esercizio_id).toBe('croci_cavi_alti');
    expect(slotCroci('fase2', 1).eredita_da).toBe('croci_cavi');
    // Push down: slot 6 in F1 (4×10), slot 7 in F3 (3×12): serie×rip del nuovo slot.
    expect(pr('fase1', 1, 1, 'push_down_corda')).toBe('4x10@35');
    expect(pr('fase3', 1, 1, 'push_down_corda')).toBe('3x12@35');
    expect(pr('scarico', 1, 1, 'croci_cavi_alti')).toBe('2x10@20'); // −1 serie, carico ereditato
  });
  it('complementari invariati nelle 5 settimane di una fase; curl 45° 3x10 (F1, giorno B) → 3x12 in F3 nel nuovo slot', () => {
    expect([1, 3, 5].map((c) => pr('fase2', c, 2, 'curl_manubri'))).toEqual(['3x10@10', '3x10@10', '3x10@10']);
    expect(pr('fase1', 1, 2, 'curl_panca_inclinata')).toBe('3x10@10');
    expect(pr('fase3', 1, 2, 'curl_panca_inclinata')).toBe('3x12@10');
  });
  it('settimana di test: solo gli esercizi di Fase 1 (34 nel programma letto)', () => {
    const daTestare = eserciziDaTestare(b).map((e) => e.esercizio_id);
    expect(daTestare).not.toContain('croci_cavi_alti');
    expect(daTestare).toContain('croci_cavi');
    expect(daTestare.length).toBe(34);
  });
});
