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

/**
 * Stima del massimale dal test di inizio blocco (TEST_INIZIO_BLOCCO §2.1): Brzycki arrotondato al passo.
 * Ripetizioni valide 1–12 (oltre, la formula perde senso avvicinandosi a 37).
 */
export function stimaMassimale(reps: number, carico: number, passo = 0.5): number {
  if (!Number.isFinite(reps) || reps < 1 || reps > 12) throw new Error('Le ripetizioni devono essere tra 1 e 12');
  if (!Number.isFinite(carico) || carico <= 0) throw new Error('Carico non valido');
  return arrotonda(rm1DaTest(carico, reps), passo);
}

/** Percentuale del 1RM corrispondente a n RM. */
export function percentualeRM(n: number): number {
  return (37 - n) / 36;
}

/** Il test a più di 10 ripetizioni dà una stima inaffidabile (SPEC §6.1). */
export function testAffidabile(rip: number): boolean {
  return rip >= 1 && rip <= 10;
}
