import type { Obiettivo, Programma, Seduta } from '../tipi';
import { NOMI_FASI_BREVI } from '../data/programma';

export const NOMI_OBIETTIVO: Record<Obiettivo, string> = { definizione: 'Dimagrimento', mantenimento: 'Mantenimento e costruzione' };
export const DESCRIZIONE_OBIETTIVO: Record<Obiettivo, string> = {
  mantenimento: 'Calorie di mantenimento: tutte le serie del libro, recuperi del circuito pieni.',
  definizione: 'In deficit: una serie in meno sulla parte alta e sui glutei complementari (mai sui fondamentali, carichi uguali), recuperi del circuito più brevi.',
};

export interface InfoSettimana {
  eyebrow: string;
  titolo: string;
  testata: string;
}

/** Testata della seduta: obiettivo come eyebrow, fase e settimana come titolo. */
export function infoSettimana(pr: Pick<Programma, 'obiettivo' | 'sedute'>, s: Pick<Seduta, 'fase' | 'settimanaFase' | 'settimana' | 'giro'>): InfoSettimana {
  const eyebrow = NOMI_OBIETTIVO[pr.obiettivo].toUpperCase();
  const giro = s.giro > 1 ? ` · giro ${s.giro}` : '';
  if (s.fase === 'test') return { eyebrow, titolo: 'Settimana di test', testata: `Test${giro}` };
  if (s.fase === 'scarico') return { eyebrow, titolo: 'Settimana di scarico', testata: `Scarico${giro}` };
  const nFase = pr.sedute.filter((x) => x.fase === s.fase && x.giro === s.giro && x.giorno === 'A').length;
  const titolo = `${NOMI_FASI_BREVI[s.fase]} · settimana ${s.settimanaFase} di ${nFase}`;
  return { eyebrow, titolo, testata: `${titolo}${giro}` };
}
