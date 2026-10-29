import type { EsercizioSeduta, RegistroEsercizio, Ruolo, Seduta, SerieRegistrata } from '../tipi';
import { CIRCUITO, type TempiCircuito } from '../data/tabelle';
import { durataStimata, type Prescrizione } from './prescrizione';
import { arrotonda } from './carichi';

// Circuito PHA del profilo donna (SPEC_PIANIFICATORE §12b): giri scelti in seduta, tetto di tempo e doppia
// progressione. Funzioni pure: lo stato (store/stato.ts) le chiama con la prescrizione corrente.

export interface EsitoGiri {
  esercizi: Record<number, RegistroEsercizio>;
  giri: number;
  /** Serie tolte alla parte classica per stare nel tetto T. */
  tolte: number;
}

/** Serie di un esercizio portate a `quante`: le fatte restano sempre, le nuove ripartono dall'ultimo carico. */
function adegua(e: EsercizioSeduta, attuali: SerieRegistrata[], quante: number, pr: Prescrizione): SerieRegistrata[] {
  const fatte = attuali.filter((x) => x.fatta).length;
  const tenute = attuali.filter((x) => x.fatta || x.n <= quante).slice(0, Math.max(quante, fatte));
  const ultima = tenute[tenute.length - 1];
  const out = tenute.map((x) => ({ ...x }));
  for (let n = out.length + 1; n <= quante; n++) out.push({ n, kg_prev: ultima ? ultima.kg ?? ultima.kg_prev : pr.kg ?? 0, kg_piano: pr.kgPiano, rip_prev: pr.rip, fatta: false, rest_pause: e.rest_pause });
  return out.map((x, i) => ({ ...x, n: i + 1 }));
}

/**
 * Giri del circuito (2–4) per una seduta avviata. Le stazioni ricevono o perdono i giri non fatti; se con più giri
 * la seduta stimata supera T, la parte classica perde serie non fatte (dall'ultimo Target o complementare, mai i
 * fondamentali, mai sotto 2) finché rientra. Il conteggio riparte sempre dalle serie previste: tornando a meno giri
 * le serie classiche tornano.
 */
export function ridistribuisciGiri(
  s: Pick<Seduta, 'esercizi'>,
  registro: Record<number, RegistroEsercizio>,
  giri: number,
  prescrizioneDi: (e: EsercizioSeduta) => Prescrizione,
  recuperi: Record<Ruolo, number>,
  T: number,
  tempi: TempiCircuito,
): EsitoGiri {
  const g = Math.min(CIRCUITO.giriMax, Math.max(CIRCUITO.giriMin, Math.round(giri)));
  const esercizi = { ...registro };
  for (const e of s.esercizi.filter((x) => x.circuito)) {
    const r = esercizi[e.slot];
    if (r) esercizi[e.slot] = { ...r, serie: adegua(e, r.serie.filter((x) => !x.stripping), g, prescrizioneDi(e)) };
  }
  const classiche = s.esercizi.filter((e) => !e.circuito);
  const fatteDi = (e: EsercizioSeduta) => registro[e.slot]?.serie.filter((x) => x.fatta && !x.stripping).length ?? 0;
  const conteggio = new Map<number, number>();
  for (const e of classiche) conteggio.set(e.slot, Math.max(prescrizioneDi(e).serie, fatteDi(e)));
  const durata = () =>
    durataStimata(
      [
        ...classiche.map((e) => ({ ruolo: e.ruolo, serie: conteggio.get(e.slot) ?? 0, superserie: e.superserie })),
        ...s.esercizi.filter((e) => e.circuito).map((e) => ({ ruolo: e.ruolo, serie: g, circuito: e.circuito })),
      ],
      recuperi,
      tempi,
    );
  let tolte = 0;
  let guardia = 0;
  while (durata() > T * 60 && guardia++ < 40) {
    const vittima = [...classiche].reverse().find((e) => {
      const c = conteggio.get(e.slot) ?? 0;
      return e.ruolo !== 'R1' && e.ruolo !== 'L' && e.ruolo !== 'AB' && !e.rest_pause && c > 2 && c > fatteDi(e);
    });
    if (!vittima) break;
    conteggio.set(vittima.slot, (conteggio.get(vittima.slot) ?? 0) - 1);
    tolte++;
  }
  for (const e of classiche) {
    const r = esercizi[e.slot];
    if (!r) continue;
    const strip = r.serie.filter((x) => x.stripping);
    esercizi[e.slot] = { ...r, serie: [...adegua(e, r.serie.filter((x) => !x.stripping), conteggio.get(e.slot) ?? r.serie.length, prescrizioneDi(e)), ...strip] };
  }
  return { esercizi, giri: g, tolte };
}

/**
 * Doppia progressione del circuito [Ipotesi, §12b]: se in tutti i giri una stazione arriva in cima al range
 * (15 ripetizioni), la volta dopo il carico sale di un passo; altrimenti si cercano più ripetizioni con lo stesso carico.
 * Restituisce i nuovi carichi per esercizio (id → kg).
 */
export function progressioneCircuito(
  s: Pick<Seduta, 'esercizi' | 'fase'>,
  registro: Record<number, RegistroEsercizio>,
  passo: (esercizio_id: string) => number,
  arrotondamento: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  if (s.fase === 'test') return out;
  for (const e of s.esercizi.filter((x) => x.circuito)) {
    const serie = registro[e.slot]?.serie.filter((x) => !x.stripping) ?? [];
    if (!serie.length || !serie.every((x) => x.fatta && (x.rip ?? x.rip_prev) >= CIRCUITO.ripMax)) continue;
    const ultima = serie[serie.length - 1];
    const kg = ultima.kg ?? ultima.kg_prev;
    if (kg > 0) out[e.esercizio_id] = arrotonda(kg + passo(e.esercizio_id), arrotondamento);
  }
  return out;
}
