import type { Contenitore, SessioneContenitore, Slot } from '../tipi';

// Blocco 1 dell'app di riferimento, 4 giorni A–D (docs/note_elaborate/struttura_programma_vathlete.md).
// Letto dai video: esercizi per slot, tabella per slot, varianti dei complementari per fase (alcune con
// serie×rip proprie: es. leg extension 3×10 → leg press 3×8). Lo scarico usa le varianti della Fase 2.
// Il fondamentale compare due volte: R1 nel giorno principale e L (scala leggera) nel giorno C/D. [Certo salvo note]

const s = (o: Slot): Slot => o;

const GIORNO_A: SessioneContenitore = {
  nome: 'Giorno A',
  etichetta: 'Petto · Spalle · Bicipiti · Addome',
  slot: [
    s({ gruppo: 'petto', ruolo: 'R1', tabella: 'R1', classe: 'spinta_orizzontale', default: 'panca_piana' }),
    s({ gruppo: 'petto', ruolo: 'R2', tabella: 'R2', classe: 'spinta_orizzontale', default: 'panca_manubri' }),
    s({ gruppo: 'petto', ruolo: 'C', classe: 'petto_isolamento', default: 'croci_manubri', serie: 3, rip: 10, varianti: { fase2: 'croci_cavi', fase3: 'croci_cavi_seduto' } }),
    s({ gruppo: 'spalle', ruolo: 'R3', tabella: 'R3', classe: 'spinta_verticale', default: 'spinte_manubri_seduto' }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_laterali', default: 'alzate_laterali', serie: 3, rip: 10, copre: 'spalle_laterali', varianti: { fase2: 'alzate_laterali_cavo', fase3: 'alzate_laterali_panca' } }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_manubri', serie: 4, rip: 8, copre: 'bicipiti', varianti: { fase2: 'curl_ez', fase3: 'curl_manubri_60' } }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_manubri_60', serie: 3, rip: 10, copre: 'bicipiti', varianti: { fase2: 'curl_panca_inclinata', fase3: 'curl_hammer_seduto' } }),
    s({ gruppo: 'addome', ruolo: 'AB', tabella: 'AB', classe: 'addome', default: 'crunch_cavo' }),
  ],
};

const GIORNO_B: SessioneContenitore = {
  nome: 'Giorno B',
  etichetta: 'Gambe · Schiena · Tricipiti',
  slot: [
    s({ gruppo: 'gambe', ruolo: 'R1', tabella: 'R1', classe: 'squat', default: 'squat', copre: 'quadricipiti' }),
    s({ gruppo: 'gambe', ruolo: 'R2', tabella: 'R2', classe: 'cerniera_anca', default: 'stacco_rumeno', copre: 'glutei' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'quadricipiti_isolamento', default: 'leg_extension', serie: 3, rip: 10, copre: 'quadricipiti', varianti: { fase2: { id: 'pressa', serie: 3, rip: 8 }, fase3: { id: 'affondi_multipower', serie: 3, rip: 8 } } }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'femorali_isolamento', default: 'leg_curl', serie: 3, rip: 10, copre: 'femorali' }),
    s({ gruppo: 'dorso', ruolo: 'R3', tabella: 'R3', classe: 'trazione_verticale', default: 'lat_machine' }),
    s({ gruppo: 'dorso', ruolo: 'C', classe: 'trazione_orizzontale', default: 'rematore_manubrio', serie: 3, rip: 8, varianti: { fase2: { id: 'pulley', serie: 3, rip: 10 }, fase3: { id: 'lat_triangolo', serie: 3, rip: 10 } } }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'french_manubri', serie: 4, rip: 8, copre: 'tricipiti', varianti: { fase2: 'french_ez', fase3: 'french_manubri' } }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'push_down_corda', serie: 3, rip: 10, copre: 'tricipiti', varianti: { fase2: 'french_corda', fase3: 'french_corda' } }),
  ],
};

const GIORNO_C: SessioneContenitore = {
  nome: 'Giorno C',
  etichetta: 'Spalle · Petto leggero · Bicipiti · Addome',
  slot: [
    // Nel Blocco 1 il military segue la tabella R2 (nel Blocco 2, giorno B, la R3b): la tabella è un dato dello slot.
    s({ gruppo: 'spalle', ruolo: 'R2', tabella: 'R2', classe: 'spinta_verticale', default: 'military_press' }),
    s({ gruppo: 'spalle', ruolo: 'R3', tabella: 'R3d', classe: 'spalle_laterali', default: 'alzate_laterali', copre: 'spalle_laterali' }),
    s({ gruppo: 'spalle', ruolo: 'C', classe: 'spalle_posteriori', default: 'alzate_posteriori', serie: 3, rip: 10, copre: 'spalle_posteriori', varianti: { fase2: 'alzate_posteriori_cavo', fase3: 'alzate_posteriori_seduto' } }),
    s({ gruppo: 'petto', ruolo: 'L', tabella: 'L', classe: 'spinta_orizzontale', default: 'panca_piana' }),
    s({ gruppo: 'petto', ruolo: 'C', classe: 'spinta_inclinata', default: 'panca_inclinata_manubri', serie: 3, rip: 8, varianti: { fase2: 'chest_press_inclinata', fase3: 'panca_45_multipower' } }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_ez', serie: 4, rip: 10, copre: 'bicipiti', varianti: { fase2: 'curl_seduto', fase3: 'curl_manubri' } }),
    s({ gruppo: 'bicipiti', ruolo: 'C', classe: 'bicipiti', default: 'curl_hammer_seduto', serie: 3, rip: 12, copre: 'bicipiti', varianti: { fase2: 'curl_manubri_60', fase3: 'curl_manubri_60' } }),
    s({ gruppo: 'addome', ruolo: 'AB', tabella: 'AB', classe: 'addome', default: 'crunch_hyperextension' }),
  ],
};

const GIORNO_D: SessioneContenitore = {
  nome: 'Giorno D',
  etichetta: 'Schiena · Stacco · Gambe leggero · Tricipiti',
  slot: [
    s({ gruppo: 'gambe', ruolo: 'R1', tabella: 'R1', classe: 'cerniera_anca', default: 'stacco_da_terra', copre: 'glutei' }),
    s({ gruppo: 'dorso', ruolo: 'R2', tabella: 'R2', classe: 'trazione_orizzontale', default: 't_bar' }),
    s({ gruppo: 'dorso', ruolo: 'C', classe: 'trazione_orizzontale', default: 'pulley', serie: 3, rip: 8, varianti: { fase2: { id: 'rematore_manubrio', serie: 3, rip: 10 }, fase3: { id: 'pulley', serie: 3, rip: 10 } } }),
    s({ gruppo: 'dorso', ruolo: 'C', classe: 'trazione_verticale', default: 'lat_larga', serie: 3, rip: 10, varianti: { fase2: 'lat_triangolo', fase3: { id: 'lat_larga', serie: 3, rip: 8 } } }),
    // Squat leggero nel giorno D: tabella L, Fase 1 3×8, 3×8, 3×9, 3×9, 3×10 (BLOCCO1_verifica.md; ciclo 2 presunto).
    s({ gruppo: 'gambe', ruolo: 'L', tabella: 'L', classe: 'squat', default: 'squat', copre: 'quadricipiti' }),
    s({ gruppo: 'gambe', ruolo: 'C', classe: 'squat', default: 'pressa', serie: 3, rip: 10, copre: 'quadricipiti', varianti: { fase2: { id: 'affondi_multipower', serie: 3, rip: 8 }, fase3: { id: 'leg_extension', serie: 3, rip: 10 } } }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'french_corda', serie: 4, rip: 10, copre: 'tricipiti', varianti: { fase2: 'french_manubri', fase3: 'french_ez' } }),
    s({ gruppo: 'tricipiti', ruolo: 'C', classe: 'tricipiti', default: 'push_down_barra', serie: 3, rip: 12, copre: 'tricipiti', varianti: { fase2: 'push_down_corda', fase3: 'push_down_corda' } }),
  ],
};

export const BLOCCO1_4G: Contenitore = {
  id: 'b1u4',
  N: 4,
  nome: 'Blocco 1 · giorni A–D',
  descrizione: 'Struttura del Blocco 1 letta dai video: panca (A) e squat (B) con la seconda esposizione leggera in C e D, stacco in D; varianti dei complementari per fase.',
  sessioni: [GIORNO_A, GIORNO_B, GIORNO_C, GIORNO_D],
  fisso: true,
};
