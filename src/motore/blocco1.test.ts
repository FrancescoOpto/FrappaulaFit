import { describe, expect, it } from 'vitest';
import { BLOCCO1_4G } from '../data/blocco1';
import { ESERCIZI_PER_ID } from '../data/esercizi';
import { RECUPERI_DEFAULT } from '../data/tabelle';
import { nuovoBlocco } from './generatore';
import { prescrizione } from './prescrizione';
import { stimaMassimale } from './carichi';
import type { ParametriGeneratore, Profilo } from '../tipi';

// Blocco 1 dell'app di riferimento (struttura_programma_vathlete.md, BLOCCO1_verifica.md): giorni A–D, fattore di lavoro 0,9
// come nel Blocco 2 (SPEC §6.2). Primo gruppo di test: massimali 90 e 87,5 (carichi = quelli dei video di struttura).
// Secondo gruppo: massimali reali dell'utente (panca 5×75, squat 5×55, stacco 4×80).
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
    // Con il fattore 0,9 i carichi dei video di struttura (63 → 67,5 → 72 → 76,5, scarico 58,5) vengono da massimali
    // 90 (panca) e 87,5 (squat): 0,9 × 90 = 81, 0,9 × 87,5 = 78,75 (i "1RM di lavoro" dedotti in struttura_programma_vathlete.md).
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
  it('giorno D: T-bar R2 (3x8@10 → 4x8, scarico 3x9); squat L 11RM 57 (F1 c1 3x8, tabella L corretta il 29/10) → 9RM 61.5 → 7RM 65.5, scarico 13RM 52.5', () => {
    expect(pr('fase1', 1, 4, 't_bar')).toBe('3x8@10');
    expect(pr('fase1', 3, 4, 't_bar')).toBe('4x8@10');
    expect(pr('scarico', 1, 4, 't_bar')).toBe('3x9@10');
    expect(pr('fase1', 1, 4, 'squat')).toBe('3x8@57');
    expect(pr('fase2', 1, 4, 'squat')).toBe('3x8@61.5');
    expect(pr('fase3', 3, 4, 'squat')).toBe('3x8@65.5');
    expect(pr('scarico', 1, 4, 'squat')).toBe('3x10@52.5');
  });
});

describe('Blocco 1 con i massimali reali dell’utente (BLOCCO1_verifica.md, 29/10), fattore 0,9, passo 0,5', () => {
  const imp = { arrotondamento: 0.5 as const, fattore_lavoro: 0.9 };
  const b = nuovoBlocco(par, profilo, 1);
  // Stime di Brzycki dalla funzione del test, non scritte a mano.
  const panca = stimaMassimale(5, 75);
  const squat = stimaMassimale(5, 55);
  const stacco = stimaMassimale(4, 80);
  // Target e complementari: carico del test, invariato in tutte le fasi.
  // [Ipotesi] "crunch 45/40": 45 al crunch al cavo (giorno A), 40 al crunch su hyperextension (giorno C).
  b.test = {
    panca_piana: { esercizio_id: 'panca_piana', kg: 75, rip: 5, modo: 'stima', rm1: panca },
    squat: { esercizio_id: 'squat', kg: 55, rip: 5, modo: 'stima', rm1: squat },
    stacco_da_terra: { esercizio_id: 'stacco_da_terra', kg: 80, rip: 4, modo: 'stima', rm1: stacco },
    panca_manubri: { esercizio_id: 'panca_manubri', kg: 24, rip: 10, modo: 'serie_unica' },
    spinte_manubri_seduto: { esercizio_id: 'spinte_manubri_seduto', kg: 18, rip: 10, modo: 'serie_unica' },
    military_press: { esercizio_id: 'military_press', kg: 30, rip: 10, modo: 'serie_unica' },
    alzate_laterali: { esercizio_id: 'alzate_laterali', kg: 10, rip: 12, modo: 'serie_unica' },
    stacco_rumeno: { esercizio_id: 'stacco_rumeno', kg: 20, rip: 10, modo: 'serie_unica' },
    lat_machine: { esercizio_id: 'lat_machine', kg: 60, rip: 10, modo: 'serie_unica' },
    t_bar: { esercizio_id: 't_bar', kg: 40, rip: 10, modo: 'serie_unica' },
    curl_ez: { esercizio_id: 'curl_ez', kg: 20, rip: 12, modo: 'serie_unica' },
    crunch_cavo: { esercizio_id: 'crunch_cavo', kg: 45, rip: 14, modo: 'serie_unica' },
    crunch_hyperextension: { esercizio_id: 'crunch_hyperextension', kg: 40, rip: 14, modo: 'serie_unica' },
  };
  const seduta = (fase: string, c: number, g: number) => b.sedute.find((s) => s.fase === fase && s.cicloFase === c && s.giorno === g)!;
  const pr = (fase: string, c: number, g: number, id: string) => {
    const s = seduta(fase, c, g);
    const e = s.esercizi.find((x) => x.esercizio_id === id)!;
    const p = prescrizione(e, s, b.test, imp);
    return `${p.serie}x${p.rip}@${p.kg}`;
  };
  const fase = (f: string, cicli: number[], g: number, id: string) => cicli.map((c) => pr(f, c, g, id));

  it('stime del test: panca 5×75 → 84,5; squat 5×55 → 62; stacco 4×80 → 87,5', () => {
    expect([panca, squat, stacco]).toEqual([84.5, 62, 87.5]);
  });

  it('panca giorno A (R1): F1 59 (c1–3) e 63,5 (c4–5), F2 63,5, scarico 55, F3 67,5 (c1–4) e 72 (c5)', () => {
    expect(fase('fase1', [1, 2, 3, 4, 5], 1, 'panca_piana')).toEqual(['4x5@59', '4x5@59', '4x6@59', '4x5@63.5', '4x5@63.5']);
    expect(fase('fase2', [1, 2, 3, 4, 5], 1, 'panca_piana')).toEqual(['3x6@63.5', '3x6@63.5', '4x6@63.5', '4x6@63.5', '3x7@63.5']);
    expect(pr('scarico', 1, 1, 'panca_piana')).toBe('3x7@55');
    expect(fase('fase3', [1, 2, 3, 4, 5], 1, 'panca_piana')).toEqual(['3x5@67.5', '3x5@67.5', '4x5@67.5', '4x5@67.5', '4x3@72']);
  });

  it('squat giorno B (R1): 43,5 / 46,5 · F2 46,5 · scarico 40,5 · F3 49,5 / 52,5', () => {
    expect(fase('fase1', [1, 3, 4, 5], 2, 'squat')).toEqual(['4x5@43.5', '4x6@43.5', '4x5@46.5', '4x5@46.5']);
    // Fase 2 ciclo 3 (4×6@46,5) non letto nei video: presunto dal pattern.
    expect(fase('fase2', [1, 3, 5], 2, 'squat')).toEqual(['3x6@46.5', '4x6@46.5', '3x7@46.5']);
    expect(pr('scarico', 1, 2, 'squat')).toBe('3x7@40.5');
    expect(fase('fase3', [1, 4, 5], 2, 'squat')).toEqual(['3x5@49.5', '4x5@49.5', '4x3@52.5']);
  });

  it('stacco giorno D (R1): 61,5 / 65,5 · F2 65,5 · scarico 57 · F3 70 / 74,5', () => {
    expect(fase('fase1', [1, 3, 4], 4, 'stacco_da_terra')).toEqual(['4x5@61.5', '4x6@61.5', '4x5@65.5']);
    expect(fase('fase2', [1, 5], 4, 'stacco_da_terra')).toEqual(['3x6@65.5', '3x7@65.5']);
    expect(pr('scarico', 1, 4, 'stacco_da_terra')).toBe('3x7@57');
    expect(fase('fase3', [1, 4, 5], 4, 'stacco_da_terra')).toEqual(['3x5@70', '4x5@70', '4x3@74.5']);
  });

  it('panca giorno C (L): F1 55 (3×8, 3×8, 3×9, 3×9, 3×10) · F2 59 · scarico 50,5 (3×10) · F3 59 c1–2 (3×10), 63,5 c3–5 (3×8)', () => {
    // Ciclo 2 di Fase 1 non letto nei video: presunto uguale al ciclo 1.
    expect(fase('fase1', [1, 2, 3, 4, 5], 3, 'panca_piana')).toEqual(['3x8@55', '3x8@55', '3x9@55', '3x9@55', '3x10@55']);
    expect(fase('fase2', [1, 2, 3, 4, 5], 3, 'panca_piana')).toEqual(['3x8@59', '3x8@59', '3x8@59', '3x9@59', '3x10@59']);
    expect(pr('scarico', 1, 3, 'panca_piana')).toBe('3x10@50.5');
    expect(fase('fase3', [1, 2, 3, 4, 5], 3, 'panca_piana')).toEqual(['3x10@59', '3x10@59', '3x8@63.5', '3x8@63.5', '3x8@63.5']);
  });

  it('squat giorno D (L): F1 40,5 · F2 43,5 · scarico 37 · F3 43,5 c1–2, 46,5 c3–5 (stesse serie×rip della panca C)', () => {
    expect(fase('fase1', [1, 3, 5], 4, 'squat')).toEqual(['3x8@40.5', '3x9@40.5', '3x10@40.5']);
    expect(fase('fase2', [1, 4], 4, 'squat')).toEqual(['3x8@43.5', '3x9@43.5']);
    expect(pr('scarico', 1, 4, 'squat')).toBe('3x10@37');
    expect(fase('fase3', [1, 2, 3, 5], 4, 'squat')).toEqual(['3x10@43.5', '3x10@43.5', '3x8@46.5', '3x8@46.5']);
  });

  it('Target e complementari: carico del test invariato in tutte le fasi', () => {
    const tutte = (g: number, id: string, kg: number) => {
      for (const [f, c] of [['fase1', 1], ['fase1', 5], ['fase2', 3], ['scarico', 1], ['fase3', 5]] as const) {
        const s = seduta(f, c, g);
        const e = s.esercizi.find((x) => x.esercizio_id === id);
        if (!e) continue;
        expect(prescrizione(e, s, b.test, imp).kg, `${id} ${f} c${c}`).toBe(kg);
      }
    };
    expect(pr('fase1', 1, 1, 'panca_manubri')).toBe('3x8@24'); // 10RM → Fase 1 3×8
    tutte(1, 'panca_manubri', 24);
    tutte(1, 'spinte_manubri_seduto', 18);
    tutte(3, 'military_press', 30);
    expect(pr('fase1', 1, 1, 'alzate_laterali')).toBe('3x10@10'); // complementare 12RM → 3×10
    expect(pr('fase1', 1, 3, 'alzate_laterali')).toBe('3x10@10');
    tutte(1, 'alzate_laterali', 10);
    tutte(2, 'stacco_rumeno', 20);
    tutte(2, 'lat_machine', 60);
    tutte(4, 't_bar', 40);
    expect(pr('fase1', 1, 3, 'curl_ez')).toBe('4x10@20'); // 12RM → 4×10
    expect(pr('fase1', 1, 1, 'crunch_cavo')).toBe('3x12@45'); // 14RM → 3×12
    expect(pr('fase1', 1, 3, 'crunch_hyperextension')).toBe('3x12@40');
    tutte(1, 'crunch_cavo', 45);
    tutte(3, 'crunch_hyperextension', 40);
  });
});
