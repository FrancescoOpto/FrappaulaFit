import type { Blocco, Seduta } from '../tipi';
import { NOMI_FASI } from '../data/tabelle';
import { NOMI_MODULO } from './schermate/Setup';

// Etichette di testata per modulo (SPEC_PIANIFICATORE v2 §11): in Preservazione "Preservazione · Ciclo 3 di 6",
// mai "Blocco 1 · Fase 1"; in Massa "Blocco 1 · Fase 2 · Ciclo 3". Le etichette 77/82/S restano interne.

export interface InfoCiclo {
  /** Nome del modulo in maiuscolo per l'eyebrow ("PRESERVAZIONE", "BLOCCO 1"). */
  eyebrow: string;
  /** Titolo grande ("Ciclo 3 di 6", "Fase 2 · Ciclo 3", "Test"). */
  titolo: string;
  /** Riga unica per le testate di Seduta ed Esercizio. */
  testata: string;
  /** Ciclo corrente e totale, contando solo i cicli di lavoro (test escluso). */
  cicloK: number;
  cicloN: number;
}

/** Cicli di lavoro del blocco (senza la settimana di test), in ordine. */
export function cicliLavoro(b: Pick<Blocco, 'sedute'>): number[] {
  return [...new Set(b.sedute.filter((s) => s.fase !== 'test').map((s) => s.ciclo))].sort((x, y) => x - y);
}

export function infoCiclo(b: Pick<Blocco, 'sedute' | 'numero' | 'modulo'>, s: Pick<Seduta, 'fase' | 'ciclo' | 'cicloFase' | 'cicloTipo'>): InfoCiclo {
  const lavoro = cicliLavoro(b);
  const cicloN = lavoro.length;
  const cicloK = Math.max(1, lavoro.indexOf(s.ciclo) + 1);
  const ponte = s.cicloTipo === 'ponte' ? ' · ponte' : '';
  if (b.modulo === 'preservazione') {
    const eyebrow = NOMI_MODULO.preservazione.toUpperCase();
    if (s.fase === 'test') return { eyebrow, titolo: 'Test', testata: `${NOMI_MODULO.preservazione} · Test`, cicloK: 0, cicloN };
    const titolo = s.fase === 'scarico' ? `Scarico · Ciclo ${cicloK} di ${cicloN}` : `Ciclo ${cicloK} di ${cicloN}${ponte}`;
    return { eyebrow, titolo, testata: `${NOMI_MODULO.preservazione} · ${titolo}`, cicloK, cicloN };
  }
  const eyebrow = `BLOCCO ${b.numero}${b.modulo === 'mantenimento' ? ' · MANTENIMENTO' : ''}`;
  if (s.fase === 'test') return { eyebrow, titolo: 'Settimana di test', testata: `Blocco ${b.numero} · Test`, cicloK: 0, cicloN };
  const titolo = s.fase === 'scarico' ? 'Scarico' : `${NOMI_FASI[s.fase]} · Ciclo ${s.cicloFase}${ponte}`;
  return { eyebrow, titolo, testata: `Blocco ${b.numero} · ${titolo}`, cicloK, cicloN };
}
