import { useEffect, useState } from 'preact/hooks';
import type { EsercizioSeduta, Fase, Gruppo, RegistroEsercizio, Seduta as TSeduta, SerieRegistrata } from '../../tipi';
import { CARICO_MODO, NOMI_GRUPPI, esercizio as trovaEsercizio } from '../../data/esercizi';
import { alternative } from '../../motore/generatore';
import { durataStimata, minuti, prescrizione, rigaDi, serieRip } from '../../motore/prescrizione';
import { percentualeRM, stimaMassimale } from '../../motore/carichi';
import { CIRCUITO, tempiCircuito } from '../../data/tabelle';
import {
  aggiornaSerie,
  annullaSeduta,
  avviabile,
  blocco,
  completaSeduta,
  impostaGiri,
  impostazioni,
  inAnteprima,
  iniziaSeduta,
  prescrizioneDi,
  profilo,
  registroDi,
  riapriSeduta,
  salvaTest,
  sedutaPerId,
  sostituisciEsercizio,
  stato,
  testBloccoPrecedente,
} from '../../store/stato';
import { Avviso, Badge, Controllo, Modale, Scelte, Testata, formatoData, formatoKg } from '../componenti/comuni';
import { Icona, IconaEsercizio } from '../componenti/IconaEsercizio';
import { infoCiclo } from '../etichette';
import { aggiungiSecondi, attivo, avviaTimer, fermaTimer, formatoMMSS, rimanente, timer } from '../timer';
import { vai } from '../router';

// Seduta (SPEC_PIANIFICATORE v2 §11c): testata per modulo, gruppi come eyebrow sopra un filo, esercizio in corso
// espanso con una riga per serie e controlli − / +, barra fissa in basso con recupero e "Serie fatta".
// La scheda del singolo esercizio (note, ciclo scorso, rest-pause, stripping) resta sulla sua rotta.

const ORDINE_GRUPPI: Gruppo[] = ['petto', 'dorso', 'spalle', 'gambe', 'bicipiti', 'tricipiti', 'addome'];

function gruppi(s: TSeduta): { gruppo: Gruppo; esercizi: EsercizioSeduta[] }[] {
  const out: { gruppo: Gruppo; esercizi: EsercizioSeduta[] }[] = [];
  for (const e of s.esercizi) {
    let g = out.find((x) => x.gruppo === e.gruppo);
    if (!g) {
      g = { gruppo: e.gruppo, esercizi: [] };
      out.push(g);
    }
    g.esercizi.push(e);
  }
  return out.sort((a, b) => {
    const ia = s.esercizi.findIndex((e) => e.gruppo === a.gruppo);
    const ib = s.esercizi.findIndex((e) => e.gruppo === b.gruppo);
    return ia - ib || ORDINE_GRUPPI.indexOf(a.gruppo) - ORDINE_GRUPPI.indexOf(b.gruppo);
  });
}

function recuperoTesto(sec: number): string {
  if (sec % 60 === 0) return `${sec / 60} min`;
  return sec >= 60 ? `${Math.floor(sec / 60)}′${String(sec % 60).padStart(2, '0')}″` : `${sec}″`;
}

function Sostituzione({ s, es, onChiudi }: { s: TSeduta; es: EsercizioSeduta; onChiudi: () => void }) {
  const p = profilo.value!;
  const usati = s.esercizi.map((e) => e.esercizio_id);
  const alt = alternative(es.esercizio_id, p.parametri.esclusi, usati, p);
  const [permanente, setPermanente] = useState(true);
  const test = blocco.value?.test ?? {};
  return (
    <Modale titolo="Sostituisci" onChiudi={onChiudi}>
      <p class="muto">
        Alternative della stessa classe di <b>{trovaEsercizio(es.esercizio_id, p.esercizi_personalizzati)?.nome}</b>.
        {s.fase === 'test' ? ' In fase di test l’alternativa si testa da sé.' : ' Se l’alternativa ha un test usa quello, altrimenti eredita il carico dell’originale.'}
      </p>
      {alt.length === 0 ? <Avviso>Nessuna alternativa disponibile (tutte escluse o già in seduta).</Avviso> : null}
      {alt.map((a) => (
        <button class="bottone pieno" style="justify-content:space-between" onClick={async () => { await sostituisciEsercizio(s.id, es.slot, a.id, permanente); onChiudi(); }}>
          <span class="riga" style="gap:10px"><IconaEsercizio def={a} piccola /> {a.nome}</span>
          <span class="piccolo">{test[a.id] ? `test ${test[a.id].rm1 ? `1@${test[a.id].rm1}` : `${test[a.id].rip}@${test[a.id].kg}`}` : s.fase === 'test' ? '' : 'eredita'}</span>
        </button>
      ))}
      <label class="riga" style="gap:10px;padding:6px 0">
        <input type="checkbox" checked={permanente} onChange={(e) => setPermanente((e.target as HTMLInputElement).checked)} />
        <span class="muto">Anche nelle prossime sedute di questo giorno</span>
      </label>
    </Modale>
  );
}

/** Scheda di riscaldamento a salire prima del test di stima (ebook, TEST_INIZIO_BLOCCO §2.1). */
function Riscaldamento({ riferimento, passo }: { riferimento: number; passo: number }) {
  const tappe: [string, number][] = [['1×8', 0.3], ['1×5', 0.4], ['1×3', 0.5], ['1×3', 0.6], ['2×2', 0.7], ['2×1', 0.8], ['1×1', 0.9]];
  const arr = (x: number) => Math.round(x / passo) * passo;
  return (
    <div class="colonna" style="gap:4px">
      <div class="piccolo">Riscaldamento a salire sul massimale di riferimento {formatoKg(riferimento)} (riposi da 1′ a 5′):</div>
      <div class="riga" style="flex-wrap:wrap;gap:6px">
        {tappe.map(([s, f]) => <span class="chip">{s} · {Math.round(f * 100)}% · {arr(riferimento * f)} kg</span>)}
      </div>
    </div>
  );
}

/** Riga della settimana di test: `stima` (fondamentali, con ripetizioni di riserva) o `serie_unica` (TEST_INIZIO_BLOCCO §2). */
function RigaTest({ s, es }: { s: TSeduta; es: EsercizioSeduta }) {
  const b = blocco.value!;
  const p = profilo.value!;
  const def = trovaEsercizio(es.esercizio_id, p.esercizi_personalizzati);
  const t = b.test[es.esercizio_id];
  const pr = prescrizione(es, s, b.test, impostazioni.value, 0, p.fondamentali_promossi ?? []);
  const stima = pr.modoTest === 'stima';
  const precedente = testBloccoPrecedente(es.esercizio_id);
  const [aperta, setAperta] = useState(!t);
  const [kg, setKg] = useState(t ? String(t.kg) : '');
  const [rip, setRip] = useState(t ? String(t.rip) : precedente?.modo === 'stima' ? String(precedente.rip) : '3');
  const [rir, setRir] = useState<number>(t?.rir ?? 0);
  const [risultato, setRisultato] = useState<number | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [riscaldamento, setRiscaldamento] = useState(false);
  const [sost, setSost] = useState(false);
  const modo = def ? CARICO_MODO[def.carico_modo] : undefined;
  const notaMultipower = def?.esclude_bilanciere ? ' Carico escludendo il peso del bilanciere del multipower.' : '';
  const k = parseFloat(kg.replace(',', '.'));
  const r = parseInt(rip, 10);
  const kgOk = Number.isFinite(k) && k >= 0;
  const ripOk = Number.isFinite(r) && r >= 1 && r + rir <= 12;

  const calcola = () => {
    try {
      setRisultato(stimaMassimale(r, k, impostazioni.value.arrotondamento, rir));
      setErrore(null);
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Valori non validi');
    }
  };
  const salvaStima = async () => {
    await salvaTest(es.esercizio_id, k, r, 'stima', rir);
    setAperta(false);
    setRisultato(null);
  };
  const salvaSerie = async () => {
    await salvaTest(es.esercizio_id, k, pr.rip, 'serie_unica');
    setAperta(false);
  };
  const riferimento = risultato ?? t?.rm1 ?? precedente?.rm1 ?? (kgOk && ripOk && k > 0 ? Math.round(k * 36 / (37 - r - rir)) : 0);

  return (
    <div class="colonna" style="padding:12px 0;border-top:1px solid var(--filo);gap:8px">
      <div class="riga">
        <span class={`spunta ${t ? 'fatta' : ''}`}>{t ? <Icona nome="spunta" dimensione={16} /> : null}</span>
        <IconaEsercizio def={def} />
        <div class="cresce">
          <div class="nome" style="font-size:17px;font-weight:600">{def?.nome ?? es.esercizio_id}</div>
          <div class="dettaglio" style="margin-top:3px;display:flex;gap:8px;flex-wrap:wrap;font-size:13px;color:var(--testo2)">
            <Badge ruolo={es.ruolo} />
            {t ? <span>{t.modo === 'stima' ? `1@${t.rm1} kg (${t.rip}×${t.kg}${t.rir ? ` +${t.rir} RIR` : ''})` : `${t.rip}@${t.kg} kg`}</span> : <span class="piccolo">{stima ? 'stima del massimale' : `serie unica ${pr.rip}RM`}</span>}
          </div>
        </div>
        {t && !aperta ? <button class="bottone piccolo" onClick={() => setAperta(true)}>Modifica</button> : null}
        {s.stato !== 'completata' ? <button class="icona-bottone" aria-label="Sostituisci esercizio" onClick={() => setSost(true)}><Icona nome="scambia" dimensione={20} /></button> : null}
      </div>

      {aperta && s.stato !== 'completata' ? (
        <div class="carta compatta" style="background:var(--carta2);gap:10px">
          {stima ? (
            <>
              <h3>Stima del massimale</h3>
              <p class="piccolo">Fai una prova con un peso il più vicino possibile al massimale: con 3–5 ripetizioni la stima è affidabile, con 10 o più molto meno. {modo?.testo}</p>
              {precedente ? <p class="piccolo">Blocco precedente: {precedente.modo === 'stima' ? `1@${precedente.rm1} kg` : `${precedente.rip}@${precedente.kg} kg`}.</p> : null}
              {risultato === null ? (
                <>
                  <div class="riga" style="gap:8px">
                    <div class="campo cresce"><label>Reps</label><input type="number" inputMode="numeric" min="1" max="12" value={rip} onInput={(e) => setRip((e.target as HTMLInputElement).value)} /></div>
                    <div class="campo cresce"><label>Carico (kg)</label><input type="number" inputMode="decimal" step="0.5" min="0" value={kg} onInput={(e) => setKg((e.target as HTMLInputElement).value)} placeholder="0" /></div>
                  </div>
                  <div class="campo">
                    <label>Ripetizioni di riserva (0 = a cedimento)</label>
                    <Scelte valori={[0, 1, 2, 3, 4]} valore={rir} onCambia={setRir} />
                  </div>
                  {Number.isFinite(r) && r > 8 && r <= 12 ? <Avviso>Oltre 8 ripetizioni la stima diventa imprecisa: meglio una prova più pesante con 3–5 ripetizioni.</Avviso> : null}
                  {Number.isFinite(r) && r + rir > 12 ? <Avviso tipo="errore">Oltre 12 ripetizioni effettive la formula perde senso: ripeti la prova con più carico.</Avviso> : null}
                  {errore ? <Avviso tipo="errore">{errore}</Avviso> : null}
                  <button class="bottone primario pieno" disabled={!kgOk || k <= 0 || !ripOk} onClick={calcola}>Calcola massimale</button>
                  {!kgOk || k <= 0 || !Number.isFinite(r) ? <p class="piccolo centrato">Scrivi reps e carico per la stima.</p> : null}
                  <button class="bottone fantasma piccolo" onClick={() => setRiscaldamento(!riscaldamento)}>{riscaldamento ? 'Nascondi riscaldamento' : 'Riscaldamento consigliato'}</button>
                  {riscaldamento && riferimento > 0 ? <Riscaldamento riferimento={riferimento} passo={impostazioni.value.arrotondamento} /> : null}
                </>
              ) : (
                <>
                  <div class="timer-grande" style="padding:4px 0">
                    <div class="tempo" style="font-size:52px">{formatoKg(risultato)}</div>
                    <div class="piccolo">Carico stimato (1RM) da {r} × {k} kg{rir ? ` con ${rir} di riserva (${r + rir} ripetizioni effettive)` : ''}</div>
                  </div>
                  <div class="griglia2">
                    <button class="bottone" onClick={() => setRisultato(null)}>Non mi torna, ricalcola</button>
                    <button class="bottone primario" onClick={salvaStima}>Salva e completa</button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <h3>Serie unica di test</h3>
              <p class="piccolo">Devi fare un test <b>{pr.rip}RM</b>: il peso più alto possibile con cui riesci a fare {pr.rip} ripetizioni a cedimento tecnico. {modo?.testo}{notaMultipower}</p>
              <p class="piccolo">Se ne fai più di {pr.rip + 2} il peso era leggero: ripeti dopo 3 minuti con più carico. Meglio farsi contare le ripetizioni o filmarsi.</p>
              {precedente ? <p class="piccolo">Blocco precedente: {precedente.modo === 'stima' ? `1@${precedente.rm1} kg` : `${precedente.rip}@${precedente.kg} kg`}.</p> : null}
              <div class="riga" style="gap:8px">
                <div class="campo cresce"><label>Reps</label><div class="input" style="display:flex;align-items:center;justify-content:center;font-weight:600;min-height:46px;opacity:.7">{pr.rip}</div></div>
                <div class="campo cresce"><label>Carico (kg){modo ? ` · ${modo.breve}` : ''}</label><input type="number" inputMode="decimal" step="0.5" min="0" value={kg} onInput={(e) => setKg((e.target as HTMLInputElement).value)} placeholder="0" /></div>
              </div>
              <button class="bottone primario pieno" disabled={!kgOk} onClick={salvaSerie}>Salva e completa esercizio</button>
              {!kgOk ? <p class="piccolo centrato">Completa i campi prima di procedere.</p> : null}
            </>
          )}
          {t ? <button class="bottone fantasma piccolo" onClick={() => { setAperta(false); setRisultato(null); }}>Annulla</button> : null}
        </div>
      ) : null}
      {sost ? <Sostituzione s={s} es={es} onChiudi={() => setSost(false)} /> : null}
    </div>
  );
}

/** Campi (kg, rip) della serie corrente dell'esercizio aperto: li legge la barra "Serie fatta". */
export interface CampiSerie {
  slot: number;
  n: number;
  kg: string;
  rip: string;
}

/** Serie dell'esercizio in corso: fatte compatte, corrente con − / +, future compatte (§11c punto 3). */
function SerieEspanse({ s, es, reg, campi, setCampi, soloLettura }: { s: TSeduta; es: EsercizioSeduta; reg: RegistroEsercizio; campi: CampiSerie | null; setCampi: (c: CampiSerie | null) => void; soloLettura: boolean }) {
  const passo = impostazioni.value.arrotondamento;
  const corrente = reg.serie.find((x) => !x.fatta);
  const ultima = Math.max(...reg.serie.filter((y) => !y.stripping).map((y) => y.n));
  // Quando cambia la serie corrente, i campi ripartono dai valori previsti.
  useEffect(() => {
    if (!corrente) return;
    if (campi && campi.slot === es.slot && campi.n === corrente.n) return;
    setCampi({ slot: es.slot, n: corrente.n, kg: corrente.kg !== undefined ? String(corrente.kg) : corrente.kg_prev ? String(corrente.kg_prev) : '', rip: corrente.rip !== undefined ? String(corrente.rip) : String(corrente.rip_prev) });
  }, [es.slot, corrente?.n, corrente?.kg_prev]);

  const testoFatta = (x: SerieRegistrata) => (x.rest_pause ? `${x.kg ?? x.kg_prev} kg · ${x.rip ?? x.mini?.reduce((a, b) => a + b, 0) ?? ''} rip totali` : `${formatoKg(x.kg ?? x.kg_prev)} × ${x.rip ?? x.rip_prev}`);
  return (
    <div class="serie-lista">
      {reg.serie.map((x) => {
        const eCorrente = corrente?.n === x.n && !soloLettura;
        if (x.fatta) {
          return (
            <div class={`serie-inline fatta`}>
              <button type="button" class="cerchio" aria-label={`Serie ${x.n} fatta: tocca per riaprirla`} disabled={soloLettura} onClick={() => void aggiornaSerie(s.id, es.slot, x.n, { fatta: false })}><Icona nome="spunta" dimensione={14} /></button>
              <span class="valore">{testoFatta(x)}</span>
              {x.stripping ? <span class="piccolo">stripping −20 %</span> : null}
              {x.n === ultima && !x.stripping ? (
                <div class="riga cresce" style="gap:4px;justify-content:flex-end;flex-wrap:wrap">
                  {(['facile', 'giusto', 'limite'] as const).map((v) => (
                    <button class={`bottone piccolo ${x.sforzo === v ? 'primario' : 'fantasma'}`} style="min-height:32px;padding:0 9px;font-size:12px" disabled={soloLettura} onClick={() => void aggiornaSerie(s.id, es.slot, x.n, { sforzo: v })}>{v === 'facile' ? 'Facile' : v === 'giusto' ? 'Giusto' : 'Al limite'}</button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        }
        if (x.rest_pause) {
          return (
            <div class={`serie-inline ${eCorrente ? 'corrente' : 'futura'}`}>
              <span class="cerchio">{x.n}</span>
              <span class="valore">{x.rest_pause === 'totale' ? `${x.rip_prev} rip totali` : '10 + 3 × max'}</span>
              <button class="bottone piccolo" style="margin-left:auto" onClick={() => vai(`/seduta/${s.id}/es/${es.slot}`)}>Rest-pause →</button>
            </div>
          );
        }
        if (eCorrente && campi && campi.slot === es.slot && campi.n === x.n) {
          return (
            <div class="serie-inline corrente">
              <span class="cerchio">{x.n}</span>
              <div class="controlli">
                <Controllo valore={campi.kg} passo={passo} onCambia={(kg) => setCampi({ ...campi, kg })} unita="kg" etichettaAria={`kg serie ${x.n}`} />
                <Controllo valore={campi.rip} passo={1} onCambia={(rip) => setCampi({ ...campi, rip })} unita="rip" etichettaAria={`ripetizioni serie ${x.n}`} />
              </div>
            </div>
          );
        }
        return (
          <div class="serie-inline futura">
            <span class="cerchio">{x.n}</span>
            <span class="valore">{x.kg_prev ? formatoKg(x.kg_prev) : '—'} × {x.rip_prev}</span>
            {x.kg_piano !== undefined && x.kg_piano !== x.kg_prev ? <span class="piccolo">piano {x.kg_piano} kg</span> : null}
          </div>
        );
      })}
    </div>
  );
}

function RigaEsercizio({ s, es, aperto, onApri, onSostituisci, campi, setCampi }: { s: TSeduta; es: EsercizioSeduta; aperto: boolean; onApri: () => void; onSostituisci: () => void; campi: CampiSerie | null; setCampi: (c: CampiSerie | null) => void }) {
  const p = profilo.value!;
  const def = trovaEsercizio(es.esercizio_id, p.esercizi_personalizzati);
  const pr = prescrizioneDi(es, s);
  const reg = registroDi(s.id)?.esercizi[es.slot];
  const fatte = reg?.serie.filter((x) => x.fatta && !x.stripping).length ?? 0;
  const tutte = reg ? fatte >= reg.serie.filter((x) => !x.stripping).length : false;
  const recupero = impostazioni.value.recuperi[es.ruolo];
  const inCorso = s.stato === 'in_corso';
  const vaiDettaglio = () => vai(`/seduta/${s.id}/es/${es.slot}`);
  return (
    <div class={`gruppo-esercizio ${aperto ? 'aperto' : ''}`}>
      <div class={`esercizio-riga ${aperto ? 'aperto' : ''}`} onClick={inCorso ? onApri : vaiDettaglio}>
        <IconaEsercizio def={def} />
        <div class="cresce">
          <div class="riga spazio" style="gap:8px;align-items:baseline">
            <div class="nome">{def?.nome ?? es.esercizio_id}</div>
            <Badge ruolo={es.ruolo} />
          </div>
          <div class="dettaglio">
            <span>{reg ? reg.serie.filter((x) => !x.stripping).length : pr.serie} × {pr.rip}</span>
            <span>·</span>
            <span>{pr.kg !== undefined ? formatoKg(pr.kg) : es.senza_carico ? 'carico a scelta' : 'senza test'}{pr.corrente ? ' (tuo)' : ''}</span>
            <span>·</span>
            <span>recupero {recuperoTesto(recupero)}</span>
            {pr.scalaRM ? <span class="piccolo">· {pr.scalaRM}RM · {Math.round(percentualeRM(pr.scalaRM) * 100)} %</span> : null}
            {pr.percentuale ? <span class="piccolo">· {Math.round(pr.percentuale * 100)} %</span> : null}
            {pr.rest_pause ? <span class="piccolo">· rest-pause</span> : null}
            {reg ? <span class="piccolo">· {fatte}/{reg.serie.filter((x) => !x.stripping).length} fatte</span> : null}
          </div>
        </div>
        {tutte ? <span class="spunta fatta"><Icona nome="spunta" dimensione={16} /></span> : null}
      </div>
      {aperto && inCorso && reg ? (
        <>
          <SerieEspanse s={s} es={es} reg={reg} campi={campi} setCampi={setCampi} soloLettura={false} />
          <div class="riga spazio" style="padding:8px 0 10px">
            <button class="bottone piccolo fantasma" onClick={vaiDettaglio}>Scheda, note e ciclo scorso →</button>
            <button class="bottone piccolo fantasma" onClick={onSostituisci}>Sostituisci</button>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Valore speciale di "esercizio aperto": il circuito. */
const APERTO_CIRCUITO = -999;

/** Stazione e giro correnti del circuito: la prima stazione non fatta, giro per giro (§12b). */
export function stazioneCorrente(stazioni: EsercizioSeduta[], reg: { esercizi: Record<number, RegistroEsercizio> } | undefined, giri: number): { es: EsercizioSeduta; giro: number } | undefined {
  for (let g = 1; g <= giri; g++) {
    for (const e of stazioni) {
      const x = reg?.esercizi[e.slot]?.serie.find((y) => y.n === g);
      if (x && !x.fatta) return { es: e, giro: g };
    }
  }
  return undefined;
}

function secondiTesto(sec: number): string {
  return sec >= 60 ? recuperoTesto(sec) : `${sec}″`;
}

/**
 * Circuito PHA (SPEC_PIANIFICATORE §12b): blocco raggruppato di stazioni, giri a scelta (2–4), un timer per giro
 * (transizione tra le stazioni e recupero a fine giro) e il contatore dei giri.
 */
function BloccoCircuito({ s, stazioni, giri, corrente, attivoOra, onAttiva, onSostituisci, campi, setCampi }: { s: TSeduta; stazioni: EsercizioSeduta[]; giri: number; corrente?: { es: EsercizioSeduta; giro: number }; attivoOra: boolean; onAttiva: () => void; onSostituisci: (e: EsercizioSeduta) => void; campi: CampiSerie | null; setCampi: (c: CampiSerie | null) => void }) {
  const p = profilo.value!;
  const b = blocco.value!;
  const reg = registroDi(s.id);
  const tempi = tempiCircuito(b.parametri.obiettivoIbrido);
  const passo = impostazioni.value.arrotondamento;
  const inCorso = s.stato === 'in_corso';
  const giroCorrente = corrente?.giro ?? giri;
  const giriFatti = Array.from({ length: giri }, (_, i) => i + 1).filter((g) => stazioni.every((e) => reg?.esercizi[e.slot]?.serie.find((x) => x.n === g)?.fatta)).length;
  const serieCorr = corrente ? reg?.esercizi[corrente.es.slot]?.serie.find((x) => x.n === corrente.giro) : undefined;
  // Quando cambia la stazione corrente, i campi ripartono dai valori previsti.
  useEffect(() => {
    if (!attivoOra || !corrente || !serieCorr) return;
    if (campi && campi.slot === corrente.es.slot && campi.n === corrente.giro) return;
    setCampi({ slot: corrente.es.slot, n: corrente.giro, kg: serieCorr.kg !== undefined ? String(serieCorr.kg) : serieCorr.kg_prev ? String(serieCorr.kg_prev) : '', rip: serieCorr.rip !== undefined ? String(serieCorr.rip) : String(serieCorr.rip_prev) });
  }, [attivoOra, corrente?.es.slot, corrente?.giro, serieCorr?.kg_prev]);
  const minimoGiri = Math.max(CIRCUITO.giriMin, giriFatti + (corrente && corrente.giro > giriFatti && stazioni.some((e) => reg?.esercizi[e.slot]?.serie.find((x) => x.n === corrente.giro)?.fatta) ? 1 : 0));
  const sceltaGiri = Array.from({ length: CIRCUITO.giriMax - CIRCUITO.giriMin + 1 }, (_, i) => CIRCUITO.giriMin + i).filter((g) => g >= minimoGiri);

  return (
    <div class={`circuito ${attivoOra ? 'attivo' : ''}`}>
      <div class="riga spazio" style="align-items:baseline">
        <span class="eyebrow">Circuito · {stazioni.length} stazioni</span>
        <span class="piccolo">{s.fase === 'test' ? '' : !reg ? `${giri} giri` : giriFatti >= giri ? `${giri} giri fatti` : `giro ${Math.min(giroCorrente, giri)} di ${giri}`}</span>
      </div>
      <div class="giri">
        <div class="pallini" aria-label={`${giriFatti} giri su ${giri}`}>
          {Array.from({ length: giri }, (_, i) => <span class={i < giriFatti ? 'fatto' : i === giriFatti && inCorso ? 'corrente' : ''} />)}
        </div>
        <span class="piccolo">transizioni {secondiTesto(tempi.transizione)} · fine giro {secondiTesto(tempi.recuperoGiro)} · {CIRCUITO.ripMin}–{CIRCUITO.ripMax} rip, 1–2 di riserva</span>
      </div>
      {inCorso ? (
        <div class="riga" style="gap:8px;align-items:center;flex-wrap:wrap">
          <span class="piccolo">Giri</span>
          <Scelte valori={sceltaGiri} valore={giri} onCambia={(g) => void impostaGiri(s.id, g)} />
        </div>
      ) : null}
      {reg?.notaGiri ? <p class="piccolo">{reg.notaGiri}</p> : null}
      {stazioni.map((e, i) => {
        const def = trovaEsercizio(e.esercizio_id, p.esercizi_personalizzati);
        const pr = prescrizioneDi(e, s);
        const serie = reg?.esercizi[e.slot]?.serie.find((x) => x.n === giroCorrente);
        const fatta = Boolean(serie?.fatta) || (giriFatti >= giri && giri > 0 && Boolean(reg));
        const eCorrente = attivoOra && corrente?.es.slot === e.slot;
        const kg = serie ? serie.kg ?? serie.kg_prev : pr.kg;
        return (
          <div class={`stazione ${fatta ? 'fatta' : ''} ${eCorrente ? 'corrente' : ''}`}>
            <span class="numero">{fatta ? <Icona nome="spunta" dimensione={14} /> : i + 1}</span>
            <div class="cresce" style="min-width:0">
              <div class="riga spazio" style="gap:8px">
                <button type="button" class="nome" style="background:none;border:0;padding:0;text-align:left;cursor:pointer" onClick={() => vai(`/seduta/${s.id}/es/${e.slot}`)}>{def?.nome ?? e.esercizio_id}</button>
                {inCorso && !fatta ? <button class="icona-bottone" aria-label="Sostituisci esercizio" onClick={() => onSostituisci(e)}><Icona nome="scambia" dimensione={18} /></button> : null}
              </div>
              <div class="piccolo">{kg ? formatoKg(kg) : 'carico da scegliere'} × {serie?.fatta ? `${serie.rip ?? serie.rip_prev} rip` : `${CIRCUITO.ripMin}–${CIRCUITO.ripMax}`}{NOMI_GRUPPI[e.gruppo] ? ` · ${NOMI_GRUPPI[e.gruppo].toLowerCase()}` : ''}</div>
              {eCorrente && campi && campi.slot === e.slot && campi.n === corrente!.giro ? (
                <div class="controlli" style="margin-top:8px">
                  <Controllo valore={campi.kg} passo={passo} onCambia={(v) => setCampi({ ...campi, kg: v })} unita="kg" etichettaAria={`kg ${def?.nome ?? ''}`} />
                  <Controllo valore={campi.rip} passo={1} onCambia={(v) => setCampi({ ...campi, rip: v })} unita="rip" etichettaAria={`ripetizioni ${def?.nome ?? ''}`} />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
      {inCorso && !attivoOra && corrente ? <button class="bottone pieno" onClick={onAttiva}>Vai al circuito</button> : null}
    </div>
  );
}

/** Barra fissa in basso: recupero a sinistra, "Serie fatta" a destra (§11c punto 4). */
function BarraSeduta({ testo, disabilitato, onFatta, secondario }: { testo: string; disabilitato?: boolean; onFatta: () => void; secondario?: boolean }) {
  const t = timer.value;
  const inTimer = attivo.value;
  const finito = !inTimer && t !== null && t.fine > Date.now() - 20000;
  return (
    <div class="barra-seduta">
      <div>
        <div class="recupero">
          <span class="eyebrow">Recupero</span>
          <span class={`tempo ${finito ? 'finito' : ''}`}>{inTimer ? formatoMMSS(rimanente.value) : finito ? 'Vai' : '–:––'}</span>
          {inTimer ? (
            <div class="azioni-timer">
              <button type="button" onClick={() => aggiungiSecondi(-15)}>−15″</button>
              <button type="button" onClick={() => aggiungiSecondi(30)}>+30″</button>
              <button type="button" onClick={fermaTimer}>Salta</button>
            </div>
          ) : null}
        </div>
        <button class={`bottone ${secondario ? '' : 'primario'}`} disabled={disabilitato} onClick={onFatta}>{testo}</button>
      </div>
    </div>
  );
}

export function Seduta({ id }: { id: string }) {
  void stato.value;
  const s = sedutaPerId(id);
  const b = blocco.value;
  const p = profilo.value;
  const [sost, setSost] = useState<EsercizioSeduta | null>(null);
  const [confermaCompleta, setConfermaCompleta] = useState(false);
  const [confermaAnnulla, setConfermaAnnulla] = useState(false);
  const [congratulazioni, setCongratulazioni] = useState(false);
  const [apertoScelto, setApertoScelto] = useState<number | null>(null);
  const [campi, setCampi] = useState<CampiSerie | null>(null);
  if (!s || !b || !p) return <div class="pagina"><Testata /><p class="muto">Seduta non trovata.</p></div>;

  const puoIniziare = avviabile(s);
  const anteprima = inAnteprima(s);
  const prova = Boolean(impostazioni.value.modalita_prova);
  const reg = registroDi(s.id);
  const info = infoCiclo(b, s);
  const serieTotali = s.fase === 'test' ? 0 : s.esercizi.reduce((a, e) => a + (reg?.esercizi[e.slot]?.serie.filter((x) => !x.stripping).length ?? prescrizioneDi(e, s).serie), 0);
  const serieFatte = reg ? Object.values(reg.esercizi).reduce((a, e) => a + e.serie.filter((x) => x.fatta && !x.stripping).length, 0) : 0;
  const esercizioCompleto = (e: EsercizioSeduta) => {
    const r = reg?.esercizi[e.slot];
    return Boolean(r && r.serie.filter((x) => !x.stripping).every((x) => x.fatta));
  };
  const fatte = s.esercizi.filter(esercizioCompleto).length;
  // Circuito (§12b): stazioni a giri, separate dalla parte classica.
  const stazioni = s.fase === 'test' ? [] : s.esercizi.filter((e) => e.circuito);
  const classiche = s.fase === 'test' ? s.esercizi : s.esercizi.filter((e) => !e.circuito);
  const giri = stazioni.length ? reg?.giri ?? prescrizioneDi(stazioni[0], s).serie : 0;
  const serieClassica = (e: EsercizioSeduta) => reg?.esercizi[e.slot]?.serie.filter((x) => !x.stripping).length ?? serieRip(e.ruolo, s.fase as Exclude<Fase, 'test'>, rigaDi(s), e)[0];
  const durata = s.fase === 'test' ? 0 : durataStimata(s.esercizi.map((e) => ({ ruolo: e.ruolo, serie: e.circuito ? giri : serieClassica(e), superserie: e.superserie, circuito: e.circuito })), impostazioni.value.recuperi, tempiCircuito(b.parametri.obiettivoIbrido));
  const testMancanti = s.fase === 'test' ? s.esercizi.filter((e) => !b.test[e.esercizio_id]).length : 0;
  const testFatti = s.esercizi.length - testMancanti;
  const tuttiTestDelBlocco = b.sedute.filter((x) => x.fase === 'test').every((x) => x.stato === 'completata' || x.id === s.id);
  const gruppiSeduta = gruppi({ ...s, esercizi: classiche });
  const primoIncompleto = classiche.find((e) => !esercizioCompleto(e));
  const apertoSlot = s.stato === 'in_corso' ? (apertoScelto !== null && classiche.some((e) => e.slot === apertoScelto) ? apertoScelto : apertoScelto === APERTO_CIRCUITO ? null : primoIncompleto?.slot ?? null) : null;
  const corrente = stazioni.length ? stazioneCorrente(stazioni, reg, giri) : undefined;
  const modoCircuito = s.stato === 'in_corso' && apertoSlot === null && Boolean(corrente);
  const esAperto = apertoSlot !== null ? s.esercizi.find((e) => e.slot === apertoSlot) : undefined;
  const regAperto = esAperto ? reg?.esercizi[esAperto.slot] : undefined;
  const serieCorrente = regAperto?.serie.find((x) => !x.fatta);
  const tuttoFatto = s.esercizi.every(esercizioCompleto);

  const completa = async () => {
    await completaSeduta(s.id);
    setConfermaCompleta(false);
    if (s.fase === 'test') setCongratulazioni(true);
    else vai('/');
  };

  /** Stazione fatta: registra la serie del giro e avvia la transizione o, a fine giro, il recupero (§12b). */
  const stazioneFatta = () => {
    if (!corrente) return;
    const { es: e, giro } = corrente;
    const mie = campi && campi.slot === e.slot && campi.n === giro;
    const kg = mie ? parseFloat(campi!.kg.replace(',', '.')) : undefined;
    const rip = mie ? parseInt(campi!.rip, 10) : undefined;
    void aggiornaSerie(s.id, e.slot, giro, { kg: Number.isFinite(kg) ? kg : undefined, rip: Number.isFinite(rip) ? rip : undefined, fatta: true });
    const tempi = tempiCircuito(b.parametri.obiettivoIbrido);
    const i = stazioni.findIndex((x) => x.slot === e.slot);
    const prossima = stazioni.slice(i + 1).find((x) => !reg?.esercizi[x.slot]?.serie.find((y) => y.n === giro)?.fatta);
    if (prossima) {
      avviaTimer(tempi.transizione, `Prossima: ${trovaEsercizio(prossima.esercizio_id, p.esercizi_personalizzati)?.nome ?? ''}`);
    } else if (giro < giri) {
      avviaTimer(tempi.recuperoGiro, `Fine giro ${giro} di ${giri}: recupero`);
    } else {
      fermaTimer();
    }
  };

  const serieFatta = () => {
    if (!esAperto || !serieCorrente) return;
    if (serieCorrente.rest_pause) {
      vai(`/seduta/${s.id}/es/${esAperto.slot}`);
      return;
    }
    const kg = campi && campi.slot === esAperto.slot && campi.n === serieCorrente.n ? parseFloat(campi.kg.replace(',', '.')) : undefined;
    const rip = campi && campi.slot === esAperto.slot && campi.n === serieCorrente.n ? parseInt(campi.rip, 10) : undefined;
    void aggiornaSerie(s.id, esAperto.slot, serieCorrente.n, { kg: Number.isFinite(kg) ? kg : undefined, rip: Number.isFinite(rip) ? rip : undefined, fatta: true });
    const def = trovaEsercizio(esAperto.esercizio_id, p.esercizi_personalizzati);
    avviaTimer(impostazioni.value.recuperi[esAperto.ruolo], def?.nome ?? '');
    // Ultima serie dell'esercizio: si passa al prossimo incompleto.
    const rimaste = regAperto!.serie.filter((x) => !x.fatta && !x.stripping && x.n !== serieCorrente.n).length;
    if (rimaste === 0) setApertoScelto(stazioni.length && classiche.every((x) => x.slot === esAperto.slot || esercizioCompleto(x)) ? APERTO_CIRCUITO : null);
  };

  if (congratulazioni) {
    return (
      <div class="pagina" style="justify-content:center">
        <div class="carta centrato" style="gap:14px;padding:28px 20px;align-items:center">
          <span style="color:var(--accento)"><Icona nome="bandiera" dimensione={44} /></span>
          <h1 style="font-size:32px">{tuttiTestDelBlocco ? 'Test completati' : 'Seduta di test completata'}</h1>
          <p class="muto">
            {tuttiTestDelBlocco
              ? 'Da questi carichi l’app ha calcolato tutte le sedute del programma. Da ora si lavora.'
              : 'I carichi salvati precompilano già le sedute future. Avanti con la prossima seduta di test.'}
          </p>
          <button class="bottone primario pieno" onClick={() => vai('/')}>{tuttiTestDelBlocco ? 'Vai al Percorso' : 'Torna al programma'}</button>
        </div>
      </div>
    );
  }

  return (
    <div class="pagina">
      <Testata sopratitolo={info.testata} accento />
      <div class="colonna" style="gap:8px">
        <h1>{s.nome}</h1>
        <p class="muto">{s.etichetta}{s.fase !== 'test' ? ` · circa ${minuti(durata)} min` : ''}{s.data ? ` · ${formatoData(s.data)}` : ''}</p>
        {s.fase === 'test' ? (
          <>
            <div class="riga" style="gap:8px;align-items:baseline"><b>{testFatti}</b><span class="muto">di {s.esercizi.length} esercizi testati</span></div>
            <div class="progresso sottile"><div style={`width:${s.esercizi.length ? (testFatti / s.esercizi.length) * 100 : 0}%`} /></div>
          </>
        ) : (
          <>
            <div class="riga" style="gap:8px;align-items:baseline"><b>{serieFatte} / {serieTotali}</b><span class="muto">serie</span></div>
            <div class="progresso sottile"><div style={`width:${serieTotali ? (serieFatte / serieTotali) * 100 : 0}%`} /></div>
          </>
        )}
      </div>

      {anteprima ? (
        <Avviso tipo="info">
          <b>Anteprima: non ancora in programma.</b> Serie, ripetizioni e kg sono calcolati con i carichi correnti di oggi e si aggiornano se cambiano. Aprire l'anteprima non modifica nulla.
          {prova ? ' Con la modalità prova puoi comunque avviarla fuori ordine.' : ''}
        </Avviso>
      ) : null}
      {s.stato === 'completata' ? <Avviso tipo="info">Seduta completata. Puoi riaprirla per correggere i dati, o annullarla per cancellarla del tutto.</Avviso> : null}
      {s.fase === 'test' && s.stato !== 'completata' && puoIniziare ? (
        <Avviso tipo="info">Testa i carichi di tutti gli esercizi di questa seduta: da questi l'app calcola con quanto peso lavorare. Fondamentali con la stima del massimale, gli altri con una serie unica a cedimento.</Avviso>
      ) : null}

      {s.stato === 'futura' && s.fase !== 'test' ? (
        <button class="bottone primario pieno" disabled={!puoIniziare} onClick={() => void iniziaSeduta(s.id)}>{anteprima ? (prova ? 'Inizia fuori ordine (prova)' : 'Inizia (dopo le precedenti)') : 'Inizia la seduta'}</button>
      ) : null}

      {gruppiSeduta.map((g) => (
        <div class="gruppo-blocco">
          <div class="gruppo-testata">
            <span class="eyebrow">{NOMI_GRUPPI[g.gruppo]}</span>
            <span class="piccolo">{g.esercizi.length} {g.esercizi.length === 1 ? 'esercizio' : 'esercizi'}</span>
          </div>
          {g.esercizi.map((e) =>
            s.fase === 'test' ? (
              <RigaTest key={e.slot + e.esercizio_id} s={s} es={e} />
            ) : (
              <RigaEsercizio key={e.slot + e.esercizio_id} s={s} es={e} aperto={apertoSlot === e.slot} onApri={() => setApertoScelto(apertoSlot === e.slot ? -1 : e.slot)} onSostituisci={() => setSost(e)} campi={campi} setCampi={setCampi} />
            ),
          )}
        </div>
      ))}

      {stazioni.length ? (
        <BloccoCircuito s={s} stazioni={stazioni} giri={giri} corrente={corrente} attivoOra={modoCircuito} onAttiva={() => setApertoScelto(APERTO_CIRCUITO)} onSostituisci={(e) => setSost(e)} campi={campi} setCampi={setCampi} />
      ) : null}
      {stazioni.length && (tuttoFatto || s.stato === 'completata') ? <p class="piccolo">Facoltativo, a fine seduta: 10′ di camminata tranquilla e qualche minuto sdraiata con le gambe al muro.</p> : null}

      {s.stato !== 'completata' && s.fase === 'test' && puoIniziare ? (
        <button class="bottone pieno" disabled={testMancanti > 0} onClick={completa}>
          {testMancanti > 0 ? `Manca ancora ${testMancanti} ${testMancanti === 1 ? 'esercizio' : 'esercizi'}` : 'Completa seduta di test'}
        </button>
      ) : null}
      {s.stato === 'in_corso' && confermaCompleta ? (
        <div class="carta">
          <p>{fatte < s.esercizi.length ? `Hai completato ${fatte} esercizi su ${s.esercizi.length}. Chiudere comunque la seduta?` : 'Confermi di aver finito?'}</p>
          <div class="griglia2">
            <button class="bottone" onClick={() => setConfermaCompleta(false)}>No</button>
            <button class="bottone primario" onClick={completa}>Sì, completa</button>
          </div>
        </div>
      ) : null}
      {s.stato === 'in_corso' && !confermaCompleta && !tuttoFatto ? <button class="bottone fantasma pieno" onClick={() => setConfermaCompleta(true)}>Completa la seduta senza finire</button> : null}
      {s.stato === 'completata' ? <button class="bottone fantasma pieno" onClick={() => void riapriSeduta(s.id)}>Riapri la seduta</button> : null}
      {s.stato !== 'futura' && s.fase !== 'test' ? (
        !confermaAnnulla ? (
          <button class="bottone fantasma pieno pericolo" onClick={() => setConfermaAnnulla(true)}>Annulla seduta…</button>
        ) : (
          <div class="carta">
            <p>Annullare la seduta? Le serie registrate spariscono e i carichi correnti tornano com'erano prima di iniziarla.</p>
            <div class="griglia2">
              <button class="bottone" onClick={() => setConfermaAnnulla(false)}>No</button>
              <button class="bottone pericolo" onClick={async () => { await annullaSeduta(s.id); setConfermaAnnulla(false); vai('/'); }}>Sì, annulla</button>
            </div>
          </div>
        )
      ) : null}

      {s.stato === 'in_corso' && !confermaCompleta ? (
        tuttoFatto ? (
          <BarraSeduta testo="Completa seduta" onFatta={() => void completa()} />
        ) : modoCircuito ? (
          <BarraSeduta testo="Stazione fatta" onFatta={stazioneFatta} />
        ) : esAperto && serieCorrente ? (
          <BarraSeduta testo={serieCorrente.rest_pause ? 'Apri rest-pause' : 'Serie fatta'} onFatta={serieFatta} />
        ) : (
          <BarraSeduta testo="Prossimo esercizio" secondario onFatta={() => setApertoScelto(null)} />
        )
      ) : null}

      {sost ? <Sostituzione s={s} es={sost} onChiudi={() => setSost(null)} /> : null}
    </div>
  );
}
