import { signal, computed } from '@preact/signals';

// Timer di recupero (SPEC §9.4): basato su timestamp, sopravvive al blocco schermo e al reload.
// A fine recupero: suono + vibrazione in-app e notifica (se permessa e la pagina è ancora viva).

interface StatoTimer {
  fine: number;
  durata: number;
  etichetta: string;
}

const CHIAVE = 'frappaula-timer';

function leggi(): StatoTimer | null {
  try {
    const v = localStorage.getItem(CHIAVE);
    return v ? (JSON.parse(v) as StatoTimer) : null;
  } catch {
    return null;
  }
}

export const timer = signal<StatoTimer | null>(leggi());
export const adesso = signal(Date.now());
export const rimanente = computed(() => (timer.value ? Math.max(0, Math.ceil((timer.value.fine - adesso.value) / 1000)) : 0));
export const attivo = computed(() => timer.value !== null && rimanente.value > 0);

let opzioni = { suoni: true, vibrazione: true, notifiche: false };
export function configuraTimer(o: Partial<typeof opzioni>) {
  opzioni = { ...opzioni, ...o };
}

let audio: AudioContext | null = null;
/** Va chiamato da un gesto dell'utente (iOS blocca l'audio altrimenti). */
export function sbloccaAudio(): void {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!audio) audio = new AC();
    if (audio.state === 'suspended') void audio.resume();
  } catch {
    /* nessun audio */
  }
}

function beep(): void {
  if (!opzioni.suoni || !audio) return;
  try {
    const t0 = audio.currentTime;
    for (let i = 0; i < 3; i++) {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t0 + i * 0.35);
      g.gain.exponentialRampToValueAtTime(0.4, t0 + i * 0.35 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.35 + 0.25);
      o.connect(g).connect(audio.destination);
      o.start(t0 + i * 0.35);
      o.stop(t0 + i * 0.35 + 0.3);
    }
  } catch {
    /* ignora */
  }
}

function vibra(): void {
  if (!opzioni.vibrazione) return;
  try {
    navigator.vibrate?.([300, 150, 300, 150, 500]);
  } catch {
    /* ignora */
  }
}

async function notifica(etichetta: string): Promise<void> {
  if (!opzioni.notifiche || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    const opts: NotificationOptions = { body: etichetta, tag: 'recupero', silent: false };
    if (reg) await reg.showNotification('Recupero finito', opts);
    else new Notification('Recupero finito', opts);
  } catch {
    /* ignora */
  }
}

export async function chiediPermessoNotifiche(): Promise<NotificationPermission | 'non_supportato'> {
  if (typeof Notification === 'undefined') return 'non_supportato';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

let scaduto = false;
let intervallo: number | undefined;

function controlla(): void {
  adesso.value = Date.now();
  const t = timer.value;
  if (!t) return;
  if (t.fine <= adesso.value && !scaduto) {
    scaduto = true;
    beep();
    vibra();
    void notifica(t.etichetta);
  }
}

function avviaControllo(): void {
  if (intervallo !== undefined) return;
  intervallo = window.setInterval(controlla, 250);
  document.addEventListener('visibilitychange', controlla);
}

export function avviaTimer(secondi: number, etichetta: string): void {
  sbloccaAudio();
  const t: StatoTimer = { fine: Date.now() + secondi * 1000, durata: secondi, etichetta };
  timer.value = t;
  scaduto = false;
  localStorage.setItem(CHIAVE, JSON.stringify(t));
  avviaControllo();
}

export function fermaTimer(): void {
  timer.value = null;
  scaduto = true;
  localStorage.removeItem(CHIAVE);
}

export function aggiungiSecondi(n: number): void {
  const t = timer.value;
  if (!t) return;
  const nuovo = { ...t, fine: Math.max(Date.now(), t.fine) + n * 1000, durata: t.durata + n };
  timer.value = nuovo;
  scaduto = false;
  localStorage.setItem(CHIAVE, JSON.stringify(nuovo));
}

export function formatoMMSS(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

// Se c'era un timer in corso al reload, riprende il controllo.
if (timer.value) {
  scaduto = timer.value.fine <= Date.now();
  avviaControllo();
}
