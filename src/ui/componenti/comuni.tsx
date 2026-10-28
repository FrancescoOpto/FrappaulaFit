import type { ComponentChildren } from 'preact';
import { indietro } from '../router';
import type { Ruolo } from '../../tipi';
import { NOMI_RUOLI } from '../../data/esercizi';

export function Testata({ sopratitolo, destra, senzaIndietro }: { sopratitolo?: string; destra?: ComponentChildren; senzaIndietro?: boolean }) {
  return (
    <div class="testata">
      {senzaIndietro ? <span /> : (
        <button class="indietro" onClick={indietro} aria-label="Indietro">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          Indietro
        </button>
      )}
      {sopratitolo ? <div class="sopratitolo">{sopratitolo}</div> : null}
      {destra ?? <span />}
    </div>
  );
}

export function Badge({ ruolo }: { ruolo: Ruolo }) {
  return <span class={`badge ${ruolo}`}>{NOMI_RUOLI[ruolo]}</span>;
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
          <button class="icona-bottone" onClick={onChiudi} aria-label="Chiudi">✕</button>
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
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
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

/** Stepper − / + con area toccabile ≥ 44 px (passi, allenamenti, kg). */
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
