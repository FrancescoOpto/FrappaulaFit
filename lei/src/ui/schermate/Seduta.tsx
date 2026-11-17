import { useEffect, useState } from 'preact/hooks';
import type { ModoSeduta, RegistroVoce, Seduta as TSeduta, SerieRegistrata } from '../../tipi';
import { CARICO_MODO, ESERCIZI_PER_ID, NOMI_MOVIMENTI, alternative, esercizio as trovaEsercizio } from '../../data/esercizi';
import { sessione } from '../../data/programma';
import { ripetizioniTest, rigaDi, tipoTest } from '../../motore/prescrizione';
import { TEMPI_CIRCUITO, stazioneCorrente, type PianoSeduta, type VocePiano } from '../../motore/seduta';
import { stimaMassimale } from '../../motore/carichi';
import {
  aggiornaSerie,
  annullaSeduta,
  avviabile,
  cambiaModo,
  completaSeduta,
  impostazioni,
  inAnteprima,
  iniziaSeduta,
  modoDi,
  pianoDi,
  programma,
  registroDi,
  riapriSeduta,
  salvaTest,
  sedutaPerId,
  sostituisciEsercizio,
  stato,
  testPrecedente,
} from '../../store/stato';
import { Avviso, Badge, Controllo, Modale, Scelte, Testata, formatoData, formatoKg, recuperoTesto } from '../componenti/comuni';
import { Icona, IconaEsercizio } from '../componenti/IconaEsercizio';
import { infoSettimana } from '../etichette';
import { aggiungiSecondi, attivo, avviaTimer, fermaTimer, formatoMMSS, rimanente, timer } from '../timer';
import { vai } from '../router';

// Seduta di lei: test a inizio programma; poi modalità classica (serie normali, recuperi del libro) o PHA
// (pesanti a serie normali, il resto in circuito alternando basso e alto). Barra fissa con recupero e "Serie fatta".

/** Campi (kg, rip) della serie corrente: li legge la barra in basso. */
interface Campi {
  voce: string;
  n: number;
  kg: string;
  rip: string;
}

function etichettaVoce(v: VocePiano): { testo: string; accento: boolean } {
  const def = ESERCIZI_PER_ID[v.p.esercizio_id];
  if (def?.fondamentale) return { testo: 'Fondamentale', accento: true };
  if (def?.movimento) return { testo: NOMI_MOVIMENTI[def.movimento], accento: false };
  return { testo: 'Parte alta', accento: false };
}

function testoSerie(v: VocePiano, serie?: number): string {
  const n = serie ?? v.p.serie;
  if (v.p.secondi) return `${n} × ${v.p.rip}″`;
  return v.p.max ? `${n} × max` : `${n} × ${v.p.rip}`;
}

function testoCarico(v: VocePiano): string {
  const def = ESERCIZI_PER_ID[v.p.esercizio_id];
  if (def?.carico_modo === 'banda') return 'elastico';
  if (v.p.senzaCarico) return 'corpo libero';
  if (v.p.kg === undefined) return 'carico da scegliere';
  return formatoKg(v.p.kg) + (v.p.corrente ? ' (tuo)' : '');
}

function dettaglioCarico(v: VocePiano): string {
  if (v.p.pct) return `${Math.round(v.p.pct * 100)} % del massimale`;
  if (v.p.max && v.p.rm) return `a cedimento, carico da circa ${v.p.rm} ripetizioni`;
  if (v.p.rm) return `carico da ${v.p.rm} RM`;
  return '';
}

// ---------- Test ----------

function Riscaldamento({ riferimento, passo }: { riferimento: number; passo: number }) {
  const tappe: [string, number][] = [['2×10–15', 0], ['1×8', 0.3], ['1×5', 0.4], ['1×3', 0.5], ['1×3', 0.6], ['2×2', 0.7], ['2×1', 0.8]];
  const arr = (x: number) => Math.round(x / passo) * passo;
  return (
    <div class="colonna" style="gap:4px">
      <div class="piccolo">Riscaldamento a salire sul massimale di riferimento {formatoKg(riferimento)} (riposi da 1′ a 4′), come nel libro:</div>
      <div class="riga" style="flex-wrap:wrap;gap:6px">
        {tappe.map(([s, f]) => <span class="chip">{s} · {f ? `${Math.round(f * 100)} % · ${arr(riferimento * f)} kg` : 'bilanciere vuoto'}</span>)}
      </div>
    </div>
  );
}

function RigaTest({ s, voceId, esercizioId, nTest }: { s: TSeduta; voceId: string; esercizioId: string; nTest: 10 | 12 | 14 }) {
  const pr = programma.value!;
  const def = trovaEsercizio(esercizioId);
  const t = pr.test[esercizioId];
  const stima = tipoTest(esercizioId) === 'stima';
  const precedente = testPrecedente(esercizioId);
  const [aperta, setAperta] = useState(!t);
  const [kg, setKg] = useState(t ? String(t.kg) : '');
  const [rip, setRip] = useState(t?.modo === 'stima' ? String(t.rip) : precedente?.modo === 'stima' ? String(precedente.rip) : '5');
  const [rir, setRir] = useState<number>(t?.rir ?? 0);
  const [risultato, setRisultato] = useState<number | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [riscaldamento, setRiscaldamento] = useState(false);
  const modo = def ? CARICO_MODO[def.carico_modo] : undefined;
  const k = parseFloat(kg.replace(',', '.'));
  const r = parseInt(rip, 10);
  const kgOk = Number.isFinite(k) && k > 0;
  const ripOk = Number.isFinite(r) && r >= 1 && r + rir <= 12;
  const passo = impostazioni.value.arrotondamento;
  const calcola = () => {
    try {
      setRisultato(stimaMassimale(r, k, passo, rir));
      setErrore(null);
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Valori non validi');
    }
  };
  const riferimento = risultato ?? t?.rm1 ?? precedente?.rm1 ?? (kgOk && ripOk ? Math.round((k * 36) / (37 - r - rir)) : 0);
  return (
    <div class="colonna" style="padding:12px 0;border-top:1px solid var(--filo);gap:8px" data-voce={voceId}>
      <div class="riga">
        <span class={`spunta ${t ? 'fatta' : ''}`}>{t ? <Icona nome="spunta" dimensione={16} /> : null}</span>
        <IconaEsercizio def={def} />
        <div class="cresce">
          <div style="font-size:17px;font-weight:600">{def?.nome ?? esercizioId}</div>
          <div class="piccolo" style="margin-top:3px">
            {t ? (t.modo === 'stima' ? `massimale ${formatoKg(t.rm1)} (${t.rip} × ${t.kg}${t.rir ? ` + ${t.rir} di riserva` : ''})` : `${t.rip} RM a ${formatoKg(t.kg)}`) : stima ? 'stima del massimale' : `serie unica a ${nTest} RM`}
          </div>
        </div>
        {t && !aperta ? <button class="bottone piccolo" onClick={() => setAperta(true)}>Modifica</button> : null}
      </div>
      {aperta && s.stato !== 'completata' ? (
        <div class="carta compatta" style="background:var(--carta2);gap:10px">
          {stima ? (
            <>
              <h3>Stima del massimale</h3>
              <p class="piccolo">Fai una prova con un peso vicino al massimo: con 3–5 ripetizioni la stima è affidabile, con 10 o più molto meno. {modo?.testo}</p>
              {precedente ? <p class="piccolo">Programma precedente: massimale {formatoKg(precedente.rm1)}.</p> : null}
              {risultato === null ? (
                <>
                  <div class="riga" style="gap:8px">
                    <div class="campo cresce"><label>Ripetizioni</label><input type="number" inputMode="numeric" min="1" max="12" value={rip} onInput={(e) => setRip((e.target as HTMLInputElement).value)} /></div>
                    <div class="campo cresce"><label>Carico (kg)</label><input type="number" inputMode="decimal" step="0.5" min="0" value={kg} onInput={(e) => setKg((e.target as HTMLInputElement).value)} placeholder="0" /></div>
                  </div>
                  <div class="campo"><label>Ripetizioni di riserva (0 = a cedimento)</label><Scelte valori={[0, 1, 2, 3, 4]} valore={rir} onCambia={setRir} /></div>
                  {Number.isFinite(r) && r + rir > 12 ? <Avviso tipo="errore">Oltre 12 ripetizioni effettive la stima perde senso: ripeti con più carico.</Avviso> : null}
                  {errore ? <Avviso tipo="errore">{errore}</Avviso> : null}
                  <button class="bottone primario pieno" disabled={!kgOk || !ripOk} onClick={calcola}>Calcola il massimale</button>
                  <button class="bottone fantasma piccolo" onClick={() => setRiscaldamento(!riscaldamento)}>{riscaldamento ? 'Nascondi riscaldamento' : 'Riscaldamento consigliato'}</button>
                  {riscaldamento && riferimento > 0 ? <Riscaldamento riferimento={riferimento} passo={passo} /> : null}
                </>
              ) : (
                <>
                  <div class="timer-grande" style="padding:4px 0">
                    <div class="tempo" style="font-size:52px">{formatoKg(risultato)}</div>
                    <div class="piccolo">Massimale stimato da {r} × {k} kg{rir ? ` con ${rir} di riserva` : ''}</div>
                  </div>
                  <div class="griglia2">
                    <button class="bottone" onClick={() => setRisultato(null)}>Ricalcola</button>
                    <button class="bottone primario" onClick={async () => { await salvaTest(esercizioId, k, r, 'stima', rir); setAperta(false); setRisultato(null); }}>Salva</button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <h3>Serie unica di test</h3>
              <p class="piccolo">Il peso più alto con cui riesci a fare <b>{nTest} ripetizioni</b> a cedimento tecnico. Se ne fai più di {nTest + 2} il peso era leggero: riprova dopo 3 minuti. {modo?.testo}</p>
              <div class="campo"><label>Carico (kg){modo ? ` · ${modo.breve}` : ''}</label><input type="number" inputMode="decimal" step="0.5" min="0" value={kg} onInput={(e) => setKg((e.target as HTMLInputElement).value)} placeholder="0" /></div>
              <button class="bottone primario pieno" disabled={!kgOk} onClick={async () => { await salvaTest(esercizioId, k, nTest, 'serie_unica'); setAperta(false); }}>Salva</button>
            </>
          )}
          {t ? <button class="bottone fantasma piccolo" onClick={() => { setAperta(false); setRisultato(null); }}>Annulla</button> : null}
        </div>
      ) : null}
    </div>
  );
}

// ---------- Lavoro ----------

function Sostituzione({ s, v, onChiudi }: { s: TSeduta; v: VocePiano; onChiudi: () => void }) {
  const reg = registroDi(s.id);
  const attuale = reg?.voci[v.voce.id]?.esercizio_id ?? v.p.esercizio_id;
  const base = v.voce.esercizio[s.faseRif];
  const usati = Object.values(reg?.voci ?? {}).map((x) => x.esercizio_id);
  const alt = [...(attuale !== base ? [ESERCIZI_PER_ID[base]] : []), ...alternative(attuale, usati)].filter(Boolean);
  const [permanente, setPermanente] = useState(true);
  return (
    <Modale titolo="Sostituisci" onChiudi={onChiudi}>
      <p class="muto">Alternative con lo stesso movimento di <b>{trovaEsercizio(attuale)?.nome}</b>. Se non hanno un test, partono dal carico di questo esercizio: correggilo alla prima serie.</p>
      {alt.length === 0 ? <Avviso>Nessuna alternativa disponibile.</Avviso> : null}
      {alt.map((a) => (
        <button class="bottone pieno" style="justify-content:space-between" onClick={async () => { await sostituisciEsercizio(s.id, v.voce.id, a.id, permanente); onChiudi(); }}>
          <span class="riga" style="gap:10px"><IconaEsercizio def={a} piccola /> {a.nome}</span>
          {a.id === base ? <span class="piccolo">del programma</span> : null}
        </button>
      ))}
      <label class="riga" style="gap:10px;padding:6px 0">
        <input type="checkbox" checked={permanente} onChange={(e) => setPermanente((e.target as HTMLInputElement).checked)} />
        <span class="muto">Anche nelle prossime sedute</span>
      </label>
    </Modale>
  );
}

/** Serie della voce aperta: fatte compatte, corrente con − / +, future compatte. */
function SerieEspanse({ s, v, rv, campi, setCampi, onGiudizio }: { s: TSeduta; v: VocePiano; rv: RegistroVoce; campi: Campi | null; setCampi: (c: Campi | null) => void; onGiudizio?: () => void }) {
  const passo = impostazioni.value.arrotondamento;
  const corrente = rv.serie.find((x) => !x.fatta);
  const ultima = Math.max(...rv.serie.map((y) => y.n));
  const conKg = !v.p.senzaCarico;
  useEffect(() => {
    if (!corrente) return;
    if (campi && campi.voce === v.voce.id && campi.n === corrente.n) return;
    setCampi({ voce: v.voce.id, n: corrente.n, kg: corrente.kg !== undefined ? String(corrente.kg) : corrente.kg_prev ? String(corrente.kg_prev) : '', rip: corrente.rip !== undefined ? String(corrente.rip) : String(corrente.rip_prev) });
  }, [v.voce.id, corrente?.n, corrente?.kg_prev]);
  const unita = v.p.secondi ? 's' : 'rip';
  return (
    <div class="serie-lista">
      {rv.serie.map((x) => {
        if (x.fatta) {
          return (
            <div class="serie-inline fatta">
              <button type="button" class="cerchio" aria-label={`Serie ${x.n} fatta: tocca per riaprirla`} onClick={() => void aggiornaSerie(s.id, v.voce.id, x.n, { fatta: false })}><Icona nome="spunta" dimensione={14} /></button>
              <span class="valore">{conKg ? `${formatoKg(x.kg ?? x.kg_prev)} × ` : ''}{x.rip ?? x.rip_prev}{v.p.secondi ? '″' : ''}</span>
              {x.n === ultima && ESERCIZI_PER_ID[rv.esercizio_id]?.fondamentale ? (
                <div class="riga cresce" style="gap:4px;justify-content:flex-end;flex-wrap:wrap;align-items:center">
                  {!x.sforzo ? <span class="piccolo" style="color:var(--accento)">Com’è andata?</span> : null}
                  {(['facile', 'giusto', 'limite'] as const).map((f) => (
                    <button class={`bottone piccolo ${x.sforzo === f ? 'primario' : 'fantasma'}`} style="min-height:32px;padding:0 9px;font-size:12px" onClick={() => { void aggiornaSerie(s.id, v.voce.id, x.n, { sforzo: f }); onGiudizio?.(); }}>{f === 'facile' ? 'Facile' : f === 'giusto' ? 'Giusto' : 'Al limite'}</button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        }
        if (corrente?.n === x.n && campi && campi.voce === v.voce.id && campi.n === x.n) {
          return (
            <div class="serie-inline corrente">
              <span class="cerchio">{x.n}</span>
              <div class="controlli">
                {conKg ? <Controllo valore={campi.kg} passo={passo} onCambia={(kg) => setCampi({ ...campi, kg })} unita="kg" etichettaAria={`kg serie ${x.n}`} /> : null}
                <Controllo valore={campi.rip} passo={v.p.secondi ? 5 : 1} onCambia={(rip) => setCampi({ ...campi, rip })} unita={unita} etichettaAria={`${v.p.secondi ? 'secondi' : 'ripetizioni'} serie ${x.n}`} />
              </div>
            </div>
          );
        }
        return (
          <div class="serie-inline futura">
            <span class="cerchio">{x.n}</span>
            <span class="valore">{conKg ? `${x.kg_prev ? formatoKg(x.kg_prev) : '—'} × ` : ''}{v.p.max ? 'max' : x.rip_prev}{v.p.secondi ? '″' : ''}</span>
          </div>
        );
      })}
    </div>
  );
}

function RigaVoce({ s, v, aperto, onApri, onSostituisci, onGiudizio, campi, setCampi }: { s: TSeduta; v: VocePiano; aperto: boolean; onApri: () => void; onSostituisci: () => void; onGiudizio: () => void; campi: Campi | null; setCampi: (c: Campi | null) => void }) {
  const reg = registroDi(s.id);
  const rv = reg?.voci[v.voce.id];
  const id = rv?.esercizio_id ?? v.p.esercizio_id;
  const def = trovaEsercizio(id);
  const fatte = rv?.serie.filter((x) => x.fatta).length ?? 0;
  const tutte = rv ? fatte >= rv.serie.length : false;
  const inCorso = s.stato === 'in_corso';
  const et = etichettaVoce(v);
  const dettaglio = dettaglioCarico(v);
  const vaiScheda = () => vai(`/seduta/${s.id}/voce/${v.voce.id}`);
  return (
    <div class={`gruppo-esercizio ${aperto ? 'aperto' : ''}`}>
      <div class={`esercizio-riga ${aperto ? 'aperto' : ''}`} onClick={inCorso ? onApri : vaiScheda}>
        <IconaEsercizio def={def} />
        <div class="cresce">
          <div class="riga spazio" style="gap:8px;align-items:baseline">
            <div class="nome">{def?.nome ?? id}</div>
            <Badge testo={et.testo} accento={et.accento} />
          </div>
          <div class="dettaglio">
            <span>{testoSerie(v, rv?.serie.length)}</span>
            <span>·</span>
            <span>{testoCarico(v)}</span>
            {!v.circuito ? <><span>·</span><span>recupero {recuperoTesto(v.p.recupero)}</span></> : null}
            {dettaglio ? <span class="piccolo">· {dettaglio}</span> : null}
            {v.tolte ? <span class="piccolo">· {v.tolte} serie in meno per il tempo</span> : null}
            {rv ? <span class="piccolo">· {fatte}/{rv.serie.length} fatte</span> : null}
          </div>
        </div>
        {tutte ? <span class="spunta fatta"><Icona nome="spunta" dimensione={16} /></span> : null}
      </div>
      {aperto && inCorso && rv ? (
        <>
          <SerieEspanse s={s} v={v} rv={rv} campi={campi} setCampi={setCampi} onGiudizio={rv.serie.every((x) => x.fatta) ? onGiudizio : undefined} />
          <div class="riga spazio" style="padding:8px 0 10px">
            <button class="bottone piccolo fantasma" onClick={vaiScheda}>Scheda, note e volta scorsa →</button>
            <button class="bottone piccolo fantasma" onClick={onSostituisci}>Sostituisci</button>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Circuito PHA: stazioni a giri, un timer per la transizione e uno per il recupero di fine giro. */
function BloccoCircuito({ s, piano, attivoOra, onAttiva, onSostituisci, campi, setCampi }: { s: TSeduta; piano: PianoSeduta; attivoOra: boolean; onAttiva: () => void; onSostituisci: (v: VocePiano) => void; campi: Campi | null; setCampi: (c: Campi | null) => void }) {
  const reg = registroDi(s.id);
  const pr = programma.value!;
  const tempi = TEMPI_CIRCUITO[pr.obiettivo];
  const passo = impostazioni.value.arrotondamento;
  const stazioni = piano.stazioni.map((id) => piano.voci.find((v) => v.voce.id === id)!).filter(Boolean);
  const giri = piano.giri;
  const corr = stazioneCorrente(piano.stazioni, reg?.voci, giri);
  const giriFatti = Array.from({ length: giri }, (_, i) => i + 1).filter((g) => stazioni.every((v) => {
    const x = reg?.voci[v.voce.id]?.serie.find((y) => y.n === g);
    return !x || x.fatta;
  })).length;
  const serieCorr = corr ? reg?.voci[corr.voce]?.serie.find((x) => x.n === corr.giro) : undefined;
  useEffect(() => {
    if (!attivoOra || !corr || !serieCorr) return;
    if (campi && campi.voce === corr.voce && campi.n === corr.giro) return;
    setCampi({ voce: corr.voce, n: corr.giro, kg: serieCorr.kg !== undefined ? String(serieCorr.kg) : serieCorr.kg_prev ? String(serieCorr.kg_prev) : '', rip: serieCorr.rip !== undefined ? String(serieCorr.rip) : String(serieCorr.rip_prev) });
  }, [attivoOra, corr?.voce, corr?.giro, serieCorr?.kg_prev]);
  const giroMostrato = corr?.giro ?? giri;
  return (
    <div class={`circuito ${attivoOra ? 'attivo' : ''}`}>
      <div class="riga spazio" style="align-items:baseline">
        <span class="eyebrow">Circuito PHA · {stazioni.length} stazioni</span>
        <span class="piccolo">{!reg ? `${giri} giri` : giriFatti >= giri ? `${giri} giri fatti` : `giro ${giroMostrato} di ${giri}`}</span>
      </div>
      <div class="giri">
        <div class="pallini" aria-label={`${giriFatti} giri su ${giri}`}>
          {Array.from({ length: giri }, (_, i) => <span class={i < giriFatti ? 'fatto' : i === giriFatti && s.stato === 'in_corso' ? 'corrente' : ''} />)}
        </div>
        <span class="piccolo">transizioni {recuperoTesto(tempi.transizione)} · fine giro {recuperoTesto(tempi.recuperoGiro)} · si alternano basso e alto</span>
      </div>
      {stazioni.map((v, i) => {
        const rv = reg?.voci[v.voce.id];
        const def = trovaEsercizio(rv?.esercizio_id ?? v.p.esercizio_id);
        const serieGiro = rv?.serie.find((x) => x.n === giroMostrato);
        const fuori = Boolean(rv) && !serieGiro;
        const fatta = Boolean(serieGiro?.fatta) || (Boolean(rv) && rv!.serie.every((x) => x.fatta));
        const eCorr = attivoOra && corr?.voce === v.voce.id;
        const kg = serieGiro ? serieGiro.kg ?? serieGiro.kg_prev : v.p.kg;
        return (
          <div class={`stazione ${fatta ? 'fatta' : ''} ${eCorr ? 'corrente' : ''}`} style={fuori ? 'opacity:.5' : undefined}>
            <span class="numero">{fatta ? <Icona nome="spunta" dimensione={14} /> : i + 1}</span>
            <IconaEsercizio def={def} piccola />
            <div class="cresce" style="min-width:0">
              <div class="riga spazio" style="gap:8px">
                <button type="button" class="nome" style="background:none;border:0;padding:0;text-align:left;cursor:pointer;color:inherit" onClick={() => vai(`/seduta/${s.id}/voce/${v.voce.id}`)}>{def?.nome ?? v.p.esercizio_id}</button>
                {s.stato === 'in_corso' && !fatta ? <button class="icona-bottone" aria-label="Sostituisci esercizio" onClick={() => onSostituisci(v)}><Icona nome="scambia" dimensione={18} /></button> : null}
              </div>
              <div class="piccolo">{v.p.senzaCarico ? (def?.carico_modo === 'banda' ? 'elastico' : 'corpo libero') : kg ? formatoKg(kg) : 'carico da scegliere'} · {testoSerie(v, rv?.serie.length)}{fuori ? ' · finite le sue serie' : ''}</div>
              {eCorr && campi && campi.voce === v.voce.id && campi.n === corr!.giro ? (
                <div class="controlli" style="margin-top:8px">
                  {!v.p.senzaCarico ? <Controllo valore={campi.kg} passo={passo} onCambia={(x) => setCampi({ ...campi, kg: x })} unita="kg" etichettaAria={`kg ${def?.nome ?? ''}`} /> : null}
                  <Controllo valore={campi.rip} passo={v.p.secondi ? 5 : 1} onCambia={(x) => setCampi({ ...campi, rip: x })} unita={v.p.secondi ? 's' : 'rip'} etichettaAria={`ripetizioni ${def?.nome ?? ''}`} />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
      {s.stato === 'in_corso' && !attivoOra && corr ? <button class="bottone pieno" onClick={onAttiva}>Vai al circuito</button> : null}
    </div>
  );
}

function BarraSeduta({ testo, onFatta, secondario }: { testo: string; onFatta: () => void; secondario?: boolean }) {
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
        <button class={`bottone ${secondario ? '' : 'primario'}`} onClick={onFatta}>{testo}</button>
      </div>
    </div>
  );
}

const APERTO_CIRCUITO = '__circuito';

export function Seduta({ id }: { id: string }) {
  void stato.value;
  const s = sedutaPerId(id);
  const pr = programma.value;
  const [sost, setSost] = useState<VocePiano | null>(null);
  const [conferma, setConferma] = useState<'completa' | 'annulla' | null>(null);
  const [congratulazioni, setCongratulazioni] = useState(false);
  const [apertoScelto, setApertoScelto] = useState<string | null>(null);
  const [campi, setCampi] = useState<Campi | null>(null);
  const [modoScelto, setModoScelto] = useState<ModoSeduta | null>(null);
  if (!s || !pr) return <div class="pagina"><Testata /><p class="muto">Seduta non trovata.</p></div>;

  const reg = registroDi(s.id);
  const modo: ModoSeduta = reg?.modo ?? modoScelto ?? modoDi(s);
  const piano = pianoDi(s, modo);
  const info = infoSettimana(pr, s);
  const puoIniziare = avviabile(s);
  const anteprima = inAnteprima(s);
  const prova = impostazioni.value.modalita_prova;

  // ---- Test ----
  if (s.fase === 'test') {
    const voci = sessione(s.giorno).voci;
    const daTestare = voci
      .map((v) => ({ voce: v, id: piano.voci.find((x) => x.voce.id === v.id)!.p.esercizio_id }))
      .filter((x) => tipoTest(x.id) !== 'nessuno');
    const senzaTest = voci.filter((v) => !daTestare.some((x) => x.voce.id === v.id));
    const mancanti = daTestare.filter((x) => !pr.test[x.id]).length;
    const tuttiTest = pr.sedute.filter((x) => x.fase === 'test' && x.giro === s.giro).every((x) => x.stato === 'completata' || x.id === s.id);
    if (congratulazioni) {
      return (
        <div class="pagina" style="justify-content:center">
          <div class="carta centrato" style="gap:14px;padding:28px 20px;align-items:center">
            <span style="color:var(--accento)"><Icona nome="bandiera" dimensione={44} /></span>
            <h1 style="font-size:32px">{tuttiTest ? 'Test completati' : 'Seduta di test completata'}</h1>
            <p class="muto">{tuttiTest ? 'Da questi carichi l’app ha calcolato tutte le sedute del programma. Da ora si lavora.' : 'I carichi salvati precompilano già le sedute. Avanti con la prossima seduta di test.'}</p>
            <button class="bottone primario pieno" onClick={() => vai('/')}>Torna al percorso</button>
          </div>
        </div>
      );
    }
    return (
      <div class="pagina">
        <Testata sopratitolo={info.testata} accento />
        <div class="colonna" style="gap:8px">
          <h1>{s.nome}</h1>
          <p class="muto">{s.etichetta}{s.data ? ` · ${formatoData(s.data)}` : ''}</p>
          <div class="riga" style="gap:8px;align-items:baseline"><b>{daTestare.length - mancanti}</b><span class="muto">di {daTestare.length} esercizi testati</span></div>
          <div class="progresso sottile"><div style={`width:${daTestare.length ? ((daTestare.length - mancanti) / daTestare.length) * 100 : 0}%`} /></div>
        </div>
        {anteprima && !prova ? <Avviso tipo="info">Anteprima: questa seduta di test arriva dopo le precedenti.</Avviso> : null}
        <Avviso tipo="info">Squat, stacco e hip thrust con la stima del massimale; gli altri esercizi con una serie unica al numero di ripetizioni indicato, a cedimento tecnico. Recupera bene tra un test e l’altro.</Avviso>
        <div class="gruppo-blocco">
          {daTestare.map((x) => <RigaTest s={s} voceId={x.voce.id} esercizioId={x.id} nTest={ripetizioniTest(rigaDi(x.voce, { fase: 'fase1', faseRif: 'fase1', riga: 1 }))} />)}
        </div>
        {senzaTest.length ? <p class="piccolo">Senza test (elastico o corpo libero): {senzaTest.map((v) => trovaEsercizio(v.esercizio.fase1)?.nome).join(', ')}.</p> : null}
        {s.stato !== 'completata' && puoIniziare ? (
          <button class="bottone primario pieno" disabled={mancanti > 0} onClick={async () => { if (!reg) await iniziaSeduta(s.id); await completaSeduta(s.id); setCongratulazioni(true); }}>
            {mancanti > 0 ? `Manca${mancanti === 1 ? '' : 'no'} ancora ${mancanti} ${mancanti === 1 ? 'esercizio' : 'esercizi'}` : 'Completa la seduta di test'}
          </button>
        ) : null}
        {s.stato === 'completata' ? <Avviso tipo="info">Seduta di test completata: i carichi si correggono qui sopra o in Impostazioni → Test e carichi.</Avviso> : null}
      </div>
    );
  }

  // ---- Lavoro ----
  const serieTotali = piano.voci.reduce((a, v) => a + (reg?.voci[v.voce.id]?.serie.length ?? v.p.serie), 0);
  const serieFatte = reg ? Object.values(reg.voci).reduce((a, v) => a + v.serie.filter((x) => x.fatta).length, 0) : 0;
  const completa = (vid: string) => {
    const r = reg?.voci[vid];
    return Boolean(r && r.serie.every((x) => x.fatta));
  };
  const classiche = piano.voci.filter((v) => !v.circuito);
  const primoIncompleto = classiche.find((v) => !completa(v.voce.id));
  const apertoId = s.stato === 'in_corso' ? (apertoScelto && classiche.some((v) => v.voce.id === apertoScelto) ? apertoScelto : apertoScelto === APERTO_CIRCUITO ? null : primoIncompleto?.voce.id ?? null) : null;
  const vAperta = apertoId ? piano.voci.find((v) => v.voce.id === apertoId) : undefined;
  const rvAperta = vAperta ? reg?.voci[vAperta.voce.id] : undefined;
  const serieCorrente = rvAperta?.serie.find((x) => !x.fatta);
  const corr = piano.stazioni.length ? stazioneCorrente(piano.stazioni, reg?.voci, piano.giri) : undefined;
  const modoCircuito = s.stato === 'in_corso' && apertoId === null && Boolean(corr);
  const tuttoFatto = Boolean(reg) && piano.voci.every((v) => completa(v.voce.id));
  const nessunaFatta = !reg || Object.values(reg.voci).every((v) => v.serie.every((x) => !x.fatta));

  const valori = (vid: string, n: number) => {
    const mie = campi && campi.voce === vid && campi.n === n;
    const kg = mie ? parseFloat(campi!.kg.replace(',', '.')) : undefined;
    const rip = mie ? parseInt(campi!.rip, 10) : undefined;
    return { kg: Number.isFinite(kg) ? kg : undefined, rip: Number.isFinite(rip) ? rip : undefined };
  };

  const serieFatta = () => {
    if (!vAperta || !serieCorrente || !rvAperta) return;
    const { kg, rip } = valori(vAperta.voce.id, serieCorrente.n);
    void aggiornaSerie(s.id, vAperta.voce.id, serieCorrente.n, { kg: vAperta.p.senzaCarico ? undefined : kg, rip, fatta: true });
    const def = trovaEsercizio(rvAperta.esercizio_id);
    // Superserie: dopo il primo esercizio si passa subito al secondo, il recupero parte dopo il secondo.
    const compagna = vAperta.voce.superserie ? classiche.find((v) => v.voce.superserie === vAperta.voce.superserie && v.voce.id !== vAperta.voce.id) : undefined;
    const serieCompagna = compagna ? reg?.voci[compagna.voce.id]?.serie.find((x) => x.n === serieCorrente.n && !x.fatta) : undefined;
    if (compagna && serieCompagna) {
      setApertoScelto(compagna.voce.id);
      return;
    }
    avviaTimer(vAperta.p.recupero, def?.nome ?? '');
    const tornaA = vAperta.voce.superserie ? classiche.find((v) => v.voce.superserie === vAperta.voce.superserie && reg?.voci[v.voce.id]?.serie.some((x) => !x.fatta && x.n > serieCorrente.n)) : undefined;
    if (tornaA && tornaA.voce.id !== vAperta.voce.id) {
      setApertoScelto(tornaA.voce.id);
      return;
    }
    // Ultima serie: i fondamentali restano aperti per il giudizio "Facile / Giusto / Al limite" durante il recupero.
    const rimaste = rvAperta.serie.filter((x) => !x.fatta && x.n !== serieCorrente.n).length;
    if (rimaste === 0) setApertoScelto(def?.fondamentale ? vAperta.voce.id : null);
  };

  const stazioneFatta = () => {
    if (!corr) return;
    const v = piano.voci.find((x) => x.voce.id === corr.voce)!;
    const { kg, rip } = valori(corr.voce, corr.giro);
    void aggiornaSerie(s.id, corr.voce, corr.giro, { kg: v.p.senzaCarico ? undefined : kg, rip, fatta: true });
    const tempi = TEMPI_CIRCUITO[pr.obiettivo];
    const i = piano.stazioni.indexOf(corr.voce);
    const prossima = piano.stazioni.slice(i + 1).find((vid) => reg?.voci[vid]?.serie.find((y) => y.n === corr.giro && !y.fatta));
    if (prossima) avviaTimer(tempi.transizione, `Prossima: ${trovaEsercizio(reg?.voci[prossima]?.esercizio_id ?? '')?.nome ?? ''}`);
    else if (corr.giro < piano.giri) avviaTimer(tempi.recuperoGiro, `Fine giro ${corr.giro} di ${piano.giri}: recupero`);
    else fermaTimer();
  };

  const chiudi = async () => {
    await completaSeduta(s.id);
    setConferma(null);
    vai('/');
  };

  const gruppiClassici: { titolo: string; voci: VocePiano[] }[] = modo === 'pha'
    ? [{ titolo: 'Prima: serie normali', voci: classiche }]
    : [
        { titolo: 'Glutei', voci: classiche.filter((v) => v.voce.parte === 'glutei') },
        { titolo: 'Parte alta', voci: classiche.filter((v) => v.voce.parte === 'alta') },
      ];

  return (
    <div class="pagina">
      <Testata sopratitolo={info.testata} accento />
      <div class="colonna" style="gap:8px">
        <h1>{s.nome}</h1>
        <p class="muto">{s.etichetta} · circa {Math.round(piano.durataS / 60)} min{s.data ? ` · ${formatoData(s.data)}` : ''}</p>
        <div class="riga" style="gap:8px;align-items:baseline"><b>{serieFatte} / {serieTotali}</b><span class="muto">serie</span></div>
        <div class="progresso sottile"><div style={`width:${serieTotali ? (serieFatte / serieTotali) * 100 : 0}%`} /></div>
      </div>

      {anteprima ? <Avviso tipo="info"><b>Anteprima: non ancora in programma.</b> Serie e carichi sono calcolati con i carichi di oggi.{prova ? ' Con la modalità prova puoi avviarla fuori ordine.' : ''}</Avviso> : null}
      {s.fase === 'scarico' ? <Avviso tipo="info">Scarico: metà delle serie, carichi della prima settimana della fase appena finita.</Avviso> : null}
      {s.stato === 'completata' ? <Avviso tipo="info">Seduta completata. Puoi riaprirla per correggere i dati, o annullarla per cancellarla.</Avviso> : null}

      {s.stato !== 'completata' && (s.stato === 'futura' || nessunaFatta) ? (
        <div class="carta compatta" style="gap:8px">
          <div class="campo">
            <label>Come la fai oggi?</label>
            <Scelte valori={['classica', 'pha'] as ModoSeduta[]} valore={modo} onCambia={async (m) => { setModoScelto(m); setCampi(null); setApertoScelto(null); if (reg) await cambiaModo(s.id, m); }} etichette={{ classica: 'Classica', pha: 'Circuito PHA' }} />
            <p class="piccolo">{modo === 'pha' ? 'Squat, stacco e hip thrust a serie normali; tutto il resto in circuito alternando glutei e parte alta, con transizioni brevi. Più veloce e più faticosa sul fiato.' : 'Tutti gli esercizi a serie normali con i recuperi del libro.'}</p>
          </div>
          {piano.tolte ? <p class="piccolo">Per stare nei {impostazioni.value.T}′ la parte alta ha {piano.tolte} serie in meno (cambia il tetto in Impostazioni o usa il circuito).</p> : null}
        </div>
      ) : null}

      {s.stato === 'futura' ? (
        <button class="bottone primario pieno" disabled={!puoIniziare} onClick={() => void iniziaSeduta(s.id, modo)}>{anteprima ? (prova ? 'Inizia fuori ordine (prova)' : 'Inizia (dopo le precedenti)') : 'Inizia la seduta'}</button>
      ) : null}

      {gruppiClassici.filter((g) => g.voci.length).map((g) => (
        <div class="gruppo-blocco">
          <div class="gruppo-testata">
            <span class="eyebrow">{g.titolo}</span>
            <span class="piccolo">{g.voci.length} {g.voci.length === 1 ? 'esercizio' : 'esercizi'}</span>
          </div>
          {g.voci.map((v) => (
            <RigaVoce key={v.voce.id} s={s} v={v} aperto={apertoId === v.voce.id} onApri={() => setApertoScelto(apertoId === v.voce.id ? APERTO_CIRCUITO : v.voce.id)} onSostituisci={() => setSost(v)} onGiudizio={() => setApertoScelto(null)} campi={campi} setCampi={setCampi} />
          ))}
        </div>
      ))}

      {piano.stazioni.length ? <BloccoCircuito s={s} piano={piano} attivoOra={modoCircuito} onAttiva={() => setApertoScelto(APERTO_CIRCUITO)} onSostituisci={(v) => setSost(v)} campi={campi} setCampi={setCampi} /> : null}

      {tuttoFatto || s.stato === 'completata' ? <p class="piccolo">Facoltativo, a fine seduta: 10′ di camminata tranquilla e qualche minuto sdraiata con le gambe al muro.</p> : null}

      {s.stato === 'in_corso' && conferma === 'completa' ? (
        <div class="carta">
          <p>{tuttoFatto ? 'Confermi di aver finito?' : 'Non hai fatto tutte le serie. Chiudere comunque la seduta?'}</p>
          <div class="griglia2">
            <button class="bottone" onClick={() => setConferma(null)}>No</button>
            <button class="bottone primario" onClick={() => void chiudi()}>Sì, completa</button>
          </div>
        </div>
      ) : null}
      {s.stato === 'in_corso' && conferma === null && !tuttoFatto ? <button class="bottone fantasma pieno" onClick={() => setConferma('completa')}>Completa la seduta senza finire</button> : null}
      {s.stato === 'completata' ? <button class="bottone fantasma pieno" onClick={() => void riapriSeduta(s.id)}>Riapri la seduta</button> : null}
      {s.stato !== 'futura' ? (
        conferma !== 'annulla' ? (
          <button class="bottone fantasma pieno pericolo" onClick={() => setConferma('annulla')}>Annulla seduta…</button>
        ) : (
          <div class="carta">
            <p>Annullare la seduta? Le serie registrate spariscono e i carichi tornano com’erano prima di iniziarla.</p>
            <div class="griglia2">
              <button class="bottone" onClick={() => setConferma(null)}>No</button>
              <button class="bottone pericolo" onClick={async () => { await annullaSeduta(s.id); setConferma(null); vai('/'); }}>Sì, annulla</button>
            </div>
          </div>
        )
      ) : null}

      {s.stato === 'in_corso' && conferma === null ? (
        tuttoFatto ? (
          <BarraSeduta testo="Completa seduta" onFatta={() => void chiudi()} />
        ) : modoCircuito ? (
          <BarraSeduta testo="Stazione fatta" onFatta={stazioneFatta} />
        ) : vAperta && serieCorrente ? (
          <BarraSeduta testo="Serie fatta" onFatta={serieFatta} />
        ) : (
          <BarraSeduta testo="Prossimo esercizio" secondario onFatta={() => setApertoScelto(null)} />
        )
      ) : null}

      {sost ? <Sostituzione s={s} v={sost} onChiudi={() => setSost(null)} /> : null}
    </div>
  );
}

export type { SerieRegistrata };
