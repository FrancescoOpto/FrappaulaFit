# BLOCCO 3 — Programma completo (test + Fase 1, 2, Scarico, Fase 3, giorni A–D)
Fonte: 3+4 video del 28/10/2026 (test), 4+4+1+4 video (Fase 1, 2, Scarico, Fase 3) dell'app di riferimento. Tutti i valori sono stati letti dai video; le poche celle dedotte sono marcate **[D]**. **Prima la sintesi (§A), poi le tabelle per giorno (§B).** Complementa `BLOCCO2_programma.md`: stessa struttura (Anno → Blocco → Test, Fase 1, Fase 2, Scarico, Fase 3), ma **regole diverse**: non riusare le tabelle del Blocco 2.

## A. Sintesi per il motore

### A1. Struttura della settimana (Blocco 3, 4 giorni)
| Giorno | Gruppi | Fondamentale libero (Target) | Altri Target | Addome |
|---|---|---|---|---|
| A | Spalle, schiena, tricipiti, addome | — | Spinte in alto manubri seduto, lat triangolo | Crunch hyperextension |
| B | Gambe/glutei, petto, bicipiti | **Squat libero** | Panca piana al multipower | — |
| C | Schiena, spalle, tricipiti, addome | — | T-bar triangolo, lat presa media, lento avanti multipower | Crunch in ginocchio al cavo alto |
| D | Petto, schiena, gambe/glutei, bicipiti | **Panca piana libera, stacco** | Spinte manubri panca piana | — |
Esercizi per giorno (Fase 1): A 10, B 8, C 11, D 9. I gruppi assegnati ai giorni **cambiano a ogni blocco** (Blocco 2: A petto/schiena/tricipiti; Blocco 3: A spalle/schiena/tricipiti). Squat e panca compaiono 2×/settimana (libero pesante + multipower), stacco 1× (giorno D, sotto "Schiena"). **Nessun ruolo L evidente.**

### A2. Carichi dei fondamentali: percentuale diretta del 1RM stimato [Probabile]
| | Fase 1 | Fase 2 | Scarico | Fase 3 |
|---|---|---|---|---|
| Serie×rip | 3×5 | 3×4 | 3×4 | 3×3 |
| % 1RM | 77 % | 82 % | 77 % | 87 % |
Squat (1RM 90): 69,5 / 74 / 69,5 / 78,5. Panca e stacco (1RM 101,5): 78 / 83 / 78 / 88,5. Carico = `round_0.5(1RM × %)`. **Il fattore_lavoro 0,9×(37−n)/36 del Blocco 2 non si applica** (n=3 darebbe 76,5, osservato 78,5). Le % vanno trattate come **dati per blocco** (Blocco 2: 70/75/75/80/85 %; Blocco 3: 77/82/87 %, +5 punti per fase). I carichi sono **piatti dentro la fase** (nessuna rampa settimanale). Nota: nei test 5×90 per panca e stacco danno lo stesso 1RM 101,5 (dati di prova, non reali).

### A3. Target non fondamentali e righe "×12"
- **Carico = carico del test** per tutto il blocco (si può cambiare, SPEC §9.2b). **Reps = reps test − 2 in Fase 1, +1 in Fase 2 (8→9, 10→11), −2 in Fase 3 (7, poi 8 alla settimana 4)**. Serie fisse a 3.
- **Seconda riga Target "×12" (senza kg):** stesso esercizio Target ripetuto, 1×12 nelle settimane 1–2, **2×12 dalla settimana 3** (Fase 1, 2, 3). Compare solo per: spinte in alto (A), T-bar (C), spinte manubri panca piana (D). Eliminata nello Scarico.
- **Tabella reps Target per fase (settimane 1→5):** Fase 1 8,8,8,8,8 · Fase 2 9,9,9,9,9 · Fase 3 7,7,7,8,8 (esercizi a 10RM: 10/11/8–9 → vedere §B).
- **Crunch (addome):** Fase 1 3×12 fisso · Fase 2 A: 13,13,14,14,15 · Fase 3 A: 12,12,13,13,14; giorno C Fase 3: 13,13,14,14,15 · Scarico 3×15.

### A4. Complementari
- Serie×rip fissate dallo slot, identiche nelle 5 settimane (nessuna progressione). Carico = carico del test **se l'esercizio è stato testato**; varianti nuove (`V`) senza kg → ereditare dall'esercizio equivalente (SPEC §10).
- Fase 2 cambia la maggior parte dei complementari, Fase 3 ne cambia o ne riporta alcuni (come nel Blocco 2).
- **Righe da una sola serie:** `1×40` = **rest-pause, 40 ripetizioni totali al carico del test** (testo dell'app: "fai 40 ripetizioni usando il carico trovato nel test"); compare su push down barra (A, Fase 1), curl panca 45° (B, Fase 1), French corda alto (A, Fase 2), curl 60° (B, Fase 2), panca 45° multipower (D, Fase 2), push down corda (A, Fase 3), panca 45° multipower e curl in piedi (B, Fase 3). **`1×10`** = **rest-pause "10 + 3 volte max"** (testo dell'app, leg extension, certo): 10 rip con carico leggermente più basso di quello da 8 rip → pausa 30" → max rip → pausa 40" → max rip → pausa 50" → max rip. Rec 90" mostrato nella scheda. Stessa tecnica presumibile [Probabile] per curl seduto (D Fase 2), panca 30° MP (D Fase 3 e Fase 1), lat media 1×10 (C Fase 1). L'app precompila comunque il kg del test (leg extension 60) anche se il testo suggerisce un carico un po' più basso. Nello Scarico queste righe tornano serie normali (2×12 / 2×10).
- Nel motore: tipo di serie `rest_pause` con due varianti: `totale_reps` (1×40: 40 rip totali, pause brevi) e `10_piu_3` (1×10: 10 rip + 3 mini-serie a cedimento, pause 30"/40"/50"). Un solo campo kg per la riga; registrare le rip di ogni mini-serie; timer con le pause indicate.

### A5. Scarico
Fondamentali 3×4 al **carico della Fase 1** (77 %); Target secondari −1 serie (3→2) a kg e reps invariati; complementari −1 serie (min 2); righe 1×40/1×10 → 2×12/2×10; seconda riga ×12 eliminata; crunch 3×15 invariato.

### A6. Volume e natura del blocco
Serie settimana 1: Fase 1 = 97 (A 25, B 22, C 27, D 23), Fase 2 = 97 (25, 23, 28, 21), Fase 3 = 99 (25, 23, 28, 23). **Blocco 2 W1 = 103.** Il volume non cresce nel Blocco 3; cresce l'intensità dei fondamentali (77→87 %, 5→3 rip). **Non è un blocco di "definizione"**: nessuna riduzione di volume né di frequenza (cap. 10 Shred: onde a bassissimo volume, senza fondamentali pesanti). La definizione, se serve, è una scelta calorica (SPEC §15), non un attributo del blocco: l'app deve **chiedere l'obiettivo** (massa/mantenimento/definizione) e proporre il blocco più adatto.

### A7. Domande aperte
1) Testo esatto delle righe `1×40` (letto solo per il push down: "40 ripetizioni usando il carico trovato nel test"). 2) Se l'app di riferimento corregge i carichi dopo risultati reali (qui le sedute future sono sempre al carico del test). 3) Se le % 77/82/87 dipendono dal 1RM o dalle reps del test. 4) Profilo di lei (glutei/hip thrust) ancora da progettare.

## B. Tabelle per giorno
Legenda: T = Target, MP = multipower, [D] = dedotto, `V` = variante senza kg prescritto.

### B1. Test (4 sedute, Blocco 3)
| Test | Esercizi e valore salvato (carico finale, dopo correzioni) |
|---|---|
| 1 (A) | Spinte in alto manubri seduto (T) 10@20 · Alzate laterali seduto 12@10 · Alzate laterali panca 45° 12@8 · Lat triangolo (T) 10@70 · Pulley triangolo 12@65 · Rematore MP 12@40 · French manubri panca piana 10@14 · Push down barra 14@40 · Crunch hyperextension (T) 14@40 |
| 2 (B) | **Squat libero (T) stima 5×80 → 1RM 90** · Leg extension 12@60 · Leg curl 12@55 · Panca piana MP (T) 12@40 (escl. bilanciere) · Panca 45° MP 12@35 · Croci manubri panca piana 12@16 · Curl manubri seduto 10@16 · Curl panca 45° 14@12 |
| 3 (C) | T-bar triangolo (T) 10@50 · Lat presa media (T) 10@65 · Lat presa larga 12@60 · Lento avanti MP (T) 12@25 (escl. bilanciere) · Alzate laterali in piedi 12@12 · Alzate posteriori cavo 90° 12@10 · French corda cavo alto 12@30 · Push down corda cavo alto 14@40 · Crunch ginocchio cavo alto (T) 14@40. Corretti dall'utente: lat media 60→65, lat larga 55→60, French 14→30 |
| 4 (D) | **Panca piana libera (T) stima 5×90 → 1RM 101,5** · Spinte manubri panca piana (T) 10@28 · Panca 30° MP 12@40 · **Stacco (T) stima 5×90 → 101,5** (prima 5×80 → 90, ricalcolato) · Squat MP 10@30 · Leg curl 14@50 · Curl manubri panca 60° 12@12 · Curl manubri in piedi 12@14 |
Le versioni al multipower sono serie uniche con nota "escludendo il peso del bilanciere" → flag `esclude_bilanciere`. La stima del massimale (reps+carico, Brzycki) vale solo per squat, panca e stacco **liberi**.

### B2. Fase 1 (W1–20, 5 settimane; prescrizione piatta salvo `*`)
**A (W1,5,9,13,17):** Spinte in alto T 3×8@20 · Spinte in alto T 2ª riga *1×12 (W1,5) → 2×12 · Alzate laterali seduto 3×10@10 · Alzate laterali panca 45° 2×10@8 · Lat triangolo T 3×8@70 · Pulley triangolo 3×10@65 · Rematore MP 2×10@40 · French manubri 4×8@14 · Push down barra 1×40@40 · Crunch T 3×12@40.
**B (W2,6,10,14,18):** Squat T 3×5@69,5 · Leg extension 3×10@60 · Leg curl 3×10@55 · Panca MP T 3×10@40 · Panca 45° MP 2×10@35 · Croci manubri 3×10@16 · Curl seduto 4×8@16 · Curl panca 45° 1×40@12.
**C (W3,7,11,15,19):** T-bar T 3×8@50 · T-bar T 2ª riga *1×12 (W3,7) → 2×12 · Lat media T 3×8@65 · Lat media 1×10 · Lat larga 2×10@60 · Lento avanti MP T 3×10@25 · Alzate laterali in piedi 2×10@12 · Alzate posteriori cavo 3×10@10 · French corda alto 3×10@30 · Push down corda 3×12@40 · Crunch T 3×12@40.
**D (W4,8,12,16,20):** Panca libera T 3×5@78 · Spinte manubri T 3×8@28 · Spinte manubri 2ª riga *1×12 (W4,8) → 2×12 · Panca 30° MP 1×10@40 · Stacco T 3×5@78 · Squat MP 3×10@30 · Leg curl 3×12@50 · Curl panca 60° 3×10@12 · Curl in piedi 3×10@14.

### B3. Fase 2 (W21–40; prescrizione piatta salvo `*`)
**A (W21,25,29,33,37):** Spinte in alto T 3×9@20 · 2ª riga *1×12 (W21,25) → 2×12 · Alzate laterali in piedi `V` 3×10 · Alzate laterali cavo basso `V` 2×10 · Lat triangolo T 3×9@70 · Lat larga `V` 3×10 · Pulley triangolo 2×10@65 · French EZ panca piana `V` 4×8 · French corda cavo alto `V` 1×40 · Crunch T *3×13@40 (W21,25), 3×14 (W29, W33 [D]), 3×15 (W37).
**B (W22,26,30,34,38):** Squat T 3×4@74 · Affondi MP `V` 2×8 · Leg extension 1×10@60 · Leg curl 3×10@55 · Panca MP T 3×11@40 · Spinte manubri 30° `V` 3×10 · Croci cavi bassi `V` 3×10 · Curl EZ `V` 4×8 · Curl panca 60° `V` 1×40.
**C (W23,27,31,35,39):** T-bar T 3×9@50 · 2ª riga *1×12 (W23,27) → 2×12 · Lat media T 3×9@65 · Lat media 1×12 · Rematore MP 2×10 · Lento avanti MP T 3×11@25 · Alzate laterali busto inclinato `V` 3×10 · Alzate posteriori 90° `V` 3×10 · French manubri `V` 3×10 · French corda basso `V` 3×12 · Crunch T *3×13@40 (W23,27), 3×14 (W31, W35 [D]), 3×15 (W39).
**D (W24,28,32,36,40):** Panca libera T 3×4@83 · Spinte manubri T 3×9@28 · 2ª riga *1×12 (W24,28) → 2×12 · Panca 45° MP `V` 1×40 · Stacco T 3×4@83 · Leg press `V` 3×10 · Leg curl 3×12@50 · Curl panca 45° `V` 3×10 · Curl seduto `V` 1×10.

### B4. Scarico (4 sedute)
**S1 (A):** Spinte alto T 3×9@20 · Alzate laterali piedi 2×10 · Alzate cavo basso 2×10 · Lat triangolo T 2×9@70 · Lat larga 2×10 · Pulley 2×10@65 · French EZ 3×8 · French corda alto 2×12 · Crunch T 3×15@40.
**S2 (B):** Squat T 3×4@69,5 · Affondi 2×8 · Leg ext 2×10@60 · Leg curl 2×10@55 · Panca MP T 2×11@40 · Spinte 30° 2×10 · Croci cavi 2×10 · Curl EZ 3×8 · Curl 60° 2×12.
**S3 (C):** T-bar T 2×9@50 · Lat media T 2×9@65 · Rematore MP 2×10 · Lento avanti T 2×11@25 · Alzate laterali busto 2×10 · Alzate posteriori 2×10 · French manubri 2×10 · French corda basso 2×12 · Crunch 3×15 [D, non visto].
**S4 (D):** Panca T 3×4@78 · Spinte manubri T 2×9@28 · Panca 45° MP 2×12 · Stacco T 3×4@78 · Leg press 2×10 · Leg curl 2×12@50 · Curl 45° 2×10 · Curl seduto 2×10.

### B5. Fase 3 (W41–60)
**A (W41,45,49,53,57):** Spinte alto T 3×7@20 (W41,45,49), 3×8 (W53,57) · 2ª riga *1×12 (W41,45) → 2×12 · Alzate laterali seduto 2×10@10 · Alzate laterali panca 30° 3×10 · Lat triangolo T 3×7@70 (W41,45,49), 3×8 (W53,57) · Rematore MP 3×10@40 · Lat media 2×10 · French manubri 4×8@14 · Push down corda alto 1×40 · Crunch T 3×12@40 (W41,45), 3×13 (W49,53), 3×14 (W57).
**B (W42,46,50,54,58 — piatto):** Squat T 3×3@78,5 · Leg press 2×8 · Leg extension 3×10@60 · Leg curl 3×10@55 · Panca MP T 3×8@40 · Panca 45° MP 1×40@35 · Croci cavi altezza petto 3×10 · Curl panca 45° 4×8@12 · Curl in piedi 1×40.
**C (W43,47,51,55,59):** T-bar T 3×7@50 (W43,47,51), 3×8 (W55,59) · 2ª riga *1×12 (W43,47) → 2×12 · Lat media T 3×7@65 → 3×8 · Lat media 1×12 · Pulley barra 2×10 · Lento avanti MP T 3×8@25 · Alzate laterali cavo medio 3×10 · Alzate posteriori seduto 3×10 · French EZ 3×10 · French corda basso 3×12 · Crunch T 3×13@40 (W43,47), 3×14 (W51,55), 3×15 (W59).
**D (W44,48,52,56,60):** Panca libera T 3×3@88,5 · Spinte manubri T 3×7@28 (W44,48,52), 3×8 (W56, W60 [D]) · 2ª riga *1×12 (W44,48) → 2×12 · Panca 30° MP 1×10@40 · Stacco T 3×3@88,5 · Hack squat `V` 3×10 · Leg curl 3×12@50 · Curl EZ 3×10 · Curl panca 60° 3×10@12.
Nota: nel video del giorno A compariva per errore il Workout 54 (giorno B): ignorato su indicazione dell'utente; il Workout 54 reale (video B) è uguale agli altri B.

## C. Differenze Blocco 2 → Blocco 3 (per il motore)
| | Blocco 2 | Blocco 3 |
|---|---|---|
| Fondamentali | 4×5 → … progressione a gradini in ogni fase | 3×5 / 3×4 / 3×3 piatti, 77/82/87 % |
| Target secondari | 3×8 → 4×8, tabelle R2/R3/R3b/R3c | 3×8, nessuna rampa; Fase 3 7→8 |
| Righe "×12" | assenti | 1→2 serie ×12 sul Target principale |
| Rest-pause | assente | 1×40 su braccia/petto |
| Serie W1 | 103 | 97–99 |
| Frequenza | 4 giorni, gruppi 2×/sett | 4 giorni, gruppi 2×/sett |
