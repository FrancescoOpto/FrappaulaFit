import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import './ui/stile.css';
import { App } from './ui/App';
import { avvia } from './store/stato';
import { avviaSyncAutomatica } from './store/sync';

registerSW({ immediate: true });

void avvia().then(() => {
  avviaSyncAutomatica();
});

render(<App />, document.getElementById('app')!);
