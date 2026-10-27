// Motore dei carichi (SPEC §6). Funzioni pure, testate in carichi.test.ts.

/** Arrotonda al passo indicato (0,5 / 1 / 2,5 kg). Il mezzo passo va verso l'alto. */
export function arrotonda(kg: number, passo = 0.5): number {
  const r = Math.round(kg / passo + 1e-9) * passo;
  return Math.round(r * 100) / 100;
}

/** 1RM stimato con Brzycki: kg × 36 / (37 − rip). Con 3 rip equivale a kg / 0,944. */
export function rm1DaTest(kg: number, rip: number): number {
  if (rip < 1) throw new Error('Ripetizioni non valide');
  if (rip === 1) return kg;
  return (kg * 36) / (37 - rip);
}

/** Carico per n RM: 1RM × (37 − n) / 36, arrotondato. */
export function caricoRM(rm1: number, n: number, passo = 0.5): number {
  return arrotonda((rm1 * (37 - n)) / 36, passo);
}

/** Percentuale del 1RM corrispondente a n RM. */
export function percentualeRM(n: number): number {
  return (37 - n) / 36;
}

/** Il test a più di 10 ripetizioni dà una stima inaffidabile (SPEC §6.1). */
export function testAffidabile(rip: number): boolean {
  return rip >= 1 && rip <= 10;
}
