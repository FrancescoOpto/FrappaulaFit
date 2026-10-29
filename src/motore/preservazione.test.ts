import { describe, expect, it } from 'vitest';
import { RECUPERI_DEFAULT } from '../data/tabelle';
import { eserciziPerFase, generaSettimana, nuovoBlocco } from './generatore';
import { cambiaObiettivo, carichiRecenti, nuovoBloccoPreservazione, serveTest, testDalProfilo } from './moduli';
import { proponiPiano } from './pianificatore';
import { contaSerie, scalaPerTempo, sequenzaPreservazione, trasformaPreservazione } from './preservazione';
import { durataStimata, prescrizione } from './prescrizione';
import type { CaricoProfilo, EsercizioSeduta, ParametriGeneratore, Profilo } from '../tipi';

const par: ParametriGeneratore = { N: 4, T: 60, priorita: [], esclusi: [], esperienza: 'intermedio', preset: 'uomo_base', bloccoBreve: false };
const imp = { arrotondamento: 0.5 as const, fattore_lavoro: 0.9, recuperi: RECUPERI_DEFAULT, suoni: true, vibrazione: true, notifiche: false, stripping: false };
const profilo: Pick<Profilo, 'sostituzioni' | 'esercizi_personalizzati' | 'impostazioni'> = { sostituzioni: {}, esercizi_personalizzati: [], impostazioni: imp };
const oggi = new Date().toISOString();
const carichi: Record<string, CaricoProfilo> = {
  squat: { esercizio_id: 'squat', kg: 80, rip: 5, modo: 'stima', massimale: 90, data: oggi, origine: 'test' },
  panca_piana: { esercizio_id: 'panca_piana', kg: 90, rip: 5, modo: 'stima', massimale: 101.5, data: oggi, origine: 'test' },
  stacco_da_terra: { esercizio_id: 'stacco_da_terra', kg: 90, rip: 5, modo: 'stima', massimale: 101.5, data: oggi, origine: 'test' },
  spinte_manubri_seduto: { esercizio_id: 'spinte_manubri_seduto', kg: 20, rip: 10, modo: 'serie_unica', data: oggi, origine: 'test' },
  push_down_corda: { esercizio_id: 'push_down_corda', kg: 40, rip: 14, modo: 'serie_unica', caricoCorrente: 42.5, data: oggi, origine: 'manuale' },
};

// SPEC_PIANIFICATORE v2 §12.4
describe('sequenza Preservazione (§4.4, v2)', () => {
  it('N=3…8 e 11: scarico ogni 5 ma salta se restano 1–2 cicli; con N ≥ 4 chiude con lo scarico', () => {
    expect(sequenzaPreservazione(3)).toEqual([77, 82, 82]);
    expect(sequenzaPreservazione(4)).toEqual([77, 82, 82, 'S']);
    expect(sequenzaPreservazione(5)).toEqual([77, 82, 82, 82, 'S']);
    expect(sequenzaPreservazione(6)).toEqual([77, 82, 82, 82, 82, 'S']);
    expect(sequenzaPreservazione(7)).toEqual([77, 82, 82, 82, 82, 82, 'S']);
    expect(sequenzaPreservazione(8)).toEqual([77, 82, 82, 82, 'S', 77, 82, 'S']);
    expect(sequenzaPreservazione(11)).toEqual([77, 82, 82, 82, 'S', 77, 82, 82, 82, 82, 'S']);
  });
});

// §12.5 e §12.6
describe('trasformazione del Blocco 3 (§4.3, v2: nessuna serie tolta)', () => {
  const settimana = generaSettimana(par, profilo, 3);
  // Esercizi di Fase 1 (gli slot presenti solo dalla Fase 2, come gli affondi, sono esclusi).
  const f1 = settimana.sessioni.map((s, g) => eserciziPerFase(s, settimana.contenitore.sessioni[g], 'fase1', par));
  const sc = settimana.sessioni.map((s, g) => eserciziPerFase(s, settimana.contenitore.sessioni[g], 'scarico', par));
  const test = testDalProfilo(carichi);

  it('fondamentali: squat 90 → 3x5@69.5 (77), 3x4@74 (82); panca/stacco 101,5 → 78 · 83; scarico come il blocco (3x4@69.5)', () => {
    const pr = (lista: EsercizioSeduta[], ciclo: 77 | 82 | 'S', id: string) => {
      const es = trasformaPreservazione(lista, ciclo).find((e) => e.esercizio_id === id)!;
      const fase = ciclo === 77 ? 'fase1' : ciclo === 82 ? 'fase2' : 'scarico';
      const p = prescrizione(es, { fase, cicloFase: 1 }, test, imp);
      return `${p.serie}x${p.rip}@${p.kg}`;
    };
    expect(pr(f1[1], 77, 'squat')).toBe('3x5@69.5');
    expect(pr(f1[1], 82, 'squat')).toBe('3x4@74');
    expect(pr(sc[1], 'S', 'squat')).toBe('3x4@69.5');
    expect(pr(f1[3], 77, 'panca_piana')).toBe('3x5@78');
    expect(pr(f1[3], 82, 'stacco_da_terra')).toBe('3x4@83');
    expect(pr(sc[3], 'S', 'panca_piana')).toBe('3x4@78');
  });

  it('Fase 1 W1: 97 serie nel riferimento; dopo la trasformazione restano tutte le serie degli esercizi tenuti (via solo rest-pause, ×12, back-off)', () => {
    const originali = f1.reduce((a, s) => a + contaSerie(s), 0);
    expect(originali).toBe(97);
    const tolte = f1.flat().filter((e) => e.rest_pause || e.seconda_riga || e.senza_carico || e.back_off);
    const serieTolte = tolte.reduce((a, e) => a + contaSerie([e]), 0);
    // T alto: la scala per tempo non interviene.
    const trasformate = f1.map((s) => trasformaPreservazione(s, 77, { T: 120, recuperi: RECUPERI_DEFAULT }));
    const dopo = trasformate.reduce((a, s) => a + contaSerie(s), 0);
    expect(dopo).toBe(originali - serieTolte);
    for (const [g, s] of trasformate.entries()) {
      expect(s.some((e) => e.rest_pause || e.seconda_riga || e.senza_carico || e.back_off)).toBe(false);
      for (const e of s) {
        const orig = f1[g].find((o) => o.slot === e.slot)!;
        if (e.ruolo === 'R1' || e.ruolo === 'L') {
          expect(e.serie).toBe(3);
          continue;
        }
        if (e.ruolo === 'AB') continue; // addome invariato (dalle tabelle)
        // Stesse serie dell'originale in Fase 1; Target e fondamentali mai sotto 3.
        expect(e.serie, e.esercizio_id).toBe(contaSerie([orig]));
        if (e.ruolo === 'R2' || e.ruolo === 'R3') expect(e.serie, e.esercizio_id).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('Target: reps di Fase 1 nel ciclo 77 e di Fase 2 nel ciclo 82, serie del blocco; carico corrente del profilo', () => {
    const t77 = trasformaPreservazione(f1[0], 77).find((e) => e.esercizio_id === 'spinte_manubri_seduto')!;
    const t82 = trasformaPreservazione(f1[0], 82).find((e) => e.esercizio_id === 'spinte_manubri_seduto')!;
    expect([t77.serie, t77.rip]).toEqual([3, 8]);
    expect([t82.serie, t82.rip]).toEqual([3, 9]);
    expect(prescrizione(t77, { fase: 'fase1', cicloFase: 1 }, test, imp).kg).toBe(20);
    expect(test.push_down_corda.kg).toBe(42.5);
  });

  it('opzioni: preferisci macchine sostituisce i multiarticolari liberi non fondamentali; resistenza aggiunge 2×18 in coda', () => {
    const s = trasformaPreservazione(f1[0], 77, { preferisciMacchine: true, resistenza: true });
    const ultimo = s[s.length - 1];
    expect(ultimo.resistenza).toBe(true);
    expect([ultimo.serie, ultimo.rip]).toEqual([2, 18]);
    const kgRes = prescrizione(ultimo, { fase: 'fase1', cicloFase: 1 }, { ...test, [ultimo.esercizio_id]: { esercizio_id: ultimo.esercizio_id, kg: 40, rip: 14, modo: 'serie_unica' } }, imp).kg;
    expect(kgRes).toBe(Math.round(((40 * 22) / 23) * 2) / 2);
    expect(trasformaPreservazione(sc[0], 'S', { resistenza: true }).some((e) => e.resistenza)).toBe(false);
  });
});

// §12.7: scala per tempo
describe('scala per tempo (§4.7)', () => {
  const settimana = generaSettimana(par, profilo, 3);
  const giornoC = trasformaPreservazione(eserciziPerFase(settimana.sessioni[2], settimana.contenitore.sessioni[2], 'fase1', par), 77);
  const durataMin = (es: EsercizioSeduta[]) => durataStimata(es.map((e) => ({ ruolo: e.ruolo, serie: e.serie ?? 3, superserie: e.superserie })), RECUPERI_DEFAULT) / 60;

  it('con durata ≤ T non cambia nulla', () => {
    const r = scalaPerTempo(giornoC, 120, RECUPERI_DEFAULT);
    expect(r.passi).toEqual([]);
    expect(r.esercizi).toEqual(giornoC);
  });

  it('T = 60 e seduta oltre T: prima i complementari dal 2° gruppo a 2 serie; Target e fondamentali restano a ≥ 3; il primo gruppo resta com’è', () => {
    expect(durataMin(giornoC)).toBeGreaterThan(60);
    const r = scalaPerTempo(giornoC, 60, RECUPERI_DEFAULT);
    expect(r.passi.length).toBeGreaterThan(0);
    const primoGruppo = giornoC[0].gruppo;
    for (const e of r.esercizi) {
      if (e.ruolo === 'R1' || e.ruolo === 'R2' || e.ruolo === 'R3') expect(e.serie, e.esercizio_id).toBeGreaterThanOrEqual(3);
      if (e.ruolo === 'AB') expect(e.serie).toBe(giornoC.find((o) => o.slot === e.slot)!.serie);
      if (e.gruppo === primoGruppo && e.ruolo === 'C') expect(e.serie).toBe(giornoC.find((o) => o.slot === e.slot)!.serie);
    }
    expect(r.esercizi.some((e) => e.ruolo === 'C' && e.gruppo !== primoGruppo && e.serie === 2)).toBe(true);
    expect(r.durataS).toBeLessThanOrEqual(durataMin(giornoC) * 60);
  });

  it('se non basta, toglie un complementare di un gruppo con ≥ 3 esercizi e riporta gli altri alle serie originali; mai sotto 2 esercizi per gruppo', () => {
    // Seduta costruita: petto con 3 complementari a 3 serie e un Target, limite molto basso.
    const es: EsercizioSeduta[] = [
      { slot: 0, esercizio_id: 'panca_piana', ruolo: 'R1', gruppo: 'petto', tabella: 'B3_F', serie: 3, rip: 5, serie_fisse: true },
      { slot: 1, esercizio_id: 'croci_manubri', ruolo: 'C', gruppo: 'petto', serie: 3, rip: 10 },
      { slot: 2, esercizio_id: 'croci_cavi', ruolo: 'C', gruppo: 'petto', serie: 3, rip: 10 },
      { slot: 3, esercizio_id: 'pec_deck', ruolo: 'C', gruppo: 'petto', serie: 3, rip: 10 },
      { slot: 4, esercizio_id: 'curl_ez', ruolo: 'C', gruppo: 'bicipiti', serie: 4, rip: 8 },
      { slot: 5, esercizio_id: 'curl_manubri', ruolo: 'C', gruppo: 'bicipiti', serie: 4, rip: 8 },
    ];
    const r = scalaPerTempo(es, 20, RECUPERI_DEFAULT);
    // Bicipiti (2° gruppo, 2 esercizi): scendono a 2 serie ma nessuno viene tolto (mai sotto 2 esercizi).
    const bic = r.esercizi.filter((e) => e.gruppo === 'bicipiti');
    expect(bic.length).toBe(2);
    expect(bic.every((e) => e.serie === 2)).toBe(true);
    // Petto (4 esercizi): tolto l'ultimo complementare, gli altri tornano a 3 serie.
    expect(r.esercizi.filter((e) => e.gruppo === 'petto').length).toBe(3);
    expect(r.esercizi.find((e) => e.esercizio_id === 'pec_deck')).toBeUndefined();
    expect(r.esercizi.filter((e) => e.gruppo === 'petto' && e.ruolo === 'C').every((e) => e.serie === 3)).toBe(true);
    expect(r.esercizi.find((e) => e.ruolo === 'R1')!.serie).toBe(3);
  });
});

describe('blocco Preservazione e cambio obiettivo (§6, §7, §12.8)', () => {
  it('nuovoBloccoPreservazione: 4 cicli senza test → 16 sedute, cicli 77/82/82/S, carichi dal profilo, scarico = scarico del blocco', () => {
    const b = nuovoBloccoPreservazione(par, { ...profilo, carichi, obiettivoAttivo: { tipo: 'definizione', dal: oggi, settimane: 4, energia: 'deficit' } }, 4, false, 2);
    expect(b.sedute.length).toBe(16);
    expect(b.stato).toBe('in_corso');
    expect(b.modulo).toBe('preservazione');
    expect([1, 5, 9, 13].map((n) => b.sedute[n - 1].cicloTipo)).toEqual([77, 82, 82, 'S']);
    expect(b.sedute[12].fase).toBe('scarico');
    expect(b.test.squat.rm1).toBe(90);
    expect(b.tappe?.[0].cicliPreservazione).toEqual([77, 82, 82, 'S']);
    // Nessuna tecnica nei cicli di lavoro.
    for (const s of b.sedute.filter((x) => x.fase !== 'scarico')) expect(s.esercizi.some((e) => e.rest_pause || e.seconda_riga)).toBe(false);
    // Lo scarico è quello del Blocco 3 (rest-pause → 2×12, seconde righe assenti, fondamentali 3×4).
    const scarico = b.sedute[12];
    expect(scarico.esercizi.some((e) => e.seconda_riga)).toBe(false);
    expect(scarico.esercizi.find((e) => e.ruolo === 'R1')).toBeUndefined(); // giorno A: nessun fondamentale
    expect(b.sedute[13].esercizi.find((e) => e.esercizio_id === 'squat')?.serie).toBe(undefined);
  });

  it('Massa → Dimagrimento a metà blocco: carichi intatti, sedute passate intatte, prima seduta nuova = ciclo ponte', () => {
    const massa = nuovoBlocco(par, profilo, 1);
    massa.test = testDalProfilo(carichi);
    for (const s of massa.sedute) if (s.ciclo <= 3) s.stato = 'completata';
    massa.sedute[12].stato = 'in_corso'; // ciclo 4, giorno 1
    const esito = cambiaObiettivo(massa, { ...profilo, carichi, parametri: par }, { tipo: 'definizione', dal: oggi, settimane: 4, energia: 'deficit' });
    expect(esito.chiuso.sedute.filter((s) => s.stato === 'completata').length).toBe(12);
    expect(esito.chiuso.sedute.every((s) => s.ciclo <= 4)).toBe(true);
    expect(esito.chiuso.test).toEqual(massa.test);
    expect(esito.nuovo.modulo).toBe('preservazione');
    expect(esito.nuovo.sedute[0].cicloTipo).toBe('ponte');
    expect(esito.nuovo.sedute[0].fase).toBe('fase1');
    expect(esito.nuovo.test.panca_piana.rm1).toBe(101.5);
    expect(esito.nuovo.sedute.some((s) => s.fase === 'test')).toBe(false);
  });

  it('Dimagrimento → Massa con carichi recenti: nessun test, ciclo ponte; senza carichi recenti: test', () => {
    const pres = nuovoBloccoPreservazione(par, { ...profilo, carichi }, 4, false, 2);
    for (const s of pres.sedute) if (s.ciclo <= 4) s.stato = 'completata';
    const esito = cambiaObiettivo(pres, { ...profilo, carichi, parametri: par }, { tipo: 'massa', dal: oggi, settimane: 17, energia: 'surplus' });
    expect(esito.nuovo.modulo).toBe('ipertrofia');
    expect(esito.nuovo.sedute.some((s) => s.fase === 'test')).toBe(false);
    expect(esito.nuovo.sedute[0].cicloTipo).toBe('ponte');
    expect(esito.nuovo.sedute[0].numero).toBe(1);
    const vecchi: Record<string, CaricoProfilo> = Object.fromEntries(Object.entries(carichi).map(([k, v]) => [k, { ...v, data: '2025-01-01' }]));
    expect(carichiRecenti(vecchi)).toBe(false);
    const esito2 = cambiaObiettivo(pres, { ...profilo, carichi: vecchi, parametri: par }, { tipo: 'massa', dal: oggi, settimane: 17, energia: 'surplus' });
    expect(esito2.nuovo.sedute.some((s) => s.fase === 'test')).toBe(true);
    expect(serveTest(esito2.nuovo, vecchi)).toBe(true);
  });

  it('proponiPiano: dimagrimento 4 → tappa preservazione (+ test se mancano i carichi); mantenimento → blocco accorciato; massa → blocchi', () => {
    const d = proponiPiano({ obiettivo: 'definizione', settimane: 4, N: 4, carichiRecenti: true });
    expect(d[0].tappe?.map((t) => t.modulo)).toEqual(['preservazione']);
    expect(d[0].tappe?.[0].cicliPreservazione).toEqual([77, 82, 82, 'S']);
    const d2 = proponiPiano({ obiettivo: 'definizione', settimane: 4, N: 4 });
    expect(d2[0].tappe?.[0].modulo).toBe('test');
    const m = proponiPiano({ obiettivo: 'mantenimento', settimane: 12, N: 4 });
    expect(m[0].blocchi[0].cicli).toEqual({ test: 1, fase1: 5, fase2: 5, scarico: 1 });
    // v2 §6b: piano su misura, una tappa per segmento (T F1×5 F2×5 S F3×5).
    const ma = proponiPiano({ obiettivo: 'massa', settimane: 17, N: 4 });
    expect(ma[0].tappe?.map((t) => t.fase)).toEqual(['test', 'fase1', 'fase2', 'scarico', 'fase3']);
    expect(ma[0].tappe?.map((t) => t.modulo)).toEqual(['test', 'ipertrofia', 'ipertrofia', 'scarico', 'ipertrofia']);
  });
});

// §12.9: la progressione dipende dal numero di seduta, non dalla data.
describe('ciclo ≠ settimana di calendario (§5)', () => {
  it('con 3 sedute fatte in una settimana la quarta è la prima della settimana dopo e il ciclo non cambia', () => {
    const b = nuovoBlocco(par, profilo, 1);
    for (const s of b.sedute) if (s.fase === 'test') s.stato = 'completata';
    const lavoro = b.sedute.filter((s) => s.fase !== 'test');
    // Settimana 1: sedute 1–3; settimana 2: seduta 4 (giorno D del ciclo 1) e poi 5–7.
    const date = ['2026-11-02', '2026-11-04', '2026-11-06', '2026-11-09', '2026-11-11', '2026-11-13', '2026-11-16'];
    lavoro.slice(0, 7).forEach((s, i) => { s.stato = 'completata'; s.data = date[i]; });
    expect(lavoro[3].giorno).toBe(4);
    expect(lavoro[3].ciclo).toBe(lavoro[0].ciclo);
    expect(lavoro[4].ciclo).toBe(lavoro[0].ciclo + 1);
    expect(lavoro[4].cicloFase).toBe(2);
    const prossima = b.sedute.find((s) => s.stato !== 'completata')!;
    expect(prossima.numero).toBe(lavoro[7].numero);
  });
});
