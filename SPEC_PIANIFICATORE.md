# SPEC_PIANIFICATORE — Obiettivi, bilancio energetico e moduli di programma (Frappaula Fit)
Versione 1 · 28/10/2026 · per Claude Code. Lingua dell'app e dei testi: italiano.
Etichette come in `SPEC.md`: **[Certo]** dedotto da dati/libro/video, **[Probabile]** inferenza forte, **[Ipotesi]** scelta nostra da verificare, **[Utente]** deciso da Francesco, **[Mia decisione]** scelta da trainer delegata.
Fonti: `Libro` = Project Bodybuilding (note in `docs/note_elaborate/cap*.md`), `Schoenfeld` = *Science and Development of Muscle Hypertrophy*, 2ª ed. (2021), `Video` = app di riferimento (test, Fase 1–3, Scarico, guide "Gestione carichi" e "Tecnica Back off"), `Doc` = report "Basi scientifiche" (fonte secondaria, poco affidabile: usare solo dove indicato).

## 0. Ambito e rapporto con il codice esistente
- Questa spec **estende** `SPEC.md` §3 (struttura), §14 (coach) e **sostituisce §15** (pianificatore). In caso di conflitto su obiettivo, energia, pianificatore e passaggio tra programmi **prevale questo file**. Per tutto il resto (generatore sedute, test, tabelle dei Blocchi 1–3, persistenza carichi §9.2b) resta valido `SPEC.md`.
- **Il codice esistente non va riscritto.** Esistono già: `Obiettivo = 'massa' | 'mantenimento' | 'definizione'` in `tipi.ts` (solo dato), `motore/pianificatore.ts` (solo blocchi completi/accorciati), `data/regole_coach.ts` (struttura), `data/blocco1–3.ts`, `motore/correnti.ts`, `Setup.tsx`. Si **estendono**; i test esistenti devono restare verdi.
- **Fuori ambito di questo file:** profilo e programma della moglie (spec separata, in arrivo), Anno 2–3 del programma di riferimento (esercizi e tabelle non ancora noti), Blocco 4. Il **sesso** però è un input (serve alle formule).
- Il nome interno `definizione` resta (tipo esistente); nell'interfaccia l'etichetta è **"Dimagrimento"**.

## 1. Il ragionamento in una pagina [Mia decisione]
Quando l'utente entra (primo avvio, reset dati, o "Cambia obiettivo") l'app decide **in questo ordine**:
1. **Che obiettivo hai?** Massa · Mantenimento · Dimagrimento. **Per quanto tempo?** (settimane)
2. **In che stato energetico sei?** Deficit · Calorie di mantenimento (TDEE) · Surplus. Di norma discende dall'obiettivo, ma l'utente può dichiarare di essere già in deficit. *L'energia decide cosa l'allenamento può ottenere*: nel deficit la sintesi proteica cala (−19 % con deficit del 20 %; −27 % con ~500 kcal per 5 giorni) e l'allenamento la riporta solo ai valori di riposo [Certo, Schoenfeld cap. 9]. Quindi **in deficit l'allenamento serve a mantenere il muscolo, non a costruirlo**.
3. **Cosa so già di te?** Carichi e massimali nel profilo (§7). Se ci sono, **nessun nuovo test** passando da un programma all'altro.
4. L'app sceglie il **modulo** (§4) e costruisce la sequenza di **cicli** (§5–§6) per la durata richiesta, mostrando il "perché" in una riga.
5. Ogni settimana il **coach** (§8) legge peso, carichi e sforzo e propone (non impone) aggiustamenti.

| Obiettivo | Stato energetico | Modulo di allenamento |
|---|---|---|
| Massa | surplus | **Ipertrofia con forza** (blocchi di riferimento, come oggi) |
| Mantenimento | calorie di mantenimento | **Ipertrofia accorciata** (Test/rientro + Fase 1 + Fase 2 + Scarico), senza Fase 3 e senza tecniche avanzate |
| Dimagrimento | deficit | **Preservazione** (§4.3): intensità alta, volume ridotto |

**Blocco bloccante morbido:** se l'utente sceglie *Massa* ma dichiara *deficit* → avviso: "In deficit non si costruisce muscolo in modo efficace. Scegli: Mantenimento / Dimagrimento, oppure indica che sei in surplus." L'utente può ignorarlo (lo registriamo). Eccezione dal Libro: chi si allena da poco (principiante) può migliorare la composizione a calorie di mantenimento (ricomposizione) → per i principianti l'avviso è solo informativo. [Probabile]

## 2. Dati da raccogliere (onboarding e Impostazioni)
Esistenti: nome, sesso, N giorni/settimana (**default 4**), durata seduta, priorità, esclusioni, esperienza, preset. **Nuovi:**
- Età, altezza (cm), peso (kg), % grasso (opzionale).
- Livello di attività quotidiana: sedentario · leggero · moderato · alto.
- **TDEE noto** (opzionale): "L'ho misurato con 10–14 giorni di conteggio calorie a peso stabile" → prevale sulla formula (Libro, cap. 2 §2.3).
- Obiettivo, durata in settimane (default per obiettivo: dimagrimento 4, mantenimento 12, massa 17), **kg da perdere/prendere** (opzionale), flag **"Allenare anche la resistenza"** (§4.5).
- Mai chiedere cose non usate: se l'utente salta la parte energia, l'app funziona lo stesso (solo allenamento, nessun calcolo calorico).

## 3. Modulo Energia (calcolatore, opzionale) [Libro + Schoenfeld]
**Ambito:** calcolo e controllo del bilancio energetico. **L'app non è un contacalorie e non propone pasti.** Le indicazioni sono generali, non una dieta personalizzata (una riga di avviso, non un discorso). Il Libro rimanda a un professionista con BMI > 29: mostrare quella riga una volta, chiudibile.

### 3.1 TDEE (tre stime, mostrate insieme)
1. **Empirico** (se noto): vale quello.
2. **Mifflin-St Jeor × attività** [formula: Libro cap. 2 §2.6; fattori: Probabile, non nel Libro]. BMR uomo = 10·kg + 6,25·cm − 5·età + 5; donna = … − 161. Fattore: 1,2 / 1,375 / 1,55 / 1,725. Esempio uomo 80 kg, 180 cm, 30 anni: BMR 1780 (valore del Libro), TDEE 1780×1,55 = **2759**.
3. **Regola del Libro** (cap. 2 §2.5): kg × 32–34 (uomo) o × 30–32 (donna); valida solo fino a ~12–15 % di grasso (uomo) e 22–24 % (donna): sopra sovrastima. Mostrare l'intervallo.
La stima ha un errore tipico di ±10 %: il **valore di partenza** è la media tra 2 e 3, poi lo corregge il peso reale (§3.4). [Ipotesi]

### 3.2 Calorie obiettivo
- **Dimagrimento:** deficit base **500 kcal (uomo) / 350 (donna)** [Libro tab. 2.1]. Se l'utente indica **kg da perdere** in N settimane: `deficit_die = kg × 7700 / (settimane × 7)` [Probabile: 7700 kcal/kg di grasso è un'approssimazione, non nel Libro].
  - **Tetto di ritmo** (perdita settimanale in % del peso): 1 % se BF > 12 % (U) / > 20 % (D) o BF ignota; **0,5 %** se BF < 10 % (U) / < 16 % (D) [Libro tab. 2.1 e §4.12; il Libro cita fino a 1,5–2 % per BF alte: troppo aggressivo, non adottato — [Ipotesi]]. Se il deficit richiesto supera il tetto → l'app lo riduce, mostra la **durata minima** e spiega.
  - Pavimento: kcal obiettivo **mai sotto il BMR stimato** [Ipotesi].
- **Mantenimento:** TDEE (±100).
- **Massa:** surplus per livello: principiante +300–500, intermedio +200–300, avanzato +100–200 [Libro cap. 4, "Calorie in massa"]; guadagno atteso 0,25–0,35 % del peso/settimana (principiante/intermedio) o 0,05–0,12 % (avanzato) [Libro tab. 2.1]. Schoenfeld: ≤ 500 kcal per chi è allenato.

### 3.3 Macronutrienti (g/kg di peso; CHO = calorie rimanenti; procedura del Libro cap. 4)
| Obiettivo | Proteine | Grassi | Note |
|---|---|---|---|
| Massa | 1,6–2,0 (default 1,8) | 0,8–1,5 (default 1,0) | Schoenfeld: 1,6–2,2; ≥ 3 g/kg CHO |
| Mantenimento | 1,6–2,0 (default 1,8) | 0,8–1,2 (default 1,0) | |
| Dimagrimento | 1,8–2,4 (default 2,0) | 0,6–1,0 (default 0,8) | Libro "definizione anabolica" |
Proteine ripartite su ≥ 4 pasti da 0,4–0,55 g/kg [Schoenfeld]. 4 kcal/g (P, CHO), 9 kcal/g (grassi).

### 3.4 Controllo settimanale (usa il Check-in esistente)
- **Peso:** media dei valori della settimana di calendario (lun–dom); decisioni solo su medie, mai su un valore singolo. Aspettare ≥ 2 settimane prima di agire; 1–2 settimane di peso fermo non indicano che la dieta non funziona (Libro §4.12). La prima settimana di deficit perde anche acqua/glicogeno: non usarla per tarare.
- **Troppo lento** (< 50 % del ritmo atteso per 2 settimane): proponi −100/−200 kcal (Libro: ±100–200 secondo bilancia). **Troppo veloce** (sopra il tetto) o forza fondamentali in calo > 10 % su 2 sedute: proponi +100/−200 kcal e avviso. [Ipotesi sulle soglie]
- **Circonferenze (opzionali):** vita, braccio, coscia. Regola del Libro: in dimagrimento il calo deve avvenire in vita/cosce; se il braccio cala più del ~10 % del calo di vita → avviso "stai perdendo muscolo?" [Probabile].
- **Passi:** nessun tracking; consiglio statico 10.000–15.000 passi/giorno, **no HIIT**, cardio facoltativo (Libro cap. 10, Shred). [Certo come indicazione del Libro]

## 4. Moduli di allenamento
Un **modulo** è una funzione che, dati profilo, carichi e durata, produce la sequenza di sedute. **Regola d'oro: nessuna tabella nuova da mantenere.** Massa e Mantenimento usano i dati dei Blocchi esistenti; Preservazione è una **trasformazione** dei dati del Blocco 3.

### 4.1 Massa — Ipertrofia con forza
Come oggi: Test → Fase 1 → Fase 2 → Scarico → Fase 3 (17 cicli), Blocchi 1, 2, 3 = Anno 1. Test a inizio di ogni blocco (come l'app di riferimento) **salvo** che l'utente arrivi da un altro modulo con carichi recenti (§7.4). Il coach **propone** soltanto; non riscrive le tabelle del blocco.

### 4.2 Mantenimento
Sequenza: [Rientro o Test se serve] + Fase 1 + Fase 2 + Scarico (blocco accorciato già esistente, `nostraScelta`). Nessuna tecnica avanzata. Lunghezza adattata alla durata richiesta con la logica di `bloccoAccorciato`. [Ipotesi]

### 4.3 Preservazione (Dimagrimento) [Libro Shred + Schoenfeld; parametri Ipotesi]
**Principio:** mantenere intensità sui fondamentali, ridurre volume e fatica, niente novità. Si ricava dai dati del **Blocco 3** (o del blocco in corso) con queste regole:
- **Fondamentali** (panca, squat, stacco): % del massimale vigente, mai a cedimento. Ciclo "77": **3×5 @77 %**; ciclo "82": **3×4 @82 %**; scarico: **2×4 @77 %**.
- **Target non fondamentali:** carico = `carico_corrente` del profilo; ripetizioni come Fase 1 nel ciclo "77" e come Fase 2 nel ciclo "82" (reps test −2, poi +1); **serie = serie − 1 (minimo 2)**. L'ultima serie può arrivare al cedimento.
- **Complementari:** serie − 1 (minimo 2); carico = `carico_corrente`.
- **Addome:** invariato.
- **Tolti:** seconda riga Target ×12, rest-pause (`1×40`, `1×10`), back-off, stripping, drop set.
- **Preferenze:** opzione `preferisci_macchine` (default **off**; consigliata se la forza cala > 10 % o in "definizione estrema"): sostituisce i multiarticolari liberi non fondamentali con l'alternativa guidata della stessa classe (Libro, Shred).
- **Verifica sul Blocco 3, Fase 1 settimana 1: 97 serie → 68 (−30 %)** [Certo, calcolato su `BLOCCO3_programma.md` §B2].
- **Scarico:** ogni esercizio non fondamentale −1 serie (minimo 1); fondamentali 2×4 @77 %; niente tecniche.

### 4.4 Sequenza dei cicli della Preservazione
Dati `N` cicli (≥ 3; con meno l'app dice che non vale la pena e propone di allungare): per `p = 1..N`:
- `p % 5 == 0` → **scarico**;
- se `p == N`, `N % 5 != 0` e `N ≥ 4` → ultimo ciclo = **scarico** (chiusura), salvo che il precedente sia già scarico;
- altrimenti: primo ciclo dopo l'inizio o dopo uno scarico → **"77"**; tutti gli altri → **"82"**.
Esempi (test): `N=4 → [77, 82, 82, S]` · `N=5 → [77, 82, 82, 82, S]` · `N=8 → [77, 82, 82, 82, S, 77, 82, S]` · `N=3 → [77, 82, 82]` (senza scarico).
Il ritmo "4 di lavoro + 1 di scarico" viene dalle indicazioni di scarico in deficit (3–5 settimane; Doc e Schoenfeld 3:1 come punto di partenza) [Probabile]; il coach può anticipare lo scarico (§8).

### 4.5 "Allenare anche la resistenza" (opzione, default off) [Ipotesi]
Aggiunge, come **ultimo esercizio di ogni seduta**, un complementare su macchina/cavo con **2 serie da 15–20 ripetizioni** a carico = `carico_testRM × (37 − 15)/(37 − RM_test)` (Brzycki, stesso modello del test) arrotondato al passo dell'attrezzo. Base: Schoenfeld (carichi leggeri, ≥ 30 % del massimale, vicino al cedimento, allenano Tipo I e capacità tampone). Non cambia fondamentali né Target.

### 4.6 Tecniche (tipi di serie) — ciò che il motore deve saper rappresentare
- `rest_pause` con varianti `totale_reps` ("fai 40 ripetizioni usando il carico del test") e `10_piu_3` ("10 ripetizioni a carico leggermente ridotto + 3 serie al massimo con pause di 30, 40, 50 secondi; recupero 90"). [Certo, Video] Già in `blocco3.ts`; permesso **solo su isolamenti/macchine**; mai su fondamentali liberi [Ipotesi]. Evidenza scarsa (Schoenfeld): resta opzionale.
- `esclude_bilanciere` (multipower: il peso inserito esclude il bilanciere). [Certo, Video]
- `drop_set`: solo ultima serie, macchine, −20 % [Schoenfeld]; **non** inserito nelle tabelle del Blocco 1–3.
- **`back_off`** (Anno 2 e programmi personalizzati): `serie_pesanti` (es. 2×7 al carico X) seguite da 1–2 serie **al massimo** a −10/−20 % (esempio dal video: T-bar 2×7@50 + 1×max@40; poi 2×7 + 1×max −10 % + 1×max −10 %). Arrotondamento libero; manubri a passi di 2/2,5 kg (14 −20 % = 11,2 → 12 o 10; se con 10 si fanno 15–20 ripetizioni, usa 12). La nota nella serie indica la tecnica. [Certo, Video]
  - Libro (TS-BO): 1 top set (RIR 1–3) + 4 serie a ×0,85, stesse ripetizioni; per principianti/intermedi con carichi moderati. [Certo, Libro; è l'**unica fonte** teorica: Schoenfeld non lo tratta]
  - **Regola di posizionamento [Ipotesi]:** mai in Fase 1 né nello Scarico; in Fase 2 solo su Target a macchina; in Fase 3 sui fondamentali senza cedimento a −10/−15 %; **quasi mai nella Preservazione**. **Non va inserito nelle tabelle dei Blocchi 1–3** (l'app di riferimento non lo usa nel primo anno): serve solo come tipo di serie + opzione nei programmi personalizzati.

## 5. Ciclo di sedute ≠ settimana di calendario [Utente]
- Un **ciclo** = un giro completo del contenitore (N sedute: A, B, C, D). **La progressione si indicizza sul numero di ciclo/sedute completate, mai sulla data.** Se in una settimana si fanno 3 sedute su 4, la quarta è la prima della settimana successiva e la sequenza non cambia (già in `SPEC.md` §3, rendere esplicito nel codice e nei test).
- Le "settimane" che l'utente chiede (es. "4 settimane") sono **cicli**: 4 settimane × N=4 = **16 sedute**. L'app mostra anche la durata stimata in calendario (`cicli × 7 × N / sedute_a_settimana_effettive`).
- Il **peso corporeo** (§3.4) usa invece la settimana di calendario. Le regole sui carichi usano i cicli. Non mescolare le due unità.

## 6. Pianificatore a tappe (sostituisce `SPEC.md` §15)
Un **piano** è una lista ordinata di **tappe**: `{ modulo, obiettivo, cicli, energia }` con moduli `test | rientro | ipertrofia | mantenimento | preservazione | scarico`. Si estende `OpzionePiano` con `tappe[]` senza rompere le funzioni esistenti.
- `proponiPiano({ obiettivo, settimane, N, profilo }) → OpzionePiano[]`, ognuna con il "perché":
  - Massa → `opzioniPiano` esistente (blocchi completi + eventuale accorciato, `nostraScelta`).
  - Mantenimento → blocco accorciato (§4.2) ripetuto/adattato.
  - Dimagrimento → una tappa Preservazione di `settimane` cicli (§4.4).
- **Piano a più tappe:** "Aggiungi tappa" dopo l'ultima (es. Dimagrimento 4 → Massa 17; Massa 14 → Dimagrimento 12). Il pianificatore non ottimizza da solo: mostra la somma e la durata in calendario. Esempi [Ipotesi]: *massa + definizione* ≈ 14 cicli di massa + 12 di Preservazione; *un mese di taglio e poi blocchi* = 4 Preservazione + Test (solo se serve) + blocco.
- **Cambio obiettivo in corso:** si applica al **confine di ciclo** (preferibilmente allo scarico). Se l'utente insiste a metà ciclo, chiedere conferma. Il primo ciclo del nuovo modulo è un **ciclo ponte** a carichi del profilo (livello "77 %", niente tecniche).
- Le tappe già fatte e i carichi non si toccano; le sedute future si rigenerano (come `SPEC.md` §4.7).

## 7. Carichi: profilo persistente e ricalcolo [Certo: video "Gestione carichi" e SPEC §9.2b]
### 7.1 Profilo carichi (per esercizio, non per blocco)
`profilo_carichi[esercizio_id] = { massimale_stimato? (solo fondamentali), carico_corrente, data, origine: 'test'|'manuale'|'ricalcolo' }`. `massimaleVigente(esercizio)` = ultimo valido. Lo storico dei blocchi resta per i confronti ma **non è più la fonte** per i moduli: tutti i moduli leggono il profilo.
### 7.2 Regole (dal video)
1. **Settimana 1 = test.** Dalla 2ª i carichi partono precompilati; l'utente può alzarli se troppo leggeri e l'app propone il nuovo carico la settimana dopo.
2. **Fondamentali** (carico = % del massimale): mai a cedimento, sforzo ~8/10. Se l'utente alza il peso e completa le ripetizioni, l'app **stima un nuovo massimale** `1RM = peso × 36/(37 − rip_fatte)` (con RIR dichiarato: `rip_fatte + RIR`) e **ricalcola le percentuali delle sedute future**, non le passate; con "Ripristina" si torna al piano. Aggiornamento automatico solo se il nuovo valore supera il vigente di ≥ 2,5 %. [Ipotesi sulla soglia]
3. **Target e complementari:** salita graduale e solo se davvero leggero. Segnale: **l'ultima serie non è a cedimento**. Aggiungere sulla **ultima serie** un tocco rapido "Facile / Giusto / Al limite"; "Facile" → proposta di +1 passo di carico alla seduta successiva. [Ipotesi sull'interfaccia]
4. **Esercizio nuovo senza test** (Fase 2/3): carico iniziale = **il più alto con cui si completano tutte le serie e ripetizioni arrivando al cedimento sull'ultima ripetizione dell'ultima serie**. Se i carichi cambiano tra le serie, la settimana dopo si precompila il carico dell'ultima serie.
5. **Aumenti forzati in Fase 3**: scritti nelle note degli esercizi dell'app di riferimento. **Non ancora visti: non implementare** (campo vuoto `aumento_forzato_fase3`).
### 7.3 Autocorrezione (già in `SPEC.md` §7, invariata)
−5 % sulla serie successiva se mancano ripetizioni; −2,5 % al ciclo dopo se succede per 2 sedute di fila.
### 7.4 Quando il test serve davvero
- Esercizio senza carico nel profilo → test (stima per fondamentali, serie unica 10/12/14RM per gli altri).
- Inizio di un **Blocco 1/2/3 di massa**: test come nell'app di riferimento, **ma saltabile** ("Usa i carichi del profilo") se i valori hanno ≤ 6 settimane e l'utente arriva da un altro modulo. [Ipotesi]
- Pausa > 3 settimane: kick-off del Libro (regola `rientro_pausa`, già presente).
- **Mai** per passare a Preservazione o tra moduli.
- Dopo Preservazione verso Massa: ciclo ponte; sui fondamentali l'app confronta le ripetizioni fatte al 77 % con quelle prescritte e, se superano di ≥ 2, propone il ricalcolo del massimale (nessun test completo).

## 8. Motore coach: regole nuove (dati in `regole_coach.ts`, con il "perché" in una riga)
Estendere `fonte` da `'metodo'|'ipotesi'` a `'metodo' | 'libro' | 'evidenza' | 'ipotesi'` (evidenza = Schoenfeld). Le regole `ipotesi` restano disattivabili. Il coach **propone e spiega**, non riscrive le tabelle dei blocchi di riferimento senza conferma.
| id | Regola | Fonte |
|---|---|---|
| `energia_blocca_ipertrofia` | Avviso massa in deficit (§1) | evidenza + libro |
| `ritmo_dimagrimento` | Tetto di perdita % peso/settimana (§3.2) | libro (+ ipotesi tetto) |
| `taratura_calorie` | ±100–200 kcal su media peso 2 settimane (§3.4) | libro |
| `braccio_vs_vita` | Circonferenze (§3.4) | libro |
| `trend_carichi` | Se kg×rip del fondamentale/Target calano per 2 sedute di fila rispetto al ciclo precedente → proponi −1 serie ai complementari del gruppo e/o scarico anticipato; se stabili/crescono → nessun cambio | evidenza (massimo volume recuperabile, Schoenfeld: *nessuna ricerca diretta*) |
| `sforzo` | Fondamentali RIR ≥ 2; Target/complementari al cedimento solo sull'ultima serie; più prudenza sui multiarticolari | evidenza |
| `riposi` | ≥ 2 min sui multiarticolari liberi; 60–90 s su monoarticolari e macchine (i timer di §9.4 restano) | evidenza |
| `tecniche_solo_isolamenti` | Rest-pause e drop set non sui fondamentali liberi | ipotesi |
| `scarico_in_deficit` | In Preservazione scarico ogni 5 cicli (§4.4) | ipotesi |
| `ordine_seduta` | I muscoli prioritari vanno per primi | evidenza |
| `carico_ricalcolo` | Nuovo massimale quando alzi il peso (§7.2) | metodo (video) |
| `checkin_14gg` | **Fase 2 di sviluppo, spenta**: recupero da −2 a +2 per gruppo ogni 14 giorni → ±1 serie. Soglie del `Doc`, da tarare | ipotesi |
Opzione per il profilo di lei (da definire nella spec separata): "riposi ridotti" (Schoenfeld: recupero più rapido nelle donne tra le serie, riposi "un po' più corti"; il −20/30 % del `Doc` **non** è confermato).

## 9. Anni
Anno 1 = Blocchi 1–3 (dati completi). **Anno 2–3** dell'app di riferimento: esercizi nuovi e tecniche aggiuntive (back-off incluso): **contenuto non noto**. Finché non arriva, dopo il Blocco 3 il pianificatore offre: ripetere il ciclo dei blocchi con alternative equivalenti (rotazione della guida) oppure moduli Mantenimento/Preservazione. [Ipotesi] Nessun dato inventato.

## 10. Modello dati (aggiunte indicative a `tipi.ts`)
```ts
type Attivita = 'sedentario' | 'leggero' | 'moderato' | 'alto';
interface DatiCorporei { sesso: 'M'|'F'; eta: number; altezzaCm: number; pesoKg: number; bfPct?: number; attivita: Attivita; tdeeEmpirico?: number; }
type StatoEnergetico = 'deficit' | 'mantenimento' | 'surplus';
type Modulo = 'test'|'rientro'|'ipertrofia'|'mantenimento'|'preservazione'|'scarico';
interface Tappa { modulo: Modulo; obiettivo: Obiettivo; cicli: number; energia: StatoEnergetico; ciclo77o82?: (77|82|'S')[]; }
interface ObiettivoAttivo { tipo: Obiettivo; dal: string; kgTarget?: number; resistenza?: boolean; preferisciMacchine?: boolean; kcalTarget?: number; macro?: { p: number; g: number; c: number }; }
interface CheckIn { data: string; pesoKg: number; vitaCm?: number; braccioCm?: number; cosciaCm?: number; }
profilo_carichi: Record<string, { massimale?: number; caricoCorrente: number; data: string; origine: 'test'|'manuale'|'ricalcolo' }>;
```
(Usare i nomi del codice esistente dove coincidono: `correnti`, `Obiettivo`.)

## 11. Interfaccia
- **Setup / "Cambia obiettivo"**: passi §2; anteprima con piano a tappe, serie/gruppo/settimana, durata in cicli e in calendario, e il "perché" della scelta.
- **Energia** (Impostazioni → Energia): BMR, TDEE (tre stime), calorie obiettivo, macro in grammi; campi sovrascrivibili.
- **Check-in**: peso (con media settimanale e grafico), circonferenze opzionali.
- **Seduta**: sull'ultima serie, tocco "Facile / Giusto / Al limite"; etichette "Preservazione" / "Ciclo ponte" / "Scarico" nella barra delle fasi.
- Tutti i testi in italiano, regole riscritte con parole nostre.

## 12. Test di accettazione (automatici, Vitest)
1. **BMR/TDEE:** uomo 80 kg, 180 cm, 30 anni → BMR 1780; TDEE (×1,55) 2759; regola Libro 2560–2720. Donna 55 kg, 165 cm, 30 anni → BMR 1270 (±1).
2. **Deficit da obiettivo:** 80 kg, −2 kg in 4 settimane → **550 kcal/die** (0,625 %/sett: entro il tetto). −6 kg in 4 settimane → richiesti 1650 kcal/die; con tetto 1 % → massimo **880 kcal/die**, durata minima **8 settimane**.
3. **Macro (dimagrimento, 80 kg, 2259 kcal):** proteine 2,0 g/kg = 160 g (640 kcal); grassi 0,8 g/kg = 64 g (576 kcal); CHO = (2259 − 640 − 576)/4 = **260,75 g**.
4. **Sequenza Preservazione:** `N=3,4,5,8` come in §4.4.
5. **Fondamentali in Preservazione:** squat 1RM 90 → ciclo "77" 3×5 @69,5; ciclo "82" 3×4 @74; scarico 2×4 @69,5. Panca/stacco 1RM 101,5 → 78 · 83 · 78.
6. **Trasformazione sul Blocco 3, Fase 1 W1:** totale serie 97 → 68; nessuna riga rest-pause, ×12 secondaria, back-off; nessun non-fondamentale sotto 2 serie (tranne scarico) né sopra le originali.
7. **Cambio obiettivo senza test:** Massa → Dimagrimento a metà blocco: i carichi del profilo restano, le sedute passate non cambiano, la prima seduta nuova usa il ciclo ponte.
8. **Ciclo ≠ settimana:** con 3 sedute fatte in una settimana, la quarta è la prima della settimana dopo e la progressione per ciclo non cambia.
9. **Ricalcolo massimale:** panca 1RM 101,5; l'utente fa 5×85 completando le 5 ripetizioni → stima 85·36/32 = 95,6 (< vigente: nessun aggiornamento); 5×95 → 106,9 (≥ +2,5 %: aggiorna e ricalcola le % future).
10. **Retrocompatibilità:** tutti i test esistenti (`blocco1–3`, `carichi`, `correnti`, `generatore`, `pianificatore`, `prescrizione`) restano verdi.

## 13. Parti aperte (non inventare)
- Profilo e programma della moglie: spec separata (foto/screen in arrivo).
- Testo delle note sugli aumenti forzati in Fase 3 e sulle tecniche (back-off) dell'app di riferimento; Anno 2–3; esistenza del Blocco 4.
- Seconda riga Target ×12 del Blocco 3: nel video sembra un back-off ([Ipotesi]); resta serie normale a ×12.
- Se le percentuali 77/82/87 del Blocco 3 dipendono dalle ripetizioni del test.
- Soglie di `taratura_calorie`, `trend_carichi`, aggiornamento massimale (2,5 %), validità dei blocchi accorciati: [Ipotesi], da regolare con l'uso.
- `checkin_14gg` (Likert): non implementare nella prima versione.

## 14. Ordine di lavoro per Code
1. **Motore puro + test** (nessuna UI): `energia.ts` (BMR, TDEE, deficit, macro, tetti), `preservazione.ts` (trasformazione + sequenza cicli), `ricalcolo.ts` (massimale da peso/ripetizioni), estensione di `pianificatore.ts` a tappe.
2. **Dati e UI**: tipi, store, onboarding "Obiettivo + energia", "Cambia obiettivo", schermata Energia, Check-in con circonferenze, tocco sforzo.
3. **Coach**: regole di §8 e avvisi con il "perché".
4. **Tipo di serie `back_off`** (solo dati e visualizzazione), disponibile nei programmi personalizzati.
Prima di iniziare: **riassumi il piano in 10 righe** e segnala ogni conflitto con il codice esistente. Verifica con test e con l'app aperta in un browser headless prima di dichiarare finito.

## 15. Cosa NON fare
Niente contacalorie né pasti; niente HIIT o cardio tracciato; niente tabelle nuove per la Preservazione; niente back-off nei Blocchi 1–3; niente aumenti forzati finché non si vedono le note; niente dati inventati per Anno 2–3; niente testi copiati.
