import type { Fase, Obiettivo, OpzionePiano, SegmentoPiano, StatoEnergetico, Tappa } from '../tipi';
import { sequenzaPreservazione } from './preservazione';
import { compongoPiano } from './composizione';
import { FASI_BLOCCO } from '../data/tabelle';

// Pianificatore a obiettivo (SPEC §15) [Ipotesi]: dalle settimane disponibili propone combinazioni di blocchi.
// Solo logica pura; nessuna interfaccia per ora. Le versioni accorciate sono una scelta nostra, non vista
// nell'app di riferimento, e sono marcate `nostraScelta`.

export const SETTIMANE_BLOCCO = FASI_BLOCCO.reduce((a, f) => a + f.cicli, 0); // 17

export function settimaneTra(inizio: Date, obiettivo: Date): number {
  return Math.max(0, Math.floor((obiettivo.getTime() - inizio.getTime()) / (7 * 86_400_000)));
}

function cicliCompleti(): Partial<Record<Fase, number>> {
  const c: Partial<Record<Fase, number>> = {};
  for (const f of FASI_BLOCCO) c[f.fase] = f.cicli;
  return c;
}

/** Blocco accorciato a `settimane` cicli: test 1 + scarico 1 fissi, il resto diviso tra Fase 1 e Fase 2 (senza Fase 3). */
export function bloccoAccorciato(settimane: number): Partial<Record<Fase, number>> | null {
  if (settimane < 6) return null;
  const lavoro = Math.min(settimane - 2, 10);
  const fase1 = Math.ceil(lavoro / 2);
  const fase2 = lavoro - fase1;
  return { test: 1, fase1, fase2, scarico: 1 };
}

export function opzioniPiano(inizio: Date, obiettivo: Date): OpzionePiano[] {
  const W = settimaneTra(inizio, obiettivo);
  const out: OpzionePiano[] = [];
  const nCompleti = Math.floor(W / SETTIMANE_BLOCCO);
  const resto = W - nCompleti * SETTIMANE_BLOCCO;

  if (nCompleti >= 1) {
    out.push({
      id: 'completi',
      titolo: `${nCompleti} ${nCompleti === 1 ? 'blocco completo' : 'blocchi completi'}`,
      settimane: nCompleti * SETTIMANE_BLOCCO,
      blocchi: Array.from({ length: nCompleti }, (_, i) => ({ numero: i + 1, cicli: cicliCompleti() })),
      nostraScelta: false,
      perche: `Ogni blocco dura ${SETTIMANE_BLOCCO} settimane (test, tre fasi, scarico). ${resto ? `Restano ${resto} settimane libere prima dell’obiettivo.` : 'Finisce esattamente all’obiettivo.'}`,
    });
  }
  const breve = bloccoAccorciato(resto);
  if (breve) {
    const settBreve = Object.values(breve).reduce((a, b) => a + (b ?? 0), 0);
    out.push({
      id: 'completi_piu_breve',
      titolo: `${nCompleti ? `${nCompleti} ${nCompleti === 1 ? 'blocco completo' : 'blocchi completi'} + ` : ''}blocco accorciato (${settBreve} settimane)`,
      settimane: nCompleti * SETTIMANE_BLOCCO + settBreve,
      blocchi: [...Array.from({ length: nCompleti }, (_, i) => ({ numero: i + 1, cicli: cicliCompleti() })), { numero: nCompleti + 1, cicli: breve }],
      nostraScelta: true,
      perche: `L’ultimo blocco toglie cicli alle fasi per far cadere lo scarico vicino alla data obiettivo${W - nCompleti * SETTIMANE_BLOCCO - settBreve ? ` (${W - nCompleti * SETTIMANE_BLOCCO - settBreve} settimane libere)` : ''}. Versione nostra, non dell’app di riferimento.`,
    });
  }
  if (!out.length) {
    out.push({
      id: 'troppo_poco',
      titolo: 'Meno di 6 settimane',
      settimane: W,
      blocchi: [],
      nostraScelta: true,
      perche: 'Non basta per un blocco: conviene fare la settimana di test e poi una Fase 1 intera, spostando l’obiettivo.',
    });
  }
  return out;
}

// ---------- Pianificatore a tappe (SPEC_PIANIFICATORE §6) ----------

export const ENERGIA_PER_OBIETTIVO: Record<Obiettivo, StatoEnergetico> = { massa: 'surplus', mantenimento: 'mantenimento', definizione: 'deficit' };

function tappeDaCicli(cicli: Partial<Record<Fase, number>>, obiettivo: Obiettivo, energia: StatoEnergetico, conTest: boolean): Tappa[] {
  const t: Tappa[] = [];
  if (conTest && cicli.test) t.push({ modulo: 'test', obiettivo, cicli: cicli.test, energia });
  const lavoro = (cicli.fase1 ?? 0) + (cicli.fase2 ?? 0) + (cicli.fase3 ?? 0);
  if (lavoro) t.push({ modulo: obiettivo === 'mantenimento' ? 'mantenimento' : 'ipertrofia', obiettivo, cicli: lavoro, energia });
  if (cicli.scarico) t.push({ modulo: 'scarico', obiettivo, cicli: cicli.scarico, energia });
  return t;
}

export interface RichiestaPiano {
  obiettivo: Obiettivo;
  settimane: number;
  N: number;
  /** L'utente ha carichi recenti nel profilo: il test iniziale si può saltare. */
  carichiRecenti?: boolean;
  /** Derivata dall'obiettivo (v2 §1); si può forzare solo per i calcoli. */
  energia?: StatoEnergetico;
  /** Mantenimento: blocco di riferimento di partenza (1 default, 2 alternativa). */
  bloccoBase?: 1 | 2;
}

/** Tappe di un piano composto (§6b): una per segmento, con fase e blocco di riferimento. */
export function tappeDaComposizione(comp: SegmentoPiano[], obiettivo: Obiettivo, energia: StatoEnergetico): Tappa[] {
  return comp.map((s) => ({
    modulo: s.fase === 'test' ? 'test' : s.fase === 'scarico' ? 'scarico' : obiettivo === 'mantenimento' ? 'mantenimento' : 'ipertrofia',
    obiettivo,
    cicli: s.cicli,
    energia,
    fase: s.fase,
    bloccoRif: s.bloccoRif,
  }));
}

const NOME_FASE_BREVE: Record<string, string> = { fase1: 'volume (Fase 1)', fase2: 'ripetizioni (Fase 2)', fase3: 'intensità (Fase 3)' };

function percheComposizione(comp: SegmentoPiano[], obiettivo: Obiettivo, conTest: boolean): string {
  const lavoro = comp.filter((s) => s.fase !== 'test' && s.fase !== 'scarico');
  const fasi = [...new Set(lavoro.map((s) => s.fase))].map((f) => NOME_FASE_BREVE[f]).join(', ');
  const blocchi = [...new Set(comp.map((s) => s.bloccoRif))];
  const parti: string[] = [];
  parti.push(`${lavoro.length === 1 ? 'Una sola fase' : `Fasi: ${fasi}`}, con i mattoni del Blocco ${blocchi.join(' poi del Blocco ')}.`);
  const scarichi = comp.filter((s) => s.fase === 'scarico').length;
  if (!scarichi) parti.push('Sotto i 6 cicli non c’è scarico: non serve.');
  else if (comp[comp.length - 1].fase === 'scarico') parti.push(scarichi > 1 ? 'Scarico tra le fasi e in chiusura.' : 'Scarico in chiusura.');
  else parti.push(scarichi > 1 ? 'Scarico tra la Fase 2 e la Fase 3 e tra un blocco e l’altro.' : 'Scarico tra la Fase 2 e la Fase 3, come nel blocco di riferimento.');
  parti.push(conTest ? 'Prima una settimana di test per i carichi.' : 'Nessun nuovo test: si usano i carichi del profilo.');
  if (obiettivo === 'mantenimento') parti.push('Senza Fase 3 né tecniche avanzate: a calorie di mantenimento basta per conservare.');
  return parti.join(' ');
}

/** Propone i piani per obiettivo e durata (in cicli). Ogni opzione ha il "perché" e la lista di tappe. */
export function proponiPiano(r: RichiestaPiano): OpzionePiano[] {
  const energia = r.energia ?? ENERGIA_PER_OBIETTIVO[r.obiettivo];
  const conTest = !r.carichiRecenti;
  if (r.obiettivo === 'definizione') {
    const cicli = Math.max(1, Math.round(r.settimane));
    const seq = sequenzaPreservazione(cicli);
    const tappe: Tappa[] = [];
    if (conTest) tappe.push({ modulo: 'test', obiettivo: r.obiettivo, cicli: 1, energia });
    tappe.push({ modulo: 'preservazione', obiettivo: r.obiettivo, cicli, energia, cicliPreservazione: seq, perche: 'In deficit l\u2019allenamento mantiene il muscolo: fondamentali al 77–82 % mai a cedimento, stesse serie del blocco, niente tecniche.' });
    return [{
      id: 'preservazione',
      titolo: `Preservazione · ${cicli} ${cicli === 1 ? 'ciclo' : 'cicli'}${conTest ? ' + test' : ''}`,
      settimane: cicli + (conTest ? 1 : 0),
      blocchi: [],
      nostraScelta: true,
      perche: cicli < 3 ? 'Meno di 3 cicli non valgono la pena: allunga a 4 settimane o più.' : `${seq.filter((c) => c === 'S').length} ${seq.filter((c) => c === 'S').length === 1 ? 'ciclo di scarico' : 'cicli di scarico'}: uno ogni 4 di lavoro e sempre in chiusura. ${conTest ? 'Prima una settimana di test, perché mancano i carichi.' : 'Nessun nuovo test: si usano i carichi del profilo.'}`,
      tappe,
    }];
  }
  if (r.obiettivo === 'mantenimento') {
    const D = Math.max(1, Math.round(r.settimane));
    const comp = compongoPiano(D, conTest, 'mantenimento', r.bloccoBase ?? 1);
    const c: Partial<Record<Fase, number>> = {};
    for (const s of comp) c[s.fase] = (c[s.fase] ?? 0) + s.cicli;
    return [{
      id: 'mantenimento',
      titolo: `Mantenimento · ${D} ${D === 1 ? 'ciclo' : 'cicli'}`,
      settimane: D,
      blocchi: [{ numero: r.bloccoBase ?? 1, cicli: c }],
      nostraScelta: true,
      perche: percheComposizione(comp, 'mantenimento', conTest),
      tappe: tappeDaComposizione(comp, 'mantenimento', energia),
      composizione: comp,
    }];
  }
  // Massa: piano su misura per durata (§6b).
  const D = Math.max(1, Math.round(r.settimane));
  const comp = compongoPiano(D, conTest, 'massa', 1);
  return [{
    id: 'massa',
    titolo: `Massa · ${D} ${D === 1 ? 'ciclo' : 'cicli'}`,
    settimane: D,
    blocchi: [],
    nostraScelta: false,
    perche: percheComposizione(comp, 'massa', conTest),
    tappe: tappeDaComposizione(comp, 'massa', energia),
    composizione: comp,
  }];
}

/** Durata in calendario di un piano: cicli × N sedute / sedute effettive a settimana, in settimane. */
export function settimaneCalendario(cicli: number, N: number, seduteASettimana: number): number {
  return Math.round(((cicli * N) / Math.max(1, seduteASettimana)) * 10) / 10;
}
