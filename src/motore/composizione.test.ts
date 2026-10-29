import { describe, expect, it } from 'vitest';
import { componiMantenimento, componiMassa, compongoPiano, righeTabella, siglaComposizione, sommaCicli } from './composizione';

const sigla = (seg: { fase: string; cicli: number }[]) => siglaComposizione(seg.map((s) => ({ ...s, bloccoRif: 1 })) as never);

// SPEC_PIANIFICATORE v2 §6b e §12 "Piano su misura"
describe('componiMassa(R): cicli senza il Test', () => {
  it('R=3 → F1×3; R=7 → F1×3 F2×3 S (la spec scrive F1×4 ma la somma deve fare 7); R=10 → F1×5 F2×4 S; R=11 → F1×5 F2×5 S', () => {
    expect(sigla(componiMassa(3))).toBe('F1×3');
    expect(sigla(componiMassa(7))).toBe('F1×3 F2×3 S');
    expect(sigla(componiMassa(8))).toBe('F1×4 F2×3 S');
    expect(sigla(componiMassa(10))).toBe('F1×5 F2×4 S');
    expect(sigla(componiMassa(11))).toBe('F1×5 F2×5 S');
  });
  it('R=12 → F1×4 F2×4 S F3×3; R=16 → blocco intero F1×5 F2×5 S F3×5; R=17 aggiunge lo scarico di chiusura', () => {
    expect(sigla(componiMassa(12))).toBe('F1×4 F2×4 S F3×3');
    expect(sigla(componiMassa(16))).toBe('F1×5 F2×5 S F3×5');
    expect(sigla(componiMassa(17))).toBe('F1×5 F2×5 S F3×5 S');
  });
  it('fasi minime: F1 e F2 ≥ 2, F3 ≥ 3; la somma è sempre R fino a 16', () => {
    for (let R = 1; R <= 16; R++) {
      const seg = componiMassa(R);
      expect(sommaCicli(seg)).toBe(R);
      for (const s of seg) {
        if (s.fase === 'fase2') expect(s.cicli, `R=${R}`).toBeGreaterThanOrEqual(2);
        if (s.fase === 'fase3') expect(s.cicli, `R=${R}`).toBeGreaterThanOrEqual(3);
        if (s.fase === 'fase1' && R >= 6) expect(s.cicli, `R=${R}`).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe('compongoPiano(D, test, modulo): somma dei cicli = D', () => {
  const massa = (D: number, test = true) => siglaComposizione(compongoPiano(D, test, 'massa'));
  it('D=4 → T F1×3 · D=8 → T F1×3 F2×3 S · senza Test D=8 → F1×4 F2×3 S · D=12 → T F1×5 F2×5 S · D=13 → T F1×4 F2×4 S F3×3 · D=17 → blocco intero', () => {
    expect(massa(4)).toBe('T F1×3');
    expect(massa(8)).toBe('T F1×3 F2×3 S');
    expect(massa(8, false)).toBe('F1×4 F2×3 S');
    expect(massa(12)).toBe('T F1×5 F2×5 S');
    expect(massa(13)).toBe('T F1×4 F2×4 S F3×3');
    expect(massa(17)).toBe('T F1×5 F2×5 S F3×5');
  });
  it('D=18 aggiunge lo scarico di chiusura; D=20 → … S T B2 F1; D=26 → secondo blocco (Blocco 2) con Test dopo lo scarico', () => {
    expect(massa(18)).toBe('T F1×5 F2×5 S F3×5 S');
    const d20 = compongoPiano(20, true, 'massa');
    expect(siglaComposizione(d20)).toBe('T F1×5 F2×5 S F3×5 S T F1×1');
    expect(d20[d20.length - 1].bloccoRif).toBe(2);
    expect(d20[0].bloccoRif).toBe(1);
    const d26 = compongoPiano(26, true, 'massa');
    expect(siglaComposizione(d26)).toBe('T F1×5 F2×5 S F3×5 S T F1×3 F2×3 S');
    expect(d26.filter((s) => s.bloccoRif === 2).length).toBe(4);
    for (const D of [1, 2, 5, 9, 15, 19, 30, 51]) expect(sommaCicli(compongoPiano(D, true, 'massa')), `D=${D}`).toBe(D);
  });
  it('dopo il Blocco 3 si riparte dal Blocco 1 (D=60: blocchi 1, 2, 3, 1)', () => {
    const d60 = compongoPiano(60, true, 'massa');
    expect([...new Set(d60.map((s) => s.bloccoRif))]).toEqual([1, 2, 3, 1].filter((v, i, a) => a.indexOf(v) === i));
    expect(d60.filter((s) => s.fase === 'test').length).toBe(4);
    expect(sommaCicli(d60)).toBe(60);
  });
  it('Mantenimento: senza F3; dopo 11 cicli il blocco successivo (1 → 2) senza Test; base Blocco 2 selezionabile', () => {
    expect(siglaComposizione(compongoPiano(12, true, 'mantenimento'))).toBe('T F1×5 F2×5 S');
    expect(siglaComposizione(compongoPiano(6, false, 'mantenimento'))).toBe('F1×3 F2×2 S');
    const m = compongoPiano(20, true, 'mantenimento');
    expect(siglaComposizione(m)).toBe('T F1×5 F2×5 S F1×4 F2×3 S');
    expect(m.map((s) => s.bloccoRif)).toEqual([1, 1, 1, 1, 2, 2, 2]);
    expect(m.some((s) => s.fase === 'fase3')).toBe(false);
    expect(compongoPiano(12, true, 'mantenimento', 2)[0].bloccoRif).toBe(2);
    expect(sigla(componiMantenimento(3))).toBe('F1×3');
  });
});

describe('righeTabella(n): regola dei gradini per le fasi accorciate', () => {
  it('n=1 [1] · n=2 [1,5] · n=3 [1,3,5] · n=4 [1,2,4,5] · n=5 tutte · n=7 ripete la 5', () => {
    expect(righeTabella(1)).toEqual([1]);
    expect(righeTabella(2)).toEqual([1, 5]);
    expect(righeTabella(3)).toEqual([1, 3, 5]);
    expect(righeTabella(4)).toEqual([1, 2, 4, 5]);
    expect(righeTabella(5)).toEqual([1, 2, 3, 4, 5]);
    expect(righeTabella(7)).toEqual([1, 2, 3, 4, 5, 5, 5]);
  });
});
