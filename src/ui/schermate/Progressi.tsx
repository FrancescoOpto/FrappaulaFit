import { useMemo } from 'preact/hooks';
import { esercizio as trovaEsercizio, NOMI_GRUPPI } from '../../data/esercizi';
import { NOMI_FASI } from '../../data/tabelle';
import { rm1DaTest } from '../../motore/carichi';
import { blocco, profilo, stato } from '../../store/stato';
import { Testata, formatoData, formatoKg } from '../componenti/comuni';
import { vai } from '../router';

interface Punto {
  data: string;
  etichetta: string;
  kg: number;
  rip: number;
  rm1: number;
  serie: string;
}

function Grafico({ punti, unita }: { punti: { x: number; y: number; etichetta: string }[]; unita: string }) {
  if (punti.length < 2) return <p class="piccolo">Servono almeno due rilevazioni per il grafico.</p>;
  const W = 320, H = 120, pad = 24;
  const ys = punti.map((p) => p.y);
  const min = Math.min(...ys), max = Math.max(...ys);
  const sy = (v: number) => (max === min ? H / 2 : H - pad - ((v - min) / (max - min)) * (H - 2 * pad));
  const sx = (i: number) => pad + (i / (punti.length - 1)) * (W - 2 * pad);
  const d = punti.map((p, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
  return (
    <svg class="grafico" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Andamento">
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--bordo)" />
      <path d={d} fill="none" stroke="var(--accento)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      {punti.map((p, i) => (
        <g>
          <circle cx={sx(i)} cy={sy(p.y)} r="3.5" fill="var(--accento)" />
          {i === 0 || i === punti.length - 1 || p.y === max ? <text x={sx(i)} y={sy(p.y) - 8} font-size="10" fill="var(--testo2)" text-anchor="middle">{p.y}{unita}</text> : null}
        </g>
      ))}
    </svg>
  );
}

export function Progressi({ esercizioId }: { esercizioId?: string }) {
  void stato.value;
  const b = blocco.value;
  const p = profilo.value;
  const registro = stato.value.registro;
  const checkin = stato.value.checkin;

  const storico = useMemo(() => {
    const m = new Map<string, Punto[]>();
    const blocchi = [...stato.value.blocchiPassati, ...(b ? [b] : [])];
    for (const bl of blocchi) {
      for (const s of bl.sedute) {
        if (s.stato !== 'completata' || s.fase === 'test') continue;
        const reg = registro[s.id];
        if (!reg) continue;
        for (const es of Object.values(reg.esercizi)) {
          const fatte = es.serie.filter((x) => x.fatta && !x.stripping);
          if (!fatte.length) continue;
          const top = fatte.reduce((a, x) => ((x.kg ?? x.kg_prev) > (a.kg ?? a.kg_prev) ? x : a), fatte[0]);
          const kg = top.kg ?? top.kg_prev;
          const rip = top.rip ?? top.rip_prev;
          const arr = m.get(es.esercizio_id) ?? [];
          arr.push({
            data: s.data ?? reg.iniziata,
            etichetta: `B${bl.numero} · ${NOMI_FASI[s.fase]} c${s.cicloFase}`,
            kg,
            rip,
            rm1: kg > 0 && rip > 0 && rip < 37 ? Math.round(rm1DaTest(kg, rip) * 2) / 2 : 0,
            serie: fatte.map((x) => `${x.kg ?? x.kg_prev}×${x.rip ?? x.rip_prev}`).join(' · '),
          });
          m.set(es.esercizio_id, arr);
        }
      }
    }
    for (const arr of m.values()) arr.sort((a, c) => a.data.localeCompare(c.data));
    return m;
  }, [registro, b]);

  const ids = [...storico.keys()].sort((a, c) => (trovaEsercizio(a, p?.esercizi_personalizzati)?.nome ?? a).localeCompare(trovaEsercizio(c, p?.esercizi_personalizzati)?.nome ?? c));
  const scelto = esercizioId && storico.has(esercizioId) ? esercizioId : undefined;
  const punti = scelto ? storico.get(scelto)! : [];
  const fatte = b?.sedute.filter((s) => s.stato === 'completata').length ?? 0;

  return (
    <div class="pagina">
      <Testata senzaIndietro />
      <h1>Progressi</h1>

      {b ? (
        <div class="griglia3">
          <div class="stat"><div class="valore">{fatte}</div><div class="nome">sedute fatte</div></div>
          <div class="stat"><div class="valore">{b.sedute.length - fatte}</div><div class="nome">da fare</div></div>
          <div class="stat"><div class="valore">{Object.keys(b.test).length}</div><div class="nome">test inseriti</div></div>
        </div>
      ) : null}

      {scelto ? (
        <div class="carta">
          <div class="riga spazio">
            <h2 style="text-transform:none">{trovaEsercizio(scelto, p?.esercizi_personalizzati)?.nome}</h2>
            <button class="bottone piccolo" onClick={() => vai('/progressi')}>Tutti</button>
          </div>
          <div class="piccolo">Carico della serie migliore per seduta</div>
          <Grafico punti={punti.map((x) => ({ x: 0, y: x.kg, etichetta: x.etichetta }))} unita="" />
          <table class="tabella">
            <thead><tr><th>Data</th><th>Seduta</th><th>Serie</th><th class="num">1RM st.</th></tr></thead>
            <tbody>
              {[...punti].reverse().map((x) => (
                <tr><td>{formatoData(x.data)}</td><td class="piccolo">{x.etichetta}</td><td class="piccolo">{x.serie}</td><td class="num">{x.rm1 || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div class="carta">
          <h2>Esercizi</h2>
          {ids.length === 0 ? <p class="muto">Ancora nessuna serie registrata. Lo storico compare dopo la prima seduta completata.</p> : null}
          {ids.map((id) => {
            const arr = storico.get(id)!;
            const ultimo = arr[arr.length - 1];
            const primo = arr[0];
            const delta = ultimo.kg - primo.kg;
            const def = trovaEsercizio(id, p?.esercizi_personalizzati);
            return (
              <div class="esercizio-riga" onClick={() => vai(`/progressi/${id}`)}>
                <div class="cresce">
                  <div class="nome">{def?.nome ?? id}</div>
                  <div class="dettaglio"><span>{def ? NOMI_GRUPPI[def.gruppo] : ''}</span><span>{arr.length} sedute</span></div>
                </div>
                <div class="colonna" style="align-items:flex-end;gap:2px">
                  <b>{formatoKg(ultimo.kg)} × {ultimo.rip}</b>
                  {arr.length > 1 ? <span class={`badge ${delta >= 0 ? 'verde' : 'giallo'}`}>{delta >= 0 ? '+' : ''}{delta} kg</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {b && Object.keys(b.test).length ? (
        <div class="carta">
          <h2>Test del blocco {b.numero}</h2>
          <table class="tabella">
            <thead><tr><th>Esercizio</th><th class="num">Test</th><th class="num">1RM</th></tr></thead>
            <tbody>
              {Object.values(b.test).sort((x, y) => (trovaEsercizio(x.esercizio_id)?.nome ?? '').localeCompare(trovaEsercizio(y.esercizio_id)?.nome ?? '')).map((t) => (
                <tr><td>{trovaEsercizio(t.esercizio_id, p?.esercizi_personalizzati)?.nome ?? t.esercizio_id}</td><td class="num">{t.kg}×{t.rip}</td><td class="num">{t.rm1 ? Math.round(t.rm1 * 2) / 2 : '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {checkin.filter((c) => c.peso).length ? (
        <div class="carta">
          <h2>Peso corporeo</h2>
          <Grafico punti={checkin.filter((c) => c.peso).map((c) => ({ x: 0, y: c.peso!, etichetta: c.data }))} unita="" />
        </div>
      ) : null}
    </div>
  );
}
