import type { ComponentChildren } from 'preact';
import { indietro } from '../router';
import { Icona } from './IconaEsercizio';

export function Testata({ sopratitolo, destra, senzaIndietro, accento }: { sopratitolo?: string; destra?: ComponentChildren; senzaIndietro?: boolean; accento?: boolean }) {
  return (
    <div class="testata">
      {senzaIndietro ? <span /> : (
        <button class="indietro" onClick={indietro} aria-label="Indietro">
          <Icona nome="indietro" dimensione={20} />
          Indietro
        </button>
      )}
      {sopratitolo ? <div class={`eyebrow ${accento ? 'accento' : ''}`}>{sopratitolo}</div> : null}
      {destra ?? <span />}
    </div>
  );
}

/** Etichetta in maiuscoletto: in rosa per i fondamentali, grigia per gli altri. */
export function Badge({ testo, accento }: { testo: string; accento?: boolean }) {
  return <span class={`badge ${accento ? 'R1' : ''}`}>{testo}</span>;
}

export function Avviso({ tipo, children }: { tipo?: 'info' | 'errore'; children: ComponentChildren }) {
  return <div class={`avviso ${tipo ?? ''}`}>{children}</div>;
}

export function Modale({ titolo, onChiudi, children }: { titolo: string; onChiudi: () => void; children: ComponentChildren }) {
  return (
    <div class="modale-sfondo" onClick={(e) => { if (e.target === e.currentTarget) onChiudi(); }}>
      <div class="modale" role="dialog" aria-label={titolo}>
        <div class="riga spazio">
          <h2>{titolo}</h2>
          <button class="icona-bottone" onClick={onChiudi} aria-label="Chiudi">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function formatoKg(kg: number | undefined): string {
  if (kg === undefined || Number.isNaN(kg)) return '—';
  return kg.toLocaleString('it-IT', { maximumFractionDigits: 2 }) + ' kg';
}

export function formatoData(iso: string | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function recuperoTesto(sec: number): string {
  if (sec % 60 === 0) return `${sec / 60}′`;
  return sec >= 60 ? `${Math.floor(sec / 60)}′${String(sec % 60).padStart(2, '0')}″` : `${sec}″`;
}

export function Scelte<T extends string | number>({ valori, valore, onCambia, etichette }: { valori: T[]; valore: T; onCambia: (v: T) => void; etichette?: Record<string, string> }) {
  return (
    <div class="scelte">
      {valori.map((v) => (
        <button type="button" class={`scelta ${v === valore ? 'attiva' : ''}`} onClick={() => onCambia(v)}>
          {etichette?.[String(v)] ?? String(v)}
        </button>
      ))}
    </div>
  );
}

/** Stepper − / + con area toccabile ≥ 44 px. */
export function Stepper({ valore, min, max, passo, onCambia, formato, etichettaAria }: { valore: number; min: number; max: number; passo: number; onCambia: (v: number) => void; formato?: (v: number) => string; etichettaAria?: string }) {
  const f = formato ?? ((v: number) => String(v));
  const cambia = (delta: number) => {
    const nuovo = Math.min(max, Math.max(min, Math.round((valore + delta) / passo) * passo));
    if (nuovo !== valore) onCambia(nuovo);
  };
  return (
    <div class="stepper" role="group" aria-label={etichettaAria}>
      <button type="button" class="stepper-bottone" aria-label="Meno" disabled={valore <= min} onClick={() => cambia(-passo)}>−</button>
      <span class="stepper-valore">{f(valore)}</span>
      <button type="button" class="stepper-bottone" aria-label="Più" disabled={valore >= max} onClick={() => cambia(passo)}>+</button>
    </div>
  );
}

/** Controllo compatto − / valore / + per peso e ripetizioni in seduta: il valore si può anche scrivere. */
export function Controllo({ valore, passo, min = 0, onCambia, unita, etichettaAria, disabilitato }: { valore: string; passo: number; min?: number; onCambia: (v: string) => void; unita?: string; etichettaAria: string; disabilitato?: boolean }) {
  const n = parseFloat(valore.replace(',', '.'));
  const base = Number.isFinite(n) ? n : 0;
  const arr = (v: number) => String(Math.round(Math.max(min, v) / passo) * passo).replace(/\.?0+$/, (m) => (m.includes('.') ? '' : m));
  return (
    <div class="controllo" role="group" aria-label={etichettaAria}>
      <button type="button" aria-label={`${etichettaAria}: meno`} disabled={disabilitato} onClick={() => onCambia(arr(base - passo))}>−</button>
      <input type="number" inputMode="decimal" step={passo} min={min} value={valore} disabled={disabilitato} aria-label={etichettaAria} onInput={(e) => onCambia((e.target as HTMLInputElement).value)} />
      {unita ? <span class="unita">{unita}</span> : null}
      <button type="button" aria-label={`${etichettaAria}: più`} disabled={disabilitato} onClick={() => onCambia(arr(base + passo))}>+</button>
    </div>
  );
}
