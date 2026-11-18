import type { Blocco, Intensita, Modulo, Ruolo, Seduta } from '../tipi';
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

export function infoCiclo(b: Pick<Blocco, 'sedute' | 'numero' | 'modulo'> & Partial<Pick<Blocco, 'parametri'>>, s: Pick<Seduta, 'fase' | 'ciclo' | 'cicloFase' | 'cicloTipo' | 'bloccoRif'> & Partial<Pick<Seduta, 'modulo'>>): InfoCiclo {
  const lavoro = cicliLavoro(b);
  const cicloN = lavoro.length;
  const cicloK = Math.max(1, lavoro.indexOf(s.ciclo) + 1);
  const ponte = s.cicloTipo === 'ponte' ? ' · ponte' : '';
  // Profilo donna a sedute ibride (§12b): l'obiettivo al posto del blocco.
  const ibrido = b.parametri?.obiettivoIbrido;
  if (ibrido) {
    const nome = ibrido === 'definizione' ? 'Dimagrimento' : 'Costruzione';
    const eyebrow = ibrido === 'definizione' ? 'DIMAGRIMENTO' : 'MANTENIMENTO E COSTRUZIONE';
    if (s.fase === 'test') return { eyebrow, titolo: 'Sedute di test', testata: `${nome} · Test`, cicloK: 0, cicloN };
    const titolo = s.fase === 'scarico' ? 'Scarico' : `${NOMI_FASI[s.fase]} · Ciclo ${s.cicloFase}${ponte}`;
    return { eyebrow, titolo, testata: `${nome} · ${titolo}`, cicloK, cicloN };
  }
  if (b.modulo === 'preservazione') {
    // Rientro (§4.3): 3 cicli di Fase 1 del Blocco 1 prima della Preservazione, contati a parte.
    const rientro = b.sedute.filter((x) => x.modulo === 'rientro');
    if (s.modulo === 'rientro') {
      const nR = new Set(rientro.map((x) => x.ciclo)).size;
      const titolo = `Fase 1 · Ciclo ${s.cicloFase} di ${nR}`;
      return { eyebrow: 'RIENTRO · BLOCCO 1', titolo, testata: `Rientro · ${titolo}`, cicloK: s.cicloFase, cicloN: nR };
    }
    if (rientro.length) {
      const cicliR = new Set(rientro.map((x) => x.ciclo));
      const lavoroP = lavoro.filter((c) => !cicliR.has(c));
      const k = Math.max(1, lavoroP.indexOf(s.ciclo) + 1);
      const eyebrowP = NOMI_MODULO.preservazione.toUpperCase();
      if (s.fase === 'test') return { eyebrow: eyebrowP, titolo: 'Test', testata: `${NOMI_MODULO.preservazione} · Test`, cicloK: 0, cicloN: lavoroP.length };
      const titoloP = s.fase === 'scarico' ? `Scarico · Ciclo ${k} di ${lavoroP.length}` : `Ciclo ${k} di ${lavoroP.length}${ponte}`;
      return { eyebrow: eyebrowP, titolo: titoloP, testata: `${NOMI_MODULO.preservazione} · ${titoloP}`, cicloK: k, cicloN: lavoroP.length };
    }
    const eyebrow = NOMI_MODULO.preservazione.toUpperCase();
    if (s.fase === 'test') return { eyebrow, titolo: 'Test', testata: `${NOMI_MODULO.preservazione} · Test`, cicloK: 0, cicloN };
    const titolo = s.fase === 'scarico' ? `Scarico · Ciclo ${cicloK} di ${cicloN}` : `Ciclo ${cicloK} di ${cicloN}${ponte}`;
    return { eyebrow, titolo, testata: `${NOMI_MODULO.preservazione} · ${titolo}`, cicloK, cicloN };
  }
  const nBlocco = s.bloccoRif ?? b.numero;
  const eyebrow = `BLOCCO ${nBlocco}${b.modulo === 'mantenimento' ? ' · MANTENIMENTO' : ''}`;
  if (s.fase === 'test') return { eyebrow, titolo: 'Settimana di test', testata: `Blocco ${nBlocco} · Test`, cicloK: 0, cicloN };
  const titolo = s.fase === 'scarico' ? 'Scarico' : `${NOMI_FASI[s.fase]} · Ciclo ${s.cicloFase}${ponte}`;
  return { eyebrow, titolo, testata: `Blocco ${nBlocco} · ${titolo}`, cicloK, cicloN };
}

/**
 * Istruzione di sforzo per ruolo e intensità (SPEC_PIANIFICATORE v2 §6c): cambia solo il testo, mai i carichi.
 * In Preservazione i fondamentali restano al 77/82 % mai a cedimento.
 */
export function sforzoPer(ruolo: Ruolo, intensita: Intensita = 'standard', modulo?: Modulo): string {
  const fondamentale = ruolo === 'R1' || ruolo === 'L';
  if (fondamentale) return modulo === 'preservazione' ? 'percentuale del massimale, mai a cedimento (circa 8 su 10)' : intensita === 'moderata' ? '2–3 ripetizioni di riserva, mai a cedimento' : 'circa 2 ripetizioni di riserva, mai a cedimento (sforzo 8 su 10)';
  if (ruolo === 'AB') return 'controllato, fino quasi al cedimento sull’ultima serie';
  if (intensita === 'moderata') return '2–3 ripetizioni di riserva su tutte le serie, nessun cedimento';
  if (intensita === 'alta' && ruolo === 'C') return '1–2 ripetizioni di riserva, cedimento sull’ultima serie';
  return ruolo === 'C' ? '1–2 ripetizioni di riserva; cedimento solo se è un isolamento, sull’ultima serie' : '1–2 ripetizioni di riserva, cedimento solo sull’ultima serie';
}
