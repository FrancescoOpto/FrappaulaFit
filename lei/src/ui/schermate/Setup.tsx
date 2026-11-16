import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Esperienza, Obiettivo, Tema } from '../../tipi';
import { ESERCIZI_PER_ID } from '../../data/esercizi';
import { SEDUTE } from '../../data/programma';
import { MESI_DURATA, componi, descrivi, settimaneDaMesi, sigla } from '../../motore/calendario';
import { PASSI_DEFAULT, PASSI_MAX, PASSI_MIN, PASSO_STEPPER } from '../../motore/energia';
import { creaProfilo } from '../../store/stato';
import { Avviso, Scelte, Stepper } from '../componenti/comuni';
import { Icona } from '../componenti/IconaEsercizio';
import { DESCRIZIONE_OBIETTIVO, NOMI_OBIETTIVO } from '../etichette';
import { applicaTema } from '../tema';
import { vai } from '../router';

// Primo avvio: poche domande, poi il programma del libro su 3 sedute (docs/PROPOSTA_PROGRAMMA_DONNA.md).

/** Livello "intermedia" del libro (p.218): 5 ripetizioni corrette con questi multipli del peso corporeo. */
export const SOGLIE_INTERMEDIA = { squat: [0.65, 0.75], stacco: [0.9, 1], hip_thrust: [1.2, 1.3] } as const;

export function Setup() {
  const [nome, setNome] = useState('');
  const [esperienza, setEsperienza] = useState<Esperienza>('intermedio');
  const [obiettivo, setObiettivo] = useState<Obiettivo>('mantenimento');
  const [mesi, setMesi] = useState<number>(6);
  const [T, setT] = useState<number>(75);
  const [pha, setPha] = useState(false);
  const [tema, setTema] = useState<Tema>(() => {
    try {
      return localStorage.getItem('frappaula-lei-tema') === 'chiaro' ? 'chiaro' : 'scuro';
    } catch {
      return 'scuro';
    }
  });
  const [mostraCorpo, setMostraCorpo] = useState(false);
  const [eta, setEta] = useState('');
  const [altezza, setAltezza] = useState('');
  const [peso, setPeso] = useState('');
  const [bf, setBf] = useState('');
  const [passi, setPassi] = useState<number>(PASSI_DEFAULT);
  const [mostraSedute, setMostraSedute] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => applicaTema(tema), [tema]);

  const settimane = settimaneDaMesi(mesi);
  const comp = useMemo(() => componi(settimane, true), [settimane]);
  const pesoKg = parseFloat(peso.replace(',', '.'));

  const conferma = async () => {
    if (!nome.trim()) return;
    setSalvando(true);
    await creaProfilo({
      nome: nome.trim(),
      esperienza,
      obiettivo,
      mesi,
      impostazioni: { T, phaDefault: pha, tema },
      datiCorporei: mostraCorpo ? { eta: parseInt(eta, 10) || undefined, altezzaCm: parseFloat(altezza) || undefined, pesoKg: pesoKg || undefined, bfPct: parseFloat(bf.replace(',', '.')) || undefined, passiGiorno: passi } : undefined,
    });
    setSalvando(false);
    vai('/');
  };

  return (
    <div class="pagina">
      <div class="colonna" style="gap:10px;margin-top:12px">
        <div class="eyebrow">Frappaula Fit · Lei</div>
        <h1>Impostiamo il programma</h1>
        <p class="muto">Tre sedute a settimana: glutei con il programma per intermedi del libro "Glutei", più la parte alta con il dorso in tutte le sedute. Tutto si può cambiare dopo, dalle Impostazioni.</p>
      </div>

      <div class="carta">
        <div class="campo">
          <label>Come ti chiami?</label>
          <input type="text" value={nome} onInput={(e) => setNome((e.target as HTMLInputElement).value)} placeholder="Nome" autocomplete="given-name" />
        </div>
        <div class="campo">
          <label>Tema</label>
          <Scelte valori={['scuro', 'chiaro'] as Tema[]} valore={tema} onCambia={setTema} etichette={{ scuro: 'Scuro', chiaro: 'Chiaro' }} />
        </div>
      </div>

      <div class="carta">
        <h2>Obiettivo e durata</h2>
        <div class="campo">
          <label>Che obiettivo hai?</label>
          <Scelte valori={['definizione', 'mantenimento'] as Obiettivo[]} valore={obiettivo} onCambia={setObiettivo} etichette={NOMI_OBIETTIVO} />
          <p class="piccolo">{DESCRIZIONE_OBIETTIVO[obiettivo]} Si può cambiare in corsa senza rifare il test.</p>
        </div>
        <div class="campo">
          <label>Per quanto tempo?</label>
          <Scelte valori={[...MESI_DURATA]} valore={mesi} onCambia={setMesi} etichette={{ 3: '3 mesi', 6: '6 mesi', 9: '9 mesi', 12: '12 mesi' }} />
          <p class="piccolo">{mesi} mesi ≈ {settimane} settimane, {settimane * 3} sedute. Il programma del libro dura 18 settimane più test e scarichi: con 6 mesi lo fai tutto; con 3 mesi le fasi si accorciano a {componi(settimaneDaMesi(3), true).filter((x) => x.fase.startsWith('fase')).map((x) => x.settimane).join(' + ')} settimane.</p>
          <p><b>{descrivi(comp)}</b> <span class="piccolo">({sigla(comp)})</span></p>
        </div>
      </div>

      <div class="carta">
        <h2>Come ti alleni</h2>
        <div class="campo">
          <label>Esperienza</label>
          <Scelte valori={['principiante', 'intermedio', 'avanzato'] as Esperienza[]} valore={esperienza} onCambia={setEsperienza} etichette={{ principiante: 'Principiante', intermedio: 'Intermedia', avanzato: 'Avanzata' }} />
          <p class="piccolo">Per il libro sei intermedia se fai 5 ripetizioni corrette di squat con {SOGLIE_INTERMEDIA.squat.join('–').replace(/\./g, ',')} volte il tuo peso, stacco con {SOGLIE_INTERMEDIA.stacco.join('–').replace(/\./g, ',')} e hip thrust con {SOGLIE_INTERMEDIA.hip_thrust.join('–').replace(/\./g, ',')}{pesoKg > 0 ? ` (con ${pesoKg} kg: squat ${Math.round(pesoKg * 0.65)}–${Math.round(pesoKg * 0.75)}, stacco ${Math.round(pesoKg * 0.9)}–${Math.round(pesoKg)}, hip thrust ${Math.round(pesoKg * 1.2)}–${Math.round(pesoKg * 1.3)} kg)` : ''}.</p>
          {esperienza === 'principiante' ? <Avviso>Il libro consiglia di ripetere due volte il programma per principianti prima di questo. Si può partire lo stesso: i carichi della Fase 1 sono moderati (65 % del massimale) e la tecnica viene prima di tutto.</Avviso> : null}
        </div>
        <div class="campo">
          <label>Come preferisci fare le sedute?</label>
          <Scelte valori={['classica', 'pha']} valore={pha ? 'pha' : 'classica'} onCambia={(v) => setPha(v === 'pha')} etichette={{ classica: 'Classica', pha: 'Circuito PHA' }} />
          <p class="piccolo">{pha ? 'Squat, stacco e hip thrust a serie normali; il resto in circuito alternando glutei e parte alta. Più veloce.' : 'Tutto a serie normali con i recuperi del libro.'} Si sceglie di nuovo prima di ogni seduta.</p>
        </div>
        <div class="campo">
          <label>Quanto tempo hai per seduta?</label>
          <Scelte valori={[60, 75, 90]} valore={T} onCambia={setT} etichette={{ 60: '60 min', 75: '75 min', 90: '90 min' }} />
          <p class="piccolo">È un tetto: in classica, se una seduta lo supera, la parte alta perde qualche serie; i glutei del libro restano interi. Con 75′ la seduta più lunga ci sta tutta.</p>
        </div>
      </div>

      <div class="carta">
        <button type="button" class="riga spazio" style="background:none;border:0;padding:0;cursor:pointer;color:inherit;text-align:left" onClick={() => setMostraCorpo(!mostraCorpo)}>
          <h2>Peso e calorie (facoltativo)</h2><span class="piccolo"><Icona nome={mostraCorpo ? 'su' : 'giu'} dimensione={18} /></span>
        </button>
        {mostraCorpo ? (
          <>
            <p class="piccolo">Servono solo per stimare fabbisogno, calorie e macro (Impostazioni → Energia). L'app non conta le calorie.</p>
            <div class="griglia3">
              <div class="campo"><label>Età</label><input type="number" inputMode="numeric" value={eta} onInput={(e) => setEta((e.target as HTMLInputElement).value)} /></div>
              <div class="campo"><label>Altezza (cm)</label><input type="number" inputMode="numeric" value={altezza} onInput={(e) => setAltezza((e.target as HTMLInputElement).value)} /></div>
              <div class="campo"><label>Peso (kg)</label><input type="number" inputMode="decimal" step="0.1" value={peso} onInput={(e) => setPeso((e.target as HTMLInputElement).value)} /></div>
            </div>
            <div class="campo"><label>% grasso (facoltativo)</label><input type="number" inputMode="decimal" step="0.5" value={bf} onInput={(e) => setBf((e.target as HTMLInputElement).value)} placeholder="—" /></div>
            <div class="campo"><label>Passi al giorno</label><Stepper valore={passi} min={PASSI_MIN} max={PASSI_MAX} passo={PASSO_STEPPER} onCambia={setPassi} formato={(v) => v.toLocaleString('it-IT')} etichettaAria="Passi al giorno" /></div>
          </>
        ) : null}
      </div>

      <div class="carta">
        <h2>Le tre sedute</h2>
        <p class="piccolo">Ogni seduta: prima i glutei (un gruppo diverso del libro a rotazione), poi la parte alta e l'addome. I glutei cambiano esercizi a ogni fase.</p>
        <button type="button" class="bottone fantasma" onClick={() => setMostraSedute(!mostraSedute)}>{mostraSedute ? 'Nascondi gli esercizi' : 'Vedi gli esercizi della Fase 1'}</button>
        {mostraSedute ? SEDUTE.map((s) => (
          <div class="colonna" style="gap:4px">
            <h3>{s.nome} · {s.etichetta}</h3>
            {s.voci.map((v) => (
              <div class="riga spazio piccolo" style="color:var(--testo2)">
                <span>{ESERCIZI_PER_ID[v.esercizio.fase1]?.nome}</span>
                <span>{v.righe.fase1[0].s} × {v.righe.fase1[0].max ? 'max' : v.righe.fase1[0].r}{ESERCIZI_PER_ID[v.esercizio.fase1]?.secondi ? '″' : ''}</span>
              </div>
            ))}
          </div>
        )) : null}
      </div>

      <button class="bottone primario pieno" disabled={!nome.trim() || salvando} onClick={conferma}>{salvando ? 'Creo il programma…' : 'Crea il programma'}</button>
    </div>
  );
}
