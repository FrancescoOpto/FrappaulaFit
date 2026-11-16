import { signal, computed } from '@preact/signals';
import type { CaricoCorrente, Checkin, DatiCorporei, Esperienza, Impostazioni, ModoSeduta, Obiettivo, Profilo, Programma, RegistroSeduta, RegistroVoce, RisultatoTest, Seduta, SerieRegistrata, Stato } from '../tipi';
import { CHIAVI, type Chiave, caricaMeta, caricaStato, salvaChiave, salvaMeta, cancellaTutto, STATO_VUOTO } from './db';
import { componi, generaSedute, settimaneDaMesi } from '../motore/calendario';
import { pianoSeduta, progressioneDoppia, type PianoSeduta } from '../motore/seduta';
import { massimaleDaSerie, type Contesto } from '../motore/prescrizione';
import { arrotonda, stimaMassimale } from '../motore/carichi';
import { valutaRicalcolo } from '../motore/ricalcolo';
import { ESERCIZI_PER_ID } from '../data/esercizi';
import { sessione } from '../data/programma';

// Stato globale dell'app di lei. Ogni mutazione passa da `aggiorna`, che salva le chiavi toccate.

export const stato = signal<Stato>({ ...STATO_VUOTO });
export const pronto = signal(false);
export const ultimoSalvataggio = signal<string | null>(null);

export const profilo = computed(() => stato.value.profilo);
export const programma = computed(() => stato.value.programma);

export const IMPOSTAZIONI_DEFAULT: Impostazioni = {
  tema: 'scuro',
  arrotondamento: 0.5,
  // In classica la seduta A arriva a ~68′ nelle settimane con più serie: 75′ evita i tagli (PROPOSTA §4).
  T: 75,
  phaDefault: false,
  suoni: true,
  vibrazione: true,
  notifiche: false,
  // Collaudo: qualsiasi seduta si avvia fuori ordine. Da spegnere quando si comincia davvero.
  modalita_prova: true,
};

export function impostazioniDi(p: Profilo | null | undefined): Impostazioni {
  return { ...IMPOSTAZIONI_DEFAULT, ...(p?.impostazioni ?? {}) };
}
export const impostazioni = computed<Impostazioni>(() => impostazioniDi(stato.value.profilo));

let meta = { modificato: {} as Partial<Record<Chiave, string>>, daInviare: [] as Chiave[] };
const ascoltatori = new Set<(chiavi: Chiave[]) => void>();

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

export async function sostituisciStato(nuovo: Stato, chiavi: Chiave[] = [...CHIAVI]): Promise<void> {
  await aggiorna(nuovo, chiavi);
}

export async function azzeraTutto(): Promise<void> {
  await cancellaTutto();
  meta = { modificato: {}, daInviare: [] };
  stato.value = { ...STATO_VUOTO };
}

// ---------- Profilo e programma ----------

export function nuovoProgramma(obiettivo: Obiettivo, mesi: number, conTest = true, test: Record<string, RisultatoTest> = {}): Programma {
  const id = 'p' + Date.now().toString(36);
  const composizione = componi(settimaneDaMesi(mesi), conTest);
  return { id, creato: new Date().toISOString(), mesi, obiettivo, composizione, sedute: generaSedute(composizione, id), test, carichiCorrenti: {}, note: [] };
}

export async function creaProfilo(dati: { nome: string; esperienza: Esperienza; obiettivo: Obiettivo; mesi: number; impostazioni?: Partial<Impostazioni>; datiCorporei?: DatiCorporei }): Promise<void> {
  const p: Profilo = {
    id: 'l-' + Date.now().toString(36),
    nome: dati.nome,
    creato: new Date().toISOString(),
    esperienza: dati.esperienza,
    obiettivo: dati.obiettivo,
    mesi: dati.mesi,
    impostazioni: { ...IMPOSTAZIONI_DEFAULT, ...(dati.impostazioni ?? {}) },
    sostituzioni: {},
    datiCorporei: dati.datiCorporei,
  };
  await aggiorna({ profilo: p, programma: nuovoProgramma(dati.obiettivo, dati.mesi) }, ['profilo', 'programma']);
}

export async function aggiornaImpostazioni(mod: Partial<Impostazioni>): Promise<void> {
  const p = stato.value.profilo;
  if (!p) return;
  await aggiorna({ profilo: { ...p, impostazioni: { ...impostazioniDi(p), ...mod } } }, ['profilo']);
}

export async function aggiornaProfilo(mod: Partial<Pick<Profilo, 'nome' | 'esperienza' | 'kcalTarget'>>): Promise<void> {
  const p = stato.value.profilo;
  if (!p) return;
  await aggiorna({ profilo: { ...p, ...mod } }, ['profilo']);
}

export async function aggiornaDatiCorporei(d: DatiCorporei): Promise<void> {
  const p = stato.value.profilo;
  if (!p) return;
  await aggiorna({ profilo: { ...p, datiCorporei: d } }, ['profilo']);
}

/** Cambio di obiettivo: vale subito per le sedute non ancora iniziate, senza rifare il test (§12b). */
export async function cambiaObiettivo(obiettivo: Obiettivo): Promise<void> {
  const p = stato.value.profilo;
  const pr = stato.value.programma;
  if (!p) return;
  await aggiorna({ profilo: { ...p, obiettivo }, programma: pr ? { ...pr, obiettivo } : pr }, ['profilo', 'programma']);
}

/**
 * Nuovo programma: chiude quello in corso (le sedute fatte restano nello storico) e ne apre uno per la durata
 * scelta. Con `conTest` si parte dalle 3 sedute di test; senza, si usano i massimali del programma chiuso.
 */
export async function avviaNuovoProgramma(mesi: number, conTest: boolean): Promise<void> {
  const p = stato.value.profilo;
  const pr = stato.value.programma;
  if (!p) return;
  const passati = pr ? [...stato.value.programmiPassati, pr] : stato.value.programmiPassati;
  const nuovo = nuovoProgramma(p.obiettivo, mesi, conTest, conTest || !pr ? {} : pr.test);
  if (!conTest && pr) nuovo.carichiCorrenti = { ...pr.carichiCorrenti };
  await aggiorna({ profilo: { ...p, mesi }, programma: nuovo, programmiPassati: passati }, ['profilo', 'programma', 'programmiPassati']);
}

// ---------- Sedute ----------

export function sedutaPerId(id: string): Seduta | undefined {
  return stato.value.programma?.sedute.find((s) => s.id === id);
}

export const prossimaSeduta = computed<Seduta | undefined>(() => stato.value.programma?.sedute.find((s) => s.stato !== 'completata'));

/** La prossima seduta è sempre avviabile; in modalità prova lo è qualsiasi seduta non completata. */
export function avviabile(s: Seduta): boolean {
  if (prossimaSeduta.value?.id === s.id) return true;
  return impostazioni.value.modalita_prova && s.stato !== 'completata';
}

export function inAnteprima(s: Seduta): boolean {
  return s.stato === 'futura' && prossimaSeduta.value?.id !== s.id;
}

export function registroDi(id: string): RegistroSeduta | undefined {
  return stato.value.registro[id];
}

/** Contesto per le prescrizioni: test, carichi scelti, sostituzioni, obiettivo, arrotondamento. */
export function contesto(): Contesto {
  const pr = stato.value.programma;
  const p = stato.value.profilo;
  return {
    test: pr?.test ?? {},
    carichiCorrenti: pr?.carichiCorrenti ?? {},
    sostituzioni: p?.sostituzioni ?? {},
    obiettivo: pr?.obiettivo ?? p?.obiettivo ?? 'mantenimento',
    passo: impostazioniDi(p).arrotondamento,
  };
}

/** Modo della seduta: quello del registro se è iniziata, altrimenti quello di default. */
export function modoDi(s: Seduta): ModoSeduta {
  return stato.value.registro[s.id]?.modo ?? (impostazioni.value.phaDefault ? 'pha' : 'classica');
}

export function pianoDi(s: Seduta, modo: ModoSeduta = modoDi(s)): PianoSeduta {
  return pianoSeduta(s, contesto(), modo, impostazioni.value.T);
}

function registroNuovo(s: Seduta, modo: ModoSeduta): RegistroSeduta {
  const pr = stato.value.programma!;
  const piano = pianoDi(s, modo);
  const voci: Record<string, RegistroVoce> = {};
  for (const v of piano.voci) {
    const serie: SerieRegistrata[] = [];
    for (let n = 1; n <= v.p.serie; n++) serie.push({ n, kg_prev: v.p.kg ?? 0, kg_piano: v.p.kgPiano, rip_prev: v.p.rip, fatta: false });
    voci[v.voce.id] = { esercizio_id: v.p.esercizio_id, serie };
  }
  return { seduta_id: s.id, iniziata: new Date().toISOString(), modo, voci, snapshot: { test: pr.test, carichiCorrenti: pr.carichiCorrenti, note: pr.note } };
}

async function salvaSeduta(seduta: Seduta, mod: Partial<Programma> = {}, extra: Partial<Stato> = {}, chiavi: Chiave[] = []): Promise<void> {
  const pr = stato.value.programma;
  if (!pr) return;
  const sedute = pr.sedute.map((s) => (s.id === seduta.id ? seduta : s));
  await aggiorna({ programma: { ...pr, ...mod, sedute }, ...extra }, ['programma', ...chiavi]);
}

/** Avvia la seduta nel modo scelto (classica o PHA): crea il registro con i valori previsti. */
export async function iniziaSeduta(id: string, modo: ModoSeduta = 'classica'): Promise<void> {
  const s = sedutaPerId(id);
  if (!s || s.stato === 'completata') return;
  if (stato.value.registro[id]) {
    if (s.stato !== 'in_corso') await salvaSeduta({ ...s, stato: 'in_corso' });
    return;
  }
  const reg = registroNuovo(s, s.fase === 'test' ? 'classica' : modo);
  await salvaSeduta({ ...s, stato: 'in_corso', data: reg.iniziata }, {}, { registro: { ...stato.value.registro, [id]: reg } }, ['registro']);
}

/** Cambia classica ↔ PHA finché nessuna serie è stata fatta. */
export async function cambiaModo(id: string, modo: ModoSeduta): Promise<boolean> {
  const s = sedutaPerId(id);
  const reg = stato.value.registro[id];
  if (!s || !reg || reg.modo === modo) return false;
  if (Object.values(reg.voci).some((v) => v.serie.some((x) => x.fatta))) return false;
  await aggiorna({ registro: { ...stato.value.registro, [id]: { ...registroNuovo(s, modo), iniziata: reg.iniziata } } }, ['registro']);
  return true;
}

/**
 * Aggiorna una serie. Un kg diverso dal previsto diventa il carico scelto da lei (vale anche per le serie e le sedute
 * successive, seguendo gli aumenti del piano). Ripetizioni sotto il previsto → serie successiva a −5 %.
 * Fondamentale sollevato più pesante con tutte le ripetizioni → si ricalcola il massimale (soglia +2,5 %).
 */
export async function aggiornaSerie(sedutaId: string, voceId: string, n: number, mod: Partial<SerieRegistrata>): Promise<void> {
  const reg = stato.value.registro[sedutaId];
  const pr = stato.value.programma;
  const s = sedutaPerId(sedutaId);
  if (!reg || !pr || !s) return;
  const rv = reg.voci[voceId];
  if (!rv) return;
  const serie = rv.serie.map((x) => (x.n === n ? { ...x, ...mod } : { ...x }));
  const corrente = serie.find((x) => x.n === n)!;
  const prima = rv.serie.find((x) => x.n === n)!;
  let carichiCorrenti = pr.carichiCorrenti;
  let test = pr.test;
  let note = pr.note;
  const passo = impostazioni.value.arrotondamento;
  const def = ESERCIZI_PER_ID[rv.esercizio_id];
  if (mod.kg !== undefined && mod.kg !== prima.kg_prev && mod.kg > 0) {
    carichiCorrenti = { ...carichiCorrenti, [rv.esercizio_id]: { kg: mod.kg, rif: prima.kg_piano, aggiornato: new Date().toISOString(), origine: 'manuale', seduta_id: sedutaId } };
    for (const x of serie) if (x.n > n && !x.fatta) x.kg_prev = mod.kg;
    corrente.kg_prev = mod.kg;
  }
  const piano = pianoDi(s, reg.modo);
  const vp = piano.voci.find((v) => v.voce.id === voceId);
  if (mod.fatta && corrente.rip !== undefined && corrente.rip < corrente.rip_prev && !vp?.p.max) {
    const succ = serie.find((x) => x.n > n && !x.fatta);
    if (succ && succ.kg === undefined && succ.kg_prev > 0) succ.kg_prev = arrotonda(succ.kg_prev * 0.95, passo);
  }
  if (mod.fatta && def?.fondamentale && corrente.kg !== undefined && corrente.rip !== undefined && corrente.kg > (corrente.kg_piano ?? corrente.kg_prev) && corrente.rip >= corrente.rip_prev) {
    const t = test[rv.esercizio_id];
    const rir = corrente.sforzo === 'facile' ? 2 : corrente.sforzo === 'giusto' ? 1 : 0;
    const esito = valutaRicalcolo(t?.rm1, corrente.kg, corrente.rip, rir);
    if (esito.aggiorna && t && esito.stima) {
      test = { ...test, [rv.esercizio_id]: { ...t, rm1: esito.stima, rm1_test: t.rm1_test ?? t.rm1 } };
      const cc = { ...carichiCorrenti };
      delete cc[rv.esercizio_id];
      carichiCorrenti = cc;
      note = [...note, { data: new Date().toISOString(), testo: `${def.nome}: nuovo massimale ${esito.stima} kg (era ${t.rm1}).` }];
    }
  }
  const nuovoReg: RegistroSeduta = { ...reg, voci: { ...reg.voci, [voceId]: { ...rv, serie } } };
  const cambiato = carichiCorrenti !== pr.carichiCorrenti || test !== pr.test || note !== pr.note;
  await aggiorna({ registro: { ...stato.value.registro, [sedutaId]: nuovoReg }, programma: { ...pr, carichiCorrenti, test, note } }, cambiato ? ['registro', 'programma'] : ['registro']);
}

export async function aggiornaNota(sedutaId: string, voceId: string, nota: string): Promise<void> {
  const reg = stato.value.registro[sedutaId];
  if (!reg?.voci[voceId]) return;
  await aggiorna({ registro: { ...stato.value.registro, [sedutaId]: { ...reg, voci: { ...reg.voci, [voceId]: { ...reg.voci[voceId], nota } } } } }, ['registro']);
}

/** Completa la seduta: progressione doppia sulla parte alta e sui glutei "max". */
export async function completaSeduta(id: string): Promise<void> {
  const pr = stato.value.programma;
  const s = sedutaPerId(id);
  if (!pr || !s) return;
  const reg = stato.value.registro[id];
  let carichiCorrenti = pr.carichiCorrenti;
  if (reg && s.fase !== 'test') {
    const nuovi = progressioneDoppia(pianoDi(s, reg.modo), reg.voci, impostazioni.value.arrotondamento, id);
    if (Object.keys(nuovi).length) carichiCorrenti = { ...carichiCorrenti, ...nuovi };
  }
  const registro = reg ? { ...stato.value.registro, [id]: { ...reg, completata: new Date().toISOString() } } : stato.value.registro;
  await salvaSeduta({ ...s, stato: 'completata', data: s.data ?? new Date().toISOString() }, { carichiCorrenti }, { registro }, ['registro']);
}

export async function riapriSeduta(id: string): Promise<void> {
  const s = sedutaPerId(id);
  if (s) await salvaSeduta({ ...s, stato: 'in_corso' });
}

/** Annulla una seduta avviata o completata: registro cancellato, carichi e massimali come all'avvio. */
export async function annullaSeduta(id: string): Promise<void> {
  const pr = stato.value.programma;
  const s = sedutaPerId(id);
  if (!pr || !s) return;
  const reg = stato.value.registro[id];
  const registro = { ...stato.value.registro };
  delete registro[id];
  const snap = reg?.snapshot;
  await salvaSeduta({ ...s, stato: 'futura', data: undefined }, snap ? { test: snap.test, carichiCorrenti: snap.carichiCorrenti, note: snap.note } : {}, { registro }, ['registro']);
}

/** Azzera i dati di prova: le sedute di lavoro tornano da fare, i carichi tornano a quelli del test. I test restano. */
export async function azzeraDatiProva(): Promise<void> {
  const pr = stato.value.programma;
  if (!pr) return;
  const test: Record<string, RisultatoTest> = {};
  for (const [k, t] of Object.entries(pr.test)) {
    const { rm1_test, ...resto } = t;
    test[k] = { ...resto, rm1: rm1_test ?? t.rm1 };
  }
  const registro = { ...stato.value.registro };
  const sedute = pr.sedute.map((x) => {
    if (x.fase === 'test') return x;
    delete registro[x.id];
    return { ...x, stato: 'futura' as const, data: undefined };
  });
  await aggiorna({ programma: { ...pr, sedute, test, carichiCorrenti: {}, note: [] }, registro }, ['programma', 'registro']);
}

/** Sostituisce l'esercizio di una voce; `permanente` vale anche per le sedute future (sostituzione nel profilo). */
export async function sostituisciEsercizio(sedutaId: string, voceId: string, nuovoId: string, permanente: boolean): Promise<void> {
  const p = stato.value.profilo;
  const pr = stato.value.programma;
  const s = sedutaPerId(sedutaId);
  if (!p || !pr || !s) return;
  const voce = sessione(s.giorno).voci.find((v) => v.id === voceId);
  if (!voce) return;
  const base = voce.esercizio[s.faseRif];
  const reg = stato.value.registro[sedutaId];
  const vecchio = reg?.voci[voceId]?.esercizio_id ?? p.sostituzioni[base] ?? base;
  const sostituzioni = { ...p.sostituzioni };
  if (nuovoId === base) delete sostituzioni[base];
  else sostituzioni[base] = nuovoId;
  // Il nuovo esercizio senza test eredita il carico scelto per il vecchio (modificabile).
  const carichiCorrenti = { ...pr.carichiCorrenti };
  if (!pr.test[nuovoId] && !carichiCorrenti[nuovoId] && carichiCorrenti[vecchio]) carichiCorrenti[nuovoId] = { ...carichiCorrenti[vecchio], rif: undefined };
  const profiloNuovo = { ...p, sostituzioni };
  const registro = { ...stato.value.registro };
  if (reg?.voci[voceId] && s.fase !== 'test') {
    stato.value = { ...stato.value, profilo: profiloNuovo, programma: { ...pr, carichiCorrenti } };
    const vp = pianoDi(s, reg.modo).voci.find((v) => v.voce.id === voceId);
    const serie = reg.voci[voceId].serie.map((x) => (x.fatta ? x : { ...x, kg_prev: vp?.p.kg ?? 0, kg_piano: vp?.p.kgPiano, rip_prev: vp?.p.rip ?? x.rip_prev }));
    registro[sedutaId] = { ...reg, voci: { ...reg.voci, [voceId]: { ...reg.voci[voceId], esercizio_id: nuovoId, serie } } };
  }
  // Sostituzione solo per oggi: la si toglie dal profilo ma resta nel registro della seduta.
  const profiloFinale = permanente ? profiloNuovo : p;
  await aggiorna({ profilo: profiloFinale, programma: { ...pr, carichiCorrenti }, registro }, ['profilo', 'programma', 'registro']);
}

// ---------- Test ----------

/**
 * Salva un test: `stima` = ripetizioni e carico di una prova pesante (+ riserva) → massimale Brzycki;
 * `serie_unica` = carico a N RM → massimale con la tabella % ↔ ripetizioni.
 */
export async function salvaTest(esercizio_id: string, kg: number, rip: number, modo: 'stima' | 'serie_unica', rir = 0): Promise<void> {
  const pr = stato.value.programma;
  if (!pr) return;
  const passo = impostazioni.value.arrotondamento;
  const rm1 = modo === 'stima' ? stimaMassimale(rip, kg, passo, rir) : arrotonda(massimaleDaSerie(kg, rip), passo);
  const t: RisultatoTest = { esercizio_id, kg, rip, modo, rm1, rir: rir || undefined, data: new Date().toISOString() };
  const carichiCorrenti = { ...pr.carichiCorrenti };
  delete carichiCorrenti[esercizio_id];
  await aggiorna({ programma: { ...pr, test: { ...pr.test, [esercizio_id]: t }, carichiCorrenti } }, ['programma']);
}

export async function rimuoviTest(esercizio_id: string): Promise<void> {
  const pr = stato.value.programma;
  if (!pr) return;
  const test = { ...pr.test };
  delete test[esercizio_id];
  await aggiorna({ programma: { ...pr, test } }, ['programma']);
}

export async function ripristinaCaricoPiano(esercizio_id: string): Promise<void> {
  const pr = stato.value.programma;
  if (!pr) return;
  const carichiCorrenti: Record<string, CaricoCorrente> = { ...pr.carichiCorrenti };
  delete carichiCorrenti[esercizio_id];
  await aggiorna({ programma: { ...pr, carichiCorrenti } }, ['programma']);
}

/** Ultimo test dello stesso esercizio nei programmi passati (suggerimento per il ritest). */
export function testPrecedente(esercizio_id: string): RisultatoTest | undefined {
  const passati = stato.value.programmiPassati;
  for (let i = passati.length - 1; i >= 0; i--) {
    const t = passati[i].test[esercizio_id];
    if (t) return t;
  }
  return undefined;
}

/** Registro precedente dello stesso esercizio (la volta prima), per la scheda. */
export function registroPrecedente(sedutaId: string, esercizio_id: string): { seduta: Seduta; voce: RegistroVoce } | undefined {
  const pr = stato.value.programma;
  const s = sedutaPerId(sedutaId);
  if (!pr || !s) return undefined;
  const prima = pr.sedute.filter((x) => x.numero < s.numero && x.stato === 'completata' && x.fase !== 'test').sort((a, b) => b.numero - a.numero);
  for (const sd of prima) {
    const reg = stato.value.registro[sd.id];
    const v = reg && Object.values(reg.voci).find((x) => x.esercizio_id === esercizio_id && x.serie.some((y) => y.fatta));
    if (v) return { seduta: sd, voce: v };
  }
  return undefined;
}

// ---------- Check-in ----------

export async function aggiungiCheckin(c: Checkin): Promise<void> {
  const altri = stato.value.checkin.filter((x) => x.data !== c.data);
  await aggiorna({ checkin: [...altri, c].sort((a, b) => a.data.localeCompare(b.data)) }, ['checkin']);
}

export async function rimuoviCheckin(data: string): Promise<void> {
  await aggiorna({ checkin: stato.value.checkin.filter((x) => x.data !== data) }, ['checkin']);
}

export const giorniDallUltimaSeduta = computed<number | null>(() => {
  const pr = stato.value.programma;
  if (!pr) return null;
  const date = pr.sedute.filter((s) => s.stato === 'completata' && s.data).map((s) => new Date(s.data!).getTime());
  if (!date.length) return null;
  return Math.floor((Date.now() - Math.max(...date)) / 86_400_000);
});
