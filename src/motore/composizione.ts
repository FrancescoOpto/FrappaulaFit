import type { FaseLavoro, SegmentoPiano } from '../tipi';

// Piano su misura per durata (SPEC_PIANIFICATORE v2 §6b): i blocchi di riferimento sono una linea guida.
// Il pianificatore ricompone solo i mattoni validati (T, F1, F2, S, F3) per la durata richiesta, senza
// inventare schemi serie×ripetizioni. Funzioni pure e deterministiche, testate in composizione.test.ts.

export const CICLI_BLOCCO_INTERO = 16; // F1×5 F2×5 S F3×5 (senza il Test)
export const CICLI_MANTENIMENTO = 11; // F1×5 F2×5 S

export interface SegmentoFase {
  fase: FaseLavoro;
  cicli: number;
}

/**
 * Massa: composizione per R cicli (senza il Test).
 * R ≤ 5 → solo F1; 6–11 → F1 + F2 + S; 12–16 → F1 + F2 + S + F3; R ≥ 17 → blocco intero (16) + scarico di chiusura.
 * Fase minima: F1 e F2 ≥ 2, F3 ≥ 3 (garantito dalle formule).
 */
export function componiMassa(R: number): SegmentoFase[] {
  if (R <= 0) return [];
  if (R <= 5) return [{ fase: 'fase1', cicli: R }];
  if (R <= 11) {
    const w = R - 1;
    const f1 = Math.min(5, Math.ceil(w / 2));
    return [{ fase: 'fase1', cicli: f1 }, { fase: 'fase2', cicli: w - f1 }, { fase: 'scarico', cicli: 1 }];
  }
  if (R <= 16) {
    const w = R - 1;
    const f3 = Math.min(5, Math.max(3, Math.floor(w / 3)));
    const r = w - f3;
    const f1 = Math.min(5, Math.ceil(r / 2));
    return [{ fase: 'fase1', cicli: f1 }, { fase: 'fase2', cicli: r - f1 }, { fase: 'scarico', cicli: 1 }, { fase: 'fase3', cicli: f3 }];
  }
  // Blocco intero + scarico di chiusura (17 cicli); il resto va al blocco successivo (compongoPiano).
  return [{ fase: 'fase1', cicli: 5 }, { fase: 'fase2', cicli: 5 }, { fase: 'scarico', cicli: 1 }, { fase: 'fase3', cicli: 5 }, { fase: 'scarico', cicli: 1 }];
}

/** Mantenimento: come la Massa ma senza F3; oltre 11 cicli si ripete con il blocco successivo. */
export function componiMantenimento(R: number): SegmentoFase[] {
  if (R <= 0) return [];
  if (R <= 5) return [{ fase: 'fase1', cicli: R }];
  const w = Math.min(R, CICLI_MANTENIMENTO) - 1;
  const f1 = Math.min(5, Math.ceil(w / 2));
  return [{ fase: 'fase1', cicli: f1 }, { fase: 'fase2', cicli: w - f1 }, { fase: 'scarico', cicli: 1 }];
}

export function sommaCicli(seg: { cicli: number }[]): number {
  return seg.reduce((a, s) => a + s.cicli, 0);
}

/** Blocco di riferimento successivo: Massa 1 → 2 → 3 → 1; Mantenimento solo 1 ↔ 2 (il Blocco 3 è il blocco di definizione). */
export function bloccoSuccessivo(blocco: number, modulo: 'massa' | 'mantenimento'): number {
  if (modulo === 'mantenimento') return blocco === 1 ? 2 : 1;
  return (blocco % 3) + 1;
}

/**
 * Piano completo per D cicli (Test incluso quando `conTest`): segmenti con fase, cicli e blocco di riferimento.
 * Massa: dopo un blocco intero (16 + scarico di chiusura) nuovo Test e blocco successivo (1 → 2 → 3 → 1).
 * Mantenimento: dopo 11 cicli si passa al blocco successivo (1 ↔ 2) senza Test (il profilo carichi è recente).
 * La somma dei cicli è sempre D.
 */
export function compongoPiano(D: number, conTest: boolean, modulo: 'massa' | 'mantenimento', bloccoIniziale = 1): SegmentoPiano[] {
  const out: SegmentoPiano[] = [];
  let resto = Math.max(0, Math.round(D));
  let blocco = bloccoIniziale;
  let primo = true;
  let guardia = 0;
  while (resto > 0 && guardia++ < 50) {
    const test = primo ? conTest : modulo === 'massa';
    if (test) {
      out.push({ fase: 'test', cicli: 1, bloccoRif: blocco });
      resto--;
      if (resto <= 0) break;
    }
    const seg = modulo === 'massa' ? componiMassa(resto) : componiMantenimento(resto);
    for (const s of seg) out.push({ ...s, bloccoRif: blocco });
    resto -= sommaCicli(seg);
    blocco = bloccoSuccessivo(blocco, modulo);
    primo = false;
  }
  return out;
}

/** Alias con il nome usato nella spec. */
export const componiPiano = compongoPiano;

/**
 * Righe delle tabelle di progressione per una fase accorciata a n cicli (regola dei gradini, §6b):
 * le tabelle hanno 5 righe con ciclo 1 = 2, gradino al 3, gradino al 4, 5 = 4. Con meno cicli si tengono
 * i gradini: n=1 → [1]; n=2 → [1,5]; n=3 → [1,3,5]; n=4 → [1,2,4,5]; n≥5 → [1,2,3,4,5] (oltre 5 si ripete la 5).
 * [Ipotesi: la spec dice "accorciare con la stessa regola dei gradini" senza la mappa esatta.]
 */
export function righeTabella(n: number): number[] {
  if (n <= 1) return [1];
  if (n === 2) return [1, 5];
  if (n === 3) return [1, 3, 5];
  if (n === 4) return [1, 2, 4, 5];
  return Array.from({ length: n }, (_, i) => Math.min(5, i + 1));
}

const NOME_BREVE: Record<FaseLavoro | 'test', string> = { test: 'test', fase1: 'volume', fase2: 'ripetizioni', scarico: 'scarico', fase3: 'intensità' };

/** Composizione in parole: "test · 5 volume · 4 ripetizioni · scarico · 3 intensità". */
export function descriviComposizione(seg: SegmentoPiano[]): string {
  return seg.map((s) => (s.fase === 'test' || s.fase === 'scarico' ? NOME_BREVE[s.fase] : `${s.cicli} ${NOME_BREVE[s.fase]}`)).join(' · ');
}

/** Sigla compatta per i test: "T F1×3 F2×3 S". */
export function siglaComposizione(seg: SegmentoPiano[]): string {
  const sig: Record<FaseLavoro | 'test', string> = { test: 'T', fase1: 'F1', fase2: 'F2', scarico: 'S', fase3: 'F3' };
  return seg.map((s) => (s.fase === 'test' || s.fase === 'scarico' ? sig[s.fase] : `${sig[s.fase]}×${s.cicli}`)).join(' ');
}
