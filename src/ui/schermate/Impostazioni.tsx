import { useState } from 'preact/hooks';
import type { Classe, Esercizio, Gruppo, ParametriGeneratore, Ruolo } from '../../tipi';
import { ESERCIZI, NOMI_GRUPPI, NOMI_RUOLI, esercizio as trovaEsercizio } from '../../data/esercizi';
import { RECUPERI_DEFAULT } from '../../data/tabelle';
import { eserciziDaTestare, generaSettimana, primoCicloModificabile } from '../../motore/generatore';
import { esportaJSON, importaJSON } from '../../store/db';
import {
  aggiornaImpostazioni,
  aggiornaProfilo,
  aggiungiEsercizioPersonalizzato,
  azzeraTutto,
  blocco,
  cambiaParametri,
  impostaCorrezione,
  nuovoBloccoSuccessivo,
  profilo,
  rimuoviTest,
  salvaTest,
  sostituisciStato,
  stato,
  ultimoSalvataggio,
} from '../../store/stato';
import { accedi, configSync, erroreSync, esci, registrati, salvaConfigSync, sessioneSync, sincronizza, statoSync, ultimaSync } from '../../store/sync';
import { Avviso, Scelte, Testata, formatoData } from '../componenti/comuni';
import { avviaTimer, chiediPermessoNotifiche, sbloccaAudio } from '../timer';
import { vai } from '../router';

const GRUPPI: Gruppo[] = ['petto', 'dorso', 'spalle', 'gambe', 'bicipiti', 'tricipiti', 'addome'];
const RUOLI: Ruolo[] = ['R1', 'R2', 'R3', 'L', 'C', 'AB'];
const CLASSI: Classe[] = ['spinta_orizzontale', 'spinta_inclinata', 'spinta_verticale', 'trazione_verticale', 'trazione_orizzontale', 'squat', 'cerniera_anca', 'hip_thrust', 'quadricipiti_isolamento', 'femorali_isolamento', 'bicipiti', 'tricipiti', 'spalle_laterali', 'spalle_posteriori', 'petto_isolamento', 'addome'];

function Sezione({ id, titolo, aperta, onToggle, children }: { id: string; titolo: string; aperta: boolean; onToggle: () => void; children: preact.ComponentChildren }) {
  return (
    <div class="carta" id={id}>
      <button class="riga spazio" style="background:none;border:0;padding:0;cursor:pointer;text-align:left;color:inherit" onClick={onToggle}>
        <h2>{titolo}</h2>
        <span class="piccolo">{aperta ? '▲' : '▼'}</span>
      </button>
      {aperta ? children : null}
    </div>
  );
}

function Programma() {
  const p = profilo.value!;
  const b = blocco.value;
  const [par, setPar] = useState<ParametriGeneratore>({ ...p.parametri, priorita: [...p.parametri.priorita], esclusi: [...p.parametri.esclusi] });
  const [mostraEsclusi, setMostraEsclusi] = useState(false);
  const [esito, setEsito] = useState<string | null>(null);
  const cambiato = JSON.stringify(par) !== JSON.stringify(p.parametri);
  const anteprima = generaSettimana(par, p);
  const daCiclo = b ? primoCicloModificabile(b) : 1;
  const applica = async () => {
    await cambiaParametri(par);
    setEsito(b && b.stato !== 'completato' ? `Applicato: le sedute dal ciclo ${daCiclo} sono state rigenerate (${anteprima.seduteTotali} sedute in totale nel blocco).` : 'Parametri salvati per il prossimo blocco.');
  };
  return (
    <div class="colonna" style="gap:14px">
      <p class="muto">Le modifiche valgono dal prossimo confine di ciclo: le sedute già fatte e i carichi restano.</p>
      <div class="campo"><label>Sedute a settimana</label><Scelte valori={[2, 3, 4, 5]} valore={par.N} onCambia={(N) => setPar({ ...par, N })} /></div>
      <div class="campo"><label>Minuti per seduta</label><Scelte valori={[45, 60, 75, 90]} valore={par.T} onCambia={(T) => setPar({ ...par, T })} /></div>
      <div class="campo">
        <label>Gruppi prioritari (max 2)</label>
        <div class="scelte">
          {GRUPPI.filter((g) => g !== 'addome').map((g) => (
            <button type="button" class={`scelta ${par.priorita.includes(g) ? 'attiva' : ''}`} onClick={() => setPar({ ...par, priorita: par.priorita.includes(g) ? par.priorita.filter((x) => x !== g) : par.priorita.length < 2 ? [...par.priorita, g] : par.priorita })}>{NOMI_GRUPPI[g]}</button>
          ))}
        </div>
      </div>
      <div class="campo"><label>Blocco</label><Scelte valori={['completo', 'breve']} valore={par.bloccoBreve ? 'breve' : 'completo'} onCambia={(v) => setPar({ ...par, bloccoBreve: v === 'breve' })} etichette={{ completo: 'Completo · 17 cicli', breve: 'Breve · 12 cicli' }} /></div>
      <button type="button" class="bottone fantasma" onClick={() => setMostraEsclusi(!mostraEsclusi)}>Esercizi esclusi ({par.esclusi.length}) {mostraEsclusi ? '▲' : '▼'}</button>
      {mostraEsclusi ? GRUPPI.map((g) => (
        <div class="colonna">
          <div class="etichetta">{NOMI_GRUPPI[g]}</div>
          <div class="scelte">
            {[...ESERCIZI, ...p.esercizi_personalizzati].filter((e) => e.gruppo === g).map((e) => (
              <button type="button" class={`scelta ${par.esclusi.includes(e.id) ? 'attiva' : ''}`} style="min-height:38px;padding:6px 10px;font-size:14px;font-weight:500" onClick={() => setPar({ ...par, esclusi: par.esclusi.includes(e.id) ? par.esclusi.filter((x) => x !== e.id) : [...par.esclusi, e.id] })}>{par.esclusi.includes(e.id) ? '✕ ' : ''}{e.nome}</button>
            ))}
          </div>
        </div>
      )) : null}
      {anteprima.avvisi.map((a) => <Avviso>{a}</Avviso>)}
      <div class="riga" style="flex-wrap:wrap;gap:6px">
        {GRUPPI.map((g) => <span class="chip">{NOMI_GRUPPI[g]} {anteprima.volume[g]}</span>)}
      </div>
      <button class="bottone primario pieno" disabled={!cambiato} onClick={applica}>{b && b.stato !== 'completato' ? `Applica dal ciclo ${daCiclo}` : 'Salva'}</button>
      {esito ? <Avviso tipo="info">{esito}</Avviso> : null}
    </div>
  );
}

function Test() {
  const b = blocco.value;
  const p = profilo.value!;
  const [modifica, setModifica] = useState<string | null>(null);
  const [kg, setKg] = useState('');
  const [rip, setRip] = useState('');
  if (!b) return null;
  const lista = eserciziDaTestare(b).sort((x, y) => GRUPPI.indexOf(x.gruppo) - GRUPPI.indexOf(y.gruppo));
  const salva = async (id: string, fondamentale: boolean) => {
    const k = parseFloat(kg.replace(',', '.'));
    const r = parseInt(rip, 10);
    if (k > 0 && r > 0) await salvaTest(id, k, r, fondamentale);
    setModifica(null);
  };
  return (
    <div class="colonna" style="gap:6px">
      <p class="muto">Carichi di riferimento del blocco {b.numero}. Correggerli qui ricalcola tutte le sedute future.</p>
      {lista.map((e) => {
        const t = b.test[e.esercizio_id];
        const def = trovaEsercizio(e.esercizio_id, p.esercizi_personalizzati);
        const fond = e.ruolo === 'R1' || e.ruolo === 'L';
        const corr = b.correzioni[e.esercizio_id] ?? 0;
        return (
          <div class="colonna" style="padding:10px 0;border-top:1px solid var(--bordo)">
            <div class="riga spazio">
              <div class="cresce">
                <div style="font-weight:500">{def?.nome ?? e.esercizio_id}</div>
                <div class="piccolo">{NOMI_RUOLI[e.ruolo]} · {t ? `${t.kg} kg × ${t.rip}${t.rm1 ? ` → 1RM ${Math.round(t.rm1 * 2) / 2}` : ''}` : 'nessun test'}{corr ? ` · correzione ${Math.round(corr * 1000) / 10}%` : ''}</div>
              </div>
              <button class="bottone piccolo" onClick={() => { setModifica(e.esercizio_id); setKg(t ? String(t.kg) : ''); setRip(t ? String(t.rip) : fond ? '3' : String(def?.ripetizioni_test ?? 10)); }}>Modifica</button>
            </div>
            {modifica === e.esercizio_id ? (
              <div class="colonna" style="gap:8px">
                <div class="riga" style="gap:8px">
                  <input type="number" inputMode="decimal" step="0.5" value={kg} onInput={(ev) => setKg((ev.target as HTMLInputElement).value)} placeholder="kg" />
                  <input type="number" inputMode="numeric" value={rip} onInput={(ev) => setRip((ev.target as HTMLInputElement).value)} placeholder="rip" />
                  <button class="bottone primario piccolo" style="min-height:46px" onClick={() => salva(e.esercizio_id, fond)}>Salva</button>
                </div>
                <div class="riga" style="gap:8px">
                  {corr ? <button class="bottone piccolo fantasma" onClick={() => void impostaCorrezione(e.esercizio_id, 0)}>Azzera correzione</button> : null}
                  {t ? <button class="bottone piccolo fantasma pericolo" onClick={() => { void rimuoviTest(e.esercizio_id); setModifica(null); }}>Elimina test</button> : null}
                  <button class="bottone piccolo fantasma" onClick={() => setModifica(null)}>Annulla</button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
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
      <p class="muto">Database gratuito Supabase con due account (uno per persona). Serve un progetto creato su supabase.com con la tabella dello schema in <code>supabase/schema.sql</code>. Funziona anche senza: i dati restano sul telefono.</p>
      {!configSync.value ? (
        <>
          <div class="campo"><label>URL progetto</label><input type="text" value={url} onInput={(e) => setUrl((e.target as HTMLInputElement).value)} placeholder="https://xxxx.supabase.co" autocapitalize="off" /></div>
          <div class="campo"><label>Chiave anon (pubblica)</label><input type="text" value={key} onInput={(e) => setKey((e.target as HTMLInputElement).value)} placeholder="eyJ…" autocapitalize="off" /></div>
          <button class="bottone pieno" disabled={!url.startsWith('https://') || key.length < 20} onClick={() => salvaConfigSync({ url: url.trim(), anonKey: key.trim() })}>Salva configurazione</button>
        </>
      ) : s ? (
        <>
          <p>Connesso come <b>{s.email}</b></p>
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

function NuovoEsercizio() {
  const [nome, setNome] = useState('');
  const [gruppo, setGruppo] = useState<Gruppo>('petto');
  const [classe, setClasse] = useState<Classe>('spinta_orizzontale');
  const [tipo, setTipo] = useState<'multi' | 'isolamento'>('isolamento');
  const [rip, setRip] = useState<10 | 12>(12);
  const [fatto, setFatto] = useState(false);
  const salva = async () => {
    const e: Esercizio = { id: 'x_' + nome.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now().toString(36), nome: nome.trim(), gruppo, classe, tipo, unilaterale: false, ripetizioni_test: rip, query_youtube: nome.trim() + ' esercizio' };
    await aggiungiEsercizioPersonalizzato(e);
    setNome('');
    setFatto(true);
    setTimeout(() => setFatto(false), 2000);
  };
  return (
    <div class="colonna" style="gap:10px">
      <p class="muto">Un esercizio tuo diventa un'alternativa della classe scelta: comparirà tra le sostituzioni.</p>
      <div class="campo"><label>Nome</label><input type="text" value={nome} onInput={(e) => setNome((e.target as HTMLInputElement).value)} /></div>
      <div class="griglia2">
        <div class="campo"><label>Gruppo</label><select value={gruppo} onChange={(e) => setGruppo((e.target as HTMLSelectElement).value as Gruppo)}>{GRUPPI.map((g) => <option value={g}>{NOMI_GRUPPI[g]}</option>)}</select></div>
        <div class="campo"><label>Classe</label><select value={classe} onChange={(e) => setClasse((e.target as HTMLSelectElement).value as Classe)}>{CLASSI.map((c) => <option value={c}>{c.replace(/_/g, ' ')}</option>)}</select></div>
      </div>
      <div class="griglia2">
        <div class="campo"><label>Tipo</label><Scelte valori={['multi', 'isolamento'] as const} valore={tipo} onCambia={setTipo} etichette={{ multi: 'Multiarticolare', isolamento: 'Isolamento' }} /></div>
        <div class="campo"><label>Ripetizioni di test</label><Scelte valori={[10, 12] as const} valore={rip} onCambia={setRip} /></div>
      </div>
      <button class="bottone pieno" disabled={nome.trim().length < 3} onClick={salva}>{fatto ? 'Aggiunto ✓' : 'Aggiungi'}</button>
      {profilo.value!.esercizi_personalizzati.length ? <p class="piccolo">Tuoi: {profilo.value!.esercizi_personalizzati.map((e) => e.nome).join(', ')}</p> : null}
    </div>
  );
}

export function Impostazioni({ sezione }: { sezione?: string }) {
  void stato.value;
  const p = profilo.value!;
  const b = blocco.value;
  const imp = p.impostazioni;
  const [aperta, setAperta] = useState<string | null>(sezione ?? null);
  const [confermaReset, setConfermaReset] = useState(false);
  const [confermaBlocco, setConfermaBlocco] = useState(false);
  const [msgImport, setMsgImport] = useState<string | null>(null);
  const [nome, setNome] = useState(p.nome);
  const toggle = (id: string) => setAperta(aperta === id ? null : id);

  const esporta = () => {
    const blob = new Blob([esportaJSON(stato.value)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `frappaula-fit-${p.nome.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  const importa = async (f: File | undefined) => {
    if (!f) return;
    try {
      const nuovo = importaJSON(await f.text());
      await sostituisciStato(nuovo);
      setMsgImport('Backup ripristinato.');
    } catch (e) {
      setMsgImport(e instanceof Error ? e.message : 'File non valido.');
    }
  };
  const notifiche = async (on: boolean) => {
    if (!on) return aggiornaImpostazioni({ notifiche: false });
    const r = await chiediPermessoNotifiche();
    await aggiornaImpostazioni({ notifiche: r === 'granted' });
    if (r !== 'granted') setMsgImport(r === 'non_supportato' ? 'Questo browser non supporta le notifiche (su iPhone servono iOS 16.4+ e app installata in Home).' : 'Permesso negato dal sistema.');
  };

  return (
    <div class="pagina">
      <Testata senzaIndietro />
      <h1>Impostazioni</h1>
      <p class="piccolo">{ultimoSalvataggio.value ? `Ultimo salvataggio ${new Date(ultimoSalvataggio.value).toLocaleTimeString('it-IT')}` : 'Dati salvati sul dispositivo'}</p>

      <Sezione id="profilo" titolo="Profilo" aperta={aperta === 'profilo'} onToggle={() => toggle('profilo')}>
        <div class="campo"><label>Nome</label><div class="riga"><input type="text" value={nome} onInput={(e) => setNome((e.target as HTMLInputElement).value)} /><button class="bottone piccolo" style="min-height:46px" disabled={nome.trim() === p.nome || !nome.trim()} onClick={() => void aggiornaProfilo({ nome: nome.trim() })}>Salva</button></div></div>
        <div class="campo"><label>Profilo</label><Scelte valori={['M', 'F']} valore={p.sesso} onCambia={(v) => void aggiornaProfilo({ sesso: v })} etichette={{ M: 'Uomo · base', F: 'Donna · focus glutei' }} /><p class="piccolo">Il preset cambia solo le sedute del prossimo blocco (o rigenerandole da “Programma”).</p></div>
        <button class="bottone fantasma pieno" onClick={() => vai('/nuovo-profilo')}>Crea un nuovo profilo su questo dispositivo…</button>
      </Sezione>

      <Sezione id="programma" titolo="Programma" aperta={aperta === 'programma'} onToggle={() => toggle('programma')}><Programma /></Sezione>

      <Sezione id="test" titolo="Test e carichi" aperta={aperta === 'test'} onToggle={() => toggle('test')}>
        <div class="campo"><label>Arrotondamento dei carichi</label><Scelte valori={[0.5, 1, 2.5] as const} valore={imp.arrotondamento} onCambia={(v) => void aggiornaImpostazioni({ arrotondamento: v })} etichette={{ 0.5: '0,5 kg', 1: '1 kg', 2.5: '2,5 kg' }} /></div>
        <Test />
      </Sezione>

      <Sezione id="timer" titolo="Timer e recuperi" aperta={aperta === 'timer'} onToggle={() => toggle('timer')}>
        <div class="griglia2">
          {RUOLI.map((r) => (
            <div class="campo"><label>{NOMI_RUOLI[r]} ({r})</label><input type="number" inputMode="numeric" step="15" min="30" max="300" value={imp.recuperi[r]} onChange={(e) => { const v = parseInt((e.target as HTMLInputElement).value, 10); if (v >= 15) void aggiornaImpostazioni({ recuperi: { ...imp.recuperi, [r]: v } }); }} /></div>
          ))}
        </div>
        <button class="bottone piccolo fantasma" onClick={() => void aggiornaImpostazioni({ recuperi: { ...RECUPERI_DEFAULT } })}>Ripristina i recuperi di default</button>
        <div class="separatore" />
        <label class="riga spazio" style="padding:6px 0"><span>Suono a fine recupero</span><input type="checkbox" checked={imp.suoni} onChange={(e) => void aggiornaImpostazioni({ suoni: (e.target as HTMLInputElement).checked })} /></label>
        <label class="riga spazio" style="padding:6px 0"><span>Vibrazione</span><input type="checkbox" checked={imp.vibrazione} onChange={(e) => void aggiornaImpostazioni({ vibrazione: (e.target as HTMLInputElement).checked })} /></label>
        <label class="riga spazio" style="padding:6px 0"><span>Notifica di sistema</span><input type="checkbox" checked={imp.notifiche} onChange={(e) => void notifiche((e.target as HTMLInputElement).checked)} /></label>
        <p class="piccolo">Su iPhone le notifiche funzionano solo con l'app installata in Home (Condividi → Aggiungi a Home) e iOS 16.4 o superiore. Il timer in sé funziona sempre finché l'app è aperta.</p>
        <button class="bottone pieno" onClick={() => { sbloccaAudio(); avviaTimer(5, 'Prova timer'); }}>Prova: timer di 5 secondi</button>
      </Sezione>

      <Sezione id="opzioni" titolo="Opzioni di allenamento" aperta={aperta === 'opzioni'} onToggle={() => toggle('opzioni')}>
        <label class="riga spazio" style="padding:6px 0"><span class="cresce">Stripping −30% in Fase 2<br /><span class="piccolo">Serie extra a −30% fino al cedimento sull'ultimo esercizio di ogni gruppo. Dalle tue note Keep, non verificato nei video: per questo è spento di default.</span></span><input type="checkbox" checked={imp.stripping} onChange={(e) => void aggiornaImpostazioni({ stripping: (e.target as HTMLInputElement).checked })} /></label>
      </Sezione>

      <Sezione id="esercizi" titolo="Esercizi personalizzati" aperta={aperta === 'esercizi'} onToggle={() => toggle('esercizi')}><NuovoEsercizio /></Sezione>

      <Sezione id="backup" titolo="Backup" aperta={aperta === 'backup'} onToggle={() => toggle('backup')}>
        <p class="muto">Esporta tutto (profilo, programma, test, serie registrate, check-in) in un file JSON. Fallo ogni tanto, soprattutto senza sincronizzazione.</p>
        <button class="bottone primario pieno" onClick={esporta}>Esporta backup</button>
        <label class="bottone pieno" style="cursor:pointer">
          Importa backup…
          <input type="file" accept="application/json,.json" style="display:none" onChange={(e) => void importa((e.target as HTMLInputElement).files?.[0])} />
        </label>
        {msgImport ? <Avviso tipo="info">{msgImport}</Avviso> : null}
      </Sezione>

      <Sezione id="sync" titolo="Sincronizzazione" aperta={aperta === 'sync'} onToggle={() => toggle('sync')}><Sync /></Sezione>

      <Sezione id="blocco" titolo="Blocco" aperta={aperta === 'blocco'} onToggle={() => toggle('blocco')}>
        {b ? <p class="muto">Blocco {b.numero}: {b.sedute.filter((s) => s.stato === 'completata').length}/{b.sedute.length} sedute, iniziato il {formatoData(b.creato)}. Stato: {b.stato === 'test' ? 'settimana di test' : b.stato === 'in_corso' ? 'in corso' : 'completato'}.</p> : null}
        <p class="piccolo">Il blocco successivo riparte da una nuova settimana di test con gli stessi parametri (modificabili prima in “Programma”). Lo storico delle serie resta nei Progressi.</p>
        {!confermaBlocco ? (
          <button class="bottone pieno" onClick={() => setConfermaBlocco(true)}>Chiudi questo blocco e avvia il {(b?.numero ?? 0) + 1}</button>
        ) : (
          <div class="griglia2">
            <button class="bottone" onClick={() => setConfermaBlocco(false)}>Annulla</button>
            <button class="bottone primario" onClick={async () => { await nuovoBloccoSuccessivo(); setConfermaBlocco(false); vai('/'); }}>Conferma</button>
          </div>
        )}
        {stato.value.blocchiPassati.length ? <p class="piccolo">Blocchi passati: {stato.value.blocchiPassati.map((x) => `B${x.numero} (${x.sedute.filter((s) => s.stato === 'completata').length} sedute)`).join(', ')}</p> : null}
      </Sezione>

      <Sezione id="reset" titolo="Azzera tutto" aperta={aperta === 'reset'} onToggle={() => toggle('reset')}>
        <p class="muto">Cancella profilo, programma e storico da questo dispositivo. I dati sul server (se sincronizzati) non vengono toccati.</p>
        {!confermaReset ? (
          <button class="bottone pericolo pieno" onClick={() => setConfermaReset(true)}>Azzera…</button>
        ) : (
          <div class="griglia2">
            <button class="bottone" onClick={() => setConfermaReset(false)}>Annulla</button>
            <button class="bottone pericolo" onClick={async () => { await azzeraTutto(); vai('/'); }}>Sì, cancella</button>
          </div>
        )}
      </Sezione>

      <p class="piccolo centrato">Frappaula Fit · versione {__APP_VERSION__}</p>
    </div>
  );
}
