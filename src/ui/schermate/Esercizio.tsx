import { useEffect, useState } from 'preact/hooks';
import type { SerieRegistrata } from '../../tipi';
import { NOMI_GRUPPI, esercizio as trovaEsercizio, linkYoutube } from '../../data/esercizi';
import { PAUSA_REST_PAUSE_TOTALE, PAUSE_10_PIU_3 } from '../../data/tabelle';
import { percentualeRM } from '../../motore/carichi';
import {
  aggiornaNota,
  aggiornaSerie,
  aggiungiStripping,
  avviabile,
  blocco,
  caricoCorrenteDi,
  chiaveCorrente,
  impostazioni,
  iniziaSeduta,
  prescrizioneDi,
  profilo,
  registroDi,
  registroPrecedente,
  ripristinaCaricoPiano,
  sedutaPerId,
  stato,
} from '../../store/stato';
import { Avviso, Badge, Testata, formatoKg } from '../componenti/comuni';
import { Icona, IconaEsercizio } from '../componenti/IconaEsercizio';
import { infoCiclo, sforzoPer } from '../etichette';
import { aggiungiSecondi, attivo, avviaTimer, fermaTimer, formatoMMSS, rimanente, timer } from '../timer';
import { vai } from '../router';

/** Riga rest-pause (Blocco 3): un solo kg, ripetizioni di ogni mini-serie, timer con le pause previste. */
function RigaRestPause({ sedutaId, slot, x, soloLettura, recupero, etichetta }: { sedutaId: string; slot: number; x: SerieRegistrata; soloLettura: boolean; recupero: number; etichetta: string }) {
  const dieciPiuTre = x.rest_pause === '10_piu_3';
  const nMini = dieciPiuTre ? 4 : Math.max(4, (x.mini?.length ?? 0) + 1);
  const [kg, setKg] = useState(x.kg !== undefined ? String(x.kg) : x.kg_prev ? String(x.kg_prev) : '');
  const [mini, setMini] = useState<string[]>(Array.from({ length: nMini }, (_, i) => (x.mini?.[i] !== undefined ? String(x.mini[i]) : i === 0 && dieciPiuTre ? '10' : '')));
  const numeri = () => mini.map((m) => parseInt(m, 10)).filter((n) => Number.isFinite(n) && n > 0);
  const totale = numeri().reduce((a, b) => a + b, 0);
  const salva = (fatta: boolean) => {
    if (soloLettura) return;
    const k = parseFloat(kg.replace(',', '.'));
    void aggiornaSerie(sedutaId, slot, x.n, { kg: Number.isFinite(k) ? k : undefined, rip: totale || undefined, mini: numeri(), fatta });
  };
  const pausaDopo = (i: number) => (dieciPiuTre ? PAUSE_10_PIU_3[Math.min(i, PAUSE_10_PIU_3.length - 1)] : PAUSA_REST_PAUSE_TOTALE);
  return (
    <div class="colonna" style="gap:8px">
      <p class="piccolo">
        {dieciPiuTre
          ? `Rest-pause “10 + 3 volte max”: 10 ripetizioni, pausa ${PAUSE_10_PIU_3[0]}″, massime ripetizioni, pausa ${PAUSE_10_PIU_3[1]}″, massime, pausa ${PAUSE_10_PIU_3[2]}″, massime. Carico leggermente più basso di quello da 8 ripetizioni.`
          : `Rest-pause: ${x.rip_prev} ripetizioni totali con il carico del test, con pause brevi (≈${PAUSA_REST_PAUSE_TOTALE}″) quando serve. Segna le ripetizioni di ogni tratto.`}
      </p>
      <div class="riga" style="gap:8px;align-items:flex-end">
        <div class="campo" style="width:110px"><label>kg</label><input type="number" inputMode="decimal" step="0.5" min="0" value={kg} disabled={soloLettura} onInput={(e) => setKg((e.target as HTMLInputElement).value)} onBlur={() => salva(x.fatta)} /></div>
        <div class="cresce piccolo">{x.kg_piano !== undefined && x.kg_piano !== x.kg_prev ? `piano ${x.kg_piano} kg` : x.kg_prev ? `prev. ${formatoKg(x.kg_prev)}` : 'carico a tua scelta'} · totale <b>{totale}</b>{dieciPiuTre ? '' : ` / ${x.rip_prev}`}</div>
      </div>
      <div class="riga" style="gap:6px;flex-wrap:wrap">
        {mini.map((m, i) => (
          <div class="colonna" style="gap:2px;width:64px">
            <input type="number" inputMode="numeric" min="0" value={m} disabled={soloLettura} placeholder={i === 0 && dieciPiuTre ? '10' : 'max'} onInput={(e) => { const c = [...mini]; c[i] = (e.target as HTMLInputElement).value; setMini(c); }} onBlur={() => salva(x.fatta)} aria-label={`rest-pause tratto ${i + 1}`} />
            {i < mini.length - 1 ? <button class="bottone piccolo fantasma" style="min-height:30px;padding:0 6px;font-size:12px" disabled={soloLettura} onClick={() => avviaTimer(pausaDopo(i), `${etichetta} · pausa`)}>pausa {pausaDopo(i)}″</button> : <span class="piccolo centrato">fine</span>}
          </div>
        ))}
        {!dieciPiuTre && !soloLettura ? <button class="bottone piccolo fantasma" onClick={() => setMini([...mini, ''])}>+ tratto</button> : null}
      </div>
      <button class={`bottone ${x.fatta ? 'primario' : ''}`} disabled={soloLettura} onClick={() => { if (x.fatta) { void aggiornaSerie(sedutaId, slot, x.n, { fatta: false }); return; } salva(true); avviaTimer(recupero, etichetta); }}>
        {x.fatta ? 'Fatta' : 'Fatta (avvia recupero)'}
      </button>
    </div>
  );
}

function RigaSerie({ sedutaId, slot, x, soloLettura, recupero, etichetta, ultima }: { sedutaId: string; slot: number; x: SerieRegistrata; soloLettura: boolean; recupero: number; etichetta: string; ultima?: boolean }) {
  const [kg, setKg] = useState(x.kg !== undefined ? String(x.kg) : x.kg_prev ? String(x.kg_prev) : '');
  const [rip, setRip] = useState(x.rip !== undefined ? String(x.rip) : String(x.rip_prev));
  // Se l'autocorrezione cambia il previsto (−5 %) e l'utente non ha ancora scritto nulla, aggiorna il campo.
  useEffect(() => {
    if (x.kg === undefined) setKg(x.kg_prev ? String(x.kg_prev) : '');
  }, [x.kg_prev]);
  const numeri = () => {
    const k = parseFloat(kg.replace(',', '.'));
    const r = parseInt(rip, 10);
    return { kg: Number.isFinite(k) ? k : undefined, rip: Number.isFinite(r) ? r : undefined };
  };
  const salvaCampi = () => {
    if (soloLettura) return;
    void aggiornaSerie(sedutaId, slot, x.n, numeri());
  };
  const toggle = () => {
    if (soloLettura) return;
    if (x.fatta) {
      void aggiornaSerie(sedutaId, slot, x.n, { fatta: false });
      return;
    }
    const v = numeri();
    void aggiornaSerie(sedutaId, slot, x.n, { ...v, fatta: true });
    avviaTimer(recupero, etichetta);
  };
  return (
    <div class={`serie-riga ${x.fatta ? 'fatta' : ''}`}>
      <div class="n">{x.stripping ? '−30%' : x.n}</div>
      <div>
        <input type="number" inputMode="decimal" step="0.5" min="0" value={kg} disabled={soloLettura} onInput={(e) => setKg((e.target as HTMLInputElement).value)} onBlur={salvaCampi} aria-label={`kg serie ${x.n}`} />
        <div class="prev">{x.kg_piano !== undefined && x.kg_piano !== x.kg_prev ? `piano ${x.kg_piano} kg` : x.kg_prev ? `prev. ${formatoKg(x.kg_prev)}` : 'kg'}</div>
      </div>
      <div>
        <input type="number" inputMode="numeric" min="0" value={rip} disabled={soloLettura} onInput={(e) => setRip((e.target as HTMLInputElement).value)} onBlur={salvaCampi} aria-label={`ripetizioni serie ${x.n}`} />
        <div class="prev">{x.stripping ? 'a cedimento' : `prev. ${x.rip_prev} rip`}</div>
      </div>
      <button class={`bottone piccolo ${x.fatta ? 'primario' : ''}`} style="min-height:46px;min-width:70px" disabled={soloLettura} onClick={toggle} aria-label={x.fatta ? `Serie ${x.n} fatta` : `Segna fatta la serie ${x.n}`}>
        {x.fatta ? <Icona nome="spunta" dimensione={18} /> : 'Fatta'}
      </button>
      {ultima && x.fatta && !x.stripping ? (
        <div class="riga" style="grid-column:1 / -1;gap:6px;align-items:center">
          <span class="piccolo">Com'era?</span>
          {(['facile', 'giusto', 'limite'] as const).map((v) => (
            <button class={`bottone piccolo ${x.sforzo === v ? 'primario' : 'fantasma'}`} style="min-height:32px;padding:0 10px;font-size:13px" disabled={soloLettura} onClick={() => void aggiornaSerie(sedutaId, slot, x.n, { sforzo: v })}>{v === 'facile' ? 'Facile' : v === 'giusto' ? 'Giusto' : 'Al limite'}</button>
          ))}
          {x.sforzo === 'facile' ? <span class="piccolo">+1 passo di carico proposto alla prossima seduta</span> : null}
        </div>
      ) : null}
    </div>
  );
}

export function Esercizio({ sedutaId, slot }: { sedutaId: string; slot: number }) {
  void stato.value;
  const s = sedutaPerId(sedutaId);
  const b = blocco.value;
  const p = profilo.value;
  const es = s?.esercizi.find((e) => e.slot === slot);
  if (!s || !b || !p || !es) return <div class="pagina"><Testata /><p class="muto">Esercizio non trovato.</p></div>;

  const def = trovaEsercizio(es.esercizio_id, p.esercizi_personalizzati);
  const correzione = b.correzioni[es.esercizio_id] ?? 0;
  const pr = prescrizioneDi(es, s);
  const corrente = caricoCorrenteDi(es);
  const reg = registroDi(s.id);
  const regEs = reg?.esercizi[slot];
  const soloLettura = s.stato !== 'in_corso';
  const recupero = impostazioni.value.recuperi[es.ruolo];
  const prec = registroPrecedente(s.id, es.esercizio_id);
  const idx = s.esercizi.findIndex((e) => e.slot === slot);
  const precEs = s.esercizi[idx - 1];
  const succEs = s.esercizi[idx + 1];
  const ultimoDelGruppo = !s.esercizi.slice(idx + 1).some((e) => e.gruppo === es.gruppo);
  const strippingPossibile = impostazioni.value.stripping && s.fase === 'fase2' && ultimoDelGruppo && regEs && !regEs.serie.some((x) => x.stripping);
  const [nota, setNota] = useState(regEs?.nota ?? '');
  const t = timer.value;
  const inTimer = attivo.value;

  return (
    <div class="pagina">
      <Testata sopratitolo={`${s.nome} · ${infoCiclo(b, s).testata}`} accento />
      <div class="colonna" style="gap:8px">
        <div class="riga" style="gap:10px">
          <IconaEsercizio def={def} />
          <div class="riga" style="gap:8px"><Badge ruolo={es.ruolo} /><span class="piccolo">{NOMI_GRUPPI[es.gruppo]}</span></div>
        </div>
        <h1 style="font-size:34px">{def?.nome ?? es.esercizio_id}</h1>
        <div class="riga" style="gap:10px;flex-wrap:wrap">
          <span class="chip"><b>{pr.serie}×{pr.rip}</b>&nbsp;@ {pr.kg !== undefined ? formatoKg(pr.kg) : '—'}</span>
          {pr.scalaRM ? <span class="chip">{pr.scalaRM}RM · {Math.round(percentualeRM(pr.scalaRM) * 100)}% del massimale</span> : null}
          {pr.percentuale ? <span class="chip">{Math.round(pr.percentuale * 100)}% del massimale</span> : null}
          {es.seconda_riga ? <span class="chip">seconda riga · carico a tua scelta</span> : null}
          {pr.rest_pause ? <span class="chip">rest-pause</span> : null}
          {es.back_off ? <span class="chip">back-off: {es.back_off.serie_pesanti}×{es.back_off.rip} + {es.back_off.serie_max}×max a −{Math.round(es.back_off.riduzione * 100)}%</span> : null}
          {es.resistenza ? <span class="chip">resistenza · 15–20 rip leggere</span> : null}
          {s.cicloTipo === 'ponte' ? <span class="chip">ciclo ponte</span> : null}
          <span class="chip">recupero {recupero}″</span>
        </div>
        {s.fase !== 'test' ? <p class="piccolo"><b>Sforzo:</b> {sforzoPer(es.ruolo, p.parametri.intensita, b.modulo)}</p> : null}
        {correzione ? <p class="piccolo">Carico corretto del {Math.round(correzione * 1000) / 10}% per ripetizioni mancate nei cicli precedenti (modificabile in Impostazioni → Test).</p> : null}
        {corrente && s.fase !== 'test' ? (
          <div class="riga spazio" style="flex-wrap:wrap;gap:8px">
            <span class="piccolo">
              {corrente.origine === 'proposta' ? 'Carico proposto dal coach (+1 passo dopo un "Facile")' : 'Carico scelto da te'}{corrente.fattore ? ` (×${corrente.fattore})` : ''} · piano: {formatoKg(pr.kgPiano)}
            </span>
            {!soloLettura || s.stato === 'futura' ? <button class="bottone piccolo fantasma" onClick={() => void ripristinaCaricoPiano(chiaveCorrente(es), s.stato === 'in_corso' ? s.id : undefined)}>Ripristina carico del piano</button> : null}
          </div>
        ) : null}
        {pr.ereditatoDa ? <p class="piccolo">Variante di fase: carico ereditato da {trovaEsercizio(pr.ereditatoDa, p.esercizi_personalizzati)?.nome ?? pr.ereditatoDa}; il kg che scrivi diventa il suo.</p> : null}
        {pr.kg === undefined && s.fase !== 'test' && !es.senza_carico ? <Avviso>Nessun test per questo esercizio: inserisci il carico a mano o aggiungi il test da Impostazioni → Test.</Avviso> : null}
        {es.senza_carico ? <p class="piccolo">Seconda riga del Target: scegli un carico più leggero di quello delle serie principali; il kg che scrivi resta per le sedute successive.</p> : null}
      </div>

      {(inTimer || (t && t.fine > Date.now() - 5000)) && t ? (
        <div class="carta timer-grande">
          <div class="piccolo">Recupero</div>
          <div class={`tempo ${rimanente.value === 0 ? 'finito' : ''}`}>{rimanente.value === 0 ? 'Vai!' : formatoMMSS(rimanente.value)}</div>
          <div class="griglia3 spazio-sopra">
            <button class="bottone piccolo" onClick={() => aggiungiSecondi(-15)}>−15″</button>
            <button class="bottone piccolo" onClick={() => aggiungiSecondi(30)}>+30″</button>
            <button class="bottone piccolo" onClick={fermaTimer}>Salta</button>
          </div>
        </div>
      ) : null}

      {s.stato === 'futura' ? (
        <Avviso tipo="info">
          {b.sedute.find((x) => x.stato !== 'completata')?.id === s.id ? 'Seduta non ancora iniziata.' : 'Anteprima: non ancora in programma. I kg sono calcolati con i carichi correnti di oggi.'}{' '}
          {avviabile(s) ? <button class="bottone piccolo" style="margin-left:6px" onClick={() => void iniziaSeduta(s.id)}>Inizia ora</button> : 'Potrai registrare le serie quando sarà il suo turno.'}
        </Avviso>
      ) : null}

      {regEs ? (
        <div class="carta">
          <div class="riga spazio"><h3>Serie</h3><span class="piccolo">“Fatta” avvia il recupero</span></div>
          {regEs.serie.map((x) =>
            x.rest_pause ? (
              <RigaRestPause key={`${x.n}-${es.esercizio_id}`} sedutaId={s.id} slot={slot} x={x} soloLettura={soloLettura} recupero={recupero} etichetta={def?.nome ?? ''} />
            ) : (
              <RigaSerie key={`${x.n}-${es.esercizio_id}`} sedutaId={s.id} slot={slot} x={x} soloLettura={soloLettura} recupero={recupero} etichetta={def?.nome ?? ''} ultima={x.n === Math.max(...regEs.serie.filter((y) => !y.stripping).map((y) => y.n))} />
            ),
          )}
          <p class="piccolo">Il kg che scrivi diventa il carico di questo esercizio anche per le sedute successive.</p>
          {strippingPossibile && !soloLettura ? (
            <button class="bottone fantasma pieno" onClick={() => void aggiungiStripping(s.id, slot)}>Aggiungi serie extra a −30% (stripping)</button>
          ) : null}
        </div>
      ) : (
        <div class="carta">
          <h3>Serie previste</h3>
          {Array.from({ length: pr.serie }, (_, i) => (
            <div class="riga spazio muto"><span>Serie {i + 1}</span><span>{pr.rip} rip @ {pr.kg !== undefined ? formatoKg(pr.kg) : '—'}</span></div>
          ))}
        </div>
      )}

      {prec ? (
        <div class="carta compatta">
          <div class="riga spazio"><h3>Ciclo scorso</h3><span class="piccolo">{prec.seduta.nome} · ciclo {prec.seduta.cicloFase}</span></div>
          <div class="riga" style="flex-wrap:wrap;gap:6px">
            {prec.es.serie.filter((x) => x.fatta).map((x) => (
              <span class="chip">{x.kg ?? x.kg_prev}×{x.rip ?? x.rip_prev}{x.stripping ? ' (−30%)' : ''}</span>
            ))}
          </div>
          {prec.es.nota ? <p class="piccolo">“{prec.es.nota}”</p> : null}
        </div>
      ) : null}

      <div class="carta compatta">
        <h3>Note</h3>
        <textarea value={nota} disabled={soloLettura && !regEs} placeholder="Sensazioni, presa, regolazioni della macchina…" onInput={(e) => setNota((e.target as HTMLTextAreaElement).value)} onBlur={() => regEs && void aggiornaNota(s.id, slot, nota)} />
      </div>

      {def ? (
        <a class="bottone pieno" href={linkYoutube(def)} target="_blank" rel="noopener noreferrer">
          <Icona nome="play" dimensione={18} /> Cerca su YouTube
        </a>
      ) : null}

      <div class="griglia2">
        <button class="bottone" disabled={!precEs} onClick={() => precEs && vai(`/seduta/${s.id}/es/${precEs.slot}`)}><Icona nome="indietro" dimensione={18} /> Precedente</button>
        {succEs ? (
          <button class="bottone" onClick={() => vai(`/seduta/${s.id}/es/${succEs.slot}`)}>Successivo <Icona nome="freccia" dimensione={18} /></button>
        ) : (
          <button class="bottone primario" onClick={() => vai(`/seduta/${s.id}`)}>Riepilogo seduta</button>
        )}
      </div>
    </div>
  );
}
