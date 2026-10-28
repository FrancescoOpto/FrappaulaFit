import { useState } from 'preact/hooks';
import type { EsercizioSeduta, Fase, Gruppo, Seduta as TSeduta } from '../../tipi';
import { CARICO_MODO, NOMI_GRUPPI, esercizio as trovaEsercizio } from '../../data/esercizi';
import { alternative } from '../../motore/generatore';
import { durataStimata, minuti, prescrizione, serieRip } from '../../motore/prescrizione';
import { percentualeRM, stimaMassimale } from '../../motore/carichi';
import {
  annullaSeduta,
  avviabile,
  blocco,
  completaSeduta,
  inAnteprima,
  impostazioni,
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
import { Avviso, Badge, Modale, Scelte, Testata, formatoData, formatoKg } from '../componenti/comuni';
import { infoCiclo } from '../etichette';
import { vai } from '../router';

const ORDINE_GRUPPI: Gruppo[] = ['petto', 'dorso', 'spalle', 'gambe', 'bicipiti', 'tricipiti', 'addome'];

function gruppi(s: TSeduta): { gruppo: Gruppo; esercizi: EsercizioSeduta[] }[] {
  const out: { gruppo: Gruppo; esercizi: EsercizioSeduta[] }[] = [];
  // Mantiene l'ordine di comparsa degli esercizi (grandi → piccoli, dal contenitore).
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
          <span>{a.nome}</span>
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

/** Riga della settimana di test: `stima` (fondamentali) o `serie_unica` (TEST_INIZIO_BLOCCO §2). */
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
    <div class="colonna" style="padding:12px 0;border-top:1px solid var(--bordo);gap:8px">
      <div class="riga">
        <span class={`spunta ${t ? 'fatta' : ''}`}>{t ? '✓' : ''}</span>
        <div class="cresce">
          <div class="nome" style="font-size:17px;font-weight:500">{def?.nome ?? es.esercizio_id}</div>
          <div class="dettaglio" style="margin-top:3px">
            <Badge ruolo={es.ruolo} />
            {t ? <span>{t.modo === 'stima' ? `1@${t.rm1} kg (${t.rip}×${t.kg}${t.rir ? ` +${t.rir} RIR` : ''})` : `${t.rip}@${t.kg} kg`}</span> : <span class="piccolo">{stima ? 'stima del massimale' : `serie unica ${pr.rip}RM`}</span>}
          </div>
        </div>
        {t && !aperta ? <button class="bottone piccolo" onClick={() => setAperta(true)}>Modifica</button> : null}
        {s.stato !== 'completata' ? <button class="icona-bottone" aria-label="Sostituisci esercizio" onClick={() => setSost(true)}>⇄</button> : null}
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
                  {Number.isFinite(r) && r > 12 ? <Avviso tipo="errore">Oltre 12 ripetizioni la formula perde senso: ripeti la prova con più carico.</Avviso> : null}
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

function RigaEsercizio({ s, es, onSostituisci }: { s: TSeduta; es: EsercizioSeduta; onSostituisci: () => void }) {
  const b = blocco.value!;
  const p = profilo.value!;
  const def = trovaEsercizio(es.esercizio_id, p.esercizi_personalizzati);
  const pr = prescrizioneDi(es, s);
  const reg = registroDi(s.id)?.esercizi[es.slot];
  const fatte = reg?.serie.filter((x) => x.fatta && !x.stripping).length ?? 0;
  const tutte = reg ? fatte >= reg.serie.filter((x) => !x.stripping).length : false;
  return (
    <div class="esercizio-riga">
      <span class={`spunta ${tutte ? 'fatta' : fatte ? 'parziale' : ''}`} onClick={() => vai(`/seduta/${s.id}/es/${es.slot}`)}>{tutte ? '✓' : fatte ? fatte : ''}</span>
      <div class="cresce" onClick={() => vai(`/seduta/${s.id}/es/${es.slot}`)}>
        <div class="nome">{def?.nome ?? es.esercizio_id}</div>
        <div class="dettaglio">
          <Badge ruolo={es.ruolo} />
          <span>{pr.serie}×{pr.rip} @ {pr.kg !== undefined ? formatoKg(pr.kg) : es.senza_carico ? 'a scelta' : 'senza test'}{pr.corrente ? ' ✎' : ''}</span>
          {pr.scalaRM ? <span class="piccolo">{pr.scalaRM}RM · {Math.round(percentualeRM(pr.scalaRM) * 100)}%</span> : null}
          {pr.percentuale ? <span class="piccolo">{Math.round(pr.percentuale * 100)}%</span> : null}
          {pr.rest_pause ? <span class="piccolo">rest-pause</span> : null}
        </div>
      </div>
      {s.stato !== 'completata' ? <button class="icona-bottone" aria-label="Sostituisci esercizio" onClick={onSostituisci}>⇄</button> : null}
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
  if (!s || !b || !p) return <div class="pagina"><Testata /><p class="muto">Seduta non trovata.</p></div>;

  const puoIniziare = avviabile(s);
  const anteprima = inAnteprima(s);
  const prova = Boolean(impostazioni.value.modalita_prova);
  const reg = registroDi(s.id);
  const fatte = s.esercizi.filter((e) => {
    const r = reg?.esercizi[e.slot];
    return r && r.serie.filter((x) => !x.stripping).every((x) => x.fatta);
  }).length;
  const durata = s.fase === 'test' ? 0 : durataStimata(s.esercizi.map((e) => ({ ruolo: e.ruolo, serie: serieRip(e.ruolo, s.fase as Exclude<Fase, 'test'>, s.cicloFase, e)[0], superserie: e.superserie })), impostazioni.value.recuperi);
  const testMancanti = s.fase === 'test' ? s.esercizi.filter((e) => !b.test[e.esercizio_id]).length : 0;
  const testFatti = s.esercizi.length - testMancanti;
  const tuttiTestDelBlocco = b.sedute.filter((x) => x.fase === 'test').every((x) => x.stato === 'completata' || x.id === s.id);

  const completa = async () => {
    await completaSeduta(s.id);
    setConfermaCompleta(false);
    if (s.fase === 'test') setCongratulazioni(true);
    else vai('/');
  };

  if (congratulazioni) {
    return (
      <div class="pagina" style="justify-content:center">
        <div class="carta centrato" style="gap:14px;padding:28px 20px">
          <div style="font-size:52px">🏁</div>
          <h1 style="font-size:32px">{tuttiTestDelBlocco ? 'Test completati al 100%' : 'Seduta di test completata'}</h1>
          <p class="muto">
            {tuttiTestDelBlocco
              ? 'Da questi carichi l’app ha calcolato tutte le sedute del blocco. Da ora si lavora.'
              : 'I carichi salvati precompilano già le sedute future. Avanti con la prossima seduta di test.'}
          </p>
          <button class="bottone primario pieno" onClick={() => vai('/')}>{tuttiTestDelBlocco ? 'Inizia la Fase 1' : 'Torna al programma'}</button>
        </div>
      </div>
    );
  }

  return (
    <div class="pagina">
      <Testata sopratitolo={infoCiclo(b, s).testata} />
      <div class="colonna" style="gap:8px">
        <h1>{s.nome}</h1>
        <p class="muto">{s.etichetta}</p>
        <div class="riga" style="gap:16px">
          <span class="muto"><b style="color:var(--testo)">{s.fase === 'test' ? testFatti : fatte}</b> di {s.esercizi.length} esercizi</span>
          {s.fase !== 'test' ? <span class="muto"><b style="color:var(--testo)">~{minuti(durata)}</b> min</span> : null}
          {s.data ? <span class="muto">{formatoData(s.data)}</span> : null}
        </div>
        <div class="progresso"><div style={`width:${s.esercizi.length ? ((s.fase === 'test' ? testFatti : fatte) / s.esercizi.length) * 100 : 0}%`} /></div>
      </div>

      {anteprima ? (
        <Avviso tipo="info">
          <b>Anteprima: non ancora in programma.</b> Serie, ripetizioni e kg sono calcolati con i carichi correnti di oggi e si aggiornano se cambiano. Aprire l'anteprima non modifica nulla.
          {prova ? ' Con la modalità prova puoi comunque avviarla fuori ordine.' : ''}
        </Avviso>
      ) : null}
      {s.stato === 'completata' ? <Avviso tipo="info">Seduta completata. Puoi riaprirla per correggere i dati, o annullarla per cancellarla del tutto.</Avviso> : null}
      {s.fase === 'test' && s.stato !== 'completata' && puoIniziare ? (
        <Avviso tipo="info">Testa i carichi di tutti gli esercizi di questa seduta: da questi l'app calcola con precisione con quanto peso lavorare dalla settimana prossima. Fondamentali con la stima del massimale, gli altri con una serie unica a cedimento.</Avviso>
      ) : null}

      {s.stato === 'futura' && s.fase !== 'test' ? (
        <button class="bottone primario pieno" disabled={!puoIniziare} onClick={() => void iniziaSeduta(s.id)}>{anteprima ? (prova ? 'Inizia fuori ordine (prova)' : 'Inizia (dopo le precedenti)') : 'Inizia la seduta'}</button>
      ) : null}

      {gruppi(s).map((g) => (
        <div class="carta" style="gap:0;padding-top:6px;padding-bottom:4px">
          <div class="riga spazio" style="padding:10px 0 6px">
            <h2>{NOMI_GRUPPI[g.gruppo]}</h2>
            <span class="piccolo">{g.esercizi.length} {g.esercizi.length === 1 ? 'esercizio' : 'esercizi'}</span>
          </div>
          {g.esercizi.map((e) =>
            s.fase === 'test' ? <RigaTest key={e.slot + e.esercizio_id} s={s} es={e} /> : <RigaEsercizio key={e.slot + e.esercizio_id} s={s} es={e} onSostituisci={() => setSost(e)} />,
          )}
        </div>
      ))}

      {s.stato !== 'completata' && (s.fase === 'test' ? puoIniziare : s.stato === 'in_corso') ? (
        <>
          {!confermaCompleta ? (
            <button class="bottone pieno" disabled={s.fase === 'test' && testMancanti > 0} onClick={() => (s.fase === 'test' ? completa() : setConfermaCompleta(true))}>
              {s.fase === 'test' ? (testMancanti > 0 ? `Manca ancora ${testMancanti} ${testMancanti === 1 ? 'esercizio' : 'esercizi'}` : 'Completa seduta') : 'Completa seduta'}
            </button>
          ) : (
            <div class="carta">
              <p>{fatte < s.esercizi.length ? `Hai completato ${fatte} esercizi su ${s.esercizi.length}. Chiudere comunque la seduta?` : 'Confermi di aver finito?'}</p>
              <div class="griglia2">
                <button class="bottone" onClick={() => setConfermaCompleta(false)}>No</button>
                <button class="bottone primario" onClick={completa}>Sì, completa</button>
              </div>
            </div>
          )}
        </>
      ) : null}
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

      {sost ? <Sostituzione s={s} es={sost} onChiudi={() => setSost(null)} /> : null}
    </div>
  );
}
