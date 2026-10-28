import { describe, expect, it } from 'vitest';
import { BLOCCO3_4G } from '../data/blocco3';
import { ESERCIZI_PER_ID } from '../data/esercizi';
import { RECUPERI_DEFAULT } from '../data/tabelle';
import { eserciziDaTestare, nuovoBlocco } from './generatore';
import { prescrizione, ripetizioniTest } from './prescrizione';
import type { ParametriGeneratore, Profilo } from '../tipi';

// Blocco 3 dell'app di riferimento (BLOCCO3_programma.md): percentuali piatte, Target 3×8, righe ×12, rest-pause.
const par: ParametriGeneratore = { N: 4, T: 60, priorita: [], esclusi: [], esperienza: 'intermedio', preset: 'uomo_base', bloccoBreve: false };
const profilo: Pick<Profilo, 'sostituzioni' | 'esercizi_personalizzati' | 'impostazioni'> = {
  sostituzioni: {},
  esercizi_personalizzati: [],
  impostazioni: { arrotondamento: 0.5, fattore_lavoro: 0.9, recuperi: RECUPERI_DEFAULT, suoni: true, vibrazione: true, notifiche: false, stripping: false },
};

const b = nuovoBlocco(par, profilo, 3);
b.test = {
  squat: { esercizio_id: 'squat', kg: 80, rip: 5, modo: 'stima', rm1: 90 },
  panca_piana: { esercizio_id: 'panca_piana', kg: 90, rip: 5, modo: 'stima', rm1: 101.5 },
  stacco_da_terra: { esercizio_id: 'stacco_da_terra', kg: 90, rip: 5, modo: 'stima', rm1: 101.5 },
  spinte_manubri_seduto: { esercizio_id: 'spinte_manubri_seduto', kg: 20, rip: 10, modo: 'serie_unica' },
  lat_triangolo: { esercizio_id: 'lat_triangolo', kg: 70, rip: 10, modo: 'serie_unica' },
  panca_multipower: { esercizio_id: 'panca_multipower', kg: 40, rip: 12, modo: 'serie_unica' },
  push_down_barra: { esercizio_id: 'push_down_barra', kg: 40, rip: 14, modo: 'serie_unica' },
  leg_extension: { esercizio_id: 'leg_extension', kg: 60, rip: 12, modo: 'serie_unica' },
  crunch_cavo: { esercizio_id: 'crunch_cavo', kg: 40, rip: 14, modo: 'serie_unica' },
  curl_panca_inclinata: { esercizio_id: 'curl_panca_inclinata', kg: 12, rip: 14, modo: 'serie_unica' },
};
const seduta = (fase: string, c: number, g: number) => b.sedute.find((s) => s.fase === fase && s.cicloFase === c && s.giorno === g)!;
const righe = (fase: string, c: number, g: number, id: string) => seduta(fase, c, g).esercizi.filter((x) => x.esercizio_id === id);
const pr = (fase: string, c: number, g: number, id: string, quale = 0) => {
  const s = seduta(fase, c, g);
  const e = righe(fase, c, g, id)[quale];
  const p = prescrizione(e, s, b.test, profilo.impostazioni);
  return `${p.serie}x${p.rip}@${p.kg}`;
};

describe('Blocco 3: struttura (§A1)', () => {
  it('esercizi e varianti in libreria; 10/8/11/9 esercizi in Fase 1; nessun L; squat R1 in B, panca e stacco R1 in D, A e C senza fondamentale', () => {
    for (const s of BLOCCO3_4G.sessioni) for (const slot of s.slot) {
      expect(ESERCIZI_PER_ID[slot.default], slot.default).toBeDefined();
      for (const v of Object.values(slot.varianti ?? {})) { const id = typeof v === 'string' ? v : v.id; expect(ESERCIZI_PER_ID[id], id).toBeDefined(); }
    }
    expect([1, 2, 3, 4].map((g) => seduta('fase1', 1, g).esercizi.length)).toEqual([10, 8, 11, 9]);
    expect(b.sedute.flatMap((s) => s.esercizi).some((e) => e.ruolo === 'L')).toBe(false);
    const r1 = (g: number) => seduta('fase1', 1, g).esercizi.filter((e) => e.ruolo === 'R1').map((e) => e.esercizio_id);
    expect([r1(1), r1(2), r1(3), r1(4)]).toEqual([[], ['squat'], [], ['panca_piana', 'stacco_da_terra']]);
    expect(b.contenitore_id).toBe('b3u4');
  });
});

describe('Blocco 3: carichi dei fondamentali a percentuale (§A2)', () => {
  it('squat 1RM 90 → 3x5@69.5 · 3x4@74 · 3x3@78.5 · scarico 3x4@69.5 (piatti dentro la fase)', () => {
    expect([1, 3, 5].map((c) => pr('fase1', c, 2, 'squat'))).toEqual(['3x5@69.5', '3x5@69.5', '3x5@69.5']);
    expect(pr('fase2', 5, 2, 'squat')).toBe('3x4@74');
    expect(pr('fase3', 1, 2, 'squat')).toBe('3x3@78.5');
    expect(pr('scarico', 1, 2, 'squat')).toBe('3x4@69.5');
  });
  it('panca e stacco 1RM 101,5 → 78 / 83 / 88,5, scarico 78', () => {
    expect(pr('fase1', 1, 4, 'panca_piana')).toBe('3x5@78');
    expect(pr('fase2', 1, 4, 'panca_piana')).toBe('3x4@83');
    expect(pr('fase3', 1, 4, 'panca_piana')).toBe('3x3@88.5');
    expect(pr('scarico', 1, 4, 'stacco_da_terra')).toBe('3x4@78');
    expect(pr('fase3', 5, 4, 'stacco_da_terra')).toBe('3x3@88.5');
  });
});

describe('Blocco 3: Target, seconda riga ×12, rest-pause, scarico (§A3–A5)', () => {
  it('spinte alto B3_T8: 3x8@20 → 3x9 → 3x7 (W41–49) → 3x8 (W53); scarico 3x9 (override del giorno A); lat triangolo scarico 2x9', () => {
    expect(pr('fase1', 1, 1, 'spinte_manubri_seduto')).toBe('3x8@20');
    expect(pr('fase2', 3, 1, 'spinte_manubri_seduto')).toBe('3x9@20');
    expect(pr('fase3', 3, 1, 'spinte_manubri_seduto')).toBe('3x7@20');
    expect(pr('fase3', 4, 1, 'spinte_manubri_seduto')).toBe('3x8@20');
    expect(pr('scarico', 1, 1, 'spinte_manubri_seduto')).toBe('3x9@20');
    expect(pr('scarico', 1, 1, 'lat_triangolo')).toBe('2x9@70');
  });
  it('seconda riga ×12: 1x12 nelle settimane 1–2, 2x12 dalla 3, senza carico; assente nello scarico e nel test', () => {
    expect(righe('fase1', 1, 1, 'spinte_manubri_seduto').length).toBe(2);
    expect(pr('fase1', 1, 1, 'spinte_manubri_seduto', 1)).toBe('1x12@undefined');
    expect(pr('fase1', 3, 1, 'spinte_manubri_seduto', 1)).toBe('2x12@undefined');
    expect(pr('fase3', 5, 1, 'spinte_manubri_seduto', 1)).toBe('2x12@undefined');
    expect(righe('scarico', 1, 1, 'spinte_manubri_seduto').length).toBe(1);
    expect(righe('test', 1, 1, 'spinte_manubri_seduto').length).toBe(1);
    // Lat media a serie singola (giorno C): 1x10 in Fase 1, 1x12 in Fase 2, sparisce in scarico.
    expect(pr('fase1', 1, 3, 'lat_machine', 1)).toBe('1x10@undefined');
    expect(pr('fase2', 1, 3, 'lat_machine', 1)).toBe('1x12@undefined');
    expect(righe('scarico', 1, 3, 'lat_machine').length).toBe(1);
  });
  it('panca MP B3_T10: 3x10@40 → 3x11 → 3x8, scarico 2x11; test a 12 rip con nota multipower', () => {
    expect(pr('fase1', 2, 2, 'panca_multipower')).toBe('3x10@40');
    expect(pr('fase2', 2, 2, 'panca_multipower')).toBe('3x11@40');
    expect(pr('fase3', 2, 2, 'panca_multipower')).toBe('3x8@40');
    expect(pr('scarico', 1, 2, 'panca_multipower')).toBe('2x11@40');
    expect(ESERCIZI_PER_ID.panca_multipower.esclude_bilanciere).toBe(true);
    expect(ripetizioniTest(righe('fase1', 1, 2, 'panca_multipower')[0])).toBe(12);
  });
  it('rest-pause: push down barra 1x40@40 (test 14) → French corda alto 1x40 in F2 → scarico 2x12; leg extension 1x10 "10+3" in F2 → scarico 2x10', () => {
    const pd = righe('fase1', 1, 1, 'push_down_barra')[0];
    expect(pd.rest_pause).toBe('totale');
    expect(pr('fase1', 1, 1, 'push_down_barra')).toBe('1x40@40');
    expect(ripetizioniTest(pd)).toBe(14);
    const f2 = righe('fase2', 1, 1, 'french_corda_alto')[0];
    expect(f2.rest_pause).toBe('totale');
    expect(pr('fase2', 1, 1, 'french_corda_alto')).toBe('1x40@40'); // eredita da push down barra
    expect(pr('scarico', 1, 1, 'french_corda_alto')).toBe('2x12@40');
    expect(righe('scarico', 1, 1, 'french_corda_alto')[0].rest_pause).toBeUndefined();
    expect(pr('fase1', 1, 2, 'leg_extension')).toBe('3x10@60');
    const le = righe('fase2', 1, 2, 'leg_extension')[0];
    expect(le.rest_pause).toBe('10_piu_3');
    expect(pr('fase2', 1, 2, 'leg_extension')).toBe('1x10@60');
    expect(pr('scarico', 1, 2, 'leg_extension')).toBe('2x10@60');
    expect(pr('fase3', 1, 2, 'leg_extension')).toBe('3x10@60');
  });
  it('slot presenti solo da una fase: affondi assenti in Fase 1 e nel test, 2x8 in Fase 2 e scarico, leg press in Fase 3', () => {
    expect(righe('fase1', 1, 2, 'affondi_multipower').length).toBe(0);
    expect(righe('test', 1, 2, 'affondi_multipower').length).toBe(0);
    expect(righe('fase2', 1, 2, 'affondi_multipower')[0].serie).toBe(2);
    expect(righe('scarico', 1, 2, 'affondi_multipower')[0].serie).toBe(2);
    expect(righe('fase3', 1, 2, 'pressa').length).toBe(1);
  });
  it('crunch giorno C (AB_C): Fase 3 13,13,14,14,15; giorno A (AB) 12,12,13,13,14; scarico 3x15', () => {
    expect([1, 3, 5].map((c) => pr('fase3', c, 3, 'crunch_cavo'))).toEqual(['3x13@40', '3x14@40', '3x15@40']);
    expect([1, 3, 5].map((c) => righe('fase3', c, 1, 'crunch_hyperextension').map((e) => prescrizione(e, seduta('fase3', c, 1), b.test, profilo.impostazioni).rip)[0])).toEqual([12, 13, 14]);
    expect(pr('scarico', 1, 3, 'crunch_cavo')).toBe('3x15@40');
  });
  it('settimana di test: esercizi di Fase 1 senza le seconde righe (33)', () => {
    const ids = eserciziDaTestare(b).map((e) => e.esercizio_id);
    expect(ids.length).toBe(33);
    expect(ids.filter((x) => x === 'spinte_manubri_seduto').length).toBe(1);
    expect(ids).toContain('push_down_barra');
    expect(ids).not.toContain('affondi_multipower');
  });
});
