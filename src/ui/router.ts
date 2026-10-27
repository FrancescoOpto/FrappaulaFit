import { signal } from '@preact/signals';

// Router a hash: su GitHub Pages evita i 404 delle rotte e funziona offline.

export const rotta = signal<string>(leggi());

function leggi(): string {
  const h = location.hash.replace(/^#/, '');
  return h.startsWith('/') ? h : '/';
}

window.addEventListener('hashchange', () => {
  rotta.value = leggi();
  window.scrollTo(0, 0);
});

export function vai(percorso: string): void {
  if (location.hash === '#' + percorso) return;
  location.hash = percorso;
}

export function indietro(): void {
  if (history.length > 1) history.back();
  else vai('/');
}

/** Scompone la rotta: "/seduta/abc" → ['seduta', 'abc']. */
export function parti(r: string): string[] {
  return r.split('/').filter(Boolean);
}
