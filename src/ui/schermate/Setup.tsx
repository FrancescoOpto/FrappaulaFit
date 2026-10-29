import { useMemo, useState } from 'preact/hooks';
import type { DatiCorporei, Esperienza, Gruppo, Intensita, Obiettivo, ObiettivoAttivo, ParametriGeneratore, Preset, StatoEnergetico } from '../../tipi';
import { ESERCIZI, ESERCIZI_PER_ID, NOMI_GRUPPI } from '../../data/esercizi';
import { generaSettimana, targetVolume } from '../../motore/generatore';
import { minuti } from '../../motore/prescrizione';
import { DURATA_DEFAULT, PASSI_DEFAULT, PASSI_MAX, PASSI_MIN, PASSO_STEPPER } from '../../motore/energia';
import { ENERGIA_PER_OBIETTIVO, proponiPiano, settimaneCalendario } from '../../motore/pianificatore';
import { descriviComposizione } from '../../motore/composizione';
import { creaProfilo, profilo, IMPOSTAZIONI_DEFAULT } from '../../store/stato';
import { Avviso, Scelte, Stepper } from '../componenti/comuni';
import { Icona } from '../componenti/IconaEsercizio';
import { vai } from '../router';

const GRUPPI: Gruppo[] = ['petto', 'dorso', 'spalle', 'gambe', 'bicipiti', 'tricipiti', 'addome'];
export const NOMI_OBIETTIVO: Record<Obiettivo, string> = { massa: 'Massa', mantenimento: 'Mantenimento', definizione: 'Dimagrimento' };
export const NOMI_ENERGIA: Record<StatoEnergetico, string> = { deficit: 'Deficit', mantenimento: 'Calorie di mantenimento', surplus: 'Surplus' };
export const NOMI_MODULO: Record<string, string> = { test: 'Test', rientro: 'Rientro', ipertrofia: 'Ipertrofia con forza', mantenimento: 'Ipertrofia accorciata', preservazione: 'Preservazione', scarico: 'Scarico' };
export const NOMI_INTENSITA: Record<Intensita, string> = { moderata: 'Moderata', standard: 'Standard', alta: 'Alta' };
export const DESCRIZIONE_INTENSITA: Record<Intensita, string> = {
  moderata: 'Tutte le serie a 2–3 ripetizioni dal cedimento, mai a cedimento; una serie in meno sui complementari (minimo 2). Target e fondamentali invariati.',
  standard: 'Come i blocchi di riferimento: 1–2 ripetizioni dal cedimento, cedimento solo sull’ultima serie di Target e isolamenti.',
  alta: 'Cedimento anche sull’ultima serie dei complementari (fondamentali mai); una serie in più sui gruppi prioritari; tecniche avanzate sugli isolamenti.',
};
/** Giorni a settimana: sempre 4 (SPEC_PIANIFICATORE v2 §6c) [Utente]. */
const N_FISSO = 4;

export function Setup() {
  const esiste = profilo.value;
  const [nome, setNome] = useState(esiste?.nome ?? '');
  const [sesso, setSesso] = useState<'M' | 'F'>(esiste?.sesso ?? 'M');
  const [T, setT] = useState(60);
  const [esperienza, setEsperienza] = useState<Esperienza>('intermedio');
  const [intensita, setIntensita] = useState<Intensita>('standard');
  const [obiettivo, setObiettivo] = useState<Obiettivo>('massa');
  const [settimane, setSettimane] = useState<number>(DURATA_DEFAULT.massa);
  const [bloccoBase, setBloccoBase] = useState<1 | 2>(1);
  const [kgTarget, setKgTarget] = useState('');
  const [resistenza, setResistenza] = useState(false);
  const [preferisciMacchine, setPreferisciMacchine] = useState(false);
  const [mostraCorpo, setMostraCorpo] = useState(false);
  const [eta, setEta] = useState('');
  const [altezza, setAltezza] = useState('');
  const [peso, setPeso] = useState('');
  const [bf, setBf] = useState('');
  const [passi, setPassi] = useState<number>(PASSI_DEFAULT);
  const [tdeeEmp, setTdeeEmp] = useState('');
  const [priorita, setPriorita] = useState<Gruppo[]>([]);
  const [esclusi, setEsclusi] = useState<string[]>([]);
  const [mostraEsclusi, setMostraEsclusi] = useState(false);
  const [mostraDettagli, setMostraDettagli] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const N = N_FISSO;

  const scegliObiettivo = (o: Obiettivo) => {
    setObiettivo(o);
    setSettimane(DURATA_DEFAULT[o]);
  };

  // L'energia discende dall'obiettivo (v2 §1): non si chiede.
  const energia = ENERGIA_PER_OBIETTIVO[obiettivo];
  const preset: Preset = sesso === 'F' ? 'donna_glutei' : 'uomo_base';
  const parametri: ParametriGeneratore = useMemo(
    () => ({ N, T, priorita, esclusi, esperienza, preset, bloccoBreve: obiettivo === 'mantenimento', intensita, bloccoBase: obiettivo === 'mantenimento' ? bloccoBase : undefined }),
    [T, priorita, esclusi, esperienza, preset, obiettivo, intensita, bloccoBase],
  );
  const piano = useMemo(() => proponiPiano({ obiettivo, settimane, N, bloccoBase }), [obiettivo, settimane, bloccoBase]);
  const anteprima = useMemo(() => {
    try {
      const numero = obiettivo === 'definizione' && preset === 'uomo_base' ? 3 : piano[0]?.composizione?.[0]?.bloccoRif ?? 1;
      return generaSettimana(parametri, { sostituzioni: {}, esercizi_personalizzati: [], impostazioni: IMPOSTAZIONI_DEFAULT }, numero);
    } catch {
      return null;
    }
  }, [parametri, obiettivo, piano]);
  const target = targetVolume(parametri);

  const togglePriorita = (g: Gruppo) => {
    if (priorita.includes(g)) setPriorita(priorita.filter((x) => x !== g));
    else if (priorita.length < 2) setPriorita([...priorita, g]);
  };
  const toggleEscluso = (id: string) => setEsclusi(esclusi.includes(id) ? esclusi.filter((x) => x !== id) : [...esclusi, id]);

  const conferma = async () => {
    if (!nome.trim() || !anteprima) return;
    setSalvando(true);
    const ob: ObiettivoAttivo = {
      tipo: obiettivo,
      dal: new Date().toISOString(),
      settimane: Math.max(1, Math.round(settimane)),
      energia,
      kgTarget: parseFloat(kgTarget.replace(',', '.')) || undefined,
      resistenza: obiettivo === 'definizione' ? resistenza : undefined,
      preferisciMacchine: obiettivo === 'definizione' ? preferisciMacchine : undefined,
    };
    const corpo: DatiCorporei | undefined = mostraCorpo
      ? { eta: parseInt(eta, 10) || undefined, altezzaCm: parseFloat(altezza) || undefined, pesoKg: parseFloat(peso.replace(',', '.')) || undefined, bfPct: parseFloat(bf.replace(',', '.')) || undefined, passiGiorno: passi, allenamentiSettimana: N, durataSedutaMin: T, tdeeEmpirico: parseInt(tdeeEmp, 10) || undefined }
      : undefined;
    await creaProfilo(nome.trim(), sesso, parametri, ob, corpo);
    setSalvando(false);
    vai('/');
  };

  const tappe = piano[0]?.tappe ?? [];
  const composizione = piano[0]?.composizione;
  const cicliTotali = piano[0]?.settimane ?? 0;

  return (
    <div class="pagina">
      <div class="colonna" style="gap:10px;margin-top:12px">
        <div class="eyebrow">Frappaula Fit</div>
        <h1>{esiste ? 'Nuovo profilo' : 'Impostiamo il programma'}</h1>
        <p class="muto">Poche domande: da queste l'app costruisce il piano. Tutto si può cambiare dopo, dalle Impostazioni.</p>
      </div>

      {esiste ? <Avviso>Creare un nuovo profilo sostituisce quello attuale su questo dispositivo. Esporta prima un backup dalle Impostazioni.</Avviso> : null}

      <div class="carta">
        <div class="campo">
          <label>Come ti chiami?</label>
          <input type="text" value={nome} onInput={(e) => setNome((e.target as HTMLInputElement).value)} placeholder="Nome" autocomplete="given-name" />
        </div>
        <div class="campo">
          <label>Profilo di partenza</label>
          <Scelte valori={['M', 'F']} valore={sesso} onCambia={setSesso} etichette={{ M: 'Uomo · base', F: 'Donna · focus glutei' }} />
          {sesso === 'F' ? <p class="piccolo">Profilo provvisorio: stesso motore, hip thrust come fondamentale e glutei prioritari. Da rivedere quando arrivano i libri su glutei e allenamento femminile.</p> : null}
        </div>
      </div>

      <div class="carta">
        <h2>Obiettivo e durata</h2>
        <div class="campo">
          <label>Che obiettivo hai?</label>
          <Scelte valori={['massa', 'mantenimento', 'definizione'] as Obiettivo[]} valore={obiettivo} onCambia={scegliObiettivo} etichette={NOMI_OBIETTIVO} />
          <p class="piccolo">{obiettivo === 'massa' ? 'Surplus calorico: ipertrofia con forza sui blocchi di riferimento.' : obiettivo === 'mantenimento' ? 'Calorie di mantenimento: Fase 1 e Fase 2 con scarico, senza Fase 3 né tecniche.' : 'Deficit: in deficit l’allenamento serve a mantenere il muscolo, non a costruirlo (Preservazione).'}</p>
        </div>
        <div class="campo">
          <label>Per quanti cicli? (un ciclo = un giro delle 4 sedute, circa una settimana)</label>
          <input type="number" inputMode="numeric" min="1" max="60" value={settimane} onInput={(e) => setSettimane(parseInt((e.target as HTMLInputElement).value, 10) || 0)} />
          <p class="piccolo">A 4 sedute a settimana sono {settimane} settimane; con 3 sedute diventano circa {Math.ceil(settimaneCalendario(settimane, N, 3))}: la sequenza non cambia, si allunga.</p>
        </div>
        {obiettivo === 'mantenimento' ? (
          <div class="campo">
            <label>Blocco di riferimento</label>
            <Scelte valori={[1, 2] as const} valore={bloccoBase} onCambia={setBloccoBase} etichette={{ 1: 'Blocco 1 (default)', 2: 'Blocco 2' }} />
            <p class="piccolo">Il Blocco 3 è il blocco di definizione: non si usa per il mantenimento.</p>
          </div>
        ) : null}
        {obiettivo === 'definizione' ? (
          <>
            <div class="campo"><label>Kg da perdere (facoltativo)</label><input type="number" inputMode="decimal" step="0.5" min="0" value={kgTarget} onInput={(e) => setKgTarget((e.target as HTMLInputElement).value)} placeholder="—" /></div>
            <label class="riga spazio" style="padding:4px 0"><span class="cresce">Allenare anche la resistenza<br /><span class="piccolo">2 serie da 15–20 ripetizioni a carico leggero in coda a ogni seduta.</span></span><input type="checkbox" checked={resistenza} onChange={(e) => setResistenza((e.target as HTMLInputElement).checked)} /></label>
            <label class="riga spazio" style="padding:4px 0"><span class="cresce">Preferisci le macchine<br /><span class="piccolo">Sostituisce i multiarticolari liberi non fondamentali con la versione guidata.</span></span><input type="checkbox" checked={preferisciMacchine} onChange={(e) => setPreferisciMacchine((e.target as HTMLInputElement).checked)} /></label>
          </>
        ) : null}
      </div>

      <div class="carta">
        <h2>Come ti alleni</h2>
        <div class="campo">
          <label>Esperienza</label>
          <Scelte valori={['principiante', 'intermedio', 'avanzato'] as Esperienza[]} valore={esperienza} onCambia={setEsperienza} etichette={{ principiante: 'Principiante · < 1 anno', intermedio: 'Intermedio · 1–3', avanzato: 'Avanzato · > 3' }} />
        </div>
        <div class="campo">
          <label>Intensità desiderata</label>
          <Scelte valori={['moderata', 'standard', 'alta'] as Intensita[]} valore={intensita} onCambia={setIntensita} etichette={NOMI_INTENSITA} />
          <p class="piccolo">{DESCRIZIONE_INTENSITA[intensita]} I carichi non cambiano mai.</p>
        </div>
        <div class="campo">
          <label>Quanto tempo hai per seduta?</label>
          <Scelte valori={[45, 60, 75, 90]} valore={T} onCambia={setT} etichette={{ 45: '45 min', 60: '60 min', 75: '75 min', 90: '90 min' }} />
          <p class="piccolo">È un tetto: se una seduta lo supera, l'app accorcia i complementari, mai Target e fondamentali.</p>
        </div>
        <div class="campo">
          <label>Gruppi prioritari (fino a 2, facoltativo)</label>
          <div class="scelte">
            {GRUPPI.filter((g) => g !== 'addome').map((g) => (
              <button type="button" class={`scelta ${priorita.includes(g) ? 'attiva' : ''}`} onClick={() => togglePriorita(g)}>{NOMI_GRUPPI[g]}</button>
            ))}
          </div>
          {priorita.length ? <p class="piccolo">Una serie in più su Target e complementari di {priorita.map((g) => NOMI_GRUPPI[g]).join(' e ')}, e li fai per primi nella seduta (massimo 20 serie a settimana).</p> : null}
        </div>
        <div class="campo">
          <button type="button" class="bottone fantasma" onClick={() => setMostraEsclusi(!mostraEsclusi)}>
            Esercizi da escludere {esclusi.length ? `(${esclusi.length})` : ''} <Icona nome={mostraEsclusi ? 'su' : 'giu'} dimensione={18} />
          </button>
          {mostraEsclusi ? (
            <div class="colonna" style="gap:12px">
              <p class="piccolo">Attrezzatura mancante o esercizi in cui non ti senti sicuro: l'app li sostituisce con un equivalente della libreria.</p>
              {GRUPPI.map((g) => (
                <div class="colonna">
                  <div class="etichetta">{NOMI_GRUPPI[g]}</div>
                  <div class="scelte">
                    {ESERCIZI.filter((e) => e.gruppo === g).map((e) => (
                      <button type="button" class={`scelta ${esclusi.includes(e.id) ? 'attiva' : ''}`} style="min-height:38px;padding:6px 10px;font-size:14px;font-weight:500" onClick={() => toggleEscluso(e.id)}>{esclusi.includes(e.id) ? 'via · ' : ''}{e.nome}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div class="carta">
        <button type="button" class="riga spazio" style="background:none;border:0;padding:0;cursor:pointer;color:inherit;text-align:left" onClick={() => setMostraCorpo(!mostraCorpo)}>
          <h2>Energia (facoltativo)</h2><span class="piccolo"><Icona nome={mostraCorpo ? 'su' : 'giu'} dimensione={18} /></span>
        </button>
        {mostraCorpo ? (
          <>
            <p class="piccolo">Servono solo per stimare fabbisogno, calorie e macro. L'app non è un contacalorie e non propone pasti.</p>
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
            <p class="piccolo">Gli allenamenti a settimana e la durata della seduta li prende dal programma ({N} × {T}′); si cambiano poi in Impostazioni → Energia.</p>
          </>
        ) : null}
      </div>

      {anteprima && piano[0] ? (
        <div class="carta">
          <h2>Il piano</h2>
          <div class="griglia3">
            <div class="stat"><div class="valore">{cicliTotali}</div><div class="nome">cicli (≈ settimane)</div></div>
            <div class="stat"><div class="valore">{cicliTotali * N}</div><div class="nome">sedute</div></div>
            <div class="stat"><div class="valore">{Math.round(anteprima.sessioni.reduce((a, s) => a + s.durataS, 0) / anteprima.sessioni.length / 60)}′</div><div class="nome">durata media</div></div>
          </div>
          {composizione ? <p><b>{descriviComposizione(composizione)}</b></p> : null}
          <div class="colonna" style="gap:6px">
            {tappe.map((t) => (
              <div class="riga spazio"><span><b>{NOMI_MODULO[t.modulo]}</b>{t.cicliPreservazione ? <span class="piccolo"> · {t.cicliPreservazione.filter((c) => c === 'S').length} di scarico</span> : null}{t.bloccoRif ? <span class="piccolo"> · Blocco {t.bloccoRif}</span> : null}</span><span class="piccolo">{t.cicli} {t.cicli === 1 ? 'ciclo' : 'cicli'}</span></div>
            ))}
          </div>
          <p class="piccolo">{piano[0].perche}</p>
          {anteprima.avvisi.map((a) => <Avviso>{a}</Avviso>)}
          <table class="tabella">
            <thead><tr><th>Gruppo</th><th class="num">Serie / sett.</th><th class="num">Riferimento</th></tr></thead>
            <tbody>
              {GRUPPI.map((g) => (
                <tr><td>{NOMI_GRUPPI[g]}</td><td class="num">{anteprima.volume[g]}</td><td class="num muto">{target[g]}</td></tr>
              ))}
            </tbody>
          </table>
          {obiettivo === 'definizione' ? <p class="piccolo">In Preservazione restano le stesse serie del blocco, senza tecniche (rest-pause, seconde righe); i fondamentali al 77–82 % mai a cedimento. Le seconde righe tolte abbassano un po' i totali qui sopra.</p> : null}
          <button type="button" class="bottone fantasma" onClick={() => setMostraDettagli(!mostraDettagli)}>
            {mostraDettagli ? 'Nascondi le sedute' : 'Vedi le sedute del programma'}
          </button>
          {mostraDettagli ? anteprima.sessioni.map((s) => (
            <div class="colonna" style="gap:4px">
              <div class="riga spazio"><h3>{s.nome} · {s.etichetta}</h3><span class="piccolo">≈ {minuti(s.durataS)}′</span></div>
              {s.esercizi.map((e) => (
                <div class="riga spazio piccolo" style="color:var(--testo2)">
                  <span>{ESERCIZI_PER_ID[e.esercizio_id]?.nome}</span>
                  <span class={`badge ${e.ruolo}`}>{e.ruolo}</span>
                </div>
              ))}
            </div>
          )) : null}
        </div>
      ) : (
        <Avviso tipo="errore">Non riesco a generare il programma con queste scelte.</Avviso>
      )}

      <button class="bottone primario pieno" disabled={!nome.trim() || !anteprima || salvando || settimane < 1} onClick={conferma}>
        {salvando ? 'Creo il piano…' : 'Crea il piano'}
      </button>
      {esiste ? <button class="bottone fantasma pieno" onClick={() => vai('/impostazioni')}>Annulla</button> : null}
    </div>
  );
}
