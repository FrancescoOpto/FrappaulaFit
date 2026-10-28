import { describe, expect, it } from 'vitest';
import { BLOCCO1_4G } from '../data/blocco1';
import { ESERCIZI_PER_ID } from '../data/esercizi';
import { RECUPERI_DEFAULT } from '../data/tabelle';
import { nuovoBlocco } from './generatore';
import { prescrizione } from './prescrizione';
import type { ParametriGeneratore, Profilo } from '../tipi';

// Blocco 1 dell'app di riferimento (struttura_programma_vathlete.md): giorni A–D, 1RM di lavoro panca 81 (stima 90), squat 78,75 (stima 87,5).
const par: ParametriGeneratore = { N: 4, T: 60, priorita: [], esclusi: [], esperienza: 'intermedio', preset: 'uomo_base', bloccoBreve: false };
const profilo: Pick<Profilo, 'sostituzioni' | 'esercizi_personalizzati' | 'impostazioni'> = {
  sostituzioni: {},
  esercizi_personalizzati: [],
  impostazioni: { arrotondamento: 0.5, fattore_lavoro: 0.9, recuperi: RECUPERI_DEFAULT, suoni: true, vibrazione: true, notifiche: false, stripping: false },
};

describe('Blocco 1 a 4 giorni: struttura', () => {
  it('esercizi e varianti esistono; 8 esercizi per giorno; panca R1 in A e L in C, squat R1 in B e L in D, stacco R1 in D', () => {
    for (const s of BLOCCO1_4G.sessioni) for (const slot of s.slot) {
      expect(ESERCIZI_PER_ID[slot.default], slot.default).toBeDefined();
      for (const v of Object.values(slot.varianti ?? {})) { const id = typeof v === 'string' ? v : v.id; expect(ESERCIZI_PER_ID[id], id).toBeDefined(); }
    }
    expect(BLOCCO1_4G.sessioni.map((s) => s.slot.length)).toEqual([8, 8, 8, 8]);
    const ruoli = (i: number, r: string) => BLOCCO1_4G.sessioni[i].slot.filter((x) => x.ruolo === r).map((x) => x.default);
    expect(ruoli(0, 'R1')).toEqual(['panca_piana']);
    expect(ruoli(2, 'L')).toEqual(['panca_piana']);
    expect(ruoli(1, 'R1')).toEqual(['squat']);
    expect(ruoli(3, 'L')).toEqual(['squat']);
    expect(ruoli(3, 'R1')).toEqual(['stacco_da_terra']);
  });
});

describe('Blocco 1: carichi e tabelle dei video', () => {
  const b = nuovoBlocco(par, profilo, 1);
  b.test = {
    panca_piana: { esercizio_id: 'panca_piana', kg: 80, rip: 5, modo: 'stima', rm1: 90 },
    squat: { esercizio_id: 'squat', kg: 80, rip: 4, modo: 'stima', rm1: 87.5 },
    panca_manubri: { esercizio_id: 'panca_manubri', kg: 26, rip: 10, modo: 'serie_unica' },
    spinte_manubri_seduto: { esercizio_id: 'spinte_manubri_seduto', kg: 16, rip: 10, modo: 'serie_unica' },
    military_press: { esercizio_id: 'military_press', kg: 20, rip: 10, modo: 'serie_unica' },
    alzate_laterali: { esercizio_id: 'alzate_laterali', kg: 10, rip: 12, modo: 'serie_unica' },
    leg_extension: { esercizio_id: 'leg_extension', kg: 50, rip: 12, modo: 'serie_unica' },
    t_bar: { esercizio_id: 't_bar', kg: 10, rip: 10, modo: 'serie_unica' },
    crunch_cavo: { esercizio_id: 'crunch_cavo', kg: 30, rip: 14, modo: 'serie_unica' },
  };
  const seduta = (fase: string, c: number, g: number) => b.sedute.find((s) => s.fase === fase && s.cicloFase === c && s.giorno === g)!;
  const pr = (fase: string, c: number, g: number, id: string) => {
    const s = seduta(fase, c, g);
    const e = s.esercizi.find((x) => x.esercizio_id === id)!;
    const p = prescrizione(e, s, b.test, profilo.impostazioni);
    return `${p.serie}x${p.rip}@${p.kg}`;
  };

  it('giorno A: panca 4x5@63 → 4x5@67.5 (c4) → F2 3x7@67.5 (c5) → F3 4x3@76.5; spinte 3x8@26; spinte alto R3 4x8@16 al c4; crunch 3x12@30', () => {
    expect(pr('fase1', 1, 1, 'panca_piana')).toBe('4x5@63');
    expect(pr('fase1', 3, 1, 'panca_piana')).toBe('4x6@63');
    expect(pr('fase1', 4, 1, 'panca_piana')).toBe('4x5@67.5');
    expect(pr('fase2', 5, 1, 'panca_piana')).toBe('3x7@67.5');
    expect(pr('fase3', 5, 1, 'panca_piana')).toBe('4x3@76.5');
    expect(pr('scarico', 1, 1, 'panca_piana')).toBe('3x7@58.5');
    expect(pr('fase1', 3, 1, 'panca_manubri')).toBe('4x8@26');
    expect(pr('fase1', 3, 1, 'spinte_manubri_seduto')).toBe('3x8@16');
    expect(pr('fase1', 4, 1, 'spinte_manubri_seduto')).toBe('4x8@16');
    expect(pr('fase2', 5, 1, 'spinte_manubri_seduto')).toBe('3x10@16');
    expect(pr('fase1', 1, 1, 'crunch_cavo')).toBe('3x12@30');
    expect(pr('scarico', 1, 1, 'spinte_manubri_seduto')).toBe('2x10@16');
  });
  it('giorno B: squat 61.5 → 65.5 → 70 → 74.5, scarico 57; leg extension 3x10 → leg press 3x8 (F2) → affondi 3x8 (F3)', () => {
    expect(pr('fase1', 1, 2, 'squat')).toBe('4x5@61.5');
    expect(pr('fase1', 4, 2, 'squat')).toBe('4x5@65.5');
    expect(pr('fase3', 1, 2, 'squat')).toBe('3x5@70');
    expect(pr('fase3', 5, 2, 'squat')).toBe('4x3@74.5');
    expect(pr('scarico', 1, 2, 'squat')).toBe('3x7@57');
    expect(pr('fase1', 1, 2, 'leg_extension')).toBe('3x10@50');
    expect(pr('fase2', 1, 2, 'pressa')).toBe('3x8@50');
    expect(pr('fase3', 1, 2, 'affondi_multipower')).toBe('3x8@50');
    expect(pr('scarico', 1, 2, 'pressa')).toBe('2x8@50');
  });
  it('giorno C: panca L 3x9@58.5 (F1 c3) → 3x8@63 (F2) → 3x8@67.5 (F3 c3) → scarico 3x10@54; military R2 (scarico 3x9@20); alzate R3d', () => {
    expect(pr('fase1', 3, 3, 'panca_piana')).toBe('3x9@58.5');
    expect(pr('fase1', 5, 3, 'panca_piana')).toBe('3x10@58.5');
    expect(pr('fase2', 1, 3, 'panca_piana')).toBe('3x8@63');
    expect(pr('fase3', 1, 3, 'panca_piana')).toBe('3x10@63');
    expect(pr('fase3', 3, 3, 'panca_piana')).toBe('3x8@67.5');
    expect(pr('scarico', 1, 3, 'panca_piana')).toBe('3x10@54');
    expect(pr('fase1', 3, 3, 'military_press')).toBe('4x8@20');
    expect(pr('fase3', 5, 3, 'military_press')).toBe('3x6@20');
    expect(pr('scarico', 1, 3, 'military_press')).toBe('3x9@20');
    expect([1, 4].map((c) => pr('fase1', c, 3, 'alzate_laterali'))).toEqual(['3x10@10', '4x10@10']);
    expect([1, 3, 4].map((c) => pr('fase2', c, 3, 'alzate_laterali'))).toEqual(['3x11@10', '4x11@10', '3x12@10']);
    expect([1, 3, 5].map((c) => pr('fase3', c, 3, 'alzate_laterali'))).toEqual(['3x8@10', '4x8@10', '4x9@10']);
    expect(pr('scarico', 1, 3, 'alzate_laterali')).toBe('2x12@10');
  });
  it('giorno D: T-bar R2 (3x8@10 → 4x8, scarico 3x9); squat L 11RM 57 → 9RM 61.5 → 7RM 65.5, scarico 13RM 52.5', () => {
    expect(pr('fase1', 1, 4, 't_bar')).toBe('3x8@10');
    expect(pr('fase1', 3, 4, 't_bar')).toBe('4x8@10');
    expect(pr('scarico', 1, 4, 't_bar')).toBe('3x9@10');
    expect(pr('fase1', 1, 4, 'squat')).toBe('3x9@57');
    expect(pr('fase2', 1, 4, 'squat')).toBe('3x8@61.5');
    expect(pr('fase3', 3, 4, 'squat')).toBe('3x8@65.5');
    expect(pr('scarico', 1, 4, 'squat')).toBe('3x10@52.5');
  });
});
