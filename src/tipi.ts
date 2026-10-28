// Tipi condivisi tra dati, motore e interfaccia. Vedi SPEC §5, §10.

export type Gruppo = 'petto' | 'dorso' | 'spalle' | 'gambe' | 'bicipiti' | 'tricipiti' | 'addome';

/** Sottogruppi di cui garantire la copertura settimanale (SPEC §4.3). */
export type Sottogruppo =
  | 'quadricipiti'
  | 'femorali'
  | 'glutei'
  | 'spalle_laterali'
  | 'spalle_posteriori'
  | 'bicipiti'
  | 'tricipiti';

export type Classe =
  | 'spinta_orizzontale'
  | 'spinta_inclinata'
  | 'spinta_verticale'
  | 'trazione_verticale'
  | 'trazione_orizzontale'
  | 'squat'
  | 'cerniera_anca'
  | 'hip_thrust'
  | 'quadricipiti_isolamento'
  | 'femorali_isolamento'
  | 'bicipiti'
  | 'tricipiti'
  | 'spalle_laterali'
  | 'spalle_posteriori'
  | 'petto_isolamento'
  | 'addome';

/** Ruolo dello slot (SPEC §4.3): decide tabella serie×rip e scala RM. */
/** Ruolo dello slot (SPEC §4.3): badge, recupero e tipo di test. La progressione serie×rip è decisa dalla tabella. */
export type Ruolo = 'R1' | 'R2' | 'R3' | 'L' | 'C' | 'AB';

/**
 * Tabella di progressione serie×rip (BLOCCO2_programma.md §A2): dipende dall'esercizio nello slot, non dal ruolo.
 * R3b = military press (giorno B), R3c = spinte manubri piana (giorno C). C usa serie/rip fissi dello slot.
 */
export type TabellaProg = 'R1' | 'R2' | 'R3' | 'R3b' | 'R3c' | 'L' | 'AB';

/** Come si inserisce il carico nel test (TEST_INIZIO_BLOCCO §4). */
export type CaricoModo = 'bilanciere_totale' | 'manubrio_singolo' | 'macchina' | 'cavo' | 'solo_dischi' | 'carico_sul_corpo' | 'corpo_libero';

/** Tipo di test a inizio blocco: stima Brzycki (fondamentali) o serie unica a N RM. */
export type TestMode = 'stima' | 'serie_unica';

export type Fase = 'test' | 'fase1' | 'fase2' | 'scarico' | 'fase3';

export interface Esercizio {
  id: string;
  nome: string;
  gruppo: Gruppo;
  sottogruppo?: Sottogruppo;
  classe: Classe;
  tipo: 'multi' | 'isolamento';
  unilaterale: boolean;
  /** Ripetizioni di test di riserva (10, 12 o 14): quelle vere vengono dalle rip di lavoro della Fase 1 + 2. */
  ripetizioni_test: 10 | 12 | 14;
  /** True per i fondamentali permanenti (panca, squat, stacco, hip thrust): test di stima + scala RM. */
  fondamentale?: boolean;
  /** Istruzione di carico mostrata nel test. */
  carico_modo: CaricoModo;
  query_youtube: string;
  personalizzato?: boolean;
}

export interface Slot {
  gruppo: Gruppo;
  ruolo: Ruolo;
  classe: Classe;
  /** Esercizio proposto di default; le alternative vengono dalla classe. */
  default: string;
  /** Solo per C e AB: serie×rip fissi dello slot (Fase 1). */
  serie?: number;
  rip?: number;
  /** Gli slot con lo stesso gruppo di superserie condividono il recupero. */
  superserie?: string;
  /** Il sottogruppo che questo slot copre (per la verifica di copertura). */
  copre?: Sottogruppo;
  /** Esercizio guida del gruppo: ruota per blocco (ROTAZIONE_GUIDA), Target a carico fisso. */
  guida?: Gruppo;
  /** Slot che non deve ripetere la guida corrente del gruppo (prende l'altra della rotazione). */
  evita_guida?: Gruppo;
  /** Tabella di progressione dello slot; se assente si usa quella con il nome del ruolo. */
  tabella?: TabellaProg;
  /** Varianti dell'esercizio per fase (complementari): Fase 2 e Fase 3; lo scarico usa la Fase 2. */
  varianti?: Partial<Record<'fase2' | 'fase3', string>>;
}

export interface SessioneContenitore {
  nome: string;
  etichetta: string;
  slot: Slot[];
}

export interface Contenitore {
  id: string;
  N: number;
  nome: string;
  descrizione: string;
  sessioni: SessioneContenitore[];
  /** Indice (0-based) della seduta "jolly" da saltare quando si salta una seduta. */
  jolly?: number;
  /** Programma fisso letto dai video: niente tagli per tempo né aggiunte di copertura. */
  fisso?: boolean;
  /** Avviso da mostrare (es. N=5 sconsigliato). */
  avviso?: string;
}

export type Esperienza = 'principiante' | 'intermedio' | 'avanzato';
export type Preset = 'uomo_base' | 'donna_glutei';

export interface ParametriGeneratore {
  N: number;
  T: number;
  priorita: Gruppo[];
  esclusi: string[];
  esperienza: Esperienza;
  preset: Preset;
  bloccoBreve: boolean;
}

export interface Impostazioni {
  arrotondamento: 0.5 | 1 | 2.5;
  /** Carichi RM = fattore × massimale stimato × (37−n)/36 (blocco2_giorno_B.md §3). Default 0,9. */
  fattore_lavoro?: number;
  recuperi: Record<Ruolo, number>;
  suoni: boolean;
  vibrazione: boolean;
  notifiche: boolean;
  stripping: boolean;
}

export interface Profilo {
  id: string;
  nome: string;
  sesso: 'M' | 'F';
  parametri: ParametriGeneratore;
  impostazioni: Impostazioni;
  creato: string;
  /** Sostituzioni permanenti scelte dall'utente: slot default → esercizio preferito. */
  sostituzioni: Record<string, string>;
  esercizi_personalizzati: Esercizio[];
  /** Esercizi guida promossi a fondamentale dall'utente (stima + scala RM). Default: nessuno. */
  fondamentali_promossi?: string[];
  /** Regole del motore coach (solo `ipotesi`) disattivate dall'utente (SPEC §14.5). */
  regole_disattivate?: string[];
}

export interface EsercizioSeduta {
  slot: number;
  esercizio_id: string;
  ruolo: Ruolo;
  gruppo: Gruppo;
  /** Serie×rip fissi (solo C/AB); per gli altri ruoli vengono dalle tabelle. */
  serie?: number;
  rip?: number;
  superserie?: string;
  /** Tabella di progressione (dallo slot). */
  tabella?: TabellaProg;
  /** Variante senza test: eredita il carico dall'esercizio di Fase 1 dello stesso slot. */
  eredita_da?: string;
}

export interface Seduta {
  id: string;
  numero: number;
  fase: Fase;
  /** Ciclo assoluto nel blocco (1-based). */
  ciclo: number;
  /** Ciclo nella fase (1-based). */
  cicloFase: number;
  giorno: number;
  nome: string;
  etichetta: string;
  stato: 'futura' | 'in_corso' | 'completata';
  data?: string;
  esercizi: EsercizioSeduta[];
}

/**
 * Carico corrente di un esercizio (SPEC §9.2b). Per i ruoli a carico fisso (R2, R3, C, AB) è un kg assoluto;
 * per i fondamentali con scala RM (R1, L) è il fattore kg_inseriti / kg_previsti applicato ai carichi del piano.
 */
export interface CaricoCorrente {
  kg?: number;
  fattore?: number;
  aggiornato: string;
  /** Seduta in cui è stato scelto (per lo storico). */
  seduta_id?: string;
}

export interface RisultatoTest {
  esercizio_id: string;
  /** Carico inserito (per la stima: il carico della prova; per la serie unica: il carico di lavoro). */
  kg: number;
  /** Ripetizioni (per la stima: quelle della prova; per la serie unica: N fisso). */
  rip: number;
  modo: TestMode;
  /** Solo stima: 1RM stimato con Brzycki, arrotondato. Salvato come "1@rm1". */
  rm1?: number;
}

export interface SerieRegistrata {
  n: number;
  /** Carico precompilato (carico corrente al momento dell'avvio o dopo una modifica in seduta). */
  kg_prev: number;
  /** Carico del piano (dal test e dalla scala RM), per confronto (SPEC §9.2b punto 6). */
  kg_piano?: number;
  rip_prev: number;
  kg?: number;
  rip?: number;
  fatta: boolean;
  /** Serie extra di stripping (−30%). */
  stripping?: boolean;
}

export interface RegistroEsercizio {
  esercizio_id: string;
  serie: SerieRegistrata[];
  nota?: string;
}

export interface RegistroSeduta {
  seduta_id: string;
  iniziata: string;
  completata?: string;
  esercizi: Record<number, RegistroEsercizio>;
}

export interface Blocco {
  id: string;
  numero: number;
  stato: 'test' | 'in_corso' | 'completato';
  contenitore_id: string;
  sedute: Seduta[];
  test: Record<string, RisultatoTest>;
  /** Correzioni di carico per esercizio (frazione, es. −0.025) da autocorrezione §7. */
  correzioni: Record<string, number>;
  /** Carichi correnti scelti dall'utente in seduta (SPEC §9.2b): sostituiscono il carico base per le sedute future. */
  carichiCorrenti?: Record<string, CaricoCorrente>;
  /** Parametri con cui sono state generate le sedute (per rigenerare al confine di ciclo). */
  parametri: ParametriGeneratore;
  /** Modifica dei parametri in attesa: si applica al prossimo confine di ciclo. */
  parametriInAttesa?: ParametriGeneratore;
  creato: string;
}

export interface Checkin {
  data: string;
  peso?: number;
  sensazioni?: number;
  nota?: string;
  /** Solo profilo F: giorno del ciclo (dato locale, opzionale). */
  giornoCiclo?: number;
}

/** Tutto lo stato persistito (export/import JSON). */
export interface Stato {
  versione: number;
  profilo: Profilo | null;
  blocco: Blocco | null;
  blocchiPassati: Blocco[];
  registro: Record<string, RegistroSeduta>;
  checkin: Checkin[];
}

// ---------- Motore coach (SPEC §14) e pianificatore a obiettivo (SPEC §15): solo strutture dati ----------

export type FonteRegola = 'metodo' | 'ipotesi';

export interface RegolaCoach {
  id: string;
  sezione: 'test' | 'carichi' | 'struttura' | 'stato';
  fonte: FonteRegola;
  titolo: string;
  /** Il "perché" in una riga, mostrato accanto a ogni decisione. */
  perche: string;
}

export interface OpzionePiano {
  id: string;
  titolo: string;
  settimane: number;
  blocchi: { numero: number; cicli: Partial<Record<Fase, number>> }[];
  /** Versione accorciata: scelta nostra, non vista nell'app di riferimento. */
  nostraScelta: boolean;
  perche: string;
}

export interface PianoObiettivo {
  dataInizio: string;
  dataObiettivo: string;
  N: number;
  T: number;
  opzioneScelta?: string;
}
