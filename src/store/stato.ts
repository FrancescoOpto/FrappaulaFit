import { signal, computed, batch } from '@preact/signals';
import type {
  Blocco,
  Checkin,
  Esercizio,
  Impostazioni,
  ParametriGeneratore,
  Profilo,
  RegistroEsercizio,
  RegistroSeduta,
  RisultatoTest,
  Seduta,
  SerieRegistrata,
  Stato,
} from '../tipi';
import { CHIAVI, type Chiave, caricaMeta, caricaStato, salvaChiave, salvaMeta, cancellaTutto, STATO_VUOTO } from './db';
import { AUTOCORREZIONE_CICLO, AUTOCORREZIONE_SERIE, RECUPERI_DEFAULT, STRIPPING } from '../data/tabelle';
import { nuovoBlocco, rigeneraSeduteFuture } from '../motore/generatore';
import { prescrizione } from '../motore/prescrizione';
import { arrotonda, rm1DaTest } from '../motore/carichi';
import { ESERCIZI_PER_ID } from '../data/esercizi';

// Stato globale con signals. Ogni mutazione passa da `aggiorna`, che salva la chiave toccata.

export const stato = signal<Stato>({ ...STATO_VUOTO });
export const pronto = signal(false);
export const ultimoSalvataggio = signal<string | null>(null);

export const profilo = computed(() => stato.value.profilo);
export const blocco = computed(() => stato.value.blocco);
export const impostazioni = computed<Impostazioni>(() => stato.value.profilo?.impostazioni ?? IMPOSTAZIONI_DEFAULT);

export const IMPOSTAZIONI_DEFAULT: Impostazioni = {
  arrotondamento: 0.5,
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

export async function creaProfilo(nome: string, sesso: 'M' | 'F', parametri: ParametriGeneratore): Promise<void> {
  const p: Profilo = {
    id: 'p-' + Date.now().toString(36),
    nome,
    sesso,
    parametri,
    impostazioni: { ...IMPOSTAZIONI_DEFAULT, recuperi: { ...RECUPERI_DEFAULT } },
    creato: new Date().toISOString(),
    sostituzioni: {},
    esercizi_personalizzati: [],
  };
  const b = nuovoBlocco(parametri, p, 1);
  await aggiorna({ profilo: p, blocco: b }, ['profilo', 'blocco']);
}

export async function aggiornaImpostazioni(mod: Partial<Impostazioni>): Promise<void> {
  const p = stato.value.profilo;
  if (!p) return;
  await aggiorna({ profilo: { ...p, impostazioni: { ...p.impostazioni, ...mod } } }, ['profilo']);
}

export async function aggiornaProfilo(mod: Partial<Pick<Profilo, 'nome' | 'sesso'>>): Promise<void> {
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

export async function salvaTest(esercizio_id: string, kg: number, rip: number, fondamentale: boolean): Promise<void> {
  const b = stato.value.blocco;
  if (!b) return;
  const r: RisultatoTest = { esercizio_id, kg, rip };
  if (fondamentale && kg > 0 && rip > 0) r.rm1 = Math.round(rm1DaTest(kg, rip) * 100) / 100;
  await aggiorna({ blocco: { ...b, test: { ...b.test, [esercizio_id]: r } } }, ['blocco']);
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
    const pr = prescrizione(e, s, b.test, p.impostazioni, b.correzioni[e.esercizio_id] ?? 0);
    const serie: SerieRegistrata[] = [];
    for (let n = 1; n <= pr.serie; n++) serie.push({ n, kg_prev: pr.kg ?? 0, rip_prev: pr.rip, fatta: false });
    reg.esercizi[e.slot] = { esercizio_id: e.esercizio_id, serie };
  }
  batch(() => {});
  await aggiorna({ registro: { ...stato.value.registro, [id]: reg } }, ['registro']);
  await salvaSeduta({ ...s, stato: 'in_corso', data: reg.iniziata });
}

export function registroDi(id: string): RegistroSeduta | undefined {
  return stato.value.registro[id];
}

/** Aggiorna una serie (kg/rip/fatta). Autocorrezione in seduta: rip < previste → serie successiva a −5% (SPEC §7). */
export async function aggiornaSerie(sedutaId: string, slot: number, n: number, mod: Partial<SerieRegistrata>): Promise<void> {
  const reg = stato.value.registro[sedutaId];
  const p = stato.value.profilo;
  if (!reg || !p) return;
  const es = reg.esercizi[slot];
  if (!es) return;
  const serie = es.serie.map((x) => (x.n === n ? { ...x, ...mod } : { ...x }));
  const corrente = serie.find((x) => x.n === n)!;
  if (mod.fatta && corrente.rip !== undefined && corrente.rip < corrente.rip_prev) {
    const succ = serie.find((x) => x.n > n && !x.fatta && !x.stripping);
    if (succ && succ.kg === undefined && succ.kg_prev > 0) succ.kg_prev = arrotonda(succ.kg_prev * (1 + AUTOCORREZIONE_SERIE), p.impostazioni.arrotondamento);
  }
  const nuovoReg: RegistroSeduta = { ...reg, esercizi: { ...reg.esercizi, [slot]: { ...es, serie } } };
  await aggiorna({ registro: { ...stato.value.registro, [sedutaId]: nuovoReg } }, ['registro']);
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
  if (!test[nuovoId] && test[vecchioId]) test[nuovoId] = { ...test[vecchioId], esercizio_id: nuovoId };

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
    const pr = prescrizione(eNuovo, sd, test, p.impostazioni, b.correzioni[nuovoId] ?? 0);
    const serie = reg.esercizi[slot].serie.map((x) => (x.fatta ? x : { ...x, kg_prev: pr.kg ?? 0, rip_prev: pr.rip }));
    registro[sedutaId] = { ...reg, esercizi: { ...reg.esercizi, [slot]: { esercizio_id: nuovoId, serie } } };
  }
  await aggiorna({ profilo: profiloNuovo, blocco: { ...b, sedute, test }, registro }, ['profilo', 'blocco', 'registro']);
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
      if (!def?.fondamentale) continue;
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
