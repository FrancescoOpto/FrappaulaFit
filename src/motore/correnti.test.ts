import { describe, expect, it } from 'vitest';
import { applicaCorrente, nuovoCaricoCorrente } from './correnti';

// SPEC §9.2b: test di acceptance (a) e (b) a livello di motore.
describe('carichi correnti (SPEC §9.2b)', () => {
  it('(b) carico fisso: il kg inserito sostituisce il carico base nelle sedute future', () => {
    const c = nuovoCaricoCorrente('R2', 30, 28, 's5');
    expect(c?.kg).toBe(30);
    expect(applicaCorrente('R2', 28, c, 0.5)).toBe(30);
    expect(applicaCorrente('C', undefined, c, 0.5)).toBe(30);
  });
  it('inserire esattamente il piano riporta al piano (nessun carico corrente)', () => {
    expect(nuovoCaricoCorrente('R2', 28, 28)).toBeUndefined();
    expect(nuovoCaricoCorrente('R1', 63, 63)).toBeUndefined();
  });
  it('(a) fondamentale: 70 → 72,5 in W9 salva il fattore; W13 con scala più alta (7RM 73,5) mostra 73,5 × fattore', () => {
    const c = nuovoCaricoCorrente('R1', 72.5, 70, 's9');
    expect(c?.fattore).toBeCloseTo(1.036, 3);
    expect(applicaCorrente('R1', 70, c, 0.5)).toBe(72.5);
    // Scala che sale: il piano passa a 73,5, il corrente segue in proporzione.
    expect(applicaCorrente('R1', 73.5, c, 0.5)).toBe(76);
  });
  it('senza carico corrente si usa il piano; senza piano si usa il kg salvato', () => {
    expect(applicaCorrente('R1', 63, undefined, 0.5)).toBe(63);
    expect(applicaCorrente('R1', undefined, { kg: 50, aggiornato: '' }, 0.5)).toBe(50);
    expect(nuovoCaricoCorrente('R1', 50, undefined)?.kg).toBe(50);
  });
  it('valori non validi non creano un carico corrente', () => {
    expect(nuovoCaricoCorrente('C', NaN, 20)).toBeUndefined();
    expect(nuovoCaricoCorrente('C', -1, 20)).toBeUndefined();
  });
});
