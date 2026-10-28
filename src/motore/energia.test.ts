import { describe, expect, it } from 'vitest';
import { bmr, calorieObiettivo, macro, stimeTdee, tdeeRegolaLibro } from './energia';

// SPEC_PIANIFICATORE §12.1–12.3
describe('energia: BMR e TDEE (§12.1)', () => {
  it('uomo 80 kg, 180 cm, 30 anni → BMR 1780, TDEE ×1,55 = 2759, regola del libro 2560–2720', () => {
    expect(bmr('M', 80, 180, 30)).toBe(1780);
    const s = stimeTdee('M', 80, 180, 30, 'moderato');
    expect(s.formula).toBe(2759);
    expect(tdeeRegolaLibro('M', 80)).toEqual([2560, 2720]);
    expect(s.partenza).toBe(Math.round((2759 + 2640) / 2));
    expect(stimeTdee('M', 80, 180, 30, 'moderato', undefined, 2800).partenza).toBe(2800);
  });
  it('donna 55 kg, 165 cm, 30 anni → BMR 1270 (±1)', () => {
    expect(Math.abs(bmr('F', 55, 165, 30) - 1270)).toBeLessThanOrEqual(1);
  });
});

describe('energia: deficit da obiettivo (§12.2)', () => {
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
    expect(calorieObiettivo({ ...base, obiettivo: 'massa', esperienza: 'avanzato' }).delta).toBe(-150);
  });
});

describe('energia: macro (§12.3)', () => {
  it('dimagrimento, 80 kg, 2259 kcal → P 160 g, G 64 g, CHO 260,75 g', () => {
    const m = macro('definizione', 80, 2259);
    expect(m.proteine).toBe(160);
    expect(m.grassi).toBe(64);
    expect(m.carboidrati).toBe(260.75);
  });
  it('massa 80 kg: 1,8 g/kg proteine, 1,0 grassi', () => {
    const m = macro('massa', 80, 3000);
    expect(m.proteine).toBe(144);
    expect(m.grassi).toBe(80);
  });
});
