import { useState } from 'preact/hooks';
import type { EsercizioSeduta, Fase, Gruppo, Seduta as TSeduta } from '../../tipi';
import { NOMI_GRUPPI, esercizio as trovaEsercizio } from '../../data/esercizi';
import { NOMI_FASI } from '../../data/tabelle';
import { alternative } from '../../motore/generatore';
import { durataStimata, minuti, prescrizione, serieRip } from '../../motore/prescrizione';
import { percentualeRM } from '../../motore/carichi';
import {
  avviabile,
  blocco,
  completaSeduta,
  impostazioni,
  iniziaSeduta,
  profilo,
  registroDi,
  riapriSeduta,
  salvaTest,
  sedutaPerId,
  sostituisciEsercizio,
  stato,
} from '../../store/stato';
import { Avviso, Badge, Modale, Testata, formatoData, formatoKg } from '../componenti/comuni';
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
      <p class="muto">Alternative della stessa classe di <b>{trovaEsercizio(es.esercizio_id, p.esercizi_personalizzati)?.nome}</b>. Se l'alternativa ha un test usa quello, altrimenti eredita il carico dell'originale.</p>
      {alt.length === 0 ? <Avviso>Nessuna alternativa disponibile (tutte escluse o già in seduta).</Avviso> : null}
      {alt.map((a) => (
        <button class="bottone pieno" style="justify-content:space-between" onClick={async () => { await sostituisciEsercizio(s.id, es.slot, a.id, permanente); onChiudi(); }}>
          <span>{a.nome}</span>
          <span class="piccolo">{test[a.id] ? `test ${formatoKg(test[a.id].kg)}` : 'eredita'}</span>
        </button>
      ))}
      <label class="riga" style="gap:10px;padding:6px 0">
        <input type="checkbox" checked={permanente} onChange={(e) => setPermanente((e.target as HTMLInputElement).checked)} />
        <span class="muto">Anche nelle prossime sedute di questo giorno</span>
      </label>
    </Modale>
  );
}

function RigaTest({ s, es }: { s: TSeduta; es: EsercizioSeduta }) {
  const b = blocco.value!;
  const p = profilo.value!;
  const def = trovaEsercizio(es.esercizio_id, p.esercizi_personalizzati);
  const fondamentale = es.ruolo === 'R1' || es.ruolo === 'L';
  const t = b.test[es.esercizio_id];
  const pr = prescrizione(es, s, b.test, p.impostazioni);
  const [kg, setKg] = useState(t ? String(t.kg) : '');
  const [rip, setRip] = useState(t ? String(t.rip) : String(pr.rip));
  const [sost, setSost] = useState(false);
  const salva = () => {
    const k = parseFloat(kg.replace(',', '.'));
    const r = parseInt(rip, 10);
    if (k > 0 && r > 0) void salvaTest(es.esercizio_id, k, r, fondamentale);
  };
  const rm1 = t?.rm1;
  return (
    <div class="colonna" style="padding:12px 0;border-top:1px solid var(--bordo);gap:8px">
      <div class="riga spazio">
        <div class="cresce">
          <div class="nome" style="font-size:17px;font-weight:500">{def?.nome ?? es.esercizio_id}</div>
          <div class="piccolo" style="margin-top:3px">{pr.testo}</div>
        </div>
        <button class="icona-bottone" aria-label="Sostituisci esercizio" onClick={() => setSost(true)}>⇄</button>
      </div>
      <div class="riga" style="gap:8px">
        <div class="campo cresce"><label>kg</label><input type="number" inputMode="decimal" step="0.5" min="0" value={kg} onInput={(e) => setKg((e.target as HTMLInputElement).value)} onBlur={salva} placeholder="0" /></div>
        <div class="campo cresce"><label>ripetizioni</label><input type="number" inputMode="numeric" min="1" max="20" value={rip} onInput={(e) => setRip((e.target as HTMLInputElement).value)} onBlur={salva} /></div>
        <div class="campo cresce"><label>{fondamentale ? '1RM stimato' : 'carico di lavoro'}</label><div class="input" style="display:flex;align-items:center;justify-content:center;font-weight:600;min-height:46px">{fondamentale ? (rm1 ? formatoKg(Math.round(rm1 * 2) / 2) : '—') : t ? formatoKg(t.kg) : '—'}</div></div>
      </div>
      {fondamentale && t && t.rip > 10 ? <Avviso>Oltre 10 ripetizioni la stima del massimale è inaffidabile.</Avviso> : null}
      {!fondamentale && t && t.rip !== pr.rip ? <p class="piccolo">Il carico di lavoro sarà quello inserito; il protocollo prevede {pr.rip} ripetizioni.</p> : null}
      {!t && es.ruolo === 'L' ? <p class="piccolo">Stesso esercizio già testato come fondamentale: basta un test.</p> : null}
      {sost ? <Sostituzione s={s} es={es} onChiudi={() => setSost(false)} /> : null}
    </div>
  );
}

function RigaEsercizio({ s, es, onSostituisci }: { s: TSeduta; es: EsercizioSeduta; onSostituisci: () => void }) {
  const b = blocco.value!;
  const p = profilo.value!;
  const def = trovaEsercizio(es.esercizio_id, p.esercizi_personalizzati);
  const pr = prescrizione(es, s, b.test, p.impostazioni, b.correzioni[es.esercizio_id] ?? 0);
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
          <span>{pr.serie}×{pr.rip} @ {pr.kg !== undefined ? formatoKg(pr.kg) : 'senza test'}</span>
          {pr.scalaRM ? <span class="piccolo">{pr.scalaRM}RM · {Math.round(percentualeRM(pr.scalaRM) * 100)}%</span> : null}
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
  if (!s || !b || !p) return <div class="pagina"><Testata /><p class="muto">Seduta non trovata.</p></div>;

  const puoIniziare = avviabile(s);
  const reg = registroDi(s.id);
  const fatte = s.esercizi.filter((e) => {
    const r = reg?.esercizi[e.slot];
    return r && r.serie.filter((x) => !x.stripping).every((x) => x.fatta);
  }).length;
  const durata = s.fase === 'test' ? 0 : durataStimata(s.esercizi.map((e) => ({ ruolo: e.ruolo, serie: serieRip(e.ruolo, s.fase as Exclude<Fase, 'test'>, s.cicloFase, e)[0], superserie: e.superserie })), impostazioni.value.recuperi);
  const testMancanti = s.fase === 'test' ? s.esercizi.filter((e) => !b.test[e.esercizio_id]).length : 0;

  const completa = async () => {
    await completaSeduta(s.id);
    setConfermaCompleta(false);
    vai('/');
  };

  return (
    <div class="pagina">
      <Testata sopratitolo={`Blocco ${b.numero} · ${NOMI_FASI[s.fase]} · ciclo ${s.cicloFase}`} />
      <div class="colonna" style="gap:8px">
        <h1>{s.nome}</h1>
        <p class="muto">{s.etichetta}</p>
        <div class="riga" style="gap:16px">
          <span class="muto"><b style="color:var(--testo)">{s.fase === 'test' ? s.esercizi.length - testMancanti : fatte}</b> di {s.esercizi.length} esercizi</span>
          {s.fase !== 'test' ? <span class="muto"><b style="color:var(--testo)">~{minuti(durata)}</b> min</span> : null}
          {s.data ? <span class="muto">{formatoData(s.data)}</span> : null}
        </div>
        <div class="progresso"><div style={`width:${s.esercizi.length ? ((s.fase === 'test' ? s.esercizi.length - testMancanti : fatte) / s.esercizi.length) * 100 : 0}%`} /></div>
      </div>

      {s.stato === 'futura' && !puoIniziare ? <Avviso tipo="info">Stai sbirciando: potrai iniziare questa seduta solo dopo le precedenti. I carichi mostrati sono già calcolati dal test.</Avviso> : null}
      {s.stato === 'completata' ? <Avviso tipo="info">Seduta completata. Puoi riaprirla per correggere i dati.</Avviso> : null}
      {s.fase === 'test' && s.stato !== 'completata' ? (
        <Avviso tipo="info">Inserisci il carico di ogni esercizio appena lo provi. I fondamentali a 3 ripetizioni (3RM); gli altri con il peso con cui chiudi le ripetizioni indicate a cedimento tecnico.</Avviso>
      ) : null}

      {s.stato === 'futura' && puoIniziare && s.fase !== 'test' ? (
        <button class="bottone primario pieno" onClick={() => void iniziaSeduta(s.id)}>Inizia la seduta</button>
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
          {s.fase === 'test' && testMancanti > 0 ? <Avviso>{testMancanti} {testMancanti === 1 ? 'esercizio senza test: avrà il carico vuoto' : 'esercizi senza test: avranno il carico vuoto'} finché non lo inserisci (puoi farlo anche dopo, da Impostazioni → Test).</Avviso> : null}
          {!confermaCompleta ? (
            <button class="bottone pieno" onClick={() => setConfermaCompleta(true)}>{s.fase === 'test' ? 'Completa il test' : 'Completa seduta'}</button>
          ) : (
            <div class="carta">
              <p>{s.fase !== 'test' && fatte < s.esercizi.length ? `Hai completato ${fatte} esercizi su ${s.esercizi.length}. Chiudere comunque la seduta?` : 'Confermi di aver finito?'}</p>
              <div class="griglia2">
                <button class="bottone" onClick={() => setConfermaCompleta(false)}>No</button>
                <button class="bottone primario" onClick={completa}>Sì, completa</button>
              </div>
            </div>
          )}
        </>
      ) : null}
      {s.stato === 'completata' ? <button class="bottone fantasma pieno" onClick={() => void riapriSeduta(s.id)}>Riapri la seduta</button> : null}

      {sost ? <Sostituzione s={s} es={sost} onChiudi={() => setSost(null)} /> : null}
    </div>
  );
}
