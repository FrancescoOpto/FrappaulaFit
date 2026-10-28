import type { Esperienza, Obiettivo, Attivita } from '../tipi';

// Modulo Energia (SPEC_PIANIFICATORE §3): bilancio energetico, calorie obiettivo, macro.
// Formule del libro (Mifflin-St Jeor, regola kg × 32–34, deficit 500/350, macro per kg); fattori di attività
// e 7700 kcal/kg sono approssimazioni comuni [Probabile]. L'app non è un contacalorie: indicazioni generali.

export const FATTORI_ATTIVITA: Record<Attivita, number> = { sedentario: 1.2, leggero: 1.375, moderato: 1.55, alto: 1.725 };
export const KCAL_PER_KG_GRASSO = 7700;

/** Metabolismo basale (Mifflin-St Jeor), arrotondato all'intero. */
export function bmr(sesso: 'M' | 'F', pesoKg: number, altezzaCm: number, eta: number): number {
  const base = 10 * pesoKg + 6.25 * altezzaCm - 5 * eta;
  return Math.round(sesso === 'M' ? base + 5 : base - 161);
}

/** Regola del libro: kg × 32–34 (uomo) o × 30–32 (donna); sovrastima sopra ~12–15 % / 22–24 % di grasso. */
export function tdeeRegolaLibro(sesso: 'M' | 'F', pesoKg: number): [number, number] {
  return sesso === 'M' ? [pesoKg * 32, pesoKg * 34] : [pesoKg * 30, pesoKg * 32];
}

export interface StimeTdee {
  bmr: number;
  formula: number;
  libro: [number, number];
  empirico?: number;
  /** Valore di partenza: l'empirico se c'è, altrimenti la media tra formula e regola del libro. */
  partenza: number;
  avvisoLibro?: string;
}

export function stimeTdee(sesso: 'M' | 'F', pesoKg: number, altezzaCm: number, eta: number, attivita: Attivita, bfPct?: number, tdeeEmpirico?: number): StimeTdee {
  const b = bmr(sesso, pesoKg, altezzaCm, eta);
  const formula = Math.round(b * FATTORI_ATTIVITA[attivita]);
  const libro = tdeeRegolaLibro(sesso, pesoKg);
  const mediaLibro = (libro[0] + libro[1]) / 2;
  const partenza = tdeeEmpirico && tdeeEmpirico > 0 ? Math.round(tdeeEmpirico) : Math.round((formula + mediaLibro) / 2);
  const sogliaBf = sesso === 'M' ? 15 : 24;
  const avvisoLibro = bfPct !== undefined && bfPct > sogliaBf ? 'Con questa percentuale di grasso la regola kg × 32–34 sovrastima: pesa di più la formula.' : undefined;
  return { bmr: b, formula, libro, empirico: tdeeEmpirico, partenza, avvisoLibro };
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

/** Macro in grammi: proteine e grassi per kg, carboidrati con le calorie rimanenti (4/4/9 kcal per g). */
export function macro(obiettivo: Obiettivo, pesoKg: number, kcal: number, gPerKg?: { proteine?: number; grassi?: number }): Macro {
  const d = MACRO_DEFAULT[obiettivo];
  const proteine = Math.round((gPerKg?.proteine ?? d.proteine) * pesoKg);
  const grassi = Math.round((gPerKg?.grassi ?? d.grassi) * pesoKg);
  const carboidrati = Math.max(0, Math.round(((kcal - proteine * 4 - grassi * 9) / 4) * 100) / 100);
  return { proteine, grassi, carboidrati, kcal };
}

/** Durata di default per obiettivo, in settimane/cicli (SPEC_PIANIFICATORE §2). */
export const DURATA_DEFAULT: Record<Obiettivo, number> = { definizione: 4, mantenimento: 12, massa: 17 };
