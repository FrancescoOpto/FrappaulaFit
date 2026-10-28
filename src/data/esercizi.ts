import type { CaricoModo, Esercizio, Gruppo } from '../tipi';

// Libreria esercizi (SPEC §5, TEST_INIZIO_BLOCCO §2 e §4). Nomi generici; nessun video.
// fondamentale = solo i permanenti (panca, squat, stacco, hip thrust): test di stima + scala RM.
// ripetizioni_test è un valore di riserva: nel test vero N = rip di lavoro Fase 1 + 2 (dallo slot).
// carico_modo = istruzione di carico mostrata nel test (TEST_INIZIO_BLOCCO §4).
const e = (o: Esercizio): Esercizio => o;

export const ESERCIZI: Esercizio[] = [
  // PETTO
  e({ id: 'panca_piana', nome: 'Panca piana bilanciere', gruppo: 'petto', classe: 'spinta_orizzontale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, fondamentale: true, carico_modo: 'bilanciere_totale', query_youtube: 'panca piana bilanciere tecnica' }),
  e({ id: 'panca_multipower', nome: 'Panca piana al multipower', gruppo: 'petto', classe: 'spinta_orizzontale', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', esclude_bilanciere: true, query_youtube: 'panca piana multipower' }),
  e({ id: 'panca_manubri', nome: 'Panca piana manubri', gruppo: 'petto', classe: 'spinta_orizzontale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, carico_modo: 'manubrio_singolo', query_youtube: 'panca piana manubri' }),
  e({ id: 'chest_press', nome: 'Chest press', gruppo: 'petto', classe: 'spinta_orizzontale', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', query_youtube: 'chest press macchina' }),
  e({ id: 'panca_inclinata_manubri', nome: 'Panca inclinata manubri', gruppo: 'petto', classe: 'spinta_inclinata', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, carico_modo: 'manubrio_singolo', query_youtube: 'panca inclinata manubri' }),
  e({ id: 'panca_inclinata_bilanciere', nome: 'Panca inclinata bilanciere', gruppo: 'petto', classe: 'spinta_inclinata', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, carico_modo: 'bilanciere_totale', query_youtube: 'panca inclinata bilanciere' }),
  e({ id: 'chest_press_inclinata', nome: 'Chest press inclinata', gruppo: 'petto', classe: 'spinta_inclinata', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', query_youtube: 'chest press inclinata' }),
  e({ id: 'croci_manubri', nome: 'Croci con manubri', gruppo: 'petto', classe: 'petto_isolamento', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'manubrio_singolo', query_youtube: 'croci manubri panca' }),
  e({ id: 'croci_cavi_bassi', nome: 'Croci ai cavi bassi', gruppo: 'petto', classe: 'petto_isolamento', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'cavo', query_youtube: 'croci cavi bassi' }),
  e({ id: 'croci_cavi', nome: 'Croci ai cavi', gruppo: 'petto', classe: 'petto_isolamento', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'cavo', query_youtube: 'croci ai cavi' }),
  e({ id: 'croci_cavi_alti', nome: 'Croci ai cavi alti', gruppo: 'petto', classe: 'petto_isolamento', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'cavo', query_youtube: 'croci cavi alti' }),
  e({ id: 'croci_cavi_seduto', nome: 'Croci ai cavi da seduto', gruppo: 'petto', classe: 'petto_isolamento', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'cavo', query_youtube: 'croci cavi seduto altezza petto' }),
  e({ id: 'panca_30_multipower', nome: 'Panca 30° al multipower', gruppo: 'petto', classe: 'spinta_inclinata', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', esclude_bilanciere: true, query_youtube: 'panca inclinata 30 multipower' }),
  e({ id: 'panca_45_multipower', nome: 'Panca 45° al multipower', gruppo: 'petto', classe: 'spinta_inclinata', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', esclude_bilanciere: true, query_youtube: 'panca inclinata 45 multipower' }),
  e({ id: 'pec_deck', nome: 'Pec deck', gruppo: 'petto', classe: 'petto_isolamento', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', query_youtube: 'pec deck' }),

  // DORSO (nessun fondamentale: il primo multiarticolare è R2)
  e({ id: 'lat_machine', nome: 'Lat machine presa media', gruppo: 'dorso', classe: 'trazione_verticale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, carico_modo: 'cavo', query_youtube: 'lat machine presa media' }),
  e({ id: 'trazioni_assistite', nome: 'Trazioni (assistite o zavorrate)', gruppo: 'dorso', classe: 'trazione_verticale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, carico_modo: 'carico_sul_corpo', query_youtube: 'trazioni alla sbarra' }),
  e({ id: 'lat_triangolo', nome: 'Lat machine triangolo', gruppo: 'dorso', classe: 'trazione_verticale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, carico_modo: 'cavo', query_youtube: 'lat machine triangolo' }),
  e({ id: 'lat_larga', nome: 'Lat machine presa larga', gruppo: 'dorso', classe: 'trazione_verticale', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, carico_modo: 'cavo', query_youtube: 'lat machine presa larga' }),
  e({ id: 'lat_unilaterale', nome: 'Lat machine unilaterale', gruppo: 'dorso', classe: 'trazione_verticale', tipo: 'multi', unilaterale: true, ripetizioni_test: 12, carico_modo: 'cavo', query_youtube: 'lat machine unilaterale' }),
  e({ id: 'rematore_manubrio', nome: 'Rematore con manubrio', gruppo: 'dorso', classe: 'trazione_orizzontale', tipo: 'multi', unilaterale: true, ripetizioni_test: 10, carico_modo: 'manubrio_singolo', query_youtube: 'rematore manubrio' }),
  e({ id: 'rematore_bilanciere', nome: 'Rematore con bilanciere', gruppo: 'dorso', classe: 'trazione_orizzontale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, carico_modo: 'bilanciere_totale', query_youtube: 'rematore bilanciere' }),
  e({ id: 'rematore_multipower', nome: 'Rematore al multipower', gruppo: 'dorso', classe: 'trazione_orizzontale', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', esclude_bilanciere: true, query_youtube: 'rematore multipower' }),
  e({ id: 't_bar', nome: 'Rematore T-bar', gruppo: 'dorso', classe: 'trazione_orizzontale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, carico_modo: 'solo_dischi', query_youtube: 'rematore t-bar' }),
  e({ id: 'pulley', nome: 'Pulley basso', gruppo: 'dorso', classe: 'trazione_orizzontale', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, carico_modo: 'cavo', query_youtube: 'pulley basso' }),
  e({ id: 'rematore_macchina', nome: 'Rematore alla macchina', gruppo: 'dorso', classe: 'trazione_orizzontale', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', query_youtube: 'rematore macchina' }),

  // SPALLE (nessun fondamentale permanente: l'esercizio guida ruota per blocco, vedi ROTAZIONE_GUIDA)
  e({ id: 'military_press', nome: 'Military press', gruppo: 'spalle', classe: 'spinta_verticale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, carico_modo: 'bilanciere_totale', query_youtube: 'military press bilanciere' }),
  e({ id: 'spinte_manubri_seduto', nome: 'Spinte in alto manubri seduto', gruppo: 'spalle', classe: 'spinta_verticale', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, carico_modo: 'manubrio_singolo', query_youtube: 'spinte in alto manubri seduto' }),
  e({ id: 'military_multipower', nome: 'Lento avanti al multipower', gruppo: 'spalle', classe: 'spinta_verticale', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', esclude_bilanciere: true, query_youtube: 'lento avanti multipower' }),
  e({ id: 'shoulder_press_macchina', nome: 'Shoulder press macchina', gruppo: 'spalle', classe: 'spinta_verticale', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', query_youtube: 'shoulder press macchina' }),
  e({ id: 'alzate_laterali', nome: 'Alzate laterali manubri', gruppo: 'spalle', sottogruppo: 'spalle_laterali', classe: 'spalle_laterali', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'manubrio_singolo', query_youtube: 'alzate laterali manubri' }),
  e({ id: 'alzate_laterali_cavo', nome: 'Alzate laterali al cavo', gruppo: 'spalle', sottogruppo: 'spalle_laterali', classe: 'spalle_laterali', tipo: 'isolamento', unilaterale: true, ripetizioni_test: 12, carico_modo: 'cavo', query_youtube: 'alzate laterali cavo' }),
  e({ id: 'alzate_laterali_panca', nome: 'Alzate laterali su panca 30°', gruppo: 'spalle', sottogruppo: 'spalle_laterali', classe: 'spalle_laterali', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'manubrio_singolo', query_youtube: 'alzate laterali panca inclinata' }),
  e({ id: 'alzate_laterali_seduto', nome: 'Alzate laterali manubri seduto', gruppo: 'spalle', sottogruppo: 'spalle_laterali', classe: 'spalle_laterali', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 14, carico_modo: 'manubrio_singolo', query_youtube: 'alzate laterali seduto' }),
  e({ id: 'alzate_laterali_cavo_medio', nome: 'Alzate laterali al cavo medio', gruppo: 'spalle', sottogruppo: 'spalle_laterali', classe: 'spalle_laterali', tipo: 'isolamento', unilaterale: true, ripetizioni_test: 14, carico_modo: 'cavo', query_youtube: 'alzate laterali cavo medio' }),
  e({ id: 'alzate_laterali_macchina', nome: 'Alzate laterali macchina', gruppo: 'spalle', sottogruppo: 'spalle_laterali', classe: 'spalle_laterali', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', query_youtube: 'alzate laterali macchina' }),
  e({ id: 'alzate_laterali_inclinato', nome: 'Alzate laterali busto inclinato', gruppo: 'spalle', sottogruppo: 'spalle_posteriori', classe: 'spalle_posteriori', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 14, carico_modo: 'manubrio_singolo', query_youtube: 'alzate laterali busto inclinato' }),
  e({ id: 'alzate_posteriori', nome: 'Alzate posteriori 90°', gruppo: 'spalle', sottogruppo: 'spalle_posteriori', classe: 'spalle_posteriori', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'manubrio_singolo', query_youtube: 'alzate posteriori manubri' }),
  e({ id: 'alzate_posteriori_cavo', nome: 'Alzate posteriori al cavo basso', gruppo: 'spalle', sottogruppo: 'spalle_posteriori', classe: 'spalle_posteriori', tipo: 'isolamento', unilaterale: true, ripetizioni_test: 12, carico_modo: 'cavo', query_youtube: 'alzate posteriori cavo basso' }),
  e({ id: 'alzate_posteriori_seduto', nome: 'Alzate posteriori manubri seduto', gruppo: 'spalle', sottogruppo: 'spalle_posteriori', classe: 'spalle_posteriori', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'manubrio_singolo', query_youtube: 'alzate posteriori seduto' }),
  e({ id: 'reverse_fly', nome: 'Reverse fly macchina', gruppo: 'spalle', sottogruppo: 'spalle_posteriori', classe: 'spalle_posteriori', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', query_youtube: 'reverse fly macchina' }),
  e({ id: 'face_pull', nome: 'Face pull', gruppo: 'spalle', sottogruppo: 'spalle_posteriori', classe: 'spalle_posteriori', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'cavo', query_youtube: 'face pull cavo' }),

  // GAMBE
  e({ id: 'squat', nome: 'Squat con bilanciere', gruppo: 'gambe', sottogruppo: 'quadricipiti', classe: 'squat', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, fondamentale: true, carico_modo: 'bilanciere_totale', query_youtube: 'squat bilanciere tecnica' }),
  e({ id: 'squat_multipower', nome: 'Squat al multipower', gruppo: 'gambe', sottogruppo: 'quadricipiti', classe: 'squat', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', esclude_bilanciere: true, query_youtube: 'squat multipower' }),
  e({ id: 'hack_squat', nome: 'Hack squat', gruppo: 'gambe', sottogruppo: 'quadricipiti', classe: 'squat', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', query_youtube: 'hack squat' }),
  e({ id: 'pressa', nome: 'Pressa 45°', gruppo: 'gambe', sottogruppo: 'quadricipiti', classe: 'squat', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, carico_modo: 'macchina', query_youtube: 'leg press 45' }),
  e({ id: 'affondi', nome: 'Affondi con manubri', gruppo: 'gambe', sottogruppo: 'quadricipiti', classe: 'squat', tipo: 'multi', unilaterale: true, ripetizioni_test: 12, carico_modo: 'manubrio_singolo', query_youtube: 'affondi manubri' }),
  e({ id: 'affondi_multipower', nome: 'Affondi al multipower', gruppo: 'gambe', sottogruppo: 'quadricipiti', classe: 'squat', tipo: 'multi', unilaterale: true, ripetizioni_test: 10, carico_modo: 'macchina', esclude_bilanciere: true, query_youtube: 'affondi multipower' }),
  e({ id: 'leg_extension', nome: 'Leg extension', gruppo: 'gambe', sottogruppo: 'quadricipiti', classe: 'quadricipiti_isolamento', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', query_youtube: 'leg extension' }),
  e({ id: 'leg_extension_unilaterale', nome: 'Leg extension unilaterale', gruppo: 'gambe', sottogruppo: 'quadricipiti', classe: 'quadricipiti_isolamento', tipo: 'isolamento', unilaterale: true, ripetizioni_test: 12, carico_modo: 'macchina', query_youtube: 'leg extension una gamba' }),
  e({ id: 'sissy_squat', nome: 'Sissy squat', gruppo: 'gambe', sottogruppo: 'quadricipiti', classe: 'quadricipiti_isolamento', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'corpo_libero', query_youtube: 'sissy squat' }),
  e({ id: 'leg_curl', nome: 'Leg curl', gruppo: 'gambe', sottogruppo: 'femorali', classe: 'femorali_isolamento', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', query_youtube: 'leg curl' }),
  e({ id: 'leg_curl_seduto', nome: 'Leg curl seduto', gruppo: 'gambe', sottogruppo: 'femorali', classe: 'femorali_isolamento', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', query_youtube: 'leg curl seduto' }),
  e({ id: 'stacco_da_terra', nome: 'Stacco da terra', gruppo: 'gambe', sottogruppo: 'glutei', classe: 'cerniera_anca', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, fondamentale: true, carico_modo: 'bilanciere_totale', query_youtube: 'stacco da terra tecnica' }),
  e({ id: 'stacco_rumeno', nome: 'Stacco rumeno', gruppo: 'gambe', sottogruppo: 'glutei', classe: 'cerniera_anca', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, carico_modo: 'bilanciere_totale', query_youtube: 'stacco rumeno bilanciere' }),
  e({ id: 'good_morning', nome: 'Good morning', gruppo: 'gambe', sottogruppo: 'glutei', classe: 'cerniera_anca', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, carico_modo: 'bilanciere_totale', query_youtube: 'good morning bilanciere' }),
  e({ id: 'hip_thrust', nome: 'Hip thrust', gruppo: 'gambe', sottogruppo: 'glutei', classe: 'hip_thrust', tipo: 'multi', unilaterale: false, ripetizioni_test: 10, fondamentale: true, carico_modo: 'bilanciere_totale', query_youtube: 'hip thrust bilanciere' }),
  e({ id: 'hip_thrust_macchina', nome: 'Hip thrust macchina', gruppo: 'gambe', sottogruppo: 'glutei', classe: 'hip_thrust', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', query_youtube: 'hip thrust macchina' }),
  e({ id: 'glute_bridge', nome: 'Glute bridge', gruppo: 'gambe', sottogruppo: 'glutei', classe: 'hip_thrust', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, carico_modo: 'bilanciere_totale', query_youtube: 'glute bridge' }),
  e({ id: 'abductor', nome: 'Abductor machine', gruppo: 'gambe', sottogruppo: 'glutei', classe: 'hip_thrust', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 14, carico_modo: 'macchina', query_youtube: 'abductor machine' }),

  // BICIPITI
  e({ id: 'curl_ez', nome: 'Curl con bilanciere EZ', gruppo: 'bicipiti', sottogruppo: 'bicipiti', classe: 'bicipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 10, carico_modo: 'solo_dischi', query_youtube: 'curl bilanciere ez' }),
  e({ id: 'curl_manubri', nome: 'Curl con manubri in piedi', gruppo: 'bicipiti', sottogruppo: 'bicipiti', classe: 'bicipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'manubrio_singolo', query_youtube: 'curl manubri in piedi' }),
  e({ id: 'curl_panca_inclinata', nome: 'Curl su panca inclinata', gruppo: 'bicipiti', sottogruppo: 'bicipiti', classe: 'bicipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'manubrio_singolo', query_youtube: 'curl panca inclinata manubri' }),
  e({ id: 'curl_seduto', nome: 'Curl manubri da seduto', gruppo: 'bicipiti', sottogruppo: 'bicipiti', classe: 'bicipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 14, carico_modo: 'manubrio_singolo', query_youtube: 'curl manubri seduto' }),
  e({ id: 'curl_manubri_60', nome: 'Curl manubri su panca 60°', gruppo: 'bicipiti', sottogruppo: 'bicipiti', classe: 'bicipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'manubrio_singolo', query_youtube: 'curl manubri panca 60' }),
  e({ id: 'curl_hammer_seduto', nome: 'Curl a martello da seduto', gruppo: 'bicipiti', sottogruppo: 'bicipiti', classe: 'bicipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'manubrio_singolo', query_youtube: 'curl martello seduto' }),
  e({ id: 'curl_hammer', nome: 'Curl a martello', gruppo: 'bicipiti', sottogruppo: 'bicipiti', classe: 'bicipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'manubrio_singolo', query_youtube: 'curl a martello' }),
  e({ id: 'curl_cavo', nome: 'Curl al cavo basso', gruppo: 'bicipiti', sottogruppo: 'bicipiti', classe: 'bicipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'cavo', query_youtube: 'curl cavo basso' }),

  // TRICIPITI
  e({ id: 'french_ez', nome: 'French press EZ', gruppo: 'tricipiti', sottogruppo: 'tricipiti', classe: 'tricipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 10, carico_modo: 'solo_dischi', query_youtube: 'french press bilanciere ez' }),
  e({ id: 'french_manubri', nome: 'French press manubri', gruppo: 'tricipiti', sottogruppo: 'tricipiti', classe: 'tricipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 10, carico_modo: 'manubrio_singolo', query_youtube: 'french press manubri' }),
  e({ id: 'french_corda', nome: 'French press con corda', gruppo: 'tricipiti', sottogruppo: 'tricipiti', classe: 'tricipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'cavo', query_youtube: 'french press corda cavo basso' }),
  e({ id: 'french_corda_alto', nome: 'French press con corda al cavo alto', gruppo: 'tricipiti', sottogruppo: 'tricipiti', classe: 'tricipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 14, carico_modo: 'cavo', query_youtube: 'french press corda cavo alto' }),
  e({ id: 'push_down_corda', nome: 'Push down con corda', gruppo: 'tricipiti', sottogruppo: 'tricipiti', classe: 'tricipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'cavo', query_youtube: 'push down corda' }),
  e({ id: 'push_down_barra', nome: 'Push down con barra', gruppo: 'tricipiti', sottogruppo: 'tricipiti', classe: 'tricipiti', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 12, carico_modo: 'cavo', query_youtube: 'push down barra' }),
  e({ id: 'dip_macchina', nome: 'Dip alla macchina', gruppo: 'tricipiti', sottogruppo: 'tricipiti', classe: 'tricipiti', tipo: 'multi', unilaterale: false, ripetizioni_test: 12, carico_modo: 'macchina', query_youtube: 'dip macchina tricipiti' }),

  // ADDOME
  e({ id: 'crunch_cavo', nome: 'Crunch al cavo alto', gruppo: 'addome', classe: 'addome', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 14, carico_modo: 'cavo', query_youtube: 'crunch cavo alto' }),
  e({ id: 'crunch_macchina', nome: 'Crunch alla macchina', gruppo: 'addome', classe: 'addome', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 14, carico_modo: 'macchina', query_youtube: 'crunch macchina' }),
  e({ id: 'crunch_hyperextension', nome: 'Crunch su hyperextension', gruppo: 'addome', classe: 'addome', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 14, carico_modo: 'carico_sul_corpo', query_youtube: 'crunch hyperextension' }),
  e({ id: 'leg_raise', nome: 'Sollevamento gambe', gruppo: 'addome', classe: 'addome', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 14, carico_modo: 'corpo_libero', query_youtube: 'leg raise addominali' }),
  e({ id: 'plank', nome: 'Plank', gruppo: 'addome', classe: 'addome', tipo: 'isolamento', unilaterale: false, ripetizioni_test: 14, carico_modo: 'corpo_libero', query_youtube: 'plank tecnica' }),
];

export const ESERCIZI_PER_ID: Record<string, Esercizio> = Object.fromEntries(ESERCIZI.map((x) => [x.id, x]));

export function esercizio(id: string, personalizzati: Esercizio[] = []): Esercizio | undefined {
  return ESERCIZI_PER_ID[id] ?? personalizzati.find((x) => x.id === id);
}

/**
 * Esercizio guida del gruppo per blocco (TEST_INIZIO_BLOCCO §1b): ruota a ogni blocco, è un Target a carico fisso.
 * Blocco 1 → indice 0, Blocco 2 → indice 1, poi ricomincia. L'utente può cambiarlo con le sostituzioni del profilo.
 */
export const ROTAZIONE_GUIDA: Partial<Record<Gruppo, string[]>> = {
  spalle: ['military_press', 'spinte_manubri_seduto'],
};

export function guidaDelBlocco(gruppo: Gruppo, numeroBlocco: number): string | undefined {
  const r = ROTAZIONE_GUIDA[gruppo];
  if (!r || !r.length) return undefined;
  return r[(Math.max(1, numeroBlocco) - 1) % r.length];
}

/** Istruzioni di carico per attrezzo (TEST_INIZIO_BLOCCO §4). */
export const CARICO_MODO: Record<CaricoModo, { breve: string; testo: string }> = {
  bilanciere_totale: { breve: 'bilanciere + dischi', testo: 'Inserisci il carico totale: il peso del bilanciere più tutti i dischi.' },
  manubrio_singolo: { breve: 'singolo manubrio', testo: 'Inserisci il peso del singolo manubrio.' },
  macchina: { breve: 'carico macchina', testo: 'Inserisci il carico impostato sulla macchina, escluso il peso proprio della macchina o del bilanciere del multipower.' },
  cavo: { breve: 'carico al cavo', testo: 'Inserisci il carico impostato sul cavo.' },
  solo_dischi: { breve: 'solo dischi', testo: 'Inserisci solo i dischi, escluso il bilanciere.' },
  carico_sul_corpo: { breve: 'zavorra', testo: 'Inserisci i kg posizionati sul corpo (petto, addome o cintura). Zero se a corpo libero.' },
  corpo_libero: { breve: 'corpo libero', testo: 'Esercizio a corpo libero: inserisci 0, oppure i kg di eventuale zavorra.' },
};

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

export function linkYoutube(x: Esercizio): string {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(x.query_youtube);
}
