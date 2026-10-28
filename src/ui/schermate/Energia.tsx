import { useState } from 'preact/hooks';
import type { DatiCorporei } from '../../tipi';
import { PASSI_DEFAULT, PASSI_MAX, PASSI_MIN, PASSO_STEPPER, calorieObiettivo, macro, stimeTdee } from '../../motore/energia';
import { aggiornaDatiCorporei, aggiornaObiettivoAttivo, profilo, stato } from '../../store/stato';
import { Avviso, Stepper } from '../componenti/comuni';
import { NOMI_OBIETTIVO } from './Setup';

/**
 * Sezione Energia (SPEC_PIANIFICATORE v2 §3.1, §11): mini calcolatore TDEE con passi (stepper da 1.000)
 * e allenamenti a settimana, BMR, TDEE del modello e regola del libro, calorie obiettivo, macro; campi sovrascrivibili.
 */
export function Energia() {
  void stato.value;
  const p = profilo.value!;
  const d: DatiCorporei = p.datiCorporei ?? {};
  const ob = p.obiettivoAttivo;
  const [eta, setEta] = useState(d.eta ? String(d.eta) : '');
  const [altezza, setAltezza] = useState(d.altezzaCm ? String(d.altezzaCm) : '');
  const [peso, setPeso] = useState(d.pesoKg ? String(d.pesoKg) : '');
  const [bf, setBf] = useState(d.bfPct ? String(d.bfPct) : '');
  const [passi, setPassi] = useState<number>(d.passiGiorno ?? PASSI_DEFAULT);
  const [allenamenti, setAllenamenti] = useState<number>(d.allenamentiSettimana ?? p.parametri.N);
  const [durata, setDurata] = useState<number>(d.durataSedutaMin ?? p.parametri.T);
  const [tdeeEmp, setTdeeEmp] = useState(d.tdeeEmpirico ? String(d.tdeeEmpirico) : '');
  const [kcalOverride, setKcalOverride] = useState(ob?.kcalTarget ? String(ob.kcalTarget) : '');
  const [salvato, setSalvato] = useState(false);
  const [chiusoBmi, setChiusoBmi] = useState(false);

  const salva = async () => {
    const nuovo: DatiCorporei = {
      eta: parseInt(eta, 10) || undefined,
      altezzaCm: parseFloat(altezza) || undefined,
      pesoKg: parseFloat(peso.replace(',', '.')) || undefined,
      bfPct: parseFloat(bf.replace(',', '.')) || undefined,
      passiGiorno: passi,
      allenamentiSettimana: allenamenti,
      durataSedutaMin: durata,
      tdeeEmpirico: parseInt(tdeeEmp, 10) || undefined,
    };
    await aggiornaDatiCorporei(nuovo);
    const k = parseInt(kcalOverride, 10);
    await aggiornaObiettivoAttivo({ kcalTarget: Number.isFinite(k) && k > 0 ? k : undefined });
    setSalvato(true);
    setTimeout(() => setSalvato(false), 1500);
  };

  // Anteprima dal vivo con i valori digitati (anche prima di salvare).
  const vEta = parseInt(eta, 10), vAlt = parseFloat(altezza), vPeso = parseFloat(peso.replace(',', '.')), vBf = parseFloat(bf.replace(',', '.')), vEmp = parseInt(tdeeEmp, 10);
  const completi = vEta > 0 && vAlt > 0 && vPeso > 0;
  const st = completi ? stimeTdee({ sesso: p.sesso, pesoKg: vPeso, altezzaCm: vAlt, eta: vEta, passiGiorno: passi, allenamentiSettimana: allenamenti, durataMin: durata, bfPct: vBf > 0 ? vBf : undefined, tdeeEmpirico: vEmp > 0 ? vEmp : undefined }) : null;
  const cal = st && ob ? calorieObiettivo({ obiettivo: ob.tipo, sesso: p.sesso, pesoKg: vPeso, tdee: st.partenza, bmr: st.bmr, bfPct: vBf > 0 ? vBf : undefined, esperienza: p.parametri.esperienza, kgTarget: ob.kgTarget, settimane: ob.settimane }) : null;
  const kcalFinale = (parseInt(kcalOverride, 10) > 0 ? parseInt(kcalOverride, 10) : undefined) ?? cal?.kcal;
  const m = kcalFinale && vPeso > 0 && ob ? macro(ob.tipo, vPeso, kcalFinale) : null;
  const bmi = vPeso > 0 && vAlt > 0 ? vPeso / Math.pow(vAlt / 100, 2) : 0;
  const fmtPassi = (v: number) => v.toLocaleString('it-IT');

  return (
    <div class="colonna" style="gap:14px">
      <p class="muto">Fabbisogno stimato con un modello semplice: metabolismo basale, vita quotidiana, passi e allenamenti. Indicazioni generali, non una dieta: l'app non conta le calorie né propone pasti.</p>
      <div class="griglia3">
        <div class="campo"><label>Età</label><input type="number" inputMode="numeric" value={eta} onInput={(e) => setEta((e.target as HTMLInputElement).value)} /></div>
        <div class="campo"><label>Altezza (cm)</label><input type="number" inputMode="numeric" value={altezza} onInput={(e) => setAltezza((e.target as HTMLInputElement).value)} /></div>
        <div class="campo"><label>Peso (kg)</label><input type="number" inputMode="decimal" step="0.1" value={peso} onInput={(e) => setPeso((e.target as HTMLInputElement).value)} /></div>
      </div>
      <div class="campo">
        <label>Passi al giorno (quelli reali, non l'obiettivo)</label>
        <Stepper valore={passi} min={PASSI_MIN} max={PASSI_MAX} passo={PASSO_STEPPER} onCambia={setPassi} formato={fmtPassi} etichettaAria="Passi al giorno" />
      </div>
      <div class="griglia2">
        <div class="campo">
          <label>Allenamenti a settimana</label>
          <Stepper valore={allenamenti} min={0} max={7} passo={1} onCambia={setAllenamenti} etichettaAria="Allenamenti a settimana" />
        </div>
        <div class="campo">
          <label>Durata seduta (min)</label>
          <Stepper valore={durata} min={30} max={120} passo={5} onCambia={setDurata} etichettaAria="Durata della seduta" />
        </div>
      </div>
      <div class="griglia2">
        <div class="campo"><label>% grasso (facoltativo)</label><input type="number" inputMode="decimal" step="0.5" value={bf} onInput={(e) => setBf((e.target as HTMLInputElement).value)} placeholder="—" /></div>
        <div class="campo"><label>TDEE misurato (facoltativo)</label><input type="number" inputMode="numeric" value={tdeeEmp} onInput={(e) => setTdeeEmp((e.target as HTMLInputElement).value)} placeholder="kcal" /></div>
      </div>
      <p class="piccolo">Il TDEE misurato (10–14 giorni di conteggio calorie a peso stabile) prevale sul modello.</p>
      <div class="campo"><label>Calorie obiettivo (lascia vuoto per usare il calcolo)</label><input type="number" inputMode="numeric" value={kcalOverride} onInput={(e) => setKcalOverride((e.target as HTMLInputElement).value)} placeholder={cal ? String(cal.kcal) : '—'} /></div>
      <button class="bottone primario pieno" onClick={salva}>{salvato ? 'Salvato ✓' : 'Salva'}</button>

      {bmi > 29 && !chiusoBmi ? <Avviso>Con un indice di massa corporea sopra 29 il libro consiglia di farsi seguire da un professionista. <button class="bottone piccolo fantasma" onClick={() => setChiusoBmi(true)}>Ok</button></Avviso> : null}

      {st && ob ? (
        <div class="colonna" style="gap:10px">
          <h3>Fabbisogno (TDEE)</h3>
          <div class="griglia3">
            <div class="stat"><div class="valore">{st.bmr}</div><div class="nome">metabolismo basale{st.katch ? ' (massa magra)' : ''}</div></div>
            <div class="stat"><div class="valore">{st.modello}</div><div class="nome">modello passi + allenamenti</div></div>
            <div class="stat"><div class="valore">{st.libro[0]}–{st.libro[1]}</div><div class="nome">regola del libro</div></div>
          </div>
          <p class="piccolo">
            Vita quotidiana +{st.voci.vita} · passi +{st.voci.passi} · allenamenti +{st.voci.allenamento} · effetto termico +{st.voci.termico} kcal.
            Valore usato: <b>{st.partenza} kcal</b>{st.empirico ? ' (misurato)' : ' (errore tipico ±10–15 %)'}. {st.avvisoLibro ?? ''} Si corregge poi sulla media del peso di due settimane.
          </p>
          {cal ? (
            <>
              <h3>Calorie per {NOMI_OBIETTIVO[ob.tipo].toLowerCase()}</h3>
              <div class="griglia2">
                <div class="stat"><div class="valore">{kcalFinale}</div><div class="nome">kcal al giorno{parseInt(kcalOverride, 10) > 0 ? ' (tue)' : ''}</div></div>
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
                <div class="stat"><div class="valore">{m.carboidrati}</div><div class="nome">carboidrati</div></div>
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
