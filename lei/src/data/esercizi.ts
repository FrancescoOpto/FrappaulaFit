import type { CaricoModo, Esercizio, Gruppo } from '../tipi';

// Libreria esercizi di lei: quelli del programma del libro "Glutei" (cap. II) e della parte alta, più alcune
// alternative della stessa classe per le sostituzioni. Nomi generici, nessun video: il link apre una ricerca.

const e = (o: Esercizio): Esercizio => o;

export const ESERCIZI: Esercizio[] = [
  // GLUTEI · accosciata
  e({ id: 'squat', nome: 'Back squat', gruppo: 'glutei', movimento: 'accosciata', classe: 'squat', icona: 'squat', carico_modo: 'bilanciere_totale', fondamentale: true, query_youtube: 'back squat tecnica donna glutei' }),
  e({ id: 'squat_fermo', nome: 'Back squat con fermo 2″', gruppo: 'glutei', movimento: 'accosciata', classe: 'squat', icona: 'squat', carico_modo: 'bilanciere_totale', query_youtube: 'pause squat fermo in buca', nota: 'Due secondi fermi in basso, poi su senza rimbalzo.' }),
  e({ id: 'squat_sumo_deficit', nome: 'Squat sumo deficit con kettlebell o manubrio', gruppo: 'glutei', movimento: 'accosciata', classe: 'squat', icona: 'squat', carico_modo: 'manubrio_singolo', query_youtube: 'squat sumo deficit kettlebell', nota: 'Piedi su due rialzi per scendere più in basso.' }),
  e({ id: 'pressa', nome: 'Pressa 45°', gruppo: 'glutei', movimento: 'accosciata', classe: 'squat', icona: 'pressa', carico_modo: 'macchina', query_youtube: 'pressa 45 glutei piedi alti' }),
  e({ id: 'squat_bulgaro', nome: 'Squat bulgaro con manubri, busto inclinato', gruppo: 'glutei', movimento: 'accosciata', classe: 'squat_unilaterale', icona: 'affondi', carico_modo: 'manubrio_singolo', query_youtube: 'squat bulgaro busto inclinato glutei', nota: 'Busto leggermente in avanti per caricare il gluteo. Ripetizioni per gamba.' }),
  e({ id: 'affondi_camminata', nome: 'Affondi in camminata con manubri', gruppo: 'glutei', movimento: 'accosciata', classe: 'squat_unilaterale', icona: 'affondi', carico_modo: 'manubrio_singolo', query_youtube: 'affondi in camminata manubri', nota: 'Ripetizioni = passi per gamba.' }),
  e({ id: 'affondi_dietro', nome: 'Affondi dietro sul posto con manubri', gruppo: 'glutei', movimento: 'accosciata', classe: 'squat_unilaterale', icona: 'affondi', carico_modo: 'manubrio_singolo', query_youtube: 'affondi indietro manubri glutei', nota: 'Busto leggermente inclinato in avanti. Ripetizioni per gamba.' }),

  // GLUTEI · estensione d'anca
  e({ id: 'stacco', nome: 'Stacco da terra', gruppo: 'glutei', movimento: 'estensione', classe: 'stacco', icona: 'stacco', carico_modo: 'bilanciere_totale', fondamentale: true, query_youtube: 'stacco da terra tecnica donna' }),
  e({ id: 'stacco_rumeno', nome: 'Stacchi rumeni con bilanciere', gruppo: 'glutei', movimento: 'estensione', classe: 'cerniera', icona: 'stacco', carico_modo: 'bilanciere_totale', query_youtube: 'stacco rumeno bilanciere glutei' }),
  e({ id: 'stacco_rumeno_manubri', nome: 'Stacchi rumeni con manubri', gruppo: 'glutei', movimento: 'estensione', classe: 'cerniera', icona: 'stacco', carico_modo: 'manubrio_singolo', query_youtube: 'stacco rumeno manubri' }),
  e({ id: 'back_extension', nome: 'Back extension (schiena arrotondata, piedi extraruotati)', gruppo: 'glutei', movimento: 'estensione', classe: 'cerniera', icona: 'stacco', carico_modo: 'carico_sul_corpo', query_youtube: 'back extension glutei schiena arrotondata', nota: 'Disco al petto se serve carico.' }),

  // GLUTEI · spinta d'anca
  e({ id: 'hip_thrust', nome: 'Hip thrust con bilanciere', gruppo: 'glutei', movimento: 'spinta', classe: 'hip_thrust', icona: 'hip_thrust', carico_modo: 'bilanciere_totale', fondamentale: true, query_youtube: 'hip thrust bilanciere tecnica' }),
  e({ id: 'hip_thrust_banda', nome: 'Hip thrust con bilanciere e banda alle ginocchia', gruppo: 'glutei', movimento: 'spinta', classe: 'hip_thrust', icona: 'hip_thrust', carico_modo: 'bilanciere_totale', query_youtube: 'hip thrust con banda elastica ginocchia' }),
  e({ id: 'hip_thrust_1gamba', nome: 'Hip thrust a una gamba con manubrio, fermo 2″ in alto', gruppo: 'glutei', movimento: 'spinta', classe: 'hip_thrust', icona: 'hip_thrust', carico_modo: 'manubrio_singolo', query_youtube: 'hip thrust una gamba manubrio', nota: 'Ripetizioni per gamba, due secondi fermi in alto.' }),
  e({ id: 'frog_hip_thrust', nome: 'Frog hip thrust con bilanciere', gruppo: 'glutei', movimento: 'spinta', classe: 'hip_thrust', icona: 'hip_thrust', carico_modo: 'bilanciere_totale', query_youtube: 'frog hip thrust', nota: 'Piante dei piedi unite, ginocchia aperte.' }),
  e({ id: 'hip_thrust_macchina', nome: 'Hip thrust alla macchina', gruppo: 'glutei', movimento: 'spinta', classe: 'hip_thrust', icona: 'hip_thrust', carico_modo: 'macchina', query_youtube: 'hip thrust macchina' }),
  e({ id: 'glute_bridge', nome: 'Ponte glutei con bilanciere', gruppo: 'glutei', movimento: 'spinta', classe: 'hip_thrust', icona: 'hip_thrust', carico_modo: 'bilanciere_totale', query_youtube: 'glute bridge bilanciere' }),
  e({ id: 'pull_through', nome: 'Pull through al cavo', gruppo: 'glutei', movimento: 'spinta', classe: 'cerniera', icona: 'stacco', carico_modo: 'cavo', query_youtube: 'pull through cavo glutei', nota: 'Con corda al cavo basso o con una banda elastica.' }),

  // GLUTEI · abduzione
  e({ id: 'clam_shell', nome: 'Clam shell con banda (doppio)', gruppo: 'glutei', movimento: 'abduzione', classe: 'abduzione', icona: 'hip_thrust', carico_modo: 'banda', query_youtube: 'clam shell banda glutei', nota: 'Banda di durezza tale da fare circa 20–25 ripetizioni; in Fase 3 con un disco sul ginocchio (15–20).' }),
  e({ id: 'abduzioni_cavo', nome: 'Abduzioni al cavo basso o con elastico', gruppo: 'glutei', movimento: 'abduzione', classe: 'abduzione', icona: 'hip_thrust', carico_modo: 'cavo', query_youtube: 'abduzione anca cavo basso', nota: 'Ripetizioni per gamba. Con l’elastico, durezza per circa 20–25 ripetizioni.' }),
  e({ id: 'abductor', nome: 'Abductor machine', gruppo: 'glutei', movimento: 'abduzione', classe: 'abduzione', icona: 'hip_thrust', carico_modo: 'macchina', query_youtube: 'abductor machine glutei' }),

  // DORSO
  e({ id: 'lat_larga', nome: 'Lat machine presa larga', gruppo: 'dorso', classe: 'trazione_verticale', icona: 'lat', carico_modo: 'cavo', query_youtube: 'lat machine presa larga' }),
  e({ id: 'lat_inversa', nome: 'Lat machine presa inversa', gruppo: 'dorso', classe: 'trazione_verticale', icona: 'lat', carico_modo: 'cavo', query_youtube: 'lat machine presa inversa' }),
  e({ id: 'lat_media', nome: 'Lat machine presa media', gruppo: 'dorso', classe: 'trazione_verticale', icona: 'lat', carico_modo: 'cavo', query_youtube: 'lat machine presa media' }),
  e({ id: 'trazioni_assistite', nome: 'Trazioni assistite', gruppo: 'dorso', classe: 'trazione_verticale', icona: 'lat', carico_modo: 'macchina', query_youtube: 'trazioni assistite macchina' }),
  e({ id: 'rematore_manubrio', nome: 'Rematore con manubrio', gruppo: 'dorso', classe: 'trazione_orizzontale', icona: 'rematore', carico_modo: 'manubrio_singolo', query_youtube: 'rematore manubrio' }),
  e({ id: 'pulley', nome: 'Pulley basso', gruppo: 'dorso', classe: 'trazione_orizzontale', icona: 'rematore', carico_modo: 'cavo', query_youtube: 'pulley basso' }),
  e({ id: 'rematore_macchina', nome: 'Rematore alla macchina', gruppo: 'dorso', classe: 'trazione_orizzontale', icona: 'rematore', carico_modo: 'macchina', query_youtube: 'rematore macchina' }),

  // PETTO
  e({ id: 'panca_inclinata_manubri', nome: 'Spinte manubri su panca 30°', gruppo: 'petto', classe: 'spinta_inclinata', icona: 'panca', carico_modo: 'manubrio_singolo', query_youtube: 'spinte manubri panca inclinata 30' }),
  e({ id: 'chest_press_inclinata', nome: 'Chest press inclinata', gruppo: 'petto', classe: 'spinta_inclinata', icona: 'panca', carico_modo: 'macchina', query_youtube: 'chest press inclinata' }),
  e({ id: 'chest_press', nome: 'Chest press', gruppo: 'petto', classe: 'spinta_orizzontale', icona: 'panca', carico_modo: 'macchina', query_youtube: 'chest press macchina' }),
  e({ id: 'panca_manubri', nome: 'Spinte manubri su panca piana', gruppo: 'petto', classe: 'spinta_orizzontale', icona: 'panca', carico_modo: 'manubrio_singolo', query_youtube: 'panca piana manubri' }),

  // SPALLE
  e({ id: 'spinte_manubri_seduto', nome: 'Spinte in alto con manubri da seduta', gruppo: 'spalle', classe: 'spinta_verticale', icona: 'military', carico_modo: 'manubrio_singolo', query_youtube: 'spinte manubri seduto spalle' }),
  e({ id: 'shoulder_press_macchina', nome: 'Shoulder press alla macchina', gruppo: 'spalle', classe: 'spinta_verticale', icona: 'military', carico_modo: 'macchina', query_youtube: 'shoulder press macchina' }),
  e({ id: 'alzate_laterali', nome: 'Alzate laterali con manubri', gruppo: 'spalle', classe: 'spalle_laterali', icona: 'alzate_laterali', carico_modo: 'manubrio_singolo', query_youtube: 'alzate laterali manubri' }),
  e({ id: 'alzate_laterali_cavo', nome: 'Alzate laterali al cavo', gruppo: 'spalle', classe: 'spalle_laterali', icona: 'alzate_laterali', carico_modo: 'cavo', query_youtube: 'alzate laterali cavo' }),
  e({ id: 'face_pull', nome: 'Face pull', gruppo: 'spalle', classe: 'spalle_posteriori', icona: 'alzate_posteriori', carico_modo: 'cavo', query_youtube: 'face pull cavo' }),
  e({ id: 'reverse_fly', nome: 'Reverse fly alla macchina', gruppo: 'spalle', classe: 'spalle_posteriori', icona: 'alzate_posteriori', carico_modo: 'macchina', query_youtube: 'reverse fly macchina' }),

  // BRACCIA
  e({ id: 'curl_manubri', nome: 'Curl con manubri', gruppo: 'bicipiti', classe: 'bicipiti', icona: 'curl', carico_modo: 'manubrio_singolo', query_youtube: 'curl manubri' }),
  e({ id: 'curl_cavo', nome: 'Curl al cavo basso', gruppo: 'bicipiti', classe: 'bicipiti', icona: 'curl', carico_modo: 'cavo', query_youtube: 'curl cavo basso' }),
  e({ id: 'push_down_corda', nome: 'Push down con corda', gruppo: 'tricipiti', classe: 'tricipiti', icona: 'tricipiti', carico_modo: 'cavo', query_youtube: 'push down corda tricipiti' }),
  e({ id: 'push_down_barra', nome: 'Push down con barra', gruppo: 'tricipiti', classe: 'tricipiti', icona: 'tricipiti', carico_modo: 'cavo', query_youtube: 'push down barra' }),

  // ADDOME
  e({ id: 'crunch_cavo', nome: 'Crunch al cavo alto', gruppo: 'addome', classe: 'addome', icona: 'addome', carico_modo: 'cavo', query_youtube: 'crunch cavo alto' }),
  e({ id: 'crunch_inverso', nome: 'Crunch inverso', gruppo: 'addome', classe: 'addome', icona: 'addome', carico_modo: 'corpo_libero', query_youtube: 'crunch inverso' }),
  e({ id: 'plank', nome: 'Plank', gruppo: 'addome', classe: 'addome', icona: 'addome', carico_modo: 'corpo_libero', secondi: true, query_youtube: 'plank tecnica' }),
  e({ id: 'leg_raise', nome: 'Sollevamento gambe', gruppo: 'addome', classe: 'addome', icona: 'addome', carico_modo: 'corpo_libero', query_youtube: 'sollevamento gambe panca' }),
];

export const ESERCIZI_PER_ID: Record<string, Esercizio> = Object.fromEntries(ESERCIZI.map((x) => [x.id, x]));

export function esercizio(id: string): Esercizio | undefined {
  return ESERCIZI_PER_ID[id];
}

/** Alternative della stessa classe (sostituzioni), escluse quelle già in seduta. */
export function alternative(id: string, usati: string[] = []): Esercizio[] {
  const base = ESERCIZI_PER_ID[id];
  if (!base) return [];
  return ESERCIZI.filter((x) => x.id !== id && x.classe === base.classe && !usati.includes(x.id));
}

/** L'esercizio si carica con i kg? (banda e corpo libero no). */
export function haCarico(id: string): boolean {
  const m = ESERCIZI_PER_ID[id]?.carico_modo;
  return m !== undefined && m !== 'banda' && m !== 'corpo_libero';
}

export const NOMI_GRUPPI: Record<Gruppo, string> = {
  glutei: 'Glutei',
  dorso: 'Dorso',
  petto: 'Petto',
  spalle: 'Spalle',
  bicipiti: 'Bicipiti',
  tricipiti: 'Tricipiti',
  addome: 'Addome',
};

export const NOMI_MOVIMENTI = { accosciata: 'Accosciata', estensione: 'Estensione d’anca', spinta: 'Spinta d’anca', abduzione: 'Abduzione d’anca' } as const;

/** Istruzione di carico per il test (TEST_INIZIO_BLOCCO §4). */
export const CARICO_MODO: Record<CaricoModo, { breve: string; testo: string }> = {
  bilanciere_totale: { breve: 'bilanciere + dischi', testo: 'Scrivi il peso totale: bilanciere più dischi.' },
  manubrio_singolo: { breve: 'un manubrio', testo: 'Scrivi il peso di un solo manubrio.' },
  macchina: { breve: 'pacco pesi', testo: 'Scrivi il peso indicato sulla macchina.' },
  cavo: { breve: 'pacco pesi', testo: 'Scrivi il peso indicato sul pacco del cavo.' },
  carico_sul_corpo: { breve: 'carico aggiunto', testo: 'Scrivi solo il carico aggiunto (0 se a corpo libero).' },
  corpo_libero: { breve: 'corpo libero', testo: 'A corpo libero: niente carico da scrivere.' },
  banda: { breve: 'elastico', testo: 'Con l’elastico: niente kg, scegli la durezza giusta.' },
};

/** Passo di carico della progressione doppia, secondo l'attrezzo. */
export function passoCarico(id: string): number {
  const m = ESERCIZI_PER_ID[id]?.carico_modo;
  if (m === 'manubrio_singolo') return 1;
  if (m === 'macchina' || m === 'cavo') return 2.5;
  return 2.5;
}
