import type { Fase, Gruppo, Ruolo, Sottogruppo, TabellaProg } from '../tipi';

/** Struttura del blocco in cicli (SPEC §3). */
export const FASI_BLOCCO: { fase: Fase; cicli: number; nome: string }[] = [
  { fase: 'test', cicli: 1, nome: 'Test' },
  { fase: 'fase1', cicli: 5, nome: 'Fase 1' },
  { fase: 'fase2', cicli: 5, nome: 'Fase 2' },
  { fase: 'scarico', cicli: 1, nome: 'Scarico' },
  { fase: 'fase3', cicli: 5, nome: 'Fase 3' },
];

/** Blocco breve: Test + Fase 1 + Fase 2 + Scarico (12 cicli). */
export const FASI_BLOCCO_BREVE = FASI_BLOCCO.slice(0, 4);

export const NOMI_FASI: Record<Fase, string> = {
  test: 'Test',
  fase1: 'Fase 1',
  fase2: 'Fase 2',
  scarico: 'Scarico',
  fase3: 'Fase 3',
};

type FaseLavoro = Exclude<Fase, 'test'>;
export type SerieRip = [serie: number, rip: number];

/**
 * Tabelle serie × ripetizioni per tabella di progressione e fase, cicli 1→5 (SPEC §7, BLOCCO2_programma.md §A2).
 * La tabella è un dato dello slot. Lo scarico ha un solo ciclo. C usa serie/rip fissi dello slot (motore/prescrizione.ts).
 */
export const TABELLE: Record<TabellaProg, Record<FaseLavoro, SerieRip[]>> = {
  R1: {
    fase1: [[4, 5], [4, 5], [4, 6], [4, 5], [4, 5]],
    fase2: [[3, 6], [3, 6], [4, 6], [4, 6], [3, 7]],
    fase3: [[3, 5], [3, 5], [4, 5], [4, 5], [4, 3]],
    scarico: [[3, 7]],
  },
  R2: {
    fase1: [[3, 8], [3, 8], [4, 8], [4, 8], [4, 8]],
    fase2: [[3, 9], [3, 9], [4, 9], [4, 9], [4, 9]],
    fase3: [[3, 7], [4, 7], [3, 8], [4, 8], [3, 6]],
    scarico: [[3, 9]],
  },
  R3: {
    fase1: [[3, 8], [3, 8], [3, 8], [4, 8], [4, 8]],
    fase2: [[3, 9], [3, 9], [4, 9], [4, 9], [3, 10]],
    fase3: [[3, 8], [4, 8], [4, 8], [3, 9], [3, 10]],
    scarico: [[2, 10]],
  },
  // Military press (Blocco 2 giorno B): progressione propria, carico fisso.
  R3b: {
    fase1: [[3, 8], [3, 8], [3, 8], [3, 9], [3, 9]],
    fase2: [[4, 9], [4, 9], [3, 10], [3, 10], [4, 10]],
    fase3: [[3, 8], [3, 8], [4, 8], [3, 9], [4, 9]],
    scarico: [[3, 10]],
  },
  // Spinte manubri panca piana (Blocco 2 giorno C): come R3b ma Fase 2 ciclo 5 = 3×10 e scarico 2×10.
  R3c: {
    fase1: [[3, 8], [3, 8], [3, 8], [3, 9], [3, 9]],
    fase2: [[4, 9], [4, 9], [3, 10], [3, 10], [3, 10]],
    fase3: [[3, 8], [3, 8], [4, 8], [3, 9], [4, 9]],
    scarico: [[2, 10]],
  },
  L: {
    fase1: [[3, 9], [3, 9], [3, 9], [3, 10], [3, 10]],
    fase2: [[3, 8], [3, 8], [3, 8], [3, 9], [3, 10]],
    fase3: [[3, 10], [3, 10], [3, 8], [3, 8], [3, 8]],
    scarico: [[3, 10]],
  },
  AB: {
    fase1: [[3, 12], [3, 12], [3, 12], [3, 12], [3, 12]],
    fase2: [[3, 13], [3, 13], [3, 14], [3, 14], [3, 15]],
    fase3: [[3, 12], [3, 12], [3, 13], [3, 13], [3, 14]],
    // Scarico AB invariato rispetto all'ultima settimana di Fase 2 (Blocco 2 giorno A, 28/10).
    scarico: [[3, 15]],
  },
};

/** Scale RM (n della formula di Brzycki) per R1 e L, per fase e ciclo (SPEC §6.3). */
export const SCALE_RM: Record<'R1' | 'L', Record<FaseLavoro, number[]>> = {
  R1: {
    fase1: [9, 9, 9, 7, 7],
    fase2: [7, 7, 7, 7, 7],
    fase3: [5, 5, 5, 5, 3],
    scarico: [11],
  },
  L: {
    fase1: [11, 11, 11, 11, 11],
    fase2: [9, 9, 9, 9, 9],
    fase3: [9, 9, 7, 7, 7],
    scarico: [13],
  },
};

/** Recuperi di default in secondi per ruolo (SPEC §9.4; AB non specificato: 60 s). */
export const RECUPERI_DEFAULT: Record<Ruolo, number> = {
  R1: 150,
  R2: 120,
  R3: 120,
  L: 120,
  C: 90,
  AB: 60,
};

/**
 * Fattore di lavoro sul massimale stimato (blocco2_giorno_B.md §3): i carichi RM dell'app di riferimento sono
 * 0,9 × stima × (37−n)/36, verificato su panca (87,5 → 78,75), squat (56,5 → 50,85) e stacco (90 → 81).
 * Origine del 10 % non nota: parametro modificabile nelle Impostazioni.
 */
export const FATTORE_LAVORO_DEFAULT = 0.9;

/** Durata stimata (SPEC §9.5). */
export const RISCALDAMENTO_S = 8 * 60;
export const ESECUZIONE_SERIE_S = 45;

/** Target di serie dirette a settimana per gruppo (SPEC §4.4, valori medi). */
export const TARGET_SETTIMANALE: Record<Gruppo, number> = {
  petto: 16,
  dorso: 15,
  spalle: 15,
  gambe: 16,
  bicipiti: 6,
  tricipiti: 6,
  addome: 6,
};

/** Soglie di avviso per i gruppi grandi (SPEC §4.4). */
export const SOGLIA_MIN_GRUPPO_GRANDE = 10;
export const SOGLIA_MAX_GRUPPO_GRANDE = 24;
export const GRUPPI_GRANDI: Gruppo[] = ['petto', 'dorso', 'spalle', 'gambe'];

/** Serie dirette minime a settimana per sottogruppo (SPEC §4.3). */
export const COPERTURA_MINIMA = 4;

/** Slot di riserva da aggiungere se un sottogruppo è scoperto. */
export const COPERTURA_FALLBACK: Record<Sottogruppo, { esercizio: string; serie: number; rip: number }> = {
  quadricipiti: { esercizio: 'leg_extension', serie: 3, rip: 10 },
  femorali: { esercizio: 'leg_curl', serie: 3, rip: 10 },
  glutei: { esercizio: 'stacco_rumeno', serie: 3, rip: 10 },
  spalle_laterali: { esercizio: 'alzate_laterali', serie: 3, rip: 12 },
  spalle_posteriori: { esercizio: 'alzate_posteriori', serie: 3, rip: 12 },
  bicipiti: { esercizio: 'curl_ez', serie: 3, rip: 10 },
  tricipiti: { esercizio: 'push_down_corda', serie: 3, rip: 10 },
};

/** Autocorrezione (SPEC §7). */
export const AUTOCORREZIONE_SERIE = -0.05;
export const AUTOCORREZIONE_CICLO = -0.025;
export const STRIPPING = -0.3;

/** Rientro dopo una pausa (SPEC §3). */
export const RIENTRO = [
  { maxGiorni: 10, testo: 'Pausa breve: riprendi normalmente.' },
  { maxGiorni: 17, testo: 'Due settimane di stop: ripeti l’ultimo ciclo fatto.' },
  { maxGiorni: 24, testo: 'Tre settimane di stop: rifai il primo ciclo della fase e poi l’ultimo.' },
  { maxGiorni: Infinity, testo: 'Oltre tre settimane: kick-off (RIR 2 → 1, recuperi da 1’ a 1′30″–2′30″) prima di riprendere.' },
];
