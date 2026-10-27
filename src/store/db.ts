import { get, set, del, createStore } from 'idb-keyval';
import type { Stato } from '../tipi';

// Persistenza locale (IndexedDB). Ogni chiave di primo livello dello stato è una riga:
// stesso modello della tabella kv della sincronizzazione (SPEC §10).

const store = createStore('frappaula-fit', 'kv');

export const CHIAVI = ['profilo', 'blocco', 'blocchiPassati', 'registro', 'checkin'] as const;
export type Chiave = (typeof CHIAVI)[number];

export interface Meta {
  /** Ultima modifica locale per chiave (ISO). Serve alla sincronizzazione last-write-wins. */
  modificato: Partial<Record<Chiave, string>>;
  /** Chiavi modificate e non ancora inviate al server. */
  daInviare: Chiave[];
}

export const STATO_VUOTO: Stato = {
  versione: 1,
  profilo: null,
  blocco: null,
  blocchiPassati: [],
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
  return JSON.stringify({ app: 'frappaula-fit', esportato: new Date().toISOString(), ...stato }, null, 2);
}

export function importaJSON(testo: string): Stato {
  const o = JSON.parse(testo);
  if (!o || typeof o !== 'object' || o.app !== 'frappaula-fit') throw new Error('Il file non è un backup di Frappaula Fit.');
  return {
    versione: o.versione ?? 1,
    profilo: o.profilo ?? null,
    blocco: o.blocco ?? null,
    blocchiPassati: o.blocchiPassati ?? [],
    registro: o.registro ?? {},
    checkin: o.checkin ?? [],
  };
}
