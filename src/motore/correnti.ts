import type { CaricoCorrente, Ruolo } from '../tipi';
import { arrotonda } from './carichi';

// Carichi correnti (SPEC §9.2b): ciò che l'utente scrive in seduta vale anche per le sedute successive.
// Ruoli a carico fisso: si salva il kg. Fondamentali con scala RM: si salva il fattore kg_inseriti / kg_previsti,
// così la progressione di fase continua dal livello scelto. Funzioni pure, testate in correnti.test.ts.

export function ruoloAScala(ruolo: Ruolo): boolean {
  return ruolo === 'R1' || ruolo === 'L';
}

/**
 * Nuovo carico corrente dopo un inserimento dell'utente. `kgPiano` è il carico del piano (test + scala RM),
 * senza carico corrente. Ritorna undefined se l'inserimento coincide con il piano (si torna al piano).
 */
export function nuovoCaricoCorrente(ruolo: Ruolo, kgInserito: number, kgPiano: number | undefined, sedutaId?: string): CaricoCorrente | undefined {
  if (!Number.isFinite(kgInserito) || kgInserito < 0) return undefined;
  const aggiornato = new Date().toISOString();
  if (ruoloAScala(ruolo) && kgPiano && kgPiano > 0) {
    const fattore = Math.round((kgInserito / kgPiano) * 1000) / 1000;
    if (fattore === 1) return undefined;
    return { fattore, aggiornato, seduta_id: sedutaId };
  }
  if (kgPiano !== undefined && kgInserito === kgPiano) return undefined;
  return { kg: kgInserito, aggiornato, seduta_id: sedutaId };
}

/** Applica il carico corrente al carico del piano. */
export function applicaCorrente(ruolo: Ruolo, kgPiano: number | undefined, corrente: CaricoCorrente | undefined, passo: number): number | undefined {
  if (!corrente) return kgPiano;
  if (ruoloAScala(ruolo)) {
    if (kgPiano === undefined) return corrente.kg;
    return corrente.fattore ? arrotonda(kgPiano * corrente.fattore, passo) : kgPiano;
  }
  return corrente.kg ?? kgPiano;
}
