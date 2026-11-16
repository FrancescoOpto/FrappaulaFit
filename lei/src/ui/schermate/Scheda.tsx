import { useState } from 'preact/hooks';
import { ESERCIZI_PER_ID, NOMI_GRUPPI, NOMI_MOVIMENTI } from '../../data/esercizi';
import { NOMI_FASI } from '../../data/programma';
import { caricoPiano, percentualeRM } from '../../motore/prescrizione';
import { aggiornaNota, contesto, impostazioni, pianoDi, programma, registroDi, registroPrecedente, ripristinaCaricoPiano, sedutaPerId, stato } from '../../store/stato';
import { Avviso, Badge, Testata, formatoData, formatoKg, recuperoTesto } from '../componenti/comuni';
import { IconaEsercizio } from '../componenti/IconaEsercizio';
import { infoSettimana } from '../etichette';

// Scheda di un esercizio nella seduta: cosa fare oggi, come progredisce la fase, carico scelto, note, volta scorsa.

/** Sforzo da cercare (libro, Tab. 2.7): fondamentali mai a cedimento; "max" sempre a cedimento; il resto vicino al cedimento nelle ultime serie. */
function sforzo(fondamentale: boolean, max: boolean, alta: boolean): string {
  if (fondamentale) return 'Due ripetizioni di riserva nella prima serie, mai a cedimento: tecnica prima di tutto.';
  if (max) return 'A cedimento in tutte le serie: è lavoro metabolico, perdere qualche ripetizione nelle serie successive va bene.';
  if (alta) return '1–2 ripetizioni di riserva; quando in tutte le serie arrivi in cima al range, la volta dopo l’app propone più carico.';
  return 'Una o due ripetizioni di riserva nella prima serie, vicino al cedimento nelle ultime.';
}

export function Scheda({ sedutaId, voceId }: { sedutaId: string; voceId: string }) {
  void stato.value;
  const s = sedutaPerId(sedutaId);
  const pr = programma.value;
  const reg = registroDi(sedutaId);
  const [nota, setNota] = useState(reg?.voci[voceId]?.nota ?? '');
  if (!s || !pr) return <div class="pagina"><Testata /><p class="muto">Esercizio non trovato.</p></div>;
  const piano = pianoDi(s);
  const v = piano.voci.find((x) => x.voce.id === voceId);
  if (!v) return <div class="pagina"><Testata /><p class="muto">Esercizio non trovato.</p></div>;
  const rv = reg?.voci[voceId];
  const id = rv?.esercizio_id ?? v.p.esercizio_id;
  const def = ESERCIZI_PER_ID[id];
  const prec = registroPrecedente(sedutaId, id);
  const c = contesto();
  const t = pr.test[id];
  const passo = impostazioni.value.arrotondamento;
  const righe = s.fase !== 'test' ? v.voce.righe[s.faseRif] : [];
  const glutei = v.voce.parte === 'glutei';

  return (
    <div class="pagina">
      <Testata sopratitolo={`${s.nome} · ${infoSettimana(pr, s).testata}`} accento />
      <div class="colonna" style="gap:8px">
        <div class="riga" style="gap:10px">
          <IconaEsercizio def={def} />
          <div class="riga" style="gap:8px">
            <Badge testo={def?.fondamentale ? 'Fondamentale' : def?.movimento ? NOMI_MOVIMENTI[def.movimento] : NOMI_GRUPPI[def?.gruppo ?? 'glutei']} accento={def?.fondamentale} />
          </div>
        </div>
        <h1 style="font-size:32px">{def?.nome ?? id}</h1>
        {s.fase !== 'test' ? (
          <div class="riga" style="gap:8px;flex-wrap:wrap">
            <span class="chip"><b>{rv?.serie.length ?? v.p.serie} × {v.p.max ? 'max' : v.p.rip}{v.p.secondi ? '″' : ''}</b></span>
            {!v.p.senzaCarico ? <span class="chip">{v.p.kg !== undefined ? formatoKg(v.p.kg) : 'carico da scegliere'}</span> : <span class="chip">{def?.carico_modo === 'banda' ? 'elastico' : 'corpo libero'}</span>}
            {v.p.pct ? <span class="chip">{Math.round(v.p.pct * 100)} % del massimale</span> : null}
            {v.p.rm ? <span class="chip">carico da {v.p.rm} RM</span> : null}
            {!v.circuito ? <span class="chip">recupero {recuperoTesto(v.p.recupero)}</span> : <span class="chip">nel circuito</span>}
          </div>
        ) : null}
        <p class="piccolo"><b>Sforzo:</b> {sforzo(Boolean(def?.fondamentale), v.p.max, v.voce.parte === 'alta')}</p>
        {def?.nota ? <p class="piccolo"><b>Esecuzione:</b> {def.nota}</p> : null}
        <a class="bottone fantasma piccolo" style="align-self:flex-start" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(def?.query_youtube ?? id)}`} target="_blank" rel="noopener">Cerca il video dell’esecuzione ↗</a>
      </div>

      {v.p.corrente ? (
        <div class="carta compatta">
          <div class="riga spazio" style="flex-wrap:wrap;gap:8px">
            <span class="piccolo">{v.p.corrente.origine === 'proposta' ? 'Carico proposto dalla progressione' : 'Carico scelto da te'}: {formatoKg(v.p.corrente.kg)}{v.p.kgPiano ? ` · piano ${formatoKg(v.p.kgPiano)}` : ''}</span>
            <button class="bottone piccolo fantasma" onClick={() => void ripristinaCaricoPiano(id)}>Torna al piano</button>
          </div>
        </div>
      ) : null}
      {!v.p.senzaCarico && !t && s.fase !== 'test' ? <Avviso tipo="info">Nessun test per questo esercizio: alla prima serie scegli tu il carico{v.p.rm ? ` (circa ${v.p.rm} ripetizioni al massimo)` : ''}; l’app lo ricorda per le volte dopo.</Avviso> : null}

      {glutei && righe.length > 1 ? (
        <div class="carta">
          <h3>{NOMI_FASI[s.faseRif]}: le settimane</h3>
          <table class="tabella">
            <thead><tr><th>Sett.</th><th>Serie</th><th class="num">Carico</th></tr></thead>
            <tbody>
              {righe.map((r, i) => {
                const kg = t ? caricoPiano(t.rm1, r, passo) : undefined;
                const oggi = s.fase !== 'scarico' && s.riga === i + 1;
                return (
                  <tr style={oggi ? 'color:var(--accento2);font-weight:700' : undefined}>
                    <td>{i + 1}{oggi ? ' ·' : ''}</td>
                    <td>{r.s} × {r.max ? 'max' : r.r}</td>
                    <td class="num">{r.pct ? `${Math.round(r.pct * 100)} %` : r.rm ? `${r.rm} RM${r.inc ? ` +${Math.round(r.inc * 100)} %` : ''}` : ''}{kg ? ` · ${formatoKg(kg)}` : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p class="piccolo">Le settimane si riferiscono alla fase intera del libro{pr.composizione.some((x) => x.fase === s.faseRif && x.giro === s.giro && x.settimane < 6) ?'; nel tuo piano la fase è più corta e salta alcune righe' : ''}.{t ? ` Massimale di riferimento: ${formatoKg(t.rm1)}.` : ''}{righe.some((r) => r.inc) ? ' Gli aumenti "+%" del libro non superano mai il carico da una ripetizione di riserva.' : ''}</p>
        </div>
      ) : null}

      {rv ? (
        <div class="carta compatta">
          <h3>Serie di oggi</h3>
          <div class="riga" style="flex-wrap:wrap;gap:6px">
            {rv.serie.map((x) => <span class="chip" style={x.fatta ? 'color:var(--verde)' : undefined}>{x.n}. {!v.p.senzaCarico ? `${formatoKg(x.kg ?? x.kg_prev)} × ` : ''}{x.fatta ? x.rip ?? x.rip_prev : v.p.max ? 'max' : x.rip_prev}{x.fatta ? ' ✓' : ''}</span>)}
          </div>
          <p class="piccolo">Le serie si registrano dalla seduta. Il kg che scrivi resta per le volte dopo.</p>
        </div>
      ) : null}

      {prec ? (
        <div class="carta compatta">
          <div class="riga spazio"><h3>La volta scorsa</h3><span class="piccolo">{prec.seduta.nome} · {formatoData(prec.seduta.data)}</span></div>
          <div class="riga" style="flex-wrap:wrap;gap:6px">
            {prec.voce.serie.filter((x) => x.fatta).map((x) => <span class="chip">{!v.p.senzaCarico ? `${x.kg ?? x.kg_prev} kg × ` : ''}{x.rip ?? x.rip_prev}</span>)}
          </div>
          {prec.voce.nota ? <p class="piccolo">“{prec.voce.nota}”</p> : null}
        </div>
      ) : null}

      {rv ? (
        <div class="carta compatta">
          <h3>Nota</h3>
          <textarea rows={3} value={nota} onInput={(e) => setNota((e.target as HTMLTextAreaElement).value)} onBlur={() => void aggiornaNota(sedutaId, voceId, nota)} placeholder="Sensazioni, regolazioni della macchina, appunti…" />
        </div>
      ) : null}

      {t ? <p class="piccolo">Test: {t.modo === 'stima' ? `${t.rip} × ${formatoKg(t.kg)}` : `${t.rip} RM a ${formatoKg(t.kg)}`} → massimale {formatoKg(t.rm1)}{t.rm1_test && t.rm1_test !== t.rm1 ? ` (aggiornato in seduta, era ${formatoKg(t.rm1_test)})` : ''}. {c.obiettivo === 'definizione' ? 'In Dimagrimento i carichi restano gli stessi.' : ''}</p> : null}
      <p class="piccolo">Tabella del libro: {Math.round(percentualeRM(10) * 100)} % del massimale ≈ 10 ripetizioni, {Math.round(percentualeRM(15) * 100)} % ≈ 15, {Math.round(percentualeRM(20) * 100)} % ≈ 20.</p>
    </div>
  );
}
