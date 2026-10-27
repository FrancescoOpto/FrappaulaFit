import type { Esercizio } from '../tipi';

// Libreria esercizi (SPEC §5). Nomi generici; nessun video.
// ripetizioni_test: 10 per multiarticolari con bilanciere/manubri, 12 per macchine/isolamento/unilaterali/cavi.
export const ESERCIZI: Esercizio[] = [
  // PETTO
  { id: 'panca_piana', nome: 'Panca piana bilanciere', gruppo: 'petto', classe: 'spinta_orizzontale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, fondamentale: true, query_youtube: 'panca piana bilanciere tecnica' },
  { id: 'panca_multipower', nome: 'Panca piana al multipower', gruppo: 'petto', classe: 'spinta_orizzontale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, query_youtube: 'panca piana multipower' },
  { id: 'panca_manubri', nome: 'Panca piana manubri', gruppo: 'petto', classe: 'spinta_orizzontale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, query_youtube: 'panca piana manubri' },
  { id: 'chest_press', nome: 'Chest press', gruppo: 'petto', classe: 'spinta_orizzontale', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, query_youtube: 'chest press macchina' },
  { id: 'panca_inclinata_manubri', nome: 'Panca inclinata manubri', gruppo: 'petto', classe: 'spinta_inclinata', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, query_youtube: 'panca inclinata manubri' },
  { id: 'panca_inclinata_bilanciere', nome: 'Panca inclinata bilanciere', gruppo: 'petto', classe: 'spinta_inclinata', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, query_youtube: 'panca inclinata bilanciere' },
  { id: 'chest_press_inclinata', nome: 'Chest press inclinata', gruppo: 'petto', classe: 'spinta_inclinata', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, query_youtube: 'chest press inclinata' },
  { id: 'croci_manubri', nome: 'Croci con manubri', gruppo: 'petto', classe: 'petto_isolamento', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'croci manubri panca' },
  { id: 'croci_cavi', nome: 'Croci ai cavi', gruppo: 'petto', classe: 'petto_isolamento', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'croci ai cavi' },
  { id: 'pec_deck', nome: 'Pec deck', gruppo: 'petto', classe: 'petto_isolamento', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'pec deck' },

  // DORSO (nessun fondamentale: il primo multiarticolare è R2)
  { id: 'lat_machine', nome: 'Lat machine presa media', gruppo: 'dorso', classe: 'trazione_verticale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, query_youtube: 'lat machine presa media' },
  { id: 'trazioni_assistite', nome: 'Trazioni (assistite o zavorrate)', gruppo: 'dorso', classe: 'trazione_verticale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, query_youtube: 'trazioni alla sbarra' },
  { id: 'lat_triangolo', nome: 'Lat machine triangolo', gruppo: 'dorso', classe: 'trazione_verticale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, query_youtube: 'lat machine triangolo' },
  { id: 'lat_unilaterale', nome: 'Lat machine unilaterale', gruppo: 'dorso', classe: 'trazione_verticale', tipo: 'multi', unilaterale: true, ripetizioni_test: 12, query_youtube: 'lat machine unilaterale' },
  { id: 'rematore_manubrio', nome: 'Rematore con manubrio', gruppo: 'dorso', classe: 'trazione_orizzontale', tipo: 'multi', unilaterale: true, ripetizioni_test: 12, query_youtube: 'rematore manubrio' },
  { id: 'rematore_bilanciere', nome: 'Rematore con bilanciere', gruppo: 'dorso', classe: 'trazione_orizzontale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, query_youtube: 'rematore bilanciere' },
  { id: 't_bar', nome: 'Rematore T-bar', gruppo: 'dorso', classe: 'trazione_orizzontale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, query_youtube: 'rematore t-bar' },
  { id: 'pulley', nome: 'Pulley basso', gruppo: 'dorso', classe: 'trazione_orizzontale', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, query_youtube: 'pulley basso' },
  { id: 'rematore_macchina', nome: 'Rematore alla macchina', gruppo: 'dorso', classe: 'trazione_orizzontale', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, query_youtube: 'rematore macchina' },

  // SPALLE
  { id: 'military_press', nome: 'Military press', gruppo: 'spalle', classe: 'spinta_verticale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, fondamentale: true, query_youtube: 'military press bilanciere' },
  { id: 'shoulder_press_macchina', nome: 'Shoulder press macchina', gruppo: 'spalle', classe: 'spinta_verticale', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, query_youtube: 'shoulder press macchina' },
  { id: 'spinte_manubri_seduto', nome: 'Spinte in alto con manubri', gruppo: 'spalle', classe: 'spinta_verticale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, query_youtube: 'spinte in alto manubri seduto' },
  { id: 'alzate_laterali', nome: 'Alzate laterali manubri', gruppo: 'spalle', sottogruppo: 'spalle_laterali', classe: 'spalle_laterali', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'alzate laterali manubri' },
  { id: 'alzate_laterali_cavo', nome: 'Alzate laterali al cavo', gruppo: 'spalle', sottogruppo: 'spalle_laterali', classe: 'spalle_laterali', tipo: 'isolamento', unilaterale: true, ripetizioni_test: 12, query_youtube: 'alzate laterali cavo' },
  { id: 'alzate_laterali_macchina', nome: 'Alzate laterali macchina', gruppo: 'spalle', sottogruppo: 'spalle_laterali', classe: 'spalle_laterali', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'alzate laterali macchina' },
  { id: 'alzate_posteriori', nome: 'Alzate posteriori 90°', gruppo: 'spalle', sottogruppo: 'spalle_posteriori', classe: 'spalle_posteriori', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'alzate posteriori manubri' },
  { id: 'reverse_fly', nome: 'Reverse fly macchina', gruppo: 'spalle', sottogruppo: 'spalle_posteriori', classe: 'spalle_posteriori', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'reverse fly macchina' },
  { id: 'face_pull', nome: 'Face pull', gruppo: 'spalle', sottogruppo: 'spalle_posteriori', classe: 'spalle_posteriori', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'face pull cavo' },

  // GAMBE
  { id: 'squat', nome: 'Squat con bilanciere', gruppo: 'gambe', sottogruppo: 'quadricipiti', classe: 'squat', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, fondamentale: true, query_youtube: 'squat bilanciere tecnica' },
  { id: 'hack_squat', nome: 'Hack squat', gruppo: 'gambe', sottogruppo: 'quadricipiti', classe: 'squat', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, query_youtube: 'hack squat' },
  { id: 'pressa', nome: 'Pressa 45°', gruppo: 'gambe', sottogruppo: 'quadricipiti', classe: 'squat', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, query_youtube: 'leg press 45' },
  { id: 'affondi', nome: 'Affondi con manubri', gruppo: 'gambe', sottogruppo: 'quadricipiti', classe: 'squat', tipo: 'multi', unilaterale: true, ripetizioni_test: 12, query_youtube: 'affondi manubri' },
  { id: 'leg_extension', nome: 'Leg extension', gruppo: 'gambe', sottogruppo: 'quadricipiti', classe: 'quadricipiti_isolamento', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'leg extension' },
  { id: 'leg_extension_unilaterale', nome: 'Leg extension unilaterale', gruppo: 'gambe', sottogruppo: 'quadricipiti', classe: 'quadricipiti_isolamento', tipo: 'isolamento', unilaterale: true, ripetizioni_test: 12, query_youtube: 'leg extension una gamba' },
  { id: 'sissy_squat', nome: 'Sissy squat', gruppo: 'gambe', sottogruppo: 'quadricipiti', classe: 'quadricipiti_isolamento', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'sissy squat' },
  { id: 'leg_curl', nome: 'Leg curl', gruppo: 'gambe', sottogruppo: 'femorali', classe: 'femorali_isolamento', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'leg curl' },
  { id: 'leg_curl_seduto', nome: 'Leg curl seduto', gruppo: 'gambe', sottogruppo: 'femorali', classe: 'femorali_isolamento', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'leg curl seduto' },
  { id: 'stacco_da_terra', nome: 'Stacco da terra', gruppo: 'gambe', sottogruppo: 'glutei', classe: 'cerniera_anca', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, fondamentale: true, query_youtube: 'stacco da terra tecnica' },
  { id: 'stacco_rumeno', nome: 'Stacco rumeno', gruppo: 'gambe', sottogruppo: 'glutei', classe: 'cerniera_anca', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, query_youtube: 'stacco rumeno bilanciere' },
  { id: 'good_morning', nome: 'Good morning', gruppo: 'gambe', sottogruppo: 'glutei', classe: 'cerniera_anca', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, query_youtube: 'good morning bilanciere' },
  { id: 'hip_thrust', nome: 'Hip thrust', gruppo: 'gambe', sottogruppo: 'glutei', classe: 'hip_thrust', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, fondamentale: true, query_youtube: 'hip thrust bilanciere' },
  { id: 'hip_thrust_macchina', nome: 'Hip thrust macchina', gruppo: 'gambe', sottogruppo: 'glutei', classe: 'hip_thrust', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, query_youtube: 'hip thrust macchina' },
  { id: 'glute_bridge', nome: 'Glute bridge', gruppo: 'gambe', sottogruppo: 'glutei', classe: 'hip_thrust', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, query_youtube: 'glute bridge' },
  { id: 'abductor', nome: 'Abductor machine', gruppo: 'gambe', sottogruppo: 'glutei', classe: 'hip_thrust', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'abductor machine' },

  // BICIPITI
  { id: 'curl_ez', nome: 'Curl con bilanciere EZ', gruppo: 'bicipiti', sottogruppo: 'bicipiti', classe: 'bicipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 10, query_youtube: 'curl bilanciere ez' },
  { id: 'curl_manubri', nome: 'Curl con manubri in piedi', gruppo: 'bicipiti', sottogruppo: 'bicipiti', classe: 'bicipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'curl manubri in piedi' },
  { id: 'curl_panca_inclinata', nome: 'Curl su panca inclinata', gruppo: 'bicipiti', sottogruppo: 'bicipiti', classe: 'bicipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'curl panca inclinata manubri' },
  { id: 'curl_hammer', nome: 'Curl a martello', gruppo: 'bicipiti', sottogruppo: 'bicipiti', classe: 'bicipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'curl a martello' },
  { id: 'curl_cavo', nome: 'Curl al cavo basso', gruppo: 'bicipiti', sottogruppo: 'bicipiti', classe: 'bicipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'curl cavo basso' },

  // TRICIPITI
  { id: 'french_ez', nome: 'French press EZ', gruppo: 'tricipiti', sottogruppo: 'tricipiti', classe: 'tricipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 10, query_youtube: 'french press bilanciere ez' },
  { id: 'french_manubri', nome: 'French press manubri', gruppo: 'tricipiti', sottogruppo: 'tricipiti', classe: 'tricipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'french press manubri' },
  { id: 'push_down_corda', nome: 'Push down con corda', gruppo: 'tricipiti', sottogruppo: 'tricipiti', classe: 'tricipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'push down corda' },
  { id: 'push_down_barra', nome: 'Push down con barra', gruppo: 'tricipiti', sottogruppo: 'tricipiti', classe: 'tricipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'push down barra' },
  { id: 'dip_macchina', nome: 'Dip alla macchina', gruppo: 'tricipiti', sottogruppo: 'tricipiti', classe: 'tricipiti', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, query_youtube: 'dip macchina tricipiti' },

  // ADDOME
  { id: 'crunch_cavo', nome: 'Crunch al cavo alto', gruppo: 'addome', classe: 'addome', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'crunch cavo alto' },
  { id: 'crunch_macchina', nome: 'Crunch alla macchina', gruppo: 'addome', classe: 'addome', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'crunch macchina' },
  { id: 'leg_raise', nome: 'Sollevamento gambe', gruppo: 'addome', classe: 'addome', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'leg raise addominali' },
  { id: 'plank', nome: 'Plank', gruppo: 'addome', classe: 'addome', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, query_youtube: 'plank tecnica' },
];

export const ESERCIZI_PER_ID: Record<string, Esercizio> = Object.fromEntries(ESERCIZI.map((e) => [e.id, e]));

export function esercizio(id: string, personalizzati: Esercizio[] = []): Esercizio | undefined {
  return ESERCIZI_PER_ID[id] ?? personalizzati.find((e) => e.id === id);
}

export const NOMI_GRUPPI: Record<string, string> = {
  petto: 'Petto',
  dorso: 'Dorso',
  spalle: 'Spalle',
  gambe: 'Gambe',
  bicipiti: 'Bicipiti',
  tricipiti: 'Tricipiti',
  addome: 'Addome',
};

export const NOMI_SOTTOGRUPPI: Record<string, string> = {
  quadricipiti: 'Quadricipiti',
  femorali: 'Femorali',
  glutei: 'Glutei / cerniera',
  spalle_laterali: 'Spalle laterali',
  spalle_posteriori: 'Spalle posteriori',
  bicipiti: 'Bicipiti',
  tricipiti: 'Tricipiti',
};

export const NOMI_RUOLI: Record<string, string> = {
  R1: 'Fondamentale',
  R2: 'Target',
  R3: 'Target',
  L: 'Fondamentale leggero',
  C: 'Complementare',
  AB: 'Addome',
};

export function linkYoutube(e: Esercizio): string {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(e.query_youtube);
}
