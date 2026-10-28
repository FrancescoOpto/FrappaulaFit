import type { CaricoCorrente, EsercizioSeduta, Fase, Impostazioni, RisultatoTest, Ruolo, Seduta, TestMode } from '../tipi';
import { ESECUZIONE_SERIE_S, FATTORE_LAVORO_DEFAULT, RISCALDAMENTO_S, SCALE_RM, TABELLE, type SerieRip } from '../data/tabelle';
import { ESERCIZI_PER_ID } from '../data/esercizi';
import { arrotonda, caricoRM, rm1DaTest } from './carichi';
import { applicaCorrente } from './correnti';

export interface Prescrizione {
  serie: number;
  rip: number;
  /** Carico previsto; undefined se manca il test o se siamo nella fase di test. */
  kg?: number;
  /** n della scala RM (solo R1/L). */
  scalaRM?: number;
  /** Testo da mostrare nella fase di test. */
  testo?: string;
  /** Solo fase di test: tipo di test dell'esercizio. */
  modoTest?: TestMode;
  /** Carico del piano (test + scala RM), senza il carico corrente scelto dall'utente (SPEC §9.2b). */
  kgPiano?: number;
  /** Carico corrente applicato, se presente. */
  corrente?: CaricoCorrente;
}

/** Tipo di test (TEST_INIZIO_BLOCCO §2): stima per i fondamentali permanenti e per i promossi, serie unica per gli altri. */
export function modoTest(es: Pick<EsercizioSeduta, 'esercizio_id' | 'ruolo'>, promossi: string[] = []): TestMode {
  const def = ESERCIZI_PER_ID[es.esercizio_id];
  if (def?.fondamentale || promossi.includes(es.esercizio_id) || es.ruolo === 'R1' || es.ruolo === 'L') return 'stima';
  return 'serie_unica';
}

/** N della serie unica di test = ripetizioni di lavoro della Fase 1 + 2, limitato a 10–14 (TEST_INIZIO_BLOCCO §2.2). */
export function ripetizioniTest(es: EsercizioSeduta): 10 | 12 | 14 {
  if (es.ruolo === 'R1' || es.ruolo === 'L') return 10;
  const rip = serieRip(es.ruolo, 'fase1', 1, es)[1] + 2;
  const n = Math.min(14, Math.max(10, rip));
  return (n % 2 === 1 ? n + 1 : n) as 10 | 12 | 14;
}

/** Serie × rip per ruolo, fase e ciclo (SPEC §7). Per C usa i valori dello slot con le regole di fase. */
export function serieRip(ruolo: Ruolo, fase: Exclude<Fase, 'test'>, cicloFase: number, slot?: { serie?: number; rip?: number }): SerieRip {
  if (ruolo === 'C') {
    const serie = slot?.serie ?? 3;
    const rip = slot?.rip ?? 10;
    switch (fase) {
      // Complementari: serie×rip dello slot, invariati in Fase 1–3 (Blocco 2 giorno A: nessun +1 in Fase 2);
      // in scarico una serie in meno (min 2), ripetizioni invariate.
      case 'fase1':
      case 'fase2':
      case 'fase3':
        return [serie, rip];
      case 'scarico':
        return [Math.max(2, serie - 1), rip];
    }
  }
  const tab = TABELLE[ruolo][fase];
  const idx = Math.min(Math.max(cicloFase, 1), tab.length) - 1;
  return tab[idx];
}

/** n della scala RM per R1/L (SPEC §6.3). */
export function scalaRM(ruolo: 'R1' | 'L', fase: Exclude<Fase, 'test'>, cicloFase: number): number {
  const sc = SCALE_RM[ruolo][fase];
  return sc[Math.min(Math.max(cicloFase, 1), sc.length) - 1];
}

/** 1RM di un risultato di test di un fondamentale (usa rm1 salvato o lo stima). */
export function rm1DiTest(t: RisultatoTest | undefined): number | undefined {
  if (!t) return undefined;
  if (t.rm1) return t.rm1;
  if (t.kg > 0 && t.rip > 0) return rm1DaTest(t.kg, t.rip);
  return undefined;
}

/**
 * Prescrizione di un esercizio in una seduta: serie, rip e carico (SPEC §6–§7).
 * `correzione` è la frazione di autocorrezione sul carico dell'esercizio (es. −0,025).
 */
export function prescrizione(
  es: EsercizioSeduta,
  seduta: Pick<Seduta, 'fase' | 'cicloFase'>,
  test: Record<string, RisultatoTest>,
  impostazioni: Pick<Impostazioni, 'arrotondamento' | 'fattore_lavoro'>,
  correzione = 0,
  promossi: string[] = [],
  corrente?: CaricoCorrente,
): Prescrizione {
  const t = test[es.esercizio_id];

  if (seduta.fase === 'test') {
    const modo = modoTest(es, promossi);
    if (modo === 'stima') {
      return { serie: 1, rip: 1, kg: t?.rm1, modoTest: 'stima', testo: 'Stima del massimale: inserisci ripetizioni e carico di una prova (consigliate 3–5 ripetizioni)' };
    }
    const rip = ripetizioniTest(es);
    return { serie: 1, rip, kg: t?.kg, modoTest: 'serie_unica', testo: `Serie unica a ${rip}RM: il peso più alto con cui riesci a fare ${rip} ripetizioni` };
  }

  const [serie, rip] = serieRip(es.ruolo, seduta.fase, seduta.cicloFase, es);
  const passo = impostazioni.arrotondamento;

  if (es.ruolo === 'R1' || es.ruolo === 'L') {
    const n = scalaRM(es.ruolo, seduta.fase, seduta.cicloFase);
    const rm1 = rm1DiTest(t);
    // Carico RM = fattore di lavoro × massimale stimato × (37−n)/36 (blocco2_giorno_B.md §3).
    const fattore = impostazioni.fattore_lavoro ?? FATTORE_LAVORO_DEFAULT;
    const kgPiano = rm1 ? caricoRM(rm1 * fattore * (1 + correzione), n, passo) : undefined;
    return { serie, rip, kg: applicaCorrente(es.ruolo, kgPiano, corrente, passo), kgPiano, scalaRM: n, corrente };
  }

  // R2, R3, C, AB: carico fisso del test per tutto il blocco (SPEC §6.3), salvo carico corrente scelto dall'utente (§9.2b).
  const kgPiano = t && t.kg > 0 ? arrotonda(t.kg * (1 + correzione), passo) : undefined;
  return { serie, rip, kg: applicaCorrente(es.ruolo, kgPiano, corrente, passo), kgPiano, corrente };
}

/** Durata stimata in secondi (SPEC §9.5): riscaldamento + Σ serie × (45 s + recupero); superserie condividono il recupero. */
export function durataStimata(
  esercizi: { ruolo: Ruolo; serie: number; superserie?: string }[],
  recuperi: Record<Ruolo, number>,
): number {
  let tot = RISCALDAMENTO_S;
  const superserieViste = new Map<string, number>();
  for (const e of esercizi) {
    if (e.superserie) {
      // Ogni giro di superserie: esecuzioni di tutti gli esercizi + un recupero. Si conta al primo esercizio del gruppo.
      const giri = superserieViste.get(e.superserie);
      if (giri === undefined) {
        superserieViste.set(e.superserie, e.serie);
        tot += e.serie * (ESECUZIONE_SERIE_S + recuperi[e.ruolo]);
      } else {
        tot += e.serie * ESECUZIONE_SERIE_S;
      }
    } else {
      tot += e.serie * (ESECUZIONE_SERIE_S + recuperi[e.ruolo]);
    }
  }
  return tot;
}

export function minuti(secondi: number): number {
  return Math.round(secondi / 60);
}
