import type { Fase, OpzionePiano } from '../tipi';
import { FASI_BLOCCO } from '../data/tabelle';

// Pianificatore a obiettivo (SPEC §15) [Ipotesi]: dalle settimane disponibili propone combinazioni di blocchi.
// Solo logica pura; nessuna interfaccia per ora. Le versioni accorciate sono una scelta nostra, non vista
// nell'app di riferimento, e sono marcate `nostraScelta`.

export const SETTIMANE_BLOCCO = FASI_BLOCCO.reduce((a, f) => a + f.cicli, 0); // 17

export function settimaneTra(inizio: Date, obiettivo: Date): number {
  return Math.max(0, Math.floor((obiettivo.getTime() - inizio.getTime()) / (7 * 86_400_000)));
}

function cicliCompleti(): Partial<Record<Fase, number>> {
  const c: Partial<Record<Fase, number>> = {};
  for (const f of FASI_BLOCCO) c[f.fase] = f.cicli;
  return c;
}

/** Blocco accorciato a `settimane` cicli: test 1 + scarico 1 fissi, il resto diviso tra Fase 1 e Fase 2 (senza Fase 3). */
export function bloccoAccorciato(settimane: number): Partial<Record<Fase, number>> | null {
  if (settimane < 6) return null;
  const lavoro = Math.min(settimane - 2, 10);
  const fase1 = Math.ceil(lavoro / 2);
  const fase2 = lavoro - fase1;
  return { test: 1, fase1, fase2, scarico: 1 };
}

export function opzioniPiano(inizio: Date, obiettivo: Date): OpzionePiano[] {
  const W = settimaneTra(inizio, obiettivo);
  const out: OpzionePiano[] = [];
  const nCompleti = Math.floor(W / SETTIMANE_BLOCCO);
  const resto = W - nCompleti * SETTIMANE_BLOCCO;

  if (nCompleti >= 1) {
    out.push({
      id: 'completi',
      titolo: `${nCompleti} ${nCompleti === 1 ? 'blocco completo' : 'blocchi completi'}`,
      settimane: nCompleti * SETTIMANE_BLOCCO,
      blocchi: Array.from({ length: nCompleti }, (_, i) => ({ numero: i + 1, cicli: cicliCompleti() })),
      nostraScelta: false,
      perche: `Ogni blocco dura ${SETTIMANE_BLOCCO} settimane (test, tre fasi, scarico). ${resto ? `Restano ${resto} settimane libere prima dell’obiettivo.` : 'Finisce esattamente all’obiettivo.'}`,
    });
  }
  const breve = bloccoAccorciato(resto);
  if (breve) {
    const settBreve = Object.values(breve).reduce((a, b) => a + (b ?? 0), 0);
    out.push({
      id: 'completi_piu_breve',
      titolo: `${nCompleti ? `${nCompleti} ${nCompleti === 1 ? 'blocco completo' : 'blocchi completi'} + ` : ''}blocco accorciato (${settBreve} settimane)`,
      settimane: nCompleti * SETTIMANE_BLOCCO + settBreve,
      blocchi: [...Array.from({ length: nCompleti }, (_, i) => ({ numero: i + 1, cicli: cicliCompleti() })), { numero: nCompleti + 1, cicli: breve }],
      nostraScelta: true,
      perche: `L’ultimo blocco toglie cicli alle fasi per far cadere lo scarico vicino alla data obiettivo${W - nCompleti * SETTIMANE_BLOCCO - settBreve ? ` (${W - nCompleti * SETTIMANE_BLOCCO - settBreve} settimane libere)` : ''}. Versione nostra, non dell’app di riferimento.`,
    });
  }
  if (!out.length) {
    out.push({
      id: 'troppo_poco',
      titolo: 'Meno di 6 settimane',
      settimane: W,
      blocchi: [],
      nostraScelta: true,
      perche: 'Non basta per un blocco: conviene fare la settimana di test e poi una Fase 1 intera, spostando l’obiettivo.',
    });
  }
  return out;
}
