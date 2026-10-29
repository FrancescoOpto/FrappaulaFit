import type { Fase, FaseLavoro, Gruppo, Ruolo, Sottogruppo, TabellaProg } from '../tipi';

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
  // Alzate laterali Target (Blocco 1 giorno C): isolamento a 10–12 ripetizioni.
  R3d: {
    fase1: [[3, 10], [3, 10], [3, 10], [4, 10], [4, 10]],
    fase2: [[3, 11], [3, 11], [4, 11], [3, 12], [3, 12]],
    fase3: [[3, 8], [3, 8], [4, 8], [3, 9], [4, 9]],
    scarico: [[2, 12]],
  },
  // Spinte manubri panca piana (Blocco 2 giorno C): come R3b ma Fase 2 ciclo 5 = 3×10 e scarico 2×10.
  R3c: {
    fase1: [[3, 8], [3, 8], [3, 8], [3, 9], [3, 9]],
    fase2: [[4, 9], [4, 9], [3, 10], [3, 10], [3, 10]],
    fase3: [[3, 8], [3, 8], [4, 8], [3, 9], [4, 9]],
    scarico: [[2, 10]],
  },
  // L (fondamentale in seconda esposizione, Blocco 1 giorni C/D): Fase 1 letta nei video il 29/10 (panca C, squat D);
  // il ciclo 2 non è stato letto ed è presunto uguale al ciclo 1.
  L: {
    fase1: [[3, 8], [3, 8], [3, 9], [3, 9], [3, 10]],
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
  // Crunch del giorno C nel Blocco 3: in Fase 3 riparte da 13 invece che da 12.
  AB_C: {
    fase1: [[3, 12], [3, 12], [3, 12], [3, 12], [3, 12]],
    fase2: [[3, 13], [3, 13], [3, 14], [3, 14], [3, 15]],
    fase3: [[3, 13], [3, 13], [3, 14], [3, 14], [3, 15]],
    scarico: [[3, 15]],
  },
  // ---- Blocco 3 (BLOCCO3_programma.md §A2–A3): prescrizioni piatte dentro la fase ----
  // Fondamentali liberi: 3×5 / 3×4 / 3×3, scarico 3×4; carico a percentuale (CARICO_PER_TABELLA).
  B3_F: {
    fase1: [[3, 5], [3, 5], [3, 5], [3, 5], [3, 5]],
    fase2: [[3, 4], [3, 4], [3, 4], [3, 4], [3, 4]],
    fase3: [[3, 3], [3, 3], [3, 3], [3, 3], [3, 3]],
    scarico: [[3, 4]],
  },
  // Target a 10RM: 3×8 → 3×9 → 3×7 poi 3×8; scarico −1 serie.
  B3_T8: {
    fase1: [[3, 8], [3, 8], [3, 8], [3, 8], [3, 8]],
    fase2: [[3, 9], [3, 9], [3, 9], [3, 9], [3, 9]],
    fase3: [[3, 7], [3, 7], [3, 7], [3, 8], [3, 8]],
    scarico: [[2, 9]],
  },
  // Target a 12RM (multipower): 3×10 → 3×11 → 3×8; scarico 2×11.
  B3_T10: {
    fase1: [[3, 10], [3, 10], [3, 10], [3, 10], [3, 10]],
    fase2: [[3, 11], [3, 11], [3, 11], [3, 11], [3, 11]],
    fase3: [[3, 8], [3, 8], [3, 8], [3, 8], [3, 8]],
    scarico: [[2, 11]],
  },
  // Seconda riga ×12 del Target principale: 1 serie nelle settimane 1–2, 2 dalla 3; sparisce in scarico.
  B3_X12: {
    fase1: [[1, 12], [1, 12], [2, 12], [2, 12], [2, 12]],
    fase2: [[1, 12], [1, 12], [2, 12], [2, 12], [2, 12]],
    fase3: [[1, 12], [1, 12], [2, 12], [2, 12], [2, 12]],
    scarico: [],
  },
  // Lat media a serie singola (giorno C): 1×10 in Fase 1, 1×12 dopo; sparisce in scarico.
  B3_X1: {
    fase1: [[1, 10], [1, 10], [1, 10], [1, 10], [1, 10]],
    fase2: [[1, 12], [1, 12], [1, 12], [1, 12], [1, 12]],
    fase3: [[1, 12], [1, 12], [1, 12], [1, 12], [1, 12]],
    scarico: [],
  },
};

/**
 * Carico dei fondamentali a percentuale diretta del massimale stimato, per tabella (Blocco 3, BLOCCO3_programma.md §A2):
 * carico = round(1RM × pct). Per le tabelle senza voce vale la scala RM × fattore_lavoro (Blocchi 1–2).
 */
export const CARICO_PER_TABELLA: Partial<Record<TabellaProg, Record<FaseLavoro, number>>> = {
  B3_F: { fase1: 0.77, fase2: 0.82, fase3: 0.87, scarico: 0.77 },
};

/** Scarico delle righe rest-pause (Blocco 3 §A5): 1×40 → 2×12, 1×10 → 2×10. */
export const SCARICO_REST_PAUSE: Record<'totale' | '10_piu_3', [number, number]> = { totale: [2, 12], '10_piu_3': [2, 10] };

/** Pause della rest-pause "10 + 3 volte max" (secondi) e pausa consigliata tra le mini-serie della versione a totale. */
export const PAUSE_10_PIU_3 = [30, 40, 50];
export const PAUSA_REST_PAUSE_TOTALE = 15;

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
 * Fattore di lavoro sul massimale stimato: i carichi RM dell'app di riferimento sono 0,9 × stima × (37−n)/36.
 * Verificato nel Blocco 2 (panca 87,5 → 78,75, squat 56,5 → 50,85, stacco 90 → 81; BLOCCO2_programma.md §A3) e
 * nel Blocco 1 con i massimali reali dell'utente (panca 84,5, squat 62, stacco 87,5; BLOCCO1_verifica.md, 29/10).
 * Non noto per il Blocco 3 (che usa percentuali dirette). Origine del 10 % non nota: parametro modificabile nelle Impostazioni.
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
/** Stripping di carico: −20 % (SPEC_PIANIFICATORE §12b; il −30 % delle note non era verificato). */
export const STRIPPING = -0.2;

/**
 * Circuito PHA del profilo donna (SPEC_PIANIFICATORE §12b): transizioni 20–30″, recupero a fine giro ~2′30″,
 * 10–15 RM con 1–2 di riserva, 3 giri di default (2–4 a scelta). In Dimagrimento recuperi più brevi [Ipotesi: 20″ e 2′].
 */
export const CIRCUITO = {
  giriDefault: 3,
  giriMin: 2,
  giriMax: 4,
  ripMin: 10,
  ripMax: 15,
  mantenimento: { transizione: 30, recuperoGiro: 150 },
  definizione: { transizione: 20, recuperoGiro: 120 },
} as const;

export interface TempiCircuito {
  transizione: number;
  recuperoGiro: number;
}

/** Tempi del circuito per l'obiettivo del profilo ibrido (default: mantenimento e costruzione). */
export function tempiCircuito(obiettivo?: 'definizione' | 'mantenimento'): TempiCircuito {
  return obiettivo === 'definizione' ? CIRCUITO.definizione : CIRCUITO.mantenimento;
}

/** Rientro dopo una pausa (SPEC §3). */
export const RIENTRO = [
  { maxGiorni: 10, testo: 'Pausa breve: riprendi normalmente.' },
  { maxGiorni: 17, testo: 'Due settimane di stop: ripeti l’ultimo ciclo fatto.' },
  { maxGiorni: 24, testo: 'Tre settimane di stop: rifai il primo ciclo della fase e poi l’ultimo.' },
  { maxGiorni: Infinity, testo: 'Oltre tre settimane: kick-off (RIR 2 → 1, recuperi da 1’ a 1′30″–2′30″) prima di riprendere.' },
];
