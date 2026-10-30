import { useEffect, useMemo, useState } from 'preact/hooks';
import type { DatiCorporei, Esperienza, Gruppo, Intensita, Obiettivo, ObiettivoAttivo, ParametriGeneratore, Preset, StatoEnergetico } from '../../tipi';
import { ESERCIZI, ESERCIZI_PER_ID, NOMI_GRUPPI } from '../../data/esercizi';
import { generaSettimana, targetVolume } from '../../motore/generatore';
import { minuti } from '../../motore/prescrizione';
import { PASSI_DEFAULT, PASSI_MAX, PASSI_MIN, PASSO_STEPPER } from '../../motore/energia';
import { ENERGIA_PER_OBIETTIVO, MESI_DURATA, cicliPerObiettivo, percheIbrido, proponiPiano, seduteDefault } from '../../motore/pianificatore';
import { NOMI_FASI } from '../../data/tabelle';
import { eIbrido, parametriPerObiettivo } from '../../motore/moduli';
import { applicaTema } from '../tema';
import { descriviComposizione } from '../../motore/composizione';
import { creaProfilo, profilo, IMPOSTAZIONI_DEFAULT } from '../../store/stato';
import { Avviso, Scelte, Stepper } from '../componenti/comuni';
import { Icona } from '../componenti/IconaEsercizio';
import { vai } from '../router';

const GRUPPI: Gruppo[] = ['petto', 'dorso', 'spalle', 'gambe', 'bicipiti', 'tricipiti', 'addome'];
export const NOMI_OBIETTIVO: Record<Obiettivo, string> = { massa: 'Massa', mantenimento: 'Mantenimento', definizione: 'Dimagrimento' };
/** Obiettivi del profilo donna a sedute ibride (§12b): due scelte. */
export const OBIETTIVI_DONNA: Obiettivo[] = ['definizione', 'mantenimento'];
export const NOMI_OBIETTIVO_DONNA: Record<Obiettivo, string> = { massa: 'Mantenimento e costruzione muscolare', mantenimento: 'Mantenimento e costruzione muscolare', definizione: 'Dimagrimento' };
export const DESCRIZIONE_OBIETTIVO_DONNA: Record<'definizione' | 'mantenimento', string> = {
  mantenimento: 'Parte classica di circa 30′ con più serie, poi il circuito: 3 giri (4 se vuoi). Calorie di mantenimento.',
  definizione: 'Parte classica di circa 25′ con meno serie ma gli stessi carichi, per proteggere la massa magra; circuito fino a 4 giri con recuperi brevi, niente tecniche estreme. In deficit.',
};
/** Nome dell'obiettivo secondo il profilo (la donna a sedute ibride ha i suoi due nomi). */
export function nomeObiettivo(tipo: Obiettivo, ibrido: boolean): string {
  return ibrido ? NOMI_OBIETTIVO_DONNA[tipo] : NOMI_OBIETTIVO[tipo];
}
export const NOMI_ENERGIA: Record<StatoEnergetico, string> = { deficit: 'Deficit', mantenimento: 'Calorie di mantenimento', surplus: 'Surplus' };
export const NOMI_MODULO: Record<string, string> = { test: 'Test', rientro: 'Rientro', ipertrofia: 'Ipertrofia con forza', mantenimento: 'Ipertrofia accorciata', preservazione: 'Preservazione', scarico: 'Scarico' };
export const NOMI_INTENSITA: Record<Intensita, string> = { moderata: 'Moderata', standard: 'Standard', alta: 'Alta' };
export const DESCRIZIONE_INTENSITA: Record<Intensita, string> = {
  moderata: 'Tutte le serie a 2–3 ripetizioni dal cedimento, mai a cedimento; una serie in meno sui complementari (minimo 2). Target e fondamentali invariati.',
  standard: 'Come i blocchi di riferimento: 1–2 ripetizioni dal cedimento, cedimento solo sull’ultima serie di Target e isolamenti.',
  alta: 'Cedimento anche sull’ultima serie dei complementari (fondamentali mai); una serie in più sui gruppi prioritari; tecniche avanzate sugli isolamenti.',
};

export function Setup() {
  const esiste = profilo.value;
  const [nome, setNome] = useState(esiste?.nome ?? '');
  const [sesso, setSesso] = useState<'M' | 'F'>(esiste?.sesso ?? 'M');
  const [T, setT] = useState(60);
  const [esperienza, setEsperienza] = useState<Esperienza>('intermedio');
  const [intensita, setIntensita] = useState<Intensita>('standard');
  const [obiettivo, setObiettivo] = useState<Obiettivo>(esiste?.sesso === 'F' ? 'mantenimento' : 'massa');
  const [mesi, setMesi] = useState<number>(3);
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
  // Primo passo: solo uomo o donna; poi le altre domande, adattate al profilo scelto.
  const [passo, setPasso] = useState<1 | 2>(1);
  // Sedute a settimana per profilo (§12c): uomo 4, donna 3; si cambiano poi in Impostazioni → Programma.
  const N = seduteDefault(sesso);
  const ibrido = eIbrido({ preset: sesso === 'F' ? 'donna_glutei' : 'uomo_base', N });
  const settimane = cicliPerObiettivo(obiettivo, mesi, ibrido);

  const scegliSesso = (v: 'M' | 'F') => {
    setSesso(v);
    // La donna ha due obiettivi (§12b): la massa diventa "mantenimento e costruzione".
    if (v === 'F' && obiettivo === 'massa') setObiettivo('mantenimento');
  };
  // Anteprima dell'accento del profilo scelto (§12c).
  useEffect(() => {
    let tema: 'scuro' | 'chiaro' = esiste?.impostazioni.tema ?? 'scuro';
    try {
      if (!esiste && localStorage.getItem('frappaula-tema') === 'chiaro') tema = 'chiaro';
    } catch {
      /* niente archivio */
    }
    applicaTema(tema, sesso);
  }, [sesso]);

  // L'energia discende dall'obiettivo (v2 §1): non si chiede.
  const energia = ENERGIA_PER_OBIETTIVO[obiettivo];
  const preset: Preset = sesso === 'F' ? 'donna_glutei' : 'uomo_base';
  const parametri: ParametriGeneratore = useMemo(
    () => parametriPerObiettivo({ N, T, priorita, esclusi, esperienza, preset, bloccoBreve: obiettivo === 'mantenimento', intensita, bloccoBase: obiettivo === 'mantenimento' ? bloccoBase : undefined }, obiettivo),
    [N, T, priorita, esclusi, esperienza, preset, obiettivo, intensita, bloccoBase],
  );
  // Profilo ibrido: stesso piano su misura del Mantenimento qualunque sia l'obiettivo (§12b).
  const piano = useMemo(() => (ibrido ? proponiPiano({ obiettivo: 'mantenimento', settimane, N, bloccoBase: 1 }) : proponiPiano({ obiettivo, settimane, N, bloccoBase })), [ibrido, obiettivo, settimane, N, bloccoBase]);
  const anteprima = useMemo(() => {
    try {
      const numero = obiettivo === 'definizione' && preset === 'uomo_base' && N === 4 ? 3 : piano[0]?.composizione?.[0]?.bloccoRif ?? 1;
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
      mesi,
      energia,
      kgTarget: parseFloat(kgTarget.replace(',', '.')) || undefined,
      resistenza: obiettivo === 'definizione' && !ibrido ? resistenza : undefined,
      preferisciMacchine: obiettivo === 'definizione' && !ibrido ? preferisciMacchine : undefined,
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

  if (passo === 1) {
    const sceglie = (v: 'M' | 'F') => {
      scegliSesso(v);
      setPasso(2);
      window.scrollTo(0, 0);
    };
    return (
      <div class="pagina">
        <div class="colonna" style="gap:10px;margin-top:12px">
          <div class="eyebrow">Frappaula Fit</div>
          <h1>{esiste ? 'Nuovo profilo' : 'Benvenuto'}</h1>
          <p class="muto">Per chi è questo profilo? Da qui dipendono il programma e i colori dell'app.</p>
        </div>
        {esiste ? <Avviso>Creare un nuovo profilo sostituisce quello attuale su questo dispositivo. Esporta prima un backup dalle Impostazioni.</Avviso> : null}
        <button type="button" class="carta" style="text-align:left;cursor:pointer;color:inherit;gap:6px" onClick={() => sceglie('M')}>
          <h2>Uomo</h2>
          <span class="muto">4 sedute a settimana: il programma a blocchi con fondamentali, test e carichi calcolati.</span>
        </button>
        <button type="button" class="carta" style="text-align:left;cursor:pointer;color:inherit;gap:6px" onClick={() => sceglie('F')}>
          <h2>Donna</h2>
          <span class="muto">3 sedute a settimana: parte classica e poi un circuito a giri, con focus su glutei e dorso.</span>
        </button>
        {esiste ? <button class="bottone fantasma pieno" onClick={() => { applicaTema(esiste.impostazioni.tema ?? 'scuro', esiste.sesso); vai('/impostazioni'); }}>Annulla</button> : null}
      </div>
    );
  }

  return (
    <div class="pagina">
      <button type="button" class="bottone fantasma piccolo" style="align-self:flex-start" onClick={() => setPasso(1)}>← {sesso === 'F' ? 'Donna' : 'Uomo'} · cambia</button>
      <div class="colonna" style="gap:10px;margin-top:12px">
        <div class="eyebrow">Frappaula Fit</div>
        <h1>{esiste ? 'Nuovo profilo' : 'Impostiamo il programma'}</h1>
        <p class="muto">Poche domande: da queste l'app costruisce il piano. Tutto si può cambiare dopo, dalle Impostazioni.</p>
      </div>

      <div class="carta">
        <div class="campo">
          <label>Come ti chiami?</label>
          <input type="text" value={nome} onInput={(e) => setNome((e.target as HTMLInputElement).value)} placeholder="Nome" autocomplete="given-name" />
        </div>
        {sesso === 'F' ? <p class="piccolo">Tre sedute ibride A-B-C: prima la parte classica (hip thrust o squat, dorso per primo nella B), poi un circuito a giri. Dorso in tutte le sedute, glutei con tre stimoli diversi.</p> : <p class="piccolo">Quattro sedute a settimana sul programma a blocchi: si parte da una settimana di test dei carichi.</p>}
      </div>

      <div class="carta">
        <h2>Obiettivo e durata</h2>
        <div class="campo">
          <label>Che obiettivo hai?</label>
          {ibrido ? (
            <>
              <Scelte valori={OBIETTIVI_DONNA} valore={obiettivo} onCambia={setObiettivo} etichette={NOMI_OBIETTIVO_DONNA} />
              <p class="piccolo">{DESCRIZIONE_OBIETTIVO_DONNA[obiettivo === 'definizione' ? 'definizione' : 'mantenimento']} Si può cambiare in corsa senza rifare il test.</p>
            </>
          ) : (
            <>
              <Scelte valori={['massa', 'mantenimento', 'definizione'] as Obiettivo[]} valore={obiettivo} onCambia={setObiettivo} etichette={NOMI_OBIETTIVO} />
              <p class="piccolo">{obiettivo === 'massa' ? 'Surplus calorico: ipertrofia con forza sui blocchi di riferimento.' : obiettivo === 'mantenimento' ? 'Calorie di mantenimento: Fase 1 e Fase 2 con scarico, senza Fase 3 né tecniche.' : 'Deficit: in deficit l’allenamento serve a mantenere il muscolo, non a costruirlo (Preservazione).'}</p>
            </>
          )}
        </div>
        <div class="campo">
          <label>Per quanto tempo?</label>
          <Scelte valori={[...MESI_DURATA]} valore={mesi} onCambia={setMesi} etichette={{ 3: '3 mesi', 6: '6 mesi', 9: '9 mesi', 12: '12 mesi' }} />
          <p class="piccolo">{mesi} mesi ≈ {cicliPerObiettivo('massa', mesi)} settimane, cioè {cicliPerObiettivo('massa', mesi) * N} sedute a {N} a settimana. Un ciclo è un giro delle {N} sedute: se una settimana ne salti una, il piano si allunga ma la sequenza non cambia.</p>
        </div>
        {obiettivo === 'mantenimento' && !ibrido ? (
          <div class="campo">
            <label>Blocco di riferimento</label>
            <Scelte valori={[1, 2] as const} valore={bloccoBase} onCambia={setBloccoBase} etichette={{ 1: 'Blocco 1 (default)', 2: 'Blocco 2' }} />
            <p class="piccolo">Il Blocco 3 è il blocco di definizione: non si usa per il mantenimento.</p>
          </div>
        ) : null}
        {obiettivo === 'definizione' && ibrido ? (
          <div class="campo"><label>Kg da perdere (facoltativo)</label><input type="number" inputMode="decimal" step="0.5" min="0" value={kgTarget} onInput={(e) => setKgTarget((e.target as HTMLInputElement).value)} placeholder="—" /></div>
        ) : null}
        {obiettivo === 'definizione' && !ibrido ? (
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
            <div class="stat"><div class="valore">{cicliTotali}</div><div class="nome">settimane</div></div>
            <div class="stat"><div class="valore">{cicliTotali * N}</div><div class="nome">sedute</div></div>
            <div class="stat"><div class="valore">{Math.round(anteprima.sessioni.reduce((a, s) => a + s.durataS, 0) / anteprima.sessioni.length / 60)}′</div><div class="nome">durata media</div></div>
          </div>
          {composizione ? <p><b>{descriviComposizione(composizione)}</b></p> : null}
          <div class="colonna" style="gap:6px">
            {ibrido ? tappe.map((t) => (
              <div class="riga spazio"><span><b>{t.fase ? NOMI_FASI[t.fase] : NOMI_MODULO[t.modulo]}</b>{t.fase === 'test' ? <span class="piccolo"> · 3 sedute</span> : null}</span><span class="piccolo">{t.cicli} {t.cicli === 1 ? 'settimana' : 'settimane'}</span></div>
            )) : tappe.map((t) => (
              <div class="riga spazio"><span><b>{NOMI_MODULO[t.modulo]}</b>{t.cicliPreservazione ? <span class="piccolo"> · {t.cicliPreservazione.filter((c) => c === 'S').length} di scarico</span> : null}{t.bloccoRif ? <span class="piccolo"> · Blocco {t.bloccoRif}</span> : null}</span><span class="piccolo">{t.cicli} {t.cicli === 1 ? 'ciclo' : 'cicli'}</span></div>
            ))}
          </div>
          <p class="piccolo">{ibrido && composizione ? percheIbrido(composizione, obiettivo) : piano[0].perche}</p>
          {anteprima.avvisi.map((a) => <Avviso>{a}</Avviso>)}
          <table class="tabella">
            <thead><tr><th>Gruppo</th><th class="num">Serie / sett.</th><th class="num">Riferimento</th></tr></thead>
            <tbody>
              {GRUPPI.map((g) => (
                <tr><td>{NOMI_GRUPPI[g]}</td><td class="num">{anteprima.volume[g]}</td><td class="num muto">{target[g]}</td></tr>
              ))}
            </tbody>
          </table>
          {obiettivo === 'definizione' && !ibrido ? <p class="piccolo">In Preservazione restano le stesse serie del blocco, senza tecniche (rest-pause, seconde righe); i fondamentali al 77–82 % mai a cedimento. Le seconde righe tolte abbassano un po' i totali qui sopra.</p> : null}
          <button type="button" class="bottone fantasma" onClick={() => setMostraDettagli(!mostraDettagli)}>
            {mostraDettagli ? 'Nascondi le sedute' : 'Vedi le sedute del programma'}
          </button>
          {mostraDettagli ? anteprima.sessioni.map((s) => (
            <div class="colonna" style="gap:4px">
              <div class="riga spazio"><h3>{s.nome} · {s.etichetta}</h3><span class="piccolo">≈ {minuti(s.durataS)}′</span></div>
              {s.esercizi.map((e) => (
                <div class="riga spazio piccolo" style="color:var(--testo2)">
                  <span>{ESERCIZI_PER_ID[e.esercizio_id]?.nome}</span>
                  {e.circuito ? <span class="chip">circuito</span> : <span class={`badge ${e.ruolo}`}>{e.ruolo}</span>}
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
      {esiste ? <button class="bottone fantasma pieno" onClick={() => { applicaTema(esiste.impostazioni.tema ?? 'scuro', esiste.sesso); vai('/impostazioni'); }}>Annulla</button> : null}
    </div>
  );
}
