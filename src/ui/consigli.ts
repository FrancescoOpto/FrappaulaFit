import type { Stato } from '../tipi';
import { ESERCIZI_PER_ID } from '../data/esercizi';
import { avvisoEnergia, mediePesoSettimanali, trendCarichi, valutaCirconferenze, valutaPeso, type Consiglio } from '../motore/coach';
import { calorieObiettivo, stimeTdee } from '../motore/energia';
import { impostazioniDi } from '../store/stato';

// Consigli del coach per la Home (SPEC_PIANIFICATORE §8): propone e spiega, in base a stato, peso e carichi.

export function consigli(stato: Stato): Consiglio[] {
  const p = stato.profilo;
  const b = stato.blocco;
  if (!p) return [];
  const out: Consiglio[] = [];
  const ob = p.obiettivoAttivo;
  const disattivate = p.regole_disattivate ?? [];
  if (ob) {
    const e = avvisoEnergia(ob.tipo, ob.energia, p.parametri.esperienza);
    if (e && !ob.avvisoDeficitIgnorato) out.push(e);
    const d = p.datiCorporei;
    if (d?.pesoKg && d.altezzaCm && d.eta) {
      const st = stimeTdee({ sesso: p.sesso, pesoKg: d.pesoKg, altezzaCm: d.altezzaCm, eta: d.eta, passiGiorno: d.passiGiorno, allenamentiSettimana: d.allenamentiSettimana ?? p.parametri.N, durataMin: d.durataSedutaMin ?? p.parametri.T, bfPct: d.bfPct, tdeeEmpirico: d.tdeeEmpirico });
      const cal = calorieObiettivo({ obiettivo: ob.tipo, sesso: p.sesso, pesoKg: d.pesoKg, tdee: st.partenza, bmr: st.bmr, bfPct: d.bfPct, esperienza: p.parametri.esperienza, kgTarget: ob.kgTarget, settimane: ob.settimane });
      const peso = valutaPeso(mediePesoSettimanali(stato.checkin), ob.tipo, cal.ritmoPct, cal.tettoPct);
      if (peso) out.push(peso);
    }
    if (ob.tipo === 'definizione') {
      const c = valutaCirconferenze(stato.checkin);
      if (c) out.push(c);
    }
  }
  if (b) {
    // Trend carichi sui fondamentali e Target: kg×rip per seduta completata, ultime tre.
    const perEs = new Map<string, number[]>();
    for (const s of b.sedute) {
      if (s.stato !== 'completata' || s.fase === 'test') continue;
      const reg = stato.registro[s.id];
      if (!reg) continue;
      for (const e of s.esercizi) {
        if (!['R1', 'R2', 'R3', 'L'].includes(e.ruolo) || e.seconda_riga) continue;
        const r = reg.esercizi[e.slot];
        if (!r) continue;
        const vol = r.serie.filter((x) => x.fatta && !x.stripping).reduce((a, x) => a + (x.kg ?? x.kg_prev) * (x.rip ?? x.rip_prev), 0);
        if (vol > 0) perEs.set(e.esercizio_id, [...(perEs.get(e.esercizio_id) ?? []), vol]);
      }
    }
    for (const [id, v] of perEs) {
      const t = trendCarichi(ESERCIZI_PER_ID[id]?.nome ?? id, v);
      if (t) out.push(t);
    }
    for (const n of (b.note ?? []).slice(-2)) out.push({ regola: 'carico_ricalcolo', livello: 'info', testo: n.testo, perche: n.perche ?? '' });
  }
  void impostazioniDi;
  return out.filter((c) => !disattivate.includes(c.regola));
}
