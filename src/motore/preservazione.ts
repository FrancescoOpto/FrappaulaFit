import type { CicloPreservazione, EsercizioSeduta, Fase, Ruolo } from '../tipi';
import { ESERCIZI, ESERCIZI_PER_ID } from '../data/esercizi';
import { serieRip } from './prescrizione';

// Modulo Preservazione (SPEC_PIANIFICATORE §4.3–4.5): in deficit l'allenamento mantiene il muscolo.
// Nessuna tabella nuova: è una trasformazione delle sessioni del blocco in corso (di norma il Blocco 3).

/** Sequenza dei cicli: scarico ogni 5, chiusura con scarico se N ≥ 4, "77" dopo ogni scarico, altrimenti "82" (§4.4). */
export function sequenzaPreservazione(N: number): CicloPreservazione[] {
  const out: CicloPreservazione[] = [];
  for (let p = 1; p <= N; p++) {
    const precedente = out[out.length - 1];
    if (p % 5 === 0) out.push('S');
    else if (p === N && N >= 4 && precedente !== 'S') out.push('S');
    else if (p === 1 || precedente === 'S') out.push(77);
    else out.push(82);
  }
  return out;
}

export const PERCENTUALI_PRESERVAZIONE: Record<Exclude<CicloPreservazione, 'S'> | 'S', { serie: number; rip: number; pct: number }> = {
  77: { serie: 3, rip: 5, pct: 0.77 },
  82: { serie: 3, rip: 4, pct: 0.82 },
  S: { serie: 2, rip: 4, pct: 0.77 },
};

export function faseDelCiclo(c: CicloPreservazione): Exclude<Fase, 'test'> {
  return c === 77 ? 'fase1' : c === 82 ? 'fase2' : 'scarico';
}

export interface OpzioniPreservazione {
  preferisciMacchine?: boolean;
  resistenza?: boolean;
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
 * Trasforma gli esercizi di Fase 1 di una sessione nel ciclo di Preservazione richiesto.
 * Fondamentali: 3×5 @77 % / 3×4 @82 % / 2×4 @77 %. Target: reps di Fase 1 (77) o Fase 2 (82), serie −1 (min 2).
 * Complementari: serie −1 (min 2). Addome invariato. Tolte seconde righe ×12, rest-pause, back-off.
 * Scarico: non fondamentali −1 serie (min 1).
 */
export function trasformaPreservazione(esercizi: EsercizioSeduta[], ciclo: CicloPreservazione, opzioni: OpzioniPreservazione = {}, esclusi: string[] = []): EsercizioSeduta[] {
  const out: EsercizioSeduta[] = [];
  const fase = faseDelCiclo(ciclo);
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
    // Target e complementari.
    const [serieBase, rip] = e.ruolo === 'C' ? serieRip('C', 'fase1', 1, e) : serieRip(e.ruolo, ciclo === 'S' ? 'fase2' : fase, 1, e);
    let serie = Math.max(2, serieBase - 1);
    if (ciclo === 'S') serie = Math.max(1, serie - 1);
    const ripScelte = e.ruolo === 'C' ? rip : serieRip(e.ruolo, ciclo === 'S' ? 'fase2' : fase, 1, e)[1];
    base = { ...base, serie, rip: ripScelte, serie_fisse: true };
    if (opzioni.preferisciMacchine) {
      const alt = alternativaGuidata(base.esercizio_id, esclusi);
      if (alt) base = { ...base, esercizio_id: alt, eredita_da: base.esercizio_id };
    }
    out.push(base);
  }
  if (opzioni.resistenza && ciclo !== 'S') {
    // Ultimo esercizio: complementare su macchina/cavo, 2 serie da 15–20 ripetizioni a carico leggero (§4.5).
    const candidato = [...out].reverse().find((e) => e.ruolo === 'C' && ['macchina', 'cavo'].includes(ESERCIZI_PER_ID[e.esercizio_id]?.carico_modo));
    if (candidato) out.push({ ...candidato, slot: -100, serie: 2, rip: 18, serie_fisse: true, resistenza: true, rest_pause: undefined });
  }
  return out;
}

/** Serie totali di una lista di esercizi nella fase indicata (tabelle per slot o serie fisse). */
export function contaSerie(esercizi: EsercizioSeduta[], fase: Exclude<Fase, 'test'> = 'fase1'): number {
  return esercizi.reduce((a, e) => a + serieRip(e.ruolo, fase, 1, e)[0], 0);
}
