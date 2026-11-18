import type { Blocco, CaricoProfilo, CicloPreservazione, Fase, Obiettivo, ObiettivoAttivo, ParametriGeneratore, Profilo, RisultatoTest, Seduta, Tappa } from '../tipi';
import { contenitorePer } from '../data/contenitori';
import { eserciziPerFase, generaSettimana, nuovoBlocco, nuovoBloccoComposto, primoCicloModificabile, type ProfiloGen } from './generatore';
import { compongoPiano, righeTabella } from './composizione';
import { faseDelCiclo, pianoDimagrimento, trasformaPreservazione } from './preservazione';
import { ENERGIA_PER_OBIETTIVO } from './pianificatore';
import { RECUPERI_DEFAULT } from '../data/tabelle';

// Moduli di programma (SPEC_PIANIFICATORE §4, §6, §7): Preservazione come blocco, cambio obiettivo
// senza test, profilo carichi come fonte dei moduli. Funzioni pure.

export type ProfiloModulo = ProfiloGen & Partial<Pick<Profilo, 'carichi' | 'obiettivoAttivo' | 'parametri'>>;

/** Carichi del profilo trasformati in test del blocco (nessun nuovo test, §7.4). */
export function testDalProfilo(carichi: Record<string, CaricoProfilo> = {}): Record<string, RisultatoTest> {
  const out: Record<string, RisultatoTest> = {};
  for (const c of Object.values(carichi)) {
    out[c.esercizio_id] = { esercizio_id: c.esercizio_id, kg: c.caricoCorrente ?? c.kg, rip: c.rip, modo: c.modo, rm1: c.massimale };
  }
  return out;
}

/** True se il profilo ha carichi aggiornati da non più di `giorni` giorni. */
export function carichiRecenti(carichi: Record<string, CaricoProfilo> = {}, giorni = 42, adesso = Date.now()): boolean {
  const v = Object.values(carichi);
  if (!v.length) return false;
  const ultimo = Math.max(...v.map((c) => new Date(c.data).getTime()));
  return adesso - ultimo <= giorni * 86_400_000;
}

/** Il test iniziale serve solo se manca almeno un esercizio del blocco nel profilo carichi. */
export function serveTest(blocco: Blocco, carichi: Record<string, CaricoProfilo> = {}): boolean {
  const ids = new Set<string>();
  for (const s of blocco.sedute) if (s.fase !== 'test') for (const e of s.esercizi) if (!e.senza_carico && !e.eredita_da) ids.add(e.esercizio_id);
  return [...ids].some((id) => !carichi[id]);
}

/** I tre fondamentali dell'uomo hanno un massimale salvato nel profilo (regola di avvio del Dimagrimento, §4.3). */
export const FONDAMENTALI_UOMO = ['panca_piana', 'squat', 'stacco_da_terra'] as const;
export function massimaliSalvati(carichi: Record<string, CaricoProfilo> = {}): boolean {
  return FONDAMENTALI_UOMO.every((id) => (carichi[id]?.massimale ?? 0) > 0);
}

/**
 * Regola di avvio del Dimagrimento (SPEC_PIANIFICATORE §4.3, soglie dell'utente del 18/11): si parte subito dalla
 * Preservazione solo con allenamento regolare da almeno 1 mese **e** massimali salvati; altrimenti prima 3 cicli di
 * Fase 1 del Blocco 1. Al primo avvio i massimali arrivano dal test della prima settimana, quindi conta solo la regolarità.
 */
export function serveRientro(obiettivo: Pick<ObiettivoAttivo, 'regolare'> | undefined, carichi: Record<string, CaricoProfilo> = {}, primoAvvio = false): boolean {
  if (obiettivo?.regolare === false) return true;
  return primoAvvio ? false : !massimaliSalvati(carichi);
}

/**
 * Blocco di Preservazione (dimagrimento) per `cicli` cicli totali (test e rientro inclusi, §4.3 e §4.4).
 * Senza rientro: sessioni del Blocco 3 (a 4 giorni, altrimenti il contenitore generico) trasformate.
 * Con `rientro`: tutto sul Blocco 1 (stessi esercizi per test, Fase 1 e Preservazione, quindi un solo test copre
 * tutti i carichi): Test + 3 cicli di Fase 1 (righe di tabella 1, 3, 5) + Preservazione con il resto.
 */
export function nuovoBloccoPreservazione(parametri: ParametriGeneratore, profilo: ProfiloModulo, cicli: number, conTest: boolean, numero = 1, ponte = false, rientro = false): Blocco {
  const piano = pianoDimagrimento(cicli, conTest, rientro);
  const numeroSorgente = piano.rientro ? 1 : parametri.N === 4 && parametri.preset === 'uomo_base' ? 3 : numero;
  const settimana = generaSettimana(parametri, profilo, numeroSorgente);
  const id = `p${numero}-${Date.now().toString(36)}`;
  const seq = piano.seq;
  // v2 §4.3/§4.7: stesse serie del blocco; la scala per tempo interviene solo se la seduta stimata supera T.
  const opz = { preferisciMacchine: profilo.obiettivoAttivo?.preferisciMacchine, resistenza: profilo.obiettivoAttivo?.resistenza, T: parametri.T, recuperi: profilo.impostazioni?.recuperi ?? RECUPERI_DEFAULT };
  const sedute: Seduta[] = [];
  let numeroSeduta = 0;
  let ciclo = 0;
  const contaFase: Partial<Record<Fase, number>> = {};
  const aggiungi = (fase: Fase, cicloFase: number, cicloTipo: CicloPreservazione | 'ponte' | undefined, trasforma: (es: Seduta['esercizi'], g: number) => Seduta['esercizi'], extra: Partial<Seduta> = {}) => {
    ciclo++;
    for (let g = 0; g < parametri.N; g++) {
      numeroSeduta++;
      contaFase[fase] = (contaFase[fase] ?? 0) + 1;
      const s = settimana.sessioni[g];
      // Lo scarico della Preservazione è lo scarico del blocco di riferimento, senza modifiche (v2 §4.3).
      const base = eserciziPerFase(s, settimana.contenitore.sessioni[g], fase === 'test' ? 'test' : fase === 'scarico' ? 'scarico' : 'fase1', parametri, profilo.sostituzioni);
      sedute.push({
        id: `${id}-${numeroSeduta}`,
        numero: numeroSeduta,
        fase,
        ciclo,
        cicloFase,
        giorno: g + 1,
        nome: fase === 'test' ? `Test ${contaFase[fase]}` : fase === 'scarico' ? `Scarico ${contaFase[fase]}` : `Seduta ${contaFase[fase]}`,
        etichetta: `${s.nome} · ${s.etichetta}`,
        stato: 'futura',
        esercizi: trasforma(base, g),
        modulo: fase === 'test' ? 'test' : fase === 'scarico' ? 'scarico' : 'preservazione',
        cicloTipo,
        ...extra,
      });
    }
  };
  if (piano.test) aggiungi('test', 1, undefined, (es) => es);
  // Rientro: Fase 1 del Blocco 1 accorciata con la regola dei gradini (§6b), carichi del blocco (nessuna trasformazione).
  const righe = righeTabella(piano.rientro);
  for (let i = 0; i < piano.rientro; i++) aggiungi('fase1', i + 1, undefined, (es) => es, { modulo: 'rientro', rigaTabella: righe[i], bloccoRif: 1 });
  seq.forEach((c, i) => {
    const fase = faseDelCiclo(c);
    const cicloFase = seq.slice(0, i + 1).filter((x) => x === c).length;
    aggiungi(fase, cicloFase, ponte && i === 0 && !piano.rientro ? 'ponte' : c, (es) => trasformaPreservazione(es, c, opz, parametri.esclusi));
  });
  const energia = profilo.obiettivoAttivo?.energia ?? ENERGIA_PER_OBIETTIVO.definizione;
  const tappe: Tappa[] = [];
  if (piano.test) tappe.push({ modulo: 'test', obiettivo: 'definizione', cicli: 1, energia });
  if (piano.rientro) tappe.push({ modulo: 'rientro', obiettivo: 'definizione', cicli: piano.rientro, energia, fase: 'fase1', bloccoRif: 1 });
  tappe.push({ modulo: 'preservazione', obiettivo: 'definizione', cicli: seq.length, energia, cicliPreservazione: seq });
  return {
    id,
    numero,
    stato: piano.test ? 'test' : 'in_corso',
    contenitore_id: settimana.contenitore.id,
    sedute,
    test: piano.test ? {} : testDalProfilo(profilo.carichi),
    correzioni: {},
    parametri: { ...parametri, priorita: [...parametri.priorita], esclusi: [...parametri.esclusi] },
    creato: new Date().toISOString(),
    modulo: 'preservazione',
    tappe,
  };
}

/**
 * Blocco di massa o mantenimento, con o senza test; il primo ciclo di lavoro può essere marcato "ponte".
 * Con `cicli` (durata richiesta, Test incluso) il programma è composto su misura (SPEC_PIANIFICATORE v2 §6b);
 * senza, resta il blocco di riferimento intero (o breve) come prima.
 */
export function nuovoBloccoIpertrofia(parametri: ParametriGeneratore, profilo: ProfiloModulo, obiettivo: 'massa' | 'mantenimento', conTest: boolean, numero: number, ponte = false, cicli?: number): Blocco {
  const energia = profilo.obiettivoAttivo?.energia ?? ENERGIA_PER_OBIETTIVO[obiettivo];
  if (cicli && cicli > 0) {
    const comp = compongoPiano(cicli, conTest, obiettivo, obiettivo === 'mantenimento' ? parametri.bloccoBase ?? 1 : 1);
    const b = nuovoBloccoComposto(parametri, profilo, comp, numero);
    let sedute = b.sedute.map((s) => ({ ...s, modulo: (s.fase === 'test' ? 'test' : s.fase === 'scarico' ? 'scarico' : obiettivo === 'mantenimento' ? 'mantenimento' : 'ipertrofia') as Seduta['modulo'] }));
    if (ponte) {
      const primo = sedute.find((s) => s.fase !== 'test')?.ciclo;
      sedute = sedute.map((s) => (s.ciclo === primo ? { ...s, cicloTipo: 'ponte' } : s));
    }
    const tappe: Tappa[] = comp.map((s) => ({ modulo: s.fase === 'test' ? 'test' : s.fase === 'scarico' ? 'scarico' : obiettivo === 'mantenimento' ? 'mantenimento' : 'ipertrofia', obiettivo, cicli: s.cicli, energia, fase: s.fase, bloccoRif: s.bloccoRif }));
    return { ...b, sedute, stato: sedute[0]?.fase === 'test' ? 'test' : 'in_corso', test: conTest ? {} : testDalProfilo(profilo.carichi), modulo: obiettivo === 'mantenimento' ? 'mantenimento' : 'ipertrofia', tappe };
  }
  const par = { ...parametri, bloccoBreve: obiettivo === 'mantenimento' ? true : parametri.bloccoBreve };
  const b = nuovoBlocco(par, profilo, numero);
  let sedute = b.sedute.map((s) => ({ ...s, modulo: (s.fase === 'test' ? 'test' : s.fase === 'scarico' ? 'scarico' : obiettivo === 'mantenimento' ? 'mantenimento' : 'ipertrofia') as Seduta['modulo'] }));
  if (!conTest) {
    sedute = sedute.filter((s) => s.fase !== 'test').map((s, i) => ({ ...s, numero: i + 1, id: `${b.id}-${i + 1}`, ciclo: s.ciclo - 1 }));
  }
  if (ponte) {
    const primo = sedute.find((s) => s.fase !== 'test')?.ciclo;
    sedute = sedute.map((s) => (s.ciclo === primo ? { ...s, cicloTipo: 'ponte' } : s));
  }
  const cicliLavoro = new Set(sedute.filter((s) => s.fase !== 'test' && s.fase !== 'scarico').map((s) => s.ciclo)).size;
  const tappe: Tappa[] = [];
  if (conTest) tappe.push({ modulo: 'test', obiettivo, cicli: 1, energia });
  tappe.push({ modulo: obiettivo === 'mantenimento' ? 'mantenimento' : 'ipertrofia', obiettivo, cicli: cicliLavoro, energia });
  tappe.push({ modulo: 'scarico', obiettivo, cicli: 1, energia });
  return { ...b, sedute, stato: conTest ? 'test' : 'in_corso', test: conTest ? {} : testDalProfilo(profilo.carichi), modulo: obiettivo === 'mantenimento' ? 'mantenimento' : 'ipertrofia', tappe };
}

/** Profilo donna a sedute ibride (§12b): preset donna a 3 sedute. */
export function eIbrido(parametri: Pick<ParametriGeneratore, 'preset' | 'N'>): boolean {
  return parametri.preset === 'donna_glutei' && parametri.N === 3;
}

/** Parametri con l'obiettivo del profilo ibrido (§12b): "massa" non esiste per lei e vale come mantenimento e costruzione. */
export function parametriPerObiettivo(parametri: ParametriGeneratore, tipo: Obiettivo): ParametriGeneratore {
  if (!eIbrido(parametri)) return parametri;
  return { ...parametri, obiettivoIbrido: tipo === 'definizione' ? 'definizione' : 'mantenimento', bloccoBreve: true, bloccoBase: undefined };
}

/**
 * Blocco del profilo donna a sedute ibride (§12b): stesso piano su misura del Mantenimento (Fase 1, Fase 2, scarico,
 * nuovo test a fine blocco) con le sedute A-B-C. L'obiettivo cambia solo la parte classica e i tempi del circuito.
 */
export function nuovoBloccoIbrido(parametri: ParametriGeneratore, profilo: ProfiloModulo, tipo: Obiettivo, conTest: boolean, numero: number, ponte = false, cicli = 13): Blocco {
  const par = parametriPerObiettivo(parametri, tipo);
  const b = nuovoBloccoIpertrofia(par, profilo, 'mantenimento', conTest, numero, ponte, cicli);
  const obiettivo: Obiettivo = tipo === 'definizione' ? 'definizione' : 'mantenimento';
  const energia = ENERGIA_PER_OBIETTIVO[obiettivo];
  return { ...b, tappe: b.tappe?.map((t) => ({ ...t, obiettivo, energia })) };
}

export interface EsitoCambio {
  /** Blocco in corso, chiuso al confine di ciclo (le sedute oltre vengono tolte). */
  chiuso: Blocco;
  nuovo: Blocco;
  perche: string;
}

/**
 * Cambio di obiettivo (SPEC_PIANIFICATORE §6): chiude il blocco al confine di ciclo (o subito, con `subito`)
 * e apre il blocco del nuovo modulo senza test, primo ciclo "ponte". Carichi del profilo e sedute passate intatti.
 */
export function cambiaObiettivo(blocco: Blocco, profilo: ProfiloModulo, obiettivo: ObiettivoAttivo, subito = false): EsitoCambio {
  const daCiclo = primoCicloModificabile(blocco);
  const confine = subito ? Math.max(1, daCiclo - 1) : daCiclo - 1;
  const tenute = blocco.sedute.filter((s) => s.ciclo <= confine || s.stato !== 'futura');
  const chiuso: Blocco = { ...blocco, sedute: tenute, stato: 'completato' };
  const parametri = profilo.parametri ?? blocco.parametri;
  const numero = blocco.numero + 1;
  const profiloConObiettivo: ProfiloModulo = { ...profilo, obiettivoAttivo: obiettivo };
  const carichi = profilo.carichi ?? {};
  let nuovo: Blocco;
  if (eIbrido(parametri)) {
    // Profilo ibrido (§12b): si cambia obiettivo in corsa senza rifare il test.
    const tentativo = nuovoBloccoIbrido(parametri, profiloConObiettivo, obiettivo.tipo, false, numero, true, obiettivo.settimane);
    nuovo = serveTest(tentativo, carichi) && !carichiRecenti(carichi) ? nuovoBloccoIbrido(parametri, profiloConObiettivo, obiettivo.tipo, true, numero, false, obiettivo.settimane) : tentativo;
  } else if (obiettivo.tipo === 'definizione') {
    // Regola di avvio (§4.3): senza allenamento regolare o senza massimali salvati, prima 3 cicli di Fase 1.
    const rientro = serveRientro(obiettivo, carichi);
    const tentativo = nuovoBloccoPreservazione(parametri, profiloConObiettivo, obiettivo.settimane, false, numero, true, rientro);
    nuovo = !Object.keys(carichi).length || (rientro && serveTest(tentativo, carichi)) ? nuovoBloccoPreservazione(parametri, profiloConObiettivo, obiettivo.settimane, true, numero, false, rientro) : tentativo;
  } else {
    const bloccoNuovo = nuovoBloccoIpertrofia(parametri, profiloConObiettivo, obiettivo.tipo, false, numero, true, obiettivo.settimane);
    nuovo = serveTest(bloccoNuovo, carichi) && !carichiRecenti(carichi) ? nuovoBloccoIpertrofia(parametri, profiloConObiettivo, obiettivo.tipo, true, numero, false, obiettivo.settimane) : bloccoNuovo;
  }
  return {
    chiuso,
    nuovo,
    perche: `Il blocco ${blocco.numero} si chiude al ciclo ${confine}; il nuovo modulo parte con un ciclo ponte ai carichi del profilo, senza rifare i test.`,
  };
}

/** Contenitore usato dal modulo, per l'anteprima. */
export function contenitoreModulo(parametri: ParametriGeneratore, numeroBlocco: number) {
  return contenitorePer(parametri.N, parametri.preset, numeroBlocco);
}
