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
export type TabellaProg = 'R1' | 'R2' | 'R3' | 'R3b' | 'R3c' | 'R3d' | 'L' | 'AB' | 'AB_C' | 'B3_F' | 'B3_T8' | 'B3_T10' | 'B3_X12' | 'B3_X1';

/** Serie rest-pause (Blocco 3): `totale` = N ripetizioni totali con pause brevi; `10_piu_3` = 10 rip + 3 mini-serie a cedimento (pause 30/40/50 s). */
export type RestPause = 'totale' | '10_piu_3';

export type FaseLavoro = Exclude<Fase, 'test'>;

/** Obiettivo dell'utente (SPEC_PIANIFICATORE §1). `definizione` resta il nome interno; nell'interfaccia è "Dimagrimento". */
export type Obiettivo = 'massa' | 'mantenimento' | 'definizione';
export type StatoEnergetico = 'deficit' | 'mantenimento' | 'surplus';
export type Attivita = 'sedentario' | 'leggero' | 'moderato' | 'alto';
export type Modulo = 'test' | 'rientro' | 'ipertrofia' | 'mantenimento' | 'preservazione' | 'scarico';
/** Ciclo della Preservazione: "77" (3×5 @77 %), "82" (3×4 @82 %), "S" scarico. */
export type CicloPreservazione = 77 | 82 | 'S';
export type Sforzo = 'facile' | 'giusto' | 'limite';

export interface DatiCorporei {
  eta?: number;
  altezzaCm?: number;
  pesoKg?: number;
  bfPct?: number;
  /** Livello di attività della v1: non più usato dal calcolo, resta per i profili vecchi. */
  attivita?: Attivita;
  /** Passi reali al giorno (stepper da 1.000; default 8.000). */
  passiGiorno?: number;
  /** Allenamenti a settimana (default N). */
  allenamentiSettimana?: number;
  /** Durata di una seduta in minuti (default T). */
  durataSedutaMin?: number;
  /** TDEE misurato con 10–14 giorni di conteggio a peso stabile: prevale sul modello. */
  tdeeEmpirico?: number;
}

export interface ObiettivoAttivo {
  tipo: Obiettivo;
  dal: string;
  /** Durata richiesta in settimane (= cicli, SPEC_PIANIFICATORE §5). */
  settimane: number;
  energia: StatoEnergetico;
  kgTarget?: number;
  resistenza?: boolean;
  preferisciMacchine?: boolean;
  /** Calorie e macro sovrascritte dall'utente (altrimenti si calcolano). */
  kcalTarget?: number;
  macro?: { p: number; g: number; c: number };
  /** L'utente ha ignorato l'avviso "massa in deficit". */
  avvisoDeficitIgnorato?: boolean;
}

/** Profilo carichi per esercizio (SPEC_PIANIFICATORE §7.1): la fonte dei moduli, indipendente dal blocco. */
export interface CaricoProfilo {
  esercizio_id: string;
  kg: number;
  rip: number;
  modo: TestMode;
  /** Solo fondamentali: massimale stimato vigente. */
  massimale?: number;
  /** Ultimo carico scelto dall'utente per i ruoli a carico fisso. */
  caricoCorrente?: number;
  /** Ripetizioni di riserva dichiarate nel test di stima. */
  rir?: number;
  data: string;
  origine: 'test' | 'manuale' | 'ricalcolo' | 'proposta';
}

export interface Tappa {
  modulo: Modulo;
  obiettivo: Obiettivo;
  cicli: number;
  energia: StatoEnergetico;
  cicliPreservazione?: CicloPreservazione[];
  perche?: string;
}

/** Back-off (SPEC_PIANIFICATORE §4.6): serie pesanti seguite da 1–2 serie al massimo a −10/−20 %. Solo dato: non nei Blocchi 1–3. */
export interface BackOff {
  serie_pesanti: number;
  rip: number;
  serie_max: number;
  riduzione: number;
}

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
  /** Versione al multipower: il carico inserito esclude il bilanciere; niente stima del massimale. */
  esclude_bilanciere?: boolean;
  /** Pittogramma dello schema di movimento (SPEC_PIANIFICATORE §11c); se manca si usa quello del gruppo. */
  icona?: IconaId;
  query_youtube: string;
  personalizzato?: boolean;
}

/** Icone per schema di movimento (una per schema, non per esercizio). */
export type IconaId =
  | 'squat'
  | 'pressa'
  | 'stacco'
  | 'hip_thrust'
  | 'leg_extension'
  | 'leg_curl'
  | 'polpacci'
  | 'panca'
  | 'croci'
  | 'military'
  | 'alzate_laterali'
  | 'alzate_posteriori'
  | 'lat'
  | 'rematore'
  | 'curl'
  | 'tricipiti'
  | 'addome'
  | 'affondi';

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
  /** Varianti dell'esercizio per fase (complementari): Fase 2 e Fase 3; lo scarico usa la Fase 2. Con serie/rip proprie se cambiano. */
  varianti?: Partial<Record<'fase2' | 'fase3', string | VarianteSlot>>;
  /** Riga rest-pause (Blocco 3): serie 1, rip = totale (40) o 10. */
  rest_pause?: RestPause;
  /** Seconda riga dello stesso Target (×12): senza carico prescritto e senza test. */
  seconda_riga?: boolean;
  /** Fasi in cui lo slot esiste (default: tutte). */
  fasi?: FaseLavoro[];
  /** Serie×rip nello scarico quando non seguono la regola generale. */
  scarico?: { serie: number; rip: number };
  /** Tecnica back-off (solo programmi personalizzati). */
  back_off?: BackOff;
}

export interface VarianteSlot {
  id: string;
  serie?: number;
  rip?: number;
  /** Variante in rest-pause (null = serie normali). */
  rest_pause?: RestPause | null;
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
  /** Modalità prova (SPEC_PIANIFICATORE §11b): qualsiasi seduta si può avviare fuori ordine. Attiva di default nel collaudo. */
  modalita_prova?: boolean;
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
  /** Obiettivo dichiarato: scelta dell'utente, non un attributo del blocco. */
  obiettivo?: Obiettivo;
  obiettivoAttivo?: ObiettivoAttivo;
  /** Cambio di obiettivo in attesa del confine di ciclo. */
  obiettivoInAttesa?: ObiettivoAttivo;
  datiCorporei?: DatiCorporei;
  /** Profilo carichi per esercizio (SPEC_PIANIFICATORE §7.1). */
  carichi?: Record<string, CaricoProfilo>;
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
  /** Serie e rip fissi per questa seduta (override di scarico o rest-pause): ignora le tabelle. */
  serie_fisse?: boolean;
  rest_pause?: RestPause;
  /** Riga senza carico prescritto (seconda riga ×12): niente test, kg a scelta. */
  senza_carico?: boolean;
  seconda_riga?: boolean;
  /** Fondamentale a percentuale diretta del massimale (Preservazione): prevale sulle tabelle. */
  percentuale?: number;
  /** Riga "resistenza" (2×15–20 a carico leggero, SPEC_PIANIFICATORE §4.5). */
  resistenza?: boolean;
  back_off?: BackOff;
}

export interface Seduta {
  id: string;
  numero: number;
  fase: Fase;
  /** Ciclo assoluto nel blocco (1-based). */
  ciclo: number;
  /** Ciclo nella fase (1-based). */
  cicloFase: number;
  /** Modulo e tipo di ciclo (Preservazione: 77/82/S; "ponte" = primo ciclo dopo un cambio di modulo). */
  modulo?: Modulo;
  cicloTipo?: CicloPreservazione | 'ponte';
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
  /** `proposta` = suggerito dal coach dopo un "Facile" sull'ultima serie. */
  origine?: 'manuale' | 'proposta';
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
  /** Ripetizioni di riserva dichiarate nella prova (SPEC_PIANIFICATORE §7.4). */
  rir?: number;
  /** Massimale del test originale, conservato quando il ricalcolo in seduta lo sostituisce. */
  rm1_test?: number;
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
  /** Rest-pause: ripetizioni di ogni mini-serie (la somma va in `rip`). */
  mini?: number[];
  rest_pause?: RestPause;
  /** Tocco sull'ultima serie: Facile / Giusto / Al limite (SPEC_PIANIFICATORE §7.2). */
  sforzo?: Sforzo;
  /** RIR dichiarato (ripetizioni in riserva) sui fondamentali, per il ricalcolo del massimale. */
  rir?: number;
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
  /** Stato dei carichi all'avvio, per "Annulla seduta" (SPEC_PIANIFICATORE §11b). */
  snapshot?: SnapshotCarichi;
}

export interface SnapshotCarichi {
  carichiCorrenti?: Record<string, CaricoCorrente>;
  test: Record<string, RisultatoTest>;
  correzioni: Record<string, number>;
  carichi?: Record<string, CaricoProfilo>;
  note?: Blocco['note'];
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
  modulo?: Modulo;
  tappe?: Tappa[];
  /** Avvisi del coach registrati per il blocco (es. ricalcolo del massimale). */
  note?: { data: string; testo: string; perche?: string }[];
}

export interface Checkin {
  data: string;
  peso?: number;
  sensazioni?: number;
  nota?: string;
  /** Solo profilo F: giorno del ciclo (dato locale, opzionale). */
  giornoCiclo?: number;
  /** Circonferenze opzionali (cm). */
  vita?: number;
  braccio?: number;
  coscia?: number;
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

export type FonteRegola = 'metodo' | 'libro' | 'evidenza' | 'ipotesi';

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
  /** Piano a tappe (SPEC_PIANIFICATORE §6). */
  tappe?: Tappa[];
}

export interface PianoObiettivo {
  dataInizio: string;
  dataObiettivo: string;
  N: number;
  T: number;
  opzioneScelta?: string;
}
