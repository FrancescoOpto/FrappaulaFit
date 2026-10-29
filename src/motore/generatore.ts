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
  SCARICO_REST_PAUSE,
  TABELLE,
  COPERTURA_MINIMA,
  FASI_BLOCCO,
  FASI_BLOCCO_BREVE,
  GRUPPI_GRANDI,
  RECUPERI_DEFAULT,
  SOGLIA_MAX_GRUPPO_GRANDE,
  SOGLIA_MIN_GRUPPO_GRANDE,
  TARGET_SETTIMANALE,
  tempiCircuito,
} from '../data/tabelle';
import { durataStimata, minuti, serieRip } from './prescrizione';
import { scalaPerTempo } from './preservazione';
import { righeTabella } from './composizione';
import type { SegmentoPiano } from '../tipi';

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
    // La seconda riga ripete di proposito lo stesso esercizio del Target.
    if (usati.has(id) && !slot.seconda_riga) continue;
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
/** Serie settimanali massime per gruppo con le priorità (SPEC_PIANIFICATORE §6c punto 4). */
export const TETTO_SERIE_PRIORITA = 20;

/**
 * Intensità e priorità muscolari (SPEC_PIANIFICATORE v2 §6c punti 3–4): la priorità dà +1 serie ai Target e ai
 * complementari del gruppo e lo porta all'inizio della seduta; "moderata" toglie 1 serie ai complementari (min 2).
 * Nessuna modifica ai carichi. Addome, righe rest-pause e seconde righe restano com'erano.
 */
export function applicaIntensitaEPriorita(esercizi: EsercizioSeduta[], parametri: Pick<ParametriGeneratore, 'priorita' | 'intensita'>): void {
  const intensita = parametri.intensita ?? 'standard';
  for (const e of esercizi) {
    // Le stazioni del circuito (§12b) hanno i giri come serie: priorità e intensità non le toccano.
    if (e.ruolo === 'AB' || e.rest_pause || e.seconda_riga || e.senza_carico || e.circuito) continue;
    const prioritario = parametri.priorita.includes(e.gruppo);
    if (e.ruolo === 'C') {
      let serie = e.serie ?? 3;
      if (intensita === 'moderata') serie = Math.max(2, serie - 1);
      if (prioritario) serie = Math.min(serie + 1, 5);
      e.serie = serie;
    } else if ((e.ruolo === 'R2' || e.ruolo === 'R3') && prioritario) {
      e.serie_extra = 1;
    }
  }
  if (parametri.priorita.length) {
    // Gruppi prioritari all'inizio (ordine stabile tra i gruppi, l'addome resta in coda).
    const peso = (e: EsercizioSeduta) => (e.circuito ? 3 : e.ruolo === 'AB' ? 2 : parametri.priorita.includes(e.gruppo) ? 0 : 1);
    esercizi.sort((a, b) => peso(a) - peso(b));
  }
}

/** Tetto di 20 serie/settimana per i gruppi prioritari: toglie le serie extra oltre il tetto. */
function limitaPriorita(sessioni: SessioneGenerata[], parametri: ParametriGeneratore): void {
  for (const g of parametri.priorita) {
    let guardia = 0;
    while (guardia++ < 20) {
      const vol = sessioni.reduce((a, s) => a + s.esercizi.filter((e) => e.gruppo === g).reduce((b, e) => b + serieBase(e), 0), 0);
      if (vol <= TETTO_SERIE_PRIORITA) break;
      const extra = sessioni.flatMap((s) => s.esercizi).find((e) => e.gruppo === g && e.serie_extra);
      if (extra) { extra.serie_extra = undefined; continue; }
      const c = [...sessioni.flatMap((s) => s.esercizi)].reverse().find((e) => e.gruppo === g && e.ruolo === 'C' && (e.serie ?? 3) > 3);
      if (!c) break;
      c.serie = (c.serie ?? 4) - 1;
    }
  }
}

/**
 * Dimagrimento nel profilo ibrido (§12b): la parte classica fa una serie in meno (minimo 2) con gli stessi carichi;
 * i fondamentali (R1) e il circuito restano com'erano.
 */
export function applicaDimagrimentoIbrido(esercizi: EsercizioSeduta[]): void {
  for (const e of esercizi) {
    if (e.circuito || e.ruolo === 'R1' || e.ruolo === 'L' || e.ruolo === 'AB' || e.rest_pause || e.seconda_riga) continue;
    if (e.ruolo === 'C') e.serie = Math.max(2, (e.serie ?? 3) - 1);
    else e.serie_extra = (e.serie_extra ?? 0) - 1 || undefined;
  }
}

function generaSessione(sessione: SessioneContenitore, parametri: ParametriGeneratore, profilo: Pick<Profilo, 'sostituzioni' | 'esercizi_personalizzati' | 'fondamentali_promossi'> | undefined, recuperi: Record<Ruolo, number>, avvisi: string[], numeroBlocco: number, fisso = false, fattoreContenitore?: number, ibrido = false): SessioneGenerata {
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
    let tabella = slot.tabella;
    if ((slot.ruolo === 'R2' || slot.ruolo === 'R3') && promossi.includes(id)) {
      ruolo = esercizi.filter((e) => e.ruolo === 'R1').length < 2 ? 'R1' : 'L';
      tabella = ruolo;
    }
    esercizi.push({
      slot: i,
      esercizio_id: id,
      ruolo,
      gruppo: slot.gruppo,
      serie: slot.serie,
      rip: slot.rip,
      superserie: slot.superserie,
      tabella,
      rest_pause: slot.rest_pause,
      serie_fisse: slot.rest_pause ? true : undefined,
      senza_carico: slot.seconda_riga ? true : undefined,
      seconda_riga: slot.seconda_riga,
      fattore_lavoro: fattoreContenitore,
      circuito: slot.circuito,
    });
  });
  applicaIntensitaEPriorita(esercizi, parametri);
  if (ibrido && parametri.obiettivoIbrido === 'definizione') applicaDimagrimentoIbrido(esercizi);
  const tempi = tempiCircuito(parametri.obiettivoIbrido);
  if (fisso) {
    // Programma letto dai video: nessun taglio, solo l'avviso sulla durata (in generaSettimana).
    return { nome: sessione.nome, etichetta: sessione.etichetta, esercizi, durataS: durataStimata(esercizi.map((e) => ({ ruolo: e.ruolo, serie: serieBase(e), superserie: e.superserie, circuito: e.circuito })), recuperi, tempi) };
  }

  // Scala per tempo (SPEC_PIANIFICATORE v2 §4.7, sostituisce il riempimento di SPEC §4.4): T è un tetto.
  // Se la seduta sta dentro T non si tocca nulla; altrimenti complementari dal 2° gruppo a 2 serie, poi via
  // il complementare meno prioritario (quelli che coprono un sottogruppo per ultimi), mai sotto 2 esercizi per gruppo.
  const copre = (e: EsercizioSeduta) => Boolean(sessione.slot[e.slot]?.copre) || parametri.priorita.includes(e.gruppo);
  const esito = scalaPerTempo(esercizi, parametri.T, recuperi, 'fase1', copre, tempi);
  return { nome: sessione.nome, etichetta: sessione.etichetta, esercizi: esito.esercizi, durataS: esito.durataS };
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
  const contenitore = contenitorePer(parametri.N, parametri.preset, numeroBlocco);
  if (contenitore.avviso) avvisi.push(contenitore.avviso);
  if (!contenitore.fisso && parametri.preset === 'uomo_base') avvisi.push(`Con ${parametri.N} sedute la struttura è generica (regole nostre): il programma letto dai video esiste solo a 4 giorni. [Da definire]`);
  if (parametri.preset === 'donna_glutei' && !contenitore.ibrido) avvisi.push(`La seduta ibrida con circuito (SPEC_PIANIFICATORE §12b) è definita a 3 sedute: con ${parametri.N} sedute resta la struttura generica provvisoria.`);
  const tempi = tempiCircuito(parametri.obiettivoIbrido);
  const recuperi = profilo?.impostazioni?.recuperi ?? RECUPERI_DEFAULT;

  const sessioni = contenitore.sessioni.map((s) => generaSessione(s, parametri, profilo, recuperi, avvisi, numeroBlocco, contenitore.fisso, contenitore.fattore_lavoro, contenitore.ibrido));
  limitaPriorita(sessioni, parametri);

  // Copertura dei sottogruppi (SPEC §4.3): prima rialza le serie di un C esistente che copre il sottogruppo
  // (nella seduta con più spazio), poi, se non c'è, aggiunge lo slot di riserva.
  const ricalcola = (s: SessioneGenerata) => {
    s.durataS = durataStimata(s.esercizi.map((e) => ({ ruolo: e.ruolo, serie: serieBase(e), superserie: e.superserie, circuito: e.circuito })), recuperi, tempi);
  };
  const copertura = coperturaSettimanale(sessioni, contenitore);
  for (const sg of Object.keys(copertura) as Sottogruppo[]) {
    let guardia = 0;
    // Le sedute ibride (§12b) hanno una struttura voluta: nessuna aggiunta automatica di copertura.
    while (!contenitore.fisso && !contenitore.ibrido && copertura[sg] < COPERTURA_MINIMA && guardia++ < 4) {
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
  // Le sedute ibride (§12b) concentrano il volume su glutei e dorso per scelta: niente avvisi generici di volume.
  for (const g of contenitore.ibrido ? [] : GRUPPI_GRANDI) {
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
    if (!contenitore.fisso && !contenitore.ibrido && copertura[sg] < COPERTURA_MINIMA) avvisi.push(`${NOMI_SOTTOGRUPPI[sg]}: solo ${copertura[sg]} serie dirette a settimana.`);
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

/**
 * Esercizi di una seduta in una data fase: applica le varianti per fase dei complementari (BLOCCO2 §A4).
 * Lo scarico usa le varianti della Fase 2. La variante senza test eredita il carico dall'esercizio di Fase 1.
 */
export function eserciziPerFase(sessione: SessioneGenerata, contenitoreSessione: SessioneContenitore | undefined, fase: Fase, parametri: ParametriGeneratore, sostituzioni: Record<string, string> = {}): EsercizioSeduta[] {
  const faseVarianti = fase === 'scarico' ? 'fase2' : fase === 'fase2' || fase === 'fase3' ? fase : undefined;
  const out: EsercizioSeduta[] = [];
  for (const e of sessione.esercizi) {
    const slot = e.slot >= 0 ? contenitoreSessione?.slot[e.slot] : undefined;
    // Slot presenti solo in alcune fasi (es. affondi dalla Fase 2); la settimana di test segue la Fase 1.
    if (slot?.fasi && !slot.fasi.includes(fase === 'test' ? 'fase1' : fase)) continue;
    // Seconde righe e righe senza carico non si testano.
    if (fase === 'test' && (e.seconda_riga || e.senza_carico)) continue;
    // Tabelle con scarico vuoto (seconda riga ×12): la riga sparisce nello scarico.
    if (fase === 'scarico' && e.tabella && e.ruolo !== 'C' && TABELLE[e.tabella].scarico.length === 0) continue;

    let base: EsercizioSeduta = { ...e };
    if (faseVarianti && slot && !slot.varianti?.[faseVarianti] && e.ruolo === 'C' && !e.rest_pause && !contenitoreFisso(contenitoreSessione)) {
      // Rotazione dei complementari a ogni fase con gli equivalenti della libreria (§6b, §14b) [Ipotesi]:
      // Fase 2 → primo equivalente, Fase 3 → secondo (o il default: mai lo stesso tre fasi di seguito).
      // Lo stimolo sui glutei (§12b) resta lo stesso: un'abduzione ruota solo su un'altra abduzione.
      const stimolo = ESERCIZI_PER_ID[e.esercizio_id]?.stimolo_gluteo;
      const eq = (ESERCIZI_PER_ID[e.esercizio_id]?.equivalenti ?? []).filter((id) => ESERCIZI_PER_ID[id] && ESERCIZI_PER_ID[id].gruppo === e.gruppo && (!stimolo || ESERCIZI_PER_ID[id].stimolo_gluteo === stimolo) && !parametri.esclusi.includes(id) && !sessione.esercizi.some((x) => x.esercizio_id === id));
      const scelta = faseVarianti === 'fase2' ? eq[0] : eq[1];
      if (scelta) base = { ...base, esercizio_id: sostituzioni[scelta] ?? scelta, eredita_da: e.esercizio_id };
    }
    if (faseVarianti && slot) {
      const v = slot.varianti?.[faseVarianti];
      if (v) {
        const variante = typeof v === 'string' ? v : v.id;
        if (!parametri.esclusi.includes(variante)) {
          const serie = typeof v === 'string' ? e.serie : (v.serie ?? e.serie);
          const rip = typeof v === 'string' ? e.rip : (v.rip ?? e.rip);
          const rp = typeof v === 'string' ? e.rest_pause : v.rest_pause === undefined ? e.rest_pause : v.rest_pause ?? undefined;
          const id = sostituzioni[variante] && !parametri.esclusi.includes(sostituzioni[variante]) ? sostituzioni[variante] : variante;
          const serieRp = rp ? 1 : serie;
          const ripRp = rp === 'totale' ? 40 : rp === '10_piu_3' ? 10 : rip;
          base = { ...base, serie: serieRp, rip: ripRp, rest_pause: rp, serie_fisse: rp ? true : undefined };
          if (id !== e.esercizio_id) base = { ...base, esercizio_id: id, eredita_da: e.esercizio_id };
        }
      }
    }
    if (fase === 'scarico') {
      // Righe rest-pause → serie normali (2×12 / 2×10); override di scarico dello slot per i Target.
      if (base.rest_pause) {
        const [serie, rip] = SCARICO_REST_PAUSE[base.rest_pause];
        base = { ...base, serie, rip, rest_pause: undefined, serie_fisse: base.ruolo !== 'C' ? true : undefined };
      }
      if (slot?.scarico) base = { ...base, serie: slot.scarico.serie, rip: slot.scarico.rip, serie_fisse: true };
    }
    out.push(base);
  }
  // Dimagrimento nel profilo ibrido: niente tecniche di intensità (§12b).
  const dimagrimentoIbrido = parametri.obiettivoIbrido === 'definizione' && Boolean(contenitoreSessione?.slot.some((x) => x.circuito));
  if (fase !== 'test' && fase !== 'scarico' && !dimagrimentoIbrido && (parametri.tecniche_avanzate || parametri.intensita === 'alta') && !haTecniche(contenitoreSessione)) applicaTecnicheAvanzate(out);
  return out;
}

function contenitoreFisso(cs: SessioneContenitore | undefined): boolean {
  // I programmi dei video hanno le loro varianti per fase: nessuna rotazione automatica.
  return Boolean(cs?.slot.some((x) => x.varianti));
}

function haTecniche(cs: SessioneContenitore | undefined): boolean {
  return Boolean(cs?.slot.some((x) => x.rest_pause || x.seconda_riga));
}

/**
 * Tecniche avanzate sui Blocchi 1–2 (SPEC_PIANIFICATORE v2 §4.2, opzione `tecniche_avanzate` o intensità "alta") [Ipotesi]:
 * con le righe del Blocco 3 corrispondenti, solo su isolamenti e Target secondari, mai sui fondamentali.
 * Ultimo isolamento di bicipiti e tricipiti → rest-pause 1×40 (carico del test a 14RM); primo Target della seduta → seconda riga ×12.
 */
export function applicaTecnicheAvanzate(out: EsercizioSeduta[]): void {
  for (const g of ['bicipiti', 'tricipiti'] as const) {
    const ultimo = [...out].reverse().find((e) => e.gruppo === g && e.ruolo === 'C' && !e.circuito && ESERCIZI_PER_ID[e.esercizio_id]?.tipo === 'isolamento' && !e.rest_pause);
    if (ultimo) Object.assign(ultimo, { serie: 1, rip: 40, rest_pause: 'totale', serie_fisse: true });
  }
  const target = out.find((e) => e.ruolo === 'R2' && !e.seconda_riga);
  if (target && !out.some((e) => e.seconda_riga && e.esercizio_id === target.esercizio_id)) {
    const i = out.indexOf(target);
    out.splice(i + 1, 0, { slot: -(500 + target.slot), esercizio_id: target.esercizio_id, ruolo: 'R3', gruppo: target.gruppo, tabella: 'B3_X12', seconda_riga: true, senza_carico: true });
  }
}

/**
 * Sedute di un piano su misura (§6b): per ogni segmento usa i dati del suo blocco di riferimento e la riga
 * di tabella della regola dei gradini. Numerazione continua di sedute e cicli; le sedute "Test" tra un blocco e
 * l'altro ritestano gli esercizi del blocco che inizia.
 */
export function generaSeduteComposte(parametri: ParametriGeneratore, profilo: ProfiloGen | undefined, composizione: SegmentoPiano[], bloccoId: string): { sedute: Seduta[]; avvisi: string[]; contenitori: string[] } {
  const settimane = new Map<number, RisultatoGenerazione>();
  const settimanaDi = (n: number) => {
    let w = settimane.get(n);
    if (!w) {
      w = generaSettimana(parametri, profilo, n);
      settimane.set(n, w);
    }
    return w;
  };
  const sedute: Seduta[] = [];
  let numero = 0;
  let ciclo = 0;
  const contaFase: Partial<Record<Fase, number>> = {};
  for (const seg of composizione) {
    const w = settimanaDi(seg.bloccoRif);
    const righe = seg.fase === 'test' ? [1] : righeTabella(seg.cicli);
    for (let i = 0; i < seg.cicli; i++) {
      ciclo++;
      for (let g = 0; g < parametri.N; g++) {
        numero++;
        contaFase[seg.fase] = (contaFase[seg.fase] ?? 0) + 1;
        const s = w.sessioni[g];
        sedute.push({
          id: `${bloccoId}-${numero}`,
          numero,
          fase: seg.fase,
          ciclo,
          cicloFase: i + 1,
          rigaTabella: seg.fase === 'test' ? undefined : righe[Math.min(i, righe.length - 1)],
          bloccoRif: seg.bloccoRif,
          giorno: g + 1,
          nome: nomeSeduta(seg.fase, contaFase[seg.fase]!),
          etichetta: `${s.nome} · ${s.etichetta}`,
          stato: 'futura',
          esercizi: eserciziPerFase(s, w.contenitore.sessioni[g], seg.fase, parametri, profilo?.sostituzioni ?? {}),
        });
      }
    }
  }
  const avvisi = [...new Set([...settimane.values()].flatMap((w) => w.avvisi))];
  return { sedute, avvisi, contenitori: [...settimane.values()].map((w) => w.contenitore.id) };
}

/** Blocco (programma) da una composizione per durata (§6b). */
export function nuovoBloccoComposto(parametri: ParametriGeneratore, profilo: ProfiloGen, composizione: SegmentoPiano[], numero = 1): Blocco {
  const id = `b${numero}-${Date.now().toString(36)}`;
  const r = generaSeduteComposte(parametri, profilo, composizione, id);
  return {
    id,
    numero,
    stato: r.sedute[0]?.fase === 'test' ? 'test' : 'in_corso',
    contenitore_id: r.contenitori[0] ?? '',
    sedute: r.sedute,
    test: {},
    correzioni: {},
    parametri: { ...parametri, priorita: [...parametri.priorita], esclusi: [...parametri.esclusi] },
    creato: new Date().toISOString(),
    composizione,
  };
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
export function generaSedute(parametri: ParametriGeneratore, settimana: RisultatoGenerazione, bloccoId: string, profiloSost: Record<string, string> = {}): Seduta[] {
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
        esercizi: eserciziPerFase(s, settimana.contenitore.sessioni[g], c.fase, parametri, profiloSost),
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
    sedute: generaSedute(parametri, settimana, id, profilo.sostituzioni),
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
  if (blocco.composizione) {
    // Piano su misura: si rigenera tutto dalla composizione e si tengono le sedute dei cicli già toccati.
    const tutte = generaSeduteComposte(nuovi, profilo, blocco.composizione, blocco.id).sedute;
    const conservate = blocco.sedute.filter((s) => s.ciclo < daCiclo);
    const nuove = tutte.filter((s) => s.ciclo >= daCiclo).map((s, i) => ({ ...s, numero: conservate.length + i + 1, id: `${blocco.id}-${conservate.length + i + 1}`, modulo: blocco.sedute.find((x) => x.ciclo === s.ciclo)?.modulo ?? s.modulo }));
    return { ...blocco, sedute: [...conservate, ...nuove], parametri: { ...nuovi }, parametriInAttesa: undefined };
  }
  const settimana = generaSettimana(nuovi, profilo, blocco.numero);
  const cicli = cicliDelBlocco(nuovi.bloccoBreve).filter((c) => c.ciclo >= daCiclo);
  const conservate = blocco.sedute.filter((s) => s.ciclo < daCiclo);
  let numero = conservate.length;
  const contaFase: Partial<Record<Fase, number>> = {};
  for (const s of conservate) contaFase[s.fase] = (contaFase[s.fase] ?? 0) + 1;
  const nuove: Seduta[] = [];
  const profiloSost = profilo.sostituzioni;
  const parametri = nuovi;
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
        esercizi: eserciziPerFase(s, settimana.contenitore.sessioni[g], c.fase, parametri, profiloSost),
      });
    }
  }
  return { ...blocco, sedute: [...conservate, ...nuove], parametri: { ...nuovi }, parametriInAttesa: undefined, contenitore_id: settimana.contenitore.id };
}

/** Esercizi distinti che compaiono nel blocco (per la settimana di test), con lo slot di prima comparsa. */
export function eserciziDaTestare(blocco: Blocco): EsercizioSeduta[] {
  const visti = new Map<string, EsercizioSeduta>();
  for (const s of blocco.sedute) {
    if (s.fase !== 'test' && blocco.sedute.some((x) => x.fase === 'test')) continue;
    for (const e of s.esercizi) {
      const prec = visti.get(e.esercizio_id);
      // R1 prevale su L (stesso esercizio testato una volta sola).
      if (!prec || (prec.ruolo !== 'R1' && e.ruolo === 'R1')) visti.set(e.esercizio_id, e);
    }
  }
  return [...visti.values()];
}
