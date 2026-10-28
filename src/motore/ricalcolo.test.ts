import { describe, expect, it } from 'vitest';
import { stimaDaSerie, valutaRicalcolo } from './ricalcolo';

// SPEC_PIANIFICATORE §12.9
describe('ricalcolo del massimale', () => {
  it('panca vigente 101,5: 5×85 → 95,6 (nessun aggiornamento); 5×95 → 106,9 (≥ +2,5 %: aggiorna)', () => {
    const a = valutaRicalcolo(101.5, 85, 5);
    expect(a.stima).toBeCloseTo(95.6, 1);
    expect(a.aggiorna).toBe(false);
    const b = valutaRicalcolo(101.5, 95, 5);
    expect(b.stima).toBeCloseTo(106.9, 1);
    expect(b.aggiorna).toBe(true);
  });
  it('il RIR dichiarato conta come ripetizioni in più; senza vigente si aggiorna sempre', () => {
    expect(stimaDaSerie(85, 5, 2)).toBeCloseTo(stimaDaSerie(85, 7), 5);
    expect(valutaRicalcolo(undefined, 80, 5).aggiorna).toBe(true);
    expect(valutaRicalcolo(100, 0, 5).aggiorna).toBe(false);
  });
});
