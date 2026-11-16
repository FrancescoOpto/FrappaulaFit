import type { CaricoCorrente, ModoSeduta, RegistroVoce, Seduta, Voce } from '../tipi';
import { sessione } from '../data/programma';
import { ESERCIZI_PER_ID, passoCarico } from '../data/esercizi';
import { arrotonda } from './carichi';
import { prescrivi, type Contesto, type Prescrizione } from './prescrizione';

// Piano di una seduta: prescrizioni, ordine (classica o PHA), durata stimata e tetto di tempo.
// PHA (Peripheral Heart Action): gli esercizi pesanti restano a serie normali; gli altri glutei e la parte alta
// diventano un circuito che alterna basso e alto, l'addome in coda. Un giro = una serie di ogni stazione;
// una stazione con meno serie esce dal circuito nei giri finali.

export const RISCALDAMENTO_S = 8 * 60;
export const ESECUZIONE_S = 45;

/** Tempi del circuito: transizione tra stazioni e recupero a fine giro (in Dimagrimento più brevi) [Ipotesi sui valori]. */
export const TEMPI_CIRCUITO = {
  mantenimento: { transizione: 30, recuperoGiro: 150 },
  definizione: { transizione: 20, recuperoGiro: 120 },
} as const;

export interface VocePiano {
  voce: Voce;
  p: Prescrizione;
  /** Nel circuito PHA. */
  circuito: boolean;
  /** Serie tolte per il tetto di tempo. */
  tolte: number;
}

export interface PianoSeduta {
  modo: ModoSeduta;
  voci: VocePiano[];
  /** Ordine delle stazioni del circuito (id voce), vuoto in classica. */
  stazioni: string[];
  giri: number;
  durataS: number;
  tolte: number;
}

/** Durata stimata: riscaldamento + parte a serie normali + circuito. */
export function durataStimata(voci: VocePiano[], modo: ModoSeduta, obiettivo: Contesto['obiettivo']): number {
  let tot = RISCALDAMENTO_S;
  const ss = new Set<string>();
  for (const v of voci) {
    if (v.circuito) continue;
    const serie = v.p.serie;
    if (v.voce.superserie && modo === 'classica') {
      if (ss.has(v.voce.superserie)) {
        tot += serie * ESECUZIONE_S;
        continue;
      }
      ss.add(v.voce.superserie);
    }
    tot += serie * (ESECUZIONE_S + v.p.recupero);
  }
  const st = voci.filter((v) => v.circuito);
  if (st.length) {
    const tempi = TEMPI_CIRCUITO[obiettivo];
    const totaleSerie = st.reduce((a, v) => a + v.p.serie, 0);
    const giri = Math.max(...st.map((v) => v.p.serie));
    tot += totaleSerie * ESECUZIONE_S + Math.max(0, totaleSerie - giri) * tempi.transizione + giri * tempi.recuperoGiro;
  }
  return tot;
}

/** Ordine PHA: alterna glutei e parte alta (addome in coda). */
export function ordinePha(voci: VocePiano[]): VocePiano[] {
  const basso = voci.filter((v) => v.voce.parte === 'glutei');
  const alto = voci.filter((v) => v.voce.parte === 'alta' && ESERCIZI_PER_ID[v.p.esercizio_id]?.gruppo !== 'addome');
  const addome = voci.filter((v) => v.voce.parte === 'alta' && ESERCIZI_PER_ID[v.p.esercizio_id]?.gruppo === 'addome');
  const out: VocePiano[] = [];
  for (let i = 0; i < Math.max(basso.length, alto.length); i++) {
    if (basso[i]) out.push(basso[i]);
    if (alto[i]) out.push(alto[i]);
  }
  return [...out, ...addome];
}

/**
 * Piano della seduta. In classica, se la durata stimata supera il tetto T, la parte alta perde una serie alla volta
 * (dall'ultimo esercizio, mai sotto 2) finché rientra; i glutei del libro non si toccano. In PHA nessun taglio.
 */
export function pianoSeduta(s: Pick<Seduta, 'giorno' | 'fase' | 'faseRif' | 'riga'>, c: Contesto, modo: ModoSeduta, T: number): PianoSeduta {
  const modello = sessione(s.giorno);
  let voci: VocePiano[] = modello.voci.map((voce) => {
    const p = prescrivi(voce, s, c);
    return { voce, p, circuito: modo === 'pha' && s.fase !== 'test' && !p.pesante, tolte: 0 };
  });
  let tolte = 0;
  if (modo === 'classica' && s.fase !== 'test') {
    let guardia = 0;
    while (durataStimata(voci, modo, c.obiettivo) > T * 60 && guardia++ < 40) {
      const v = [...voci].reverse().find((x) => x.voce.parte === 'alta' && x.p.serie > 2);
      if (!v) break;
      v.p = { ...v.p, serie: v.p.serie - 1 };
      v.tolte++;
      tolte++;
    }
  }
  if (modo === 'pha' && s.fase !== 'test') {
    const pesanti = voci.filter((v) => !v.circuito);
    voci = [...pesanti, ...ordinePha(voci.filter((v) => v.circuito))];
  }
  const st = voci.filter((v) => v.circuito);
  return {
    modo,
    voci,
    stazioni: st.map((v) => v.voce.id),
    giri: st.length ? Math.max(...st.map((v) => v.p.serie)) : 0,
    durataS: s.fase === 'test' ? 0 : durataStimata(voci, modo, c.obiettivo),
    tolte,
  };
}

/** Stazione e giro correnti del circuito: la prima serie non fatta, giro per giro. */
export function stazioneCorrente(stazioni: string[], registro: Record<string, RegistroVoce> | undefined, giri: number): { voce: string; giro: number } | undefined {
  for (let g = 1; g <= giri; g++) {
    for (const id of stazioni) {
      const x = registro?.[id]?.serie.find((y) => y.n === g);
      if (x && !x.fatta) return { voce: id, giro: g };
    }
  }
  return undefined;
}

/**
 * Progressione doppia a fine seduta [Ipotesi]: parte alta → se in tutte le serie arriva in cima al range (ripMax),
 * un passo di carico in più; glutei "max" → se in tutte le serie supera di 3 il riferimento. I glutei con le righe
 * del libro seguono le tabelle, non questa regola.
 */
export function progressioneDoppia(piano: PianoSeduta, registro: Record<string, RegistroVoce>, passo: number, sedutaId: string, adesso = new Date().toISOString()): Record<string, CaricoCorrente> {
  const out: Record<string, CaricoCorrente> = {};
  for (const v of piano.voci) {
    if (v.p.senzaCarico) continue;
    const soglia = v.voce.ripMax ?? (v.p.max ? v.p.rip + 3 : undefined);
    if (soglia === undefined) continue;
    const serie = registro[v.voce.id]?.serie ?? [];
    if (!serie.length || !serie.every((x) => x.fatta && (x.rip ?? x.rip_prev) >= soglia)) continue;
    const ultima = serie[serie.length - 1];
    const kg = ultima.kg ?? ultima.kg_prev;
    if (kg > 0) out[v.p.esercizio_id] = { kg: arrotonda(kg + passoCarico(v.p.esercizio_id), passo), rif: v.p.kgPiano, aggiornato: adesso, origine: 'proposta', seduta_id: sedutaId };
  }
  return out;
}
