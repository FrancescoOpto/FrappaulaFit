import { describe, expect, it } from 'vitest';
import type { CaricoProfilo, EsercizioSeduta, ParametriGeneratore, Profilo, RegistroEsercizio, StimoloGluteo } from '../tipi';
import { contenitorePer } from '../data/contenitori';
import { ESERCIZI_PER_ID } from '../data/esercizi';
import { CIRCUITO, RECUPERI_DEFAULT, STRIPPING, tempiCircuito } from '../data/tabelle';
import { eserciziPerFase, generaSettimana } from './generatore';
import { cambiaObiettivo, eIbrido, nuovoBloccoIbrido, parametriPerObiettivo } from './moduli';
import { durataStimata, prescrizione, serieRip } from './prescrizione';
import { progressioneCircuito, ridistribuisciGiri } from './circuito';
import { cicliDaMesi, cicliPerObiettivo, seduteDefault } from './pianificatore';
import { compongoPiano, sommaCicli } from './composizione';

// Profilo donna a sedute ibride (SPEC_PIANIFICATORE §12b) e impostazioni di durata (§12c).

const impostazioni = { arrotondamento: 0.5 as const, fattore_lavoro: 0.9, recuperi: RECUPERI_DEFAULT, suoni: true, vibrazione: true, notifiche: false, stripping: false };
const profilo: Pick<Profilo, 'sostituzioni' | 'esercizi_personalizzati' | 'impostazioni'> = { sostituzioni: {}, esercizi_personalizzati: [], impostazioni };
const donna = (obiettivo: 'mantenimento' | 'definizione' = 'mantenimento'): ParametriGeneratore =>
  parametriPerObiettivo({ N: 3, T: 60, priorita: [], esclusi: [], esperienza: 'intermedio', preset: 'donna_glutei', bloccoBreve: true, intensita: 'standard' }, obiettivo);
const stimoli = (es: EsercizioSeduta[]): Set<StimoloGluteo> => new Set(es.map((e) => ESERCIZI_PER_ID[e.esercizio_id]?.stimolo_gluteo).filter((x): x is StimoloGluteo => Boolean(x)));

describe('sedute ibride A-B-C (§12b): struttura', () => {
  const c = contenitorePer(3, 'donna_glutei');

  it('3 sedute fisse, contenitore ibrido; profilo ibrido solo per la donna a 3 sedute', () => {
    expect(c.ibrido).toBe(true);
    expect(c.sessioni.map((s) => s.nome)).toEqual(['Seduta A', 'Seduta B', 'Seduta C']);
    expect(eIbrido({ preset: 'donna_glutei', N: 3 })).toBe(true);
    expect(eIbrido({ preset: 'donna_glutei', N: 4 })).toBe(false);
    expect(eIbrido({ preset: 'uomo_base', N: 3 })).toBe(false);
  });

  it('parte classica prima, poi un circuito di 5 stazioni a 3 giri × 12 (range 10–15); esercizi pesanti fuori dal circuito', () => {
    for (const s of c.sessioni) {
      const primoCircuito = s.slot.findIndex((x) => x.circuito);
      expect(primoCircuito, s.nome).toBeGreaterThan(0);
      expect(s.slot.slice(primoCircuito).every((x) => x.circuito), s.nome).toBe(true);
      const stazioni = s.slot.filter((x) => x.circuito);
      expect(stazioni.length, s.nome).toBe(5);
      for (const x of stazioni) {
        expect([x.ruolo, x.serie, x.rip], `${s.nome} ${x.default}`).toEqual(['C', CIRCUITO.giriDefault, 12]);
        expect(ESERCIZI_PER_ID[x.default].fondamentale, x.default).toBeFalsy();
      }
      // La parte classica parte da un fondamentale o da un Target.
      expect(['R1', 'R2'], s.nome).toContain(s.slot[0].ruolo);
    }
  });

  it('dorso in tutte e 3 le sedute; nella settimana almeno una trazione verticale e un rematore; nessun fondamentale per il dorso', () => {
    for (const s of c.sessioni) expect(s.slot.some((x) => x.gruppo === 'dorso'), s.nome).toBe(true);
    const tutte = c.sessioni.flatMap((s) => s.slot);
    expect(tutte.some((x) => x.classe === 'trazione_verticale')).toBe(true);
    expect(tutte.some((x) => x.classe === 'trazione_orizzontale')).toBe(true);
    expect(tutte.some((x) => x.gruppo === 'dorso' && x.ruolo === 'R1')).toBe(false);
    // Seduta B: dorso per primo.
    expect(c.sessioni[1].slot[0].gruppo).toBe('dorso');
  });

  it('nelle sedute di gambe (A e C) i glutei ricevono i tre stimoli, in ogni fase (la rotazione tiene lo stimolo)', () => {
    const r = generaSettimana(donna(), profilo);
    for (const fase of ['fase1', 'fase2', 'scarico'] as const) {
      for (const i of [0, 2]) {
        const es = eserciziPerFase(r.sessioni[i], c.sessioni[i], fase, donna());
        expect([...stimoli(es)].sort(), `${r.sessioni[i].nome} ${fase}`).toEqual(['abduzione', 'estensione', 'flessione']);
      }
    }
    // Fase 2: l'abduzione alla macchina ruota sull'abduzione al cavo, non su un esercizio di estensione.
    const a2 = eserciziPerFase(r.sessioni[0], c.sessioni[0], 'fase2', donna());
    expect(a2.find((e) => e.slot === 2)?.esercizio_id).toBe('abduzioni_cavo');
  });
});

describe('sedute ibride: tempi, obiettivi e generatore', () => {
  it('durata del circuito: giri × (stazioni × 45″ + transizioni + recupero di fine giro)', () => {
    const cinque = Array.from({ length: 5 }, () => ({ ruolo: 'C' as const, serie: 3, circuito: 'pha' }));
    // 8′ di riscaldamento + 3 × (5 × 45 + 4 × 30 + 150) = 480 + 1485.
    expect(durataStimata(cinque, RECUPERI_DEFAULT, tempiCircuito('mantenimento'))).toBe(1965);
    // Dimagrimento: transizioni 20″ e fine giro 2′ → 480 + 3 × (225 + 80 + 120).
    expect(durataStimata(cinque, RECUPERI_DEFAULT, tempiCircuito('definizione'))).toBe(1755);
  });

  it('Mantenimento e costruzione: tutte e tre le sedute stanno nei 60′ con 3 giri (A 54′, B 57,5′, C 54′); nessun esercizio di copertura aggiunto', () => {
    const r = generaSettimana(donna(), profilo);
    expect(r.contenitore.id).toBe('d3');
    expect(r.sessioni.map((s) => s.durataS)).toEqual([3240, 3450, 3240]);
    expect(r.sessioni.flatMap((s) => s.esercizi).some((e) => e.slot < 0)).toBe(false);
    expect(r.avvisi.filter((a) => a.includes('oltre il limite'))).toEqual([]);
    // Classico ≈ 30′ (riscaldamento compreso), circuito ≈ 25′.
    const a = r.sessioni[0];
    const classica = durataStimata(a.esercizi.filter((e) => !e.circuito).map((e) => ({ ruolo: e.ruolo, serie: serieRip(e.ruolo, 'fase1', 1, e)[0] })), RECUPERI_DEFAULT);
    expect(Math.round(classica / 60)).toBe(29);
    expect(Math.round((a.durataS - classica) / 60)).toBe(25);
  });

  it('Dimagrimento: parte classica con una serie in meno (fondamentali e circuito invariati), stessi carichi, niente tecniche', () => {
    const m = generaSettimana(donna('mantenimento'), profilo);
    const d = generaSettimana({ ...donna('definizione'), intensita: 'alta' }, profilo);
    const serie = (r: typeof m, i: number) => r.sessioni[i].esercizi.map((e) => serieRip(e.ruolo, 'fase1', 1, e)[0]);
    expect(serie(m, 0)).toEqual([4, 3, 3, 3, 3, 3, 3]);
    expect(serie(d, 0)).toEqual([4, 2, 3, 3, 3, 3, 3]);
    expect(serie(d, 1).slice(0, 3)).toEqual([2, 2, 2]);
    // Stessi carichi: stacco rumeno al carico del test in entrambi i casi.
    const test = { stacco_rumeno: { esercizio_id: 'stacco_rumeno', kg: 50, rip: 10, modo: 'serie_unica' as const } };
    const sed = { fase: 'fase1' as const, cicloFase: 1 };
    expect(prescrizione(d.sessioni[0].esercizi[1], sed, test, impostazioni).kg).toBe(50);
    expect(prescrizione(m.sessioni[0].esercizi[1], sed, test, impostazioni).kg).toBe(50);
    // Intensità "alta" non accende tecniche in Dimagrimento.
    const c = contenitorePer(3, 'donna_glutei');
    const es = eserciziPerFase(d.sessioni[1], c.sessioni[1], 'fase1', { ...donna('definizione'), intensita: 'alta' });
    expect(es.some((e) => e.rest_pause || e.seconda_riga)).toBe(false);
    expect(d.sessioni[0].durataS).toBe(480 + 780 + 330 + 1275);
  });

  it('settimana di test: 3 sedute; stazioni del circuito con serie unica a 14RM (12 rip con 2 di riserva), hip thrust e squat con la stima', () => {
    const r = generaSettimana(donna(), profilo);
    const c = contenitorePer(3, 'donna_glutei');
    const test = r.sessioni.map((s, i) => eserciziPerFase(s, c.sessioni[i], 'test', donna()));
    expect(test.length).toBe(3);
    const sed = { fase: 'test' as const, cicloFase: 1 };
    const stazione = test[0].find((e) => e.circuito)!;
    expect(prescrizione(stazione, sed, {}, impostazioni)).toMatchObject({ modoTest: 'serie_unica', rip: 14 });
    expect(prescrizione(test[0][0], sed, {}, impostazioni).modoTest).toBe('stima');
    expect(test[2][0].esercizio_id).toBe('squat');
  });
});

describe('blocco ibrido e cambio di obiettivo (§12b)', () => {
  it('3 mesi = 13 cicli = 39 sedute: 3 sedute di test, poi il piano del Mantenimento; obiettivo nei parametri e nelle tappe', () => {
    const b = nuovoBloccoIbrido(donna(), profilo, 'mantenimento', true, 1, false, cicliDaMesi(3));
    expect(b.sedute.length).toBe(39);
    expect(b.sedute.slice(0, 3).map((s) => s.fase)).toEqual(['test', 'test', 'test']);
    expect(b.sedute[3].fase).toBe('fase1');
    expect(sommaCicli(b.composizione!)).toBe(13);
    expect(b.composizione).toEqual(compongoPiano(13, true, 'mantenimento', 1));
    expect(b.parametri.obiettivoIbrido).toBe('mantenimento');
    expect(b.tappe?.every((t) => t.obiettivo === 'mantenimento' && t.energia === 'mantenimento')).toBe(true);
    const d = nuovoBloccoIbrido(donna(), profilo, 'definizione', true, 1, false, 13);
    expect(d.parametri.obiettivoIbrido).toBe('definizione');
    expect(d.tappe?.every((t) => t.obiettivo === 'definizione' && t.energia === 'deficit')).toBe(true);
    // La "massa" per lei vale come mantenimento e costruzione.
    expect(parametriPerObiettivo(donna(), 'massa').obiettivoIbrido).toBe('mantenimento');
  });

  it('cambio Mantenimento → Dimagrimento in corsa: niente nuovo test, primo ciclo ponte, carichi del profilo', () => {
    const b = nuovoBloccoIbrido(donna(), profilo, 'mantenimento', true, 1, false, 13);
    const carichi: Record<string, CaricoProfilo> = {};
    for (const s of b.sedute) for (const e of s.esercizi) carichi[e.esercizio_id] = { esercizio_id: e.esercizio_id, kg: 20, rip: 14, modo: 'serie_unica', data: new Date().toISOString(), origine: 'test' };
    const fatto = { ...b, sedute: b.sedute.map((s, i) => (i < 6 ? { ...s, stato: 'completata' as const } : s)) };
    const esito = cambiaObiettivo(fatto, { ...profilo, parametri: donna('definizione'), carichi }, { tipo: 'definizione', dal: '', settimane: 13, energia: 'deficit' });
    expect(esito.nuovo.sedute.some((s) => s.fase === 'test')).toBe(false);
    expect(esito.nuovo.parametri.obiettivoIbrido).toBe('definizione');
    expect(esito.nuovo.sedute[0].cicloTipo).toBe('ponte');
    expect(esito.nuovo.test.hip_thrust?.kg).toBe(20);
  });
});

describe('circuito in seduta: giri, tetto di tempo, doppia progressione (§12b)', () => {
  const r = generaSettimana(donna(), profilo);
  const pr = (e: EsercizioSeduta) => prescrizione(e, { fase: 'fase1', cicloFase: 1 }, {}, impostazioni);
  const registro = (es: EsercizioSeduta[]): Record<number, RegistroEsercizio> =>
    Object.fromEntries(es.map((e) => [e.slot, { esercizio_id: e.esercizio_id, serie: Array.from({ length: pr(e).serie }, (_, i) => ({ n: i + 1, kg_prev: 20, rip_prev: pr(e).rip, fatta: false })) }]));

  it('4 giri nella seduta A: il circuito passa a 4 giri e lo stacco rumeno perde una serie (57,5′ ≤ 60′); i fondamentali non si toccano', () => {
    const a = r.sessioni[0];
    const esito = ridistribuisciGiri(a, registro(a.esercizi), 4, pr, RECUPERI_DEFAULT, 60, tempiCircuito('mantenimento'));
    expect(esito.giri).toBe(4);
    expect(esito.tolte).toBe(1);
    expect(a.esercizi.filter((e) => e.circuito).every((e) => esito.esercizi[e.slot].serie.length === 4)).toBe(true);
    expect(esito.esercizi[0].serie.length).toBe(4);
    expect(esito.esercizi[1].serie.length).toBe(2);
    // Tornando a 3 giri le serie classiche tornano.
    const indietro = ridistribuisciGiri(a, esito.esercizi, 3, pr, RECUPERI_DEFAULT, 60, tempiCircuito('mantenimento'));
    expect([indietro.tolte, indietro.esercizi[1].serie.length, indietro.esercizi[2].serie.length]).toEqual([0, 3, 3]);
  });

  it('4 giri nella seduta B con la lat già fatta: due serie in meno (panca manubri e rematore), mai sotto 2 né sotto le serie già fatte', () => {
    const bb = r.sessioni[1];
    const reg = registro(bb.esercizi);
    reg[0].serie[0].fatta = true;
    reg[0].serie[1].fatta = true;
    reg[0].serie[2].fatta = true;
    const esito = ridistribuisciGiri(bb, reg, 4, pr, RECUPERI_DEFAULT, 60, tempiCircuito('mantenimento'));
    // La lat (3 serie fatte) resta a 3: si tolgono una serie alla panca manubri e una al rematore, poi non c'è altro.
    expect([esito.esercizi[0].serie.length, esito.esercizi[1].serie.length, esito.esercizi[2].serie.length]).toEqual([3, 2, 2]);
    expect(esito.tolte).toBe(2);
    expect(ridistribuisciGiri(bb, registro(bb.esercizi), 9, pr, RECUPERI_DEFAULT, 60, tempiCircuito('mantenimento')).giri).toBe(CIRCUITO.giriMax);
  });

  it('doppia progressione: 15 ripetizioni in tutti i giri → un passo in più la volta dopo; altrimenti nessun cambio', () => {
    const a = r.sessioni[0];
    const reg = registro(a.esercizi);
    const abd = a.esercizi.find((e) => e.esercizio_id === 'abductor')!;
    const lat = a.esercizi.find((e) => e.esercizio_id === 'lat_machine')!;
    reg[abd.slot].serie = reg[abd.slot].serie.map((x) => ({ ...x, fatta: true, kg: 40, rip: 15 }));
    reg[lat.slot].serie = reg[lat.slot].serie.map((x, i) => ({ ...x, fatta: true, kg: 35, rip: i === 2 ? 14 : 15 }));
    const passo = (id: string) => (ESERCIZI_PER_ID[id]?.carico_modo === 'macchina' || ESERCIZI_PER_ID[id]?.carico_modo === 'cavo' ? 5 : 2.5);
    expect(progressioneCircuito({ ...a, fase: 'fase1' }, reg, passo, 0.5)).toEqual({ abductor: 45 });
    expect(progressioneCircuito({ ...a, fase: 'test' }, reg, passo, 0.5)).toEqual({});
  });
});

describe('durata in mesi e sedute per profilo (§12c), stripping −20 %', () => {
  it('3/6/9/12 mesi = 13/26/39/52 settimane; uomo 4 sedute, donna 3', () => {
    expect([3, 6, 9, 12].map(cicliDaMesi)).toEqual([13, 26, 39, 52]);
    expect(cicliDaMesi(3) * seduteDefault('M')).toBe(52);
    expect(cicliDaMesi(3) * seduteDefault('F')).toBe(39);
  });

  it('Dimagrimento uomo: la Preservazione non conta il test, quindi un ciclo in meno per restare nei mesi; Massa, Mantenimento e profilo ibrido lo contano', () => {
    expect(cicliPerObiettivo('definizione', 3)).toBe(12);
    expect(cicliPerObiettivo('massa', 3)).toBe(13);
    expect(cicliPerObiettivo('mantenimento', 6)).toBe(26);
    expect(cicliPerObiettivo('definizione', 3, true)).toBe(13);
  });

  it('stripping di default −20 %', () => {
    expect(STRIPPING).toBe(-0.2);
  });
});
