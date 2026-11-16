import type { Fase, FaseLavoro, Giorno, Segmento, Seduta } from '../tipi';
import { SEDUTE } from '../data/programma';

// Calendario del programma (docs/PROPOSTA_PROGRAMMA_DONNA.md §5). Un giro completo del libro dura 20 settimane:
// Fase 1 × 6, scarico, Fase 2 × 6, scarico, Fase 3 × 6. Ogni giro parte con una settimana di test (3 sedute).
// Dopo un giro completo: scarico di chiusura, nuovo test e si riparte. Durate più corte accorciano le fasi
// tenendo i "gradini" delle tabelle. Funzioni pure.

export const MESI_DURATA = [3, 6, 9, 12] as const;
export const SETTIMANE_FASE = 6;
export const GIRO_COMPLETO = SETTIMANE_FASE * 3 + 2; // 20

/** Settimane in `mesi`: 3 mesi ≈ 13 settimane (un ciclo = le 3 sedute A, B, C). */
export function settimaneDaMesi(mesi: number): number {
  return Math.max(1, Math.round((mesi * 52) / 12));
}

/**
 * Righe di tabella (1–6) per una fase accorciata a n settimane: prima e ultima sempre, le altre equidistanti.
 * n=6 → 1…6; n=5 → 1,2,4,5,6; n=4 → 1,3,4,6; n=3 → 1,4,6; n=2 → 1,6; n=1 → 1.
 */
export function righe(n: number, lunghezza = SETTIMANE_FASE): number[] {
  if (n <= 1) return [1];
  if (n >= lunghezza) return Array.from({ length: lunghezza }, (_, i) => i + 1);
  return Array.from({ length: n }, (_, i) => Math.round(1 + (i * (lunghezza - 1)) / (n - 1)));
}

/** Fasi di lavoro per w settimane (senza il test): una, due o tre fasi con gli scarichi in mezzo. */
export function fasiPer(w: number): { fase: FaseLavoro | 'scarico'; settimane: number; dopo?: FaseLavoro }[] {
  if (w <= 0) return [];
  if (w <= SETTIMANE_FASE) return [{ fase: 'fase1', settimane: w }];
  if (w < 12) {
    // Fase 1 + scarico + Fase 2.
    const f1 = Math.min(SETTIMANE_FASE, Math.ceil((w - 1) / 2));
    return [{ fase: 'fase1', settimane: f1 }, { fase: 'scarico', settimane: 1, dopo: 'fase1' }, { fase: 'fase2', settimane: w - 1 - f1 }];
  }
  // Tre fasi con due scarichi: si arriva sempre all'intensificazione.
  const r = Math.min(w, GIRO_COMPLETO) - 2;
  const f3 = Math.min(SETTIMANE_FASE, Math.max(3, Math.floor(r / 3)));
  const f1 = Math.min(SETTIMANE_FASE, Math.ceil((r - f3) / 2));
  const f2 = r - f3 - f1;
  return [
    { fase: 'fase1', settimane: f1 },
    { fase: 'scarico', settimane: 1, dopo: 'fase1' },
    { fase: 'fase2', settimane: f2 },
    { fase: 'scarico', settimane: 1, dopo: 'fase2' },
    { fase: 'fase3', settimane: f3 },
  ];
}

/**
 * Composizione per D settimane (test compresi). Con `conTest` il primo giro parte dal test (senza: si usano i
 * carichi già noti, per esempio dopo un cambio di obiettivo). La somma delle settimane è sempre D.
 */
export function componi(D: number, conTest = true): Segmento[] {
  const out: Segmento[] = [];
  let resto = Math.max(1, Math.round(D));
  let giro = 1;
  let primo = true;
  while (resto > 0) {
    if (!primo) {
      // Chiusura del giro precedente: scarico e, se resta spazio, nuovo test.
      out.push({ fase: 'scarico', settimane: 1, righe: [1], dopo: 'fase3', giro: giro - 1 });
      resto -= 1;
      if (resto <= 0) break;
    }
    if (primo ? conTest : true) {
      out.push({ fase: 'test', settimane: 1, righe: [1], giro });
      resto -= 1;
      if (resto <= 0) break;
    }
    const w = Math.min(resto, GIRO_COMPLETO);
    for (const f of fasiPer(w)) {
      out.push({ fase: f.fase, settimane: f.settimane, righe: f.fase === 'scarico' ? [1] : righe(f.settimane), dopo: f.dopo, giro });
    }
    resto -= w;
    giro++;
    primo = false;
  }
  return out;
}

export function sommaSettimane(seg: Segmento[]): number {
  return seg.reduce((a, s) => a + s.settimane, 0);
}

/** Sigla leggibile: "T F1×6 S F2×5". */
export function sigla(seg: Segmento[]): string {
  return seg.map((s) => (s.fase === 'test' ? 'T' : s.fase === 'scarico' ? 'S' : `F${s.fase.slice(-1)}×${s.settimane}`)).join(' ');
}

/** Descrizione in parole della composizione. */
export function descrivi(seg: Segmento[]): string {
  const nomi: Record<Fase, string> = { test: 'test', fase1: 'volume', fase2: 'volume e carico', fase3: 'intensificazione', scarico: 'scarico' };
  return seg.map((s) => (s.fase === 'test' || s.fase === 'scarico' ? nomi[s.fase] : `${s.settimane} ${nomi[s.fase]}`)).join(' · ');
}

const GIORNI: Giorno[] = ['A', 'B', 'C'];

/** Sedute del programma: 3 per settimana, numerate di seguito. */
export function generaSedute(seg: Segmento[], idProgramma: string): Seduta[] {
  const sedute: Seduta[] = [];
  let settimana = 0;
  let numero = 0;
  const conta: Partial<Record<Fase, number>> = {};
  let faseLavoroCorrente: 'fase1' | 'fase2' | 'fase3' = 'fase1';
  for (const s of seg) {
    if (s.fase === 'fase1' || s.fase === 'fase2' || s.fase === 'fase3') faseLavoroCorrente = s.fase;
    for (let i = 0; i < s.settimane; i++) {
      settimana++;
      for (const g of GIORNI) {
        numero++;
        conta[s.fase] = (conta[s.fase] ?? 0) + 1;
        const modello = SEDUTE.find((x) => x.giorno === g)!;
        const faseRif = s.fase === 'scarico' ? s.dopo ?? faseLavoroCorrente : s.fase === 'test' ? 'fase1' : s.fase;
        sedute.push({
          id: `${idProgramma}-${numero}`,
          numero,
          settimana,
          fase: s.fase,
          settimanaFase: i + 1,
          riga: s.righe[Math.min(i, s.righe.length - 1)],
          faseRif,
          giro: s.giro,
          giorno: g,
          nome: s.fase === 'test' ? `Test ${g}` : s.fase === 'scarico' ? `Scarico ${g}` : `Seduta ${g}`,
          etichetta: modello.etichetta,
          stato: 'futura',
        });
      }
    }
  }
  return sedute;
}
