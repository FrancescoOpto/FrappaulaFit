import { useMemo, useState } from 'preact/hooks';
import type { Blocco, RegistroSeduta, Seduta } from '../../tipi';
import { esercizio as trovaEsercizio, NOMI_GRUPPI } from '../../data/esercizi';
import { NOMI_FASI } from '../../data/tabelle';
import { rm1DaTest } from '../../motore/carichi';
import { blocco, prescrizioneDi, profilo, stato } from '../../store/stato';
import { Scelte, Testata, formatoData, formatoKg } from '../componenti/comuni';
import { infoCiclo } from '../etichette';
import { vai } from '../router';

// Progressi: storico per esercizio (carico, volume, 1RM stimato), andamento delle sedute
// (tonnellaggio, durata, kg al minuto), volume per ciclo e massimali per blocco.

interface PuntoEsercizio {
  data: string;
  etichetta: string;
  kg: number;
  rip: number;
  volume: number;
  rm1: number;
  serie: string;
}

interface PuntoSeduta {
  seduta: Seduta;
  data: string;
  tonnellaggio: number;
  serie: number;
  rip: number;
  durataMin: number | null;
  kgMin: number | null;
}

type Metrica = 'kg' | 'volume' | 'rm1';
const NOMI_METRICA: Record<Metrica, string> = { kg: 'Carico', volume: 'Volume', rm1: '1RM stimato' };

function Grafico({ punti, unita, decimali = 0 }: { punti: { y: number; etichetta: string }[]; unita: string; decimali?: number }) {
  if (punti.length < 2) return <p class="piccolo">Servono almeno due rilevazioni per il grafico.</p>;
  const W = 320, H = 130, pad = 26, padX = 18;
  const ys = punti.map((p) => p.y);
  const min = Math.min(...ys), max = Math.max(...ys);
  const sy = (v: number) => (max === min ? H / 2 : H - pad - ((v - min) / (max - min)) * (H - 2 * pad));
  const sx = (i: number) => padX + (i / (punti.length - 1)) * (W - 2 * padX);
  const d = punti.map((p, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
  const area = `${d} L${sx(punti.length - 1).toFixed(1)},${H - pad} L${sx(0).toFixed(1)},${H - pad} Z`;
  const f = (v: number) => v.toLocaleString('it-IT', { maximumFractionDigits: decimali });
  const mostraEtichetta = (i: number, p: { y: number }) => i === 0 || i === punti.length - 1 || p.y === max || (punti.length <= 6);
  return (
    <svg class="grafico" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Andamento">
      <path d={area} fill="var(--accento)" opacity="0.12" />
      <line x1={padX} y1={H - pad} x2={W - padX} y2={H - pad} stroke="var(--bordo)" />
      <path d={d} fill="none" stroke="var(--accento)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      {punti.map((p, i) => (
        <g>
          <circle cx={sx(i)} cy={sy(p.y)} r="3.5" fill="var(--accento)" />
          {mostraEtichetta(i, p) ? <text x={sx(i)} y={sy(p.y) - 8} font-size="10" fill="var(--testo2)" text-anchor={i === 0 ? 'start' : i === punti.length - 1 ? 'end' : 'middle'}>{f(p.y)}{unita}</text> : null}
          {i === 0 || i === punti.length - 1 ? <text x={sx(i)} y={H - pad + 13} font-size="9" fill="var(--testo3)" text-anchor={i === 0 ? 'start' : 'end'}>{p.etichetta}</text> : null}
        </g>
      ))}
    </svg>
  );
}

function durataRegistro(reg: RegistroSeduta): number | null {
  if (!reg.completata) return null;
  const min = (new Date(reg.completata).getTime() - new Date(reg.iniziata).getTime()) / 60000;
  // Fuori da 10–240 minuti la seduta è stata chiusa in un altro momento: la durata non è attendibile.
  return min >= 10 && min <= 240 ? Math.round(min) : null;
}

interface RigaPiano {
  seduta: Seduta;
  ciclo: string;
  serie: number;
  rip: number;
  kg?: number;
  fatto?: string;
  /** Cosa cambia rispetto alla riga prima (SPEC_PIANIFICATORE v2 §11b). */
  cambia: { kg: boolean; serie: boolean; rip: boolean };
  note: string[];
}

/** Piano per esercizio: per tutti i cicli del programma, serie×rip @kg previsti (e fatti), con le variazioni evidenziate. */
function PianoEsercizio({ b, esercizioId }: { b: Blocco; esercizioId?: string }) {
  const p = profilo.value;
  const registro = stato.value.registro;
  const ids = useMemo(() => {
    const visti = new Map<string, string>();
    for (const s of b.sedute) {
      if (s.fase === 'test') continue;
      for (const e of s.esercizi) if (!e.senza_carico && !visti.has(e.esercizio_id)) visti.set(e.esercizio_id, e.gruppo);
    }
    const ordine = ['petto', 'dorso', 'spalle', 'gambe', 'bicipiti', 'tricipiti', 'addome'];
    return [...visti.entries()].sort((x, y) => ordine.indexOf(x[1]) - ordine.indexOf(y[1]) || (trovaEsercizio(x[0], p?.esercizi_personalizzati)?.nome ?? x[0]).localeCompare(trovaEsercizio(y[0], p?.esercizi_personalizzati)?.nome ?? y[0])).map(([id]) => id);
  }, [b]);
  const scelto = esercizioId && ids.includes(esercizioId) ? esercizioId : undefined;
  const righe = useMemo<RigaPiano[]>(() => {
    if (!scelto) return [];
    const out: RigaPiano[] = [];
    for (const s of b.sedute) {
      if (s.fase === 'test') continue;
      const e = s.esercizi.find((x) => x.esercizio_id === scelto && !x.senza_carico);
      if (!e) continue;
      const pr = prescrizioneDi(e, s);
      const reg = registro[s.id]?.esercizi[e.slot];
      const fatte = reg?.serie.filter((x) => x.fatta && !x.stripping) ?? [];
      const fatto = fatte.length ? fatte.map((x) => `${x.kg ?? x.kg_prev}×${x.rip ?? x.rip_prev}`).join(' · ') : undefined;
      const prec = out[out.length - 1];
      const note: string[] = [];
      if (pr.percentuale) note.push(`${Math.round(pr.percentuale * 100)} %`);
      if (pr.scalaRM) note.push(`${pr.scalaRM}RM`);
      if (pr.rest_pause) note.push('rest-pause');
      if (pr.corrente) note.push('carico tuo');
      if (s.cicloTipo === 'ponte') note.push('ponte');
      out.push({
        seduta: s,
        ciclo: infoCiclo(b, s).titolo,
        serie: pr.serie,
        rip: pr.rip,
        kg: pr.kg,
        fatto,
        cambia: { kg: prec ? prec.kg !== pr.kg : false, serie: prec ? prec.serie !== pr.serie : false, rip: prec ? prec.rip !== pr.rip : false },
        note,
      });
    }
    return out;
  }, [scelto, b, registro]);
  const def = scelto ? trovaEsercizio(scelto, p?.esercizi_personalizzati) : undefined;
  return (
    <div class="carta">
      <div class="riga spazio">
        <h2>Piano per esercizio</h2>
        {scelto ? <button class="bottone piccolo" onClick={() => vai('/progressi/piano')}>Tutti</button> : null}
      </div>
      <p class="piccolo">Serie × ripetizioni @ kg previsti in ogni ciclo del programma, calcolati con i carichi correnti di oggi. In arancione quello che cambia rispetto al ciclo prima; tra parentesi quello che hai fatto davvero.</p>
      {!scelto ? (
        <div class="colonna" style="gap:0">
          {ids.map((id) => {
            const d = trovaEsercizio(id, p?.esercizi_personalizzati);
            return (
              <div class="esercizio-riga" onClick={() => vai(`/progressi/piano/${id}`)}>
                <div class="cresce"><div class="nome">{d?.nome ?? id}</div><div class="dettaglio"><span>{d ? NOMI_GRUPPI[d.gruppo] : ''}</span></div></div>
                <span class="piccolo">›</span>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <h3>{def?.nome ?? scelto}</h3>
          <table class="tabella piano">
            <thead><tr><th>Ciclo</th><th>Seduta</th><th class="num">Previsto</th><th class="num">Fatto</th></tr></thead>
            <tbody>
              {righe.map((r) => (
                <tr class={r.seduta.stato === 'completata' ? 'fatta' : r.seduta.stato === 'in_corso' ? 'in-corso' : ''}>
                  <td class="piccolo">{r.ciclo}</td>
                  <td class="piccolo">{r.seduta.nome}</td>
                  <td class="num">
                    <span class={r.cambia.serie ? 'cambiato' : ''}>{r.serie}</span>×<span class={r.cambia.rip ? 'cambiato' : ''}>{r.rip}</span>{' @ '}
                    <span class={r.cambia.kg ? 'cambiato' : ''}>{r.kg !== undefined ? formatoKg(r.kg) : '—'}</span>
                    {r.note.length ? <div class="piccolo">{r.note.join(' · ')}</div> : null}
                  </td>
                  <td class="num piccolo">{r.fatto ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export function Progressi({ esercizioId, scheda }: { esercizioId?: string; scheda?: 'piano' }) {
  void stato.value;
  const b = blocco.value;
  const p = profilo.value;
  const registro = stato.value.registro;
  const checkin = stato.value.checkin;
  const blocchi: Blocco[] = [...stato.value.blocchiPassati, ...(b ? [b] : [])];
  const [metrica, setMetrica] = useState<Metrica>('kg');

  const { storico, sedute } = useMemo(() => {
    const m = new Map<string, PuntoEsercizio[]>();
    const sedute: PuntoSeduta[] = [];
    for (const bl of blocchi) {
      for (const s of bl.sedute) {
        if (s.stato !== 'completata' || s.fase === 'test') continue;
        const reg = registro[s.id];
        if (!reg) continue;
        let tonn = 0, nSerie = 0, nRip = 0;
        for (const es of Object.values(reg.esercizi)) {
          const fatte = es.serie.filter((x) => x.fatta && !x.stripping);
          if (!fatte.length) continue;
          const vol = fatte.reduce((a, x) => a + (x.kg ?? x.kg_prev) * (x.rip ?? x.rip_prev), 0);
          tonn += vol;
          nSerie += fatte.length;
          nRip += fatte.reduce((a, x) => a + (x.rip ?? x.rip_prev), 0);
          const top = fatte.reduce((a, x) => ((x.kg ?? x.kg_prev) > (a.kg ?? a.kg_prev) ? x : a), fatte[0]);
          const kg = top.kg ?? top.kg_prev;
          const rip = top.rip ?? top.rip_prev;
          const arr = m.get(es.esercizio_id) ?? [];
          arr.push({
            data: s.data ?? reg.iniziata,
            etichetta: `B${bl.numero} ${NOMI_FASI[s.fase]} c${s.cicloFase}`,
            kg,
            rip,
            volume: Math.round(vol),
            rm1: kg > 0 && rip > 0 && rip < 37 ? Math.round(rm1DaTest(kg, rip) * 2) / 2 : 0,
            serie: fatte.map((x) => `${x.kg ?? x.kg_prev}×${x.rip ?? x.rip_prev}`).join(' · '),
          });
          m.set(es.esercizio_id, arr);
        }
        const durataMin = durataRegistro(reg);
        sedute.push({ seduta: s, data: s.data ?? reg.iniziata, tonnellaggio: Math.round(tonn), serie: nSerie, rip: nRip, durataMin, kgMin: durataMin ? Math.round(tonn / durataMin) : null });
      }
    }
    for (const arr of m.values()) arr.sort((a, c) => a.data.localeCompare(c.data));
    sedute.sort((a, c) => a.data.localeCompare(c.data));
    return { storico: m, sedute };
  }, [registro, b]);

  // Volume per ciclo (settimana) del blocco corrente: serie e tonnellaggio.
  const perCiclo = useMemo(() => {
    const out: { ciclo: number; serie: number; tonnellaggio: number; etichetta: string }[] = [];
    for (const x of sedute) {
      if (!b || !b.sedute.some((s) => s.id === x.seduta.id)) continue;
      let c = out.find((o) => o.ciclo === x.seduta.ciclo);
      if (!c) {
        c = { ciclo: x.seduta.ciclo, serie: 0, tonnellaggio: 0, etichetta: `${NOMI_FASI[x.seduta.fase]} c${x.seduta.cicloFase}` };
        out.push(c);
      }
      c.serie += x.serie;
      c.tonnellaggio += x.tonnellaggio;
    }
    return out.sort((a, c) => a.ciclo - c.ciclo);
  }, [sedute, b]);

  // Storico dei massimali per blocco (TEST_INIZIO_BLOCCO §1c): un punto per blocco, blocco corrente evidenziato.
  const massimali = useMemo(() => {
    const perEs = new Map<string, { blocco: number; rm1: number; corrente: boolean }[]>();
    for (const bl of blocchi) {
      for (const t of Object.values(bl.test)) {
        if (t.modo !== 'stima' || !t.rm1) continue;
        const arr = perEs.get(t.esercizio_id) ?? [];
        arr.push({ blocco: bl.numero, rm1: t.rm1, corrente: bl.id === b?.id });
        perEs.set(t.esercizio_id, arr);
      }
    }
    return [...perEs.entries()].map(([id, punti]) => {
      punti.sort((x, y) => x.blocco - y.blocco);
      const ultimo = punti[punti.length - 1];
      const prec = punti[punti.length - 2];
      const delta = prec ? Math.round((ultimo.rm1 - prec.rm1) * 2) / 2 : null;
      const deltaPct = prec ? Math.round(((ultimo.rm1 - prec.rm1) / prec.rm1) * 1000) / 10 : 0;
      return { id, nome: trovaEsercizio(id, p?.esercizi_personalizzati)?.nome ?? id, punti, delta, deltaPct };
    });
  }, [b, stato.value.blocchiPassati]);

  const ids = [...storico.keys()].sort((a, c) => (trovaEsercizio(a, p?.esercizi_personalizzati)?.nome ?? a).localeCompare(trovaEsercizio(c, p?.esercizi_personalizzati)?.nome ?? c));
  const scelto = esercizioId && storico.has(esercizioId) ? esercizioId : undefined;
  const punti = scelto ? storico.get(scelto)! : [];
  const fatte = b?.sedute.filter((s) => s.stato === 'completata').length ?? 0;
  const tonnTot = sedute.reduce((a, x) => a + x.tonnellaggio, 0);
  const conDurata = sedute.filter((x) => x.kgMin !== null);

  return (
    <div class="pagina">
      <Testata senzaIndietro />
      <h1>Progressi</h1>
      <Scelte valori={['storico', 'piano']} valore={scheda ?? 'storico'} onCambia={(v) => vai(v === 'piano' ? '/progressi/piano' : '/progressi')} etichette={{ storico: 'Storico', piano: 'Piano' }} />

      {b ? (
        <div class="griglia3">
          <div class="stat"><div class="valore">{fatte}</div><div class="nome">sedute fatte</div></div>
          <div class="stat"><div class="valore">{b.sedute.length - fatte}</div><div class="nome">da fare</div></div>
          <div class="stat"><div class="valore">{tonnTot >= 10000 ? `${Math.round(tonnTot / 1000)}t` : tonnTot.toLocaleString('it-IT')}</div><div class="nome">{tonnTot >= 10000 ? 'sollevati' : 'kg sollevati'}</div></div>
        </div>
      ) : null}

      {scheda === 'piano' && b ? (
        <PianoEsercizio b={b} esercizioId={esercizioId} />
      ) : scelto ? (
        <div class="carta">
          <div class="riga spazio">
            <h2 style="text-transform:none">{trovaEsercizio(scelto, p?.esercizi_personalizzati)?.nome}</h2>
            <button class="bottone piccolo" onClick={() => vai('/progressi')}>Tutti</button>
          </div>
          <Scelte valori={['kg', 'volume', 'rm1'] as Metrica[]} valore={metrica} onCambia={setMetrica} etichette={NOMI_METRICA} />
          <div class="piccolo">
            {metrica === 'kg' ? 'Carico della serie migliore per seduta' : metrica === 'volume' ? 'Volume per seduta: somma di kg × ripetizioni' : 'Massimale stimato dalla serie migliore (Brzycki)'}
          </div>
          <Grafico punti={punti.map((x) => ({ y: x[metrica], etichetta: x.etichetta }))} unita={metrica === 'volume' ? '' : ' kg'} />
          <table class="tabella">
            <thead><tr><th>Data</th><th>Seduta</th><th>Serie</th><th class="num">Volume</th></tr></thead>
            <tbody>
              {[...punti].reverse().map((x) => (
                <tr><td>{formatoData(x.data)}</td><td class="piccolo">{x.etichetta}</td><td class="piccolo">{x.serie}</td><td class="num">{x.volume.toLocaleString('it-IT')}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div class="carta">
            <h2>Esercizi</h2>
            {ids.length === 0 ? <p class="muto">Ancora nessuna serie registrata. Lo storico compare dopo la prima seduta completata.</p> : null}
            {ids.map((id) => {
              const arr = storico.get(id)!;
              const ultimo = arr[arr.length - 1];
              const primo = arr[0];
              const delta = Math.round((ultimo.kg - primo.kg) * 2) / 2;
              const def = trovaEsercizio(id, p?.esercizi_personalizzati);
              return (
                <div class="esercizio-riga" onClick={() => vai(`/progressi/${id}`)}>
                  <div class="cresce">
                    <div class="nome">{def?.nome ?? id}</div>
                    <div class="dettaglio"><span>{def ? NOMI_GRUPPI[def.gruppo] : ''}</span><span>{arr.length} sedute</span><span>vol. {ultimo.volume.toLocaleString('it-IT')}</span></div>
                  </div>
                  <div class="colonna" style="align-items:flex-end;gap:2px">
                    <b>{formatoKg(ultimo.kg)} × {ultimo.rip}</b>
                    {arr.length > 1 ? <span class={`badge ${delta >= 0 ? 'verde' : 'giallo'}`}>{delta >= 0 ? '+' : ''}{delta} kg</span> : null}
                  </div>
                </div>
              );
            })}
          </div>

          {sedute.length ? (
            <div class="carta">
              <h2>Andamento delle sedute</h2>
              <div class="piccolo">Tonnellaggio per seduta: tutti i kg sollevati (kg × ripetizioni di ogni serie fatta)</div>
              <Grafico punti={sedute.map((x) => ({ y: x.tonnellaggio, etichetta: x.seduta.nome }))} unita="" />
              {conDurata.length >= 2 ? (
                <>
                  <div class="piccolo spazio-sopra">Densità: kg sollevati al minuto (a parità di tempo, più alto = più lavoro)</div>
                  <Grafico punti={conDurata.map((x) => ({ y: x.kgMin!, etichetta: x.seduta.nome }))} unita="" />
                </>
              ) : null}
              <table class="tabella">
                <thead><tr><th>Seduta</th><th class="num">Serie</th><th class="num">kg tot.</th><th class="num">Min</th><th class="num">kg/min</th></tr></thead>
                <tbody>
                  {[...sedute].reverse().slice(0, 12).map((x) => (
                    <tr>
                      <td>{x.seduta.nome} <span class="piccolo">{formatoData(x.data)}</span></td>
                      <td class="num">{x.serie}</td>
                      <td class="num">{x.tonnellaggio.toLocaleString('it-IT')}</td>
                      <td class="num">{x.durataMin ?? '—'}</td>
                      <td class="num">{x.kgMin ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {perCiclo.length >= 2 ? (
            <div class="carta">
              <h2>Volume per ciclo</h2>
              <div class="piccolo">Serie fatte in ogni ciclo (≈ settimana) del blocco {b?.numero}</div>
              <Grafico punti={perCiclo.map((x) => ({ y: x.serie, etichetta: x.etichetta }))} unita="" />
              <div class="piccolo spazio-sopra">Tonnellaggio per ciclo</div>
              <Grafico punti={perCiclo.map((x) => ({ y: x.tonnellaggio, etichetta: x.etichetta }))} unita="" />
            </div>
          ) : null}
        </>
      )}

      {massimali.length ? (
        <div class="carta">
          <h2>Massimali per blocco</h2>
          <p class="piccolo">Il massimale stimato non è un carico di allenamento: misura la crescita tra un blocco e l'altro e dà le percentuali degli RM.</p>
          {massimali.map((m) => (
            <div class="colonna" style="gap:6px;padding:8px 0;border-top:1px solid var(--bordo)">
              <div class="riga spazio">
                <h3>{m.nome}</h3>
                {m.delta !== null ? <span class={`badge ${m.delta >= 0 ? 'verde' : 'giallo'}`}>{m.delta >= 0 ? '+' : ''}{m.delta} kg · {m.deltaPct >= 0 ? '+' : ''}{m.deltaPct}%</span> : <span class="piccolo">primo test</span>}
              </div>
              <div class="riga" style="flex-wrap:wrap;gap:6px">
                {m.punti.map((x) => <span class="chip" style={x.corrente ? 'border:1px solid var(--accento);color:var(--testo)' : ''}>B{x.blocco} · {x.rm1} kg</span>)}
              </div>
              {m.punti.length > 1 ? <Grafico punti={m.punti.map((x) => ({ y: x.rm1, etichetta: `B${x.blocco}` }))} unita=" kg" /> : null}
            </div>
          ))}
        </div>
      ) : null}

      {b && Object.keys(b.test).length ? (
        <div class="carta">
          <h2>Test del blocco {b.numero}</h2>
          <table class="tabella">
            <thead><tr><th>Esercizio</th><th class="num">Test</th><th class="num">1RM</th></tr></thead>
            <tbody>
              {Object.values(b.test).sort((x, y) => (trovaEsercizio(x.esercizio_id)?.nome ?? '').localeCompare(trovaEsercizio(y.esercizio_id)?.nome ?? '')).map((t) => (
                <tr><td>{trovaEsercizio(t.esercizio_id, p?.esercizi_personalizzati)?.nome ?? t.esercizio_id}</td><td class="num">{t.modo === 'stima' ? `1@${t.rm1}` : `${t.rip}@${t.kg}`}</td><td class="num">{t.rm1 ?? '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {checkin.filter((c) => c.peso).length ? (
        <div class="carta">
          <h2>Peso corporeo</h2>
          <Grafico punti={checkin.filter((c) => c.peso).map((c) => ({ y: c.peso!, etichetta: formatoData(c.data) }))} unita=" kg" decimali={1} />
        </div>
      ) : null}
    </div>
  );
}
