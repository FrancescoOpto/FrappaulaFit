import type { CicloPreservazione, EsercizioSeduta, Fase, FaseLavoro, Gruppo, Ruolo } from '../tipi';
import { ESERCIZI, ESERCIZI_PER_ID } from '../data/esercizi';
import { durataStimata, serieRip } from './prescrizione';
import type { TempiCircuito } from '../data/tabelle';

// Modulo Preservazione (SPEC_PIANIFICATORE v2 §4.3–4.5, §4.7): in deficit l'allenamento mantiene il muscolo.
// Nessuna tabella nuova: è una trasformazione delle sessioni del blocco in corso (di norma il Blocco 3).
// v2: niente "serie −1"; stessa struttura e stesse serie del blocco, senza tecniche; la scala per tempo
// di §4.7 interviene solo se la durata stimata supera T.

/**
 * Sequenza dei cicli (§4.4): scarico ogni 5 cicli (posizioni 5, 10, 15…) ma uno scarico intermedio salta
 * se dopo di lui restano 1 o 2 cicli; con N ≥ 4 l'ultimo ciclo è sempre scarico. "77" al primo ciclo e dopo
 * ogni scarico, altrimenti "82". Le etichette sono interne: l'interfaccia non le mostra.
 */
export function sequenzaPreservazione(N: number): CicloPreservazione[] {
  const out: CicloPreservazione[] = [];
  for (let p = 1; p <= N; p++) {
    const precedente = out[out.length - 1];
    if (p === N && N >= 4) out.push('S');
    else if (p % 5 === 0 && N - p >= 3) out.push('S');
    else if (p === 1 || precedente === 'S') out.push(77);
    else out.push(82);
  }
  return out;
}

/** Fondamentali nei cicli di lavoro: 3×5 @77 % e 3×4 @82 %, mai a cedimento, mai sotto 3 serie. */
export const PERCENTUALI_PRESERVAZIONE: Record<77 | 82, { serie: number; rip: number; pct: number }> = {
  77: { serie: 3, rip: 5, pct: 0.77 },
  82: { serie: 3, rip: 4, pct: 0.82 },
};

export function faseDelCiclo(c: CicloPreservazione): Exclude<Fase, 'test'> {
  return c === 77 ? 'fase1' : c === 82 ? 'fase2' : 'scarico';
}

export interface OpzioniPreservazione {
  preferisciMacchine?: boolean;
  resistenza?: boolean;
  /** Tetto di durata in minuti: se la seduta stimata lo supera si applica la scala di §4.7. */
  T?: number;
  recuperi?: Record<Ruolo, number>;
}

function eFondamentale(ruolo: Ruolo): boolean {
  return ruolo === 'R1' || ruolo === 'L';
}

/** Alternativa guidata (macchina/cavo) della stessa classe, per `preferisci_macchine`. */
export function alternativaGuidata(id: string, esclusi: string[] = []): string | undefined {
  const base = ESERCIZI_PER_ID[id];
  if (!base || base.tipo !== 'multi' || base.fondamentale) return undefined;
  if (base.carico_modo === 'macchina' || base.carico_modo === 'cavo') return undefined;
  return ESERCIZI.find((e) => e.classe === base.classe && e.gruppo === base.gruppo && e.id !== id && (e.carico_modo === 'macchina' || e.carico_modo === 'cavo') && !esclusi.includes(e.id))?.id;
}

/**
 * Trasforma gli esercizi di Fase 1 di una sessione nel ciclo di Preservazione richiesto (§4.3, v2).
 * Fondamentali: 3×5 @77 % / 3×4 @82 %. Target e complementari: serie e ripetizioni del blocco di riferimento
 * (Fase 1 nel ciclo "77", Fase 2 nel ciclo "82"), nessuna serie tolta. Addome invariato.
 * Tolte: seconde righe ×12, rest-pause, back-off. Scarico ("S"): gli esercizi passati (quelli dello scarico
 * del blocco) tornano invariati. Se `opzioni.T` è dato, la scala per tempo di §4.7 si applica dopo.
 */
export function trasformaPreservazione(esercizi: EsercizioSeduta[], ciclo: CicloPreservazione, opzioni: OpzioniPreservazione = {}, esclusi: string[] = []): EsercizioSeduta[] {
  if (ciclo === 'S') return esercizi.map((e) => ({ ...e }));
  const out: EsercizioSeduta[] = [];
  const fase = faseDelCiclo(ciclo) as FaseLavoro;
  for (const e of esercizi) {
    if (e.seconda_riga || e.senza_carico || e.rest_pause || e.back_off || e.resistenza) continue;
    let base: EsercizioSeduta = { ...e, rest_pause: undefined, back_off: undefined };
    if (eFondamentale(e.ruolo)) {
      const p = PERCENTUALI_PRESERVAZIONE[ciclo];
      out.push({ ...base, serie: p.serie, rip: p.rip, serie_fisse: true, percentuale: p.pct });
      continue;
    }
    if (e.ruolo === 'AB') {
      out.push(base);
      continue;
    }
    // Target e complementari: serie e rip del blocco nella fase corrispondente, fissate.
    const [serie, rip] = serieRip(e.ruolo, fase, 1, e);
    base = { ...base, serie, rip, serie_fisse: true };
    if (opzioni.preferisciMacchine) {
      const alt = alternativaGuidata(base.esercizio_id, esclusi);
      if (alt) base = { ...base, esercizio_id: alt, eredita_da: base.esercizio_id };
    }
    out.push(base);
  }
  if (opzioni.resistenza) {
    // Ultimo esercizio: complementare su macchina/cavo, 2 serie da 15–20 ripetizioni a carico leggero (§4.5).
    const candidato = [...out].reverse().find((e) => e.ruolo === 'C' && ['macchina', 'cavo'].includes(ESERCIZI_PER_ID[e.esercizio_id]?.carico_modo));
    if (candidato) out.push({ ...candidato, slot: -100, serie: 2, rip: 18, serie_fisse: true, resistenza: true, rest_pause: undefined });
  }
  if (opzioni.T && opzioni.recuperi) return scalaPerTempo(out, opzioni.T, opzioni.recuperi, fase).esercizi;
  return out;
}

/** Serie totali di una lista di esercizi nella fase indicata (tabelle per slot o serie fisse). */
export function contaSerie(esercizi: EsercizioSeduta[], fase: Exclude<Fase, 'test'> = 'fase1'): number {
  return esercizi.reduce((a, e) => a + serieRip(e.ruolo, fase, 1, e)[0], 0);
}

export interface EsitoScala {
  esercizi: EsercizioSeduta[];
  /** Passi applicati, in parole (vuoto se la seduta stava già dentro T). */
  passi: string[];
  durataS: number;
}

const GRUPPI_GRANDI_SCALA: Gruppo[] = ['petto', 'dorso', 'spalle', 'gambe'];

/**
 * Scala per tempo (§4.7): T è un tetto, non un obiettivo. Se la durata stimata è ≤ T non si tocca nulla.
 * Altrimenti, un passo alla volta fino a rientrare:
 * 1. i complementari dei gruppi dal secondo in poi scendono a 2 serie, partendo dall'ultimo gruppo (il primo gruppo resta a 3);
 * 2. si toglie il complementare meno prioritario di un gruppo con almeno 3 esercizi (l'ultimo che non copre un sottogruppo,
 *    altrimenti l'ultimo) e i complementari rimasti di quel gruppo tornano alle serie originali;
 * 3. mai sotto 2 esercizi per gruppo; Target e fondamentali mai sotto 3 serie; addome invariato.
 */
export function scalaPerTempo(esercizi: EsercizioSeduta[], T: number, recuperi: Record<Ruolo, number>, fase: FaseLavoro = 'fase1', copre: (e: EsercizioSeduta) => boolean = () => false, tempi?: TempiCircuito): EsitoScala {
  const limite = T * 60;
  const out: EsercizioSeduta[] = esercizi.map((e) => ({ ...e }));
  const serieDi = (e: EsercizioSeduta) => serieRip(e.ruolo, fase, 1, e)[0];
  const durata = () => durataStimata(out.map((e) => ({ ruolo: e.ruolo, serie: serieDi(e), superserie: e.superserie, circuito: e.circuito })), recuperi, tempi);
  const passi: string[] = [];
  if (durata() <= limite) return { esercizi: out, passi, durataS: durata() };

  const originali = new Map<EsercizioSeduta, number>();
  for (const e of out) originali.set(e, e.serie ?? serieDi(e));
  const gruppi: Gruppo[] = [];
  for (const e of out) if (!gruppi.includes(e.gruppo)) gruppi.push(e.gruppo);
  // Le stazioni del circuito (§12b) non si toccano: i giri li sceglie l'utente in seduta.
  const riducibile = (e: EsercizioSeduta) => e.ruolo === 'C' && !e.rest_pause && !e.resistenza && !e.circuito && e.gruppo !== 'addome';

  // Passo 1.
  for (let gi = gruppi.length - 1; gi >= 1 && durata() > limite; gi--) {
    let toccato = false;
    for (const e of out) {
      if (e.gruppo === gruppi[gi] && riducibile(e) && serieDi(e) > 2) {
        e.serie = 2;
        toccato = true;
      }
    }
    if (toccato) passi.push(`${gruppi[gi]}: complementari a 2 serie`);
  }
  // Passo 2.
  for (let gi = gruppi.length - 1; gi >= 0 && durata() > limite; gi--) {
    const g = gruppi[gi];
    const delGruppo = () => out.filter((e) => e.gruppo === g);
    const minimo = GRUPPI_GRANDI_SCALA.includes(g) ? 2 : 2;
    if (delGruppo().length < 3 || delGruppo().length - 1 < minimo) continue;
    const complementari = delGruppo().filter(riducibile);
    if (!complementari.length) continue;
    const vittima = [...complementari].reverse().find((e) => !copre(e)) ?? complementari[complementari.length - 1];
    out.splice(out.indexOf(vittima), 1);
    for (const e of delGruppo()) if (riducibile(e)) e.serie = originali.get(e) ?? e.serie;
    passi.push(`${g}: tolto ${vittima.esercizio_id}, gli altri complementari tornano a ${originali.get(complementari[0]) ?? 3} serie`);
  }
  return { esercizi: out, passi, durataS: durata() };
}
