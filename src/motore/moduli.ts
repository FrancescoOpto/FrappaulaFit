import type { Blocco, CaricoProfilo, CicloPreservazione, Fase, ObiettivoAttivo, ParametriGeneratore, Profilo, RisultatoTest, Seduta, Tappa } from '../tipi';
import { contenitorePer } from '../data/contenitori';
import { eserciziPerFase, generaSettimana, nuovoBlocco, nuovoBloccoComposto, primoCicloModificabile, type ProfiloGen } from './generatore';
import { compongoPiano } from './composizione';
import { faseDelCiclo, sequenzaPreservazione, trasformaPreservazione } from './preservazione';
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

/**
 * Blocco di Preservazione (dimagrimento): `cicli` cicli trasformati dalle sessioni del programma di riferimento
 * (Blocco 3 a 4 giorni, altrimenti il contenitore generico). Con `conTest` aggiunge la settimana di test.
 */
export function nuovoBloccoPreservazione(parametri: ParametriGeneratore, profilo: ProfiloModulo, cicli: number, conTest: boolean, numero = 1, ponte = false): Blocco {
  const numeroSorgente = parametri.N === 4 && parametri.preset === 'uomo_base' ? 3 : numero;
  const settimana = generaSettimana(parametri, profilo, numeroSorgente);
  const id = `p${numero}-${Date.now().toString(36)}`;
  const seq = sequenzaPreservazione(Math.max(1, cicli));
  // v2 §4.3/§4.7: stesse serie del blocco; la scala per tempo interviene solo se la seduta stimata supera T.
  const opz = { preferisciMacchine: profilo.obiettivoAttivo?.preferisciMacchine, resistenza: profilo.obiettivoAttivo?.resistenza, T: parametri.T, recuperi: profilo.impostazioni?.recuperi ?? RECUPERI_DEFAULT };
  const sedute: Seduta[] = [];
  let numeroSeduta = 0;
  let ciclo = 0;
  const contaFase: Partial<Record<Fase, number>> = {};
  const aggiungi = (fase: Fase, cicloFase: number, cicloTipo: CicloPreservazione | 'ponte' | undefined, trasforma: (es: Seduta['esercizi'], g: number) => Seduta['esercizi']) => {
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
      });
    }
  };
  if (conTest) aggiungi('test', 1, undefined, (es) => es);
  seq.forEach((c, i) => {
    const fase = faseDelCiclo(c);
    const cicloFase = seq.slice(0, i + 1).filter((x) => x === c).length;
    aggiungi(fase, cicloFase, ponte && i === 0 ? 'ponte' : c, (es) => trasformaPreservazione(es, c, opz, parametri.esclusi));
  });
  const energia = profilo.obiettivoAttivo?.energia ?? ENERGIA_PER_OBIETTIVO.definizione;
  const tappe: Tappa[] = [];
  if (conTest) tappe.push({ modulo: 'test', obiettivo: 'definizione', cicli: 1, energia });
  tappe.push({ modulo: 'preservazione', obiettivo: 'definizione', cicli: seq.length, energia, cicliPreservazione: seq });
  return {
    id,
    numero,
    stato: conTest ? 'test' : 'in_corso',
    contenitore_id: settimana.contenitore.id,
    sedute,
    test: conTest ? {} : testDalProfilo(profilo.carichi),
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
  if (obiettivo.tipo === 'definizione') {
    nuovo = nuovoBloccoPreservazione(parametri, profiloConObiettivo, obiettivo.settimane, !Object.keys(carichi).length, numero, true);
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
