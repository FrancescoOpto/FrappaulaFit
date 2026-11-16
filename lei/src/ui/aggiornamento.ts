import { registerSW } from 'virtual:pwa-register';

// Aggiornamento dell'app installata (PWA). Con "autoUpdate" il service worker nuovo si attiva da solo e la pagina
// si ricarica; il controllo però parte solo al caricamento della pagina. Sul telefono l'app viene spesso ripresa
// dalle app recenti senza ricaricarsi: per questo si ricontrolla quando torna in primo piano e ogni 30 minuti.

let registrazione: ServiceWorkerRegistration | undefined;

function controlla(): void {
  if (registrazione && navigator.onLine) void registrazione.update().catch(() => undefined);
}

export function avviaAggiornamenti(): void {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, reg) {
      registrazione = reg;
      if (!reg) return;
      setInterval(controlla, 30 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') controlla();
      });
    },
  });
}

/** Controllo a mano (Impostazioni): se c'è una versione nuova l'app si ricarica da sola appena è pronta. */
export async function cercaAggiornamento(): Promise<string> {
  if (!('serviceWorker' in navigator)) return 'Questo browser non gestisce gli aggiornamenti offline: ricarica la pagina.';
  if (!navigator.onLine) return 'Sei offline: riprova con la connessione.';
  const reg = registrazione ?? (await navigator.serviceWorker.getRegistration());
  if (!reg) return 'Nessuna versione installata da aggiornare: ricarica la pagina.';
  try {
    await reg.update();
  } catch {
    return 'Controllo non riuscito: riprova tra poco.';
  }
  if (reg.installing || reg.waiting) return 'Versione nuova trovata: l’app si ricarica da sola tra qualche secondo.';
  return 'Hai già l’ultima versione pubblicata.';
}
