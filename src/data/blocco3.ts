import type { Contenitore, SessioneContenitore, Slot } from '../tipi';

// Blocco 3 dell'app di riferimento, 4 giorni A–D (docs/note_elaborate/BLOCCO3_programma.md).
// Regole diverse dal Blocco 2: fondamentali a percentuale piatta (tabella B3_F: 77/82/87 %), Target 3×8 senza rampa
// (B3_T8, B3_T10), seconda riga ×12 sul Target principale (B3_X12), righe rest-pause 1×40 e "10 + 3 volte max".
// Lo scarico usa le varianti della Fase 2; le righe rest-pause tornano 2×12 / 2×10; le seconde righe spariscono.

const s = (o: Slot): Slot => o;

const GIORNO_A: SessioneContenitore = {
  nome: 'Giorno A',
  etichetta: 'Spalle · Schiena · Tricipiti · Addome',
  slot: [
    s({ gruppo: 'spalle', ruolo: 'R2', tabella: 'B3_T8', classe: 'spinta_verticale', default: 'spinte_manubri_seduto', scarico: { serie: 3, rip: 9 } }),
    s({ gruppo: 'spalle', ruolo: 'R3', tabella: 'B3_X12', classe: 'spinta_verticale', default: 'spinte_manubri_seduto', seconda_riga: true }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_laterali', default: 'alzate_laterali_seduto', serie: 3, rip: 10, copre: 'spalle_laterali', varianti: { fase2: 'alzate_laterali', fase3: { id: 'alzate_laterali_seduto', serie: 2, rip: 10 } } }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_laterali', default: 'alzate_laterali_panca', serie: 2, rip: 10, copre: 'spalle_laterali', varianti: { fase2: 'alzate_laterali_cavo', fase3: { id: 'alzate_laterali_panca', serie: 3, rip: 10 } } }),
    s({ gruppo: 'dorso', ruolo: 'R2', tabella: 'B3_T8', classe: 'trazione_verticale', default: 'lat_triangolo' }),
    s({ gruppo: 'dorso', ruolo: 'C', classe: 'trazione_orizzontale', default: 'pulley', serie: 3, rip: 10, varianti: { fase2: 'lat_larga', fase3: 'rematore_multipower' } }),
    s({ gruppo: 'dorso', ruolo: 'C', classe: 'trazione_orizzontale', default: 'rematore_multipower', serie: 2, rip: 10, varianti: { fase2: 'pulley', fase3: 'lat_machine' } }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'french_manubri', serie: 4, rip: 8, copre: 'tricipiti', varianti: { fase2: 'french_ez', fase3: 'french_manubri' } }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'push_down_barra', serie: 1, rip: 40, rest_pause: 'totale', copre: 'tricipiti', varianti: { fase2: { id: 'french_corda_alto', rest_pause: 'totale' }, fase3: { id: 'push_down_corda', rest_pause: 'totale' } } }),
    s({ gruppo: 'addome', ruolo: 'AB', tabella: 'AB', classe: 'addome', default: 'crunch_hyperextension' }),
  ],
};

const GIORNO_B: SessioneContenitore = {
  nome: 'Giorno B',
  etichetta: 'Gambe · Petto · Bicipiti',
  slot: [
    s({ gruppo: 'gambe', ruolo: 'R1', tabella: 'B3_F', classe: 'squat', default: 'squat', copre: 'quadricipiti' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'squat', default: 'affondi_multipower', serie: 2, rip: 8, copre: 'quadricipiti', fasi: ['fase2', 'scarico', 'fase3'], varianti: { fase3: 'pressa' } }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'quadricipiti_isolamento', default: 'leg_extension', serie: 3, rip: 10, copre: 'quadricipiti', varianti: { fase2: { id: 'leg_extension', rest_pause: '10_piu_3' }, fase3: 'leg_extension' } }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'femorali_isolamento', default: 'leg_curl', serie: 3, rip: 10, copre: 'femorali' }),
    s({ gruppo: 'petto', ruolo: 'R2', tabella: 'B3_T10', classe: 'spinta_orizzontale', default: 'panca_multipower' }),
    s({ gruppo: 'petto', ruolo: 'C', classe: 'spinta_inclinata', default: 'panca_45_multipower', serie: 2, rip: 10, varianti: { fase2: { id: 'panca_inclinata_manubri', serie: 3, rip: 10 }, fase3: { id: 'panca_45_multipower', rest_pause: 'totale' } } }),
    s({ gruppo: 'petto', ruolo: 'C', classe: 'petto_isolamento', default: 'croci_manubri', serie: 3, rip: 10, varianti: { fase2: 'croci_cavi_bassi', fase3: 'croci_cavi' } }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_seduto', serie: 4, rip: 8, copre: 'bicipiti', varianti: { fase2: 'curl_ez', fase3: 'curl_panca_inclinata' } }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_panca_inclinata', serie: 1, rip: 40, rest_pause: 'totale', copre: 'bicipiti', varianti: { fase2: { id: 'curl_manubri_60', rest_pause: 'totale' }, fase3: { id: 'curl_manubri', rest_pause: 'totale' } } }),
  ],
};

const GIORNO_C: SessioneContenitore = {
  nome: 'Giorno C',
  etichetta: 'Schiena · Spalle · Tricipiti · Addome',
  slot: [
    s({ gruppo: 'dorso', ruolo: 'R2', tabella: 'B3_T8', classe: 'trazione_orizzontale', default: 't_bar' }),
    s({ gruppo: 'dorso', ruolo: 'R3', tabella: 'B3_X12', classe: 'trazione_orizzontale', default: 't_bar', seconda_riga: true }),
    s({ gruppo: 'dorso', ruolo: 'R2', tabella: 'B3_T8', classe: 'trazione_verticale', default: 'lat_machine' }),
    // Lat media a serie singola (1×10 in Fase 1, 1×12 dopo): letta come seconda riga senza carico [Probabile].
    s({ gruppo: 'dorso', ruolo: 'R3', tabella: 'B3_X1', classe: 'trazione_verticale', default: 'lat_machine', seconda_riga: true }),
    s({ gruppo: 'dorso', ruolo: 'C', classe: 'trazione_verticale', default: 'lat_larga', serie: 2, rip: 10, varianti: { fase2: 'rematore_multipower', fase3: 'pulley' } }),
    s({ gruppo: 'spalle', ruolo: 'R2', tabella: 'B3_T10', classe: 'spinta_verticale', default: 'military_multipower' }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_laterali', default: 'alzate_laterali', serie: 2, rip: 10, copre: 'spalle_laterali', varianti: { fase2: { id: 'alzate_laterali_inclinato', serie: 3, rip: 10 }, fase3: { id: 'alzate_laterali_cavo_medio', serie: 3, rip: 10 } } }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_posteriori', default: 'alzate_posteriori_cavo', serie: 3, rip: 10, copre: 'spalle_posteriori', varianti: { fase2: 'alzate_posteriori', fase3: 'alzate_posteriori_seduto' } }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'french_corda_alto', serie: 3, rip: 10, copre: 'tricipiti', varianti: { fase2: 'french_manubri', fase3: 'french_ez' } }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'push_down_corda', serie: 3, rip: 12, copre: 'tricipiti', varianti: { fase2: 'french_corda', fase3: 'french_corda' } }),
    s({ gruppo: 'addome', ruolo: 'AB', tabella: 'AB_C', classe: 'addome', default: 'crunch_cavo' }),
  ],
};

const GIORNO_D: SessioneContenitore = {
  nome: 'Giorno D',
  etichetta: 'Petto · Stacco · Gambe · Bicipiti',
  slot: [
    s({ gruppo: 'petto', ruolo: 'R1', tabella: 'B3_F', classe: 'spinta_orizzontale', default: 'panca_piana' }),
    s({ gruppo: 'petto', ruolo: 'R2', tabella: 'B3_T8', classe: 'spinta_orizzontale', default: 'panca_manubri' }),
    s({ gruppo: 'petto', ruolo: 'R3', tabella: 'B3_X12', classe: 'spinta_orizzontale', default: 'panca_manubri', seconda_riga: true }),
    s({ gruppo: 'petto', ruolo: 'C', classe: 'spinta_inclinata', default: 'panca_30_multipower', serie: 1, rip: 10, rest_pause: '10_piu_3', varianti: { fase2: { id: 'panca_45_multipower', rest_pause: 'totale' }, fase3: { id: 'panca_30_multipower', rest_pause: '10_piu_3' } } }),
    s({ gruppo: 'gambe', ruolo: 'R1', tabella: 'B3_F', classe: 'cerniera_anca', default: 'stacco_da_terra', copre: 'glutei' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'squat', default: 'squat_multipower', serie: 3, rip: 10, copre: 'quadricipiti', varianti: { fase2: 'pressa', fase3: 'hack_squat' } }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'femorali_isolamento', default: 'leg_curl', serie: 3, rip: 12, copre: 'femorali' }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_manubri_60', serie: 3, rip: 10, copre: 'bicipiti', varianti: { fase2: 'curl_panca_inclinata', fase3: 'curl_ez' } }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_manubri', serie: 3, rip: 10, copre: 'bicipiti', varianti: { fase2: { id: 'curl_seduto', rest_pause: '10_piu_3' }, fase3: 'curl_manubri_60' } }),
  ],
};

export const BLOCCO3_4G: Contenitore = {
  id: 'b3u4',
  N: 4,
  nome: 'Blocco 3 · giorni A–D',
  descrizione: 'Struttura del Blocco 3 letta dai video: fondamentali a percentuale piatta (77→82→87 %), Target 3×8 con seconda riga ×12, righe rest-pause; squat e panca anche al multipower.',
  sessioni: [GIORNO_A, GIORNO_B, GIORNO_C, GIORNO_D],
  fisso: true,
};
