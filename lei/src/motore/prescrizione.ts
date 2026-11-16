import type { CaricoCorrente, Esercizio, Obiettivo, Riga, RisultatoTest, Seduta, TipoTest, Voce } from '../tipi';
import { ESERCIZI_PER_ID, haCarico } from '../data/esercizi';
import { arrotonda } from './carichi';

// Prescrizione di una voce in una seduta: esercizio, serie, ripetizioni, carico e recupero (docs/PROPOSTA_PROGRAMMA_DONNA.md).
// Carichi: % del massimale per i fondamentali; "n RM" convertiti dal massimale con la tabella % ↔ ripetizioni;
// il carico scelto da lei sostituisce quello del piano mantenendo gli aumenti del libro (rapporto col piano).

/**
 * Quota del massimale per n ripetizioni massime. Fino a 14 Brzycki ((37 − n)/36, la formula già usata nell'app);
 * oltre, la Tab. 2.23 del libro (15–16 rip ≈ 60 %, 17–20 ≈ 55 %, 21–25 ≈ 50 %, oltre 30 ≈ 40 %), interpolata.
 */
export function percentualeRM(n: number): number {
  if (n <= 1) return 1;
  if (n <= 14) return (37 - n) / 36;
  const punti: [number, number][] = [[14, 23 / 36], [16, 0.6], [20, 0.55], [25, 0.5], [30, 0.45], [40, 0.4]];
  for (let i = 1; i < punti.length; i++) {
    const [n1, p1] = punti[i - 1];
    const [n2, p2] = punti[i];
    if (n <= n2) return p1 + ((p2 - p1) * (n - n1)) / (n2 - n1);
  }
  return 0.4;
}

/** Massimale da un test a serie unica: carico a m RM diviso per la sua quota. */
export function massimaleDaSerie(kg: number, m: number): number {
  return kg / percentualeRM(m);
}

/** Tipo di test dell'esercizio: stima per i fondamentali, serie unica se si carica, altrimenti nessuno. */
export function tipoTest(id: string): TipoTest {
  const def = ESERCIZI_PER_ID[id];
  if (!def || def.secondi || !haCarico(id)) return 'nessuno';
  return def.fondamentale ? 'stima' : 'serie_unica';
}

/** Ripetizioni della serie unica di test: quelle di lavoro della prima settimana + 2, tra 10 e 14 (TEST_INIZIO_BLOCCO §2.2). */
export function ripetizioniTest(riga: Riga): 10 | 12 | 14 {
  const n = riga.max ? 14 : Math.min(14, Math.max(10, riga.r + 2));
  return (n % 2 === 1 ? n + 1 : n) as 10 | 12 | 14;
}

/** Esercizio della voce in una fase, con la sostituzione permanente di lei se c'è. */
export function esercizioDi(voce: Voce, faseRif: Seduta['faseRif'], sostituzioni: Record<string, string> = {}): string {
  const base = voce.esercizio[faseRif];
  return sostituzioni[base] ?? base;
}

/** Riga della settimana. Scarico: la prima settimana della fase finita con metà delle serie (minimo 2) [Ipotesi]. */
export function rigaDi(voce: Voce, s: Pick<Seduta, 'fase' | 'faseRif' | 'riga'>): Riga {
  const tab = voce.righe[s.faseRif];
  if (s.fase === 'scarico') return { ...tab[0], s: Math.max(2, Math.floor(tab[0].s / 2)) };
  return tab[Math.min(Math.max(s.riga, 1), tab.length) - 1];
}

/** Esercizio "pesante": fondamentale o con recupero di 2′ o più. In modalità PHA resta a serie normali. */
export function pesante(voce: Voce, faseRif: Seduta['faseRif'], def?: Esercizio): boolean {
  return Boolean(def?.fondamentale) || voce.recupero[faseRif] >= 120;
}

/** Carico del piano (senza il carico scelto da lei) da massimale e riga; il tetto evita carichi impossibili. */
export function caricoPiano(rm1: number | undefined, riga: Riga, passo: number): number | undefined {
  if (!rm1 || rm1 <= 0) return undefined;
  if (riga.pct !== undefined) return arrotonda(rm1 * riga.pct, passo);
  const base = rm1 * percentualeRM(riga.rm ?? riga.r + 2) * (1 + (riga.inc ?? 0));
  // Gli aumenti cumulativi del libro ("+10/15 %") non superano mai il carico da (rip + 1) RM: una ripetizione di riserva. [Ipotesi]
  const tetto = riga.max ? Infinity : rm1 * percentualeRM(riga.r + 1);
  return arrotonda(Math.min(base, tetto), passo);
}

export interface Prescrizione {
  esercizio_id: string;
  serie: number;
  rip: number;
  max: boolean;
  /** Carico da usare (piano o carico scelto da lei); undefined se manca il test e non l'ha ancora scelto. */
  kg?: number;
  /** Carico del piano, per confronto. */
  kgPiano?: number;
  corrente?: CaricoCorrente;
  pct?: number;
  rm?: number;
  recupero: number;
  pesante: boolean;
  secondi: boolean;
  /** Niente kg (banda, corpo libero). */
  senzaCarico: boolean;
}

export interface Contesto {
  test: Record<string, RisultatoTest>;
  carichiCorrenti: Record<string, CaricoCorrente>;
  sostituzioni: Record<string, string>;
  obiettivo: Obiettivo;
  passo: number;
}

export function prescrivi(voce: Voce, s: Pick<Seduta, 'fase' | 'faseRif' | 'riga'>, c: Contesto): Prescrizione {
  const id = esercizioDi(voce, s.faseRif, c.sostituzioni);
  const def = ESERCIZI_PER_ID[id];
  const riga = rigaDi(voce, s);
  const grave = pesante(voce, s.faseRif, def);
  // Dimagrimento: una serie in meno su parte alta e glutei complementari, mai sui pesanti (minimo 2).
  const serie = c.obiettivo === 'definizione' && !grave ? Math.max(2, riga.s - 1) : riga.s;
  const senzaCarico = !haCarico(id);
  const t = c.test[id];
  const kgPiano = senzaCarico ? undefined : caricoPiano(t?.rm1, riga, c.passo);
  const corrente = senzaCarico ? undefined : c.carichiCorrenti[id];
  let kg = kgPiano;
  if (corrente) {
    // Il carico scelto da lei sostituisce il piano mantenendo gli aumenti del libro: kg × (piano oggi / piano allora).
    kg = corrente.rif && kgPiano ? arrotonda(corrente.kg * (kgPiano / corrente.rif), c.passo) : corrente.kg;
  }
  return {
    esercizio_id: id,
    serie,
    rip: riga.r,
    max: Boolean(riga.max),
    kg,
    kgPiano,
    corrente,
    pct: riga.pct,
    rm: riga.rm,
    recupero: voce.recupero[s.faseRif],
    pesante: grave,
    secondi: Boolean(def?.secondi),
    senzaCarico,
  };
}
