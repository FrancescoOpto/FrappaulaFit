import { describe, expect, it } from 'vitest';
import { bmr, bmrKatch, calorieObiettivo, macro, stimeTdee, tdeeRegolaLibro } from './energia';

// SPEC_PIANIFICATORE v2 §12.1–12.3
describe('energia: BMR e TDEE con passi e allenamenti (§3.1, §12.1)', () => {
  const uomo = { sesso: 'M' as const, pesoKg: 80, altezzaCm: 180, eta: 30, allenamentiSettimana: 4, durataMin: 60 };
  it('uomo 80 kg, 180 cm, 30 anni: BMR 1780; 4.000 passi → 2461, 8.000 → 2593, 12.000 → 2724 (±1)', () => {
    expect(bmr('M', 80, 180, 30)).toBe(1780);
    expect(Math.abs(stimeTdee({ ...uomo, passiGiorno: 4000 }).modello - 2461)).toBeLessThanOrEqual(1);
    expect(Math.abs(stimeTdee({ ...uomo, passiGiorno: 8000 }).modello - 2593)).toBeLessThanOrEqual(1);
    expect(Math.abs(stimeTdee({ ...uomo, passiGiorno: 12000 }).modello - 2724)).toBeLessThanOrEqual(1);
    expect(tdeeRegolaLibro('M', 80)).toEqual([2560, 2720]);
  });
  it('donna 55 kg, 165 cm, 30 anni, 8.000 passi, 4 sedute → BMR 1270, TDEE 1824 (±1)', () => {
    expect(Math.abs(bmr('F', 55, 165, 30) - 1270)).toBeLessThanOrEqual(1);
    expect(Math.abs(stimeTdee({ sesso: 'F', pesoKg: 55, altezzaCm: 165, eta: 30, passiGiorno: 8000, allenamentiSettimana: 4, durataMin: 60 }).modello - 1824)).toBeLessThanOrEqual(1);
  });
  it('il TDEE misurato prevale sul modello; senza passi dichiarati si usano 8.000', () => {
    expect(stimeTdee({ ...uomo, passiGiorno: 8000, tdeeEmpirico: 2800 }).partenza).toBe(2800);
    expect(stimeTdee({ ...uomo, passiGiorno: 8000 }).partenza).toBe(stimeTdee({ ...uomo }).modello);
  });
  it('con la % di grasso il BMR è Katch-McArdle (370 + 21,6 × massa magra)', () => {
    expect(bmrKatch(80, 15)).toBe(Math.round(370 + 21.6 * 68));
    expect(stimeTdee({ ...uomo, bfPct: 15 }).bmr).toBe(bmrKatch(80, 15));
    expect(stimeTdee({ ...uomo, bfPct: 20 }).avvisoLibro).toBeDefined();
  });
});

describe('energia: deficit da obiettivo (§12.2)', () => {
  // TDEE 2759 (come negli esempi di §12.2): con 2593 il taglio da 880 finirebbe sotto il BMR e scatterebbe il pavimento.
  const base = { obiettivo: 'definizione' as const, sesso: 'M' as const, pesoKg: 80, tdee: 2759, bmr: 1780 };
  it('−2 kg in 4 settimane → 550 kcal/die (0,625 %/sett, entro il tetto)', () => {
    const r = calorieObiettivo({ ...base, kgTarget: 2, settimane: 4 });
    expect(r.delta).toBe(550);
    expect(r.kcal).toBe(2759 - 550);
    expect(r.ritmoPct).toBeCloseTo(-0.625, 2);
    expect(r.durataMinima).toBeUndefined();
  });
  it('−6 kg in 4 settimane → richiesti 1650; tetto 1 % → 880 kcal/die, durata minima 8 settimane', () => {
    const r = calorieObiettivo({ ...base, kgTarget: 6, settimane: 4 });
    expect(r.delta).toBe(880);
    expect(r.durataMinima).toBe(8);
    expect(r.note[0]).toMatch(/1650/);
  });
  it('deficit base 500 (uomo) / 350 (donna); pavimento al BMR; tetto 0,5 % se magri', () => {
    expect(calorieObiettivo(base).delta).toBe(500);
    expect(calorieObiettivo({ ...base, sesso: 'F' }).delta).toBe(350);
    expect(calorieObiettivo({ ...base, tdee: 2000 }).kcal).toBe(1780);
    expect(calorieObiettivo({ ...base, bfPct: 9, kgTarget: 6, settimane: 4 }).tettoPct).toBe(0.005);
  });
  it('mantenimento = TDEE; massa = surplus per livello', () => {
    expect(calorieObiettivo({ ...base, obiettivo: 'mantenimento' }).kcal).toBe(2759);
    expect(calorieObiettivo({ ...base, obiettivo: 'massa', esperienza: 'principiante' }).kcal).toBe(2759 + 400);
    // Pavimento al BMR: con TDEE 2593 il taglio di 880 si ferma a 1780 kcal.
    expect(calorieObiettivo({ ...base, tdee: 2593, kgTarget: 6, settimane: 4 }).kcal).toBe(1780);
    expect(calorieObiettivo({ ...base, obiettivo: 'massa', esperienza: 'avanzato' }).delta).toBe(-150);
  });
});

describe('energia: macro (§12.3)', () => {
  it('dimagrimento, 80 kg, TDEE 2593 − 500 = 2093 kcal → P 160 g, G 64 g, CHO ≈ 219 g', () => {
    const m = macro('definizione', 80, 2093);
    expect(m.proteine).toBe(160);
    expect(m.grassi).toBe(64);
    expect(m.carboidrati).toBe(219);
  });
  it('massa 80 kg: 1,8 g/kg proteine, 1,0 grassi', () => {
    const m = macro('massa', 80, 3000);
    expect(m.proteine).toBe(144);
    expect(m.grassi).toBe(80);
  });
});
