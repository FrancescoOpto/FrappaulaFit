import type { EsercizioSeduta, Fase, Impostazioni, RisultatoTest, Ruolo, Seduta } from '../tipi';
import { ESECUZIONE_SERIE_S, RISCALDAMENTO_S, SCALE_RM, TABELLE, type SerieRip } from '../data/tabelle';
import { ESERCIZI_PER_ID } from '../data/esercizi';
import { arrotonda, caricoRM, rm1DaTest } from './carichi';

export interface Prescrizione {
  serie: number;
  rip: number;
  /** Carico previsto; undefined se manca il test o se siamo nella fase di test. */
  kg?: number;
  /** n della scala RM (solo R1/L). */
  scalaRM?: number;
  /** Testo da mostrare nella fase di test (es. "3RM" o "10 rip a cedimento"). */
  testo?: string;
}

/** Serie × rip per ruolo, fase e ciclo (SPEC §7). Per C usa i valori dello slot con le regole di fase. */
export function serieRip(ruolo: Ruolo, fase: Exclude<Fase, 'test'>, cicloFase: number, slot?: { serie?: number; rip?: number }): SerieRip {
  if (ruolo === 'C') {
    const serie = slot?.serie ?? 3;
    const rip = slot?.rip ?? 10;
    switch (fase) {
      case 'fase1':
        return [serie, rip];
      case 'fase2':
        return [serie, rip + 1];
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
  impostazioni: Pick<Impostazioni, 'arrotondamento'>,
  correzione = 0,
): Prescrizione {
  const def = ESERCIZI_PER_ID[es.esercizio_id];
  const t = test[es.esercizio_id];

  if (seduta.fase === 'test') {
    if (es.ruolo === 'R1' || es.ruolo === 'L') {
      return { serie: 1, rip: 3, kg: t?.kg, testo: '3 ripetizioni pulite al cedimento tecnico (3RM)' };
    }
    const rip = def?.ripetizioni_test ?? 10;
    return { serie: 1, rip, kg: t?.kg, testo: `${rip} ripetizioni a cedimento tecnico (RIR 0–1)` };
  }

  const [serie, rip] = serieRip(es.ruolo, seduta.fase, seduta.cicloFase, es);
  const passo = impostazioni.arrotondamento;

  if (es.ruolo === 'R1' || es.ruolo === 'L') {
    const n = scalaRM(es.ruolo, seduta.fase, seduta.cicloFase);
    const rm1 = rm1DiTest(t);
    const kg = rm1 ? caricoRM(rm1 * (1 + correzione), n, passo) : undefined;
    return { serie, rip, kg, scalaRM: n };
  }

  // R2, R3, C, AB: carico fisso del test per tutto il blocco (SPEC §6.3).
  const kg = t && t.kg > 0 ? arrotonda(t.kg * (1 + correzione), passo) : undefined;
  return { serie, rip, kg };
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
