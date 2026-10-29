import { useState } from 'preact/hooks';
import type { Fase, Seduta } from '../../tipi';
import { RIENTRO } from '../../data/tabelle';
import { NOMI_GRUPPI } from '../../data/esercizi';
import { blocco, profilo, prossimaSeduta, giorniDallUltimaSeduta, impostazioni, prescrizioneDi, stato } from '../../store/stato';
import { durataStimata, minuti, rigaDi, serieRip } from '../../motore/prescrizione';
import { Avviso, formatoData } from '../componenti/comuni';
import { Icona } from '../componenti/IconaEsercizio';
import { consigli } from '../consigli';
import { NOMI_MODULO, NOMI_OBIETTIVO } from './Setup';
import { infoCiclo } from '../etichette';
import { vai } from '../router';

// Percorso (SPEC_PIANIFICATORE v2 §11c "A · Pulita" + griglia dei cicli): barra alta, testata per modulo,
// contatore completate/totali, griglia dei cicli, blocco "Prossima seduta", elenco "Questo ciclo".

function durataSeduta(s: Seduta): number {
  if (s.fase === 'test') return 0;
  return durataStimata(s.esercizi.map((e) => ({ ruolo: e.ruolo, serie: serieRip(e.ruolo, s.fase as Exclude<Fase, 'test'>, rigaDi(s), e)[0], superserie: e.superserie })), impostazioni.value.recuperi);
}

function serieSeduta(s: Seduta): number {
  if (s.fase === 'test') return 0;
  return s.esercizi.reduce((a, e) => a + prescrizioneDi(e, s).serie, 0);
}

/** Gruppi muscolari della seduta, nell'ordine di comparsa. */
function gruppiSeduta(s: Seduta): string {
  const g: string[] = [];
  for (const e of s.esercizi) if (!g.includes(e.gruppo)) g.push(e.gruppo);
  return g.map((x) => NOMI_GRUPPI[x]).join(' · ');
}

/** Griglia dei cicli: una riga per ciclo, una cella per seduta (§11c punto 4). */
function GrigliaCicli({ sedute, prossimaId, cicloCorrente, soloCorrente }: { sedute: Seduta[]; prossimaId?: string; cicloCorrente?: number; soloCorrente: boolean }) {
  const cicli = [...new Set(sedute.map((s) => s.ciclo))].sort((a, b) => a - b);
  const lavoro = cicli.filter((c) => sedute.find((s) => s.ciclo === c)?.fase !== 'test');
  const righe = soloCorrente ? cicli.filter((c) => c === cicloCorrente) : cicli;
  return (
    <div class="griglia-cicli">
      {righe.map((c) => {
        const del = sedute.filter((s) => s.ciclo === c);
        const test = del[0].fase === 'test';
        const scarico = del[0].fase === 'scarico';
        const etichetta = test ? 'Test' : scarico ? 'Scar.' : `C${lavoro.indexOf(c) + 1}`;
        return (
          <div class={`riga-ciclo ${c === cicloCorrente ? 'corrente' : ''}`}>
            <span class="etichetta-ciclo">{etichetta}</span>
            <div class="celle" style={`grid-template-columns:repeat(${del.length}, 1fr)`}>
              {del.map((s) => (
                <button
                  type="button"
                  class={`cella-seduta ${s.stato === 'completata' ? 'fatta' : s.stato === 'in_corso' ? 'in-corso' : s.id === prossimaId ? 'prossima' : ''} ${scarico ? 'scarico' : ''}`}
                  aria-label={`${s.nome}, ${s.stato === 'completata' ? 'fatta' : s.id === prossimaId ? 'prossima' : 'anteprima'}`}
                  onClick={() => vai(`/seduta/${s.id}`)}
                >
                  {s.giorno}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Home() {
  const b = blocco.value;
  const p = profilo.value;
  const prossima = prossimaSeduta.value;
  const [tuttoIlPiano, setTuttoIlPiano] = useState(false);
  if (!b || !p) return null;

  const fatte = b.sedute.filter((s) => s.stato === 'completata').length;
  const giorni = giorniDallUltimaSeduta.value;
  const rientro = giorni !== null && giorni > 10 ? RIENTRO.find((r) => giorni <= r.maxGiorni) : undefined;
  const preservazione = b.modulo === 'preservazione';
  const listaConsigli = consigli(stato.value);
  const info = prossima ? infoCiclo(b, prossima) : infoCiclo(b, b.sedute[b.sedute.length - 1]);
  const titolo = b.stato === 'completato' ? (preservazione ? 'Programma completato' : 'Blocco completato') : info.titolo;
  const prova = Boolean(impostazioni.value.modalita_prova);
  const nCicli = [...new Set(b.sedute.map((s) => s.ciclo))].length;
  const cicloCorrente = prossima?.ciclo ?? b.sedute[b.sedute.length - 1]?.ciclo;
  const soloCorrente = nCicli > 8 && !tuttoIlPiano;
  const seduteCiclo = b.sedute.filter((s) => s.ciclo === cicloCorrente);
  const obiettivo = p.obiettivoAttivo ? NOMI_OBIETTIVO[p.obiettivoAttivo.tipo] : undefined;
  const oggi = new Date().toISOString().slice(0, 10);

  return (
    <div class="pagina">
      <div class="barra-alta">
        <span class="marchio">Frappaula Fit</span>
        <div class="riga" style="gap:8px">
          {prova ? <span class="pastiglia">Prova</span> : null}
          <button class="icona-bottone" aria-label="Impostazioni" onClick={() => vai('/impostazioni')}><Icona nome="impostazioni" dimensione={22} /></button>
        </div>
      </div>

      <div class="colonna" style="gap:10px">
        <div class="eyebrow">{info.eyebrow}</div>
        <h1 class="titolo-percorso">{titolo}</h1>
        <p class="muto">{obiettivo ? `${obiettivo} · ` : ''}{NOMI_MODULO[b.modulo ?? 'ipertrofia']} · {b.parametri.N} sedute per ciclo</p>
      </div>

      <div class="colonna" style="gap:8px">
        <div class="riga" style="gap:10px;align-items:baseline">
          <span class="contatore-grande">{fatte} / {b.sedute.length}</span>
          <span class="muto">sedute completate</span>
        </div>
        {soloCorrente ? <div class="progresso sottile"><div style={`width:${b.sedute.length ? (fatte / b.sedute.length) * 100 : 0}%`} /></div> : null}
        <GrigliaCicli sedute={b.sedute} prossimaId={prossima?.id} cicloCorrente={cicloCorrente} soloCorrente={soloCorrente} />
        {nCicli > 8 ? (
          <button type="button" class="bottone fantasma piccolo" style="align-self:flex-start" onClick={() => setTuttoIlPiano(!tuttoIlPiano)}>{tuttoIlPiano ? 'Solo il ciclo corrente' : 'Tutto il piano'}</button>
        ) : null}
      </div>

      {rientro ? <Avviso>Sono passati {giorni} giorni dall'ultima seduta. {rientro.testo}</Avviso> : null}
      {p.obiettivoInAttesa ? <Avviso tipo="info">Cambio di obiettivo in attesa: parte alla fine del ciclo in corso.</Avviso> : null}
      {listaConsigli.map((c) => <Avviso tipo={c.livello === 'info' ? 'info' : undefined}><b>Coach:</b> {c.testo} <span class="piccolo">{c.perche}</span></Avviso>)}
      {b.parametriInAttesa ? <Avviso tipo="info">Nuovi parametri in attesa: si applicano dal prossimo ciclo.</Avviso> : null}
      {b.stato === 'test' && prossima ? (
        <Avviso tipo="info">
          Prima settimana: si testano i carichi di tutti gli esercizi del programma. Fondamentali con la stima del massimale (reps e carico di una prova, consigliate 3–5 ripetizioni); gli altri con una serie unica a 10, 12 o 14 ripetizioni a cedimento. Da questi valori l'app calcola tutti i carichi.
        </Avviso>
      ) : null}
      {b.stato === 'in_corso' && prossima && prossima.fase === 'fase1' && prossima.cicloFase === 1 && prossima.giorno === 1 && prossima.stato === 'futura' ? (
        <Avviso tipo="info">Test completati. I carichi delle sedute sono pronti: si comincia.</Avviso>
      ) : null}

      {prossima ? (
        <div class="prossima-seduta">
          <div class="eyebrow">{prossima.stato === 'in_corso' ? 'In corso' : 'Prossima seduta'}</div>
          <h2>{prossima.nome}</h2>
          <div class="meta">{gruppiSeduta(prossima)}</div>
          {prossima.fase !== 'test' ? <div class="meta">{serieSeduta(prossima)} serie · circa {minuti(durataSeduta(prossima))} min</div> : <div class="meta">{prossima.esercizi.length} esercizi da testare</div>}
          <button class="bottone scuro pieno" onClick={() => vai(`/seduta/${prossima.id}`)}>
            {prossima.stato === 'in_corso' ? 'Continua la seduta' : prossima.fase === 'test' ? 'Apri la seduta di test' : 'Inizia seduta'}
          </button>
        </div>
      ) : (
        <div class="carta">
          <h2>Tutto fatto</h2>
          <p class="muto">Hai completato il programma. Prima del prossimo blocco si rifà la settimana di test: la trovi in Impostazioni → Blocco.</p>
          <button class="bottone primario pieno" onClick={() => vai('/impostazioni/blocco')}>Avvia il blocco {b.numero + 1}</button>
        </div>
      )}

      <div class="colonna" style="gap:4px">
        <div class="sezione-titolo">
          <h2>{prossima?.fase === 'test' ? 'Settimana di test' : 'Questo ciclo'}</h2>
          <span class="piccolo">{seduteCiclo.filter((s) => s.stato === 'completata').length}/{seduteCiclo.length}</span>
        </div>
        <div class="lista-sedute">
          {seduteCiclo.map((s) => {
            const eProssima = prossima?.id === s.id;
            const futura = s.stato === 'futura' && !eProssima;
            return (
              <div class="seduta-riga" onClick={() => vai(`/seduta/${s.id}`)}>
                <span class={`spunta ${s.stato === 'completata' ? 'fatta' : s.stato === 'in_corso' ? 'parziale' : eProssima ? 'prossima' : ''}`}>
                  {s.stato === 'completata' ? <Icona nome="spunta" dimensione={16} /> : s.stato === 'in_corso' ? '…' : null}
                </span>
                <div class="cresce">
                  <div class="nome-seduta">{s.nome}</div>
                  <div class="piccolo">{s.etichetta}</div>
                </div>
                <span class="piccolo">{s.stato === 'completata' ? formatoData(s.data) : s.stato === 'in_corso' ? 'In corso' : futura ? 'Anteprima' : s.data?.slice(0, 10) === oggi ? 'Oggi' : 'Prossima'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
