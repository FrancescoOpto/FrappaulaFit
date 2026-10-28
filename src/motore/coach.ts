import type { Checkin, Esperienza, Obiettivo, StatoEnergetico } from '../tipi';

// Motore coach (SPEC_PIANIFICATORE §1, §3.4, §8): propone e spiega, non impone. Funzioni pure.

export interface Consiglio {
  regola: string;
  testo: string;
  perche: string;
  livello: 'info' | 'avviso';
}

/** Massa in deficit: avviso morbido (informativo per i principianti: ricomposizione possibile). */
export function avvisoEnergia(obiettivo: Obiettivo, energia: StatoEnergetico, esperienza: Esperienza): Consiglio | null {
  if (obiettivo !== 'massa' || energia !== 'deficit') return null;
  return {
    regola: 'energia_blocca_ipertrofia',
    livello: esperienza === 'principiante' ? 'info' : 'avviso',
    testo: esperienza === 'principiante'
      ? 'Sei in deficit: da principiante puoi comunque migliorare la composizione corporea, ma la crescita sarà limitata.'
      : 'In deficit non si costruisce muscolo in modo efficace. Scegli Mantenimento o Dimagrimento, oppure indica che sei in surplus.',
    perche: 'Con un deficit del 20 % la sintesi proteica cala di circa un quinto: l’allenamento la riporta al livello di riposo, non oltre.',
  };
}

export interface MediaSettimanale {
  settimana: string;
  media: number;
  n: number;
}

/** Media del peso per settimana di calendario (lunedì–domenica), in ordine cronologico. */
export function mediePesoSettimanali(checkin: Checkin[]): MediaSettimanale[] {
  const gruppi = new Map<string, number[]>();
  for (const c of checkin) {
    if (!c.peso) continue;
    const d = new Date(c.data + 'T12:00:00');
    const lun = new Date(d);
    lun.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const chiave = lun.toISOString().slice(0, 10);
    gruppi.set(chiave, [...(gruppi.get(chiave) ?? []), c.peso]);
  }
  return [...gruppi.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([settimana, v]) => ({ settimana, media: Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100, n: v.length }));
}

/**
 * Taratura delle calorie sulle medie settimanali (§3.4): decisioni solo dopo ≥ 2 settimane (la prima non conta).
 * `ritmoAttesoPct` è negativo in dimagrimento, positivo in massa; `tettoPct` positivo.
 */
export function valutaPeso(medie: MediaSettimanale[], obiettivo: Obiettivo, ritmoAttesoPct: number, tettoPct = 0.01): Consiglio | null {
  if (medie.length < 3) return null;
  const ultime = medie.slice(-3);
  const base = ultime[0].media;
  const variazioni = [ultime[1].media - ultime[0].media, ultime[2].media - ultime[1].media].map((v) => v / base);
  const mediaVar = (variazioni[0] + variazioni[1]) / 2;
  if (obiettivo === 'definizione') {
    const atteso = ritmoAttesoPct / 100;
    if (mediaVar < -tettoPct) return { regola: 'ritmo_dimagrimento', livello: 'avviso', testo: 'Stai perdendo peso più in fretta del tetto: aggiungi 100–200 kcal al giorno.', perche: 'Oltre l’1 % del peso a settimana si rischia di perdere muscolo oltre al grasso.' };
    if (mediaVar > atteso * 0.5) return { regola: 'taratura_calorie', livello: 'info', testo: 'Il peso scende meno della metà del previsto da due settimane: togli 100–200 kcal al giorno.', perche: 'La stima del fabbisogno ha un errore tipico del 10 %: si corregge sulla media del peso, mai su un giorno.' };
    return null;
  }
  if (obiettivo === 'massa') {
    if (mediaVar > 0.006) return { regola: 'taratura_calorie', livello: 'avviso', testo: 'Il peso sale più di 0,6 % a settimana: riduci il surplus di 100–200 kcal.', perche: 'Sopra 0,3–0,35 % a settimana la parte in più è quasi tutta grasso.' };
    if (mediaVar < 0.0005) return { regola: 'taratura_calorie', livello: 'info', testo: 'Il peso è fermo da due settimane: aggiungi 100–200 kcal al giorno.', perche: 'In massa il peso deve salire piano ma salire.' };
    return null;
  }
  if (Math.abs(mediaVar) > 0.005) return { regola: 'taratura_calorie', livello: 'info', testo: mediaVar > 0 ? 'Il peso sale: togli 100 kcal al giorno.' : 'Il peso scende: aggiungi 100 kcal al giorno.', perche: 'In mantenimento la media settimanale deve restare entro ±0,5 %.' };
  return null;
}

/** Circonferenze (§3.4): se in dimagrimento il braccio cala più del 10 % del calo di vita → possibile perdita di muscolo. */
export function valutaCirconferenze(checkin: Checkin[]): Consiglio | null {
  const con = checkin.filter((c) => c.vita && c.braccio).sort((a, b) => a.data.localeCompare(b.data));
  if (con.length < 2) return null;
  const primo = con[0];
  const ultimo = con[con.length - 1];
  const caloVita = (primo.vita ?? 0) - (ultimo.vita ?? 0);
  const caloBraccio = (primo.braccio ?? 0) - (ultimo.braccio ?? 0);
  if (caloVita <= 0 || caloBraccio <= 0) return null;
  if (caloBraccio > caloVita * 0.1) {
    return { regola: 'braccio_vs_vita', livello: 'avviso', testo: `Il braccio è calato di ${caloBraccio.toFixed(1)} cm contro ${caloVita.toFixed(1)} cm di vita: stai perdendo muscolo?`, perche: 'In dimagrimento il calo deve avvenire in vita e cosce; se cala il braccio, alza proteine o calorie e controlla i carichi.' };
  }
  return null;
}

/** Trend carichi (§8): kg×rip di un esercizio in calo per 2 sedute di fila rispetto alla precedente → proponi −1 serie / scarico anticipato. */
export function trendCarichi(nome: string, volumi: number[]): Consiglio | null {
  if (volumi.length < 3) return null;
  const [a, b, c] = volumi.slice(-3);
  if (b < a && c < b) {
    return { regola: 'trend_carichi', livello: 'avviso', testo: `${nome}: il lavoro (kg × ripetizioni) cala da due sedute. Togli una serie ai complementari del gruppo o anticipa lo scarico.`, perche: 'Due cali di fila sui carichi principali indicano che il volume supera quello recuperabile.' };
  }
  return null;
}
