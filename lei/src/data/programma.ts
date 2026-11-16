import type { FaseLavoro, Riga, SessioneModello, Voce } from '../tipi';

// Programma di lei: libro "Glutei", cap. II, "Programma 18 settimane intermedio" (pp. 220–226), distribuito su
// 3 sedute come nella Tab. 2.25 (p.236) e applicato a tutte e tre le fasi con la stessa regola:
//   A = esercizi 1, 2, 3, 5 del giorno 1 del libro · B = esercizi 1 e 4 del giorno 2 + esercizio 4 del giorno 1 ·
//   C = esercizi 2, 3, 5 del giorno 2.
// Ogni seduta ha poi la parte alta (scelta nostra, docs/PROPOSTA_PROGRAMMA_DONNA.md): dorso in tutte e tre.
// Righe: 6 settimane per fase. "+10/15 % peso" del libro → +10 %; "+15/20 %" → +15 % (valore prudente) [Ipotesi].
// "20/25 RM" → 22 RM; "12/15 RM" → 13 RM; "15/20" → 17 RM.

const sei = (r: Riga): Riga[] => Array.from({ length: 6 }, () => ({ ...r }));
const tutte = <T>(v: T): Record<FaseLavoro, T> => ({ fase1: v, fase2: v, fase3: v });

/** Fondamentale in % del massimale: serie × ripetizioni e percentuale per le 6 settimane. */
const pct = (righe: [number, number, number][]): Riga[] => righe.map(([s, r, p]) => ({ s, r, pct: p }));
/** Esercizio in RM con aumenti cumulativi del libro: [serie, rip, aumento]. */
const rm = (base: number, righe: [number, number, number?][]): Riga[] => righe.map(([s, r, inc]) => ({ s, r, rm: base, inc: inc || undefined }));
/** Serie a cedimento ("max") con il carico da n RM. */
const max = (s: number, n: number): Riga[] => sei({ s, r: n, rm: n, max: true });

const SQUAT_STACCO: Record<FaseLavoro, Riga[]> = {
  fase1: pct([[3, 5, 0.65], [3, 5, 0.65], [4, 5, 0.65], [4, 5, 0.65], [5, 5, 0.65], [5, 5, 0.65]]),
  fase2: pct([[3, 6, 0.65], [4, 6, 0.65], [4, 5, 0.7], [5, 5, 0.7], [5, 4, 0.75], [6, 4, 0.75]]),
  fase3: pct([[4, 5, 0.75], [4, 5, 0.75], [4, 4, 0.8], [4, 4, 0.8], [4, 3, 0.85], [4, 2, 0.9]]),
};

// Aumenti cumulativi: +10 % → 1,1; +10 % due volte → 1,21 (−1 = 0,21).
const I10 = 0.1;
const I10b = 0.21;
const I15 = 0.15;
const I15b = 0.3225;

/** Parte alta: stessa riga in tutte le settimane e fasi; `rm` = ripetizioni + 2 (2 di riserva). */
function alta(id: string, esercizio: string, s: number, r: number, ripMax: number, recupero: number, superserie?: string): Voce {
  return { id, parte: 'alta', esercizio: tutte(esercizio), righe: tutte(sei({ s, r, rm: r + 2 })), recupero: tutte(recupero), ripMax, superserie };
}

const SEDUTA_A: SessioneModello = {
  giorno: 'A',
  nome: 'Seduta A',
  etichetta: 'Squat e hip thrust · lat, petto alto, spalle',
  voci: [
    { id: 'A1', parte: 'glutei', esercizio: tutte('squat'), righe: SQUAT_STACCO, recupero: { fase1: 120, fase2: 150, fase3: 180 } },
    {
      id: 'A2', parte: 'glutei', esercizio: tutte('hip_thrust'),
      righe: {
        fase1: rm(10, [[3, 8], [3, 8], [4, 8], [4, 8], [5, 8], [5, 8]]),
        fase2: rm(12, [[3, 10], [4, 10], [3, 9, I10], [4, 9, I10], [3, 8, I10b], [4, 8, I10b]]),
        // Fase 3: si parte dal carico della settimana 6 della Fase 2.
        fase3: rm(12, [[3, 10, I10b], [4, 10, I10b], [3, 8, 0.331], [4, 8, 0.331], [3, 6, 0.4641], [4, 6, 0.4641]]),
      },
      recupero: { fase1: 120, fase2: 120, fase3: 120 },
    },
    {
      id: 'A3', parte: 'glutei', esercizio: { fase1: 'stacco_rumeno', fase2: 'stacco_rumeno', fase3: 'frog_hip_thrust' },
      righe: {
        fase1: sei({ s: 3, r: 10, rm: 12 }),
        fase2: rm(14, [[3, 12], [3, 12], [4, 12], [3, 10, I10], [3, 10, I10], [4, 10, I10]]),
        fase3: sei({ s: 3, r: 12, rm: 13 }),
      },
      recupero: tutte(90),
    },
    { id: 'A4', parte: 'glutei', esercizio: tutte('clam_shell'), righe: { fase1: max(2, 22), fase2: max(2, 22), fase3: max(2, 17) }, recupero: tutte(60) },
    alta('A5', 'lat_larga', 3, 10, 12, 90),
    alta('A6', 'panca_inclinata_manubri', 3, 10, 12, 90),
    alta('A7', 'alzate_laterali', 3, 12, 15, 60),
    alta('A8', 'crunch_cavo', 2, 15, 20, 60),
  ],
};

const SEDUTA_B: SessioneModello = {
  giorno: 'B',
  nome: 'Seduta B',
  etichetta: 'Stacco · rematore, spalle, petto',
  voci: [
    { id: 'B1', parte: 'glutei', esercizio: tutte('stacco'), righe: SQUAT_STACCO, recupero: { fase1: 120, fase2: 150, fase3: 180 } },
    {
      id: 'B2', parte: 'glutei', esercizio: { fase1: 'squat_bulgaro', fase2: 'hip_thrust_1gamba', fase3: 'hip_thrust_banda' },
      righe: { fase1: sei({ s: 2, r: 12, rm: 13 }), fase2: max(2, 12), fase3: max(2, 15) },
      recupero: { fase1: 90, fase2: 60, fase3: 90 },
    },
    {
      id: 'B3', parte: 'glutei', esercizio: { fase1: 'pull_through', fase2: 'affondi_camminata', fase3: 'back_extension' },
      // Affondi in camminata: "carico tale da arrivare molto vicino al cedimento" → 2×10 a 11 RM.
      righe: { fase1: max(2, 12), fase2: sei({ s: 2, r: 10, rm: 11 }), fase3: max(2, 13) },
      recupero: { fase1: 60, fase2: 60, fase3: 90 },
    },
    alta('B4', 'rematore_manubrio', 3, 10, 12, 90),
    alta('B5', 'spinte_manubri_seduto', 3, 10, 12, 90),
    alta('B6', 'chest_press', 3, 10, 12, 90),
    alta('B7', 'plank', 2, 45, 60, 60),
  ],
};

const SEDUTA_C: SessioneModello = {
  giorno: 'C',
  nome: 'Seduta C',
  etichetta: 'Accosciata e abduzione · dorso, spalle, braccia',
  voci: [
    {
      id: 'C1', parte: 'glutei', esercizio: { fase1: 'squat_fermo', fase2: 'affondi_dietro', fase3: 'squat_bulgaro' },
      righe: {
        fase1: rm(10, [[3, 8], [3, 8], [4, 8], [4, 8], [5, 8], [5, 8]]),
        fase2: rm(12, [[3, 10], [4, 10], [3, 9, I15], [4, 9, I15], [3, 8, I15b], [4, 8, I15b]]),
        fase3: rm(12, [[3, 10], [4, 10], [3, 8, I15], [4, 8, I15], [3, 6, I15b], [4, 6, I15b]]),
      },
      recupero: { fase1: 120, fase2: 120, fase3: 120 },
    },
    {
      id: 'C2', parte: 'glutei', esercizio: { fase1: 'hip_thrust_banda', fase2: 'hip_thrust_banda', fase3: 'squat_sumo_deficit' },
      righe: {
        fase1: sei({ s: 3, r: 10, rm: 12 }),
        fase2: rm(14, [[3, 12], [3, 12], [4, 12], [3, 10, I15], [3, 10, I15], [4, 10, I15]]),
        fase3: rm(14, [[3, 12], [3, 12], [3, 12], [3, 10, I15], [3, 10, I15], [3, 10, I15]]),
      },
      recupero: tutte(90),
    },
    { id: 'C3', parte: 'glutei', esercizio: tutte('abduzioni_cavo'), righe: tutte(max(2, 22)), recupero: tutte(60) },
    alta('C4', 'pulley', 3, 10, 12, 90),
    alta('C5', 'lat_inversa', 3, 10, 12, 90),
    alta('C6', 'face_pull', 2, 15, 20, 60),
    alta('C7', 'curl_manubri', 2, 12, 15, 60, 'braccia'),
    alta('C8', 'push_down_corda', 2, 12, 15, 60, 'braccia'),
    alta('C9', 'crunch_inverso', 2, 15, 20, 60),
  ],
};

export const SEDUTE: SessioneModello[] = [SEDUTA_A, SEDUTA_B, SEDUTA_C];

export function sessione(giorno: 'A' | 'B' | 'C'): SessioneModello {
  return SEDUTE.find((s) => s.giorno === giorno)!;
}

export const NOMI_FASI = { test: 'Test', fase1: 'Fase 1 · volume', fase2: 'Fase 2 · volume e carico', fase3: 'Fase 3 · intensificazione', scarico: 'Scarico' } as const;
export const NOMI_FASI_BREVI = { test: 'Test', fase1: 'Fase 1', fase2: 'Fase 2', fase3: 'Fase 3', scarico: 'Scarico' } as const;

/** Spiegazione della progressione di ogni fase (libro pp. 220–225), mostrata nel Percorso. */
export const SPIEGAZIONE_FASI: Record<FaseLavoro, string> = {
  fase1: 'Accumulo di volume e tecnica: carichi non eccessivi, una serie in più ogni due settimane sui fondamentali. Due ripetizioni di riserva nella prima serie, vicino al cedimento nelle ultime.',
  fase2: 'Ibrida: una settimana si aggiunge una serie, quella dopo sale il carico. Il lavoro sul range ipertrofico continua.',
  fase3: 'Intensificazione: meno volume e carichi sempre più alti sui fondamentali, dal 75 % al 90 % del massimale.',
};
