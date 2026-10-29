import { describe, expect, it } from 'vitest';
import { RECUPERI_DEFAULT } from '../data/tabelle';
import { ESERCIZI_PER_ID } from '../data/esercizi';
import { compongoPiano } from './composizione';
import { applicaIntensitaEPriorita, generaSettimana, nuovoBloccoComposto, rigeneraSeduteFuture } from './generatore';
import { nuovoBloccoIpertrofia } from './moduli';
import { prescrizione } from './prescrizione';
import type { EsercizioSeduta, ParametriGeneratore, Profilo } from '../tipi';

// SPEC_PIANIFICATORE v2 §6b/§6c: blocco composto per durata, righe di tabella, intensità, priorità, tecniche, libreria.
const par: ParametriGeneratore = { N: 4, T: 60, priorita: [], esclusi: [], esperienza: 'intermedio', preset: 'uomo_base', bloccoBreve: false };
const imp = { arrotondamento: 0.5 as const, fattore_lavoro: 0.9, recuperi: RECUPERI_DEFAULT, suoni: true, vibrazione: true, notifiche: false, stripping: false };
const profilo: Pick<Profilo, 'sostituzioni' | 'esercizi_personalizzati' | 'impostazioni'> = { sostituzioni: {}, esercizi_personalizzati: [], impostazioni: imp };

describe('blocco composto per durata (§6b)', () => {
  it('D=13 con Test → 52 sedute: T, F1×4 (righe 1,2,4,5), F2×4, S, F3×3 (righe 1,3,5); tutte sul Blocco 1', () => {
    const b = nuovoBloccoComposto(par, profilo, compongoPiano(13, true, 'massa'), 1);
    expect(b.sedute.length).toBe(52);
    expect(b.stato).toBe('test');
    const f1 = b.sedute.filter((s) => s.fase === 'fase1' && s.giorno === 1);
    expect(f1.map((s) => s.rigaTabella)).toEqual([1, 2, 4, 5]);
    expect(f1.map((s) => s.cicloFase)).toEqual([1, 2, 3, 4]);
    const f3 = b.sedute.filter((s) => s.fase === 'fase3' && s.giorno === 1);
    expect(f3.map((s) => s.rigaTabella)).toEqual([1, 3, 5]);
    expect(b.sedute.every((s) => s.bloccoRif === 1)).toBe(true);
    expect(b.sedute.map((s) => s.numero)).toEqual(b.sedute.map((_, i) => i + 1));
  });

  it('la riga di tabella decide serie×rip e scala RM: F1×3 sul Blocco 1 (panca R1) → 4x5 @9RM, 4x6 (riga 3), 4x5 @7RM (riga 5)', () => {
    const b = nuovoBloccoComposto(par, profilo, compongoPiano(4, true, 'massa'), 1);
    b.test.panca_piana = { esercizio_id: 'panca_piana', kg: 72, rip: 5, modo: 'stima', rm1: 81 };
    const sed = b.sedute.filter((s) => s.fase === 'fase1' && s.giorno === 1);
    const pr = sed.map((s) => { const e = s.esercizi.find((x) => x.esercizio_id === 'panca_piana')!; const p = prescrizione(e, s, b.test, imp); return `${p.serie}x${p.rip}@${p.kg}`; });
    // Blocco 1 senza fattore 0,9 (§4.2): 9RM di 81 = 63, 7RM = 67,5.
    expect(pr).toEqual(['4x5@63', '4x6@63', '4x5@67.5']);
  });

  it('D=20: dopo il blocco intero scarico di chiusura, nuovo Test e Blocco 2 (sedute con bloccoRif 2); il Test a metà piano riporta lo stato a "test"', () => {
    const b = nuovoBloccoIpertrofia(par, profilo, 'massa', true, 1, false, 20);
    expect(b.sedute.length).toBe(80);
    const test = b.sedute.filter((s) => s.fase === 'test');
    expect(test.length).toBe(8);
    expect(test.slice(4).every((s) => s.bloccoRif === 2)).toBe(true);
    expect(b.sedute.filter((s) => s.bloccoRif === 2).length).toBe(8);
    expect(b.sedute.filter((s) => s.fase === 'scarico').length).toBe(8);
    expect(b.tappe?.map((t) => t.fase)).toEqual(['test', 'fase1', 'fase2', 'scarico', 'fase3', 'scarico', 'test', 'fase1']);
    // Il secondo Test usa gli esercizi del Blocco 2 (contenitore b2u4).
    expect(test[4].esercizi.map((e) => e.esercizio_id)).not.toEqual(test[0].esercizi.map((e) => e.esercizio_id));
  });

  it('Mantenimento D=12: T F1×5 F2×5 S sul Blocco 1, senza Fase 3; base Blocco 2 selezionabile', () => {
    const b = nuovoBloccoIpertrofia(par, profilo, 'mantenimento', true, 1, false, 12);
    expect(b.sedute.length).toBe(48);
    expect(b.sedute.some((s) => s.fase === 'fase3')).toBe(false);
    expect(b.modulo).toBe('mantenimento');
    const b2 = nuovoBloccoIpertrofia({ ...par, bloccoBase: 2 }, profilo, 'mantenimento', true, 1, false, 12);
    expect(b2.sedute[0].bloccoRif).toBe(2);
    expect(b2.contenitore_id).toBe('b2u4');
  });

  it('rigenerazione con nuovi parametri conserva i cicli toccati e rifà i futuri dalla composizione', () => {
    const b = nuovoBloccoComposto(par, profilo, compongoPiano(8, true, 'massa'), 1);
    for (const s of b.sedute) if (s.ciclo <= 2) s.stato = 'completata';
    const nuovo = rigeneraSeduteFuture(b, { ...par, priorita: ['petto'] }, profilo);
    expect(nuovo.sedute.length).toBe(32);
    expect(nuovo.sedute.filter((s) => s.stato === 'completata').length).toBe(8);
    expect(nuovo.sedute.map((s) => s.numero)).toEqual(nuovo.sedute.map((_, i) => i + 1));
    const futuraA = nuovo.sedute.find((s) => s.ciclo === 3 && s.giorno === 1)!;
    expect(futuraA.esercizi[0].gruppo).toBe('petto');
  });
});

describe('intensità e priorità (§6c)', () => {
  const es = (): EsercizioSeduta[] => [
    { slot: 0, esercizio_id: 'squat', ruolo: 'R1', gruppo: 'gambe', tabella: 'R1' },
    { slot: 1, esercizio_id: 'leg_extension', ruolo: 'C', gruppo: 'gambe', serie: 3, rip: 10 },
    { slot: 2, esercizio_id: 'panca_manubri', ruolo: 'R2', gruppo: 'petto', tabella: 'R2' },
    { slot: 3, esercizio_id: 'croci_manubri', ruolo: 'C', gruppo: 'petto', serie: 3, rip: 10 },
    { slot: 4, esercizio_id: 'crunch_cavo', ruolo: 'AB', gruppo: 'addome', tabella: 'AB' },
  ];
  it('moderata: −1 serie ai complementari (min 2), Target e fondamentali invariati; standard: nulla', () => {
    const m = es(); applicaIntensitaEPriorita(m, { priorita: [], intensita: 'moderata' });
    expect(m.map((e) => e.serie)).toEqual([undefined, 2, undefined, 2, undefined]);
    const s = es(); applicaIntensitaEPriorita(s, { priorita: [], intensita: 'standard' });
    expect(s.map((e) => e.serie)).toEqual([undefined, 3, undefined, 3, undefined]);
  });
  it('priorità petto: +1 serie a Target e complementari del petto e gruppo all’inizio; addome in coda', () => {
    const p = es(); applicaIntensitaEPriorita(p, { priorita: ['petto'], intensita: 'standard' });
    expect(p.map((e) => e.esercizio_id)).toEqual(['panca_manubri', 'croci_manubri', 'squat', 'leg_extension', 'crunch_cavo']);
    expect(p.find((e) => e.esercizio_id === 'croci_manubri')!.serie).toBe(4);
    expect(p.find((e) => e.esercizio_id === 'panca_manubri')!.serie_extra).toBe(1);
    const pr = prescrizione(p[0], { fase: 'fase1', cicloFase: 1 }, { panca_manubri: { esercizio_id: 'panca_manubri', kg: 26, rip: 10, modo: 'serie_unica' } }, imp);
    expect(pr.serie).toBe(4); // tabella R2 3×8 + 1
    expect(pr.kg).toBe(26); // il carico non cambia mai
    expect(prescrizione(p[0], { fase: 'scarico', cicloFase: 1 }, { panca_manubri: { esercizio_id: 'panca_manubri', kg: 26, rip: 10, modo: 'serie_unica' } }, imp).serie).toBe(3);
  });
  it('tetto di 20 serie a settimana per il gruppo prioritario sul Blocco 1', () => {
    const w = generaSettimana({ ...par, priorita: ['petto'] }, profilo, 1);
    expect(w.volume.petto).toBeLessThanOrEqual(20);
    const senza = generaSettimana(par, profilo, 1);
    expect(w.volume.petto).toBeGreaterThanOrEqual(senza.volume.petto);
  });
  it('alta: tecniche sugli isolamenti del Blocco 1 (rest-pause su bicipiti/tricipiti, seconda riga ×12 sul primo Target), non in scarico né nel test', () => {
    const b = nuovoBloccoComposto({ ...par, intensita: 'alta' }, profilo, compongoPiano(8, true, 'massa'), 1);
    const f1 = b.sedute.find((s) => s.fase === 'fase1' && s.giorno === 1)!;
    expect(f1.esercizi.some((e) => e.rest_pause === 'totale' && e.gruppo === 'bicipiti')).toBe(true);
    expect(f1.esercizi.filter((e) => e.seconda_riga).length).toBe(1);
    expect(f1.esercizi.some((e) => (e.ruolo === 'R1' || e.ruolo === 'L') && e.rest_pause)).toBe(false);
    const sc = b.sedute.find((s) => s.fase === 'scarico' && s.giorno === 1)!;
    expect(sc.esercizi.some((e) => e.rest_pause || e.seconda_riga)).toBe(false);
    const t = b.sedute.find((s) => s.fase === 'test' && s.giorno === 1)!;
    expect(t.esercizi.some((e) => e.seconda_riga)).toBe(false);
    const std = nuovoBloccoComposto(par, profilo, compongoPiano(8, true, 'massa'), 1);
    expect(std.sedute.find((s) => s.fase === 'fase1')!.esercizi.some((e) => e.rest_pause)).toBe(false);
  });
});

describe('libreria esercizi (§14b)', () => {
  it('ogni esercizio ha classe d’uso, attrezzo e almeno un equivalente dello stesso gruppo; i fondamentali sono F', () => {
    for (const e of Object.values(ESERCIZI_PER_ID)) {
      expect(e.classe_libreria, e.id).toBeDefined();
      expect(e.attrezzo, e.id).toBeDefined();
      expect((e.equivalenti ?? []).length, e.id).toBeGreaterThanOrEqual(1);
      for (const q of e.equivalenti ?? []) {
        expect(ESERCIZI_PER_ID[q], `${e.id} → ${q}`).toBeDefined();
        expect(ESERCIZI_PER_ID[q].gruppo, `${e.id} → ${q}`).toBe(e.gruppo);
      }
      if (e.fondamentale) expect(e.classe_libreria).toBe('F');
    }
  });
  it('contenitore generico (3 giorni): i complementari senza varianti ruotano su un equivalente in Fase 2 e tornano o cambiano in Fase 3', () => {
    const b = nuovoBloccoComposto({ ...par, N: 3 }, profilo, compongoPiano(13, true, 'massa'), 1);
    const giorno1 = (fase: string) => b.sedute.find((s) => s.fase === fase && s.giorno === 1)!;
    const c1 = giorno1('fase1').esercizi.filter((e) => e.ruolo === 'C').map((e) => e.esercizio_id);
    const c2 = giorno1('fase2').esercizi.filter((e) => e.ruolo === 'C').map((e) => e.esercizio_id);
    expect(c1).not.toEqual(c2);
    const ruotato = giorno1('fase2').esercizi.find((e) => e.ruolo === 'C' && e.eredita_da)!;
    expect(ruotato).toBeDefined();
    expect(ESERCIZI_PER_ID[ruotato.eredita_da!].equivalenti).toContain(ruotato.esercizio_id);
    // I programmi dei video (4 giorni) non ruotano da soli: hanno le loro varianti.
    const b4 = nuovoBloccoComposto(par, profilo, compongoPiano(13, true, 'massa'), 1);
    expect(b4.sedute.find((s) => s.fase === 'fase2')!.esercizi.every((e) => !e.eredita_da || ESERCIZI_PER_ID[e.eredita_da])).toBe(true);
  });
});
