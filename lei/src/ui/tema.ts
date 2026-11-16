import type { Tema } from '../tipi';

// Tema dell'app di lei: scuro o chiaro, sempre con l'accento rosa (data-profilo="F" fisso su <html>).
// Una copia va in localStorage perché index.html la applichi prima del primo disegno.

const SFONDO: Record<Tema, string> = { scuro: '#0e0f11', chiaro: '#f4f4f2' };

export function applicaTema(tema: Tema = 'scuro'): void {
  const html = document.documentElement;
  html.setAttribute('data-profilo', 'F');
  if (tema === 'chiaro') html.setAttribute('data-tema', 'chiaro');
  else html.removeAttribute('data-tema');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', SFONDO[tema]);
  // iPhone: testo della barra di stato scuro sul tema chiaro (vale dalla prossima apertura dell'app).
  document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', tema === 'chiaro' ? 'default' : 'black-translucent');
  try {
    localStorage.setItem('frappaula-lei-tema', tema);
  } catch {
    /* archivio non disponibile */
  }
}
