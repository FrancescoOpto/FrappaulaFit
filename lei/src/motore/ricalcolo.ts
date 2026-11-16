import { rm1DaTest } from './carichi';

// Ricalcolo del massimale dai carichi reali (SPEC_PIANIFICATORE §7.2, video "Gestione carichi").
// Quando l'utente alza il peso su un fondamentale e completa le ripetizioni, l'app stima un nuovo massimale
// (Brzycki, con il RIR dichiarato) e aggiorna il vigente solo se lo supera di almeno il 2,5 % [Ipotesi sulla soglia].

export const SOGLIA_AGGIORNAMENTO = 0.025;

export function stimaDaSerie(pesoKg: number, ripFatte: number, rir = 0): number {
  const rip = ripFatte + rir;
  if (!(pesoKg > 0) || rip < 1 || rip > 36) return 0;
  return Math.round(rm1DaTest(pesoKg, rip) * 10) / 10;
}

export interface EsitoRicalcolo {
  stima: number;
  vigente?: number;
  aggiorna: boolean;
  perche: string;
}

export function valutaRicalcolo(vigente: number | undefined, pesoKg: number, ripFatte: number, rir = 0, soglia = SOGLIA_AGGIORNAMENTO): EsitoRicalcolo {
  const stima = stimaDaSerie(pesoKg, ripFatte, rir);
  if (!stima) return { stima: 0, vigente, aggiorna: false, perche: 'Serie non valida per la stima.' };
  if (vigente === undefined) return { stima, vigente, aggiorna: true, perche: 'Nessun massimale nel profilo: uso questa serie.' };
  const aggiorna = stima >= vigente * (1 + soglia);
  return {
    stima,
    vigente,
    aggiorna,
    perche: aggiorna
      ? `${pesoKg} kg × ${ripFatte} rip${rir ? ` (+${rir} RIR)` : ''} valgono un massimale di ${stima} kg, oltre il +${soglia * 100} % rispetto a ${vigente}: aggiorno le percentuali delle sedute future.`
      : `${pesoKg} kg × ${ripFatte} rip valgono ${stima} kg: non supera di ${soglia * 100} % il massimale vigente (${vigente}), resta tutto com'è.`,
  };
}
