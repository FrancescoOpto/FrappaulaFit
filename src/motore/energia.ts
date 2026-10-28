import type { Esperienza, Obiettivo } from '../tipi';

// Modulo Energia (SPEC_PIANIFICATORE §3, v2): bilancio energetico, calorie obiettivo, macro.
// TDEE con il mini calcolatore di §3.1: BMR (Mifflin-St Jeor, o Katch-McArdle se la % di grasso è nota)
// + 10 % di vita quotidiana + costo dei passi + costo degli allenamenti, il tutto × 1,10 (effetto termico del cibo).
// Costanti [Probabile/Ipotesi], da tarare sul peso reale (§13). L'app non è un contacalorie: indicazioni generali.

export const KCAL_PER_KG_GRASSO = 7700;
export const PASSI_DEFAULT = 8000;
export const PASSI_MIN = 1000;
export const PASSI_MAX = 30000;
export const PASSO_STEPPER = 1000;
/** Vita quotidiana senza camminare: +10 % del BMR [Probabile]. */
export const QUOTA_VITA_QUOTIDIANA = 0.1;
/** Costo netto della camminata ≈ 0,5 kcal/kg/km (Compendium of Physical Activities) [Probabile]. */
export const KCAL_KG_KM = 0.5;
/** Fattore lunghezza del passo: 0,415 × altezza (m) [Probabile]. */
export const FATTORE_PASSO = 0.415;
/** MET·h netti per seduta di pesi [Ipotesi]. */
export const MET_H_SEDUTA = 3.5;
/** Effetto termico del cibo, 10 % (Libro cap. 2). */
export const EFFETTO_TERMICO = 0.1;

/** Metabolismo basale (Mifflin-St Jeor), arrotondato all'intero. */
export function bmr(sesso: 'M' | 'F', pesoKg: number, altezzaCm: number, eta: number): number {
  const base = 10 * pesoKg + 6.25 * altezzaCm - 5 * eta;
  return Math.round(sesso === 'M' ? base + 5 : base - 161);
}

/** Metabolismo basale con massa magra nota (Katch-McArdle): 370 + 21,6 × kg magri. */
export function bmrKatch(pesoKg: number, bfPct: number): number {
  return Math.round(370 + 21.6 * pesoKg * (1 - bfPct / 100));
}

/** Regola del libro: kg × 32–34 (uomo) o × 30–32 (donna); sovrastima sopra ~12–15 % / 22–24 % di grasso. */
export function tdeeRegolaLibro(sesso: 'M' | 'F', pesoKg: number): [number, number] {
  return sesso === 'M' ? [pesoKg * 32, pesoKg * 34] : [pesoKg * 30, pesoKg * 32];
}

/** Costo giornaliero dei passi: passi × (0,415 × altezza_m) × 0,5 × kg / 1000 kcal. */
export function kcalPassi(passi: number, altezzaCm: number, pesoKg: number): number {
  return (passi * (FATTORE_PASSO * (altezzaCm / 100)) * KCAL_KG_KM * pesoKg) / 1000;
}

/** Costo giornaliero degli allenamenti: sedute × 3,5 MET·h × kg × (durata/60) / 7. */
export function kcalAllenamento(seduteSettimana: number, pesoKg: number, durataMin: number): number {
  return (seduteSettimana * MET_H_SEDUTA * pesoKg * (durataMin / 60)) / 7;
}

export interface InputTdee {
  sesso: 'M' | 'F';
  pesoKg: number;
  altezzaCm: number;
  eta: number;
  /** Passi reali al giorno (default 8.000). */
  passiGiorno?: number;
  /** Allenamenti a settimana (default 4). */
  allenamentiSettimana?: number;
  /** Durata di una seduta in minuti (default 60). */
  durataMin?: number;
  bfPct?: number;
  /** TDEE misurato con 10–14 giorni di conteggio a peso stabile: prevale sul modello. */
  tdeeEmpirico?: number;
}

export interface StimeTdee {
  bmr: number;
  /** TDEE del modello (§3.1). */
  modello: number;
  /** Le voci del modello, in kcal al giorno (prima dell'effetto termico). */
  voci: { vita: number; passi: number; allenamento: number; termico: number };
  libro: [number, number];
  empirico?: number;
  /** Valore di partenza: l'empirico se c'è, altrimenti il modello. */
  partenza: number;
  avvisoLibro?: string;
  /** BMR calcolato con la massa magra (Katch-McArdle). */
  katch?: boolean;
}

/** Mini calcolatore TDEE (SPEC_PIANIFICATORE §3.1). */
export function stimeTdee(i: InputTdee): StimeTdee {
  const katch = i.bfPct !== undefined && i.bfPct > 3 && i.bfPct < 60;
  const b = katch ? bmrKatch(i.pesoKg, i.bfPct!) : bmr(i.sesso, i.pesoKg, i.altezzaCm, i.eta);
  const vita = b * QUOTA_VITA_QUOTIDIANA;
  const passi = kcalPassi(i.passiGiorno ?? PASSI_DEFAULT, i.altezzaCm, i.pesoKg);
  const allenamento = kcalAllenamento(i.allenamentiSettimana ?? 4, i.pesoKg, i.durataMin ?? 60);
  const netto = b + vita + passi + allenamento;
  const termico = netto * EFFETTO_TERMICO;
  const modello = Math.round(netto * (1 + EFFETTO_TERMICO));
  const libro = tdeeRegolaLibro(i.sesso, i.pesoKg);
  const partenza = i.tdeeEmpirico && i.tdeeEmpirico > 0 ? Math.round(i.tdeeEmpirico) : modello;
  const sogliaBf = i.sesso === 'M' ? 15 : 24;
  const avvisoLibro = i.bfPct !== undefined && i.bfPct > sogliaBf ? 'Con questa percentuale di grasso la regola kg × 32–34 sovrastima: fidati del modello.' : undefined;
  return {
    bmr: b,
    modello,
    voci: { vita: Math.round(vita), passi: Math.round(passi), allenamento: Math.round(allenamento), termico: Math.round(termico) },
    libro,
    empirico: i.tdeeEmpirico,
    partenza,
    avvisoLibro,
    katch: katch || undefined,
  };
}

export interface RisultatoCalorie {
  kcal: number;
  /** Deficit (positivo) o surplus (negativo) rispetto al TDEE. */
  delta: number;
  /** Ritmo atteso di variazione del peso, % del peso a settimana (negativo in dimagrimento). */
  ritmoPct: number;
  /** Tetto di perdita settimanale in % del peso (solo dimagrimento). */
  tettoPct?: number;
  /** Se il deficit richiesto superava il tetto: settimane minime per l'obiettivo in kg. */
  durataMinima?: number;
  note: string[];
}

export interface ParametriCalorie {
  obiettivo: Obiettivo;
  sesso: 'M' | 'F';
  pesoKg: number;
  tdee: number;
  bmr: number;
  bfPct?: number;
  esperienza?: Esperienza;
  /** Dimagrimento: kg da perdere; massa: kg da prendere (facoltativi). */
  kgTarget?: number;
  settimane?: number;
}

/** Tetto di perdita settimanale: 1 % del peso, 0,5 % se già magri (SPEC_PIANIFICATORE §3.2). */
export function tettoRitmo(sesso: 'M' | 'F', bfPct?: number): number {
  if (bfPct === undefined) return 0.01;
  return (sesso === 'M' && bfPct < 10) || (sesso === 'F' && bfPct < 16) ? 0.005 : 0.01;
}

export function calorieObiettivo(p: ParametriCalorie): RisultatoCalorie {
  const note: string[] = [];
  if (p.obiettivo === 'definizione') {
    const tettoPct = tettoRitmo(p.sesso, p.bfPct);
    const tettoDeficit = (p.pesoKg * tettoPct * KCAL_PER_KG_GRASSO) / 7;
    let deficit = p.sesso === 'M' ? 500 : 350;
    let durataMinima: number | undefined;
    if (p.kgTarget && p.settimane && p.settimane > 0) {
      deficit = (p.kgTarget * KCAL_PER_KG_GRASSO) / (p.settimane * 7);
      if (deficit > tettoDeficit) {
        durataMinima = Math.ceil((p.kgTarget * KCAL_PER_KG_GRASSO) / (tettoDeficit * 7));
        note.push(`Per perdere ${p.kgTarget} kg in ${p.settimane} settimane servirebbero ${Math.round(deficit)} kcal al giorno di deficit: troppo. Il tetto è ${Math.round(tettoPct * 1000) / 10} % del peso a settimana (${Math.round(tettoDeficit)} kcal/die): servono almeno ${durataMinima} settimane.`);
        deficit = tettoDeficit;
      }
    }
    deficit = Math.round(deficit);
    let kcal = Math.round(p.tdee - deficit);
    if (kcal < p.bmr) {
      note.push(`Le calorie non scendono sotto il metabolismo basale (${p.bmr} kcal).`);
      kcal = p.bmr;
      deficit = Math.round(p.tdee - kcal);
    }
    const ritmoPct = -((deficit * 7) / KCAL_PER_KG_GRASSO / p.pesoKg) * 100;
    return { kcal, delta: deficit, ritmoPct: Math.round(ritmoPct * 1000) / 1000, tettoPct, durataMinima, note };
  }
  if (p.obiettivo === 'mantenimento') {
    return { kcal: Math.round(p.tdee), delta: 0, ritmoPct: 0, note: ['Calorie di mantenimento (±100): il peso deve restare stabile sulla media di due settimane.'] };
  }
  // Massa: surplus per livello (principiante +300–500, intermedio +200–300, avanzato +100–200).
  const surplus = p.esperienza === 'principiante' ? 400 : p.esperienza === 'avanzato' ? 150 : 250;
  const ritmoAtteso = p.esperienza === 'avanzato' ? 0.085 : 0.3;
  note.push(`Surplus di ${surplus} kcal: guadagno atteso circa ${ritmoAtteso} % del peso a settimana. Più di così è grasso.`);
  return { kcal: Math.round(p.tdee + surplus), delta: -surplus, ritmoPct: ritmoAtteso, note };
}

export interface Macro {
  proteine: number;
  grassi: number;
  carboidrati: number;
  kcal: number;
}

export const MACRO_DEFAULT: Record<Obiettivo, { proteine: number; grassi: number }> = {
  massa: { proteine: 1.8, grassi: 1.0 },
  mantenimento: { proteine: 1.8, grassi: 1.0 },
  definizione: { proteine: 2.0, grassi: 0.8 },
};

/** Macro in grammi interi: proteine e grassi per kg, carboidrati con le calorie rimanenti (4/4/9 kcal per g). */
export function macro(obiettivo: Obiettivo, pesoKg: number, kcal: number, gPerKg?: { proteine?: number; grassi?: number }): Macro {
  const d = MACRO_DEFAULT[obiettivo];
  const proteine = Math.round((gPerKg?.proteine ?? d.proteine) * pesoKg);
  const grassi = Math.round((gPerKg?.grassi ?? d.grassi) * pesoKg);
  const carboidrati = Math.max(0, Math.round((kcal - proteine * 4 - grassi * 9) / 4));
  return { proteine, grassi, carboidrati, kcal };
}

/** Durata di default per obiettivo, in settimane/cicli (SPEC_PIANIFICATORE §2). */
export const DURATA_DEFAULT: Record<Obiettivo, number> = { definizione: 4, mantenimento: 12, massa: 17 };
