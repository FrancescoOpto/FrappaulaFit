import { render } from 'preact';
import './ui/stile.css';
import { App } from './ui/App';
import { avvia } from './store/stato';
import { avviaSyncAutomatica } from './store/sync';
import { avviaAggiornamenti } from './ui/aggiornamento';

avviaAggiornamenti();

void avvia().then(() => {
  avviaSyncAutomatica();
});

render(<App />, document.getElementById('app')!);
