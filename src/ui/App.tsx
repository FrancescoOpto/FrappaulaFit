import { useEffect } from 'preact/hooks';
import { pronto, profilo, impostazioni } from '../store/stato';
import { rotta, parti, vai } from './router';
import { attivo, rimanente, timer, fermaTimer, aggiungiSecondi, formatoMMSS, configuraTimer } from './timer';
import { Setup } from './schermate/Setup';
import { Home } from './schermate/Home';
import { Seduta } from './schermate/Seduta';
import { Esercizio } from './schermate/Esercizio';
import { Progressi } from './schermate/Progressi';
import { Checkin } from './schermate/Checkin';
import { Impostazioni } from './schermate/Impostazioni';

function Nav() {
  const r = rotta.value;
  const voce = (href: string, testo: string, icona: preact.JSX.Element, attiva: boolean) => (
    <a href={'#' + href} class={attiva ? 'attiva' : ''}>
      {icona}
      {testo}
    </a>
  );
  return (
    <nav class="nav">
      {voce('/', 'Percorso', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>, r === '/' || r.startsWith('/seduta'))}
      {voce('/progressi', 'Progressi', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18M6 16l4-5 4 3 5-7" /></svg>, r.startsWith('/progressi'))}
      {voce('/checkin', 'Check-in', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>, r.startsWith('/checkin'))}
      {voce('/impostazioni', 'Impostazioni', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>, r.startsWith('/impostazioni'))}
    </nav>
  );
}

function TimerBarra() {
  if (!attivo.value || rotta.value.includes('/es/')) return null;
  return (
    <div class="timer-barra">
      <div>
        <span class="piccolo" style="color:#fff;opacity:.85">{timer.value?.etichetta}</span>
        <span class="tempo">{formatoMMSS(rimanente.value)}</span>
        <button onClick={() => aggiungiSecondi(30)}>+30</button>
        <button onClick={fermaTimer} aria-label="Ferma">✕</button>
      </div>
    </div>
  );
}

export function App() {
  const imp = impostazioni.value;
  useEffect(() => {
    configuraTimer({ suoni: imp.suoni, vibrazione: imp.vibrazione, notifiche: imp.notifiche });
  }, [imp.suoni, imp.vibrazione, imp.notifiche]);

  if (!pronto.value) {
    return (
      <div class="pagina centrato" style="justify-content:center">
        <p class="muto">Caricamento…</p>
      </div>
    );
  }
  if (!profilo.value) return <Setup />;

  const p = parti(rotta.value);
  let schermata: preact.JSX.Element;
  if (p[0] === 'seduta' && p[1] && p[2] === 'es' && p[3] !== undefined) schermata = <Esercizio sedutaId={p[1]} slot={Number(p[3])} />;
  else if (p[0] === 'seduta' && p[1]) schermata = <Seduta id={p[1]} />;
  else if (p[0] === 'progressi') schermata = <Progressi esercizioId={p[1]} />;
  else if (p[0] === 'checkin') schermata = <Checkin />;
  else if (p[0] === 'impostazioni') schermata = <Impostazioni sezione={p[1]} />;
  else if (p[0] === 'nuovo-profilo') schermata = <Setup />;
  else {
    if (p.length) vai('/');
    schermata = <Home />;
  }
  return (
    <>
      {schermata}
      <TimerBarra />
      <Nav />
    </>
  );
}
