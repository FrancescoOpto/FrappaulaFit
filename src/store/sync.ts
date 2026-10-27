import { signal } from '@preact/signals';
import type { Stato } from '../tipi';
import { CHIAVI, type Chiave } from './db';
import { metaSync, segnaInviate, sostituisciStato, stato, suModifica } from './stato';

// Sincronizzazione su Supabase (SPEC §10): tabella kv(user_id, chiave, valore, aggiornato),
// RLS user_id = auth.uid(), last-write-wins per chiave. Client REST minimale (nessuna dipendenza).
// Schema SQL in supabase/schema.sql. [Non verificato su un progetto reale: da provare dopo la creazione.]

export interface ConfigSync {
  url: string;
  anonKey: string;
}

interface Sessione {
  access_token: string;
  refresh_token: string;
  user_id: string;
  email: string;
  scade: number;
}

const K_CONFIG = 'frappaula-sync-config';
const K_SESSIONE = 'frappaula-sync-sessione';

function leggi<T>(k: string): T | null {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

export const configSync = signal<ConfigSync | null>(leggi<ConfigSync>(K_CONFIG));
export const sessioneSync = signal<Sessione | null>(leggi<Sessione>(K_SESSIONE));
export const statoSync = signal<'spento' | 'ok' | 'in_corso' | 'errore' | 'offline'>('spento');
export const erroreSync = signal<string | null>(null);
export const ultimaSync = signal<string | null>(localStorage.getItem('frappaula-sync-ultima'));

export function salvaConfigSync(c: ConfigSync | null): void {
  configSync.value = c;
  if (c) localStorage.setItem(K_CONFIG, JSON.stringify(c));
  else localStorage.removeItem(K_CONFIG);
}

function salvaSessione(s: Sessione | null): void {
  sessioneSync.value = s;
  if (s) localStorage.setItem(K_SESSIONE, JSON.stringify(s));
  else localStorage.removeItem(K_SESSIONE);
}

async function chiamaAuth(path: string, body: unknown): Promise<Sessione> {
  const c = configSync.value;
  if (!c) throw new Error('Sincronizzazione non configurata.');
  const r = await fetch(`${c.url.replace(/\/$/, '')}/auth/v1/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: c.anonKey },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error_description || j.msg || j.error || 'Accesso rifiutato');
  return { access_token: j.access_token, refresh_token: j.refresh_token, user_id: j.user.id, email: j.user.email, scade: Date.now() + (j.expires_in ?? 3600) * 1000 };
}

export async function accedi(email: string, password: string): Promise<void> {
  const s = await chiamaAuth('token?grant_type=password', { email, password });
  salvaSessione(s);
  statoSync.value = 'ok';
}

export async function registrati(email: string, password: string): Promise<string> {
  const c = configSync.value;
  if (!c) throw new Error('Sincronizzazione non configurata.');
  const r = await fetch(`${c.url.replace(/\/$/, '')}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: c.anonKey },
    body: JSON.stringify({ email, password }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error_description || j.msg || 'Registrazione rifiutata');
  if (j.access_token) {
    salvaSessione({ access_token: j.access_token, refresh_token: j.refresh_token, user_id: j.user.id, email: j.user.email, scade: Date.now() + (j.expires_in ?? 3600) * 1000 });
    return 'Account creato e connesso.';
  }
  return 'Account creato: conferma l’email e poi accedi.';
}

export function esci(): void {
  salvaSessione(null);
  statoSync.value = 'spento';
}

async function tokenValido(): Promise<string> {
  const s = sessioneSync.value;
  if (!s) throw new Error('Non connesso.');
  if (s.scade - Date.now() > 60_000) return s.access_token;
  const nuovo = await chiamaAuth('token?grant_type=refresh_token', { refresh_token: s.refresh_token });
  salvaSessione(nuovo);
  return nuovo.access_token;
}

interface Riga {
  user_id: string;
  chiave: string;
  valore: unknown;
  aggiornato: string;
}

async function rest(path: string, init: RequestInit): Promise<Response> {
  const c = configSync.value!;
  const token = await tokenValido();
  return fetch(`${c.url.replace(/\/$/, '')}/rest/v1/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', apikey: c.anonKey, Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
}

let inCorso = false;

/** Sincronizza: scarica le righe del server, applica last-write-wins per chiave, invia le chiavi locali più nuove. */
export async function sincronizza(): Promise<void> {
  if (inCorso) return;
  if (!configSync.value || !sessioneSync.value) {
    statoSync.value = 'spento';
    return;
  }
  if (!navigator.onLine) {
    statoSync.value = 'offline';
    return;
  }
  inCorso = true;
  statoSync.value = 'in_corso';
  erroreSync.value = null;
  try {
    const uid = sessioneSync.value.user_id;
    const r = await rest(`kv?user_id=eq.${uid}&select=chiave,valore,aggiornato`, { method: 'GET' });
    if (!r.ok) throw new Error(`Lettura fallita (${r.status})`);
    const remote = (await r.json()) as Riga[];
    const meta = metaSync();
    const daApplicare: Partial<Stato> = {};
    const chiaviApplicate: Chiave[] = [];
    const daInviare: Riga[] = [];
    for (const k of CHIAVI) {
      const rem = remote.find((x) => x.chiave === k);
      const loc = meta.modificato[k];
      const locale = (stato.value as unknown as Record<string, unknown>)[k];
      if (rem && (!loc || rem.aggiornato > loc)) {
        (daApplicare as Record<string, unknown>)[k] = rem.valore;
        chiaviApplicate.push(k);
      } else if (loc && (!rem || loc > rem.aggiornato) && (meta.daInviare.includes(k) || !rem)) {
        daInviare.push({ user_id: uid, chiave: k, valore: locale, aggiornato: loc });
      }
    }
    if (chiaviApplicate.length) {
      await sostituisciStato({ ...stato.value, ...daApplicare }, []);
      for (const k of chiaviApplicate) meta.modificato[k] = remote.find((x) => x.chiave === k)!.aggiornato;
    }
    if (daInviare.length) {
      const u = await rest('kv?on_conflict=user_id,chiave', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(daInviare),
      });
      if (!u.ok) throw new Error(`Invio fallito (${u.status})`);
      await segnaInviate(daInviare.map((x) => x.chiave as Chiave));
    }
    statoSync.value = 'ok';
    ultimaSync.value = new Date().toISOString();
    localStorage.setItem('frappaula-sync-ultima', ultimaSync.value);
  } catch (e) {
    statoSync.value = 'errore';
    erroreSync.value = e instanceof Error ? e.message : String(e);
  } finally {
    inCorso = false;
  }
}

let programmato: number | undefined;
export function avviaSyncAutomatica(): void {
  suModifica(() => {
    if (!sessioneSync.value) return;
    clearTimeout(programmato);
    programmato = window.setTimeout(() => void sincronizza(), 3000);
  });
  window.addEventListener('online', () => void sincronizza());
  if (sessioneSync.value) void sincronizza();
}
