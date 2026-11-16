import type { Programma, RegistroSeduta } from '../../tipi';
import { ESERCIZI_PER_ID } from '../../data/esercizi';
import { programma, stato } from '../../store/stato';
import { Testata, formatoData, formatoKg } from '../componenti/comuni';
import { IconaEsercizio } from '../componenti/IconaEsercizio';
import { GraficoLinea } from '../componenti/Grafico';
import { vai } from '../router';

// Progressi: massimali dei fondamentali, e per ogni esercizio il carico migliore di ogni seduta (con le ripetizioni).

interface Punto {
  data: string;
  kg: number;
  rip: number;
  serie: number;
  tonnellaggio: number;
}

function storico(programmi: Programma[], registro: Record<string, RegistroSeduta>): Map<string, Punto[]> {
  const out = new Map<string, Punto[]>();
  for (const pr of programmi) {
    for (const s of pr.sedute) {
      if (s.stato !== 'completata' || s.fase === 'test') continue;
      const reg = registro[s.id];
      if (!reg) continue;
      for (const v of Object.values(reg.voci)) {
        const fatte = v.serie.filter((x) => x.fatta);
        if (!fatte.length) continue;
        const kgs = fatte.map((x) => x.kg ?? x.kg_prev);
        const kg = Math.max(...kgs);
        const migliore = fatte.find((x) => (x.kg ?? x.kg_prev) === kg)!;
        const p: Punto = { data: s.data ?? reg.iniziata, kg, rip: migliore.rip ?? migliore.rip_prev, serie: fatte.length, tonnellaggio: fatte.reduce((a, x) => a + (x.kg ?? x.kg_prev) * (x.rip ?? x.rip_prev), 0) };
        out.set(v.esercizio_id, [...(out.get(v.esercizio_id) ?? []), p]);
      }
    }
  }
  for (const v of out.values()) v.sort((a, b) => a.data.localeCompare(b.data));
  return out;
}

export function Progressi({ esercizioId }: { esercizioId?: string }) {
  void stato.value;
  const pr = programma.value;
  if (!pr) return null;
  const tutti = [...stato.value.programmiPassati, pr];
  const st = storico(tutti, stato.value.registro);
  const fondamentali = ['squat', 'stacco', 'hip_thrust'];

  if (esercizioId) {
    const def = ESERCIZI_PER_ID[esercizioId];
    const punti = st.get(esercizioId) ?? [];
    const conKg = punti.some((p) => p.kg > 0);
    return (
      <div class="pagina">
        <Testata sopratitolo="Progressi" />
        <div class="riga" style="gap:10px"><IconaEsercizio def={def} /><h1 style="font-size:30px">{def?.nome ?? esercizioId}</h1></div>
        {punti.length >= 2 ? (
          <div class="carta compatta">
            <h3>{conKg ? 'Carico migliore per seduta' : 'Ripetizioni migliori per seduta'}</h3>
            <GraficoLinea punti={punti.map((p) => ({ x: p.data, y: conKg ? p.kg : p.rip }))} unita={conKg ? 'kg' : 'rip'} />
          </div>
        ) : <p class="muto">Servono almeno due sedute completate per il grafico.</p>}
        <div class="carta">
          <table class="tabella">
            <thead><tr><th>Data</th><th class="num">Migliore</th><th class="num">Serie</th><th class="num">Volume</th></tr></thead>
            <tbody>
              {[...punti].reverse().map((p) => (
                <tr><td>{formatoData(p.data)}</td><td class="num">{conKg ? `${formatoKg(p.kg)} × ${p.rip}` : `${p.rip}`}</td><td class="num">{p.serie}</td><td class="num">{conKg ? `${Math.round(p.tonnellaggio)} kg` : '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const esercizi = [...st.keys()].sort((a, b) => (ESERCIZI_PER_ID[a]?.gruppo === 'glutei' ? 0 : 1) - (ESERCIZI_PER_ID[b]?.gruppo === 'glutei' ? 0 : 1) || (ESERCIZI_PER_ID[a]?.nome ?? a).localeCompare(ESERCIZI_PER_ID[b]?.nome ?? b));
  const completate = tutti.reduce((a, p) => a + p.sedute.filter((s) => s.stato === 'completata' && s.fase !== 'test').length, 0);

  return (
    <div class="pagina">
      <Testata senzaIndietro />
      <h1>Progressi</h1>
      <div class="griglia3">
        <div class="stat"><div class="valore">{completate}</div><div class="nome">sedute fatte</div></div>
        <div class="stat"><div class="valore">{esercizi.length}</div><div class="nome">esercizi</div></div>
        <div class="stat"><div class="valore">{tutti.length}</div><div class="nome">{tutti.length === 1 ? 'programma' : 'programmi'}</div></div>
      </div>

      <div class="carta">
        <h2>Massimali</h2>
        <table class="tabella">
          <thead><tr><th>Esercizio</th><th class="num">Test</th><th class="num">Oggi</th></tr></thead>
          <tbody>
            {fondamentali.map((id) => {
              const t = pr.test[id];
              const primo = tutti.map((p) => p.test[id]).find(Boolean);
              return <tr><td>{ESERCIZI_PER_ID[id].nome}</td><td class="num">{primo ? formatoKg(primo.rm1_test ?? primo.rm1) : '—'}</td><td class="num">{t ? formatoKg(t.rm1) : '—'}</td></tr>;
            })}
          </tbody>
        </table>
        <p class="piccolo">"Oggi" sale da solo quando in seduta sollevi più del previsto con tutte le ripetizioni; si rimisura a ogni nuovo test.</p>
      </div>

      <div class="carta">
        <h2>Esercizi</h2>
        {esercizi.length === 0 ? <p class="muto">Ancora nessuna seduta completata.</p> : null}
        {esercizi.map((id) => {
          const punti = st.get(id)!;
          const ultimo = punti[punti.length - 1];
          const primo = punti[0];
          const conKg = ultimo.kg > 0;
          return (
            <button type="button" class="riga spazio" style="background:none;border:0;border-top:1px solid var(--filo);padding:10px 0;color:inherit;text-align:left;cursor:pointer;width:100%" onClick={() => vai(`/progressi/${id}`)}>
              <span class="riga" style="gap:10px"><IconaEsercizio id={id} piccola /><span>{ESERCIZI_PER_ID[id]?.nome ?? id}</span></span>
              <span class="piccolo">{conKg ? `${formatoKg(ultimo.kg)} × ${ultimo.rip}` : `${ultimo.rip}`}{punti.length > 1 && conKg ? ` · ${ultimo.kg >= primo.kg ? '+' : ''}${Math.round((ultimo.kg - primo.kg) * 10) / 10} kg` : ''}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
