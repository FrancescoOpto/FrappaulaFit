import { useState } from 'preact/hooks';
import type { Checkin as TCheckin } from '../../tipi';
import { aggiungiCheckin, rimuoviCheckin, stato } from '../../store/stato';
import { Avviso, Scelte, Testata, formatoData } from '../componenti/comuni';
import { Icona } from '../componenti/IconaEsercizio';
import { GraficoLinea } from '../componenti/Grafico';

const SENSAZIONI: Record<string, string> = { 1: 'A terra', 2: 'Giù', 3: 'Normale', 4: 'Bene', 5: 'Al top' };

function oggi(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Medie settimanali del peso (le decisioni si prendono sulla media, mai su un giorno). */
export function mediePeso(lista: TCheckin[]): { settimana: string; media: number; n: number }[] {
  const per = new Map<string, number[]>();
  for (const c of lista) {
    if (!c.peso) continue;
    const d = new Date(c.data);
    const lun = new Date(d);
    lun.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const k = lun.toISOString().slice(0, 10);
    per.set(k, [...(per.get(k) ?? []), c.peso]);
  }
  return [...per.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([settimana, v]) => ({ settimana, media: Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10, n: v.length }));
}

/** Suggerimenti legati al ciclo: facoltativi e a basso peso. */
function suggerimentoCiclo(giorno: number | undefined): string | null {
  if (!giorno) return null;
  if (giorno <= 5) return 'Giorni 1–5: se ti senti stanca, va bene fare il circuito con un giro in meno o la parte alta con una serie in meno. I fondamentali restano.';
  if (giorno <= 14) return 'Giorni 6–14: fase in cui di solito ci si sente più forti. Nessuna modifica.';
  if (giorno <= 22) return 'Giorni 15–22: nessuna modifica prevista.';
  return 'Ultimi giorni del ciclo: il peso sulla bilancia può salire per la ritenzione, non è grasso. Se la stanchezza pesa, una serie in meno sui complementari va bene.';
}

export function Checkin() {
  void stato.value;
  const lista = [...stato.value.checkin].reverse();
  const [data, setData] = useState(oggi());
  const [peso, setPeso] = useState('');
  const [sensazioni, setSensazioni] = useState<number>(3);
  const [nota, setNota] = useState('');
  const [giornoCiclo, setGiornoCiclo] = useState('');
  const [vita, setVita] = useState('');
  const [glutei, setGlutei] = useState('');
  const [coscia, setCoscia] = useState('');
  const [mostraMisure, setMostraMisure] = useState(false);
  const [salvato, setSalvato] = useState(false);
  const medie = mediePeso(stato.value.checkin);
  const sugg = suggerimentoCiclo(parseInt(giornoCiclo, 10) || undefined);
  const num = (x: string) => {
    const n = parseFloat(x.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  const salva = async () => {
    await aggiungiCheckin({ data, peso: num(peso), sensazioni, nota: nota.trim() || undefined, giornoCiclo: giornoCiclo ? parseInt(giornoCiclo, 10) : undefined, vita: num(vita), glutei: num(glutei), coscia: num(coscia) });
    setSalvato(true);
    setPeso('');
    setNota('');
    setTimeout(() => setSalvato(false), 2000);
  };

  return (
    <div class="pagina">
      <Testata senzaIndietro />
      <h1>Check-in</h1>
      <p class="muto">Facoltativo: peso, sensazioni e misure, per vedere i progressi nel tempo.</p>

      <div class="carta">
        <div class="griglia2">
          <div class="campo"><label>Data</label><input type="date" value={data} onInput={(e) => setData((e.target as HTMLInputElement).value)} /></div>
          <div class="campo"><label>Peso (kg)</label><input type="number" inputMode="decimal" step="0.1" value={peso} onInput={(e) => setPeso((e.target as HTMLInputElement).value)} placeholder="—" /></div>
        </div>
        <div class="campo"><label>Come ti senti?</label><Scelte valori={[1, 2, 3, 4, 5]} valore={sensazioni} onCambia={setSensazioni} etichette={SENSAZIONI} /></div>
        <div class="campo">
          <label>Giorno del ciclo (facoltativo; non usarlo con contraccettivi ormonali o cicli irregolari)</label>
          <input type="number" inputMode="numeric" min="1" max="45" value={giornoCiclo} onInput={(e) => setGiornoCiclo((e.target as HTMLInputElement).value)} placeholder="—" />
        </div>
        {sugg ? <Avviso tipo="info">{sugg} <span class="piccolo">(Suggerimento, non prescrizione.)</span></Avviso> : null}
        <button type="button" class="bottone fantasma" onClick={() => setMostraMisure(!mostraMisure)}>Misure in cm (facoltative) <Icona nome={mostraMisure ? 'su' : 'giu'} dimensione={18} /></button>
        {mostraMisure ? (
          <div class="griglia3">
            <div class="campo"><label>Vita</label><input type="number" inputMode="decimal" step="0.5" value={vita} onInput={(e) => setVita((e.target as HTMLInputElement).value)} /></div>
            <div class="campo"><label>Glutei</label><input type="number" inputMode="decimal" step="0.5" value={glutei} onInput={(e) => setGlutei((e.target as HTMLInputElement).value)} /></div>
            <div class="campo"><label>Coscia</label><input type="number" inputMode="decimal" step="0.5" value={coscia} onInput={(e) => setCoscia((e.target as HTMLInputElement).value)} /></div>
          </div>
        ) : null}
        <div class="campo"><label>Nota</label><textarea value={nota} onInput={(e) => setNota((e.target as HTMLTextAreaElement).value)} placeholder="Sonno, stress, dolori…" /></div>
        <button class="bottone primario pieno" onClick={salva}>{salvato ? 'Salvato' : 'Salva check-in'}</button>
      </div>

      {medie.length >= 2 ? (
        <div class="carta compatta">
          <h3>Peso: media settimanale</h3>
          <GraficoLinea punti={medie.map((m) => ({ x: m.settimana, y: m.media }))} unita="kg" />
          <p class="piccolo">Le decisioni si prendono sulla media di due settimane, mai su un giorno.</p>
        </div>
      ) : null}

      {lista.length ? (
        <div class="carta">
          <h2>Storico</h2>
          <table class="tabella">
            <thead><tr><th>Data</th><th class="num">Peso</th><th>Misure e note</th><th></th></tr></thead>
            <tbody>
              {lista.map((c) => (
                <tr>
                  <td>{formatoData(c.data)}</td>
                  <td class="num">{c.peso ?? '—'}</td>
                  <td class="piccolo">{[c.vita ? `vita ${c.vita}` : '', c.glutei ? `glutei ${c.glutei}` : '', c.coscia ? `coscia ${c.coscia}` : '', c.giornoCiclo ? `ciclo g.${c.giornoCiclo}` : '', c.sensazioni ? SENSAZIONI[c.sensazioni] : '', c.nota ?? ''].filter(Boolean).join(' · ')}</td>
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
