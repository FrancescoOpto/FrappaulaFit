import type { Contenitore, Preset, SessioneContenitore, Slot } from '../tipi';

// Contenitori (SPEC §4.2–4.3): per ogni N, quali gruppi/slot stanno in quale seduta.
// Il contenitore definisce i ruoli; i singoli esercizi sono "default" sostituibili per classe.

const s = (o: Slot): Slot => o;

// --- Sedute riutilizzabili (preset uomo) ---

const SPLIT_A: SessioneContenitore = {
  nome: 'Split A',
  etichetta: 'Petto · Gambe · Braccia',
  slot: [
    s({ gruppo: 'petto', ruolo: 'R1', classe: 'spinta_orizzontale', default: 'panca_piana' }),
    s({ gruppo: 'petto', ruolo: 'R2', classe: 'spinta_orizzontale', default: 'panca_manubri' }),
    s({ gruppo: 'petto', ruolo: 'C', classe: 'petto_isolamento', default: 'croci_cavi', serie: 3, rip: 10 }),
    s({ gruppo: 'gambe', ruolo: 'R1', classe: 'squat', default: 'squat', copre: 'quadricipiti' }),
    s({ gruppo: 'gambe', ruolo: 'R2', classe: 'squat', default: 'pressa', copre: 'quadricipiti' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'quadricipiti_isolamento', default: 'leg_extension', serie: 3, rip: 10, copre: 'quadricipiti' }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_ez', serie: 3, rip: 10, superserie: 'braccia', copre: 'bicipiti' }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'french_ez', serie: 3, rip: 10, superserie: 'braccia', copre: 'tricipiti' }),
    s({ gruppo: 'addome', ruolo: 'AB', classe: 'addome', default: 'crunch_cavo' }),
  ],
};

const SPLIT_B: SessioneContenitore = {
  nome: 'Split B',
  etichetta: 'Spalle · Dorso · Stacco',
  slot: [
    s({ gruppo: 'spalle', ruolo: 'R3b', classe: 'spinta_verticale', default: 'military_press', guida: 'spalle' }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_laterali', default: 'alzate_laterali', serie: 3, rip: 12, superserie: 'spalle', copre: 'spalle_laterali' }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_posteriori', default: 'alzate_posteriori', serie: 3, rip: 12, superserie: 'spalle', copre: 'spalle_posteriori' }),
    s({ gruppo: 'dorso', ruolo: 'R2', classe: 'trazione_verticale', default: 'lat_machine' }),
    s({ gruppo: 'dorso', ruolo: 'R3', classe: 'trazione_orizzontale', default: 'rematore_manubrio' }),
    s({ gruppo: 'dorso', ruolo: 'C', classe: 'trazione_orizzontale', default: 'pulley', serie: 3, rip: 10 }),
    s({ gruppo: 'gambe', ruolo: 'R1', classe: 'cerniera_anca', default: 'stacco_da_terra', copre: 'glutei' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'femorali_isolamento', default: 'leg_curl', serie: 3, rip: 10, copre: 'femorali' }),
  ],
};

const FULL_C: SessioneContenitore = {
  nome: 'Full C',
  etichetta: 'Tutto tranne gambe (jolly)',
  slot: [
    s({ gruppo: 'petto', ruolo: 'R2', classe: 'spinta_inclinata', default: 'panca_inclinata_manubri' }),
    s({ gruppo: 'dorso', ruolo: 'R3', classe: 'trazione_orizzontale', default: 't_bar' }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spinta_verticale', default: 'shoulder_press_macchina', serie: 3, rip: 10 }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_laterali', default: 'alzate_laterali_cavo', serie: 3, rip: 12, copre: 'spalle_laterali' }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_manubri', serie: 3, rip: 10, superserie: 'braccia', copre: 'bicipiti' }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'push_down_corda', serie: 3, rip: 10, superserie: 'braccia', copre: 'tricipiti' }),
    s({ gruppo: 'addome', ruolo: 'AB', classe: 'addome', default: 'crunch_macchina' }),
  ],
};

const SPLIT_A2: SessioneContenitore = {
  nome: 'Split A2',
  etichetta: 'Petto leggero · Gambe · Braccia',
  slot: [
    s({ gruppo: 'petto', ruolo: 'L', classe: 'spinta_orizzontale', default: 'panca_piana' }),
    s({ gruppo: 'petto', ruolo: 'C', classe: 'petto_isolamento', default: 'croci_manubri', serie: 3, rip: 10 }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'quadricipiti_isolamento', default: 'leg_extension', serie: 3, rip: 12, copre: 'quadricipiti' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'femorali_isolamento', default: 'leg_curl', serie: 3, rip: 10, copre: 'femorali' }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_manubri', serie: 3, rip: 10, superserie: 'braccia', copre: 'bicipiti' }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'french_manubri', serie: 3, rip: 10, superserie: 'braccia', copre: 'tricipiti' }),
    s({ gruppo: 'addome', ruolo: 'AB', classe: 'addome', default: 'crunch_macchina' }),
  ],
};

const SPLIT_B2: SessioneContenitore = {
  nome: 'Split B2',
  etichetta: 'Spalle · Dorso · Squat leggero',
  slot: [
    s({ gruppo: 'spalle', ruolo: 'R3', classe: 'spinta_verticale', default: 'spinte_manubri_seduto', evita_guida: 'spalle' }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_laterali', default: 'alzate_laterali_cavo', serie: 3, rip: 12, copre: 'spalle_laterali' }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_posteriori', default: 'face_pull', serie: 3, rip: 12, copre: 'spalle_posteriori' }),
    s({ gruppo: 'dorso', ruolo: 'R3', classe: 'trazione_orizzontale', default: 't_bar' }),
    s({ gruppo: 'dorso', ruolo: 'C', classe: 'trazione_verticale', default: 'lat_triangolo', serie: 3, rip: 10 }),
    s({ gruppo: 'gambe', ruolo: 'L', classe: 'squat', default: 'squat', copre: 'quadricipiti' }),
    s({ gruppo: 'addome', ruolo: 'AB', classe: 'addome', default: 'leg_raise' }),
  ],
};

const FULL_A: SessioneContenitore = {
  nome: 'Full A',
  etichetta: 'Tutto il corpo',
  slot: [
    s({ gruppo: 'petto', ruolo: 'R1', classe: 'spinta_orizzontale', default: 'panca_piana' }),
    s({ gruppo: 'gambe', ruolo: 'R1', classe: 'squat', default: 'squat', copre: 'quadricipiti' }),
    s({ gruppo: 'dorso', ruolo: 'R2', classe: 'trazione_verticale', default: 'lat_machine' }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_laterali', default: 'alzate_laterali', serie: 3, rip: 12, copre: 'spalle_laterali' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'femorali_isolamento', default: 'leg_curl', serie: 3, rip: 10, copre: 'femorali' }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_ez', serie: 3, rip: 10, superserie: 'braccia', copre: 'bicipiti' }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'french_ez', serie: 3, rip: 10, superserie: 'braccia', copre: 'tricipiti' }),
    s({ gruppo: 'addome', ruolo: 'AB', classe: 'addome', default: 'crunch_cavo' }),
  ],
};

const FULL_B: SessioneContenitore = {
  nome: 'Full B',
  etichetta: 'Tutto il corpo',
  slot: [
    s({ gruppo: 'spalle', ruolo: 'R3b', classe: 'spinta_verticale', default: 'military_press', guida: 'spalle' }),
    s({ gruppo: 'gambe', ruolo: 'R1', classe: 'cerniera_anca', default: 'stacco_da_terra', copre: 'glutei' }),
    s({ gruppo: 'petto', ruolo: 'R2', classe: 'spinta_inclinata', default: 'panca_inclinata_manubri' }),
    s({ gruppo: 'dorso', ruolo: 'R3', classe: 'trazione_orizzontale', default: 'rematore_manubrio' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'quadricipiti_isolamento', default: 'leg_extension', serie: 3, rip: 10, copre: 'quadricipiti' }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_posteriori', default: 'alzate_posteriori', serie: 3, rip: 12, copre: 'spalle_posteriori' }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_manubri', serie: 3, rip: 10, superserie: 'braccia', copre: 'bicipiti' }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'push_down_corda', serie: 3, rip: 10, superserie: 'braccia', copre: 'tricipiti' }),
  ],
};

/** S5 "richiamo": solo complementari; il generatore privilegia i gruppi prioritari. */
const RICHIAMO: SessioneContenitore = {
  nome: 'Richiamo',
  etichetta: 'Complementari (gruppi prioritari)',
  slot: [
    s({ gruppo: 'petto', ruolo: 'C', classe: 'petto_isolamento', default: 'pec_deck', serie: 3, rip: 12 }),
    s({ gruppo: 'dorso', ruolo: 'C', classe: 'trazione_verticale', default: 'lat_unilaterale', serie: 3, rip: 12 }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_laterali', default: 'alzate_laterali_macchina', serie: 3, rip: 12, copre: 'spalle_laterali' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'hip_thrust', default: 'glute_bridge', serie: 3, rip: 12, copre: 'glutei' }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_cavo', serie: 2, rip: 12, superserie: 'braccia', copre: 'bicipiti' }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'push_down_barra', serie: 2, rip: 12, superserie: 'braccia', copre: 'tricipiti' }),
    s({ gruppo: 'addome', ruolo: 'AB', classe: 'addome', default: 'plank' }),
  ],
};

// --- Preset "Donna – focus glutei" (SPEC §8, PROVVISORIO: in attesa dei libri glutei/donna) ---
// Fondamentali permanenti: hip thrust, squat, panca, stacco. Regola dei 2 R1: panca+squat in S1,
// hip thrust+stacco in S2; la guida spalle (Target a carico fisso) nella jolly. Spalle/braccia −20% ≈ una serie in meno.

const DONNA_S1: SessioneContenitore = {
  nome: 'Split A',
  etichetta: 'Gambe · Petto · Braccia',
  slot: [
    s({ gruppo: 'gambe', ruolo: 'R1', classe: 'squat', default: 'squat', copre: 'quadricipiti' }),
    s({ gruppo: 'gambe', ruolo: 'R2', classe: 'hip_thrust', default: 'hip_thrust_macchina', copre: 'glutei' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'quadricipiti_isolamento', default: 'leg_extension', serie: 3, rip: 12, copre: 'quadricipiti' }),
    s({ gruppo: 'petto', ruolo: 'R1', classe: 'spinta_orizzontale', default: 'panca_piana' }),
    s({ gruppo: 'petto', ruolo: 'C', classe: 'petto_isolamento', default: 'croci_cavi', serie: 3, rip: 12 }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_manubri', serie: 2, rip: 12, superserie: 'braccia', copre: 'bicipiti' }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'push_down_corda', serie: 2, rip: 12, superserie: 'braccia', copre: 'tricipiti' }),
    s({ gruppo: 'addome', ruolo: 'AB', classe: 'addome', default: 'crunch_cavo' }),
  ],
};

const DONNA_S2: SessioneContenitore = {
  nome: 'Split B',
  etichetta: 'Glutei · Dorso · Spalle',
  slot: [
    s({ gruppo: 'gambe', ruolo: 'R1', classe: 'hip_thrust', default: 'hip_thrust', copre: 'glutei' }),
    s({ gruppo: 'gambe', ruolo: 'R1', classe: 'cerniera_anca', default: 'stacco_da_terra', copre: 'glutei' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'femorali_isolamento', default: 'leg_curl', serie: 3, rip: 12, copre: 'femorali' }),
    s({ gruppo: 'dorso', ruolo: 'R2', classe: 'trazione_verticale', default: 'lat_machine' }),
    s({ gruppo: 'dorso', ruolo: 'C', classe: 'trazione_orizzontale', default: 'pulley', serie: 3, rip: 12 }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_laterali', default: 'alzate_laterali', serie: 3, rip: 12, superserie: 'spalle', copre: 'spalle_laterali' }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_posteriori', default: 'alzate_posteriori', serie: 2, rip: 12, superserie: 'spalle', copre: 'spalle_posteriori' }),
  ],
};

const DONNA_S3: SessioneContenitore = {
  nome: 'Full C',
  etichetta: 'Spalle · Glutei · Dorso (jolly)',
  slot: [
    s({ gruppo: 'spalle', ruolo: 'R3b', classe: 'spinta_verticale', default: 'military_press', guida: 'spalle' }),
    s({ gruppo: 'gambe', ruolo: 'R3', classe: 'cerniera_anca', default: 'stacco_rumeno', copre: 'glutei' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'hip_thrust', default: 'abductor', serie: 3, rip: 15, copre: 'glutei' }),
    s({ gruppo: 'dorso', ruolo: 'R3', classe: 'trazione_orizzontale', default: 'rematore_manubrio' }),
    s({ gruppo: 'petto', ruolo: 'C', classe: 'spinta_inclinata', default: 'chest_press_inclinata', serie: 3, rip: 12 }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_cavo', serie: 2, rip: 12, superserie: 'braccia', copre: 'bicipiti' }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'french_manubri', serie: 2, rip: 12, superserie: 'braccia', copre: 'tricipiti' }),
    s({ gruppo: 'addome', ruolo: 'AB', classe: 'addome', default: 'leg_raise' }),
  ],
};

const DONNA_S4: SessioneContenitore = {
  nome: 'Split B2',
  etichetta: 'Glutei leggero · Dorso · Spalle',
  slot: [
    s({ gruppo: 'gambe', ruolo: 'L', classe: 'hip_thrust', default: 'hip_thrust', copre: 'glutei' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'hip_thrust', default: 'abductor', serie: 3, rip: 15, copre: 'glutei' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'squat', default: 'affondi', serie: 3, rip: 12, copre: 'quadricipiti' }),
    s({ gruppo: 'dorso', ruolo: 'R3', classe: 'trazione_orizzontale', default: 'rematore_manubrio' }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spinta_verticale', default: 'shoulder_press_macchina', serie: 3, rip: 12 }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_laterali', default: 'alzate_laterali_cavo', serie: 3, rip: 12, copre: 'spalle_laterali' }),
    s({ gruppo: 'addome', ruolo: 'AB', classe: 'addome', default: 'plank' }),
  ],
};

const DONNA_FULL_A: SessioneContenitore = {
  nome: 'Full A',
  etichetta: 'Tutto il corpo',
  slot: [
    s({ gruppo: 'gambe', ruolo: 'R1', classe: 'hip_thrust', default: 'hip_thrust', copre: 'glutei' }),
    s({ gruppo: 'gambe', ruolo: 'R1', classe: 'squat', default: 'squat', copre: 'quadricipiti' }),
    s({ gruppo: 'petto', ruolo: 'R2', classe: 'spinta_orizzontale', default: 'panca_manubri' }),
    s({ gruppo: 'dorso', ruolo: 'R2', classe: 'trazione_verticale', default: 'lat_machine' }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_laterali', default: 'alzate_laterali', serie: 3, rip: 12, copre: 'spalle_laterali' }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_manubri', serie: 2, rip: 12, superserie: 'braccia', copre: 'bicipiti' }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'push_down_corda', serie: 2, rip: 12, superserie: 'braccia', copre: 'tricipiti' }),
    s({ gruppo: 'addome', ruolo: 'AB', classe: 'addome', default: 'crunch_cavo' }),
  ],
};

const DONNA_FULL_B: SessioneContenitore = {
  nome: 'Full B',
  etichetta: 'Tutto il corpo',
  slot: [
    s({ gruppo: 'gambe', ruolo: 'R1', classe: 'cerniera_anca', default: 'stacco_da_terra', copre: 'glutei' }),
    s({ gruppo: 'gambe', ruolo: 'R2', classe: 'hip_thrust', default: 'hip_thrust_macchina', copre: 'glutei' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'femorali_isolamento', default: 'leg_curl', serie: 3, rip: 12, copre: 'femorali' }),
    s({ gruppo: 'spalle', ruolo: 'R3b', classe: 'spinta_verticale', default: 'military_press', guida: 'spalle' }),
    s({ gruppo: 'dorso', ruolo: 'R3', classe: 'trazione_orizzontale', default: 'rematore_manubrio' }),
    s({ gruppo: 'petto', ruolo: 'C', classe: 'spinta_inclinata', default: 'chest_press_inclinata', serie: 3, rip: 12 }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_posteriori', default: 'alzate_posteriori', serie: 2, rip: 12, copre: 'spalle_posteriori' }),
  ],
};

export const CONTENITORI: Contenitore[] = [
  { id: 'u2', N: 2, nome: 'Full A / Full B', descrizione: 'Tutti i gruppi in ogni seduta, esercizi diversi (bi-frequenza).', sessioni: [FULL_A, FULL_B] },
  { id: 'u3', N: 3, nome: '2+1 Split', descrizione: 'Split A (petto, gambe, braccia), Split B (spalle, dorso, stacco), Full C jolly.', sessioni: [SPLIT_A, SPLIT_B, FULL_C], jolly: 2 },
  { id: 'u4', N: 4, nome: 'Bi-Split', descrizione: 'A1 B1 A2 B2: A1/B1 pesanti, A2/B2 più leggere.', sessioni: [SPLIT_A, SPLIT_B, SPLIT_A2, SPLIT_B2] },
  { id: 'u5', N: 5, nome: 'Bi-Split + richiamo', descrizione: 'Bi-Split più una quinta seduta di soli complementari.', sessioni: [SPLIT_A, SPLIT_B, SPLIT_A2, SPLIT_B2, RICHIAMO], avviso: 'Il libro sconsiglia 5 sedute: il recupero diventa critico. [Ipotesi da validare]' },
  { id: 'd2', N: 2, nome: 'Full A / Full B (glutei)', descrizione: 'Tutti i gruppi in ogni seduta, focus glutei.', sessioni: [DONNA_FULL_A, DONNA_FULL_B] },
  { id: 'd3', N: 3, nome: '2+1 Split (glutei)', descrizione: 'Split A (gambe, petto), Split B (glutei, dorso, spalle), Full C jolly.', sessioni: [DONNA_S1, DONNA_S2, DONNA_S3], jolly: 2 },
  { id: 'd4', N: 4, nome: 'Bi-Split (glutei)', descrizione: 'A1 B1 A2 B2 con glutei in tre sedute.', sessioni: [DONNA_S1, DONNA_S2, DONNA_S3, DONNA_S4] },
  { id: 'd5', N: 5, nome: 'Bi-Split + richiamo (glutei)', descrizione: 'Bi-Split più una quinta seduta di soli complementari.', sessioni: [DONNA_S1, DONNA_S2, DONNA_S3, DONNA_S4, RICHIAMO], avviso: 'Il libro sconsiglia 5 sedute: il recupero diventa critico. [Ipotesi da validare]' },
];

export function contenitorePer(N: number, preset: Preset): Contenitore {
  const prefisso = preset === 'donna_glutei' ? 'd' : 'u';
  const c = CONTENITORI.find((x) => x.id === prefisso + N);
  if (!c) throw new Error(`Nessun contenitore per N=${N}, preset=${preset}`);
  return c;
}
