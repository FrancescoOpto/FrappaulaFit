import type {
  Blocco,
  Contenitore,
  Esercizio,
  EsercizioSeduta,
  Fase,
  Gruppo,
  ParametriGeneratore,
  Profilo,
  Ruolo,
  Seduta,
  SessioneContenitore,
  Slot,
  Sottogruppo,
} from '../tipi';
import { contenitorePer } from '../data/contenitori';
import { ESERCIZI, ESERCIZI_PER_ID, NOMI_GRUPPI, NOMI_SOTTOGRUPPI, ROTAZIONE_GUIDA, guidaDelBlocco } from '../data/esercizi';
import {
  COPERTURA_FALLBACK,
  COPERTURA_MINIMA,
  FASI_BLOCCO,
  FASI_BLOCCO_BREVE,
  GRUPPI_GRANDI,
  RECUPERI_DEFAULT,
  SOGLIA_MAX_GRUPPO_GRANDE,
  SOGLIA_MIN_GRUPPO_GRANDE,
  TARGET_SETTIMANALE,
} from '../data/tabelle';
import { durataStimata, minuti, serieRip } from './prescrizione';

// Generatore delle sedute (SPEC §4). Le sedute non sono fisse: escono dal contenitore + parametri.

export interface SessioneGenerata {
  nome: string;
  etichetta: string;
  esercizi: EsercizioSeduta[];
  durataS: number;
}

export interface RisultatoGenerazione {
  contenitore: Contenitore;
  sessioni: SessioneGenerata[];
  volume: Record<Gruppo, number>;
  copertura: Record<Sottogruppo, number>;
  avvisi: string[];
  cicliTotali: number;
  seduteTotali: number;
}

/** Serie "di Fase 1 ciclo 1" di un esercizio (per capacità e volume). */
function serieBase(es: EsercizioSeduta): number {
  return serieRip(es.ruolo, 'fase1', 1, es)[0];
}

function libreria(profilo?: Pick<Profilo, 'esercizi_personalizzati'>): Esercizio[] {
  return [...ESERCIZI, ...(profilo?.esercizi_personalizzati ?? [])];
}

/** Alternative della stessa classe (SPEC §4.5), escludendo esclusi e già usati. */
export function alternative(esercizioId: string, esclusi: string[] = [], usati: string[] = [], profilo?: Pick<Profilo, 'esercizi_personalizzati'>): Esercizio[] {
  const base = ESERCIZI_PER_ID[esercizioId] ?? profilo?.esercizi_personalizzati.find((e) => e.id === esercizioId);
  if (!base) return [];
  return libreria(profilo).filter(
    (e) => e.id !== esercizioId && e.classe === base.classe && e.gruppo === base.gruppo && !esclusi.includes(e.id) && !usati.includes(e.id),
  );
}

function scegliEsercizio(slot: Slot, parametri: ParametriGeneratore, usati: Set<string>, profilo: Pick<Profilo, 'sostituzioni' | 'esercizi_personalizzati'> | undefined, numeroBlocco: number): string | null {
  // Esercizio guida del gruppo: ruota per blocco (TEST_INIZIO_BLOCCO §1b); la sostituzione del profilo prevale.
  const guida = slot.guida ? guidaDelBlocco(slot.guida, numeroBlocco) : undefined;
  const base = guida ?? slot.default;
  const preferito = profilo?.sostituzioni?.[slot.default] ?? base;
  let candidati = [preferito, base, slot.default, ...alternative(slot.default, parametri.esclusi, [], profilo).map((e) => e.id)];
  if (slot.evita_guida) {
    // La seconda seduta del gruppo non ripete la guida corrente: prende l'altra della rotazione.
    const corrente = guidaDelBlocco(slot.evita_guida, numeroBlocco);
    const altra = (ROTAZIONE_GUIDA[slot.evita_guida] ?? []).find((x) => x !== corrente);
    candidati = [...(profilo?.sostituzioni?.[slot.default] ? [profilo.sostituzioni[slot.default]] : []), ...(altra ? [altra] : []), ...candidati.filter((x) => x !== corrente)];
  }
  for (const id of candidati) {
    if (parametri.esclusi.includes(id)) continue;
    if (usati.has(id)) continue;
    // Un R1 richiede un fondamentale (o comunque un multiarticolare della stessa classe).
    if (slot.ruolo === 'R1' && ESERCIZI_PER_ID[id] && ESERCIZI_PER_ID[id].tipo !== 'multi') continue;
    return id;
  }
  return null;
}

function etichettaSlot(slot: Slot): string {
  return `${NOMI_GRUPPI[slot.gruppo]} ${slot.ruolo}`;
}

/** Genera una sessione dal contenitore: scelta esercizi, priorità, capacità in tempo. */
function generaSessione(sessione: SessioneContenitore, parametri: ParametriGeneratore, profilo: Pick<Profilo, 'sostituzioni' | 'esercizi_personalizzati' | 'fondamentali_promossi'> | undefined, recuperi: Record<Ruolo, number>, avvisi: string[], numeroBlocco: number): SessioneGenerata {
  const usati = new Set<string>();
  const esercizi: EsercizioSeduta[] = [];
  const promossi = profilo?.fondamentali_promossi ?? [];
  sessione.slot.forEach((slot, i) => {
    const id = scegliEsercizio(slot, parametri, usati, profilo, numeroBlocco);
    if (!id) {
      avvisi.push(`${sessione.nome}: nessun esercizio disponibile per ${etichettaSlot(slot)} (tutti esclusi).`);
      return;
    }
    usati.add(id);
    // Guida promossa a fondamentale dall'utente: scala RM piena se c'è posto (max 2 R1), altrimenti scala leggera.
    let ruolo: Ruolo = slot.ruolo;
    if ((slot.ruolo === 'R2' || slot.ruolo === 'R3') && promossi.includes(id)) {
      ruolo = esercizi.filter((e) => e.ruolo === 'R1').length < 2 ? 'R1' : 'L';
    }
    esercizi.push({
      slot: i,
      esercizio_id: id,
      ruolo,
      gruppo: slot.gruppo,
      serie: slot.serie,
      rip: slot.rip,
      superserie: slot.superserie,
    });
  });

  // Priorità (SPEC §4.1 punto 3) [Ipotesi]: +1 serie ai complementari dei gruppi prioritari.
  for (const e of esercizi) {
    if (e.ruolo === 'C' && parametri.priorita.includes(e.gruppo) && e.serie) e.serie = Math.min(e.serie + 1, 4);
  }

  const durata = () => durataStimata(esercizi.map((e) => ({ ruolo: e.ruolo, serie: serieBase(e), superserie: e.superserie })), recuperi);
  const limite = parametri.T * 60;

  // Riempimento (SPEC §4.4): se si sfora, togli 1 serie ai C (prima i non prioritari), poi i C meno prioritari. Mai R1.
  // Decisione: i C che coprono un sottogruppo (leg curl, alzate...) non si rimuovono, al massimo scendono a 2 serie;
  // se la seduta resta sopra T l'utente riceve un avviso invece di una seduta monca.
  const nonPrioritario = (e: EsercizioSeduta) => !parametri.priorita.includes(e.gruppo);
  const copre = (e: EsercizioSeduta) => Boolean(sessione.slot[e.slot]?.copre);
  const riduciSerie = (filtro: (e: EsercizioSeduta) => boolean) => {
    for (let i = esercizi.length - 1; i >= 0 && durata() > limite; i--) {
      const e = esercizi[i];
      if (e.ruolo === 'C' && filtro(e) && (e.serie ?? 3) > 2) e.serie = (e.serie ?? 3) - 1;
    }
  };
  const rimuovi = (filtro: (e: EsercizioSeduta) => boolean) => {
    for (let i = esercizi.length - 1; i >= 0 && durata() > limite; i--) {
      const e = esercizi[i];
      if (e.ruolo === 'C' && filtro(e)) esercizi.splice(i, 1);
    }
  };
  riduciSerie((e) => nonPrioritario(e) && !copre(e));
  riduciSerie((e) => !copre(e));
  rimuovi((e) => nonPrioritario(e) && !copre(e));
  riduciSerie(nonPrioritario);
  riduciSerie(() => true);
  rimuovi((e) => !copre(e));

  return { nome: sessione.nome, etichetta: sessione.etichetta, esercizi, durataS: durata() };
}

function volumeSettimanale(sessioni: SessioneGenerata[]): Record<Gruppo, number> {
  const v: Record<Gruppo, number> = { petto: 0, dorso: 0, spalle: 0, gambe: 0, bicipiti: 0, tricipiti: 0, addome: 0 };
  for (const s of sessioni) for (const e of s.esercizi) v[e.gruppo] += serieBase(e);
  return v;
}

function coperturaSettimanale(sessioni: SessioneGenerata[], contenitore: Contenitore): Record<Sottogruppo, number> {
  const c: Record<Sottogruppo, number> = { quadricipiti: 0, femorali: 0, glutei: 0, spalle_laterali: 0, spalle_posteriori: 0, bicipiti: 0, tricipiti: 0 };
  sessioni.forEach((s, si) => {
    for (const e of s.esercizi) {
      const slot = contenitore.sessioni[si]?.slot[e.slot];
      const sg = slot?.copre ?? ESERCIZI_PER_ID[e.esercizio_id]?.sottogruppo;
      if (sg) c[sg] += serieBase(e);
    }
  });
  return c;
}

/** Genera il "giro" del contenitore (N sessioni) e verifica volume, copertura e tempo (SPEC §4.4). */
export type ProfiloGen = Pick<Profilo, 'sostituzioni' | 'esercizi_personalizzati' | 'impostazioni'> & Partial<Pick<Profilo, 'fondamentali_promossi'>>;

export function generaSettimana(parametri: ParametriGeneratore, profilo?: ProfiloGen, numeroBlocco = 1): RisultatoGenerazione {
  const avvisi: string[] = [];
  const contenitore = contenitorePer(parametri.N, parametri.preset);
  if (contenitore.avviso) avvisi.push(contenitore.avviso);
  const recuperi = profilo?.impostazioni?.recuperi ?? RECUPERI_DEFAULT;

  const sessioni = contenitore.sessioni.map((s) => generaSessione(s, parametri, profilo, recuperi, avvisi, numeroBlocco));

  // Copertura dei sottogruppi (SPEC §4.3): prima rialza le serie di un C esistente che copre il sottogruppo
  // (nella seduta con più spazio), poi, se non c'è, aggiunge lo slot di riserva.
  const ricalcola = (s: SessioneGenerata) => {
    s.durataS = durataStimata(s.esercizi.map((e) => ({ ruolo: e.ruolo, serie: serieBase(e), superserie: e.superserie })), recuperi);
  };
  const copertura = coperturaSettimanale(sessioni, contenitore);
  for (const sg of Object.keys(copertura) as Sottogruppo[]) {
    let guardia = 0;
    while (copertura[sg] < COPERTURA_MINIMA && guardia++ < 4) {
      const fb = COPERTURA_FALLBACK[sg];
      const esistenti = sessioni
        .flatMap((s, si) => s.esercizi.map((e) => ({ s, e, slot: contenitore.sessioni[si]?.slot[e.slot] })))
        .filter((x) => x.e.ruolo === 'C' && (x.slot?.copre === sg || (!x.slot && ESERCIZI_PER_ID[x.e.esercizio_id]?.sottogruppo === sg)) && (x.e.serie ?? 0) < Math.max(fb.serie, COPERTURA_MINIMA))
        .sort((a, b) => a.s.durataS - b.s.durataS);
      if (esistenti.length) {
        const x = esistenti[0];
        x.e.serie = (x.e.serie ?? 2) + 1;
        copertura[sg] += 1;
        ricalcola(x.s);
        continue;
      }
      if (parametri.esclusi.includes(fb.esercizio)) break;
      const candidate = sessioni
        .map((s) => ({ s, spazio: parametri.T * 60 - s.durataS }))
        .filter((x) => !x.s.esercizi.some((e) => e.esercizio_id === fb.esercizio))
        .sort((a, b) => b.spazio - a.spazio);
      const target = candidate[0];
      if (!target) break;
      const def = ESERCIZI_PER_ID[fb.esercizio];
      // Slot negativo = aggiunto dal generatore (non esiste nel contenitore).
      const nuovo: EsercizioSeduta = { slot: -(target.s.esercizi.length + 1), esercizio_id: fb.esercizio, ruolo: 'C', gruppo: def.gruppo, serie: fb.serie, rip: fb.rip };
      target.s.esercizi.push(nuovo);
      ricalcola(target.s);
      copertura[sg] += fb.serie;
      avvisi.push(`${target.s.nome}: aggiunto ${def.nome} per coprire ${NOMI_SOTTOGRUPPI[sg].toLowerCase()}.`);
    }
  }

  const volume = volumeSettimanale(sessioni);
  for (const g of GRUPPI_GRANDI) {
    if (volume[g] < SOGLIA_MIN_GRUPPO_GRANDE) {
      avvisi.push(`${NOMI_GRUPPI[g]}: ${volume[g]} serie/settimana, sotto il minimo (${SOGLIA_MIN_GRUPPO_GRANDE}). Considera più sedute o più tempo.`);
    } else if (volume[g] > SOGLIA_MAX_GRUPPO_GRANDE) {
      avvisi.push(`${NOMI_GRUPPI[g]}: ${volume[g]} serie/settimana, sopra il massimo consigliato (${SOGLIA_MAX_GRUPPO_GRANDE}).`);
    }
  }
  for (const s of sessioni) {
    if (s.durataS > parametri.T * 60 + 120) avvisi.push(`${s.nome}: durata stimata ${minuti(s.durataS)}’ oltre il limite di ${parametri.T}’.`);
  }
  for (const sg of Object.keys(copertura) as Sottogruppo[]) {
    if (copertura[sg] < COPERTURA_MINIMA) avvisi.push(`${NOMI_SOTTOGRUPPI[sg]}: solo ${copertura[sg]} serie dirette a settimana.`);
  }

  const fasi = parametri.bloccoBreve ? FASI_BLOCCO_BREVE : FASI_BLOCCO;
  const cicliTotali = fasi.reduce((a, f) => a + f.cicli, 0);
  return { contenitore, sessioni, volume, copertura, avvisi, cicliTotali, seduteTotali: cicliTotali * parametri.N };
}

export function targetVolume(parametri: ParametriGeneratore): Record<Gruppo, number> {
  const t = { ...TARGET_SETTIMANALE };
  for (const g of parametri.priorita) t[g] = Math.min(24, Math.round(t[g] * 1.25));
  if (parametri.preset === 'donna_glutei') {
    t.spalle = Math.round(t.spalle * 0.8);
    t.bicipiti = Math.round(t.bicipiti * 0.8);
    t.tricipiti = Math.round(t.tricipiti * 0.8);
  }
  return t;
}

/** Lista piatta (fase, ciclo assoluto, ciclo nella fase) del blocco. */
export function cicliDelBlocco(bloccoBreve: boolean): { fase: Fase; ciclo: number; cicloFase: number }[] {
  const fasi = bloccoBreve ? FASI_BLOCCO_BREVE : FASI_BLOCCO;
  const out: { fase: Fase; ciclo: number; cicloFase: number }[] = [];
  let ciclo = 0;
  for (const f of fasi) for (let c = 1; c <= f.cicli; c++) out.push({ fase: f.fase, ciclo: ++ciclo, cicloFase: c });
  return out;
}

function nomeSeduta(fase: Fase, numeroNellaFase: number): string {
  switch (fase) {
    case 'test':
      return `Test ${numeroNellaFase}`;
    case 'scarico':
      return `Scarico ${numeroNellaFase}`;
    default:
      return `Seduta ${numeroNellaFase}`;
  }
}

/** Genera tutte le sedute del blocco (SPEC §12.2: N=3 → 51, N=4 → 68). */
export function generaSedute(parametri: ParametriGeneratore, settimana: RisultatoGenerazione, bloccoId: string): Seduta[] {
  const sedute: Seduta[] = [];
  const cicli = cicliDelBlocco(parametri.bloccoBreve);
  let numero = 0;
  const contaFase: Partial<Record<Fase, number>> = {};
  for (const c of cicli) {
    for (let g = 0; g < parametri.N; g++) {
      numero++;
      contaFase[c.fase] = (contaFase[c.fase] ?? 0) + 1;
      const s = settimana.sessioni[g];
      sedute.push({
        id: `${bloccoId}-${numero}`,
        numero,
        fase: c.fase,
        ciclo: c.ciclo,
        cicloFase: c.cicloFase,
        giorno: g + 1,
        nome: nomeSeduta(c.fase, contaFase[c.fase]!),
        etichetta: `${s.nome} · ${s.etichetta}`,
        stato: 'futura',
        esercizi: s.esercizi.map((e) => ({ ...e })),
      });
    }
  }
  return sedute;
}

export function nuovoBlocco(parametri: ParametriGeneratore, profilo: ProfiloGen, numero = 1): Blocco {
  const settimana = generaSettimana(parametri, profilo, numero);
  const id = `b${numero}-${Date.now().toString(36)}`;
  return {
    id,
    numero,
    stato: 'test',
    contenitore_id: settimana.contenitore.id,
    sedute: generaSedute(parametri, settimana, id),
    test: {},
    correzioni: {},
    parametri: { ...parametri, priorita: [...parametri.priorita], esclusi: [...parametri.esclusi] },
    creato: new Date().toISOString(),
  };
}

/** Primo ciclo che non contiene sedute completate o in corso (confine di ciclo, SPEC §4.7). */
export function primoCicloModificabile(blocco: Blocco): number {
  const ultimoToccato = Math.max(0, ...blocco.sedute.filter((s) => s.stato !== 'futura').map((s) => s.ciclo));
  return ultimoToccato + 1;
}

/**
 * Rigenera le sedute future con nuovi parametri, dal confine di ciclo (SPEC §4.7).
 * Fase, ciclo, test e carichi restano; cambia solo la lista di sedute non ancora iniziate.
 */
export function rigeneraSeduteFuture(blocco: Blocco, nuovi: ParametriGeneratore, profilo: ProfiloGen): Blocco {
  const daCiclo = primoCicloModificabile(blocco);
  const settimana = generaSettimana(nuovi, profilo, blocco.numero);
  const cicli = cicliDelBlocco(nuovi.bloccoBreve).filter((c) => c.ciclo >= daCiclo);
  const conservate = blocco.sedute.filter((s) => s.ciclo < daCiclo);
  let numero = conservate.length;
  const contaFase: Partial<Record<Fase, number>> = {};
  for (const s of conservate) contaFase[s.fase] = (contaFase[s.fase] ?? 0) + 1;
  const nuove: Seduta[] = [];
  for (const c of cicli) {
    for (let g = 0; g < nuovi.N; g++) {
      numero++;
      contaFase[c.fase] = (contaFase[c.fase] ?? 0) + 1;
      const s = settimana.sessioni[g];
      nuove.push({
        id: `${blocco.id}-${numero}`,
        numero,
        fase: c.fase,
        ciclo: c.ciclo,
        cicloFase: c.cicloFase,
        giorno: g + 1,
        nome: nomeSeduta(c.fase, contaFase[c.fase]!),
        etichetta: `${s.nome} · ${s.etichetta}`,
        stato: 'futura',
        esercizi: s.esercizi.map((e) => ({ ...e })),
      });
    }
  }
  return { ...blocco, sedute: [...conservate, ...nuove], parametri: { ...nuovi }, parametriInAttesa: undefined, contenitore_id: settimana.contenitore.id };
}

/** Esercizi distinti che compaiono nel blocco (per la settimana di test), con lo slot di prima comparsa. */
export function eserciziDaTestare(blocco: Blocco): EsercizioSeduta[] {
  const visti = new Map<string, EsercizioSeduta>();
  for (const s of blocco.sedute) {
    for (const e of s.esercizi) {
      const prec = visti.get(e.esercizio_id);
      // R1 prevale su L (stesso esercizio testato una volta sola).
      if (!prec || (prec.ruolo !== 'R1' && e.ruolo === 'R1')) visti.set(e.esercizio_id, e);
    }
  }
  return [...visti.values()];
}
