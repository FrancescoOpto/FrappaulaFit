import type { Tema } from '../tipi';

// Tema e accento per profilo (SPEC_PIANIFICATORE §12c): attributi su <html> letti dal foglio di stile.
// Una copia va in localStorage perché index.html la applichi prima del primo disegno (niente lampo scuro).

const SFONDO: Record<Tema, string> = { scuro: '#0e0f11', chiaro: '#f4f4f2' };

export function applicaTema(tema: Tema = 'scuro', sesso: 'M' | 'F' = 'M'): void {
  const html = document.documentElement;
  if (tema === 'chiaro') html.setAttribute('data-tema', 'chiaro');
  else html.removeAttribute('data-tema');
  if (sesso === 'F') html.setAttribute('data-profilo', 'F');
  else html.removeAttribute('data-profilo');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', SFONDO[tema]);
  // iPhone: testo della barra di stato scuro sul tema chiaro (vale dalla prossima apertura dell'app).
  document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', tema === 'chiaro' ? 'default' : 'black-translucent');
  try {
    localStorage.setItem('frappaula-tema', tema);
    localStorage.setItem('frappaula-profilo', sesso);
  } catch {
    /* archivio non disponibile: il tema vale comunque per questa sessione */
  }
}
