# SPEC_PIANIFICATORE — Obiettivi, bilancio energetico e moduli di programma (Frappaula Fit)
Versione 2 · 28/10/2026 (dopo le prove sull'app) · per Claude Code. Sostituisce la v1 (già consegnata): le modifiche sono elencate in §0b. Lingua dell'app e dei testi: italiano.
Etichette come in `SPEC.md`: **[Certo]** dedotto da dati/libro/video, **[Probabile]** inferenza forte, **[Ipotesi]** scelta nostra da verificare, **[Utente]** deciso da Francesco, **[Mia decisione]** scelta da trainer delegata.
Fonti: `Libro` = Project Bodybuilding (note in `docs/note_elaborate/cap*.md`), `Schoenfeld` = *Science and Development of Muscle Hypertrophy*, 2ª ed. (2021), `Video` = app di riferimento (test, Fase 1–3, Scarico, guide "Gestione carichi" e "Tecnica Back off"), `Doc` = report "Basi scientifiche" (fonte secondaria, poco affidabile: usare solo dove indicato).

## 0. Ambito e rapporto con il codice esistente
- Questa spec **estende** `SPEC.md` §3 (struttura), §14 (coach) e **sostituisce §15** (pianificatore). In caso di conflitto su obiettivo, energia, pianificatore e passaggio tra programmi **prevale questo file**. Per tutto il resto (generatore sedute, test, tabelle dei Blocchi 1–3, persistenza carichi §9.2b) resta valido `SPEC.md`.
- **Il codice esistente non va riscritto.** Esistono già: `Obiettivo = 'massa' | 'mantenimento' | 'definizione'` in `tipi.ts` (solo dato), `motore/pianificatore.ts` (solo blocchi completi/accorciati), `data/regole_coach.ts` (struttura), `data/blocco1–3.ts`, `motore/correnti.ts`, `Setup.tsx`. Si **estendono**; i test esistenti devono restare verdi.
- **Fuori ambito di questo file:** profilo e programma della moglie (ora in §12b e §12c), Anno 2–3 del programma di riferimento (esercizi e tabelle non ancora noti), Blocco 4. Il **sesso** però è un input (serve alle formule).
- Il nome interno `definizione` resta (tipo esistente); nell'interfaccia l'etichetta è **"Dimagrimento"**.

## 0b. Cosa cambia nella v2 (da applicare al codice già scritto)
1. **Home:** la barra di progresso mostra le **sedute completate su totali** (es. "1/28"); via le etichette 77/82/S (§11).
2. **Testate:** in Preservazione "Preservazione · Ciclo 3 di 6", mai "Blocco 1 · Fase 1" (§11).
3. **Sequenza cicli Preservazione:** con 6–7 cicli lo scarico va in fondo (§4.4).
4. **Test dei fondamentali:** campo opzionale "ripetizioni di riserva"; verificare che 60 kg × 3 dia **63,5** con passo 0,5 (l'utente ha visto 63) (§7.4).
5. **Serie minime e scala per tempo** (§4.7): sostituisce `SPEC.md` §4.4 "Riempimento".
6. **Preservazione rivista** (§4.3): niente "serie −1"; stessa struttura e stesse serie del blocco, senza tecniche. Sostituisce l'idea di un taglio del 30 %.
7. **Durata:** T (60') è un **tetto**, non un obiettivo; l'app non accorcia oltre T (§4.7).
8. **Mini calcolatore TDEE** con passi e allenamenti (§3.1): sostituisce il fattore di attività 1,55.
9. **Anteprima di tutte le sedute future e modalità prova** (§11b): sostituisce "sedute future non avviabili" di `SPEC.md` §3 e §12 punto 2.
10. **Piano per esercizio** per controllare le progressioni (§11b).
11. **Restyle grafico** (§11c): direzione scelta (bozza A + griglia dei cicli), con icone-pittogramma degli esercizi.

## 1. Il ragionamento in una pagina [Mia decisione]
Quando l'utente entra (primo avvio, reset dati, o "Cambia obiettivo") l'app decide **in questo ordine**:
1. **Che obiettivo hai?** Massa · Mantenimento · Dimagrimento. **Per quanto tempo?** 3 · 6 · 9 · 12 mesi (minimo 3; vedi §12c)
2. **Stato energetico: non si chiede** [Utente, 29/10]. Discende dall'obiettivo (Massa = surplus, Mantenimento = calorie di mantenimento, Dimagrimento = deficit) e serve solo al calcolatore opzionale di §3 e alle regole del coach sul peso. Il principio resta il fondamento della Preservazione: in deficit la sintesi proteica cala (−19 % con deficit del 20 %; −27 % con ~500 kcal per 5 giorni) e l'allenamento la riporta solo ai valori di riposo [Certo, Schoenfeld cap. 9], quindi **in deficit l'allenamento serve a mantenere il muscolo**.
3. **Cosa so già di te?** Carichi e massimali nel profilo (§7). Se ci sono, **nessun nuovo test** passando da un programma all'altro.
4. L'app sceglie il **modulo** (§4) e costruisce la sequenza di **cicli** (§5–§6) per la durata richiesta, mostrando il "perché" in una riga.
5. Ogni settimana il **coach** (§8) legge peso, carichi e sforzo e propone (non impone) aggiustamenti.

| Obiettivo | Energia (derivata) | Modulo di allenamento |
|---|---|---|
| Massa | surplus | **Ipertrofia con forza** (blocchi di riferimento, come oggi) |
| Mantenimento | calorie di mantenimento | **Ipertrofia accorciata** (Test/rientro + Fase 1 + Fase 2 + Scarico), senza Fase 3 e senza tecniche avanzate |
| Dimagrimento | deficit | **Preservazione** (§4.3): intensità alta, struttura e serie invariate, senza tecniche avanzate |

**Nessun avviso di coerenza obiettivo/energia** (campo rimosso). Chi si allena da poco può comunque migliorare la composizione a calorie di mantenimento (ricomposizione, Libro) [Probabile].

## 2. Dati da raccogliere (onboarding e Impostazioni)
Esistenti: nome, sesso, N giorni/settimana (**default 4 uomo, 3 donna**), durata seduta, priorità, esclusioni, esperienza, preset. **Nuovi:**
- Età, altezza (cm), peso (kg), % grasso (opzionale).
- **Passi al giorno** (stepper da 1.000 in 1.000) e **allenamenti a settimana**: sostituiscono il livello di attività (§3.1).
- **TDEE noto** (opzionale): "L'ho misurato con 10–14 giorni di conteggio calorie a peso stabile" → prevale sulla formula (Libro, cap. 2 §2.3).
- Obiettivo, durata in mesi 3/6/9/12 (§12c; l'app la converte in sedute), **kg da perdere/prendere** (opzionale), flag **"Allenare anche la resistenza"** (§4.5).
- Mai chiedere cose non usate: se l'utente salta la parte energia, l'app funziona lo stesso (solo allenamento, nessun calcolo calorico).

## 3. Modulo Energia (calcolatore, opzionale) [Libro + Schoenfeld]
**Ambito:** calcolo e controllo del bilancio energetico. **L'app non è un contacalorie e non propone pasti.** Le indicazioni sono generali, non una dieta personalizzata (una riga di avviso, non un discorso). Il Libro rimanda a un professionista con BMI > 29: mostrare quella riga una volta, chiudibile.

### 3.1 TDEE — mini calcolatore con passi e allenamenti [Utente, 28/10]
**Input:** peso (kg), altezza (cm), età, sesso, **passi al giorno** (stepper da 1.000 in 1.000, da 1.000 a 30.000, default 8.000; vanno inseriti i passi **reali**, non l'obiettivo), **allenamenti a settimana** (0–7, default N), durata seduta (default T, modificabile). Opzionali: % di grasso, TDEE misurato.
**Modello:**
1. **BMR:** Mifflin-St Jeor. Uomo = 10·kg + 6,25·cm − 5·età + 5; donna = … − 161. Se è nota la % di grasso: Katch-McArdle = 370 + 21,6 × massa magra (kg). [Mifflin è la più validata per adulti sani: Frankenfield 2005, circa 8 su 10 non obesi entro ±10 % del misurato; Probabile, non riverificato in questa sessione]
2. **Vita quotidiana senza camminare:** +10 % del BMR [Probabile].
3. **Passi:** `passi × (0,415 × altezza_m) × 0,5 × kg / 1000` kcal. Costo netto della camminata ≈ 0,5 kcal/kg/km (Compendium of Physical Activities) [Probabile].
4. **Allenamento:** `sedute_a_settimana × 3,5 × kg × (durata_min/60) / 7` kcal al giorno (3,5 MET·h netti a seduta) [Ipotesi].
5. **TDEE = (BMR + vita quotidiana + passi + allenamento) × 1,10** (effetto termico del cibo, 10 %, come nel Libro cap. 2).
**Mostrare:** BMR, TDEE e, accanto, la regola del Libro (kg × 32–34 uomo, × 30–32 donna; valida solo fino a ~12–15 % di grasso U / 22–24 % D). **Precedenza:** TDEE misurato (10–14 giorni di conteggio calorie a peso stabile) > modello. L'errore tipico è ±10–15 %: il valore si corregge con l'andamento del peso (§3.4).
**Esempi (test, tolleranza ±1):** uomo 80 kg, 180 cm, 30 anni, 4 sedute da 60': 4.000 passi → **2461**; 8.000 → **2593**; 12.000 → **2724**. Donna 55 kg, 165 cm, 30 anni, 8.000 passi, 4 sedute → **1824**.

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
Come oggi: Test → Fase 1 → Fase 2 → Scarico → Fase 3 (17 cicli per il blocco intero; con durate diverse si compone secondo §6b), Blocchi 1, 2, 3 = Anno 1. Test a inizio di ogni blocco (come l'app di riferimento) **salvo** che l'utente arrivi da un altro modulo con carichi recenti (§7.4). Il coach **propone** soltanto; non riscrive le tabelle del blocco.

### 4.2 Mantenimento [Utente, 29/10: base Blocchi 1 e 2]
- **Base:** dati dei **Blocchi 1 e 2** (non il Blocco 3, che è il blocco di definizione: ebook 3 p.22). Sequenza: [Rientro o Test se serve] + Fase 1 + Fase 2 + Scarico, cioè circa 12 cicli (1 + 5 + 5 + 1) con la logica già esistente di `bloccoAccorciato`. Fase 3 assente. Quale dei due blocchi: il Blocco 1 per default, il Blocco 2 come alternativa selezionabile (gruppi per giorno diversi). [Ipotesi]
- **Carichi:** `fattore_lavoro` 0,9 **anche nel Blocco 1** [Certo, 29/10: verificato con massimali reali, §6.3 di `SPEC.md` e `docs/note_elaborate/BLOCCO1_verifica.md`]: carico = 0,9 × 1RM × (37 − n)/36, cioè sul fondamentale primario Fase 1 = 70 % (cicli 1–3) poi 75 %, Fase 2 = 75 %, Scarico = 65 %, Fase 3 = 80 % poi 85 % (es. 1RM 100 → 70 / 75 / 65 / 80 / 85 kg). Fondamentale in seconda esposizione (ruolo L, giorno C/D): 65 % Fase 1, 70 % Fase 2, 60 % Scarico, 70 % poi 75 % Fase 3. Progressione a gradini come nei dati del blocco (ciclo 1=2; ciclo 3 +1 rip/serie; ciclo 4 +carico; ciclo 5 = 4).
- **Tecniche avanzate (seconda riga ×12, rest-pause `1×40`/`1×10`, serie senza bilanciere):** esistono nei dati solo nel Blocco 3. Nel Mantenimento sono un'**opzione attivabile** `tecniche_avanzate` (default **off**) in Impostazioni → Allenamento. Se attiva, si applicano solo agli isolamenti e ai Target secondari, con le righe del Blocco 3 corrispondenti; mai ai fondamentali. [Ipotesi: prove deboli, Schoenfeld]
- Lunghezza adattata alla durata richiesta con `bloccoAccorciato`. [Ipotesi]

### 4.3 Preservazione (Dimagrimento) [Libro Shred + Schoenfeld; v2]
**Principio:** mantenere intensità e struttura, evitare fatica inutile. Non si taglia il volume a priori: in definizione il Libro tiene le serie settimanali per gruppo vicine a quelle delle altre fasi (tab. 10.21: petto 16,5, dorso 14,0, spalle 13,5, braccia 12,0, gambe 15,5) e abbassa invece fondamentali e novità [Certo, `cap10.md`]. Il −30–50 % del `Doc` non è adottato (fonte debole). Si ricava dai dati del blocco in corso (default **Blocco 3**):
- **Fondamentali** (panca, squat, stacco): % del massimale vigente, mai a cedimento. Ciclo "77": **3×5 @77 %**; ciclo "82": **3×4 @82 %**. Mai sotto 3 serie.
- **Target e complementari:** **serie e ripetizioni del blocco di riferimento** (nessuna serie tolta); carico = `carico_corrente` del profilo; ripetizioni come Fase 1 nel ciclo "77" e come Fase 2 nel ciclo "82" (reps test −2, poi +1).
- **Addome:** invariato.
- **Tolti:** seconda riga Target ×12, rest-pause (`1×40`, `1×10`), back-off, stripping, drop set.
- **Scarico:** come lo Scarico del blocco di riferimento, senza modifiche.
- **Tempo:** si applica la scala di §4.7 se la durata stimata supera T. Il coach può proporre di ridurre il volume solo se i carichi calano (§8, `trend_carichi`).
- **Preferenze:** opzione `preferisci_macchine` (default **off**; consigliata se la forza cala > 10 % o in "definizione estrema"): sostituisce i multiarticolari liberi non fondamentali con l'alternativa guidata della stessa classe (Libro, Shred).
- **Verifica:** Code riporta (non assume) il totale di serie a settimana prima/dopo la trasformazione sul Blocco 3 W1 (97 serie nel riferimento).

### 4.4 Sequenza dei cicli della Preservazione
Dati N cicli (≥ 3), lo scarico cade **ogni 5 cicli** (4 di lavoro + 1 di scarico) e **chiude il programma** se N ≥ 4. Regola:
- Posizioni candidate: 5, 10, 15, …; uno scarico intermedio **salta** se dopo di lui restano 1 o 2 cicli (si allunga il tratto di lavoro e lo scarico va in fondo).
- Se N ≥ 4, l'ultimo ciclo è scarico.
- Primo ciclo del programma o dopo uno scarico = "77"; gli altri = "82". **Le etichette 77/82 sono interne: non si mostrano** (§11).
Esempi (test): `N=3 → [77,82,82]` · `N=4 → [77,82,82,S]` · `N=5 → [77,82,82,82,S]` · `N=6 → [77,82,82,82,82,S]` · `N=7 → [77,82,82,82,82,82,S]` · `N=8 → [77,82,82,82,S,77,82,S]` · `N=11 → [77,82,82,82,S,77,82,82,82,82,S]`.
Il ritmo "4 + 1" viene dalle indicazioni di scarico in deficit (3–5 settimane; Schoenfeld 3:1 come punto di partenza) [Probabile]; il coach può anticipare lo scarico (§8).

### 4.5 "Allenare anche la resistenza" (opzione, default off) [Ipotesi]
Aggiunge, come **ultimo esercizio di ogni seduta**, un complementare su macchina/cavo con **2 serie da 15–20 ripetizioni** a carico = `carico_testRM × (37 − 15)/(37 − RM_test)` (Brzycki, stesso modello del test) arrotondato al passo dell'attrezzo. Base: Schoenfeld (carichi leggeri, ≥ 30 % del massimale, vicino al cedimento, allenano Tipo I e capacità tampone). Non cambia fondamentali né Target.

### 4.6 Tecniche (tipi di serie) — ciò che il motore deve saper rappresentare
- `rest_pause` con varianti `totale_reps` ("fai 40 ripetizioni usando il carico del test") e `10_piu_3` ("10 ripetizioni a carico leggermente ridotto + 3 serie al massimo con pause di 30, 40, 50 secondi; recupero 90"). [Certo, Video] Già in `blocco3.ts`; permesso **solo su isolamenti/macchine**; mai su fondamentali liberi [Ipotesi]. Evidenza scarsa (Schoenfeld): resta opzionale.
- `esclude_bilanciere` (multipower: il peso inserito esclude il bilanciere). [Certo, Video]
- `drop_set`: solo ultima serie, macchine, −20 % [Schoenfeld]; **non** inserito nelle tabelle del Blocco 1–3.
- **`back_off`** (Anno 2 e programmi personalizzati): `serie_pesanti` (es. 2×7 al carico X) seguite da 1–2 serie **al massimo** a −10/−20 % (esempio dal video: T-bar 2×7@50 + 1×max@40; poi 2×7 + 1×max −10 % + 1×max −10 %). Arrotondamento libero; manubri a passi di 2/2,5 kg (14 −20 % = 11,2 → 12 o 10; se con 10 si fanno 15–20 ripetizioni, usa 12). La nota nella serie indica la tecnica. [Certo, Video]
  - Libro (TS-BO): 1 top set (RIR 1–3) + 4 serie a ×0,85, stesse ripetizioni; per principianti/intermedi con carichi moderati. [Certo, Libro; è l'**unica fonte** teorica: Schoenfeld non lo tratta]
  - **Regola di posizionamento [Ipotesi]:** mai in Fase 1 né nello Scarico; in Fase 2 solo su Target a macchina; in Fase 3 sui fondamentali senza cedimento a −10/−15 %; **quasi mai nella Preservazione**. **Non va inserito nelle tabelle dei Blocchi 1–3** (l'app di riferimento non lo usa nel primo anno): serve solo come tipo di serie + opzione nei programmi personalizzati.

### 4.7 Serie minime e adattamento al tempo (tutti i moduli) [Utente + Mia decisione]
**T è un tetto (default 60'), non un obiettivo.** Se la durata stimata ≤ T non si tocca nulla e non si aggiunge nulla: se l'utente vuole accorciare, riduce i recuperi. Il programma letto dai video non si taglia mai in anticipo: solo avviso se la durata supera T (già così nel generatore).
**Regole fisse:** Target e fondamentali **mai sotto 3 serie** (le tabelle di progressione partono da 3). Bicipiti e tricipiti possono scendere a 2 serie. Addome invariato.
**Scala di riduzione**, solo se durata stimata > T, un passo alla volta fino a rientrare:
1. I **complementari dei gruppi dal secondo in poi** della seduta scendono a 2 serie (partendo dall'ultimo gruppo); il primo gruppo della seduta resta a 3.
2. Si toglie il **complementare meno prioritario** di un gruppo (da 3 a 2 esercizi) e i complementari rimasti di quel gruppo tornano a 3 serie.
3. Mai sotto 2 esercizi per gruppo grande.
Sostituisce `SPEC.md` §4.4 "Riempimento". Stima durata come ora (`durataStimata`: 8' riscaldamento + serie × (45 s + recupero)).

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

## 6b. Piano su misura per durata [Utente, 29/10] (estende §6)
**Principio:** i blocchi di riferimento (Test → Fase 1 → Fase 2 → Scarico → Fase 3, 17 cicli) sono una **linea guida**, non un vincolo. I 17 cicli non sono una scelta nostra: vengono dall'app di riferimento (4+20+20+4+20 = 68 sedute). **La durata richiesta decide la struttura**; un piano può avere più di un blocco, o meno di un blocco intero. Le sedute sono sempre **4 per ciclo** (A–D) [Utente]. Il generatore **non inventa schemi serie×ripetizioni**: ricompone solo i mattoni validati dei blocchi (Test T, Fase 1 = F1 volume, Fase 2 = F2 ripetizioni, Scarico S, Fase 3 = F3 intensità), accorciandoli con la stessa regola dei gradini (ciclo 1 = ciclo 2; gradino al ciclo 3; gradino al ciclo 4; ciclo 5 = 4). Fase minima: F1 e F2 ≥ 2 cicli, F3 ≥ 3.

### Massa: composizione per durata (R = cicli senza il Test; il Test dura 1 ciclo e si omette se i carichi sono nel profilo, §7.4)
- **R ≤ 5:** solo F1 (troncata a R cicli); nessuno scarico.
- **6 ≤ R ≤ 11:** F1 + F2 + S. Cicli di lavoro w = R−1; F1 = min(5, ⌈w/2⌉), F2 = w−F1. (Due stimoli diversi + scarico finale: è il caso "due mesi prima dell'estate" = D 8 → T F1×3 F2×3 S, oppure senza Test F1×4 F2×3 S.)
- **12 ≤ R ≤ 16:** F1 + F2 + S + F3. w = R−1; F3 = min(5, max(3, ⌊w/3⌋)); r = w−F3; F1 = min(5, ⌈r/2⌉), F2 = r−F1. R=16 = blocco di riferimento intero (5·5·1·5).
- **R ≥ 17:** blocco intero (16) + **scarico di chiusura** + **nuovo Test** + blocco successivo, con i dati dei Blocchi nell'ordine 1 → 2 → 3 → 1 [Utente: "dopo il Blocco 3 scarico, nuovo test, si riparte dal Blocco 1"]; l'ultimo blocco si accorcia con le regole sopra.
- **Variazione:** a ogni cambio di fase il generatore cambia, come nei dati di riferimento, la maggior parte dei complementari con un **equivalente** della libreria (§14b, `LIBRERIA_ESERCIZI.md`); i fondamentali non cambiano. Nei piani con una sola fase, a metà fase i complementari possono ruotare su richiesta dell'utente.
- Esempi verificati (T incluso): D=4 `T F1×3` · D=8 `T F1×3 F2×3 S` · D=12 `T F1×5 F2×5 S` · D=13 `T F1×4 F2×4 S F3×3` · D=17 `T F1×5 F2×5 S F3×5` · D=18 aggiunge `S` · D=20 `… S T B2 F1`.

### Mantenimento
Stessa composizione **senza F3**; dopo 11 cicli (F1×5 F2×5 S) si ripete con il blocco successivo (Blocco 1 → Blocco 2 → …) e un Test breve solo se il profilo carichi è vecchio (§7.4). Opzione `tecniche_avanzate` come §4.2.

### Preservazione
Invariata (§4.3–§4.4).

### Interfaccia
Nel passo "Durata" l'utente scrive i cicli (o le settimane): l'anteprima mostra la **composizione** ("5 volume · 4 ripetizioni · scarico"), il totale di sedute e la durata in calendario, con il "perché" in una riga. Dalla scheda "Piano" (§11b) si vedono già tutte le progressioni.

### Parte aperta
Il Blocco 3 è il blocco di definizione (ebook 3): nel modulo Massa, l'ordine 1 → 2 → 3 → 1 voluto dall'utente lo include. Il coach segnala una volta che i Target/tecniche del Blocco 3 sono pensati per il deficit. [Ipotesi]

## 6c. Algoritmo di costruzione del programma [Utente, 29/10]
Il pianificatore è una **funzione pura e deterministica** (stessi input → stesso piano, testabile) che attraversa questi passi nell'ordine e registra per ciascuno il "perché" in una riga:
1. **Obiettivo + durata** (§1; l'energia ne discende, §3) → modulo (§4) e **struttura in fasi** (§6b).
2. **Esperienza** (principiante < 1 anno · intermedio 1–3 · avanzato > 3): decide se serve il Test (i principianti possono partire dal carico di una serie di prova), il punto di partenza del volume (principiante: i valori bassi dell'intervallo) e il ritmo degli scarichi.
3. **Intensità desiderata** (nuovo parametro, 3 livelli; vedi tabella). Modifica solo **serie, istruzione di sforzo, tecniche e scarichi**; **non tocca le percentuali di carico** dei dati validati.
4. **Priorità muscolari** (0–2 gruppi): +1 serie ai loro Target e complementari (massimo 20 serie/settimana per gruppo, 12–20 per principianti ≤ 12) e posti **all'inizio della seduta** (Schoenfeld). Gli altri gruppi restano ai valori del blocco.
5. **Tempo per seduta T** → scala di §4.7.
6. **Libreria esercizi** (§14b): scelta degli esercizi per slot, esclusioni dell'utente, rotazione dei complementari a ogni fase.
7. **Coach settimanale** (§8) che propone aggiustamenti leggendo carichi, sforzo e peso.

| Intensità | Sforzo richiesto (RIR) | Serie rispetto al blocco | Tecniche (§4.2) | Scarico |
|---|---|---|---|---|
| **Moderata** | tutte le serie a 2–3 ripetizioni dal cedimento; nessun cedimento | −1 serie sui complementari (min 2), Target e fondamentali invariati | off | come il blocco |
| **Standard** (default) | come i blocchi: 1–2 RIR, cedimento solo sull'ultima serie dei Target/isolamenti | invariate | off (opzione) | come il blocco |
| **Alta** | come Standard, cedimento anche sull'ultima serie dei complementari; fondamentali mai a cedimento | invariate, +1 serie solo sui gruppi prioritari | on, solo isolamenti | anticipabile dal coach se i carichi calano (`trend_carichi`) |

[Ipotesi] Le tre righe sono una **nostra costruzione** su criteri di Schoenfeld (sforzo 1–2 RIR con cedimento sull'ultima serie, 10–20 serie/settimana, più cura sui multiarticolari): l'app di riferimento mostra un solo profilo. Per questo la tabella cambia solo parametri documentati e mai i carichi. L'intensità vale per Massa e Mantenimento; in Preservazione agisce solo sulle istruzioni di sforzo (i fondamentali restano al 77/82 %).

### Nuove domande in Setup (oltre a obiettivo e durata)
Esperienza · Intensità desiderata · Priorità muscolari (opzionali) · Esercizi da escludere (elenco dalla libreria). Giorni a settimana: **sempre 4** [Utente]. Attrezzatura: **completa** [Utente]; resta l'elenco delle esclusioni.

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
- **Test dei fondamentali con riserva (RIR):** campo opzionale "ripetizioni di riserva" (0–4, default 0 = cedimento). `reps_effettive = reps + RIR`, poi Brzycki. Esempi (passo 0,5): 60 kg × 3, RIR 0 → **63,5**; RIR 2 → 60·36/(37−5) = **67,5**. La stima è affidabile con 3–5 ripetizioni (Libro: con 10–15 molto meno; Schoenfeld: le formule sono approssimazioni).
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
interface DatiCorporei { sesso: 'M'|'F'; eta: number; altezzaCm: number; pesoKg: number; bfPct?: number; passiGiorno: number; allenamentiSettimana: number; durataSedutaMin?: number; tdeeEmpirico?: number; }
type StatoEnergetico = 'deficit' | 'mantenimento' | 'surplus';
type Modulo = 'test'|'rientro'|'ipertrofia'|'mantenimento'|'preservazione'|'scarico';
interface Tappa { modulo: Modulo; obiettivo: Obiettivo; cicli: number; energia: StatoEnergetico /* derivato dall'obiettivo, non chiesto */; ciclo77o82?: (77|82|'S')[]; }
interface ObiettivoAttivo { tipo: Obiettivo; dal: string; kgTarget?: number; resistenza?: boolean; preferisciMacchine?: boolean; kcalTarget?: number; macro?: { p: number; g: number; c: number }; }
interface CheckIn { data: string; pesoKg: number; vitaCm?: number; braccioCm?: number; cosciaCm?: number; }
profilo_carichi: Record<string, { massimale?: number; caricoCorrente: number; data: string; origine: 'test'|'manuale'|'ricalcolo' }>;
```
(Usare i nomi del codice esistente dove coincidono: `correnti`, `Obiettivo`.)

## 11. Interfaccia
- **Setup / "Cambia obiettivo"**: passi §2; anteprima con piano a tappe, serie/gruppo/settimana, durata in cicli e in calendario, e il "perché" della scelta.
- **Energia** (Impostazioni → Energia): mini calcolatore di §3.1 (passi con stepper da 1.000, allenamenti a settimana, età, altezza, peso, sesso), BMR, TDEE (modello e regola del Libro), calorie obiettivo, macro in grammi; campi sovrascrivibili.
- **Check-in**: peso (con media settimanale e grafico), circonferenze opzionali.
- **Home / Percorso:** la barra di progresso mostra **"completate/totali"** (es. "12/28") con una barra continua sottile; **nessuna etichetta 77/82/S**. Sotto il titolo: modulo e ciclo ("Preservazione · Ciclo 3 di 6"; per Massa "Blocco 1 · Fase 2 · Ciclo 3"). In Preservazione **mai** "Blocco 1 · Fase 1" nella testata della seduta.
- **Seduta**: sull'ultima serie, tocco "Facile / Giusto / Al limite"; nei test dei fondamentali, campo "ripetizioni di riserva". Durata stimata in testata (come ora).
- Tutti i testi in italiano, regole riscritte con parole nostre.

## 11b. Anteprima, modalità prova e vista progressioni [Utente, 28/10]
- **Ogni seduta del piano è apribile** dal Percorso, anche futura. Una seduta futura si apre in **anteprima** (banner "Anteprima: non ancora in programma") con esercizi, serie×ripetizioni@kg previsti e recuperi. I kg futuri sono calcolati con i carichi correnti di oggi e **si aggiornano** se cambiano (nota in piccolo). Aprire un'anteprima non modifica nessun dato.
- **Modalità prova** (Impostazioni; **attiva di default in questa fase di collaudo**, da spegnere poi): permette di **avviare e completare qualsiasi seduta fuori ordine**. Il "prossimo allenamento" resta la prima seduta non completata. Le sedute fuori ordine aggiornano carichi correnti, autocorrezione e ricalcolo come quelle vere, quindi servono **"Annulla seduta"** (azzera i dati della seduta e ripristina i carichi correnti precedenti) e **"Azzera dati di prova"** (ripristina carichi e massimali all'ultimo test). Con la modalità prova spenta, "Inizia" è disattivato sulle sedute future. [Ipotesi]
- **Piano per esercizio** (nuova scheda "Piano" in Progressi): scegliendo un esercizio si vede, per **tutti i cicli del programma**, la riga `serie×rip @kg` prevista (e quella fatta, se c'è), con **evidenziate le variazioni** rispetto al ciclo prima (carico, serie, ripetizioni). Vale per fondamentali, Target e complementari, in tutte le tappe. Serve a verificare a colpo d'occhio che le progressioni siano giuste.

## 11c. Restyle grafico [Utente, 28/10; direzione scelta]
**Solo aspetto: nessuna modifica a logica, dati, rotte o test.** Obiettivo: layout più pulito, elegante e rifinito, stesso tema scuro e accento arancione, nessuna copia di grafica, testi o immagini dell'app di riferimento. Direzione: **"A · Pulita"** (righe sottili, tipografia grande, niente riquadri inutili) con la **griglia dei cicli** della bozza "C · Registro" al posto della barra di progresso. [Mia decisione: Francesco ha approvato le bozze senza indicare la variante; se vuole B o C la sostituzione riguarda solo questa sezione.]

### Token (aggiungi a `stile.css`, tieni quelli esistenti)
- Colori invariati: `--sfondo #0e0f11`, `--carta #17181b`, `--carta2 #202226`, `--bordo #2a2c31`, `--testo #f3f4f6`, `--testo2 #a9adb5`, `--accento #f0761e`, `--verde #3ccf7a`. Nuovi: `--filo #1f2125` (separatore tra serie), `--accento-testo #140a02` (testo scuro su fondo arancione), `--verde-sfondo #12281c`.
- Font: Barlow (testo) e Barlow Condensed (titoli e numeri grandi, peso 700). Eyebrow (etichette sopra i titoli): 12 px, peso 600, maiuscolo, spaziatura 0,18em.
- Scala: titolo Percorso 60 px condensed; titolo Seduta 44 px; numero grande contatore 40 px; nome esercizio 17–18 px peso 600; meta 13–14 px `--testo2`.
- Raggi: blocco prossima seduta 18 px, controlli 10–12 px, pulsante principale 12–14 px. Aree toccabili ≥ 44 px. Contrasto testo ≥ 4,5:1 (vale anche per le etichette piccole grigie).
- Nessun gradiente decorativo, nessuna emoji, icone solo a tratto (stroke 1,7–1,8, estremi arrotondati).

### Percorso (Home)
1. Barra alta: nome app a sinistra in condensed grigio; a destra, se attiva, pastiglia **PROVA** (§11b) e pulsante impostazioni.
2. Testata: eyebrow con il modulo ("PRESERVAZIONE"), sotto il titolo grande **"Ciclo 3 di 6"** (Massa: "Blocco 1 · Fase 2 · Ciclo 3"), poi una riga grigia (obiettivo e sedute per ciclo).
3. Contatore: **"9 / 24 sedute completate"** (numero grande + testo grigio).
4. **Griglia dei cicli** (sostituisce la barra a segmenti): una riga per ciclo (etichetta C1…Cn), una cella per seduta, numerata. Cella completata = piena arancione con numero scuro; **prossima** = bordo arancione 2 px; futura = `--carta` con numero grigio; cicli di scarico = celle `--verde-sfondo` con testo verde. La riga del ciclo corrente ha l'etichetta in grassetto. Ogni cella è un pulsante: apre la seduta (le future in anteprima, §11b). Con **più di 8 cicli** (Massa, 17 cicli) la griglia mostra solo il ciclo corrente e un link "Tutto il piano" (barra continua sottile come ora + elenco). [Ipotesi]
5. **Blocco "Prossima seduta"**: fondo arancione, testo scuro: eyebrow, "Seduta 2", gruppi muscolari, "21 serie · circa 56 min", pulsante pieno scuro "Inizia seduta".
6. Elenco "Questo ciclo": righe con filo sottile; cerchio con spunta (fatta, con data), cerchio con punto arancione (prossima, "Oggi"), cerchio vuoto (futura, "Anteprima").
7. Barra di navigazione in basso: **le stesse voci che ci sono oggi**, solo rifinite (icona + etichetta 11 px, attiva in arancione, filo sopra).

### Seduta
1. Testata: indietro, eyebrow "PRESERVAZIONE · CICLO 3" in arancione, titolo "Seduta 2", riga grigia con gruppi e durata, barra sottile **"3 / 21 serie"**.
2. Gruppo muscolare = eyebrow grigio sopra un filo. Ogni esercizio = riga con **icona (vedi sotto)**, nome, a destra l'etichetta del tipo in testo (FONDAMENTALE arancione; TARGET e COMPLEMENTARE grigi, con parole intere), sotto la riga meta "3 × 5 · 72,5 kg · recupero 3 min".
3. L'esercizio in corso è **espanso**: una riga per serie. Fatta = cerchio arancione con spunta + "72,5 kg × 5"; corrente = cerchio con bordo arancione, e due controlli con − / + per peso e ripetizioni (area ≥ 44 px, passo di arrotondamento già in uso). Le altre righe restano compatte.
4. **Barra fissa in basso:** a sinistra "RECUPERO" e il tempo in condensed 38 px; a destra il pulsante pieno arancione "Serie fatta". Il tocco "Facile / Giusto / Al limite" dell'ultima serie (§11) resta com'è, solo riadattato.
5. Anteprima di sedute future (§11b): stesso layout in sola lettura, banner in testa, senza barra "Serie fatta".

### Icone degli esercizi [Utente: "se si trovano micro immagini, sagome dell'esercizio"; Ipotesi sulla fattibilità]
- **Niente immagini scaricate dal web né dall'app di riferimento** (diritti). Solo **pittogrammi nostri in SVG**, monocromatici (`currentColor`), viewBox 24×24, a tratto, sagoma stilizzata del movimento. Dimensione 28 px accanto al nome (Seduta), 24 px nell'elenco "Piano" e nella scheda dell'esercizio.
- Una icona per **schema di movimento**, non per esercizio, così bastano circa 16: squat, pressa, stacco/cerniera d'anca, hip thrust, leg extension, leg curl, polpacci, spinta orizzontale (panca), croci, spinta verticale (military), alzate laterali, tirata verticale (lat machine/trazioni), rematore, curl bicipiti, tricipiti (pushdown/french press), addome. 
- In `esercizi.ts` aggiungi il campo opzionale `icona?: IconaId`. **Se manca**, si usa l'icona del gruppo muscolare; se manca anche quella, nessuna icona e la riga resta ben allineata (spazio riservato).
- Le icone sono un componente (`IconaEsercizio`) con un oggetto `IconaId → percorso SVG` in un file solo. Disegnale semplici: se una sagoma non viene leggibile a 24 px, usa l'icona del gruppo muscolare e **segnalamelo**; non è un blocco.

### Cosa NON cambia
Dati, motore, nomi delle voci del menu, flussi di Setup/Check-in/Energia (ricevono solo i token e i componenti sopra), regole del timer. Stesso comportamento su Android (Chrome PWA) e iPhone.

## 12. Test di accettazione (automatici, Vitest)
1. **TDEE (§3.1), tolleranza ±1:** uomo 80 kg, 180 cm, 30 anni, 4 sedute da 60': 4.000 passi → 2461; 8.000 → 2593; 12.000 → 2724. Donna 55 kg, 165 cm, 30 anni, 8.000 passi, 4 sedute → 1824. BMR uomo 1780, donna 1270 (±1). Con TDEE misurato inserito, vale quello.
2. **Deficit da obiettivo:** 80 kg, −2 kg in 4 settimane → **550 kcal/die** (0,625 %/sett: entro il tetto). −6 kg in 4 settimane → richiesti 1650 kcal/die; con tetto 1 % → massimo **880 kcal/die**, durata minima **8 settimane**.
3. **Macro (dimagrimento, uomo 80 kg, TDEE 2593, deficit 500 → 2093 kcal):** proteine 2,0 g/kg = 160 g (640 kcal); grassi 0,8 g/kg = 64 g (576 kcal); CHO = (2093 − 640 − 576)/4 ≈ **219 g**.
4. **Sequenza Preservazione:** `N = 3…8` e `N = 11` come in §4.4 (6 → [77,82,82,82,82,S]; 7 → [77,82,82,82,82,82,S]).
5. **Fondamentali in Preservazione:** squat 1RM 90 → ciclo "77" 3×5 @69,5; ciclo "82" 3×4 @74. Panca/stacco 1RM 101,5 → 78 · 83.
6. **Trasformazione sul Blocco 3, Fase 1 W1:** nessuna riga rest-pause, ×12 secondaria o back-off; **ogni esercizio mantiene le serie originali** (con T abbastanza alto); Target e fondamentali ≥ 3 serie.
7. **Scala per tempo (§4.7):** con T = 60' e una seduta stimata a 63' → prima i complementari dal 2° gruppo scendono a 2 serie; se ancora oltre T, si toglie un complementare e i rimasti tornano a 3 serie; **Target e fondamentali mai sotto 3**, bicipiti/tricipiti ammessi a 2; con durata ≤ T non cambia nulla.
8. **Cambio obiettivo senza test:** Massa → Dimagrimento a metà blocco: carichi del profilo invariati, sedute passate invariate, prima seduta nuova = ciclo ponte.
9. **Ciclo ≠ settimana:** con 3 sedute fatte in una settimana, la quarta è la prima della settimana dopo e la progressione per ciclo non cambia.
10. **Ricalcolo massimale:** panca 1RM 101,5; 5×85 completando le 5 ripetizioni → stima 95,6 (< vigente: nessun aggiornamento); 5×95 → 106,9 (≥ +2,5 %: aggiorna e ricalcola le % future).
11. **Test con RIR:** 60 kg × 3, RIR 0 → **63,5** (passo 0,5); RIR 2 → **67,5**.
12. **Anteprima:** aprire una seduta futura non cambia carichi né stato; in modalità prova on si può completarla fuori ordine, "Annulla seduta" ripristina i carichi precedenti.
13. **Piano per esercizio:** per la panca del Blocco 3 mostra i carichi per ciclo coerenti con 77/82/87 % e le variazioni evidenziate.
14. **Retrocompatibilità:** tutti i test esistenti (`blocco1–3`, `carichi`, `correnti`, `generatore`, `pianificatore`, `prescrizione`, `energia`) restano verdi, salvo quelli che codificavano regole sostituite dalla v2 (serie −1, sequenza con scarico al 5°, fattore 1,55): vanno **aggiornati, non cancellati**.

**Piano su misura (§6b):** test su `componiMassa(R)` e `compongoPiano(D, test)`: R=3 → `F1×3`; R=7 → `F1×4 F2×3 S`; R=10 → `F1×5 F2×4 S`; R=11 → `F1×5 F2×5 S`; R=12 → `F1×4 F2×4 S F3×3`; R=16 → `F1×5 F2×5 S F3×5`; D=18 con Test → `T B1 F1×5 F2×5 S F3×5 S`; D=26 → secondo blocco (Blocco 2) con Test dopo lo scarico di chiusura. Somma dei cicli = D in tutti i casi. Mantenimento senza F3.

## 12b. Profilo Donna: seduta ibrida classico + circuito PHA [Utente, 29/10; sostituisce SPEC.md §8 PROVVISORIO]

### Struttura
- **3 sedute fisse a settimana** (A–B–C); il **ciclo = 3 sedute**, non una settimana (§5). Rotazione A-B-C indipendente dal giorno.
- **Seduta ibrida** [Utente]: parte **classica** (fondamentale per primo, recupero pieno 2–3', progressione dei carichi) + parte **circuito PHA** (blocco raggruppato, vedi sotto). Il circuito non sostituisce la parte classica.
- **Dorso prioritario** ("aprire il dorso") [Utente]: presente in **tutte e 3** le sedute, almeno una trazione verticale + un rematore, circa 10–12 serie/settimana [Probabile]. Nessun fondamentale fisso per il dorso.
- Glutei: ogni seduta di gambe copre i tre stimoli (tag `stimolo_gluteo` nella libreria: **estensione / flessione / abduzione**), per non ripetere lo stesso.
- Test di inizio: **3 sedute di test** (non 4), stessa logica di §7.

### Bozza delle sedute (da rifinire con la libreria; esercizi indicativi)
- **S1 gambe + glutei con dorso**: classico = hip thrust, stacco rumeno; circuito = abduzione, lat machine, leg curl, pulley, core.
- **S2 parte alta, dorso per primo**: classico = trazione verticale, rematore, spinte; circuito = kick back, alzate laterali, abduzione.
- **S3 gambe + glutei con richiamo dorso**: classico = squat o pressa, split squat; circuito = gambe + dorso orizzontale.

### Circuito PHA (parametri dal materiale Gemini, adattati; i dati fisiologici di Gemini non sono verificati e non vanno in app)
- 5 stazioni tipiche, alternando alto/basso; **transizioni 20–30"**; **recupero a fine giro ~2'30"**; **10–15 RM con 1–2 RIR**. Un giro ≈ 8', tre giri ≈ 25'.
- Esercizi pesanti e multiarticolari restano nella parte classica.
- Nell'app è un **blocco raggruppato**: l'app elenca **2 o più esercizi** (tipicamente 5) e **lei sceglie quanti giri fare** (default 3, selezionabile 2–4). **Un timer per giro** (transizioni + recupero fine giro) e un contatore giri.
- Progressione: doppia progressione (ripetizioni nel range, poi carico) [Ipotesi].

### Obiettivo (due scelte per il suo profilo)
**"Dimagrimento"** oppure **"Mantenimento e costruzione muscolare"**. Si può cambiare in corsa senza rifare il test. Lo sforzo del circuito è **identico** (RIR 1–2, 10–15 RM): cambia solo la ripartizione del tempo.
- **Mantenimento e costruzione**: parte classica ≈ 30' con più serie; circuito ≈ 25' (3 giri, 4 opzionali).
- **Dimagrimento**: parte classica ≈ 25' con **meno serie ma carichi mantenuti** (proteggere la massa magra) [Probabile]; circuito fino a 4 giri con recuperi brevi; **niente tecniche di intensità estreme**.
- Tetto T = 60': con 4 giri la parte classica si riduce per restare entro il tempo.

### Cosa NON implementare dal materiale femminile
"Female Revolution Method" (infiammazione alta/media/bassa: n=12 autogestito, venduto come ebook), ramificazioni ginoide/androide, le percentuali di volume 20/30–40/40–50, le affermazioni fisiologiche di Gemini. Protocollo post-allenamento di 10' (camminata + gambe al muro): solo nota facoltativa.

### Catalogo tecniche (dal libro, solo su esercizi di isolamento)
Rest-pause, serie interrotta, myoreps, stripping di carico (**default −20%**, non −30%: il −30% non era verificato), stripping a ripetizioni fisse, 1.5 ripetizioni, tripla contrazione, picco di contrazione (2–10"), burns. **Limiti**: max 2 rest-pause/stripping consecutivi, max 3 esercizi per seduta con tecniche, tecniche posizionali 1–3 serie, burns a fine seduta. Il rest-pause del libro (15–20", stesso carico) è diverso da quello del Blocco 3.

## 12c. Impostazioni: durata, sedute per profilo, tema [Utente, 29/10]
- **Durata in mesi**, non in cicli: l'avvio chiede **3 · 6 · 9 · 12 mesi** (minimo 3). L'app converte in sedute: uomo 4/settimana (3 mesi ≈ 13 settimane ≈ 52 sedute), donna 3/settimana (≈ 39 sedute). I cicli si contano in sedute, non in settimane. Il testo di setup mostra la composizione risultante (§6b).
- **Sedute a settimana per profilo**: uomo 4, donna 3 (modificabile in Impostazioni).
- **Tasto tema** in Impostazioni: scuro / chiaro, salvato per profilo. Per il tema chiaro sostituire i colori fissi di `stile.css` con variabili: `.barra-seduta` (`rgba(14,15,17,0.96)`, ~r.886), barra di navigazione (`rgba(14,15,17,0.97)`, ~r.1010), ombre (`rgba(0,0,0,…)` r.962, 975, 1148), testo `#fff` dei pulsanti (r.279), `rgba(240,118,30,0.1)` (r.422).
- **Palette chiara**: `--sfondo #f4f4f2 --carta #fff --carta2 #eeeef0 --bordo #dadade --filo #e7e7ea --testo #16171a --testo2 #52555c --testo3 #6c6f77 --verde #1c9a58 --verde-sfondo #e2f4ea --giallo #a86d10 --rosso #d92b33 --rosso2 #c0262d`.
- **Accento per profilo**: uomo scuro `#f0761e / #ffa054 / #140a02`, uomo chiaro `#e0620d / #b34d08 / #1b0d03`; donna scuro (rosa tenue) `#e07a9f / #f2a6c0 / #1a0610`, donna chiaro `#d14f82 / #a83568 / #2a0a18` (accento / accento2 / accento-testo). Chip selezionati: accento a opacità 0,12. Nel tema chiaro `--accento-testo` resta scuro per leggibilità dei pulsanti.

## 13. Parti aperte (non inventare)
- Profilo moglie: scritto in §12b; aperti: esercizi del circuito per seduta (bozza), regola di progressione del circuito [Ipotesi], mapping dei due obiettivi nel codice.
- **Idea da tenere (NON ancora specificata):** misure corporee in cm configurabili (uomo: vita, petto, bicipite; donna: coscia, glutei, vita) con grafico nel tempo, in Impostazioni avanzate.
- Testo delle note sugli aumenti forzati in Fase 3 e sulle tecniche (back-off) dell'app di riferimento; Anno 2–3; esistenza del Blocco 4.
- Seconda riga Target ×12 del Blocco 3: nel video sembra un back-off ([Ipotesi]); resta serie normale a ×12.
- Se le percentuali 77/82/87 del Blocco 3 dipendono dalle ripetizioni del test.
- Soglie di `taratura_calorie`, `trend_carichi`, aggiornamento massimale (2,5 %), validità dei blocchi accorciati: [Ipotesi], da regolare con l'uso.
- `checkin_14gg` (Likert): non implementare nella prima versione.
- Valori del calcolatore TDEE (10 % vita quotidiana, 0,5 kcal/kg/km, 3,5 MET·h per seduta): [Probabile/Ipotesi], da tarare sul peso reale.
- Modalità prova: valutare se tenerla come opzione permanente o rimuoverla dopo il collaudo.
- Scala per tempo (§4.7): se l'utente vuole 3 serie ovunque (anche sui complementari), il passo 1 sparisce.

## 14. Ordine di lavoro per Code (aggiornamento v2)
Il codice della v1 esiste già (commit `d5983c2`): **applica la v2 come differenza**, non riscrivere. Prima di iniziare **riassumi il piano in 10 righe** e segnala i conflitti col codice.
1. **Motore + test:** `energia.ts` (nuovo modello TDEE §3.1), `preservazione.ts` (§4.3 senza serie −1; §4.4 sequenza; §4.7 scala per tempo), test con RIR (§7.4), aggiornare i test sostituiti.
2. **Interfaccia:** barra "completate/totali", testate per modulo, anteprima e modalità prova, scheda "Piano", campo RIR nel test, stepper passi e allenamenti nel calcolatore.
3. **Restyle** (§11c): ora applicabile. Prima token e componenti (`stile.css`, `comuni.tsx`), poi Percorso, poi Seduta, poi le altre schermate. Poi le icone (`IconaEsercizio`). Nessuna modifica a logica o dati; i test esistenti restano verdi.
4. Verifica con test e con l'app aperta in un browser headless prima di dichiarare finito; riporta il totale di serie del Blocco 3 W1 prima e dopo la Preservazione.

## 14b. Libreria esercizi
Esercizi, classi (F fondamentale · T target · C complementare), tipo (libero/macchina/cavo) ed equivalenti sono in `LIBRERIA_ESERCIZI.md`. Code estende `esercizi.ts` con i campi `classe`, `tipo`, `equivalenti` (1–3 per esercizio), mantenendo gli id esistenti. I nomi non presenti in `esercizi.ts` si aggiungono; **nessuna immagine**.

## 15. Cosa NON fare
Niente contacalorie né pasti; niente HIIT o cardio tracciato; niente tabelle nuove per la Preservazione; niente tagli di serie a priori nella Preservazione; niente back-off nei Blocchi 1–3; niente aumenti forzati finché non si vedono le note; niente dati inventati per Anno 2–3; niente testi copiati.
