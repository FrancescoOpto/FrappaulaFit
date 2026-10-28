import type { Contenitore, SessioneContenitore, Slot } from '../tipi';

// Blocco 2 dell'app di riferimento, 4 giorni A–D (docs/note_elaborate/BLOCCO2_programma.md).
// Dati letti dai video: esercizi per slot, tabella di progressione per slot, varianti dei complementari
// per fase (lo Scarico usa le varianti della Fase 2). Nessun ruolo L. [Certo]
// `fisso`: il generatore non taglia per tempo né aggiunge esercizi di copertura, segnala soltanto.

const s = (o: Slot): Slot => o;

const GIORNO_A: SessioneContenitore = {
  nome: 'Giorno A',
  etichetta: 'Petto · Schiena · Tricipiti · Addome',
  slot: [
    s({ gruppo: 'petto', ruolo: 'R1', tabella: 'R1', classe: 'spinta_orizzontale', default: 'panca_piana' }),
    s({ gruppo: 'petto', ruolo: 'R2', tabella: 'R2', classe: 'spinta_inclinata', default: 'panca_inclinata_manubri' }),
    s({ gruppo: 'petto', ruolo: 'C', classe: 'petto_isolamento', default: 'croci_cavi', serie: 3, rip: 10, varianti: { fase2: 'croci_cavi_alti', fase3: 'croci_cavi_seduto' } }),
    s({ gruppo: 'dorso', ruolo: 'R3', tabella: 'R3', classe: 'trazione_verticale', default: 'lat_machine' }),
    s({ gruppo: 'dorso', ruolo: 'C', classe: 'trazione_orizzontale', default: 'rematore_manubrio', serie: 2, rip: 8, varianti: { fase2: 'pulley', fase3: 'rematore_multipower' } }),
    s({ gruppo: 'dorso', ruolo: 'C', classe: 'trazione_verticale', default: 'lat_larga', serie: 2, rip: 10, varianti: { fase2: 'lat_triangolo', fase3: 'lat_larga' } }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'push_down_corda', serie: 4, rip: 10, copre: 'tricipiti', varianti: { fase2: 'french_manubri', fase3: 'french_ez' } }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'french_corda_alto', serie: 3, rip: 12, copre: 'tricipiti', varianti: { fase2: 'french_corda', fase3: 'push_down_corda' } }),
    s({ gruppo: 'addome', ruolo: 'AB', tabella: 'AB', classe: 'addome', default: 'crunch_cavo' }),
  ],
};

const GIORNO_B: SessioneContenitore = {
  nome: 'Giorno B',
  etichetta: 'Gambe · Spalle · Bicipiti',
  slot: [
    s({ gruppo: 'gambe', ruolo: 'R1', tabella: 'R1', classe: 'squat', default: 'squat', copre: 'quadricipiti' }),
    s({ gruppo: 'gambe', ruolo: 'R2', tabella: 'R2', classe: 'cerniera_anca', default: 'stacco_rumeno', copre: 'glutei' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'squat', default: 'pressa', serie: 3, rip: 8, copre: 'quadricipiti', varianti: { fase2: 'affondi_multipower', fase3: 'pressa' } }),
    s({ gruppo: 'spalle', ruolo: 'R3', tabella: 'R3b', classe: 'spinta_verticale', default: 'military_press' }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_laterali', default: 'alzate_laterali_cavo', serie: 3, rip: 10, copre: 'spalle_laterali', varianti: { fase2: 'alzate_laterali', fase3: 'alzate_laterali_panca' } }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_posteriori', default: 'alzate_posteriori', serie: 3, rip: 10, copre: 'spalle_posteriori', varianti: { fase2: 'alzate_posteriori_cavo', fase3: 'alzate_posteriori_seduto' } }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_panca_inclinata', serie: 3, rip: 10, copre: 'bicipiti', varianti: { fase2: 'curl_manubri', fase3: 'curl_ez' } }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_seduto', serie: 3, rip: 12, copre: 'bicipiti', varianti: { fase2: 'curl_manubri_60', fase3: 'curl_panca_inclinata' } }),
  ],
};

const GIORNO_C: SessioneContenitore = {
  nome: 'Giorno C',
  etichetta: 'Schiena · Petto · Tricipiti · Addome',
  slot: [
    s({ gruppo: 'dorso', ruolo: 'R2', tabella: 'R2', classe: 'trazione_orizzontale', default: 't_bar' }),
    s({ gruppo: 'dorso', ruolo: 'R2', tabella: 'R2', classe: 'trazione_verticale', default: 'lat_triangolo' }),
    s({ gruppo: 'dorso', ruolo: 'C', classe: 'trazione_orizzontale', default: 'rematore_multipower', serie: 3, rip: 10, varianti: { fase2: 'lat_larga', fase3: 'rematore_manubrio' } }),
    s({ gruppo: 'petto', ruolo: 'R3', tabella: 'R3c', classe: 'spinta_orizzontale', default: 'panca_manubri' }),
    s({ gruppo: 'petto', ruolo: 'C', classe: 'spinta_orizzontale', default: 'panca_multipower', serie: 3, rip: 10, varianti: { fase2: 'panca_30_multipower', fase3: 'panca_45_multipower' } }),
    s({ gruppo: 'petto', ruolo: 'C', classe: 'petto_isolamento', default: 'croci_manubri', serie: 2, rip: 10, varianti: { fase2: 'croci_cavi_seduto', fase3: 'croci_cavi_alti' } }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'french_manubri', serie: 3, rip: 8, copre: 'tricipiti', varianti: { fase2: 'push_down_barra', fase3: 'french_manubri' } }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'french_corda', serie: 3, rip: 10, copre: 'tricipiti', varianti: { fase2: 'french_corda_alto', fase3: 'french_corda' } }),
    s({ gruppo: 'addome', ruolo: 'AB', tabella: 'AB', classe: 'addome', default: 'crunch_hyperextension' }),
  ],
};

const GIORNO_D: SessioneContenitore = {
  nome: 'Giorno D',
  etichetta: 'Spalle · Stacco · Gambe · Bicipiti',
  slot: [
    s({ gruppo: 'spalle', ruolo: 'R2', tabella: 'R2', classe: 'spinta_verticale', default: 'spinte_manubri_seduto' }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_laterali', default: 'alzate_laterali', serie: 3, rip: 10, copre: 'spalle_laterali', varianti: { fase2: 'alzate_laterali_panca', fase3: 'alzate_laterali' } }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_posteriori', default: 'alzate_laterali_inclinato', serie: 2, rip: 12, copre: 'spalle_posteriori', varianti: { fase2: 'alzate_laterali_seduto', fase3: 'alzate_laterali_cavo_medio' } }),
    s({ gruppo: 'gambe', ruolo: 'R1', tabella: 'R1', classe: 'cerniera_anca', default: 'stacco_da_terra', copre: 'glutei' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'quadricipiti_isolamento', default: 'leg_extension', serie: 3, rip: 10, copre: 'quadricipiti' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'femorali_isolamento', default: 'leg_curl', serie: 3, rip: 10, copre: 'femorali' }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_ez', serie: 4, rip: 8, copre: 'bicipiti', varianti: { fase2: 'curl_panca_inclinata', fase3: 'curl_manubri' } }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_manubri_60', serie: 3, rip: 10, copre: 'bicipiti', varianti: { fase2: 'curl_hammer_seduto', fase3: 'curl_manubri_60' } }),
  ],
};

export const BLOCCO2_4G: Contenitore = {
  id: 'b2u4',
  N: 4,
  nome: 'Blocco 2 · giorni A–D',
  descrizione: 'Struttura del Blocco 2 letta dai video: panca (A), squat (B), stacco (D) una volta a settimana; giorno C senza fondamentale; varianti dei complementari per fase.',
  sessioni: [GIORNO_A, GIORNO_B, GIORNO_C, GIORNO_D],
  fisso: true,
};
