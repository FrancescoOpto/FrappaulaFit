import { describe, expect, it } from 'vitest';
import type { RegistroVoce, RisultatoTest, Seduta } from '../tipi';
import { ESERCIZI_PER_ID } from '../data/esercizi';
import { SEDUTE, sessione } from '../data/programma';
import { componi, generaSedute, righe, settimaneDaMesi, sigla, sommaSettimane } from './calendario';
import { caricoPiano, massimaleDaSerie, percentualeRM, prescrivi, rigaDi, ripetizioniTest, tipoTest, type Contesto } from './prescrizione';
import { pianoSeduta, progressioneDoppia, stazioneCorrente } from './seduta';

// App di lei: programma del libro "Glutei" (cap. II) su 3 sedute, docs/PROPOSTA_PROGRAMMA_DONNA.md.

const test = (id: string, rm1: number): RisultatoTest => ({ esercizio_id: id, kg: rm1, rip: 1, modo: 'stima', rm1, data: '' });
const ctx = (over: Partial<Contesto> = {}): Contesto => ({ test: {}, carichiCorrenti: {}, sostituzioni: {}, obiettivo: 'mantenimento', passo: 0.5, ...over });
const sed = (giorno: 'A' | 'B' | 'C', fase: Seduta['fase'], riga = 1, faseRif: Seduta['faseRif'] = fase === 'fase2' || fase === 'fase3' ? fase : 'fase1') => ({ giorno, fase, riga, faseRif });

describe('calendario: fasi da 6 settimane, scarichi e durate in mesi', () => {
  it('3/6/9/12 mesi = 13/26/39/52 settimane; la somma della composizione è sempre la durata', () => {
    expect([3, 6, 9, 12].map(settimaneDaMesi)).toEqual([13, 26, 39, 52]);
    for (const D of [1, 4, 7, 11, 12, 13, 19, 20, 21, 26, 39, 52]) expect(sommaSettimane(componi(D)), `D=${D}`).toBe(D);
  });

  it('6 mesi: test + programma intero del libro (6 + scarico + 6 + scarico + 6), poi scarico, nuovo test e si riparte', () => {
    expect(sigla(componi(26))).toBe('T F1×6 S F2×6 S F3×6 S T F1×3');
  });

  it('3 mesi: fasi accorciate 4 + 3 + 3 con i due scarichi, così si arriva comunque all’intensificazione', () => {
    expect(sigla(componi(13))).toBe('T F1×4 S F2×3 S F3×3');
    expect(sigla(componi(39))).toBe('T F1×6 S F2×6 S F3×6 S T F1×5 S F2×5 S F3×4');
    expect(sigla(componi(52))).toBe('T F1×6 S F2×6 S F3×6 S T F1×6 S F2×6 S F3×6 S T F1×3 S F2×3');
  });

  it('fasi accorciate: righe della tabella a gradini, prima e ultima sempre', () => {
    expect([righe(6), righe(5), righe(4), righe(3), righe(2), righe(1)]).toEqual([[1, 2, 3, 4, 5, 6], [1, 2, 4, 5, 6], [1, 3, 4, 6], [1, 4, 6], [1, 6], [1]]);
  });

  it('sedute: 3 a settimana (A, B, C), la prima settimana di test; lo scarico usa la fase appena finita', () => {
    const s = generaSedute(componi(13), 'p');
    expect(s.length).toBe(39);
    expect(s.slice(0, 3).map((x) => `${x.fase}${x.giorno}`)).toEqual(['testA', 'testB', 'testC']);
    const scarico = s.filter((x) => x.fase === 'scarico');
    expect(scarico.map((x) => x.faseRif)).toEqual(['fase1', 'fase1', 'fase1', 'fase2', 'fase2', 'fase2']);
    expect(s.filter((x) => x.fase === 'fase1' && x.giorno === 'A').map((x) => x.riga)).toEqual([1, 3, 4, 6]);
  });
});

describe('programma: le tre sedute del libro (Tab. 2.25) più la parte alta', () => {
  it('ogni esercizio esiste; glutei con 6 settimane per fase; parte alta uguale in tutte le fasi', () => {
    for (const s of SEDUTE) {
      for (const v of s.voci) {
        for (const f of ['fase1', 'fase2', 'fase3'] as const) {
          expect(ESERCIZI_PER_ID[v.esercizio[f]], `${s.giorno} ${v.id} ${f}`).toBeDefined();
          expect(v.righe[f].length, `${v.id} ${f}`).toBe(6);
        }
      }
    }
  });

  it('distribuzione dei glutei per fase come nella proposta approvata', () => {
    const glutei = (g: 'A' | 'B' | 'C', f: 'fase1' | 'fase2' | 'fase3') => sessione(g).voci.filter((v) => v.parte === 'glutei').map((v) => v.esercizio[f]);
    expect(glutei('A', 'fase1')).toEqual(['squat', 'hip_thrust', 'stacco_rumeno', 'clam_shell']);
    expect(glutei('B', 'fase1')).toEqual(['stacco', 'squat_bulgaro', 'pull_through']);
    expect(glutei('C', 'fase1')).toEqual(['squat_fermo', 'hip_thrust_banda', 'abduzioni_cavo']);
    expect(glutei('B', 'fase2')).toEqual(['stacco', 'hip_thrust_1gamba', 'affondi_camminata']);
    expect(glutei('C', 'fase2')).toEqual(['affondi_dietro', 'hip_thrust_banda', 'abduzioni_cavo']);
    expect(glutei('A', 'fase3')).toEqual(['squat', 'hip_thrust', 'frog_hip_thrust', 'clam_shell']);
    expect(glutei('B', 'fase3')).toEqual(['stacco', 'hip_thrust_banda', 'back_extension']);
    expect(glutei('C', 'fase3')).toEqual(['squat_bulgaro', 'squat_sumo_deficit', 'abduzioni_cavo']);
  });

  it('dorso in tutte e tre le sedute, 12 serie a settimana (due verticali e due orizzontali)', () => {
    const dorso = SEDUTE.flatMap((s) => s.voci.filter((v) => ESERCIZI_PER_ID[v.esercizio.fase1].gruppo === 'dorso'));
    for (const s of SEDUTE) expect(s.voci.some((v) => ESERCIZI_PER_ID[v.esercizio.fase1].gruppo === 'dorso'), s.giorno).toBe(true);
    expect(dorso.reduce((a, v) => a + v.righe.fase1[0].s, 0)).toBe(12);
    expect(dorso.map((v) => ESERCIZI_PER_ID[v.esercizio.fase1].classe).sort()).toEqual(['trazione_orizzontale', 'trazione_orizzontale', 'trazione_verticale', 'trazione_verticale']);
  });

  it('squat e stacco: progressioni del libro (Fase 1 volume al 65 %, Fase 2 alternata, Fase 3 dal 75 al 90 %)', () => {
    const a1 = sessione('A').voci[0];
    expect(a1.righe.fase1.map((r) => `${r.s}x${r.r}@${r.pct}`)).toEqual(['3x5@0.65', '3x5@0.65', '4x5@0.65', '4x5@0.65', '5x5@0.65', '5x5@0.65']);
    expect(a1.righe.fase2.map((r) => `${r.s}x${r.r}@${r.pct}`)).toEqual(['3x6@0.65', '4x6@0.65', '4x5@0.7', '5x5@0.7', '5x4@0.75', '6x4@0.75']);
    expect(a1.righe.fase3.map((r) => `${r.s}x${r.r}@${r.pct}`)).toEqual(['4x5@0.75', '4x5@0.75', '4x4@0.8', '4x4@0.8', '4x3@0.85', '4x2@0.9']);
    expect(a1.recupero).toEqual({ fase1: 120, fase2: 150, fase3: 180 });
  });
});

describe('carichi', () => {
  it('quota del massimale per n RM: Brzycki fino a 14, poi la tabella del libro (60 % a 16, 55 % a 20, 50 % a 25)', () => {
    expect(percentualeRM(10)).toBeCloseTo(0.75, 3);
    expect(percentualeRM(12)).toBeCloseTo(0.6944, 3);
    expect(percentualeRM(16)).toBeCloseTo(0.6, 3);
    expect(percentualeRM(20)).toBeCloseTo(0.55, 3);
    expect(percentualeRM(22)).toBeCloseTo(0.53, 3);
    expect(percentualeRM(25)).toBeCloseTo(0.5, 3);
    expect(massimaleDaSerie(10, 14)).toBeCloseTo(15.65, 2);
  });

  it('test: stima per squat, stacco e hip thrust; serie unica a 10/12/14 RM per gli altri; niente test per elastico e corpo libero', () => {
    expect(['squat', 'stacco', 'hip_thrust'].map(tipoTest)).toEqual(['stima', 'stima', 'stima']);
    expect([tipoTest('stacco_rumeno'), tipoTest('clam_shell'), tipoTest('plank'), tipoTest('crunch_inverso')]).toEqual(['serie_unica', 'nessuno', 'nessuno', 'nessuno']);
    const a = sessione('A').voci;
    expect(a.map((v) => ripetizioniTest(v.righe.fase1[0]))).toEqual([10, 10, 12, 14, 12, 12, 14, 14]);
  });

  it('squat al 65 % in Fase 1 e al 90 % in Fase 3; hip thrust da 10 RM; aumenti "+10 %" mai oltre una ripetizione di riserva', () => {
    const c = ctx({ test: { squat: test('squat', 60), hip_thrust: test('hip_thrust', 100) } });
    const a1 = sessione('A').voci[0];
    const a2 = sessione('A').voci[1];
    expect(prescrivi(a1, sed('A', 'fase1', 1), c)).toMatchObject({ serie: 3, rip: 5, kg: 39, pct: 0.65, recupero: 120, pesante: true });
    expect(prescrivi(a1, sed('A', 'fase3', 6), c)).toMatchObject({ serie: 4, rip: 2, kg: 54 });
    expect(prescrivi(a2, sed('A', 'fase1', 1), c).kg).toBe(75);
    expect(prescrivi(a2, sed('A', 'fase2', 1), c).kg).toBe(69.5);
    // Settimana 3 della Fase 2: 3×9 a 12 RM +10 % = 76,4 → tetto 10 RM = 75.
    expect(caricoPiano(100, a2.righe.fase2[2], 0.5)).toBe(75);
  });

  it('il carico scelto da lei sostituisce il piano e ne segue gli aumenti (rapporto col piano)', () => {
    const a2 = sessione('A').voci[1];
    const c = ctx({ test: { hip_thrust: test('hip_thrust', 100) }, carichiCorrenti: { hip_thrust: { kg: 80, rif: 75, aggiornato: '', origine: 'manuale' } } });
    expect(prescrivi(a2, sed('A', 'fase1', 4), c).kg).toBe(80);
    expect(prescrivi(a2, sed('A', 'fase2', 1), c).kg).toBe(74);
    // Esercizio senza test: vale il suo carico così com'è.
    const b2 = sessione('B').voci[1];
    expect(prescrivi(b2, sed('B', 'fase2', 1), ctx({ carichiCorrenti: { hip_thrust_1gamba: { kg: 12, aggiornato: '', origine: 'manuale' } } })).kg).toBe(12);
    expect(prescrivi(b2, sed('B', 'fase2', 1), ctx()).kg).toBeUndefined();
  });

  it('serie a cedimento ("max") con il carico da n RM; elastico senza kg', () => {
    const c3 = sessione('C').voci[2];
    const p = prescrivi(c3, sed('C', 'fase1', 1), ctx({ test: { abduzioni_cavo: { esercizio_id: 'abduzioni_cavo', kg: 10, rip: 14, modo: 'serie_unica', rm1: 15.5, data: '' } } }));
    expect(p).toMatchObject({ serie: 2, max: true, rm: 22, kg: 8 });
    expect(prescrivi(sessione('A').voci[3], sed('A', 'fase1', 1), ctx())).toMatchObject({ senzaCarico: true, kg: undefined, max: true });
  });

  it('scarico: prima settimana della fase finita con metà delle serie (minimo 2); Dimagrimento: una serie in meno tranne i pesanti', () => {
    const a1 = sessione('A').voci[0];
    expect(rigaDi(a1, { fase: 'scarico', faseRif: 'fase2', riga: 1 })).toMatchObject({ s: 2, r: 6, pct: 0.65 });
    const d = ctx({ obiettivo: 'definizione' });
    expect(prescrivi(sessione('A').voci[4], sed('A', 'fase1', 1), d).serie).toBe(2);
    expect(prescrivi(a1, sed('A', 'fase1', 1), d).serie).toBe(3);
    expect(prescrivi(sessione('A').voci[2], sed('A', 'fase1', 1), d).serie).toBe(2);
  });
});

describe('seduta: durata, tetto di tempo, circuito PHA', () => {
  it('classica: seduta A ≈ 57′ in settimana 1 e ≈ 68′ in settimana 5 (come nella proposta)', () => {
    expect(pianoSeduta(sed('A', 'fase1', 1), ctx(), 'classica', 75).durataS).toBe(3420);
    expect(pianoSeduta(sed('A', 'fase1', 5), ctx(), 'classica', 75).durataS).toBe(4080);
  });

  it('tetto di 60′ in classica: la parte alta perde serie (mai sotto 2), i glutei restano interi', () => {
    const p = pianoSeduta(sed('A', 'fase1', 5), ctx(), 'classica', 60);
    expect(p.tolte).toBe(3);
    expect(p.voci.filter((v) => v.voce.parte === 'glutei').map((v) => v.p.serie)).toEqual([5, 5, 3, 2]);
    expect(p.voci.filter((v) => v.voce.parte === 'alta').map((v) => v.p.serie)).toEqual([2, 2, 2, 2]);
  });

  it('PHA: squat e hip thrust a serie normali; il resto in circuito alternando glutei e parte alta, addome in coda', () => {
    const p = pianoSeduta(sed('A', 'fase1', 1), ctx(), 'pha', 75);
    expect(p.voci.filter((v) => !v.circuito).map((v) => v.p.esercizio_id)).toEqual(['squat', 'hip_thrust']);
    expect(p.stazioni.map((id) => p.voci.find((v) => v.voce.id === id)!.p.esercizio_id)).toEqual(['stacco_rumeno', 'lat_larga', 'clam_shell', 'panca_inclinata_manubri', 'alzate_laterali', 'crunch_cavo']);
    expect(p.giri).toBe(3);
    // 480 + 2 × 3 × 165 + circuito (16 serie × 45 + 13 transizioni × 30 + 3 × 150).
    expect(p.durataS).toBe(3030);
    // Seduta C: lo squat con fermo (recupero 2′) resta fuori dal circuito.
    expect(pianoSeduta(sed('C', 'fase1', 1), ctx(), 'pha', 75).voci.filter((v) => !v.circuito).map((v) => v.p.esercizio_id)).toEqual(['squat_fermo']);
  });

  it('circuito con stazioni da 2 e da 3 serie: al terzo giro restano solo quelle da 3', () => {
    const reg: Record<string, RegistroVoce> = {
      x: { esercizio_id: 'a', serie: [1, 2, 3].map((n) => ({ n, kg_prev: 0, rip_prev: 10, fatta: n <= 2 })) },
      y: { esercizio_id: 'b', serie: [1, 2].map((n) => ({ n, kg_prev: 0, rip_prev: 10, fatta: true })) },
      z: { esercizio_id: 'c', serie: [1, 2, 3].map((n) => ({ n, kg_prev: 0, rip_prev: 10, fatta: n <= 2 })) },
    };
    expect(stazioneCorrente(['x', 'y', 'z'], reg, 3)).toEqual({ voce: 'x', giro: 3 });
    reg.x.serie[2].fatta = true;
    expect(stazioneCorrente(['x', 'y', 'z'], reg, 3)).toEqual({ voce: 'z', giro: 3 });
  });

  it('progressione doppia: parte alta in cima al range in tutte le serie → +1 passo; altrimenti niente', () => {
    const piano = pianoSeduta(sed('A', 'fase1', 1), ctx(), 'classica', 75);
    const reg: Record<string, RegistroVoce> = {
      A5: { esercizio_id: 'lat_larga', serie: [1, 2, 3].map((n) => ({ n, kg_prev: 30, rip_prev: 10, kg: 30, rip: 12, fatta: true })) },
      A6: { esercizio_id: 'panca_inclinata_manubri', serie: [1, 2, 3].map((n) => ({ n, kg_prev: 10, rip_prev: 10, kg: 10, rip: n === 3 ? 11 : 12, fatta: true })) },
    };
    const out = progressioneDoppia(piano, reg, 0.5, 's1', 'ora');
    expect(Object.keys(out)).toEqual(['lat_larga']);
    expect(out.lat_larga.kg).toBe(32.5);
  });
});
