import type { RegolaCoach } from '../tipi';

// Motore "coach" (SPEC §14): regole esplicite e spiegabili. Per ora solo la struttura dati:
// ogni regola ha una fonte (`metodo` = app/libro di riferimento, `ipotesi` = scelta nostra) e il "perché"
// in una riga. Le regole `ipotesi` potranno essere disattivate dalle Impostazioni (profilo.regole_disattivate).

export const REGOLE_COACH: RegolaCoach[] = [
  { id: 'stima_brzycki', sezione: 'test', fonte: 'metodo', titolo: 'Massimale stimato dal test', perche: 'Reps e carico di una prova danno il massimale con la formula di Brzycki; con 3–5 ripetizioni la stima è affidabile.' },
  { id: 'serie_unica', sezione: 'test', fonte: 'metodo', titolo: 'Serie unica a N RM per Target e complementari', perche: 'N = ripetizioni di lavoro della Fase 1 + 2; il carico del test resta fisso per tutto il blocco.' },
  { id: 'fattore_lavoro', sezione: 'carichi', fonte: 'metodo', titolo: 'Carichi RM al 90 % del massimale stimato', perche: 'Nei video i carichi dei fondamentali valgono 0,9 × stima × (37−n)/36.' },
  { id: 'scala_rm', sezione: 'carichi', fonte: 'metodo', titolo: 'Scala 9RM → 7RM → 5RM → 3RM', perche: 'Fase 1 parte a 9RM, sale a 7RM al ciclo 4; Fase 3 a 5RM con picco 3RM; scarico a 11RM.' },
  { id: 'tabelle_slot', sezione: 'struttura', fonte: 'metodo', titolo: 'Progressione serie×rip per slot', perche: 'La tabella dipende dall’esercizio nello slot (R1, R2, R3, R3b, R3c, AB), non dal gruppo muscolare.' },
  { id: 'varianti_fase', sezione: 'struttura', fonte: 'metodo', titolo: 'Varianti dei complementari per fase', perche: 'In Fase 2 e 3 cambiano gli esercizi complementari, non le serie×rip dello slot.' },
  { id: 'rotazione_guida', sezione: 'struttura', fonte: 'metodo', titolo: 'La guida del gruppo ruota a ogni blocco', perche: 'Spalle: military nel Blocco 1, spinte manubri seduto nel Blocco 2; serve un’alternativa equivalente.' },
  { id: 'carico_corrente', sezione: 'carichi', fonte: 'metodo', titolo: 'Il kg che scrivi resta per le sedute successive', perche: 'Descritto dall’utente sull’app di riferimento (SPEC §9.2b).' },
  { id: 'autocorrezione_serie', sezione: 'carichi', fonte: 'ipotesi', titolo: 'Serie successiva a −5 % se mancano ripetizioni', perche: 'Evita di ripetere una serie fallita con lo stesso carico; scelta nostra.' },
  { id: 'autocorrezione_ciclo', sezione: 'carichi', fonte: 'ipotesi', titolo: 'Carico del ciclo dopo a −2,5 % dopo due sedute mancate', perche: 'Le 4×5@5RM della Fase 3 non sono sempre sostenibili; scelta nostra.' },
  { id: 'copertura_sottogruppi', sezione: 'struttura', fonte: 'ipotesi', titolo: 'Almeno 4 serie dirette a settimana per sottogruppo', perche: 'Femorali, spalle posteriori, ecc. non devono restare scoperti nei contenitori generici.' },
  { id: 'taglio_tempo', sezione: 'struttura', fonte: 'ipotesi', titolo: 'Tagli ai complementari se la seduta supera il tempo', perche: 'Prima una serie ai complementari, poi quelli non prioritari; mai i fondamentali.' },
  { id: 'rientro_pausa', sezione: 'stato', fonte: 'metodo', titolo: 'Rientro dopo una pausa', perche: 'Dal libro: fino a 1 settimana riprendi, 2 ripeti l’ultimo ciclo, 3 rifai il primo, oltre kick-off.' },
  { id: 'ritest_pausa_lunga', sezione: 'stato', fonte: 'ipotesi', titolo: 'Nuovo test dopo oltre 3 settimane di stop', perche: 'Il massimale del test non vale più: scelta nostra.' },
  { id: 'stripping', sezione: 'struttura', fonte: 'ipotesi', titolo: 'Stripping −30 % in Fase 2', perche: 'Dalle note Keep, non visto nei video: spento di default.' },
];

export function regoleAttive(disattivate: string[] = []): RegolaCoach[] {
  return REGOLE_COACH.filter((r) => r.fonte === 'metodo' || !disattivate.includes(r.id));
}
