import { useState } from 'preact/hooks';
import { aggiungiCheckin, profilo, rimuoviCheckin, stato } from '../../store/stato';
import { Avviso, Scelte, Testata, formatoData } from '../componenti/comuni';
import { Icona } from '../componenti/IconaEsercizio';
import { mediePesoSettimanali } from '../../motore/coach';

const SENSAZIONI: Record<string, string> = { 1: 'A terra', 2: 'Giù', 3: 'Normale', 4: 'Bene', 5: 'Al top' };

function oggi(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Suggerimenti legati al ciclo: solo opzionali e a basso peso (SPEC §8). */
function suggerimentoCiclo(giorno: number | undefined): string | null {
  if (!giorno) return null;
  if (giorno <= 5) return 'Giorni 1–5: se ti senti stanca, togli una serie ai complementari e tieni i fondamentali. Se stai bene, niente da cambiare.';
  if (giorno <= 14) return 'Giorni 6–14: fase in cui di solito ci si sente più forti. Nessuna modifica: è il momento di spingere sui fondamentali.';
  if (giorno <= 22) return 'Giorni 15–22: nessuna modifica prevista.';
  return 'Ultimi giorni del ciclo: se ritenzione o stanchezza pesano, va bene ridurre di 1 serie i complementari. Il peso sulla bilancia può salire temporaneamente: non è grasso.';
}

export function Checkin() {
  void stato.value;
  const p = profilo.value;
  const lista = [...stato.value.checkin].reverse();
  const [data, setData] = useState(oggi());
  const [peso, setPeso] = useState('');
  const [sensazioni, setSensazioni] = useState<number>(3);
  const [nota, setNota] = useState('');
  const [giornoCiclo, setGiornoCiclo] = useState('');
  const [vita, setVita] = useState('');
  const [braccio, setBraccio] = useState('');
  const [coscia, setCoscia] = useState('');
  const [mostraCirc, setMostraCirc] = useState(false);
  const medie = mediePesoSettimanali(stato.value.checkin).slice(-4);
  const [salvato, setSalvato] = useState(false);
  const mostraCiclo = p?.sesso === 'F';
  const sugg = mostraCiclo ? suggerimentoCiclo(parseInt(giornoCiclo, 10) || undefined) : null;

  const salva = async () => {
    const pz = parseFloat(peso.replace(',', '.'));
    await aggiungiCheckin({
      data,
      peso: Number.isFinite(pz) && pz > 0 ? pz : undefined,
      sensazioni,
      nota: nota.trim() || undefined,
      giornoCiclo: mostraCiclo && giornoCiclo ? parseInt(giornoCiclo, 10) : undefined,
      vita: parseFloat(vita.replace(',', '.')) || undefined,
      braccio: parseFloat(braccio.replace(',', '.')) || undefined,
      coscia: parseFloat(coscia.replace(',', '.')) || undefined,
    });
    setSalvato(true);
    setPeso('');
    setNota('');
    setTimeout(() => setSalvato(false), 2000);
  };

  return (
    <div class="pagina">
      <Testata senzaIndietro />
      <h1>Check-in</h1>
      <p class="muto">Facoltativo: peso e sensazioni, per leggere i progressi nel tempo. {mostraCiclo ? 'Il giorno del ciclo resta solo su questo account.' : ''}</p>

      <div class="carta">
        <div class="griglia2">
          <div class="campo"><label>Data</label><input type="date" value={data} onInput={(e) => setData((e.target as HTMLInputElement).value)} /></div>
          <div class="campo"><label>Peso (kg)</label><input type="number" inputMode="decimal" step="0.1" value={peso} onInput={(e) => setPeso((e.target as HTMLInputElement).value)} placeholder="—" /></div>
        </div>
        <div class="campo">
          <label>Come ti senti?</label>
          <Scelte valori={[1, 2, 3, 4, 5]} valore={sensazioni} onCambia={setSensazioni} etichette={SENSAZIONI} />
        </div>
        {mostraCiclo ? (
          <div class="campo">
            <label>Giorno del ciclo (facoltativo; non usarlo con contraccettivi ormonali o cicli irregolari)</label>
            <input type="number" inputMode="numeric" min="1" max="45" value={giornoCiclo} onInput={(e) => setGiornoCiclo((e.target as HTMLInputElement).value)} placeholder="—" />
          </div>
        ) : null}
        {sugg ? <Avviso tipo="info">{sugg} <span class="piccolo">(Suggerimento, non prescrizione: il libro dice che i programmi basati solo sul ciclo sono più marketing che scienza.)</span></Avviso> : null}
        <button type="button" class="bottone fantasma" onClick={() => setMostraCirc(!mostraCirc)}>Circonferenze (facoltative) <Icona nome={mostraCirc ? 'su' : 'giu'} dimensione={18} /></button>
        {mostraCirc ? (
          <div class="griglia3">
            <div class="campo"><label>Vita (cm)</label><input type="number" inputMode="decimal" step="0.5" value={vita} onInput={(e) => setVita((e.target as HTMLInputElement).value)} /></div>
            <div class="campo"><label>Braccio (cm)</label><input type="number" inputMode="decimal" step="0.5" value={braccio} onInput={(e) => setBraccio((e.target as HTMLInputElement).value)} /></div>
            <div class="campo"><label>Coscia (cm)</label><input type="number" inputMode="decimal" step="0.5" value={coscia} onInput={(e) => setCoscia((e.target as HTMLInputElement).value)} /></div>
          </div>
        ) : null}
        <div class="campo"><label>Nota</label><textarea value={nota} onInput={(e) => setNota((e.target as HTMLTextAreaElement).value)} placeholder="Sonno, stress, dolori…" /></div>
        <button class="bottone primario pieno" onClick={salva}>{salvato ? 'Salvato' : 'Salva check-in'}</button>
      </div>

      {medie.length ? (
        <div class="carta compatta">
          <h3>Media settimanale del peso</h3>
          <div class="riga" style="flex-wrap:wrap;gap:6px">{medie.map((m) => <span class="chip">dal {formatoData(m.settimana)}: <b>{m.media}</b> kg ({m.n})</span>)}</div>
          <p class="piccolo">Le decisioni sulle calorie si prendono sulla media di due settimane, mai su un giorno; la prima settimana di deficit perde anche acqua.</p>
        </div>
      ) : null}

      {lista.length ? (
        <div class="carta">
          <h2>Storico</h2>
          <table class="tabella">
            <thead><tr><th>Data</th><th class="num">Peso</th><th></th><th></th></tr></thead>
            <tbody>
              {lista.map((c) => (
                <tr>
                  <td>{formatoData(c.data)}</td>
                  <td class="num">{c.peso ?? '—'}{c.vita ? <span class="piccolo"> · vita {c.vita}</span> : ''}</td>
                  <td class="piccolo">{c.sensazioni ? SENSAZIONI[c.sensazioni] : ''} {c.nota ?? ''}</td>
                  <td class="num"><button class="bottone piccolo fantasma" onClick={() => void rimuoviCheckin(c.data)} aria-label="Elimina">Elimina</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
