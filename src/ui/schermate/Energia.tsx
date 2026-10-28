import { useState } from 'preact/hooks';
import type { Attivita, DatiCorporei } from '../../tipi';
import { calorieObiettivo, macro, stimeTdee } from '../../motore/energia';
import { aggiornaDatiCorporei, aggiornaObiettivoAttivo, profilo, stato } from '../../store/stato';
import { Avviso, Scelte } from '../componenti/comuni';
import { NOMI_OBIETTIVO } from './Setup';

const NOMI_ATTIVITA: Record<Attivita, string> = { sedentario: 'Sedentario', leggero: 'Leggero', moderato: 'Moderato', alto: 'Alto' };

/** Sezione Energia (SPEC_PIANIFICATORE §3, §11): dati corporei, tre stime del fabbisogno, calorie e macro sovrascrivibili. */
export function Energia() {
  void stato.value;
  const p = profilo.value!;
  const d = p.datiCorporei ?? { attivita: 'moderato' as Attivita };
  const ob = p.obiettivoAttivo;
  const [eta, setEta] = useState(d.eta ? String(d.eta) : '');
  const [altezza, setAltezza] = useState(d.altezzaCm ? String(d.altezzaCm) : '');
  const [peso, setPeso] = useState(d.pesoKg ? String(d.pesoKg) : '');
  const [bf, setBf] = useState(d.bfPct ? String(d.bfPct) : '');
  const [attivita, setAttivita] = useState<Attivita>(d.attivita);
  const [tdeeEmp, setTdeeEmp] = useState(d.tdeeEmpirico ? String(d.tdeeEmpirico) : '');
  const [kcalOverride, setKcalOverride] = useState(ob?.kcalTarget ? String(ob.kcalTarget) : '');
  const [salvato, setSalvato] = useState(false);
  const [chiusoBmi, setChiusoBmi] = useState(false);

  const salva = async () => {
    const nuovo: DatiCorporei = { eta: parseInt(eta, 10) || undefined, altezzaCm: parseFloat(altezza) || undefined, pesoKg: parseFloat(peso.replace(',', '.')) || undefined, bfPct: parseFloat(bf.replace(',', '.')) || undefined, attivita, tdeeEmpirico: parseInt(tdeeEmp, 10) || undefined };
    await aggiornaDatiCorporei(nuovo);
    const k = parseInt(kcalOverride, 10);
    await aggiornaObiettivoAttivo({ kcalTarget: Number.isFinite(k) && k > 0 ? k : undefined });
    setSalvato(true);
    setTimeout(() => setSalvato(false), 1500);
  };

  const completi = d.eta && d.altezzaCm && d.pesoKg;
  const st = completi ? stimeTdee(p.sesso, d.pesoKg!, d.altezzaCm!, d.eta!, d.attivita, d.bfPct, d.tdeeEmpirico) : null;
  const cal = st && ob ? calorieObiettivo({ obiettivo: ob.tipo, sesso: p.sesso, pesoKg: d.pesoKg!, tdee: st.partenza, bmr: st.bmr, bfPct: d.bfPct, esperienza: p.parametri.esperienza, kgTarget: ob.kgTarget, settimane: ob.settimane }) : null;
  const kcalFinale = ob?.kcalTarget ?? cal?.kcal;
  const m = kcalFinale && d.pesoKg && ob ? macro(ob.tipo, d.pesoKg, kcalFinale) : null;
  const bmi = d.pesoKg && d.altezzaCm ? d.pesoKg / Math.pow(d.altezzaCm / 100, 2) : 0;

  return (
    <div class="colonna" style="gap:12px">
      <p class="muto">Calcolo del fabbisogno con le formule del libro. Indicazioni generali, non una dieta: l'app non conta le calorie né propone pasti.</p>
      <div class="griglia3">
        <div class="campo"><label>Età</label><input type="number" inputMode="numeric" value={eta} onInput={(e) => setEta((e.target as HTMLInputElement).value)} /></div>
        <div class="campo"><label>Altezza (cm)</label><input type="number" inputMode="numeric" value={altezza} onInput={(e) => setAltezza((e.target as HTMLInputElement).value)} /></div>
        <div class="campo"><label>Peso (kg)</label><input type="number" inputMode="decimal" step="0.1" value={peso} onInput={(e) => setPeso((e.target as HTMLInputElement).value)} /></div>
      </div>
      <div class="griglia2">
        <div class="campo"><label>% grasso (facoltativo)</label><input type="number" inputMode="decimal" step="0.5" value={bf} onInput={(e) => setBf((e.target as HTMLInputElement).value)} placeholder="—" /></div>
        <div class="campo"><label>TDEE misurato (facoltativo)</label><input type="number" inputMode="numeric" value={tdeeEmp} onInput={(e) => setTdeeEmp((e.target as HTMLInputElement).value)} placeholder="kcal" /></div>
      </div>
      <div class="campo"><label>Attività quotidiana</label><Scelte valori={['sedentario', 'leggero', 'moderato', 'alto'] as Attivita[]} valore={attivita} onCambia={setAttivita} etichette={NOMI_ATTIVITA} /></div>
      <div class="campo"><label>Calorie obiettivo (lascia vuoto per usare il calcolo)</label><input type="number" inputMode="numeric" value={kcalOverride} onInput={(e) => setKcalOverride((e.target as HTMLInputElement).value)} placeholder={cal ? String(cal.kcal) : '—'} /></div>
      <button class="bottone primario pieno" onClick={salva}>{salvato ? 'Salvato ✓' : 'Salva'}</button>

      {bmi > 29 && !chiusoBmi ? <Avviso>Con un indice di massa corporea sopra 29 il libro consiglia di farsi seguire da un professionista. <button class="bottone piccolo fantasma" onClick={() => setChiusoBmi(true)}>Ok</button></Avviso> : null}

      {st && ob ? (
        <div class="colonna" style="gap:10px">
          <h3>Fabbisogno (TDEE)</h3>
          <div class="griglia3">
            <div class="stat"><div class="valore">{st.bmr}</div><div class="nome">metabolismo basale</div></div>
            <div class="stat"><div class="valore">{st.formula}</div><div class="nome">formula × attività</div></div>
            <div class="stat"><div class="valore">{st.libro[0]}–{st.libro[1]}</div><div class="nome">regola del libro</div></div>
          </div>
          <p class="piccolo">Valore di partenza: <b>{st.partenza} kcal</b>{st.empirico ? ' (misurato)' : ' (media tra formula e regola del libro; errore tipico ±10 %)'}. {st.avvisoLibro ?? ''} Si corregge poi sulla media del peso di due settimane.</p>
          {cal ? (
            <>
              <h3>Calorie per {NOMI_OBIETTIVO[ob.tipo].toLowerCase()}</h3>
              <div class="griglia2">
                <div class="stat"><div class="valore">{kcalFinale}</div><div class="nome">kcal al giorno{ob.kcalTarget ? ' (tue)' : ''}</div></div>
                <div class="stat"><div class="valore">{cal.delta > 0 ? '−' : cal.delta < 0 ? '+' : ''}{Math.abs(cal.delta)}</div><div class="nome">rispetto al fabbisogno</div></div>
              </div>
              <p class="piccolo">Ritmo atteso: {cal.ritmoPct > 0 ? '+' : ''}{Math.round(cal.ritmoPct * 100) / 100} % del peso a settimana{cal.tettoPct ? ` (tetto ${cal.tettoPct * 100} %)` : ''}.{cal.durataMinima ? ` Durata minima ${cal.durataMinima} settimane.` : ''}</p>
              {cal.note.map((n) => <Avviso tipo="info">{n}</Avviso>)}
            </>
          ) : null}
          {m ? (
            <>
              <h3>Macro (grammi al giorno)</h3>
              <div class="griglia3">
                <div class="stat"><div class="valore">{m.proteine}</div><div class="nome">proteine</div></div>
                <div class="stat"><div class="valore">{m.grassi}</div><div class="nome">grassi</div></div>
                <div class="stat"><div class="valore">{Math.round(m.carboidrati)}</div><div class="nome">carboidrati</div></div>
              </div>
              <p class="piccolo">Proteine su almeno 4 pasti da 0,4–0,55 g/kg. 10.000–15.000 passi al giorno, niente HIIT; cardio facoltativo.</p>
            </>
          ) : null}
        </div>
      ) : (
        <p class="piccolo">Inserisci età, altezza e peso per vedere fabbisogno, calorie e macro.</p>
      )}
    </div>
  );
}
