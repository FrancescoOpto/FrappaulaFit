# Test di carico a inizio blocco — specifica per Claude Code
Fonte: 4 registrazioni dello schermo dell'app di riferimento (Test 1–4, Blocco 2) + ebook V Athlete Blocco 1 (cap. 4 e 9, pag. 46) + libro "Project Bodybuilding" cap. 5 (Tabella 5.2).
Etichette: [Certo] visto nei video o nei libri · [Probabile] inferenza forte · [Mia decisione] scelta per Frappaula Fit.
**Questo file sostituisce SPEC.md §6.1 e la regola "ripetizioni di test 10/12" di §5** dove sono in contrasto.

## 0. Correzione rispetto alla versione precedente
La SPEC precedente imponeva "fondamentali = 3RM fisso, 1RM = carico/0,944". **Era sbagliato**: l'app di riferimento accetta *qualsiasi* numero di ripetizioni e stima il massimale con la formula di Brzycki. Il 3RM è solo un caso particolare (36/34 = 1/0,944) e resta il **consiglio**, non un obbligo.

## 1. Quando si fa
- [Certo] La settimana di test è la **prima fase di ogni blocco**: barra fasi `Test → Fase 1 → Fase 2 → Scarico → Fase 3`. Test all'inizio del Blocco 1, 2 e 3.
- [Certo] Scopo (testo dell'app, da riscrivere con parole nostre): testare i carichi su tutti gli esercizi per stabilire con precisione con quanto peso lavorare dalla settimana seguente.
- [Certo] I test sono esattamente gli esercizi che compaiono nelle fasi del blocco che inizia: fondamentali **e** Target **e** complementari. Nessun esercizio del blocco resta senza carico di partenza.
- [Certo] Test 1–4 = sedute A–D nell'app di riferimento (4 giorni). Nella nostra app: **N sedute di test = N giorni/settimana scelti**, generate dopo il piano del blocco (SPEC §4): il generatore prende tutti gli esercizi dello slot-plan e li distribuisce sulle N sedute di test con gli stessi gruppi muscolari delle sedute normali. [Mia decisione]
- Cambio di 1–2 esercizi nelle fasi avanzate: **nessun ritest**, si riusa il carico dell'esercizio simile (modificabile). Sostituzione con un'alternativa equivalente consentita già in fase di test.
- Rientro dopo stop: regole del libro (SPEC §3). Dopo >3 settimane di stop si rifà la settimana di test. [Mia decisione]

### 1b. L'esercizio guida del gruppo ruota per blocco [Certo]
- Panca, squat, stacco (+ hip thrust per lei) sono gli unici **fondamentali permanenti**: test `stima`, carichi dalla scala RM (SPEC §6.3).
- Per gli altri gruppi il primo esercizio ("guida", marcato Target) **cambia da un blocco all'altro**: spalle = military press nel Blocco 1, spinte in alto manubri seduto nel Blocco 2 (la military resta nel Blocco 2 in un'altra seduta, 10@22). L'ebook Blocco 2 lo conferma: military, rematore, trazioni sono fondamentali *opzionali* e si possono sostituire (military → spinte manubri; rematore → T-bar; trazioni → lat machine).
- La guida è un Target: test `serie_unica` 10RM, **carico fisso** per tutto il blocco, progressione solo sul volume (tabelle SPEC §7, riga R2).
- Il generatore sceglie la guida di ogni gruppo da una lista di rotazione per blocco (dato di libreria), modificabile dall'utente; i test del blocco usano la guida del blocco che inizia. [Mia decisione]
- Opzione: nelle Impostazioni l'utente può promuovere un esercizio guida (es. military) a fondamentale (`stima` + scala RM). Default: no, come nell'app di riferimento.

### 1c. A cosa serve il massimale stimato [dall'utente, 28/10]
- Il massimale (1RM stimato) **non è un carico di allenamento**: nessuno si allena al massimale. Serve a (1) **misurare di quanto si è cresciuti rispetto al blocco precedente** e (2) ricavare in percentuale i carichi con cui si fanno gli RM prescritti (9RM, 7RM, 5RM, 3RM, 11RM… SPEC §6.3), sempre più leggeri del massimale.
- L'app deve quindi **salvare lo storico dei massimali per blocco** (panca, squat, stacco, hip thrust) e mostrare nei Progressi la variazione rispetto al test precedente (kg e %). [Mia decisione: grafico per fondamentale, con il valore del blocco in corso evidenziato]
- Un fondamentale ritestato a inizio blocco ricalcola subito tutte le scale RM del blocco.

## 1d. Persistenza dei carichi dopo il test [Certo, utente 28/10]
Il carico/massimale salvato dal test resta in memoria per tutto il blocco, ma **l'utente può cambiarlo in qualsiasi momento** (troppo leggero/pesante) e **il nuovo valore resta salvato** e viene precompilato nelle sedute successive. Il massimale è solo il punto di partenza per gli RM. Regole complete e test di acceptance: `SPEC.md` §9.2b.

## 2. Due tipi di test (tipo scelto dall'esercizio, campo di libreria `test_mode`)
### 2.1 `stima` — fondamentali permanenti (panca piana, squat, stacco da terra; hip thrust per la moglie)
[Certo] Schermata "Stima del massimale":
1. Campi **Reps** e **Carico** (liberi, entrambi obbligatori).
2. Pulsante "Calcola massimale" (disabilitato finché i campi non sono compilati; messaggio "Scrivi reps e carico per la stima").
3. Risultato: **numero grande in kg + etichetta "Carico stimato"**.
4. Due pulsanti: **"Salva e completa"** e **"Non mi torna, ricalcola"** (torna ai campi).
5. Dato salvato come **1 ripetizione al massimale stimato**: es. `1@87.5kg` (mostrato accanto al nome con l'etichetta "Target").
- **Formula [Certo, verificata su 4 casi]:** `1RM = carico × 36 / (37 − reps)`, arrotondato **al più vicino 0,5 kg** (configurabile 0,5/1/2,5).
  Casi per i test automatici: `4 reps × 80 kg → 87,5` · `5×40 → 45` · `5×50 → 56,5` · `5×80 → 90` · `1×100 → 100`.
- La via diretta è lo stesso campo con `reps = 1` (l'app di riferimento per lo stacco dice "via diretta o indiretta": identico).
- **Consigli in UI [dall'ebook, Certo]:** il test indiretto va fatto con un peso il più vicino possibile al massimale; con 3–5 ripetizioni la stima è affidabile, con 10–15 molto meno (esempio del libro: 15 rip × 60 kg dà un massimale irraggiungibile). → Suggerire 3–5 reps (default consigliato 3, coerente con il 3RM del libro); **avviso a >8 reps, blocco morbido a >12** (la formula perde senso vicino a 37). [Mia decisione]
- Riscaldamento a salire prima del test (ebook, test diretto): 1×8 al 30%, 1×5 al 40%, 1×3 al 50%, 1×3 al 60%, 2×2 al 70%, 2×1 all'80%, 1×1 al 90% del massimale stimato, riposi 1′→5′. Mostrarlo come scheda opzionale con le % calcolate su una stima iniziale (ultimo test o valore inserito). [Certo per le % — Mia decisione per l'uso]
- Istruzione di carico (stacco/panca/squat): **carico totale = kg bilanciere + kg di tutti i dischi**.

### 2.2 `serie_unica` — tutti gli altri esercizi (Target e complementari)
[Certo] Schermata "Serie unica di test":
- Testo: *"Devi fare un test **N**RM (peso più alto possibile con cui riesci a fare N ripetizioni)"* + istruzione di carico specifica (vedi §4).
- Campo **Reps** **bloccato e precompilato** con N; l'utente inserisce **solo il Carico**.
- Pulsante "Salva e completa esercizio" disabilitato finché il carico manca ("Completa i campi prima di procedere").
- Dato salvato come `N@carico` (es. `10@28kg`), mostrato sotto il nome nell'elenco, dopo il completamento.
- **N ∈ {10, 12, 14}**, campo di libreria `ripetizioni_test`. Regola [Certo, verificata sui 4 video]: **N = ripetizioni di lavoro della Fase 1 + 2** → 3×8 ⇒ 10RM · 3×10 ⇒ 12RM · 3×12 ⇒ 14RM. Se l'utente cambia l'esercizio, N si ricalcola dall'esercizio sostitutivo.
- Carico del test = **carico fisso** dell'esercizio per tutto il blocco (SPEC §6.3: R2, R3, C, AB). Solo il volume cresce. Il carico del test si può correggere in seduta (regola RIR di SPEC §9).
- Procedura di test da mostrare a richiesta (ebook cap. 9, Certo): serie a cedimento tecnico; se si fa più di N+2 ripetizioni il peso era leggero → ripetere dopo **3 minuti** con più carico; meglio farsi contare le ripetizioni da un altro o filmarsi, per non "autoprogrammarsi" sul numero.

## 3. Completamento della seduta di test
- [Certo] Ogni esercizio ha un cerchio (vuoto → spunta a esercizio salvato). Il pulsante "Completa seduta" resta disabilitato con scritta "Manca ancora **n** esercizi/o" finché non sono tutti completati.
- [Certo] Alla fine: schermata di congratulazioni con pulsante "Torna al programma". Quando tutte le sedute di test sono fatte: scheda "Fase completata 100%" con pulsante per iniziare la Fase 1.
- I carichi testati **precompilano** subito le sedute future (anche se sono bloccate), calcolati con SPEC §6.2–6.3. [Certo]
- Ritest successivo (Blocchi 2 e 3): mostrare l'ultimo valore del blocco precedente come suggerimento nel campo. [Mia decisione]

## 4. Istruzione di carico per attrezzo (campo di libreria `carico_modo`)
Il testo cambia in base all'attrezzo e va mostrato nella schermata del test [Certo, 8 varianti viste]:
| `carico_modo` | Cosa inserire | Esempi dai test |
|---|---|---|
| `bilanciere_totale` | bilanciere + tutti i dischi | panca, squat, stacco |
| `manubrio_singolo` | peso del singolo manubrio | spinte manubri, croci, alzate, French manubri, curl 60° |
| `macchina` | carico impostato escluso il peso proprio della macchina/del bilanciere del multipower | panca multipower, leg press, leg extension/curl, rematore multipower |
| `cavo` | carico impostato sul cavo | croci cavi, push down, French corda, lat machine, alzate cavo |
| `solo_dischi` | solo i dischi, escluso il bilanciere | T-bar, curl bilanciere EZ |
| `carico_sul_corpo` | kg posizionati sul petto/addome | crunch su hyperextension |
Quando l'attrezzo non è chiaro, mostrare un'icona di aiuto con la descrizione. Le istruzioni sono dati di libreria, non codice.

## 5. Tabella reale dei test (Blocco 2, utente — per test automatici e per capire il volume)
Valori inseriti dall'utente nell'app di riferimento (non sono prescrizioni). `STIMA` = test di stima; altrimenti serie unica `NRM@kg`.
| Seduta | Gruppo | Esercizio | Test |
|---|---|---|---|
| Test 1 (A) | Petto | Panca piana | STIMA 4×80 → **87,5** |
| | Petto | Spinte manubri su panca 45° | 10@28 |
| | Petto | Croci ai cavi | 12@20 |
| | Schiena | Lat machine presa media | 10@60 |
| | Schiena | Rematore manubrio | 10@28 |
| | Schiena | Lat machine presa larga | 12@55 |
| | Tricipiti | Push down | 12@35 |
| | Tricipiti | French press corda | 14@12 |
| | Addome | Crunch | 14@40 |
| Test 2 (B) | Gambe | Squat | STIMA 5×50 → **56,5** |
| | Gambe | Stacco rumeno | 10@45 |
| | Gambe | Leg press | 10@90 |
| | Spalle | Military press | 10@22 |
| | Spalle | Alzate laterali al cavo | 12@7 |
| | Spalle | Alzate posteriori | 12@10 |
| | Bicipiti | Curl su panca 45° | 12@10 |
| | Bicipiti | Curl seduto | 14@12 |
| Test 3 (C) | Schiena | Rematore T-bar | 10@40 |
| | Schiena | Lat machine triangolo | 10@65 |
| | Schiena | Rematore al multipower | 12@30 |
| | Petto | Spinte manubri su panca piana | 10@26 |
| | Petto | Panca piana al multipower | 12@30 |
| | Petto | Croci manubri su panca piana | 12@12 |
| | Tricipiti | French press manubri su panca | 10@12 |
| | Tricipiti | French press corda cavo basso | 12@30 |
| | Addome | Crunch su hyperextension | 14@20 |
| Test 4 (D) | Spalle | Spinte in alto manubri seduto | 10@20 |
| | Spalle | Alzate laterali manubri in piedi | 12@10 |
| | Spalle | Alzate laterali busto inclinato | 14@8 |
| | Schiena | Stacco da terra | STIMA 5×80 → **90** |
| | Gambe | Leg extension | 12@55 |
| | Gambe | Leg curl | 12@50 |
| | Bicipiti | Curl bilanciere EZ | 10@30 (solo dischi) |
| | Bicipiti | Curl manubri su panca 60° | 12@10 |
Lettura: 34 esercizi in 4 sedute (8–9 ciascuna); i fondamentali sono 3 (panca, squat, stacco) con STIMA. **Il military non è un fondamentale** [Certo]: nel Blocco 1 aveva carico fisso (20 kg) e nel Blocco 2 è un 10RM; la guida delle spalle nel Blocco 2 è «spinte in alto manubri seduto» (Test 4, 10@20). Vedi §1b.
Nota: le tre stime coincidono con Brzycki; le altre voci sono input diretti, quindi non verificabili con formula.

## 6. Cosa deve fare Code (checklist)
1. Campi libreria: `test_mode (stima|serie_unica)`, `ripetizioni_test (10|12|14)`, `carico_modo`, derivabili da `ripetizioni_lavoro_fase1 + 2`.
2. Funzione `stimaMassimale(reps, carico, passo=0.5)` con i 5 casi sopra come test unitari; validazione reps 1–12.
3. Generatore delle sedute di test dopo il piano del blocco (§1), con una voce per ogni esercizio del piano; ordine = gruppo muscolare, fondamentale/Target per primo.
4. Schermate `stima` e `serie_unica` (§2), con completamento seduta (§3).
5. Salvataggio `1@x` / `N@x` per esercizio e precompilazione dei carichi delle sedute future con SPEC §6.2–6.3.
6. Test all'inizio dei Blocchi 1, 2 e 3; suggerimento con l'ultimo valore dal Blocco 2 in poi.
7. Profilo moglie: hip thrust in `stima`, altri esercizi glutei con `serie_unica`; elenco completo da rivedere quando arrivano i libri glutei e donna.
8. Verificare con browser headless: calcolo, disabilitazione pulsanti, ricalcolo, completamento seduta, offline.

## 7. Punti aperti
- [Ipotesi] Il suggerimento "3 reps" e gli avvisi a >8 / >12 sono miei; l'app di riferimento non mostra limiti nel video.
- [Ipotesi] Ritest dopo stop >3 settimane: regola mia.
- Non è chiaro dai video se nell'app di riferimento il test dei Blocchi 2/3 precompila l'ultimo valore: l'ho proposto, non visto.
- 4×5@5RM e 4×3@3RM in Fase 3 restano da verificare in uso (autocorrezione −5% nella SPEC).
