// Tipi dell'app di lei (Frappaula Fit · Lei). Programma: libro "Glutei" cap. II, programmazione per intermedi,
// distribuita su 3 sedute (docs/PROPOSTA_PROGRAMMA_DONNA.md, approvata il 16/11/2026).

/** Gruppi mostrati nell'app. I glutei comprendono tutto il lavoro della parte bassa. */
export type Gruppo = 'glutei' | 'dorso' | 'petto' | 'spalle' | 'bicipiti' | 'tricipiti' | 'addome';

/** I quattro movimenti dei glutei del libro (p.184). */
export type Movimento = 'accosciata' | 'estensione' | 'spinta' | 'abduzione';

/** Classe per le sostituzioni: si sostituisce solo con esercizi della stessa classe. */
export type Classe =
  | 'squat'
  | 'squat_unilaterale'
  | 'stacco'
  | 'cerniera'
  | 'hip_thrust'
  | 'abduzione'
  | 'trazione_verticale'
  | 'trazione_orizzontale'
  | 'spinta_orizzontale'
  | 'spinta_inclinata'
  | 'spinta_verticale'
  | 'spalle_laterali'
  | 'spalle_posteriori'
  | 'bicipiti'
  | 'tricipiti'
  | 'addome';

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

/** Come si inserisce il carico (TEST_INIZIO_BLOCCO §4). `banda` = elastico: niente kg. */
export type CaricoModo = 'bilanciere_totale' | 'manubrio_singolo' | 'macchina' | 'cavo' | 'carico_sul_corpo' | 'corpo_libero' | 'banda';

/** Tipo di test a inizio programma: stima del massimale (fondamentali), serie unica, nessun test (banda, corpo libero). */
export type TipoTest = 'stima' | 'serie_unica' | 'nessuno';

export interface Esercizio {
  id: string;
  nome: string;
  gruppo: Gruppo;
  movimento?: Movimento;
  classe: Classe;
  icona?: IconaId;
  carico_modo: CaricoModo;
  /** Fondamentali (squat, stacco, hip thrust): test di stima, carichi in % del massimale, mai a cedimento. */
  fondamentale?: boolean;
  /** Tempo invece delle ripetizioni (plank): i valori sono secondi. */
  secondi?: boolean;
  query_youtube: string;
  /** Nota di esecuzione mostrata nella scheda. */
  nota?: string;
}

/** Fasi del programma: test, le tre fasi del libro, scarico. */
export type Fase = 'test' | 'fase1' | 'fase2' | 'fase3' | 'scarico';
export type FaseLavoro = 'fase1' | 'fase2' | 'fase3';

/**
 * Una settimana di una voce: serie × ripetizioni e carico. Il carico è in % del massimale (`pct`) oppure in RM
 * (`rm`: il carico con cui si fanno al massimo quelle ripetizioni), con `inc` = aumento cumulativo indicato dal libro
 * ("+10/15 % peso", usato come +10 %). `max` = serie a cedimento (le ripetizioni indicate sono un riferimento).
 */
export interface Riga {
  s: number;
  r: number;
  pct?: number;
  rm?: number;
  inc?: number;
  max?: boolean;
}

/** Voce di una seduta: un posto nella scheda, con l'esercizio e le 6 settimane di ogni fase. */
export interface Voce {
  id: string;
  parte: 'glutei' | 'alta';
  /** Esercizio per fase (i glutei cambiano esercizio a ogni fase, la parte alta no). */
  esercizio: Record<FaseLavoro, string>;
  /** Righe per fase: 6 settimane per i glutei; la parte alta ha una riga sola valida per tutte le settimane. */
  righe: Record<FaseLavoro, Riga[]>;
  /** Recupero in secondi per fase (dal libro per i glutei). */
  recupero: Record<FaseLavoro, number>;
  /** Parte alta: ripetizioni massime del range della progressione doppia. */
  ripMax?: number;
  /** Superserie: le voci con lo stesso id si fanno di seguito e condividono il recupero (modalità classica). */
  superserie?: string;
}

export type Giorno = 'A' | 'B' | 'C';

export interface SessioneModello {
  giorno: Giorno;
  nome: string;
  etichetta: string;
  voci: Voce[];
}

export type Obiettivo = 'definizione' | 'mantenimento';
export type Esperienza = 'principiante' | 'intermedio' | 'avanzato';
export type ModoSeduta = 'classica' | 'pha';
export type Tema = 'scuro' | 'chiaro';

/** Segmento del calendario: una fase per n settimane, con le righe di tabella da usare. */
export interface Segmento {
  fase: Fase;
  settimane: number;
  /** Righe (1–6) delle tabelle per ogni settimana del segmento (fasi accorciate: gradini). */
  righe: number[];
  /** Solo scarico: la fase appena finita (lo scarico ne usa la prima settimana). */
  dopo?: FaseLavoro;
  /** Numero del giro del programma (1 = primo, 2 = ripetizione dopo il nuovo test…). */
  giro: number;
}

export interface Seduta {
  id: string;
  numero: number;
  /** Settimana assoluta (1-based): un ciclo = le 3 sedute A, B, C. */
  settimana: number;
  fase: Fase;
  /** Settimana nella fase (1-based) e riga di tabella da usare. */
  settimanaFase: number;
  riga: number;
  /** Fase di riferimento per esercizi e righe (per lo scarico: la fase appena finita). */
  faseRif: FaseLavoro;
  giro: number;
  giorno: Giorno;
  nome: string;
  etichetta: string;
  stato: 'futura' | 'in_corso' | 'completata';
  data?: string;
}

export interface RisultatoTest {
  esercizio_id: string;
  kg: number;
  rip: number;
  modo: 'stima' | 'serie_unica';
  /** Massimale stimato (stima: Brzycki con riserva; serie unica: dalla tabella % ↔ ripetizioni). */
  rm1: number;
  rir?: number;
  /** Massimale del test, conservato quando un ricalcolo in seduta lo aggiorna. */
  rm1_test?: number;
  data: string;
}

/** Carico scelto da lei (o proposto dalla progressione doppia): vale per le sedute successive. */
export interface CaricoCorrente {
  kg: number;
  /** Carico del piano quando lei l'ha scelto: le settimane dopo il suo carico segue gli aumenti del piano. */
  rif?: number;
  aggiornato: string;
  origine: 'manuale' | 'proposta';
  seduta_id?: string;
}

export interface Programma {
  id: string;
  creato: string;
  mesi: number;
  obiettivo: Obiettivo;
  composizione: Segmento[];
  sedute: Seduta[];
  test: Record<string, RisultatoTest>;
  carichiCorrenti: Record<string, CaricoCorrente>;
  /** Avvisi del coach (es. nuovo massimale). */
  note: { data: string; testo: string }[];
}

export interface SerieRegistrata {
  n: number;
  kg_prev: number;
  kg_piano?: number;
  rip_prev: number;
  kg?: number;
  rip?: number;
  fatta: boolean;
  /** Giudizio dell'ultima serie dei fondamentali: ripetizioni di riserva per il ricalcolo (Facile 2, Giusto 1, Al limite 0). */
  sforzo?: 'facile' | 'giusto' | 'limite';
  /** Massimale prima del ricalcolo fatto da questa serie: serve a rifarlo se cambia il giudizio. */
  rm1_prima?: number;
}

export interface RegistroVoce {
  esercizio_id: string;
  serie: SerieRegistrata[];
  nota?: string;
}

export interface RegistroSeduta {
  seduta_id: string;
  iniziata: string;
  completata?: string;
  modo: ModoSeduta;
  voci: Record<string, RegistroVoce>;
  /** Fotografia dei carichi all'avvio, per "Annulla seduta". */
  snapshot?: { test: Record<string, RisultatoTest>; carichiCorrenti: Record<string, CaricoCorrente>; note: Programma['note'] };
}

export interface DatiCorporei {
  eta?: number;
  altezzaCm?: number;
  pesoKg?: number;
  bfPct?: number;
  passiGiorno?: number;
  tdeeEmpirico?: number;
}

export interface Impostazioni {
  tema: Tema;
  arrotondamento: 0.5 | 1 | 2.5;
  /** Tetto di durata della seduta in minuti (in classica la parte alta perde serie se si sfora). */
  T: number;
  /** Modalità proposta all'avvio della seduta. */
  phaDefault: boolean;
  suoni: boolean;
  vibrazione: boolean;
  notifiche: boolean;
  modalita_prova: boolean;
}

export interface Profilo {
  id: string;
  nome: string;
  creato: string;
  esperienza: Esperienza;
  obiettivo: Obiettivo;
  mesi: number;
  impostazioni: Impostazioni;
  /** Sostituzioni permanenti: esercizio del programma → esercizio scelto da lei. */
  sostituzioni: Record<string, string>;
  datiCorporei?: DatiCorporei;
  kcalTarget?: number;
}

export interface Checkin {
  data: string;
  peso?: number;
  sensazioni?: number;
  nota?: string;
  giornoCiclo?: number;
  vita?: number;
  glutei?: number;
  coscia?: number;
}

export interface Stato {
  versione: number;
  profilo: Profilo | null;
  programma: Programma | null;
  programmiPassati: Programma[];
  registro: Record<string, RegistroSeduta>;
  checkin: Checkin[];
}
