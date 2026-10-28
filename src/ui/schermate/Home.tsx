import { useState } from 'preact/hooks';
import type { Fase, Seduta } from '../../tipi';
import { FASI_BLOCCO, FASI_BLOCCO_BREVE, NOMI_FASI, RIENTRO } from '../../data/tabelle';
import { blocco, profilo, prossimaSeduta, giorniDallUltimaSeduta, impostazioni } from '../../store/stato';
import { durataStimata, minuti, serieRip } from '../../motore/prescrizione';
import { Avviso, formatoData } from '../componenti/comuni';
import { vai } from '../router';

function BarraFasi({ sedute, bloccoBreve }: { sedute: Seduta[]; bloccoBreve: boolean }) {
  const fasi = bloccoBreve ? FASI_BLOCCO_BREVE : FASI_BLOCCO;
  const corrente = sedute.find((s) => s.stato !== 'completata')?.fase;
  return (
    <div class="barra-fasi">
      {fasi.map((f) => {
        const tot = sedute.filter((s) => s.fase === f.fase).length;
        const fatte = sedute.filter((s) => s.fase === f.fase && s.stato === 'completata').length;
        return (
          <div class={`fase ${f.fase === corrente ? 'corrente' : ''}`}>
            <div class="traccia"><div class="riempita" style={`width:${tot ? (fatte / tot) * 100 : 0}%`} /></div>
            <span>{f.nome}</span>
          </div>
        );
      })}
    </div>
  );
}

function durataSeduta(s: Seduta): number {
  if (s.fase === 'test') return 0;
  return durataStimata(s.esercizi.map((e) => ({ ruolo: e.ruolo, serie: serieRip(e.ruolo, s.fase as Exclude<Fase, 'test'>, s.cicloFase, e)[0], superserie: e.superserie })), impostazioni.value.recuperi);
}

export function Home() {
  const b = blocco.value;
  const p = profilo.value;
  const prossima = prossimaSeduta.value;
  const [faseAperta, setFaseAperta] = useState<Fase | null>(null);
  if (!b || !p) return null;

  const fatte = b.sedute.filter((s) => s.stato === 'completata').length;
  const giorni = giorniDallUltimaSeduta.value;
  const rientro = giorni !== null && giorni > 10 ? RIENTRO.find((r) => giorni <= r.maxGiorni) : undefined;
  const fasi = (b.parametri.bloccoBreve ? FASI_BLOCCO_BREVE : FASI_BLOCCO).map((f) => f.fase);
  const apertaDefault = prossima?.fase ?? fasi[fasi.length - 1];
  const aperta = faseAperta ?? apertaDefault;

  return (
    <div class="pagina">
      <div class="colonna" style="gap:8px;margin-top:8px">
        <div class="sopratitolo">Blocco {b.numero} · {p.nome}</div>
        <h1>{b.stato === 'completato' ? 'Blocco completato' : b.stato === 'test' ? 'Settimana di test' : NOMI_FASI[prossima?.fase ?? 'fase1']}</h1>
        <p class="muto">{fatte} di {b.sedute.length} sedute completate</p>
        <BarraFasi sedute={b.sedute} bloccoBreve={b.parametri.bloccoBreve} />
      </div>

      {rientro ? <Avviso>Sono passati {giorni} giorni dall'ultima seduta. {rientro.testo}</Avviso> : null}
      {b.parametriInAttesa ? <Avviso tipo="info">Nuovi parametri in attesa: si applicano dal prossimo ciclo.</Avviso> : null}

      {b.stato === 'test' && prossima ? (
        <Avviso tipo="info">
          Prima settimana: si testano i carichi di tutti gli esercizi del blocco. Fondamentali con la stima del massimale (reps e carico di una prova, consigliate 3–5 rip); gli altri con una serie unica a 10, 12 o 14 ripetizioni a cedimento. Da questi valori l'app calcola tutti i carichi del blocco.
        </Avviso>
      ) : null}
      {b.stato === 'in_corso' && prossima && prossima.fase === 'fase1' && prossima.cicloFase === 1 && prossima.giorno === 1 && prossima.stato === 'futura' ? (
        <Avviso tipo="info">Fase di test completata al 100%. I carichi delle sedute sono pronti: puoi iniziare la Fase 1.</Avviso>
      ) : null}

      {prossima ? (
        <div class="carta" style="border-color:var(--accento)">
          <div class="sopratitolo">{prossima.stato === 'in_corso' ? 'In corso' : 'Prossima seduta'}</div>
          <div class="riga spazio">
            <div class="colonna" style="gap:2px">
              <h2 style="font-size:28px">{prossima.nome}</h2>
              <span class="muto">{prossima.etichetta}</span>
            </div>
          </div>
          <div class="riga" style="gap:16px">
            <span class="chip">{NOMI_FASI[prossima.fase]} · ciclo {prossima.cicloFase}</span>
            <span class="chip">{prossima.esercizi.length} esercizi</span>
            {prossima.fase !== 'test' ? <span class="chip">≈ {minuti(durataSeduta(prossima))}′</span> : null}
          </div>
          <button class="bottone primario pieno" onClick={() => vai(`/seduta/${prossima.id}`)}>
            {prossima.stato === 'in_corso' ? 'Continua' : 'Apri la seduta'}
          </button>
        </div>
      ) : (
        <div class="carta">
          <h2>Tutto fatto</h2>
          <p class="muto">Hai completato il blocco. Prima del prossimo si rifà la settimana di test: la trovi nelle Impostazioni → Nuovo blocco.</p>
          <button class="bottone primario pieno" onClick={() => vai('/impostazioni/blocco')}>Avvia il blocco {b.numero + 1}</button>
        </div>
      )}

      <div class="colonna" style="gap:10px">
        <h2>Percorso</h2>
        {fasi.map((f) => {
          const sedute = b.sedute.filter((s) => s.fase === f);
          const n = sedute.filter((s) => s.stato === 'completata').length;
          const apertaQui = aperta === f;
          return (
            <div class="colonna" style="gap:8px">
              <button class="riga spazio" style="background:none;border:0;padding:6px 0;cursor:pointer;text-align:left" onClick={() => setFaseAperta(apertaQui ? ('nessuna' as Fase) : f)}>
                <h3>{NOMI_FASI[f]}</h3>
                <span class="piccolo">{n}/{sedute.length} {apertaQui ? '▲' : '▼'}</span>
              </button>
              {apertaQui ? (
                <div class="lista-sedute">
                  {sedute.map((s) => {
                    const eProssima = prossima?.id === s.id;
                    const futura = s.stato === 'futura' && !eProssima;
                    return (
                      <div class={`seduta-riga ${eProssima ? 'prossima' : ''} ${futura ? 'futura' : ''}`} onClick={() => vai(`/seduta/${s.id}`)}>
                        <span class={`spunta ${s.stato === 'completata' ? 'fatta' : s.stato === 'in_corso' ? 'parziale' : ''}`}>{s.stato === 'completata' ? '✓' : s.stato === 'in_corso' ? '…' : ''}</span>
                        <div class="cresce">
                          <div style="font-weight:600">{s.nome} <span class="piccolo">· ciclo {s.cicloFase}</span></div>
                          <div class="piccolo">{s.etichetta}</div>
                        </div>
                        <span class="piccolo">{s.stato === 'completata' ? formatoData(s.data) : futura ? '🔒' : ''}</span>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
