import { signal, computed, batch } from '@preact/signals';
import type {
  Blocco,
  CaricoCorrente,
  Checkin,
  Esercizio,
  EsercizioSeduta,
  Obiettivo,
  ObiettivoAttivo,
  DatiCorporei,
  CaricoProfilo,
  Impostazioni,
  ParametriGeneratore,
  Profilo,
  RegistroEsercizio,
  RegistroSeduta,
  RisultatoTest,
  Seduta,
  SerieRegistrata,
  Stato,
  TestMode,
} from '../tipi';
import { CHIAVI, type Chiave, caricaMeta, caricaStato, salvaChiave, salvaMeta, cancellaTutto, STATO_VUOTO } from './db';
import { AUTOCORREZIONE_CICLO, AUTOCORREZIONE_SERIE, FATTORE_LAVORO_DEFAULT, RECUPERI_DEFAULT, STRIPPING } from '../data/tabelle';
import { nuovoBlocco, rigeneraSeduteFuture } from '../motore/generatore';
import { prescrizione } from '../motore/prescrizione';
import { arrotonda, stimaMassimale } from '../motore/carichi';
import { nuovoCaricoCorrente } from '../motore/correnti';
import { valutaRicalcolo } from '../motore/ricalcolo';
import { cambiaObiettivo as cambiaObiettivoPuro, carichiRecenti, nuovoBloccoIpertrofia, nuovoBloccoPreservazione, serveTest } from '../motore/moduli';
import { ENERGIA_PER_OBIETTIVO } from '../motore/pianificatore';
import { ESERCIZI_PER_ID } from '../data/esercizi';

// Stato globale con signals. Ogni mutazione passa da `aggiorna`, che salva la chiave toccata.

export const stato = signal<Stato>({ ...STATO_VUOTO });
export const pronto = signal(false);
export const ultimoSalvataggio = signal<string | null>(null);

export const profilo = computed(() => stato.value.profilo);
export const blocco = computed(() => stato.value.blocco);
/** Impostazioni del profilo con i default per i campi aggiunti dopo (migrazione implicita). */
export function impostazioniDi(p: Profilo | null | undefined): Impostazioni {
  if (!p) return IMPOSTAZIONI_DEFAULT;
  return { ...IMPOSTAZIONI_DEFAULT, ...p.impostazioni, recuperi: { ...RECUPERI_DEFAULT, ...p.impostazioni.recuperi } };
}
export const impostazioni = computed<Impostazioni>(() => impostazioniDi(stato.value.profilo));

export const IMPOSTAZIONI_DEFAULT: Impostazioni = {
  arrotondamento: 0.5,
  fattore_lavoro: FATTORE_LAVORO_DEFAULT,
  recuperi: { ...RECUPERI_DEFAULT },
  suoni: true,
  vibrazione: true,
  notifiche: false,
  stripping: false,
};

let meta = { modificato: {} as Partial<Record<Chiave, string>>, daInviare: [] as Chiave[] };
const ascoltatori = new Set<(chiavi: Chiave[]) => void>();

/** Chi vuole sapere quando cambiano i dati (es. la sincronizzazione). */
export function suModifica(fn: (chiavi: Chiave[]) => void): () => void {
  ascoltatori.add(fn);
  return () => ascoltatori.delete(fn);
}

export async function avvia(): Promise<void> {
  stato.value = await caricaStato();
  meta = await caricaMeta();
  pronto.value = true;
}

async function aggiorna(mod: Partial<Stato>, chiavi: Chiave[]): Promise<void> {
  stato.value = { ...stato.value, ...mod };
  const ora = new Date().toISOString();
  for (const k of chiavi) {
    await salvaChiave(k, (stato.value as unknown as Record<string, unknown>)[k]);
    meta.modificato[k] = ora;
    if (!meta.daInviare.includes(k)) meta.daInviare.push(k);
  }
  await salvaMeta(meta);
  ultimoSalvataggio.value = ora;
  for (const fn of ascoltatori) fn(chiavi);
}

export function metaSync() {
  return meta;
}
export async function segnaInviate(chiavi: Chiave[]) {
  meta.daInviare = meta.daInviare.filter((k) => !chiavi.includes(k));
  await salvaMeta(meta);
}

/** Sostituisce tutto lo stato (import backup o pull dal server). */
export async function sostituisciStato(nuovo: Stato, chiavi: Chiave[] = [...CHIAVI]): Promise<void> {
  await aggiorna(nuovo, chiavi);
}

export async function azzeraTutto(): Promise<void> {
  await cancellaTutto();
  meta = { modificato: {}, daInviare: [] };
  stato.value = { ...STATO_VUOTO };
}

// ---------- Profilo e blocco ----------

/** Blocco iniziale per l'obiettivo attivo (SPEC_PIANIFICATORE §4): massa/mantenimento con test, dimagrimento = test + Preservazione. */
function bloccoPerObiettivo(p: Profilo, numero: number, conTest: boolean, ponte = false): Blocco {
  const ob = p.obiettivoAttivo;
  if (ob?.tipo === 'definizione') return nuovoBloccoPreservazione(p.parametri, p, ob.settimane, conTest, numero, ponte);
  if (ob?.tipo === 'mantenimento') return nuovoBloccoIpertrofia(p.parametri, p, 'mantenimento', conTest, numero, ponte);
  return nuovoBloccoIpertrofia(p.parametri, p, 'massa', conTest, numero, ponte);
}

export async function creaProfilo(nome: string, sesso: 'M' | 'F', parametri: ParametriGeneratore, obiettivo: Obiettivo | ObiettivoAttivo = 'massa', datiCorporei?: DatiCorporei): Promise<void> {
  const ob: ObiettivoAttivo = typeof obiettivo === 'string' ? { tipo: obiettivo, dal: new Date().toISOString(), settimane: obiettivo === 'definizione' ? 4 : obiettivo === 'mantenimento' ? 12 : 17, energia: ENERGIA_PER_OBIETTIVO[obiettivo] } : obiettivo;
  const p: Profilo = {
    id: 'p-' + Date.now().toString(36),
    nome,
    sesso,
    parametri,
    impostazioni: { ...IMPOSTAZIONI_DEFAULT, recuperi: { ...RECUPERI_DEFAULT } },
    creato: new Date().toISOString(),
    sostituzioni: {},
    esercizi_personalizzati: [],
    fondamentali_promossi: [],
    obiettivo: ob.tipo,
    obiettivoAttivo: ob,
    datiCorporei,
    carichi: {},
  };
  const b = bloccoPerObiettivo(p, 1, true);
  await aggiorna({ profilo: p, blocco: b }, ['profilo', 'blocco']);
}

export async function aggiornaDatiCorporei(d: DatiCorporei): Promise<void> {
  const p = stato.value.profilo;
  if (!p) return;
  await aggiorna({ profilo: { ...p, datiCorporei: d } }, ['profilo']);
}

export async function aggiornaObiettivoAttivo(mod: Partial<ObiettivoAttivo>): Promise<void> {
  const p = stato.value.profilo;
  if (!p?.obiettivoAttivo) return;
  await aggiorna({ profilo: { ...p, obiettivoAttivo: { ...p.obiettivoAttivo, ...mod } } }, ['profilo']);
}

/**
 * Cambio di obiettivo (SPEC_PIANIFICATORE §6): al confine di ciclo (default) o subito. Senza blocco attivo
 * apre direttamente il blocco del nuovo modulo; il test si fa solo se mancano i carichi nel profilo.
 */
export async function cambiaObiettivo(ob: ObiettivoAttivo, quando: 'confine' | 'subito' = 'confine'): Promise<string> {
  const p = stato.value.profilo;
  const b = stato.value.blocco;
  if (!p) return '';
  const profiloNuovo: Profilo = { ...p, obiettivo: ob.tipo, obiettivoAttivo: ob, obiettivoInAttesa: undefined };
  if (!b || b.stato === 'completato') {
    const numero = (b?.numero ?? 0) + 1;
    const passati = b ? [...stato.value.blocchiPassati, b] : stato.value.blocchiPassati;
    const tentativo = bloccoPerObiettivo(profiloNuovo, numero, false, false);
    const nuovo = serveTest(tentativo, p.carichi) && !carichiRecenti(p.carichi) ? bloccoPerObiettivo(profiloNuovo, numero, true) : tentativo;
    await aggiorna({ profilo: profiloNuovo, blocco: nuovo, blocchiPassati: passati }, ['profilo', 'blocco', 'blocchiPassati']);
    return 'Nuovo obiettivo avviato.';
  }
  const inCorso = b.sedute.some((s) => s.stato === 'in_corso');
  const cicloAperto = (() => {
    const toccati = b.sedute.filter((s) => s.stato !== 'futura');
    if (!toccati.length) return false;
    const ultimo = Math.max(...toccati.map((s) => s.ciclo));
    return b.sedute.some((s) => s.ciclo === ultimo && s.stato !== 'completata');
  })();
  if (quando === 'confine' && (inCorso || cicloAperto)) {
    await aggiorna({ profilo: { ...p, obiettivoInAttesa: ob } }, ['profilo']);
    return 'Il nuovo obiettivo parte alla fine del ciclo in corso.';
  }
  const esito = cambiaObiettivoPuro(b, profiloNuovo, ob, quando === 'subito');
  await aggiorna({ profilo: profiloNuovo, blocco: esito.nuovo, blocchiPassati: [...stato.value.blocchiPassati, esito.chiuso] }, ['profilo', 'blocco', 'blocchiPassati']);
  return esito.perche;
}

/** Passo di carico per "Facile" sull'ultima serie, secondo l'attrezzo (SPEC_PIANIFICATORE §7.2). */
function passoCarico(esercizio_id: string): number {
  const modo = ESERCIZI_PER_ID[esercizio_id]?.carico_modo;
  if (modo === 'manubrio_singolo') return 2;
  if (modo === 'macchina' || modo === 'cavo') return 5;
  return 2.5;
}

function aggiornaProfiloCarichi(p: Profilo, c: CaricoProfilo): Profilo {
  return { ...p, carichi: { ...(p.carichi ?? {}), [c.esercizio_id]: c } };
}

export async function aggiornaImpostazioni(mod: Partial<Impostazioni>): Promise<void> {
  const p = stato.value.profilo;
  if (!p) return;
  await aggiorna({ profilo: { ...p, impostazioni: { ...p.impostazioni, ...mod } } }, ['profilo']);
}

export async function aggiornaProfilo(mod: Partial<Pick<Profilo, 'nome' | 'sesso' | 'obiettivo'>>): Promise<void> {
  const p = stato.value.profilo;
  if (!p) return;
  await aggiorna({ profilo: { ...p, ...mod } }, ['profilo']);
}

/** Cambio di N/T/priorità/esclusi: si applica al confine di ciclo (SPEC §4.7). */
export async function cambiaParametri(nuovi: ParametriGeneratore): Promise<void> {
  const p = stato.value.profilo;
  const b = stato.value.blocco;
  if (!p) return;
  const profiloNuovo = { ...p, parametri: nuovi };
  if (!b || b.stato === 'completato') {
    await aggiorna({ profilo: profiloNuovo }, ['profilo']);
    return;
  }
  const bloccoNuovo = rigeneraSeduteFuture(b, nuovi, profiloNuovo);
  await aggiorna({ profilo: profiloNuovo, blocco: bloccoNuovo }, ['profilo', 'blocco']);
}

export async function aggiungiEsercizioPersonalizzato(e: Esercizio): Promise<void> {
  const p = stato.value.profilo;
  if (!p) return;
  await aggiorna({ profilo: { ...p, esercizi_personalizzati: [...p.esercizi_personalizzati, { ...e, personalizzato: true }] } }, ['profilo']);
}

/** Chiude il blocco corrente e ne apre uno nuovo con settimana di test (SPEC §6.1). */
export async function nuovoBloccoSuccessivo(): Promise<void> {
  const p = stato.value.profilo;
  const b = stato.value.blocco;
  if (!p) return;
  const passati = b ? [...stato.value.blocchiPassati, { ...b, stato: 'completato' as const }] : stato.value.blocchiPassati;
  const nuovo = nuovoBlocco(p.parametri, p, (b?.numero ?? 0) + 1);
  await aggiorna({ blocco: nuovo, blocchiPassati: passati }, ['blocco', 'blocchiPassati']);
}

// ---------- Test ----------

/**
 * Salva un test (TEST_INIZIO_BLOCCO §2): `stima` = reps e carico della prova → 1RM Brzycki arrotondato;
 * `serie_unica` = N RM fisso e carico di lavoro, usato com'è per tutto il blocco.
 */
export async function salvaTest(esercizio_id: string, kg: number, rip: number, modo: TestMode, rir = 0): Promise<void> {
  const b = stato.value.blocco;
  const p = stato.value.profilo;
  if (!b || !p) return;
  const r: RisultatoTest = { esercizio_id, kg, rip, modo };
  // Stima con ripetizioni di riserva (SPEC_PIANIFICATORE §7.4): reps effettive = reps + RIR.
  if (modo === 'stima') {
    r.rm1 = stimaMassimale(rip, kg, impostazioniDi(p).arrotondamento, rir);
    if (rir > 0) r.rir = rir;
  }
  // Un nuovo test è un nuovo carico base: il carico corrente scelto prima non vale più.
  const carichiCorrenti = { ...(b.carichiCorrenti ?? {}) };
  delete carichiCorrenti[esercizio_id];
  const profiloNuovo = aggiornaProfiloCarichi(p, { esercizio_id, kg, rip, modo, massimale: r.rm1, rir: r.rir, data: new Date().toISOString(), origine: 'test' });
  await aggiorna({ profilo: profiloNuovo, blocco: { ...b, test: { ...b.test, [esercizio_id]: r }, carichiCorrenti } }, ['profilo', 'blocco']);
}

/** Ultimo test dello stesso esercizio nei blocchi passati (suggerimento per il ritest, TEST_INIZIO_BLOCCO §3). */
export function testBloccoPrecedente(esercizio_id: string): RisultatoTest | undefined {
  const passati = stato.value.blocchiPassati;
  for (let i = passati.length - 1; i >= 0; i--) {
    const t = passati[i].test[esercizio_id];
    if (t) return t;
  }
  return undefined;
}

/** Promuove (o retrocede) un esercizio guida a fondamentale: stima + scala RM; rigenera le sedute future. */
export async function promuoviFondamentale(esercizio_id: string, promosso: boolean): Promise<void> {
  const p = stato.value.profilo;
  const b = stato.value.blocco;
  if (!p) return;
  const attuali = p.fondamentali_promossi ?? [];
  const lista = promosso ? [...new Set([...attuali, esercizio_id])] : attuali.filter((x) => x !== esercizio_id);
  const profiloNuovo: Profilo = { ...p, fondamentali_promossi: lista };
  if (!b || b.stato === 'completato') {
    await aggiorna({ profilo: profiloNuovo }, ['profilo']);
    return;
  }
  const bloccoNuovo = rigeneraSeduteFuture(b, b.parametri, profiloNuovo);
  // Un test fatto con l'altro modo non vale più: va rifatto.
  const test = { ...bloccoNuovo.test };
  const t = test[esercizio_id];
  if (t && t.modo !== (promosso ? 'stima' : 'serie_unica')) delete test[esercizio_id];
  await aggiorna({ profilo: profiloNuovo, blocco: { ...bloccoNuovo, test } }, ['profilo', 'blocco']);
}

export async function rimuoviTest(esercizio_id: string): Promise<void> {
  const b = stato.value.blocco;
  if (!b) return;
  const test = { ...b.test };
  delete test[esercizio_id];
  await aggiorna({ blocco: { ...b, test } }, ['blocco']);
}

// ---------- Sedute ----------

export function sedutaPerId(id: string): Seduta | undefined {
  return stato.value.blocco?.sedute.find((s) => s.id === id);
}

/** La prossima seduta avviabile: la prima non completata (la sequenza non cambia mai, SPEC §3). */
export const prossimaSeduta = computed<Seduta | undefined>(() => stato.value.blocco?.sedute.find((s) => s.stato !== 'completata'));

export function avviabile(s: Seduta): boolean {
  return prossimaSeduta.value?.id === s.id;
}

async function salvaSeduta(seduta: Seduta, bloccoMod: Partial<Blocco> = {}): Promise<void> {
  const b = stato.value.blocco;
  if (!b) return;
  const sedute = b.sedute.map((s) => (s.id === seduta.id ? seduta : s));
  await aggiorna({ blocco: { ...b, ...bloccoMod, sedute } }, ['blocco']);
}

/** Avvia la seduta: crea il registro con i valori previsti. */
export async function iniziaSeduta(id: string): Promise<void> {
  const b = stato.value.blocco;
  const p = stato.value.profilo;
  const s = sedutaPerId(id);
  if (!b || !p || !s || s.stato === 'completata') return;
  if (stato.value.registro[id]) {
    if (s.stato !== 'in_corso') await salvaSeduta({ ...s, stato: 'in_corso' });
    return;
  }
  const reg: RegistroSeduta = { seduta_id: id, iniziata: new Date().toISOString(), esercizi: {} };
  for (const e of s.esercizi) {
    const pr = prescrizioneDi(e, s);
    const serie: SerieRegistrata[] = [];
    for (let n = 1; n <= pr.serie; n++) serie.push({ n, kg_prev: pr.kg ?? 0, kg_piano: pr.kgPiano, rip_prev: pr.rip, fatta: false, rest_pause: e.rest_pause });
    reg.esercizi[e.slot] = { esercizio_id: e.esercizio_id, serie };
  }
  batch(() => {});
  await aggiorna({ registro: { ...stato.value.registro, [id]: reg } }, ['registro']);
  await salvaSeduta({ ...s, stato: 'in_corso', data: reg.iniziata });
}

export function registroDi(id: string): RegistroSeduta | undefined {
  return stato.value.registro[id];
}

/** Chiave del carico corrente: la seconda riga ×12 ha un carico suo, separato dal Target dello stesso esercizio. */
export function chiaveCorrente(e: Pick<EsercizioSeduta, 'esercizio_id' | 'seconda_riga'>): string {
  return e.seconda_riga ? `${e.esercizio_id}#2` : e.esercizio_id;
}

/** Carico corrente di un esercizio nel blocco (SPEC §9.2b). */
export function caricoCorrenteDi(e: Pick<EsercizioSeduta, 'esercizio_id' | 'seconda_riga'>): CaricoCorrente | undefined {
  return stato.value.blocco?.carichiCorrenti?.[chiaveCorrente(e)];
}

/** Prescrizione completa di un esercizio in una seduta: test, correzioni, promozioni e carico corrente. */
export function prescrizioneDi(e: EsercizioSeduta, s: Pick<Seduta, 'fase' | 'cicloFase'>) {
  const b = stato.value.blocco!;
  const p = stato.value.profilo!;
  return prescrizione(e, s, b.test, impostazioniDi(p), b.correzioni[e.esercizio_id] ?? 0, p.fondamentali_promossi ?? [], b.carichiCorrenti?.[chiaveCorrente(e)]);
}

/**
 * Aggiorna una serie (kg/rip/fatta). Autocorrezione in seduta: rip < previste → serie successiva a −5% (SPEC §7).
 * Un kg scritto dall'utente diverso dal precompilato diventa il carico corrente dell'esercizio e precompila
 * le serie rimanenti e le sedute successive (SPEC §9.2b).
 */
export async function aggiornaSerie(sedutaId: string, slot: number, n: number, mod: Partial<SerieRegistrata>): Promise<void> {
  const reg = stato.value.registro[sedutaId];
  const p = stato.value.profilo;
  const b = stato.value.blocco;
  const s = sedutaPerId(sedutaId);
  if (!reg || !p || !b || !s) return;
  const es = reg.esercizi[slot];
  if (!es) return;
  const serie = es.serie.map((x) => (x.n === n ? { ...x, ...mod } : { ...x }));
  const corrente = serie.find((x) => x.n === n)!;
  const prima = es.serie.find((x) => x.n === n)!;
  let carichiCorrenti = b.carichiCorrenti;
  let profiloNuovo = p;
  let test = b.test;
  let note = b.note;
  const esSedutaRiga = s.esercizi.find((e) => e.slot === slot);
  const fondamentale = esSedutaRiga?.ruolo === 'R1' || esSedutaRiga?.ruolo === 'L';

  // Carico scelto dall'utente (non una serie di stripping, non il semplice "fatta" sul precompilato).
  if (mod.kg !== undefined && !corrente.stripping && mod.kg !== prima.kg_prev) {
    const esSeduta = s.esercizi.find((e) => e.slot === slot);
    const ruolo = esSeduta?.ruolo ?? 'C';
    const chiave = chiaveCorrente(esSeduta ?? { esercizio_id: es.esercizio_id });
    const nuovo = nuovoCaricoCorrente(ruolo, mod.kg, prima.kg_piano, sedutaId);
    carichiCorrenti = { ...(b.carichiCorrenti ?? {}) };
    if (nuovo) carichiCorrenti[chiave] = nuovo;
    else delete carichiCorrenti[chiave];
    for (const x of serie) if (x.n > n && !x.fatta && !x.stripping) x.kg_prev = mod.kg;
    corrente.kg_prev = mod.kg;
    // Profilo carichi: il carico scelto a mano diventa il carico corrente dell'esercizio (ruoli a carico fisso).
    if (!fondamentale && esSedutaRiga && !esSedutaRiga.seconda_riga) {
      const prec = p.carichi?.[es.esercizio_id] ?? b.test[es.esercizio_id];
      profiloNuovo = aggiornaProfiloCarichi(profiloNuovo, { esercizio_id: es.esercizio_id, kg: prec?.kg ?? mod.kg, rip: prec?.rip ?? corrente.rip_prev, modo: prec?.modo ?? 'serie_unica', caricoCorrente: mod.kg, massimale: (prec as CaricoProfilo | undefined)?.massimale, data: new Date().toISOString(), origine: 'manuale' });
    }
  }
  if (mod.fatta && corrente.rip !== undefined && corrente.rip < corrente.rip_prev) {
    const succ = serie.find((x) => x.n > n && !x.fatta && !x.stripping);
    if (succ && succ.kg === undefined && succ.kg_prev > 0) succ.kg_prev = arrotonda(succ.kg_prev * (1 + AUTOCORREZIONE_SERIE), p.impostazioni.arrotondamento);
  }
  // Ricalcolo del massimale (SPEC_PIANIFICATORE §7.2): peso alzato e ripetizioni completate su un fondamentale.
  if (mod.fatta && fondamentale && !corrente.stripping && corrente.kg !== undefined && corrente.rip !== undefined && corrente.kg > (corrente.kg_piano ?? corrente.kg_prev) && corrente.rip >= corrente.rip_prev) {
    const t = b.test[es.esercizio_id];
    const rir = corrente.rir ?? (corrente.sforzo === 'facile' ? 2 : corrente.sforzo === 'giusto' ? 1 : 0);
    const esito = valutaRicalcolo(t?.rm1, corrente.kg, corrente.rip, rir);
    if (esito.aggiorna && t) {
      test = { ...b.test, [es.esercizio_id]: { ...t, rm1: esito.stima, rm1_test: t.rm1_test ?? t.rm1 } };
      carichiCorrenti = { ...(carichiCorrenti ?? {}) };
      delete carichiCorrenti[chiaveCorrente(esSedutaRiga!)];
      profiloNuovo = aggiornaProfiloCarichi(profiloNuovo, { esercizio_id: es.esercizio_id, kg: corrente.kg, rip: corrente.rip, modo: 'stima', massimale: esito.stima, data: new Date().toISOString(), origine: 'ricalcolo' });
      note = [...(b.note ?? []), { data: new Date().toISOString(), testo: `${ESERCIZI_PER_ID[es.esercizio_id]?.nome ?? es.esercizio_id}: nuovo massimale ${esito.stima} kg (era ${t.rm1}).`, perche: esito.perche }];
    }
  }
  // "Facile" sull'ultima serie di Target e complementari: proposta di +1 passo alla seduta successiva.
  if (mod.sforzo === 'facile' && !fondamentale && esSedutaRiga && !esSedutaRiga.seconda_riga && !corrente.stripping) {
    const ultima = Math.max(...serie.filter((x) => !x.stripping).map((x) => x.n));
    if (n === ultima) {
      const kgBase = corrente.kg ?? corrente.kg_prev;
      if (kgBase > 0) {
        carichiCorrenti = { ...(carichiCorrenti ?? {}), [chiaveCorrente(esSedutaRiga)]: { kg: arrotonda(kgBase + passoCarico(es.esercizio_id), p.impostazioni.arrotondamento), aggiornato: new Date().toISOString(), seduta_id: sedutaId, origine: 'proposta' } };
      }
    }
  }
  const nuovoReg: RegistroSeduta = { ...reg, esercizi: { ...reg.esercizi, [slot]: { ...es, serie } } };
  const bloccoCambiato = carichiCorrenti !== b.carichiCorrenti || test !== b.test || note !== b.note;
  const chiavi: Chiave[] = ['registro', ...(bloccoCambiato ? ['blocco' as const] : []), ...(profiloNuovo !== p ? ['profilo' as const] : [])];
  await aggiorna({ registro: { ...stato.value.registro, [sedutaId]: nuovoReg }, blocco: { ...b, carichiCorrenti, test, note }, profilo: profiloNuovo }, chiavi);
}

/** Torna al carico del piano per un esercizio (SPEC §9.2b punto 5); nella seduta in corso ricalcola le serie non fatte. */
export async function ripristinaCaricoPiano(chiave: string, sedutaId?: string): Promise<void> {
  const b = stato.value.blocco;
  if (!b) return;
  const carichiCorrenti = { ...(b.carichiCorrenti ?? {}) };
  delete carichiCorrenti[chiave];
  const registro = { ...stato.value.registro };
  const reg = sedutaId ? registro[sedutaId] : undefined;
  const sd = sedutaId ? sedutaPerId(sedutaId) : undefined;
  if (reg) {
    const esercizi = { ...reg.esercizi };
    for (const [slot, es] of Object.entries(esercizi)) {
      const esSeduta = sd?.esercizi.find((e) => e.slot === Number(slot));
      if (chiaveCorrente(esSeduta ?? { esercizio_id: es.esercizio_id }) !== chiave) continue;
      esercizi[Number(slot)] = { ...es, serie: es.serie.map((x) => (x.fatta || x.stripping || x.kg_piano === undefined ? x : { ...x, kg_prev: x.kg_piano })) };
    }
    registro[sedutaId!] = { ...reg, esercizi };
  }
  await aggiorna({ blocco: { ...b, carichiCorrenti }, registro }, ['blocco', 'registro']);
}

export async function aggiornaNota(sedutaId: string, slot: number, nota: string): Promise<void> {
  const reg = stato.value.registro[sedutaId];
  if (!reg || !reg.esercizi[slot]) return;
  const nuovoReg: RegistroSeduta = { ...reg, esercizi: { ...reg.esercizi, [slot]: { ...reg.esercizi[slot], nota } } };
  await aggiorna({ registro: { ...stato.value.registro, [sedutaId]: nuovoReg } }, ['registro']);
}

/** Aggiunge la serie di stripping (−30%) all'esercizio (opzione, SPEC §7). */
export async function aggiungiStripping(sedutaId: string, slot: number): Promise<void> {
  const reg = stato.value.registro[sedutaId];
  const p = stato.value.profilo;
  if (!reg || !p || !reg.esercizi[slot]) return;
  const es = reg.esercizi[slot];
  if (es.serie.some((x) => x.stripping)) return;
  const ultima = es.serie[es.serie.length - 1];
  const kgBase = ultima.kg ?? ultima.kg_prev;
  const nuova: SerieRegistrata = { n: ultima.n + 1, kg_prev: arrotonda(kgBase * (1 + STRIPPING), p.impostazioni.arrotondamento), rip_prev: ultima.rip_prev, fatta: false, stripping: true };
  const nuovoReg: RegistroSeduta = { ...reg, esercizi: { ...reg.esercizi, [slot]: { ...es, serie: [...es.serie, nuova] } } };
  await aggiorna({ registro: { ...stato.value.registro, [sedutaId]: nuovoReg } }, ['registro']);
}

/** Sostituisce un esercizio nella seduta (SPEC §9.3); `permanente` lo applica anche alle sedute future. */
export async function sostituisciEsercizio(sedutaId: string, slot: number, nuovoId: string, permanente: boolean): Promise<void> {
  const b = stato.value.blocco;
  const p = stato.value.profilo;
  const s = sedutaPerId(sedutaId);
  if (!b || !p || !s) return;
  const es = s.esercizi.find((e) => e.slot === slot);
  if (!es) return;
  const vecchioId = es.esercizio_id;
  const test = { ...b.test };
  // Carico: se l'alternativa ha un test usa quello, altrimenti eredita quello dell'originale (modificabile).
  // In fase di test l'alternativa si testa da sé: niente eredità.
  if (s.fase !== 'test' && !test[nuovoId] && test[vecchioId]) test[nuovoId] = { ...test[vecchioId], esercizio_id: nuovoId };
  const carichiCorrenti = { ...(b.carichiCorrenti ?? {}) };
  if (s.fase !== 'test' && !carichiCorrenti[nuovoId] && carichiCorrenti[vecchioId]) carichiCorrenti[nuovoId] = { ...carichiCorrenti[vecchioId] };

  const aggiornaEs = (sd: Seduta): Seduta => ({ ...sd, esercizi: sd.esercizi.map((e) => (e.slot === slot && e.esercizio_id === vecchioId ? { ...e, esercizio_id: nuovoId } : e)) });
  const sedute = b.sedute.map((sd) => {
    if (sd.id === sedutaId) return aggiornaEs(sd);
    if (permanente && sd.stato === 'futura' && sd.giorno === s.giorno) return aggiornaEs(sd);
    return sd;
  });
  const profiloNuovo = permanente ? { ...p, sostituzioni: { ...p.sostituzioni, [vecchioId]: nuovoId } } : p;

  // Se la seduta è in corso, ricalcola le serie non ancora fatte.
  const registro = { ...stato.value.registro };
  const reg = registro[sedutaId];
  if (reg && reg.esercizi[slot]) {
    const sd = sedute.find((x) => x.id === sedutaId)!;
    const eNuovo = sd.esercizi.find((e) => e.slot === slot)!;
    const pr = prescrizione(eNuovo, sd, test, impostazioniDi(p), b.correzioni[nuovoId] ?? 0, p.fondamentali_promossi, carichiCorrenti[nuovoId]);
    const serie = reg.esercizi[slot].serie.map((x) => (x.fatta ? x : { ...x, kg_prev: pr.kg ?? 0, kg_piano: pr.kgPiano, rip_prev: pr.rip }));
    registro[sedutaId] = { ...reg, esercizi: { ...reg.esercizi, [slot]: { esercizio_id: nuovoId, serie } } };
  }
  await aggiorna({ profilo: profiloNuovo, blocco: { ...b, sedute, test, carichiCorrenti }, registro }, ['profilo', 'blocco', 'registro']);
}

/** Registro precedente dello stesso esercizio (seduta equivalente del ciclo prima, SPEC §9.2). */
export function registroPrecedente(sedutaId: string, esercizio_id: string): { seduta: Seduta; es: RegistroEsercizio } | undefined {
  const b = stato.value.blocco;
  const s = sedutaPerId(sedutaId);
  if (!b || !s) return undefined;
  const precedenti = b.sedute.filter((x) => x.numero < s.numero && x.stato === 'completata' && x.fase !== 'test').sort((a, c) => c.numero - a.numero);
  for (const sd of precedenti) {
    const reg = stato.value.registro[sd.id];
    if (!reg) continue;
    const es = Object.values(reg.esercizi).find((e) => e.esercizio_id === esercizio_id && e.serie.some((x) => x.fatta));
    if (es) return { seduta: sd, es };
  }
  return undefined;
}

/** Completa la seduta; autocorrezione di ciclo: 2 sedute di fila con rip mancanti → −2,5 % (SPEC §7). */
export async function completaSeduta(id: string): Promise<void> {
  const b = stato.value.blocco;
  const s = sedutaPerId(id);
  if (!b || !s) return;
  const reg = stato.value.registro[id];
  const correzioni = { ...b.correzioni };
  if (reg) {
    for (const es of Object.values(reg.esercizi)) {
      const def = ESERCIZI_PER_ID[es.esercizio_id];
      if (!def?.fondamentale && b.test[es.esercizio_id]?.modo !== 'stima') continue;
      const mancate = es.serie.some((x) => x.fatta && !x.stripping && x.rip !== undefined && x.rip < x.rip_prev);
      if (!mancate) continue;
      const prec = registroPrecedente(id, es.esercizio_id);
      const mancatePrec = prec?.es.serie.some((x) => x.fatta && !x.stripping && x.rip !== undefined && x.rip < x.rip_prev);
      if (mancatePrec) correzioni[es.esercizio_id] = Math.round(((correzioni[es.esercizio_id] ?? 0) + AUTOCORREZIONE_CICLO) * 1000) / 1000;
    }
  }
  const sedute = b.sedute.map((x) => (x.id === id ? { ...x, stato: 'completata' as const, data: x.data ?? new Date().toISOString() } : x));
  const tutteTestFatte = sedute.filter((x) => x.fase === 'test').every((x) => x.stato === 'completata');
  const tutteFatte = sedute.every((x) => x.stato === 'completata');
  const statoBlocco: Blocco['stato'] = tutteFatte ? 'completato' : tutteTestFatte ? 'in_corso' : 'test';
  const registro = reg ? { ...stato.value.registro, [id]: { ...reg, completata: new Date().toISOString() } } : stato.value.registro;
  await aggiorna({ blocco: { ...b, sedute, correzioni, stato: statoBlocco }, registro }, ['blocco', 'registro']);
  // Cambio di obiettivo in attesa: si applica appena il ciclo è completo (SPEC_PIANIFICATORE §6).
  const p = stato.value.profilo;
  const cicloCompleto = sedute.filter((x) => x.ciclo === s.ciclo).every((x) => x.stato === 'completata');
  if (p?.obiettivoInAttesa && cicloCompleto) await cambiaObiettivo(p.obiettivoInAttesa, 'subito');
}

export async function impostaCorrezione(esercizio_id: string, frazione: number): Promise<void> {
  const b = stato.value.blocco;
  if (!b) return;
  await aggiorna({ blocco: { ...b, correzioni: { ...b.correzioni, [esercizio_id]: frazione } } }, ['blocco']);
}

/** Riapre una seduta completata (per correggere errori). */
export async function riapriSeduta(id: string): Promise<void> {
  const b = stato.value.blocco;
  if (!b) return;
  const sedute = b.sedute.map((x) => (x.id === id ? { ...x, stato: 'in_corso' as const } : x));
  await aggiorna({ blocco: { ...b, sedute, stato: b.stato === 'completato' ? 'in_corso' : b.stato } }, ['blocco']);
}

// ---------- Check-in ----------

export async function aggiungiCheckin(c: Checkin): Promise<void> {
  const altri = stato.value.checkin.filter((x) => x.data !== c.data);
  await aggiorna({ checkin: [...altri, c].sort((a, b) => a.data.localeCompare(b.data)) }, ['checkin']);
}

export async function rimuoviCheckin(data: string): Promise<void> {
  await aggiorna({ checkin: stato.value.checkin.filter((x) => x.data !== data) }, ['checkin']);
}

/** Giorni dall'ultima seduta completata (per il consiglio di rientro). */
export const giorniDallUltimaSeduta = computed<number | null>(() => {
  const b = stato.value.blocco;
  if (!b) return null;
  const date = b.sedute.filter((s) => s.stato === 'completata' && s.data).map((s) => new Date(s.data!).getTime());
  if (!date.length) return null;
  return Math.floor((Date.now() - Math.max(...date)) / 86_400_000);
});
