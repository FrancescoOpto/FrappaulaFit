import { describe, expect, it } from 'vitest';
import { arrotonda, caricoRM, rm1DaTest } from './carichi';

// Casi di verifica SPEC §6.4: dati reali del Blocco 1 dell'app di riferimento.
describe('caricoRM (Brzycki) — SPEC §6.4', () => {
  it('panca 1RM 81', () => {
    expect(caricoRM(81, 9)).toBe(63);
    expect(caricoRM(81, 7)).toBe(67.5);
    expect(caricoRM(81, 5)).toBe(72);
    expect(caricoRM(81, 3)).toBe(76.5);
    expect(caricoRM(81, 11)).toBe(58.5);
    expect(caricoRM(81, 13)).toBe(54);
  });

  it('squat 1RM 78,75', () => {
    expect(caricoRM(78.75, 9)).toBe(61.5);
    expect(caricoRM(78.75, 7)).toBe(65.5);
    expect(caricoRM(78.75, 5)).toBe(70);
    expect(caricoRM(78.75, 3)).toBe(74.5);
    expect(caricoRM(78.75, 11)).toBe(57);
  });

  it('stacco 1RM ≈ 58,8 (giorno D)', () => {
    expect(caricoRM(58.8, 9)).toBe(45.5);
    expect(caricoRM(59, 9)).toBe(46);
    expect(caricoRM(59, 7)).toBe(49);
    expect(caricoRM(59, 5)).toBe(52.5);
    expect(caricoRM(59, 3)).toBe(55.5);
  });

  it('arrotondamento configurabile', () => {
    expect(caricoRM(81, 9, 1)).toBe(63);
    expect(caricoRM(81, 7, 2.5)).toBe(67.5);
    expect(caricoRM(81, 5, 2.5)).toBe(72.5);
    expect(caricoRM(81, 3, 1)).toBe(77);
  });
});

describe('rm1DaTest', () => {
  it('panca 3 rip × 97,5 kg → 1RM ≈ 103,2 (dato reale utente)', () => {
    expect(rm1DaTest(97.5, 3)).toBeCloseTo(103.24, 1);
    expect(rm1DaTest(97.5, 3)).toBeCloseTo(97.5 / 0.944, 0);
  });
  it('1 rip = 1RM', () => {
    expect(rm1DaTest(100, 1)).toBe(100);
  });
  it('round trip 3RM → 1RM → 3RM', () => {
    const rm1 = rm1DaTest(76.5, 3);
    expect(caricoRM(rm1, 3)).toBe(76.5);
  });
});

describe('arrotonda', () => {
  it('mezzo passo verso l’alto', () => {
    expect(arrotonda(61.25, 0.5)).toBe(61.5);
    expect(arrotonda(65.625, 0.5)).toBe(65.5);
    expect(arrotonda(74.375, 0.5)).toBe(74.5);
    expect(arrotonda(56.875, 0.5)).toBe(57);
  });
});
