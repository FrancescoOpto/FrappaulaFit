import { describe, expect, it } from 'vitest';
import { durataStimata, modoTest, prescrizione, ripetizioniTest, serieRip } from './prescrizione';
import { RECUPERI_DEFAULT } from '../data/tabelle';
import type { EsercizioSeduta, RisultatoTest } from '../tipi';

const imp = { arrotondamento: 0.5 as const, fattore_lavoro: 0.9 };
const panca: EsercizioSeduta = { slot: 0, esercizio_id: 'panca_piana', ruolo: 'R1', gruppo: 'petto' };
const pancaL: EsercizioSeduta = { slot: 0, esercizio_id: 'panca_piana', ruolo: 'L', gruppo: 'petto' };
const squat: EsercizioSeduta = { slot: 0, esercizio_id: 'squat', ruolo: 'R1', gruppo: 'gambe' };
const manubri: EsercizioSeduta = { slot: 1, esercizio_id: 'panca_manubri', ruolo: 'R2', gruppo: 'petto' };
const spinteAlto: EsercizioSeduta = { slot: 2, esercizio_id: 'spinte_manubri_seduto', ruolo: 'R3', gruppo: 'spalle' };
const crunch: EsercizioSeduta = { slot: 3, esercizio_id: 'crunch_cavo', ruolo: 'AB', gruppo: 'addome' };
const croci: EsercizioSeduta = { slot: 4, esercizio_id: 'croci_manubri', ruolo: 'C', gruppo: 'petto', serie: 3, rip: 10 };
const military: EsercizioSeduta = { slot: 5, esercizio_id: 'military_press', ruolo: 'R3', tabella: 'R3b', gruppo: 'spalle' };
const spinteC: EsercizioSeduta = { slot: 3, esercizio_id: 'panca_manubri', ruolo: 'R3', tabella: 'R3c', gruppo: 'petto' };

const test: Record<string, RisultatoTest> = {
  // Stime reali del Blocco 2: stacco 5×80 → 90 (×0,9 = 81, il 1RM di SPEC §6.4) e panca 4×80 → 87,5 (×0,9 = 78,75).
  panca_piana: { esercizio_id: 'panca_piana', kg: 80, rip: 5, modo: 'stima', rm1: 90 },
  squat: { esercizio_id: 'squat', kg: 80, rip: 4, modo: 'stima', rm1: 87.5 },
  military_press: { esercizio_id: 'military_press', kg: 22, rip: 10, modo: 'serie_unica' },
  panca_manubri: { esercizio_id: 'panca_manubri', kg: 26, rip: 10, modo: 'serie_unica' },
  spinte_manubri_seduto: { esercizio_id: 'spinte_manubri_seduto', kg: 16, rip: 10, modo: 'serie_unica' },
  crunch_cavo: { esercizio_id: 'crunch_cavo', kg: 30, rip: 14, modo: 'serie_unica' },
  croci_manubri: { esercizio_id: 'croci_manubri', kg: 12, rip: 12, modo: 'serie_unica' },
};

const p = (es: EsercizioSeduta, fase: 'fase1' | 'fase2' | 'fase3' | 'scarico', ciclo: number) =>
  prescrizione(es, { fase, cicloFase: ciclo }, test, imp);

const fmt = (es: EsercizioSeduta, fase: 'fase1' | 'fase2' | 'fase3' | 'scarico', ciclo: number) => {
  const r = p(es, fase, ciclo);
  return `${r.serie}x${r.rip}@${r.kg}`;
};

// Giorno A dell'app di riferimento (struttura_programma_vathlete.md), 1RM panca = 81.
describe('Giorno A — panca piana R1', () => {
  it('Fase 1: 4x5@63, 4x5@63, 4x6@63, 4x5@67.5, 4x5@67.5', () => {
    expect([1, 2, 3, 4, 5].map((c) => fmt(panca, 'fase1', c))).toEqual(['4x5@63', '4x5@63', '4x6@63', '4x5@67.5', '4x5@67.5']);
  });
  it('Fase 2: 3x6@67.5, 3x6@67.5, 4x6@67.5, 4x6@67.5, 3x7@67.5', () => {
    expect([1, 2, 3, 4, 5].map((c) => fmt(panca, 'fase2', c))).toEqual(['3x6@67.5', '3x6@67.5', '4x6@67.5', '4x6@67.5', '3x7@67.5']);
  });
  it('Scarico: 3x7@58.5', () => {
    expect(fmt(panca, 'scarico', 1)).toBe('3x7@58.5');
  });
  it('Fase 3: 3x5@72, 3x5@72, 4x5@72, 4x5@72, 4x3@76.5', () => {
    expect([1, 2, 3, 4, 5].map((c) => fmt(panca, 'fase3', c))).toEqual(['3x5@72', '3x5@72', '4x5@72', '4x5@72', '4x3@76.5']);
  });
});

describe('Giorno B — squat R1 (1RM 78,75)', () => {
  it('Fase 1: 61.5 → 65.5', () => {
    expect([1, 3, 4].map((c) => fmt(squat, 'fase1', c))).toEqual(['4x5@61.5', '4x6@61.5', '4x5@65.5']);
  });
  it('Fase 3: 70 → 74.5', () => {
    expect([2, 5].map((c) => fmt(squat, 'fase3', c))).toEqual(['3x5@70', '4x3@74.5']);
  });
  it('Scarico: 3x7@57', () => {
    expect(fmt(squat, 'scarico', 1)).toBe('3x7@57');
  });
});

describe('Fattore di lavoro 0,9 (blocco2_giorno_B.md §3)', () => {
  it('squat stima 56,5 → 9RM 39,5 · 7RM 42,5 · 5RM 45 · 3RM 48 · 11RM 36,5', () => {
    const t = { squat: { esercizio_id: 'squat', kg: 50, rip: 5, modo: 'stima' as const, rm1: 56.5 } };
    const kg = (fase: 'fase1' | 'fase2' | 'fase3' | 'scarico', c: number) => prescrizione(squat, { fase, cicloFase: c }, t, imp).kg;
    expect([kg('fase1', 1), kg('fase1', 4), kg('fase3', 1), kg('fase3', 5), kg('scarico', 1)]).toEqual([39.5, 42.5, 45, 48, 36.5]);
  });
  it('fattore 1 usa il massimale pieno; fattore mancante usa 0,9', () => {
    expect(prescrizione(panca, { fase: 'fase1', cicloFase: 1 }, test, { arrotondamento: 0.5, fattore_lavoro: 1 }).kg).toBe(70);
    expect(prescrizione(panca, { fase: 'fase1', cicloFase: 1 }, test, { arrotondamento: 0.5 }).kg).toBe(63);
  });
});

describe('Guida R3b — military press 22 kg (blocco2_giorno_B.md §2.4)', () => {
  it('F1 3×8,3×8,3×8,3×9,3×9 · F2 4×9,4×9,3×10,3×10,4×10 · F3 3×8,3×8,4×8,3×9,4×9 · scarico 3×10', () => {
    expect([1, 2, 3, 4, 5].map((c) => fmt(military, 'fase1', c))).toEqual(['3x8@22', '3x8@22', '3x8@22', '3x9@22', '3x9@22']);
    expect([1, 2, 3, 4, 5].map((c) => fmt(military, 'fase2', c))).toEqual(['4x9@22', '4x9@22', '3x10@22', '3x10@22', '4x10@22']);
    expect([1, 2, 3, 4, 5].map((c) => fmt(military, 'fase3', c))).toEqual(['3x8@22', '3x8@22', '4x8@22', '3x9@22', '4x9@22']);
    expect(fmt(military, 'scarico', 1)).toBe('3x10@22');
    expect(ripetizioniTest(military)).toBe(10);
  });
  it('R3c spinte manubri piana 26 kg (giorno C): F2 c5 3×10 e scarico 2×10', () => {
    expect([1, 2, 3, 4, 5].map((c) => fmt(spinteC, 'fase2', c))).toEqual(['4x9@26', '4x9@26', '3x10@26', '3x10@26', '3x10@26']);
    expect(fmt(spinteC, 'scarico', 1)).toBe('2x10@26');
    expect([1, 5].map((c) => fmt(spinteC, 'fase3', c))).toEqual(['3x8@26', '4x9@26']);
  });
  it('stacco stima 90 → 63 · 67,5 · 72 · 76,5 · 58,5 (giorno D, fattore 0,9)', () => {
    const t = { stacco_da_terra: { esercizio_id: 'stacco_da_terra', kg: 80, rip: 5, modo: 'stima' as const, rm1: 90 } };
    const stacco: EsercizioSeduta = { slot: 3, esercizio_id: 'stacco_da_terra', ruolo: 'R1', tabella: 'R1', gruppo: 'gambe' };
    const kg = (fase: 'fase1' | 'fase2' | 'fase3' | 'scarico', c: number) => prescrizione(stacco, { fase, cicloFase: c }, t, imp).kg;
    expect([kg('fase1', 1), kg('fase1', 4), kg('fase3', 1), kg('fase3', 5), kg('scarico', 1)]).toEqual([63, 67.5, 72, 76.5, 58.5]);
  });
  it('variante senza test eredita il carico dall\u2019esercizio di Fase 1 dello slot', () => {
    const v: EsercizioSeduta = { slot: 1, esercizio_id: 'croci_cavi_alti', ruolo: 'C', gruppo: 'petto', serie: 3, rip: 10, eredita_da: 'croci_manubri' };
    const r = prescrizione(v, { fase: 'fase2', cicloFase: 1 }, test, imp);
    expect(r.kg).toBe(12);
    expect(r.ereditatoDa).toBe('croci_manubri');
  });
});

describe('Panca in giorno C (fondamentale leggero L)', () => {
  it('Fase 1 11RM 58.5, Fase 2 9RM 63, Fase 3 c3 7RM 67.5, Scarico 13RM 54', () => {
    expect(fmt(pancaL, 'fase1', 3)).toBe('3x9@58.5');
    expect(fmt(pancaL, 'fase1', 5)).toBe('3x10@58.5');
    expect(fmt(pancaL, 'fase2', 1)).toBe('3x8@63');
    expect(fmt(pancaL, 'fase3', 1)).toBe('3x10@63');
    expect(fmt(pancaL, 'fase3', 3)).toBe('3x8@67.5');
    expect(fmt(pancaL, 'scarico', 1)).toBe('3x10@54');
  });
});

describe('Target R2/R3 a carico fisso', () => {
  it('R2 spinte manubri: F1 3x8→4x8, F2 3x9→4x9, F3 3x7,4x7,3x8,4x8,3x6, scarico 3x9', () => {
    expect([1, 2, 3, 4, 5].map((c) => fmt(manubri, 'fase1', c))).toEqual(['3x8@26', '3x8@26', '4x8@26', '4x8@26', '4x8@26']);
    expect([1, 3, 5].map((c) => fmt(manubri, 'fase2', c))).toEqual(['3x9@26', '4x9@26', '4x9@26']);
    expect([1, 2, 3, 4, 5].map((c) => fmt(manubri, 'fase3', c))).toEqual(['3x7@26', '4x7@26', '3x8@26', '4x8@26', '3x6@26']);
    expect(fmt(manubri, 'scarico', 1)).toBe('3x9@26');
  });
  it('R3 spinte in alto: F1 +1 serie a ciclo 4; F2 3x9…3x10; F3 3x8,4x8,4x8,3x9,3x10; scarico 2x10', () => {
    expect([1, 3, 4].map((c) => fmt(spinteAlto, 'fase1', c))).toEqual(['3x8@16', '3x8@16', '4x8@16']);
    expect([1, 3, 5].map((c) => fmt(spinteAlto, 'fase2', c))).toEqual(['3x9@16', '4x9@16', '3x10@16']);
    expect([1, 2, 3, 4, 5].map((c) => fmt(spinteAlto, 'fase3', c))).toEqual(['3x8@16', '4x8@16', '4x8@16', '3x9@16', '3x10@16']);
    expect(fmt(spinteAlto, 'scarico', 1)).toBe('2x10@16');
  });
  it('AB crunch: 3x12 fisso in F1, 3x13→3x15 in F2, scarico 3x15 (Blocco 2 giorno A), F3 3x12→3x14', () => {
    expect([1, 5].map((c) => fmt(crunch, 'fase1', c))).toEqual(['3x12@30', '3x12@30']);
    expect([1, 3, 5].map((c) => fmt(crunch, 'fase2', c))).toEqual(['3x13@30', '3x14@30', '3x15@30']);
    expect(fmt(crunch, 'scarico', 1)).toBe('3x15@30');
    expect([1, 3, 5].map((c) => fmt(crunch, 'fase3', c))).toEqual(['3x12@30', '3x13@30', '3x14@30']);
  });
  it('C: serie×rip dello slot invariati in F1–F3, serie−1 (min 2) in scarico', () => {
    expect(fmt(croci, 'fase1', 1)).toBe('3x10@12');
    expect(fmt(croci, 'fase2', 3)).toBe('3x10@12');
    expect(fmt(croci, 'fase3', 5)).toBe('3x10@12');
    expect(fmt(croci, 'scarico', 1)).toBe('2x10@12');
    expect(serieRip('C', 'scarico', 1, { serie: 2, rip: 12 })).toEqual([2, 12]);
    expect(serieRip('C', 'scarico', 1, { serie: 4, rip: 10 })).toEqual([3, 10]);
  });
});

describe('Carico corrente (SPEC §9.2b)', () => {
  it('fondamentale: fattore applicato a ogni scala; kgPiano resta quello del piano', () => {
    const c = { fattore: 1.036, aggiornato: '' };
    const w13 = prescrizione(panca, { fase: 'fase1', cicloFase: 4 }, test, imp, 0, [], c);
    expect(w13.kgPiano).toBe(67.5);
    expect(w13.kg).toBe(70);
    expect(prescrizione(panca, { fase: 'fase1', cicloFase: 1 }, test, imp, 0, [], c).kg).toBe(65.5);
  });
  it('carico fisso: il kg corrente sostituisce il test', () => {
    const r = prescrizione(manubri, { fase: 'fase2', cicloFase: 1 }, test, imp, 0, [], { kg: 30, aggiornato: '' });
    expect(r.kgPiano).toBe(26);
    expect(r.kg).toBe(30);
    expect(r.rip).toBe(9);
  });
});

describe('Autocorrezione e casi limite', () => {
  it('correzione −2,5% sul 1RM', () => {
    const r = prescrizione(panca, { fase: 'fase1', cicloFase: 1 }, test, imp, -0.025);
    expect(r.kg).toBe(61.5);
  });
  it('senza test il carico è undefined ma serie×rip restano', () => {
    const r = prescrizione(panca, { fase: 'fase1', cicloFase: 1 }, {}, imp);
    expect(r.kg).toBeUndefined();
    expect(r.serie).toBe(4);
  });
  it('fase di test (TEST_INIZIO_BLOCCO): stima per i fondamentali, serie unica N = rip Fase 1 + 2 per gli altri', () => {
    expect(prescrizione(panca, { fase: 'test', cicloFase: 1 }, {}, imp).modoTest).toBe('stima');
    expect(prescrizione(manubri, { fase: 'test', cicloFase: 1 }, {}, imp)).toMatchObject({ modoTest: 'serie_unica', rip: 10 }); // R2 3×8 → 10
    expect(prescrizione(spinteAlto, { fase: 'test', cicloFase: 1 }, {}, imp).rip).toBe(10); // R3 3×8 → 10
    expect(prescrizione(croci, { fase: 'test', cicloFase: 1 }, {}, imp).rip).toBe(12); // C 3×10 → 12
    expect(prescrizione({ ...croci, rip: 12 }, { fase: 'test', cicloFase: 1 }, {}, imp).rip).toBe(14); // C 3×12 → 14
    expect(prescrizione(crunch, { fase: 'test', cicloFase: 1 }, {}, imp).rip).toBe(14); // AB 3×12 → 14
    const military: EsercizioSeduta = { slot: 5, esercizio_id: 'military_press', ruolo: 'R2', gruppo: 'spalle' };
    expect(modoTest(military)).toBe('serie_unica');
    expect(modoTest(military, ['military_press'])).toBe('stima');
    expect(ripetizioniTest({ ...croci, rip: 15 })).toBe(14);
  });
});

describe('durataStimata', () => {
  it('riscaldamento + serie × (45 + recupero); superserie condividono il recupero', () => {
    const d = durataStimata([{ ruolo: 'R1', serie: 4 }], RECUPERI_DEFAULT);
    expect(d).toBe(480 + 4 * (45 + 150));
    const ss = durataStimata(
      [
        { ruolo: 'C', serie: 3, superserie: 'braccia' },
        { ruolo: 'C', serie: 3, superserie: 'braccia' },
      ],
      RECUPERI_DEFAULT,
    );
    expect(ss).toBe(480 + 3 * (45 + 90) + 3 * 45);
  });
});
