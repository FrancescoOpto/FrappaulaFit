# SPEC — Frappaula Fit (PWA di bodybuilding personale)
Versione 1 · 27/10/2026 · scritta per Claude Code. Lingua dell'app e dei testi: italiano.
Etichette: **[Certo]** dedotto da dati/libro, **[Probabile]** inferenza forte, **[Ipotesi]** scelta mia da verificare, **[Utente]** deciso da Francesco, **[Mia decisione]** scelta da personal trainer delegata dall'utente.

## 0. Come usare questa specifica
1. Leggi prima `CLAUDE.md`, poi questo file.
2. Per i dettagli di metodo: `docs/note_elaborate/MEMORIA_GENERALE.md` e `struttura_programma_vathlete.md` (tabelle reali dell'app di riferimento, Blocco 1).
3. Per i dubbi sul libro: `docs/testo_integrale/` (ebook fedeli, libro in OCR con possibili errori).
4. I mockup sono in `docs/design/` (HTML): servono solo come riferimento di struttura, non come grafica finale.
5. Non copiare grafica, video, testi o nomi di V Athlete: l'app è ispirata, non una copia.

## 1. Obiettivo e utenti
- Web app installabile (PWA) per allenamento in palestra: programma a blocchi, test dei massimali, carichi calcolati, registrazione serie per serie, timer di recupero, storico.
- Due profili: **Francesco** (Android, Chrome) e **moglie** (iPhone, Safari → "Aggiungi a Home"). Login separati, un solo database gratuito. [Utente]
- Obiettivo di entrambi: ipertrofia generale; primo blocco con componente di forza, poi ipertrofia più "forte". [Utente]
- **Default 3 sedute a settimana da ~60 minuti**; meno serie per i gruppi piccoli (bicipiti/tricipiti). Giorni a settimana e durata scelti all'inizio con domande e **modificabili in corso d'opera** (2, 3, 4): le sedute sono **generate** (§4). [Utente]
- Funziona **offline**; backup esportabile (JSON). [Utente]
- Niente video: nome + icona stilizzata del gruppo muscolare + tasto "Cerca su YouTube" (link di ricerca). [Utente]

## 2. Stack consigliato [Mia decisione, discutibile]
- Frontend: PWA statica su **GitHub Pages** (account GitHub: FrancescoOpto). Consigliato Vite + TypeScript + Preact (o Svelte); niente framework pesanti. Service worker per offline, manifest, icone 192/512.
- Dati: **local-first** (IndexedDB) + sincronizzazione su **Supabase** (free tier, Auth email+password, Row Level Security). Rischio [Probabile]: i progetti gratuiti Supabase vengono messi in pausa dopo ~1 settimana di inattività → GitHub Action settimanale che fa una query di keep-alive. Alternativa se non gradito: Firebase (Auth + Firestore).
- Il programma è **dati, non codice**: esercizi, template delle sedute e tabelle di progressione stanno in file JSON/TS modificabili (§5–§8), così si cambiano senza toccare la logica.
- Test automatici (Vitest) sul motore dei carichi, con i casi di §6.4.

## 3. Struttura del programma (parametrica in N = giorni/settimana)
Anno → **Blocco** → Fasi → sedute. [Certo, dall'app di riferimento]
- Fasi del Blocco 1: **Test → Fase 1 → Fase 2 → Scarico → Fase 3**, ognuna espressa in **cicli**. Un **ciclo** = un giro completo del contenitore (N sedute), di solito una settimana. Test 1 ciclo · Fase 1 5 · Fase 2 5 · Scarico 1 · Fase 3 5 = **17 cicli**.
- Numero di sedute = **N × 17**: N=3 → 51 (≈17 settimane); N=4 → 68 (come l'app di riferimento); N=2 → 34.
- **Tensione da segnalare [Utente, detto prima]:** in origine l'utente aveva parlato di un ciclo di circa 3 mesi (30–40 allenamenti); la struttura completa a 17 cicli con N=3 dura ≈4 mesi (51 sedute). Mostrare la durata prima di confermare e offrire: **Blocco completo** (17 cicli, default: è la struttura che l'utente ha richiesto esplicitamente) oppure **Blocco breve** (Test + Fase 1 + Fase 2 + Scarico = 12 cicli; N=3 → 36 sedute, senza il picco di Fase 3). [Mia decisione]
- Le sedute future sono visibili in sola lettura ("stai sbirciando") ma non avviabili prima delle precedenti. [Certo]
- Ritmo di ogni fase (5 cicli): ciclo1 = ciclo2; ciclo3 primo gradino; ciclo4 secondo gradino; ciclo5 picco/ripetizione. [Certo]
- Dopo la Fase 3: **nuova settimana di test** prima del Blocco 2 (stesso motore, nuovi template/tabelle; il libro descrive Strength/Grow/Shred in `cap10.md`).
- **Rientro dopo una pausa (libro):** ≤1 sett. riprendi normale; 2 sett. ripeti l'ultima settimana; 3 sett. prima settimana della fase + ripeti l'ultima; >3 sett. kick-off (RIR 2 → RIR 1, recuperi 1' → 1'30"–2'30"). [Certo]
- **Sedute saltate (libro):** la sequenza non cambia mai, si riparte dalla seduta saltata e si scorre. Se si salta qualcosa: con 3 sedute si salta la seduta "jolly" (C); con 4 si salta A2/B2 e si riprende da A1. Da 3 a 4 sedute "ogni tanto" è ok (anticipare la seduta della settimana dopo); da 4 a 3 regolarmente no: meglio impostare il numero realistico. [Certo]

## 4. Generatore delle sedute (NON esistono sedute fisse A/B/C da copiare)
Le sedute **si generano** da: giorni/settimana, gruppi muscolari, tempo disponibile, priorità, esercizi esclusi. L'utente può cambiare questi parametri in corso d'opera e l'app **rigenera le sedute non ancora fatte** senza toccare quelle completate né i carichi. [Utente]
### 4.1 Input (domande iniziali, poi modificabili in Impostazioni)
1. Giorni a settimana **N** (2, 3 o 4; 5 con avviso: il libro la sconsiglia e il recupero diventa critico). 
2. Durata massima seduta **T** (default 60').
3. Gruppi prioritari (0–2): il target settimanale sale ×1,25 (max 24 serie) e, se la capacità delle sedute è satura, gli altri scendono fino a ~−15%. [Ipotesi]
4. Esercizi esclusi / attrezzatura mancante / "non mi sento sicuro" (es. trazioni zavorrate, stacco da terra). 
5. Esperienza (principiante/intermedio/avanzato): decide kick-off e volume di partenza.
6. Profilo-preset: *Uomo base* oppure *Donna – focus glutei* (§8). Il preset è solo un insieme di valori di default per i punti 3–4.
### 4.2 Contenitori (dal libro, tab. 7.30–7.36 e cap. 5 §7.3) [Certo]
| N | Contenitore | Sedute | Note del libro |
|---|---|---|---|
| 2 | **Full A / Full B** | tutti i gruppi in ogni seduta, esercizi diversi | bi-frequenza; con T=60' il volume resta basso (vedi §4.4) |
| 3 | **2+1 Split** (default) | S1 Split A: petto, braccia, gambe · S2 Split B: spalle, dorso, stacco · S3 Full C "jolly": tutti i gruppi tranne le gambe | ogni gruppo 2×/sett.; le gambe 2× (squat in S1, stacco in S2); se salti una seduta salti la C |
| 3 | alternativa: **Bi-Split scorrevole** | A1-B1-A2 / B2-A1-B1 / A2-B2-A1 / B1-A2-B2 | ogni cambio ciclo ruota; usare se N varia spesso |
| 4 | **Bi-Split** A1 B1 A2 B2 (ordine fisso) | A = petto, braccia, gambe; B = spalle, dorso, stacco | A1/B1 pesanti, A2/B2 più leggere; ogni gruppo 2×; sedute ≈45–60' |
| 5 | Bi-Split + **S5 richiamo** | S5 = gruppi prioritari/ritardatari, solo complementari | [Ipotesi] avviso recupero |
Il contenitore definisce **quali gruppi** stanno in quale seduta; non i singoli esercizi.
### 4.3 Slot e ruoli
Per ogni (gruppo, seduta) il contenitore dà una lista di **slot** con ruolo: **R1** = fondamentale (PP, scala RM piena, §6.3); **R2/R3** = esercizi "Target" a carico fisso con progressione di volume; **L** = fondamentale alla seconda esposizione settimanale (o ospitato in una seduta "jolly"), scala leggera; **C** = complementare; **AB** = addome. Le tabelle serie×rip di §7 si applicano **per ruolo**, indipendentemente dal contenitore.
Vincoli del generatore:
- max **2 R1** per seduta (libro: "max 2 fondamentali"); l'esercizio più impegnativo va **per primo**, da freschi; ordine grandi → piccoli gruppi; **dorso senza fondamentale**: il primo multiarticolare (lat machine, trazioni, rematore) è R2. [Utente]
- **Fondamentali permanenti** (test di stima + scala RM di §6.3, restano tutto l'anno): panca piana, squat, stacco da terra, hip thrust (glutei, profilo lei). [Utente + ebook Blocco 2: "panca, squat e stacco meglio non sostituirli"]
- **Esercizio guida del gruppo** (primo esercizio di spalle, dorso, ecc.): **ruota per blocco** [Certo, video + ebook Blocco 2 pag. ~"al posto della military delle spinte con manubri"]. Spalle: Blocco 1 = military press; Blocco 2 = spinte in alto manubri da seduto (e la military resta in un'altra seduta come Target). È un Target: test serie unica 10RM, **carico fisso** per il blocco, progressione solo sul volume. Rotazione per gruppo = dato di libreria (`rotazione_guida[blocco]`), modificabile dall'utente. Il military press può essere promosso a fondamentale (stima + scala RM) solo se l'utente lo chiede nelle Impostazioni. [Mia decisione, delegata]
- Ogni gruppo grande compare in ≥2 sedute della settimana se N ≥ 3.
- **Copertura dei sottogruppi** (≥4 serie dirette/sett. ciascuno): quadricipiti, femorali, glutei/cerniera, spalle laterali, spalle posteriori, bicipiti, tricipiti. Esempio: il 2+1 base non ha femorali → il generatore aggiunge un leg curl (C) nella seduta con più spazio, o stacco rumeno come R2.
### 4.4 Volume settimanale e tempo
- Target di partenza (serie **dirette**/sett., medie del libro tab. 10.21; soglie MEV 10–15, MAV 15–25, MRV ≈25): petto 16 · dorso 15 · spalle 15 · gambe 16 (quadricipiti 8, femorali 4, cerniera/glutei 4) · bicipiti 6 · tricipiti 6 · addome 6. [Probabile: valori medi, non prescrizioni]
- Capacità seduta: `serie_max ≈ (T − 8') / (45 s + recupero medio)`; recuperi di default §9.4; superserie condividono il recupero. Con T=60' risultano circa 21–26 serie per seduta.
- **Validazione:** l'app mostra le serie/gruppo/settimana risultanti; avviso se un gruppo grande è <10 o >24 ("con N=2 e T=60' il volume è sotto il minimo: considera 3 sedute o 75'").
- **Riempimento:** si parte dagli slot del contenitore con le serie di Fase 1 ciclo 1 (§7). Se la durata stimata supera T si toglie, in quest'ordine: 1 serie ai C → i C meno prioritari → mai serie agli R1.
### 4.5 Scelta degli esercizi
Dalla libreria (§5) per (gruppo, ruolo, classe), escludendo quelli esclusi dall'utente; ogni slot ottiene l'esercizio di default + **1–2 alternative** della stessa classe, scambiabili in test e in seduta. L'utente può sostituire qualsiasi esercizio generato (§9.3).
### 4.6 Sedute di esempio (output atteso con i default, uomo, N=3, T=60') [Mia decisione]
- **S1 Split A** — petto: panca piana R1 · panca manubri R2 · chest press C | gambe: squat R1 · pressa R2 · leg extension C | braccia: curl EZ C · french press EZ C.
- **S2 Split B** — spalle: military press (guida, Target R2, carico fisso) · shoulder press C · alzate (superserie) C | dorso: lat machine R2 · rematore R3 · pulley C | stacco da terra R1 | femorali: leg curl C (copertura sottogruppi).
- **S3 Full C jolly** — panca inclinata manubri R2 · lat unilaterale/T-bar R3 · shoulder press C · SS curl/french C · crunch AB.
- N=4: A1 = S1; B1 = S2; A2 = panca (L) + croci + leg extension + leg curl + curl/french manubri + addome; B2 = spinte alto manubri R3 + alzate + dorso TI + addome (A2/B2 più leggere).
Questi esempi servono a testare il generatore; **non vanno cablati**: devono uscire dalle regole 4.1–4.5.
### 4.7 Modifica in corso d'opera
- Cambio di N (o di T, priorità, esclusioni): si applica al **confine di ciclo**; fase, ciclo e carichi restano; le sedute future si rigenerano. Il ciclo continua a contare "giri completi del contenitore".
- Seduta in più (N=3 → 4 una settimana): "anticipa la prossima seduta". Seduta saltata: regole di §3.

## 5. Libreria esercizi
Campi: `id, nome, gruppo, classe_sostituzione, tipo (multi|isolamento), unilaterale, ripetizioni_test (10|12|14), test_mode (stima|serie_unica), carico_modo, alternative[], query_youtube, icona`.
- Classi di sostituzione (esempi): spinta orizzontale (panca, panca multipower, chest press), spinta inclinata, spinta verticale (military, shoulder press macchina, spinte manubri), trazione verticale (lat machine, trazioni assistite, pulldown), trazione orizzontale (rematore manubrio, T-bar, pulley), squat (squat, hack, pressa), cerniera anca (stacco rumeno, stacco da terra, good morning), quadricipiti isolamento, femorali isolamento, bicipiti, tricipiti, spalle laterali, addome.
- Ogni esercizio del programma deve avere **almeno 1, meglio 2 alternative** scambiabili **in fase di test** e anche in seduta (§9.3). [Utente]
- Libreria propria: possibilità di aggiungere esercizi personalizzati. [Utente]
- Ripetizioni di test: **10, 12 o 14** per esercizio, regola [Certo]: ripetizioni di test = ripetizioni di lavoro della Fase 1 + 2 (3×8→10, 3×10→12, 3×12→14). Dettagli in `TEST_INIZIO_BLOCCO.md`.

## 6. Test e calcolo dei carichi
### 6.1 Protocollo — **VEDI `TEST_INIZIO_BLOCCO.md` (prevale su questa sezione)**
Sintesi [Certo, dai video dei test dell'app di riferimento]:
- **Fondamentali permanenti** (panca, squat, stacco, hip thrust): test di **stima**; l'utente inserisce *reps qualsiasi + carico*, l'app calcola `1RM = carico × 36/(37 − reps)` (Brzycki), arrotondato a 0,5 kg; pulsanti "Salva e completa" / "Non mi torna, ricalcola"; salvato come `1@kg`. Si consigliano 3–5 reps (il 3RM del libro è un caso particolare, non un obbligo).
- **Tutti gli altri esercizi**: serie unica a **10, 12 o 14RM** (= ripetizioni di lavoro Fase 1 + 2); reps fisse, l'utente inserisce solo il carico; salvato `N@kg`; carico usato com'è per tutto il blocco.
- Test all'inizio di **ogni blocco (1, 2, 3)**, su tutti gli esercizi del blocco; nelle fasi avanzate un esercizio cambiato non richiede ritest (si riusa il carico del simile).
- Istruzione di carico per attrezzo (campo `carico_modo`) e tabella reale dei 34 test del Blocco 2: vedi il file dedicato.

### 6.2 Formula
`carico(n RM) = fattore_lavoro × 1RM_stimato × (37 − n) / 36`, con **`fattore_lavoro = 0,90`** (parametro modificabile, default 0,90), arrotondato a **0,5 kg** (arrotondamento configurabile: 0,5 / 1 / 2,5). [Certo: verificato nel Blocco 2 su panca (stima 87,5 → carichi da 78,75), squat (stima 56,5 → 9RM 39,5, 7RM 42,5, 5RM 45, 3RM 48, 11RM 36,5) e stacco (stima 90 → 81). Vedi `docs/note_elaborate/BLOCCO2_programma.md` §A3. **Verificato anche nel Blocco 1 [Certo, 29/10, 4 test con massimali reali]:** panca 1RM 84,5 → Fase 1 59 / 63,5, Fase 2 63,5, Scarico 55, Fase 3 67,5 / 72; squat 62 → 43,5 / 46,5 / 40,5 / 49,5 / 52,5; stacco 87,5 → 61,5 / 65,5 / 57 / 70 / 74,5 (tutti = 0,9 × RM di Brzycki, arrotondati a 0,5). Resta ignoto se valga nel Blocco 3: tenerlo come parametro.]
Il massimale mostrato/salvato resta la stima di Brzycki (non scontata); lo sconto si applica solo al calcolo dei carichi RM.

### 6.3 Scale RM per ruolo e fase (R1 = fondamentale; L = fondamentale alla 2ª esposizione settimanale o ospitato in seduta jolly)
| Fase / ciclo | R1 | L (leggero: 2ª esposizione del fondamentale) |
|---|---|---|
| Fase 1 cicli 1–3 | 9RM (77,8%) | 11RM (72,2%) |
| Fase 1 cicli 4–5 | 7RM (83,3%) | 11RM |
| Fase 2 cicli 1–5 | 7RM | 9RM (77,8%) |
| Fase 3 cicli 1–2 | 5RM (88,9%) | 9RM |
| Fase 3 cicli 3–4 | 5RM | 7RM (83,3%) |
| Fase 3 ciclo 5 | **3RM (94,4%)** | 7RM |
| Scarico | 11RM | 13RM (66,7%) |
R2, R3, C, AB: **carico fisso del test** per tutto il blocco; cambia solo il volume.

### 6.4 Casi di verifica (test automatici) [Certo, dati reali del Blocco 1]
**Attenzione al coefficiente 0,9 (§6.2): i valori sotto sono già scontati. Con stime di test: panca 87,5 → 1RM di lavoro 78,75; squat 56,5 → 50,85 (9RM 39,5, 7RM 42,5, 5RM 45, 3RM 48, 11RM 36,5); stacco 90 → 81.** Blocco 2 giorno A (panca): 1RM di lavoro 78,75 → 9RM 61,5 · 7RM 65,5 · 5RM 70 · 3RM 74,5 · 11RM 57 (vedi `docs/note_elaborate/BLOCCO2_programma.md`). Con 1RM panca = 81 kg: 9RM = 63, 7RM = 67,5, 5RM = 72, 3RM = 76,5, 11RM = 58,5, 13RM = 54 (tutti uguali ai carichi dell'app di riferimento). Con 1RM squat = 78,75: 9RM = 61,5, 7RM = 65,5, 5RM = 70, 3RM = 74,5, 11RM = 57. Dati reali dell'utente (Blocco 2): panca 3 rip × 97,5 kg → 1RM ≈ 103,3.

## 7. Tabelle serie × ripetizioni (cicli 1→5) [Certo, ricavate dai video; identiche tra giorni A–D]
| Ruolo | Fase 1 | Fase 2 | Fase 3 | Scarico |
|---|---|---|---|---|
| R1 | 4×5, 4×5, 4×6, 4×5, 4×5 | 3×6, 3×6, 4×6, 4×6, 3×7 | 3×5, 3×5, 4×5, 4×5, 4×3 | 3×7 |
| R2 | 3×8, 3×8, 4×8, 4×8, 4×8 | 3×9, 3×9, 4×9, 4×9, 4×9 | 3×7, 4×7, 3×8, 4×8, 3×6 | 3×9 |
| R3 | 3×8, 3×8, 3×8, 4×8, 4×8 | 3×9, 3×9, 4×9, 4×9, 3×10 | 3×8, 4×8, 4×8, 3×9, 3×10 | 2×10 |
| L | 3×8, 3×8, 3×9, 3×9, 3×10 [Certo, 29/10: panca giorno C, squat giorno D; il ciclo 2 è presunto] | 3×8, 3×8, 3×8, 3×9, 3×10 | 3×10, 3×10, 3×8, 3×8, 3×8 | 3×10 |
| AB | 3×12 fisso | 3×13, 3×13, 3×14, 3×14, 3×15 | 3×12, 3×12, 3×13, 3×13, 3×14 | 3×15 (= ultima settimana di Fase 2; Blocco 2 giorno A) |
| C | serie/rip dello slot, fissi | **invariati** rispetto alla Fase 1 (Blocco 2, giorni A–D: nessun +1, confermato; nelle note Keep del Blocco 1 si leggeva +1 rip: ignorare) | serie/rip del nuovo slot della variante | serie −1 (min 2), rip invariate |
- **Blocco 2 (4 giorni A–D, tutte le settimane lette): vedi `docs/note_elaborate/BLOCCO2_programma.md` §A2, che prevale su questa tabella.** Esistono 5 tabelle Target (R1, R2, R3, R3b military, R3c spinte piana) più AB; la tabella dipende dall'**esercizio nello slot**, non dal ruolo né dal gruppo: va tenuta come dato (`tabella_prog` per slot), non nel codice. Nel Blocco 2 non c'è nessun ruolo L (ogni fondamentale compare una volta a settimana come R1).
- In Fase 1 il passaggio ciclo 3 → 4 di R1 **cambia carico** (da 9RM a 7RM) e riporta le rip a 5. In Fase 2 R1 tiene il carico 7RM e lavora sul volume.
- In Fase 2/3 si cambiano alcune **varianti** dei complementari (es. croci manubri → croci ai cavi, curl 60° → 45°) senza cambiare la logica; i complementari nuovi non hanno carico prescritto: lo sceglie l'utente (o eredita quello dell'esercizio simile).
- **Dubbio chiuso [Certo, 29/10]**: i carichi sono 0,9 × RM (4×5 in Fase 3 = 80 % del 1RM, 4×3 = 85 %), quindi sostenibili; il dubbio nasceva dall'avere ignorato il 0,9. Soluzione adottata: **autocorrezione** — se in una serie le ripetizioni fatte < prescritte, il peso della serie successiva è precompilato a −5%; se succede per 2 sedute di fila sullo stesso esercizio, il carico del ciclo successivo scende del 2,5% (modificabile dall'utente). 
- **Stripping −30%** sull'ultima serie dell'ultimo esercizio di ogni gruppo, solo Fase 2: viene dalle note Keep dell'utente e **non è verificato nei video**; implementarlo come opzione (default: spento), con testo "serie extra a −30%, fino al cedimento".

## 8. Profilo moglie — **PROVVISORIO** [Mia decisione, da rivedere con i libri glutei/donna non ancora ricevuti]
- **Non è un programma scritto a mano**: è lo stesso generatore (§4) con il preset *Donna – focus glutei*: stesso motore e stesse regole (il libro: le regole di allenamento sono le stesse, cambiano biotipo e focus).
- Parametri del preset: gruppo prioritario = **glutei** (target diretto 12–16 serie/sett. in ≥2 sedute, sottogruppo a sé); fondamentali: **hip thrust**, squat, panca piana, stacco da terra (military come guida spalle, Target); stacco rumeno come R2/C di cerniera; target spalle/braccia ridotti (−20%) per fare capacità. [Ipotesi]
- Regola dei 2 R1 per seduta: con 4 fondamentali permanenti in N=3 il generatore mette hip thrust + stacco in S2, panca + squat in S1; la seduta jolly ospita il lift **L** (2ª esposizione, scala leggera).
- **Ciclo mestruale: solo suggerimenti opzionali** ("Applica / Lascia com'è"), a basso peso: il libro dice che programmi basati solo sul ciclo sono "più marketing"; non proporre per contraccettivi ormonali o cicli irregolari. I dati del ciclo stanno **solo nel suo account**. [Utente]
- Deficit/surplus (se mostrati): taglio 350 kcal (uomo 500), pre-forza 100–150 (uomo 200–300).

## 9. Funzioni dell'app
### 9.1 Schermate
**Configurazione iniziale** (domande di §4.1 + anteprima di sedute, serie/gruppo/settimana e durata del blocco) · Home/percorso (barra fasi, prossima seduta, sedute completate con spunta) · Seduta (card per gruppo muscolare, etichetta "Target", `serie×rip@kg`, "Completa seduta") · Esercizio (serie una per riga con kg e rip precompilati, "fatto", recupero, note, cerca su YouTube) · Test (inserimento per esercizio, alternative) · Progressi (storico e grafici per esercizio) · Check-in (peso corporeo/sensazioni, opzionale) · **Impostazioni** (da creare: profilo, arrotondamento, recuperi, suoni, notifiche, backup/ripristino, sincronizzazione, nuovo blocco).
### 9.2 Registrazione
- Per **ogni serie** si salva peso e ripetizioni effettivi; la settimana dopo l'app mostra i valori della seduta equivalente precedente accanto a quelli previsti. [Utente]
- Peso previsto precompilato dal test e modificabile; **ciò che l'utente cambia resta in memoria per le sedute successive: vedi 9.2b**.
### 9.2b Persistenza dei carichi (regola dell'utente, 28/10) [Certo: descritta dall'utente guardando l'app di riferimento]
1. **Il test salva un carico base per esercizio** (`1@kg` per i fondamentali, `N@kg` per gli altri) e lo conserva **per tutto il blocco**. Il massimale (stima) resta in memoria per tutto il blocco ed è modificabile a mano (cambiare il massimale ricalcola le scale RM delle sedute future, non quelle già fatte).
2. **Il carico è sempre modificabile** dall'utente in seduta (troppo leggero → sale, troppo pesante → scende), per ogni serie.
3. **Quello che l'utente scrive vale anche per dopo**: il kg inserito in un esercizio diventa il *carico corrente* di quell'esercizio e viene **precompilato in tutte le sedute successive** (settimana dopo compresa) finché non lo cambia di nuovo. Dentro la stessa seduta, cambiare il peso della serie 1 precompila le serie rimanenti (ognuna ancora modificabile).
4. **Esercizi a carico fisso (R2, R3, C, AB):** il carico corrente sostituisce il carico base per le sedute future. Il test originale resta nello storico (serve per il confronto tra blocchi).
5. **Fondamentali con scala RM che cambia (9RM→7RM→5RM→3RM…):** il piano calcola il carico dal massimale; se l'utente lo modifica, l'app salva il **fattore di correzione** `kg_inseriti / kg_previsti` e lo applica ai carichi previsti delle sedute future dello stesso esercizio, così la progressione di fase continua ma partendo dal livello scelto. [Mia decisione, discutibile; alternativa più semplice: ricopiare l'ultimo kg inserito. Il fattore va mostrato e azzerabile da "Ripristina carico del piano".]
6. Le due cose si distinguono nei dati: `kg_previsto` (piano), `kg_corrente` (ultimo scelto dall'utente) e `kg` effettivo per serie (storico). Nella UI: il campo mostra `kg_corrente`; accanto, in piccolo, il valore del piano e quello della seduta precedente.
7. Varianti/sostituzioni: se l'esercizio non ha test, il carico iniziale è ereditato da un equivalente testato (§9.3) e da lì vale la stessa regola (3).
8. Test di acceptance: (a) imposto 70→72,5 sulla panca W9 → W13 mostra 72,5 (o 72,5 × fattore se la scala sale); (b) modifico un carico fisso in W5 → W9, W13… lo mostrano; (c) riavvio app / offline / import-export non perdono i carichi correnti.
### 9.3 Sostituzione esercizi
- "Modifica" sulla card del gruppo: sostituisci con un'alternativa della stessa classe. Carico: se l'alternativa ha un test usa quello, altrimenti eredita quello dell'originale (modificabile). Regola in seduta: troppo facile (>3 RIR) → sale, impossibile → scende.
### 9.4 Timer di recupero
- Per esercizio (default: R1 150 s, R2/R3/L 120 s, C 90 s; modificabili). Parte dal "serie fatta". **Suono + vibrazione in-app** e **notifica** a fine recupero. Calcolo basato su timestamp (non su setInterval) per sopravvivere al blocco schermo.
- iPhone: le notifiche richiedono PWA installata in Home (iOS ≥16.4) e Web Push; **da testare**. Piano B: link a timer nativo. [Probabile: Android Chrome funziona]
### 9.5 Durata stimata
`durata ≈ 8' riscaldamento + Σ serie × (45 s esecuzione + recupero)`; superserie: recupero condiviso. Mostrata prima di iniziare.
### 9.6 Backup
Esporta/importa JSON completo; promemoria periodico.

## 10. Modello dati (indicativo)
`profilo(id, nome, sesso, impostazioni, parametri_generatore{N, T, priorità[], esclusi[], esperienza, preset})` · `contenitore(id, N, sessioni[{gruppi, slot[{gruppo, ruolo, classe}]}])` · `blocco(id, profilo, numero, stato)` · `test(blocco, esercizio_id, kg, rip, rm1_stimato)` · `seduta(id, blocco, fase, ciclo, giorno, numero, stato, data)` · `esercizio_seduta(seduta, slot, esercizio_id, ruolo)` · `serie(seduta, slot, n, kg_prev, rip_prev, kg, rip, fatta, nota)` · `carico_corrente(profilo, blocco, esercizio_id, kg, fattore_correzione, aggiornato)` · `sostituzione(profilo, esercizio_id, alternativa_id)`.
Sync [Probabile come soluzione semplice]: tabella `kv(user_id uuid, chiave text, valore jsonb, aggiornato timestamptz)` con RLS `user_id = auth.uid()`, last-write-wins per chiave; coda offline in IndexedDB.

## 14. Motore "coach" (regole esplicite, offline, spiegabili) [Mia decisione, discutibile]
L'app contiene un motore a regole che propone e spiega, senza AI esterna. Ogni decisione mostra il "perché" in una riga.
1. **Dati, non codice**: tabelle di progressione per slot, scale RM, `fattore_lavoro`, coefficienti reps = test − 2, regole di scarico, tabella dei volumi per gruppo stanno in file di dati versionati (`data/*.json`).
2. **Regole di carico**: stima Brzycki dal test (§6), carichi RM (§6.2–6.3), persistenza (§9.2b), autocorrezione (−5% sulla serie successiva se reps < prescritte; −2,5% al ciclo dopo se succede per 2 sedute di fila).
3. **Regole di struttura**: generatore sedute (§4), controllo del volume settimanale per gruppo, scelta delle varianti (stessa classe, alternativa equivalente), rotazione della guida a ogni blocco, scarico a fine fase.
4. **Stato dell'utente**: storico serie, aderenza (sedute fatte/saltate), peso corporeo (check-in), pause lunghe → dopo una pausa il motore propone nuovo test e una settimana di ripresa a carichi ridotti (soglia da definire).
5. **Separazione fonti**: ogni regola ha etichetta `fonte = metodo V Athlete (video/libro)` oppure `fonte = mia ipotesi`; le seconde sono disattivabili in Impostazioni. Regole riscritte con parole nostre, niente testi copiati.
6. **Assistente con AI (facoltativo, fase successiva)**: richiede rete, costo per uso e un piccolo server intermedio (la chiave API non può stare nel codice pubblico). Da valutare solo dopo il motore a regole.

## 15. Pianificatore a obiettivo [Ipotesi, da validare]
Input: data di inizio, data obiettivo (es. "in forma a giugno"), giorni a settimana, tempo a seduta. Blocco completo = 17 settimane (1 test + 15 fasi + 1 scarico); 3 blocchi ≈ 1 anno.
- Calcola le settimane disponibili e propone più opzioni con il "perché": blocchi completi + blocco accorciato (12 cicli, togliendo cicli alle fasi) + ultimo scarico allineato alla data obiettivo.
- Le versioni accorciate sono una **scelta nostra** non vista nell'app di riferimento: marcarle come tali.
- Fasi "massa/definizione": dal lato allenamento (volume/intensità) e con andamento del peso corporeo; **calorie e macro non sono nei libri elaborati**: se servono vanno da fonti verificate, come indicazioni generali, non come dieta personalizzata (per la moglie meglio un nutrizionista).
- Pausa lunga: rilevata dalle sedute mancanti → nuovo test + settimana di ripresa, poi riprogrammazione verso la data obiettivo.

## 11. Cosa NON fare
Niente codice che copi grafica/testi/video di V Athlete; niente dati su server oltre il minimo; niente video incorporati; nessuna dipendenza a pagamento.

## 12. Verifica di accettazione
1. Con i dati di §6.4 il motore produce esattamente i carichi di §6.4 e le tabelle di §7.
2. Con N=3 (2+1) il generatore produce 51 sedute (3+15+15+3+15), con N=4 68; cambiando N a metà blocco le sedute future si rigenerano senza perdere carichi né storico; sedute future non avviabili.
3. Funziona senza rete dopo il primo caricamento; export/import ripristinano tutto.
4. Timer: suono e vibrazione su Android Chrome; notifica testata su iPhone installato in Home (esito da riportare).
5. Valori della settimana precedente ricomparsi accanto ai previsti.

## 13. Parti aperte (da non inventare: chiedere o segnalare)
- Libri glutei e allenamento femminile (profilo moglie, §8) — **non ancora ricevuti**.
- Blocco 2 è completo (`BLOCCO2_programma.md`); Blocco 3 non ancora visto. Note Keep (`appunti_keep_utente.md`: panca 4×5@75% = 10RM in Fase 1) non coincidono con l'app: fa fede l'app.
- Contenitore a 5 giorni e algoritmo di priorità (§4.1 punto 3, §4.2): [Ipotesi], da validare con l'uso.
- Durata del blocco: completo 17 cicli vs breve 12 cicli (§3): decidere con l'utente dopo aver visto l'anteprima.
- Stripping −30% (§7), notifiche iPhone (§9.4), volumi settimanali vs tabella 10.21 (§4).
- Correggere il mockup `TestRM`: la scritta "≈85% del massimale" va sostituita con la scala 9→7→5→3RM.
- Idea futura dell'utente: PDF unico del libro con semi-scansione delle foto.
