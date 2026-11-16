import { get, set, del, createStore } from 'idb-keyval';
import type { Stato } from '../tipi';

// Archivio locale dell'app di lei: database IndexedDB proprio ("frappaula-lei"), separato da quello dell'app di
// Francesco anche se le due app stanno sullo stesso sito. Una chiave di primo livello dello stato = una riga.

const store = createStore('frappaula-lei', 'kv');

export const CHIAVI = ['profilo', 'programma', 'programmiPassati', 'registro', 'checkin'] as const;
export type Chiave = (typeof CHIAVI)[number];

export interface Meta {
  modificato: Partial<Record<Chiave, string>>;
  daInviare: Chiave[];
}

export const STATO_VUOTO: Stato = {
  versione: 1,
  profilo: null,
  programma: null,
  programmiPassati: [],
  registro: {},
  checkin: [],
};

export async function caricaStato(): Promise<Stato> {
  const s: Stato = { ...STATO_VUOTO };
  for (const k of CHIAVI) {
    const v = await get(k, store);
    if (v !== undefined) (s as unknown as Record<string, unknown>)[k] = v;
  }
  return s;
}

export async function salvaChiave(k: Chiave, valore: unknown): Promise<void> {
  await set(k, valore, store);
}

export async function caricaMeta(): Promise<Meta> {
  return (await get('meta', store)) ?? { modificato: {}, daInviare: [] };
}

export async function salvaMeta(m: Meta): Promise<void> {
  await set('meta', m, store);
}

export async function cancellaTutto(): Promise<void> {
  for (const k of CHIAVI) await del(k, store);
  await del('meta', store);
}

export function esportaJSON(stato: Stato): string {
  return JSON.stringify({ app: 'frappaula-lei', esportato: new Date().toISOString(), ...stato }, null, 2);
}

export function importaJSON(testo: string): Stato {
  const o = JSON.parse(testo);
  if (!o || typeof o !== 'object' || o.app !== 'frappaula-lei') throw new Error('Il file non è un backup di Frappaula Fit · Lei.');
  return {
    versione: o.versione ?? 1,
    profilo: o.profilo ?? null,
    programma: o.programma ?? null,
    programmiPassati: o.programmiPassati ?? [],
    registro: o.registro ?? {},
    checkin: o.checkin ?? [],
  };
}
