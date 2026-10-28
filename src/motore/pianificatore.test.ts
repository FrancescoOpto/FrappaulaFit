import { describe, expect, it } from 'vitest';
import { bloccoAccorciato, opzioniPiano, SETTIMANE_BLOCCO, settimaneTra } from './pianificatore';

describe('pianificatore a obiettivo (SPEC §15, ipotesi)', () => {
  it('un blocco completo dura 17 settimane', () => {
    expect(SETTIMANE_BLOCCO).toBe(17);
  });
  it('settimane tra due date', () => {
    expect(settimaneTra(new Date('2026-11-02'), new Date('2027-06-01'))).toBe(30);
  });
  it('30 settimane → 1 blocco completo + accorciato da 12 (test 1 + 5 + 5 + scarico), 1 settimana libera', () => {
    const o = opzioniPiano(new Date('2026-11-02'), new Date('2027-06-01'));
    expect(o[0].id).toBe('completi');
    expect(o[0].blocchi.length).toBe(1);
    expect(o[1].id).toBe('completi_piu_breve');
    expect(o[1].nostraScelta).toBe(true);
    expect(o[1].blocchi[1].cicli).toEqual({ test: 1, fase1: 5, fase2: 5, scarico: 1 });
    expect(o[1].settimane).toBe(29);
  });
  it('accorciato: sotto 6 settimane nulla, massimo 12 cicli', () => {
    expect(bloccoAccorciato(5)).toBeNull();
    expect(bloccoAccorciato(6)).toEqual({ test: 1, fase1: 2, fase2: 2, scarico: 1 });
    expect(bloccoAccorciato(20)).toEqual({ test: 1, fase1: 5, fase2: 5, scarico: 1 });
  });
  it('meno di 6 settimane → unica opzione di avviso', () => {
    const o = opzioniPiano(new Date('2026-11-02'), new Date('2026-12-01'));
    expect(o.length).toBe(1);
    expect(o[0].id).toBe('troppo_poco');
  });
});
