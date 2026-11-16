import { useState } from 'preact/hooks';
import type { Seduta } from '../../tipi';
import { giorniDallUltimaSeduta, impostazioni, pianoDi, profilo, programma, prossimaSeduta } from '../../store/stato';
import { SPIEGAZIONE_FASI } from '../../data/programma';
import { sigla } from '../../motore/calendario';
import { Avviso, formatoData } from '../componenti/comuni';
import { Icona } from '../componenti/IconaEsercizio';
import { NOMI_OBIETTIVO, infoSettimana } from '../etichette';
import { vai } from '../router';

// Percorso: obiettivo e settimana in testata, contatore delle sedute, griglia delle settimane (una riga per
// settimana, una cella per seduta A/B/C), prossima seduta e sedute della settimana.

function GrigliaSettimane({ sedute, prossimaId, corrente, soloCorrente }: { sedute: Seduta[]; prossimaId?: string; corrente?: number; soloCorrente: boolean }) {
  const settimane = [...new Set(sedute.map((s) => s.settimana))].sort((a, b) => a - b);
  const righe = soloCorrente ? settimane.filter((w) => w === corrente) : settimane;
  return (
    <div class="griglia-cicli">
      {righe.map((w) => {
        const del = sedute.filter((s) => s.settimana === w);
        const f = del[0].fase;
        const etichetta = f === 'test' ? 'Test' : f === 'scarico' ? 'Scar.' : `F${f.slice(-1)}·${del[0].settimanaFase}`;
        return (
          <div class={`riga-ciclo ${w === corrente ? 'corrente' : ''}`}>
            <span class="etichetta-ciclo">{etichetta}</span>
            <div class="celle" style={`grid-template-columns:repeat(${del.length}, 1fr)`}>
              {del.map((s) => (
                <button
                  type="button"
                  class={`cella-seduta ${s.stato === 'completata' ? 'fatta' : s.stato === 'in_corso' ? 'in-corso' : s.id === prossimaId ? 'prossima' : ''} ${f === 'scarico' ? 'scarico' : ''}`}
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
  const pr = programma.value;
  const p = profilo.value;
  const prossima = prossimaSeduta.value;
  const [tutto, setTutto] = useState(false);
  if (!pr || !p) return null;

  const fatte = pr.sedute.filter((s) => s.stato === 'completata').length;
  const ultima = pr.sedute[pr.sedute.length - 1];
  const info = infoSettimana(pr, prossima ?? ultima);
  const corrente = prossima?.settimana ?? ultima.settimana;
  const nSettimane = [...new Set(pr.sedute.map((s) => s.settimana))].length;
  const soloCorrente = nSettimane > 8 && !tutto;
  const seduteSettimana = pr.sedute.filter((s) => s.settimana === corrente);
  const giorni = giorniDallUltimaSeduta.value;
  const prova = impostazioni.value.modalita_prova;
  const oggi = new Date().toISOString().slice(0, 10);
  const pianoProssima = prossima && prossima.fase !== 'test' ? pianoDi(prossima) : undefined;
  const nuovaFase = prossima && prossima.settimanaFase === 1 && prossima.giorno === 'A' && prossima.stato === 'futura' && (prossima.fase === 'fase1' || prossima.fase === 'fase2' || prossima.fase === 'fase3');

  return (
    <div class="pagina">
      <div class="barra-alta">
        <span class="marchio">Frappaula Fit · Lei</span>
        <div class="riga" style="gap:8px">
          {prova ? <span class="pastiglia">Prova</span> : null}
          <button class="icona-bottone" aria-label="Impostazioni" onClick={() => vai('/impostazioni')}><Icona nome="impostazioni" dimensione={22} /></button>
        </div>
      </div>

      <div class="colonna" style="gap:10px">
        <div class="eyebrow">{info.eyebrow}</div>
        <h1 class="titolo-percorso">{prossima ? info.titolo : 'Programma completato'}</h1>
        <p class="muto">{pr.mesi} mesi · {sigla(pr.composizione)} · 3 sedute a settimana</p>
      </div>

      <div class="colonna" style="gap:8px">
        <div class="riga" style="gap:10px;align-items:baseline">
          <span class="contatore-grande">{fatte} / {pr.sedute.length}</span>
          <span class="muto">sedute completate</span>
        </div>
        {soloCorrente ? <div class="progresso sottile"><div style={`width:${(fatte / pr.sedute.length) * 100}%`} /></div> : null}
        <GrigliaSettimane sedute={pr.sedute} prossimaId={prossima?.id} corrente={corrente} soloCorrente={soloCorrente} />
        {nSettimane > 8 ? <button type="button" class="bottone fantasma piccolo" style="align-self:flex-start" onClick={() => setTutto(!tutto)}>{tutto ? 'Solo la settimana corrente' : 'Tutto il piano'}</button> : null}
      </div>

      {giorni !== null && giorni > 10 ? <Avviso>Sono passati {giorni} giorni dall'ultima seduta: la prima volta riprendi con un po' di margine sui carichi, poi torna al piano.</Avviso> : null}
      {pr.note.slice(-1).map((n) => <Avviso tipo="info">{n.testo}</Avviso>)}
      {prossima?.fase === 'test' ? (
        <Avviso tipo="info">
          Settimana di test: tre sedute per misurare i carichi. Squat, stacco e hip thrust con la stima del massimale (ripetizioni e carico di una prova pesante, consigliate 3–5); gli altri esercizi con una serie unica a cedimento tecnico. Da questi valori l'app calcola tutte le sedute.
        </Avviso>
      ) : null}
      {nuovaFase && prossima && prossima.fase !== 'test' && prossima.fase !== 'scarico' ? <Avviso tipo="info"><b>Inizia una fase nuova.</b> {SPIEGAZIONE_FASI[prossima.fase]}</Avviso> : null}
      {prossima?.fase === 'scarico' && prossima.giorno === 'A' && prossima.stato === 'futura' ? <Avviso tipo="info"><b>Settimana di scarico:</b> metà delle serie con i carichi della prima settimana della fase appena finita. Serve a recuperare prima di spingere di nuovo.</Avviso> : null}

      {prossima ? (
        <div class="prossima-seduta">
          <div class="eyebrow">{prossima.stato === 'in_corso' ? 'In corso' : 'Prossima seduta'}</div>
          <h2>{prossima.nome}</h2>
          <div class="meta">{prossima.etichetta}</div>
          {pianoProssima ? <div class="meta">{pianoProssima.voci.reduce((a, v) => a + v.p.serie, 0)} serie · circa {Math.round(pianoProssima.durataS / 60)} min · {pianoProssima.modo === 'pha' ? 'PHA' : 'classica'}</div> : <div class="meta">Seduta di test</div>}
          <button class="bottone scuro pieno" onClick={() => vai(`/seduta/${prossima.id}`)}>
            {prossima.stato === 'in_corso' ? 'Continua la seduta' : prossima.fase === 'test' ? 'Apri la seduta di test' : 'Apri la seduta'}
          </button>
        </div>
      ) : (
        <div class="carta">
          <h2>Tutto fatto</h2>
          <p class="muto">Hai completato il programma di {pr.mesi} mesi. Da Impostazioni → Programma ne avvii uno nuovo: con il test, oppure ripartendo dai carichi di adesso.</p>
          <button class="bottone primario pieno" onClick={() => vai('/impostazioni/programma')}>Nuovo programma</button>
        </div>
      )}

      <div class="colonna" style="gap:4px">
        <div class="sezione-titolo">
          <h2>{prossima?.fase === 'test' ? 'Sedute di test' : 'Questa settimana'}</h2>
          <span class="piccolo">{seduteSettimana.filter((s) => s.stato === 'completata').length}/{seduteSettimana.length}</span>
        </div>
        <div class="lista-sedute">
          {seduteSettimana.map((s) => {
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
      <p class="piccolo centrato">{NOMI_OBIETTIVO[pr.obiettivo]} · programma del libro "Glutei" per intermedi</p>
    </div>
  );
}
