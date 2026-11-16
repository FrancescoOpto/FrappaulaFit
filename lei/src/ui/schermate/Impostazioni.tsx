import { useState } from 'preact/hooks';
import type { DatiCorporei, Esperienza, Obiettivo, Tema } from '../../tipi';
import { ESERCIZI_PER_ID } from '../../data/esercizi';
import { SEDUTE } from '../../data/programma';
import { MESI_DURATA, componi, descrivi, settimaneDaMesi } from '../../motore/calendario';
import { PASSI_DEFAULT, PASSI_MAX, PASSI_MIN, PASSO_STEPPER, calorieObiettivo, macro, stimeTdee } from '../../motore/energia';
import { ripetizioniTest, tipoTest } from '../../motore/prescrizione';
import { esportaJSON, importaJSON } from '../../store/db';
import {
  aggiornaDatiCorporei,
  aggiornaImpostazioni,
  aggiornaProfilo,
  avviaNuovoProgramma,
  azzeraDatiProva,
  azzeraTutto,
  cambiaObiettivo,
  impostazioni,
  profilo,
  programma,
  rimuoviTest,
  ripristinaCaricoPiano,
  salvaTest,
  sostituisciStato,
  stato,
  ultimoSalvataggio,
} from '../../store/stato';
import { accedi, configSync, erroreSync, esci, registrati, salvaConfigSync, sessioneSync, sincronizza, statoSync, ultimaSync } from '../../store/sync';
import { Avviso, Scelte, Stepper, Testata, formatoData, formatoKg } from '../componenti/comuni';
import { Icona } from '../componenti/IconaEsercizio';
import { DESCRIZIONE_OBIETTIVO, NOMI_OBIETTIVO } from '../etichette';
import { avviaTimer, chiediPermessoNotifiche, sbloccaAudio } from '../timer';
import { cercaAggiornamento } from '../aggiornamento';
import { vai } from '../router';

function Sezione({ id, titolo, aperta, onToggle, children }: { id: string; titolo: string; aperta: boolean; onToggle: () => void; children: preact.ComponentChildren }) {
  return (
    <div class="carta" id={id}>
      <button class="riga spazio" style="background:none;border:0;padding:0;cursor:pointer;text-align:left;color:inherit" onClick={onToggle}>
        <h2>{titolo}</h2>
        <span class="piccolo"><Icona nome={aperta ? 'su' : 'giu'} dimensione={18} /></span>
      </button>
      {aperta ? children : null}
    </div>
  );
}

function Energia() {
  const p = profilo.value!;
  const d: DatiCorporei = p.datiCorporei ?? {};
  const [eta, setEta] = useState(d.eta ? String(d.eta) : '');
  const [altezza, setAltezza] = useState(d.altezzaCm ? String(d.altezzaCm) : '');
  const [peso, setPeso] = useState(d.pesoKg ? String(d.pesoKg) : '');
  const [bf, setBf] = useState(d.bfPct ? String(d.bfPct) : '');
  const [passi, setPassi] = useState<number>(d.passiGiorno ?? PASSI_DEFAULT);
  const [tdeeEmp, setTdeeEmp] = useState(d.tdeeEmpirico ? String(d.tdeeEmpirico) : '');
  const [kcalOverride, setKcalOverride] = useState(p.kcalTarget ? String(p.kcalTarget) : '');
  const [salvato, setSalvato] = useState(false);
  const vEta = parseInt(eta, 10), vAlt = parseFloat(altezza), vPeso = parseFloat(peso.replace(',', '.')), vBf = parseFloat(bf.replace(',', '.')), vEmp = parseInt(tdeeEmp, 10);
  const completi = vEta > 0 && vAlt > 0 && vPeso > 0;
  const T = impostazioni.value.T;
  const st = completi ? stimeTdee({ sesso: 'F', pesoKg: vPeso, altezzaCm: vAlt, eta: vEta, passiGiorno: passi, allenamentiSettimana: 3, durataMin: T, bfPct: vBf > 0 ? vBf : undefined, tdeeEmpirico: vEmp > 0 ? vEmp : undefined }) : null;
  const cal = st ? calorieObiettivo({ obiettivo: p.obiettivo, sesso: 'F', pesoKg: vPeso, tdee: st.partenza, bmr: st.bmr, bfPct: vBf > 0 ? vBf : undefined, esperienza: p.esperienza }) : null;
  const kcal = (parseInt(kcalOverride, 10) > 0 ? parseInt(kcalOverride, 10) : undefined) ?? cal?.kcal;
  const m = kcal && vPeso > 0 ? macro(p.obiettivo, vPeso, kcal) : null;
  const salva = async () => {
    await aggiornaDatiCorporei({ eta: vEta || undefined, altezzaCm: vAlt || undefined, pesoKg: vPeso || undefined, bfPct: vBf || undefined, passiGiorno: passi, tdeeEmpirico: vEmp || undefined });
    const k = parseInt(kcalOverride, 10);
    await aggiornaProfilo({ kcalTarget: Number.isFinite(k) && k > 0 ? k : undefined });
    setSalvato(true);
    setTimeout(() => setSalvato(false), 1500);
  };
  return (
    <div class="colonna" style="gap:12px">
      <p class="muto">Fabbisogno stimato con un modello semplice: metabolismo basale, vita quotidiana, passi e 3 allenamenti a settimana. Indicazioni generali, non una dieta.</p>
      <div class="griglia3">
        <div class="campo"><label>Età</label><input type="number" inputMode="numeric" value={eta} onInput={(e) => setEta((e.target as HTMLInputElement).value)} /></div>
        <div class="campo"><label>Altezza (cm)</label><input type="number" inputMode="numeric" value={altezza} onInput={(e) => setAltezza((e.target as HTMLInputElement).value)} /></div>
        <div class="campo"><label>Peso (kg)</label><input type="number" inputMode="decimal" step="0.1" value={peso} onInput={(e) => setPeso((e.target as HTMLInputElement).value)} /></div>
      </div>
      <div class="griglia2">
        <div class="campo"><label>% grasso (facoltativo)</label><input type="number" inputMode="decimal" step="0.5" value={bf} onInput={(e) => setBf((e.target as HTMLInputElement).value)} placeholder="—" /></div>
        <div class="campo"><label>TDEE misurato (facoltativo)</label><input type="number" inputMode="numeric" value={tdeeEmp} onInput={(e) => setTdeeEmp((e.target as HTMLInputElement).value)} placeholder="kcal" /></div>
      </div>
      <div class="campo"><label>Passi al giorno (quelli reali)</label><Stepper valore={passi} min={PASSI_MIN} max={PASSI_MAX} passo={PASSO_STEPPER} onCambia={setPassi} formato={(v) => v.toLocaleString('it-IT')} etichettaAria="Passi al giorno" /></div>
      {st ? (
        <div class="carta compatta" style="background:var(--carta2)">
          <div class="griglia3">
            <div class="stat"><div class="valore">{st.bmr}</div><div class="nome">basale</div></div>
            <div class="stat"><div class="valore">{st.partenza}</div><div class="nome">fabbisogno</div></div>
            <div class="stat"><div class="valore">{kcal}</div><div class="nome">obiettivo</div></div>
          </div>
          {m ? <p class="piccolo">Macro: proteine {m.proteine} g · grassi {m.grassi} g · carboidrati {m.carboidrati} g ({NOMI_OBIETTIVO[p.obiettivo].toLowerCase()}).</p> : null}
          {cal?.note.map((n) => <p class="piccolo">{n}</p>)}
          {st.avvisoLibro ? <p class="piccolo">{st.avvisoLibro}</p> : null}
        </div>
      ) : <p class="piccolo">Scrivi età, altezza e peso per la stima.</p>}
      <div class="campo"><label>Calorie obiettivo scelte da te (facoltativo)</label><input type="number" inputMode="numeric" value={kcalOverride} onInput={(e) => setKcalOverride((e.target as HTMLInputElement).value)} placeholder={cal ? String(cal.kcal) : 'kcal'} /></div>
      <button class="bottone primario pieno" onClick={salva}>{salvato ? 'Salvato' : 'Salva'}</button>
    </div>
  );
}

function Programma() {
  const p = profilo.value!;
  const pr = programma.value!;
  const imp = impostazioni.value;
  const [mesi, setMesi] = useState<number>(p.mesi);
  const [conTest, setConTest] = useState(true);
  const [conferma, setConferma] = useState(false);
  const fatte = pr.sedute.filter((s) => s.stato === 'completata').length;
  return (
    <div class="colonna" style="gap:12px">
      <p class="muto">Programma di {pr.mesi} mesi, iniziato il {formatoData(pr.creato)}: {descrivi(pr.composizione)}. Sedute fatte {fatte} di {pr.sedute.length}.</p>
      <div class="campo"><label>Modalità proposta all'avvio della seduta</label><Scelte valori={['classica', 'pha']} valore={imp.phaDefault ? 'pha' : 'classica'} onCambia={(v) => void aggiornaImpostazioni({ phaDefault: v === 'pha' })} etichette={{ classica: 'Classica', pha: 'Circuito PHA' }} /></div>
      <div class="campo"><label>Tetto di tempo per seduta</label><Scelte valori={[60, 75, 90]} valore={imp.T} onCambia={(T) => void aggiornaImpostazioni({ T })} etichette={{ 60: '60 min', 75: '75 min', 90: '90 min' }} /><p class="piccolo">In classica, oltre il tetto la parte alta perde qualche serie; i glutei restano interi.</p></div>
      <div class="separatore" />
      <h3>Nuovo programma</h3>
      <p class="piccolo">Chiude quello in corso (lo storico resta nei Progressi) e ne apre uno nuovo.</p>
      <div class="campo"><label>Durata</label><Scelte valori={[...MESI_DURATA]} valore={mesi} onCambia={setMesi} etichette={{ 3: '3 mesi', 6: '6 mesi', 9: '9 mesi', 12: '12 mesi' }} /><p class="piccolo">{descrivi(componi(settimaneDaMesi(mesi), conTest))}</p></div>
      <label class="riga spazio" style="padding:4px 0"><span class="cresce">Rifai il test<br /><span class="piccolo">Consigliato a ogni nuovo programma; senza test si parte dai massimali e dai carichi di adesso.</span></span><input type="checkbox" checked={conTest} onChange={(e) => setConTest((e.target as HTMLInputElement).checked)} /></label>
      {!conferma ? <button class="bottone pieno" onClick={() => setConferma(true)}>Avvia il nuovo programma…</button> : (
        <div class="griglia2">
          <button class="bottone" onClick={() => setConferma(false)}>Annulla</button>
          <button class="bottone primario" onClick={async () => { await avviaNuovoProgramma(mesi, conTest); setConferma(false); vai('/'); }}>Conferma</button>
        </div>
      )}
    </div>
  );
}

function TestCarichi() {
  const pr = programma.value!;
  const [modifica, setModifica] = useState<string | null>(null);
  const [kg, setKg] = useState('');
  const [rip, setRip] = useState('');
  const [rir, setRir] = useState(0);
  // Esercizi testabili del programma (Fase 1) più quelli già testati.
  const ids: { id: string; n: 10 | 12 | 14 }[] = [];
  for (const s of SEDUTE) for (const v of s.voci) {
    const id = v.esercizio.fase1;
    if (tipoTest(id) !== 'nessuno' && !ids.some((x) => x.id === id)) ids.push({ id, n: ripetizioniTest(v.righe.fase1[0]) });
  }
  for (const id of Object.keys(pr.test)) if (!ids.some((x) => x.id === id)) ids.push({ id, n: (pr.test[id].rip as 10 | 12 | 14) || 12 });
  const correnti = Object.entries(pr.carichiCorrenti);
  return (
    <div class="colonna" style="gap:6px">
      <p class="muto">Correggere un test ricalcola tutte le sedute non ancora fatte.</p>
      {ids.map(({ id, n }) => {
        const t = pr.test[id];
        const stima = tipoTest(id) === 'stima';
        return (
          <div class="colonna" style="padding:10px 0;border-top:1px solid var(--bordo)">
            <div class="riga spazio">
              <div class="cresce">
                <div style="font-weight:500">{ESERCIZI_PER_ID[id]?.nome ?? id}</div>
                <div class="piccolo">{t ? (t.modo === 'stima' ? `massimale ${formatoKg(t.rm1)} (${t.rip} × ${t.kg})` : `${t.rip} RM a ${formatoKg(t.kg)} · massimale stimato ${formatoKg(t.rm1)}`) : 'nessun test'}</div>
              </div>
              <button class="bottone piccolo" onClick={() => { setModifica(id); setKg(t ? String(t.kg) : ''); setRip(t?.modo === 'stima' ? String(t.rip) : '5'); setRir(t?.rir ?? 0); }}>Modifica</button>
            </div>
            {modifica === id ? (
              <div class="colonna" style="gap:8px">
                <div class="riga" style="gap:8px">
                  {stima ? <input type="number" inputMode="numeric" min="1" max="12" value={rip} onInput={(e) => setRip((e.target as HTMLInputElement).value)} placeholder="rip" /> : <div class="input" style="display:flex;align-items:center;justify-content:center;opacity:.7">{n} rip</div>}
                  <input type="number" inputMode="decimal" step="0.5" value={kg} onInput={(e) => setKg((e.target as HTMLInputElement).value)} placeholder="kg" />
                  <button class="bottone primario piccolo" style="min-height:46px" onClick={async () => { const k = parseFloat(kg.replace(',', '.')); const r = stima ? parseInt(rip, 10) : n; if (k > 0 && r > 0) { try { await salvaTest(id, k, r, stima ? 'stima' : 'serie_unica', stima ? rir : 0); } catch { /* valori non validi */ } } setModifica(null); }}>Salva</button>
                </div>
                {stima ? <div class="campo"><label>Ripetizioni di riserva</label><Scelte valori={[0, 1, 2, 3, 4]} valore={rir} onCambia={setRir} /></div> : null}
                <div class="riga" style="gap:8px">
                  {t ? <button class="bottone piccolo fantasma pericolo" onClick={() => { void rimuoviTest(id); setModifica(null); }}>Elimina test</button> : null}
                  <button class="bottone piccolo fantasma" onClick={() => setModifica(null)}>Annulla</button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
      {correnti.length ? (
        <>
          <h3 style="margin-top:12px">Carichi scelti da te</h3>
          {correnti.map(([id, c]) => (
            <div class="riga spazio" style="padding:6px 0;border-top:1px solid var(--filo)">
              <span>{ESERCIZI_PER_ID[id]?.nome ?? id}: <b>{formatoKg(c.kg)}</b> <span class="piccolo">{c.origine === 'proposta' ? '(progressione)' : ''}</span></span>
              <button class="bottone piccolo fantasma" onClick={() => void ripristinaCaricoPiano(id)}>Torna al piano</button>
            </div>
          ))}
        </>
      ) : null}
    </div>
  );
}

function Sync() {
  const [url, setUrl] = useState(configSync.value?.url ?? '');
  const [key, setKey] = useState(configSync.value?.anonKey ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [lavoro, setLavoro] = useState(false);
  const s = sessioneSync.value;
  const azione = async (fn: () => Promise<unknown>) => {
    setLavoro(true);
    setMsg(null);
    try {
      const r = await fn();
      if (typeof r === 'string') setMsg(r);
      setPassword('');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setLavoro(false);
    }
  };
  return (
    <div class="colonna" style="gap:12px">
      <p class="muto">Database gratuito Supabase, lo stesso progetto dell'app di Francesco ma con il tuo account. Funziona anche senza: i dati restano sul telefono.</p>
      {!configSync.value ? (
        <>
          <div class="campo"><label>URL progetto</label><input type="text" value={url} onInput={(e) => setUrl((e.target as HTMLInputElement).value)} placeholder="https://xxxx.supabase.co" autocapitalize="off" /></div>
          <div class="campo"><label>Chiave anon (pubblica)</label><input type="text" value={key} onInput={(e) => setKey((e.target as HTMLInputElement).value)} placeholder="eyJ…" autocapitalize="off" /></div>
          <button class="bottone pieno" disabled={!url.startsWith('https://') || key.length < 20} onClick={() => salvaConfigSync({ url: url.trim(), anonKey: key.trim() })}>Salva configurazione</button>
        </>
      ) : s ? (
        <>
          <p>Connessa come <b>{s.email}</b></p>
          <p class="piccolo">Stato: {statoSync.value}{ultimaSync.value ? ` · ultima sincronizzazione ${new Date(ultimaSync.value).toLocaleString('it-IT')}` : ''}</p>
          {erroreSync.value ? <Avviso tipo="errore">{erroreSync.value}</Avviso> : null}
          <div class="griglia2">
            <button class="bottone primario" onClick={() => void sincronizza()}>Sincronizza ora</button>
            <button class="bottone" onClick={esci}>Esci</button>
          </div>
        </>
      ) : (
        <>
          <p class="piccolo">Progetto: {configSync.value.url} <button class="bottone piccolo fantasma" onClick={() => salvaConfigSync(null)}>cambia</button></p>
          <div class="campo"><label>Email</label><input type="email" value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} autocomplete="username" /></div>
          <div class="campo"><label>Password</label><input type="password" value={password} onInput={(e) => setPassword((e.target as HTMLInputElement).value)} autocomplete="current-password" /></div>
          <div class="griglia2">
            <button class="bottone primario" disabled={lavoro || !email || !password} onClick={() => azione(() => accedi(email, password))}>Accedi</button>
            <button class="bottone" disabled={lavoro || !email || password.length < 6} onClick={() => azione(() => registrati(email, password))}>Crea account</button>
          </div>
        </>
      )}
      {msg ? <Avviso tipo="info">{msg}</Avviso> : null}
    </div>
  );
}

function Aggiornamenti() {
  const [msg, setMsg] = useState<string | null>(null);
  const [lavoro, setLavoro] = useState(false);
  return (
    <div class="colonna" style="gap:8px">
      <button class="bottone pieno" disabled={lavoro} onClick={async () => { setLavoro(true); setMsg(await cercaAggiornamento()); setLavoro(false); }}>{lavoro ? 'Controllo…' : 'Cerca aggiornamenti'}</button>
      {msg ? <Avviso tipo="info">{msg}</Avviso> : null}
    </div>
  );
}

export function Impostazioni({ sezione }: { sezione?: string }) {
  void stato.value;
  const p = profilo.value!;
  const imp = impostazioni.value;
  const [aperta, setAperta] = useState<string | null>(sezione ?? null);
  const [nome, setNome] = useState(p.nome);
  const [confermaReset, setConfermaReset] = useState(false);
  const [confermaProva, setConfermaProva] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const toggle = (id: string) => setAperta(aperta === id ? null : id);

  const esporta = () => {
    const blob = new Blob([esportaJSON(stato.value)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `frappaula-lei-${p.nome.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  const importa = async (f: File | undefined) => {
    if (!f) return;
    try {
      await sostituisciStato(importaJSON(await f.text()));
      setMsg('Backup ripristinato.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'File non valido.');
    }
  };
  const notifiche = async (on: boolean) => {
    if (!on) return aggiornaImpostazioni({ notifiche: false });
    const r = await chiediPermessoNotifiche();
    await aggiornaImpostazioni({ notifiche: r === 'granted' });
    if (r !== 'granted') setMsg(r === 'non_supportato' ? 'Questo browser non supporta le notifiche (su iPhone servono iOS 16.4+ e l’app aggiunta alla schermata Home).' : 'Permesso negato dal sistema.');
  };

  return (
    <div class="pagina">
      <Testata senzaIndietro />
      <h1>Impostazioni</h1>
      <p class="piccolo">{ultimoSalvataggio.value ? `Ultimo salvataggio ${new Date(ultimoSalvataggio.value).toLocaleTimeString('it-IT')}` : 'Dati salvati sul telefono'}</p>

      <Sezione id="profilo" titolo="Profilo e tema" aperta={aperta === 'profilo'} onToggle={() => toggle('profilo')}>
        <div class="campo"><label>Nome</label><div class="riga"><input type="text" value={nome} onInput={(e) => setNome((e.target as HTMLInputElement).value)} /><button class="bottone piccolo" style="min-height:46px" disabled={nome.trim() === p.nome || !nome.trim()} onClick={() => void aggiornaProfilo({ nome: nome.trim() })}>Salva</button></div></div>
        <div class="campo"><label>Tema</label><Scelte valori={['scuro', 'chiaro'] as Tema[]} valore={imp.tema} onCambia={(v) => void aggiornaImpostazioni({ tema: v })} etichette={{ scuro: 'Scuro', chiaro: 'Chiaro' }} /><p class="piccolo">Su iPhone la barra di stato si adegua alla prossima apertura dell'app.</p></div>
        <div class="campo"><label>Esperienza</label><Scelte valori={['principiante', 'intermedio', 'avanzato'] as Esperienza[]} valore={p.esperienza} onCambia={(v) => void aggiornaProfilo({ esperienza: v })} etichette={{ principiante: 'Principiante', intermedio: 'Intermedia', avanzato: 'Avanzata' }} /></div>
      </Sezione>

      <Sezione id="obiettivo" titolo="Obiettivo" aperta={aperta === 'obiettivo'} onToggle={() => toggle('obiettivo')}>
        <Scelte valori={['definizione', 'mantenimento'] as Obiettivo[]} valore={p.obiettivo} onCambia={(v) => void cambiaObiettivo(v)} etichette={NOMI_OBIETTIVO} />
        <p class="piccolo">{DESCRIZIONE_OBIETTIVO[p.obiettivo]} Il cambio vale dalla prossima seduta che inizi, senza rifare il test.</p>
      </Sezione>

      <Sezione id="programma" titolo="Programma" aperta={aperta === 'programma'} onToggle={() => toggle('programma')}><Programma /></Sezione>
      <Sezione id="energia" titolo="Energia" aperta={aperta === 'energia'} onToggle={() => toggle('energia')}><Energia /></Sezione>
      <Sezione id="test" titolo="Test e carichi" aperta={aperta === 'test'} onToggle={() => toggle('test')}>
        <div class="campo"><label>Arrotondamento dei carichi</label><Scelte valori={[0.5, 1, 2.5] as const} valore={imp.arrotondamento} onCambia={(v) => void aggiornaImpostazioni({ arrotondamento: v })} etichette={{ 0.5: '0,5 kg', 1: '1 kg', 2.5: '2,5 kg' }} /></div>
        <TestCarichi />
      </Sezione>

      <Sezione id="timer" titolo="Timer e notifiche" aperta={aperta === 'timer'} onToggle={() => toggle('timer')}>
        <label class="riga spazio" style="padding:6px 0"><span>Suono a fine recupero</span><input type="checkbox" checked={imp.suoni} onChange={(e) => void aggiornaImpostazioni({ suoni: (e.target as HTMLInputElement).checked })} /></label>
        <label class="riga spazio" style="padding:6px 0"><span>Vibrazione</span><input type="checkbox" checked={imp.vibrazione} onChange={(e) => void aggiornaImpostazioni({ vibrazione: (e.target as HTMLInputElement).checked })} /></label>
        <label class="riga spazio" style="padding:6px 0"><span>Notifica di sistema</span><input type="checkbox" checked={imp.notifiche} onChange={(e) => void notifiche((e.target as HTMLInputElement).checked)} /></label>
        <p class="piccolo">Su iPhone le notifiche funzionano solo con l'app aggiunta alla schermata Home (Condividi → Aggiungi a Home) e iOS 16.4 o successivo. Il timer funziona comunque finché l'app è aperta. La vibrazione su iPhone non è disponibile per le app web.</p>
        <button class="bottone pieno" onClick={() => { sbloccaAudio(); avviaTimer(5, 'Prova timer'); }}>Prova: timer di 5 secondi</button>
      </Sezione>

      <Sezione id="opzioni" titolo="Modalità prova" aperta={aperta === 'opzioni'} onToggle={() => toggle('opzioni')}>
        <label class="riga spazio" style="padding:6px 0"><span class="cresce">Modalità prova<br /><span class="piccolo">Permette di avviare qualsiasi seduta fuori ordine per provare l'app. Le sedute di prova aggiornano i carichi come quelle vere: annullale o usa il pulsante qui sotto. Da spegnere quando ti alleni davvero.</span></span><input type="checkbox" checked={imp.modalita_prova} onChange={(e) => void aggiornaImpostazioni({ modalita_prova: (e.target as HTMLInputElement).checked })} /></label>
        {!confermaProva ? <button class="bottone pieno" onClick={() => setConfermaProva(true)}>Azzera dati di prova…</button> : (
          <div class="colonna" style="gap:8px">
            <p class="muto">Le sedute di lavoro tornano da fare, le serie registrate spariscono, i carichi tornano a quelli del test. I test restano.</p>
            <div class="griglia2">
              <button class="bottone" onClick={() => setConfermaProva(false)}>Annulla</button>
              <button class="bottone pericolo" onClick={async () => { await azzeraDatiProva(); setConfermaProva(false); setMsg('Dati di prova azzerati.'); }}>Sì, azzera</button>
            </div>
          </div>
        )}
      </Sezione>

      <Sezione id="backup" titolo="Backup" aperta={aperta === 'backup'} onToggle={() => toggle('backup')}>
        <p class="muto">Esporta tutto (profilo, programma, test, serie, check-in) in un file. Fallo ogni tanto, soprattutto senza sincronizzazione.</p>
        <button class="bottone primario pieno" onClick={esporta}>Esporta backup</button>
        <label class="bottone pieno" style="cursor:pointer">Importa backup…<input type="file" accept="application/json,.json" style="display:none" onChange={(e) => void importa((e.target as HTMLInputElement).files?.[0])} /></label>
      </Sezione>

      <Sezione id="sync" titolo="Sincronizzazione" aperta={aperta === 'sync'} onToggle={() => toggle('sync')}><Sync /></Sezione>

      <Sezione id="reset" titolo="Azzera tutto" aperta={aperta === 'reset'} onToggle={() => toggle('reset')}>
        <p class="muto">Cancella profilo, programma e storico da questo telefono. I dati sul server (se sincronizzati) non vengono toccati.</p>
        {!confermaReset ? <button class="bottone pericolo pieno" onClick={() => setConfermaReset(true)}>Azzera…</button> : (
          <div class="griglia2">
            <button class="bottone" onClick={() => setConfermaReset(false)}>Annulla</button>
            <button class="bottone pericolo" onClick={async () => { await azzeraTutto(); vai('/'); }}>Sì, cancella</button>
          </div>
        )}
      </Sezione>

      {msg ? <Avviso tipo="info">{msg}</Avviso> : null}
      <Aggiornamenti />
      <p class="piccolo centrato">Frappaula Fit · Lei · versione {__APP_VERSION__} · build {__APP_BUILD__}</p>
    </div>
  );
}
