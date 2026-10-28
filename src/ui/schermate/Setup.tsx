import { useMemo, useState } from 'preact/hooks';
import type { Esperienza, Gruppo, Obiettivo, ParametriGeneratore, Preset } from '../../tipi';
import { ESERCIZI, ESERCIZI_PER_ID, NOMI_GRUPPI } from '../../data/esercizi';
import { generaSettimana, targetVolume } from '../../motore/generatore';
import { minuti } from '../../motore/prescrizione';
import { creaProfilo, profilo, IMPOSTAZIONI_DEFAULT } from '../../store/stato';
import { Avviso, Scelte } from '../componenti/comuni';
import { vai } from '../router';

const GRUPPI: Gruppo[] = ['petto', 'dorso', 'spalle', 'gambe', 'bicipiti', 'tricipiti', 'addome'];

export function Setup() {
  const esiste = profilo.value;
  const [nome, setNome] = useState(esiste?.nome ?? '');
  const [sesso, setSesso] = useState<'M' | 'F'>(esiste?.sesso ?? 'M');
  const [N, setN] = useState(4);
  const [T, setT] = useState(60);
  const [esperienza, setEsperienza] = useState<Esperienza>('intermedio');
  const [obiettivo, setObiettivo] = useState<Obiettivo>('massa');
  const [priorita, setPriorita] = useState<Gruppo[]>([]);
  const [esclusi, setEsclusi] = useState<string[]>([]);
  const [bloccoBreve, setBloccoBreve] = useState(false);
  const [mostraEsclusi, setMostraEsclusi] = useState(false);
  const [mostraDettagli, setMostraDettagli] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const preset: Preset = sesso === 'F' ? 'donna_glutei' : 'uomo_base';
  const parametri: ParametriGeneratore = useMemo(
    () => ({ N, T, priorita, esclusi, esperienza, preset, bloccoBreve }),
    [N, T, priorita, esclusi, esperienza, preset, bloccoBreve],
  );
  const anteprima = useMemo(() => {
    try {
      return generaSettimana(parametri, { sostituzioni: {}, esercizi_personalizzati: [], impostazioni: IMPOSTAZIONI_DEFAULT });
    } catch (e) {
      return null;
    }
  }, [parametri]);
  const target = targetVolume(parametri);

  const togglePriorita = (g: Gruppo) => {
    if (priorita.includes(g)) setPriorita(priorita.filter((x) => x !== g));
    else if (priorita.length < 2) setPriorita([...priorita, g]);
  };
  const toggleEscluso = (id: string) => setEsclusi(esclusi.includes(id) ? esclusi.filter((x) => x !== id) : [...esclusi, id]);

  const settimane = anteprima ? anteprima.cicliTotali : 0;

  const conferma = async () => {
    if (!nome.trim() || !anteprima) return;
    setSalvando(true);
    await creaProfilo(nome.trim(), sesso, parametri, obiettivo);
    setSalvando(false);
    vai('/');
  };

  return (
    <div class="pagina">
      <div class="colonna" style="gap:10px;margin-top:12px">
        <div class="sopratitolo">Frappaula Fit</div>
        <h1>{esiste ? 'Nuovo profilo' : 'Impostiamo il programma'}</h1>
        <p class="muto">Poche domande: da queste l'app genera le sedute del primo blocco. Tutto si può cambiare dopo, dalle Impostazioni.</p>
      </div>

      {esiste ? <Avviso>Creare un nuovo profilo sostituisce quello attuale su questo dispositivo. Esporta prima un backup dalle Impostazioni.</Avviso> : null}

      <div class="carta">
        <div class="campo">
          <label>Come ti chiami?</label>
          <input type="text" value={nome} onInput={(e) => setNome((e.target as HTMLInputElement).value)} placeholder="Nome" autocomplete="given-name" />
        </div>
        <div class="campo">
          <label>Profilo di partenza</label>
          <Scelte valori={['M', 'F']} valore={sesso} onCambia={setSesso} etichette={{ M: 'Uomo · base', F: 'Donna · focus glutei' }} />
          {sesso === 'F' ? <p class="piccolo">Profilo provvisorio: stesso motore, hip thrust come fondamentale e glutei prioritari. Da rivedere quando arrivano i libri su glutei e allenamento femminile.</p> : null}
        </div>
      </div>

      <div class="carta">
        <div class="campo">
          <label>Quante sedute a settimana?</label>
          <Scelte valori={[2, 3, 4, 5]} valore={N} onCambia={setN} />
          {N === 5 ? <p class="piccolo">Il libro sconsiglia 5 sedute: il recupero diventa critico.</p> : null}
          {N === 4 && sesso === 'M' ? <p class="piccolo">A 4 giorni l'app usa il programma dell'app di riferimento letto dai video (giorni A–D). Se una settimana fai 3 sedute, la quarta slitta alla settimana dopo: la sequenza non cambia.</p> : null}
        </div>
        <div class="campo">
          <label>Quanto tempo hai per seduta?</label>
          <Scelte valori={[45, 60, 75, 90]} valore={T} onCambia={setT} etichette={{ 45: '45 min', 60: '60 min', 75: '75 min', 90: '90 min' }} />
        </div>
        <div class="campo">
          <label>Obiettivo</label>
          <Scelte valori={['massa', 'mantenimento', 'definizione'] as Obiettivo[]} valore={obiettivo} onCambia={setObiettivo} etichette={{ massa: 'Massa', mantenimento: 'Mantenimento', definizione: 'Definizione' }} />
          <p class="piccolo">È una tua scelta, non un attributo del blocco: l'allenamento resta lo stesso, cambia l'alimentazione (fuori dall'app).</p>
        </div>
        <div class="campo">
          <label>Esperienza</label>
          <Scelte valori={['principiante', 'intermedio', 'avanzato'] as Esperienza[]} valore={esperienza} onCambia={setEsperienza} etichette={{ principiante: 'Principiante', intermedio: 'Intermedio', avanzato: 'Avanzato' }} />
        </div>
      </div>

      <div class="carta">
        <div class="campo">
          <label>Gruppi prioritari (fino a 2, facoltativo)</label>
          <div class="scelte">
            {GRUPPI.filter((g) => g !== 'addome').map((g) => (
              <button type="button" class={`scelta ${priorita.includes(g) ? 'attiva' : ''}`} onClick={() => togglePriorita(g)}>
                {NOMI_GRUPPI[g]}
              </button>
            ))}
          </div>
        </div>
        <div class="campo">
          <button type="button" class="bottone fantasma" onClick={() => setMostraEsclusi(!mostraEsclusi)}>
            Esercizi da escludere {esclusi.length ? `(${esclusi.length})` : ''} {mostraEsclusi ? '▲' : '▼'}
          </button>
          {mostraEsclusi ? (
            <div class="colonna" style="gap:12px">
              <p class="piccolo">Attrezzatura mancante o esercizi in cui non ti senti sicuro: l'app li sostituisce con un'alternativa della stessa classe.</p>
              {GRUPPI.map((g) => (
                <div class="colonna">
                  <div class="etichetta">{NOMI_GRUPPI[g]}</div>
                  <div class="scelte">
                    {ESERCIZI.filter((e) => e.gruppo === g).map((e) => (
                      <button type="button" class={`scelta ${esclusi.includes(e.id) ? 'attiva' : ''}`} style="min-height:38px;padding:6px 10px;font-size:14px;font-weight:500" onClick={() => toggleEscluso(e.id)}>
                        {esclusi.includes(e.id) ? '✕ ' : ''}{e.nome}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div class="carta">
        <div class="campo">
          <label>Durata del blocco</label>
          <Scelte valori={['completo', 'breve']} valore={bloccoBreve ? 'breve' : 'completo'} onCambia={(v) => setBloccoBreve(v === 'breve')} etichette={{ completo: 'Completo · 17 cicli', breve: 'Breve · 12 cicli' }} />
          <p class="piccolo">
            {bloccoBreve
              ? 'Test, Fase 1, Fase 2 e Scarico: senza il picco di forza della Fase 3.'
              : 'Test, Fase 1, Fase 2, Scarico e Fase 3: la struttura completa dell’app di riferimento.'}
          </p>
        </div>
      </div>

      {anteprima ? (
        <div class="carta">
          <h2>Anteprima</h2>
          <div class="griglia3">
            <div class="stat"><div class="valore">{anteprima.seduteTotali}</div><div class="nome">sedute</div></div>
            <div class="stat"><div class="valore">{settimane}</div><div class="nome">cicli (≈ settimane)</div></div>
            <div class="stat"><div class="valore">{Math.round(anteprima.sessioni.reduce((a, s) => a + s.durataS, 0) / anteprima.sessioni.length / 60)}′</div><div class="nome">durata media</div></div>
          </div>
          {anteprima.avvisi.map((a) => <Avviso>{a}</Avviso>)}
          <table class="tabella">
            <thead><tr><th>Gruppo</th><th class="num">Serie / sett.</th><th class="num">Riferimento</th></tr></thead>
            <tbody>
              {GRUPPI.map((g) => (
                <tr><td>{NOMI_GRUPPI[g]}</td><td class="num">{anteprima.volume[g]}</td><td class="num muto">{target[g]}</td></tr>
              ))}
            </tbody>
          </table>
          <button type="button" class="bottone fantasma" onClick={() => setMostraDettagli(!mostraDettagli)}>
            {mostraDettagli ? 'Nascondi le sedute' : 'Vedi le sedute generate'}
          </button>
          {mostraDettagli ? anteprima.sessioni.map((s) => (
            <div class="colonna" style="gap:4px">
              <div class="riga spazio"><h3>{s.nome} · {s.etichetta}</h3><span class="piccolo">≈ {minuti(s.durataS)}′</span></div>
              {s.esercizi.map((e) => (
                <div class="riga spazio piccolo" style="color:var(--testo2)">
                  <span>{ESERCIZI_PER_ID[e.esercizio_id]?.nome}</span>
                  <span class={`badge ${e.ruolo}`}>{e.ruolo}</span>
                </div>
              ))}
            </div>
          )) : null}
        </div>
      ) : (
        <Avviso tipo="errore">Non riesco a generare il programma con queste scelte.</Avviso>
      )}

      <button class="bottone primario pieno" disabled={!nome.trim() || !anteprima || salvando} onClick={conferma}>
        {salvando ? 'Creo il programma…' : 'Crea il programma'}
      </button>
      {esiste ? <button class="bottone fantasma pieno" onClick={() => vai('/impostazioni')}>Annulla</button> : null}
    </div>
  );
}
