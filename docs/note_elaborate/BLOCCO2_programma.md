# BLOCCO 2 — Programma completo (giorni A, B, C, D) — dati ricavati dai video dell'app di riferimento
Fonte: 16 video + 4 screenshot del 28/10/2026 (utente, app di riferimento). **Leggere prima la sintesi (§A), poi le tabelle per giorno (§B).** Sostituisce i file `blocco2_giorno_A/B/C/D.md`. Tutte le serie×ripetizioni sono state lette direttamente; l'unica cella dedotta è il crunch di W55 (giorno C: 3×13, imposto dalla tabella AB).

## A. Sintesi per il motore (regole valide in tutti i giorni)
### A1. Struttura della settimana (4 giorni)
| Giorno | Gruppi | R1 (fondamentale) | Target | Complementari | Addome |
|---|---|---|---|---|---|
| A | Petto, schiena, tricipiti, addome | Panca piana | Spinte manubri 45° (R2), lat machine presa media (R3) | 5 | Crunch cavo alto (AB) |
| B | Gambe/glutei, spalle, bicipiti | Squat | Stacco rumeno (R2), military press (R3b) | 5 | — |
| C | Schiena, petto, tricipiti, addome | **nessuno** | T-bar triangolo e lat triangolo (R2 ×2), spinte manubri piana (R3c) | 5 | Crunch hyperextension (AB) |
| D | Spalle, schiena, gambe/glutei, bicipiti | Stacco da terra | Spinte in alto manubri seduto (R2) | 6 | — |
Esercizi per giorno: A 9, B 8, C 9, D 8. Ogni fondamentale compare **una sola volta a settimana** come R1; **nessun ruolo L** nel Blocco 2 a 4 giorni.
### A2. Tabelle serie×ripetizioni per tabella di progressione (cicli 1→5) [Certo]
La tabella dipende dall'**esercizio nello slot**, non dal ruolo né dal gruppo muscolare. Esistono 5 tabelle Target + AB:
| Tabella | Esercizi (Blocco 2) | Fase 1 | Fase 2 | Fase 3 | Scarico |
|---|---|---|---|---|---|
| R1 | panca, squat, stacco | 4×5, 4×5, 4×6, 4×5, 4×5 | 3×6, 3×6, 4×6, 4×6, 3×7 | 3×5, 3×5, 4×5, 4×5, 4×3 | 3×7 |
| R2 | stacco rumeno, spinte 45°, T-bar triangolo, lat triangolo, spinte alto manubri seduto | 3×8, 3×8, 4×8, 4×8, 4×8 | 3×9, 3×9, 4×9, 4×9, 4×9 | 3×7, 4×7, 3×8, 4×8, 3×6 | 3×9 |
| R3 | lat machine presa media (giorno A) | 3×8, 3×8, 3×8, 4×8, 4×8 | 3×9, 3×9, 4×9, 4×9, 3×10 | 3×8, 4×8, 4×8, 3×9, 3×10 | 2×10 |
| R3b | military press (giorno B) | 3×8, 3×8, 3×8, 3×9, 3×9 | 4×9, 4×9, 3×10, 3×10, 4×10 | 3×8, 3×8, 4×8, 3×9, 4×9 | 3×10 |
| R3c | spinte manubri panca piana (giorno C) | 3×8, 3×8, 3×8, 3×9, 3×9 | 4×9, 4×9, 3×10, 3×10, 3×10 | 3×8, 3×8, 4×8, 3×9, 4×9 | 2×10 |
| AB | crunch cavo alto, crunch hyperextension | 3×12 fisso | 3×13, 3×13, 3×14, 3×14, 3×15 | 3×12, 3×12, 3×13, 3×13, 3×14 | 3×15 |
R3, R3b, R3c sono quasi uguali tra loro ma divergono su alcuni cicli: nel motore vanno tenute come **dati per slot** (campo `tabella_prog`), non come regole.
### A3. Carichi
- Fondamentali: `carico(n RM) = 0,9 × stima1RM × (37−n)/36`, arrotondato a 0,5 kg. Scala: Fase 1 c1–3 9RM, c4–5 7RM; Fase 2 7RM; Fase 3 c1–4 5RM, c5 3RM; Scarico 11RM. Verificato su panca (stima 87,5 → 61,5/65,5/70/74,5/57), squat (stima 56,5 → 39,5/42,5/45/48/36,5), stacco (stima 90 → 63/67,5/72/76,5/58,5).
- Target non fondamentali e complementari: **carico fisso del test per tutto il blocco** (reps di test = reps Fase 1 + 2). Il kg che l'utente modifica resta salvato (SPEC §9.2b).
- Il carico è mostrato solo se l'esercizio è stato testato **nello stesso giorno**; varianti e esercizi testati in altri giorni compaiono senza kg → nella nostra app: ereditare dall'esercizio equivalente testato.
### A4. Complementari
- **Serie×rip fissate dallo slot** (non dall'esercizio), identiche nelle 5 settimane di una fase, **nessun +1 rip in Fase 2**; reps = reps del test − 2.
- Varianti: in Fase 2 cambiano quasi tutti i complementari, in Fase 3 ne cambiano la maggior parte e 2–3 tornano dalla Fase 1; l'esercizio che ritorna prende serie×rip del **nuovo slot** (es. push down 4×10 → 3×12, curl 45° 3×10 → 3×12).
- Scarico: complementari −1 serie (min 2), reps invariate; R1 11RM 3×7; R2 stesso carico 3×9; AB invariato 3×15.
### A5. Guida (primo esercizio) per gruppo, ruota ogni blocco
Petto: spinte manubri (45° nel giorno A, piana nel C) · Schiena: lat machine media (A) e T-bar/lat triangolo (C) · Spalle: military press (giorno B) e **spinte in alto manubri seduto** (giorno D, "guida" di spalle del Blocco 2). Precisazione dell'utente: il rematore T-bar è il riferimento della schiena e non un fondamentale; il tiraggio alla sbarra può alternarsi come guida. Servono **sempre alternative equivalenti**.
### A6. Domande aperte
Blocco 3 (nuovi esercizi e tabelle); se il fattore 0,9 vale anche nel Blocco 3; se nel Blocco 1 i complementari avevano davvero +1 rep in Fase 2 (note Keep) o è un errore di nota; ruolo L in configurazioni a 3 giorni.

## B. Tabelle per giorno

### Giorno A
Video: Screen_Recording_20261028_052154 (Fase 1), _052515 (Fase 2), _052545 (Scarico), _052648 (Fase 3). Utente, app di riferimento. Workout A = W1, 5, 9, 13, 17 (Fase 1) · 21, 25, 29, 33, 37 (Fase 2) · Scarico 1 · 41, 45, 49, 53, 57 (Fase 3). [Certo. Tutte le settimane sono state lette; W45 dallo screenshot dell'utente, il resto dai video.]

###### Tabelle settimana per settimana
Carichi in kg. `V` = variante nuova senza carico prescritto.
##### Fase 1 (cicli 1→5 = W1, 5, 9, 13, 17)
| Slot | Esercizio | W1 | W5 | W9 | W13 | W17 |
|---|---|---|---|---|---|---|
| R1 | Panca piana (Target) | 4×5@61,5 | 4×5@61,5 | 4×6@61,5 | 4×5@65,5 | 4×5@65,5 |
| R2 | Spinte manubri panca 45° (Target) | 3×8@28 | 3×8@28 | 4×8@28 | 4×8@28 | 4×8@28 |
| C | Croci ai cavi altezza petto | 3×10@20 | = | = | = | = |
| R3 | Lat machine presa media (Target) | 3×8@60 | 3×8@60 | 3×8@60 | 4×8@60 | 4×8@60 |
| C | Rematore manubrio | 2×8@28 | = | = | = | = |
| C | Lat machine presa larga | 2×10@55 | = | = | = | = |
| C | Push down corda al cavo alto | 4×10@35 | = | = | = | = |
| C | French press corda al cavo alto | 3×12@12 | = | = | = | = |
| AB | Crunch in ginocchio al cavo alto (Target) | 3×12@40 | = | = | = | = |
##### Fase 2 (W21, 25, 29, 33, 37)
| Slot | Esercizio | W21 | W25 | W29 | W33 | W37 |
|---|---|---|---|---|---|---|
| R1 | Panca piana | 3×6@65,5 | 3×6@65,5 | 4×6@65,5 | 4×6@65,5 | 3×7@65,5 |
| R2 | Spinte manubri 45° | 3×9@28 | 3×9@28 | 4×9@28 | 4×9@28 | 4×9@28 |
| C | **V** Croci ai cavi alti a 90° | 3×10 | = | = | = | = |
| R3 | Lat machine presa media | 3×9@60 | 3×9@60 | 4×9@60 | 4×9@60 | 3×10@60 |
| C | **V** Pulley machine triangolo | 2×8 | = | = | = | = |
| C | **V** Lat machine triangolo | 2×10 | = | = | = | = |
| C | **V** French press manubri su panca piana | 4×10 | = | = | = | = |
| C | **V** French press corda al cavo basso | 3×12 | = | = | = | = |
| AB | Crunch al cavo alto (Target) | 3×13@40 | 3×13@40 | 3×14@40 | 3×14@40 | 3×15@40 |
##### Scarico 1
Panca **3×7@57** (11RM) · Spinte 3×9@28 · Croci alti 2×10 · Lat media 2×10@60 · Pulley 2×8 · Lat triangolo 2×10 · French manubri 3×10 · French corda basso 2×12 · Crunch **3×15@40** (invariato rispetto a W37).
##### Fase 3 (W41, 45, 49, 53, 57)
| Slot | Esercizio | W41 | W45 | W49 | W53 | W57 |
|---|---|---|---|---|---|---|
| R1 | Panca piana (Target) | 3×5@70 | 3×5@70 | 4×5@70 | 4×5@70 | **4×3@74,5** |
| R2 | Spinte manubri 45° (Target) | 3×7@28 | 4×7@28 | 3×8@28 | 4×8@28 | 3×6@28 |
| C | **V** Croci ai cavi altezza petto seduto | 3×10 | = | = | = | = |
| R3 | Lat machine presa media (Target) | 3×8@60 | 4×8@60 | 4×8@60 | 3×9@60 | 3×10@60 |
| C | **V** Rematore al multipower | 2×10 | = | = | = | = |
| C | Lat machine presa larga (torna dalla Fase 1) | 2×10@55 | = | = | = | = |
| C | **V** French press EZ su panca piana | 4×10 | = | = | = | = |
| C | Push down corda al cavo alto (torna dalla Fase 1) | 3×12@35 | = | = | = | = |
| AB | Crunch al cavo alto (Target) | 3×12@40 | 3×12@40 | 3×13@40 | 3×13@40 | 3×14@40 |
Nota: Push down passa da 4×10 (Fase 1) a 3×12 (Fase 3): la variante tornata riprende serie×rip del **nuovo slot**, non della Fase 1.

###### Cosa confermano i dati
1. **Tabelle serie×rip di SPEC §7 identiche al Blocco 1** per R1, R2, R3 e AB, verificate su tutte e 15 le settimane di Fase 1-2-3 (nessuna cella mancante). Il programma è indipendente dagli esercizi: cambiano gli esercizi, non la struttura. [Certo]
2. **Carichi RM da un 1RM della panca di 78,75 kg**: 9RM = 61,5 · 7RM = 65,5 · 5RM = 70 · 3RM = 74,5 · 11RM = 57. Sono gli stessi valori già in SPEC §6.4 (squat del Blocco 1). [Certo] Nel video del Test 1 avevo letto per la panca una stima di 87,5 kg (4×80): **i due valori non coincidono**; con 87,5 kg il 9RM sarebbe 68. Probabile che l'utente abbia ripetuto il test o usato valori di prova: da far notare a Code come caso di test, non da risolvere.
3. **Regola ripetizioni di test = ripetizioni Fase 1 + 2 confermata** su tutti i Target e i complementari del giorno A (test 10→3×8; 12→2×10/4×10/3×10; 14→3×12 crunch), e **il carico lavorato è esattamente il carico del test**, fisso per tutto il blocco.
4. **Carico mostrato solo se l'esercizio ha avuto il test nel giorno A**: Push down, Lat larga, Crunch, Lat media ecc. (testati nel Test 1) hanno kg; Lat triangolo, French manubri, French corda basso, Rematore multipower (testati nel Test 3 = giorno C) e le varianti mai testate (croci alti 90°, pulley triangolo, croci seduto, French EZ) compaiono **senza kg**: l'app di riferimento non riporta il carico da un altro giorno. Nella nostra app: precompilare dal carico dell'esercizio equivalente testato (anche di un altro giorno) o, se non esiste, lasciare vuoto; sempre modificabile. [Mia decisione, miglioramento]
5. **Scarico**: R1 → 11RM, 3×7; R2 stesso carico 3×9 (−1 serie dalla W37); R3 2×10 (−1 serie); complementari −1 serie (min. 2); **AB invariato 3×15** (non 2×12 come in SPEC §7).
6. **Fase 2, complementari**: serie×rip invariate rispetto alla Fase 1 (nessun "+1 rip"). SPEC §7 riga C diceva "+1 rip in Fase 2": va corretta per questo giorno; da verificare sugli altri giorni.
7. Varianti per fase: in Fase 2 cambiano **tutti e 5** i complementari; in Fase 3 ne cambiano 3 (croci seduto, rematore multipower, French EZ) e 2 tornano dalla Fase 1 (lat presa larga, push down). Le varianti ruotano, gli slot no.

###### 3. Struttura del giorno A (slot)
Petto: R1 (fondamentale, panca) · R2 (Target manubri) · C | Schiena: R3 (Target lat) · C · C | Tricipiti: C · C | Addome: AB (Target). Totale 9 esercizi: 1 fondamentale, 3 Target + 1 Target addome, 5 complementari. Tricipiti = 7 serie a seduta in tutte e tre le fasi (4+3, 4+3, 4+3 / 3+4 a seconda dello slot), 5 in Scarico.


### Giorno B
Video: Screen_Recording_20261028_054028 (Fase 1), _054153 (Fase 2), _054209 (Scarico 2), _054300 (Fase 3). Workout B = W2, 6, 10, 14, 18 (Fase 1) · 22, 26, 30, 34, 38 (Fase 2) · Scarico 2 · 42, 46, 50, 54, 58 (Fase 3). Il W1 (giorno A) risulta già completato nell'app; tutti i workout B sono bloccati ("Stai sbirciando").

###### Tabelle settimana per settimana (kg)
`V` = variante nuova senza carico prescritto.
##### Fase 1
| Slot | Esercizio | W2 | W6 | W10 | W14 | W18 |
|---|---|---|---|---|---|---|
| R1 | Squat (Target) | 4×5@39,5 | 4×5@39,5 | 4×6@39,5 | 4×5@42,5 | 4×5@42,5 |
| R2 | Stacco rumeno bilanciere (Target) | 3×8@45 | 3×8@45 | 4×8@45 | 4×8@45 | 4×8@45 |
| C | Leg press | 3×8@90 | 3×8@90 | 3×8@90 | 3×8@90 | 3×8@90 |
| R3b | Military press (Target) | 3×8@22 | 3×8@22 | 3×8@22 | **3×9**@22 | **3×9**@22 |
| C | Alzate laterali al cavo basso | 3×10@7 | 3×10@7 | 3×10@7 | 3×10@7 | 3×10@7 |
| C | Alzate posteriori manubri a 90° | 3×10@10 | 3×10@10 | 3×10@10 | 3×10@10 | 3×10@10 |
| C | Curl manubri su panca 45° | 3×10@10 | 3×10@10 | 3×10@10 | 3×10@10 | 3×10@10 |
| C | Curl manubri seduto | 3×12@12 | 3×12@12 | 3×12@12 | 3×12@12 | 3×12@12 |
##### Fase 2
| Slot | Esercizio | W22 | W26 | W30 | W34 | W38 |
|---|---|---|---|---|---|---|
| R1 | Squat | 3×6@42,5 | 3×6@42,5 | 4×6@42,5 | 4×6@42,5 | 3×7@42,5 |
| R2 | Stacco rumeno | 3×9@45 | 3×9@45 | 4×9@45 | 4×9@45 | 4×9@45 |
| C | **V** Affondi al multipower | 3×8 | 3×8 | 3×8 | 3×8 | 3×8 |
| R3b | Military press | **4×9**@22 | **4×9**@22 | **3×10**@22 | **3×10**@22 | **4×10**@22 |
| C | **V** Alzate laterali manubri in piedi | 3×10 | 3×10 | 3×10 | 3×10 | 3×10 |
| C | **V** Alzate posteriori al cavo basso a 90° | 3×10 | 3×10 | 3×10 | 3×10 | 3×10 |
| C | **V** Curl manubri in piedi | 3×10 | 3×10 | 3×10 | 3×10 | 3×10 |
| C | **V** Curl manubri su panca 60° | 3×12 | 3×12 | 3×12 | 3×12 | 3×12 |
##### Scarico 2
Squat **3×7@36,5** (11RM) · Stacco rumeno 3×9@45 · Affondi multipower 2×8 · Military **3×10**@22 · Alzate laterali piedi 2×10 · Alzate posteriori cavo 2×10 · Curl in piedi 2×10 · Curl panca 60° 2×12. (Leg press assente, come in Fase 2.)
##### Fase 3
| Slot | Esercizio | W42 | W46 | W50 | W54 | W58 |
|---|---|---|---|---|---|---|
| R1 | Squat | 3×5@45 | 3×5@45 | 4×5@45 | 4×5@45 | **4×3@48** |
| R2 | Stacco rumeno | 3×7@45 | 4×7@45 | 3×8@45 | 4×8@45 | 3×6@45 |
| C | Leg press (torna dalla Fase 1) | 3×8@90 | = | = | = | = |
| R3b | Military press | 3×8@22 | 3×8@22 | 4×8@22 | 3×9@22 | 4×9@22 |
| C | **V** Alzate laterali su panca 45° | 3×10 | = | = | = | = |
| C | **V** Alzate posteriori manubri seduto | 3×10 | = | = | = | = |
| C | **V** Curl bilanciere EZ | 3×10 | = | = | = | = |
| C | Curl manubri su panca 45° (torna dalla Fase 1) | 3×12@10 | = | = | = | = |

###### Cosa confermano i dati
1. **Squat (R1) e stacco rumeno (R2) seguono le tabelle di SPEC §7 su tutte le 15 settimane**: R1 F1 4×5, 4×5, 4×6, 4×5, 4×5; F2 3×6, 3×6, 4×6, 4×6, 3×7; F3 3×5, 3×5, 4×5, 4×5, 4×3. R2 F1 3×8, 3×8, 4×8, 4×8, 4×8; F2 3×9, 3×9, 4×9, 4×9, 4×9; F3 3×7, 4×7, 3×8, 4×8, 3×6; Scarico 3×7 e 3×9. [Certo]
2. **Scale RM dello squat con coefficiente 0,9** (vedi §3): 9RM 39,5 (F1 c1–3) · 7RM 42,5 (F1 c4–5 e tutta la F2) · 5RM 45 (F3 c1–4) · 3RM 48 (F3 c5) · 11RM 36,5 (Scarico).
3. **Stacco rumeno e military press**: carico fisso del test per tutto il blocco (45 e 22 kg). Test 10 rip → 3×8 in Fase 1 (10−2). [Certo]
4. **Military press NON segue la tabella R3 del giorno A** (la chiamiamo R3b). Progressione completa (cicli 1→5): **F1 3×8, 3×8, 3×8, 3×9, 3×9 · F2 4×9, 4×9, 3×10, 3×10, 4×10 · F3 3×8, 3×8, 4×8, 3×9, 4×9 · Scarico 3×10**. Carico fisso 22 kg (test 10 rip). In Fase 1 le serie restano 3 e al ciclo 4 salgono le reps (8→9); in Fase 2 le reps salgono a 9–10 con serie 4/4/3/3/4; in Fase 3 si torna a 8 rip con 3/3/4/3/4 serie. [Certo]
5. **Complementari: stesse serie×rip nelle 5 settimane di ogni fase** (nessun "+1 rip" in Fase 2, come nel giorno A); le varianti compaiono **senza kg** salvo l'esercizio testato nel giorno B (alzate laterali cavo basso 7, alzate posteriori 90° 10, curl 45° 10, curl seduto 12, leg press 90) che compare con kg quando ritorna. [Certo]
6. **Esercizio che ritorna nella Fase 3 prende serie×rip del nuovo slot**: curl panca 45° da 3×10 (slot 1, F1) a 3×12 (slot 2, F3) con lo stesso carico 10 kg. Stesso comportamento del Push down nel giorno A. [Certo]
7. **Scarico**: R1 11RM 3×7; R2 carico invariato 3×9; R3 (military) 3×10 (−1 serie rispetto a 4×10); complementari −1 serie (3→2); nessun addome in questo giorno. [Certo]
8. **Struttura del giorno B (8 esercizi)**: Gambe/glutei: R1 squat, R2 stacco rumeno, C (leg press → affondi → leg press) · Spalle: R3 military, C, C · Bicipiti: C, C. Niente AB. Le varianti dei complementari cambiano tutte in Fase 2 e ne tornano due/tre in Fase 3 (leg press, curl 45°); alzate laterali, alzate posteriori e curl EZ sono nuove. [Certo]
9. Fondamentale squat nel giorno B è R1 (4×5): stessa tabella di panca nel giorno A. In giorno D lo squat sarà L (più leggero, da verificare).

###### 3. Scoperta importante: coefficiente 0,9 tra massimale stimato e carichi RM
Test del Blocco 2: squat 5×50 → stima 56,5 kg (Test 2, video del 28/10). Carichi squat nel giorno B:
| RM | 56,5×(37−n)/36 | ×0,9 | Mostrato dall'app |
|---|---|---|---|
| 9RM | 43,9 | 39,5 | **39,5** |
| 7RM | 47,1 | 42,4 → 42,5 | **42,5** |
| 5RM | 50,2 | 45,2 → 45 | **45** |
| 3RM | 53,4 | 48,0 | **48** |
| 11RM | 40,8 | 36,7 → 36,5 | **36,5** |
Lo stesso rapporto vale per la panca: stima 87,5 (Test 1) → 78,75 = 87,5×0,9 (giorno A: 9RM 61,5, 7RM 65,5, 5RM 70, 3RM 74,5, 11RM 57). Per lo stacco: stima 90 (Test 4) → 81, cioè 0,9×90: è lo stesso 1RM 81 già presente in SPEC §6.4 come caso di verifica (9RM 63, 7RM 67,5, …). **Quindi: carico(n RM) = 0,9 × stima1RM × (37−n)/36**, arrotondato a 0,5 kg. [Certo: 3 serie di dati su 3 fondamentali, tutte coerenti] Origine del 0,9 non nota (massimale "alleggerito" dal 10%, come ha detto l'utente; potrebbe essere solo dal Blocco 2 in poi o un impostazione): nella nostra app è un parametro `fattore_lavoro` = 0,90, modificabile in Impostazioni e per blocco.


### Giorno C
Video: Screen_Recording_20261028_055458 (Fase 1), _055641 (Fase 2), _055700 (Scarico 3), _055753 (Fase 3) + screenshot Workout 15. Workout C = W3, 7, 11, 15, 19 (Fase 1) · 23, 27, 31, 35, 39 (Fase 2) · Scarico 3 · 43, 47, 51, 55, 59 (Fase 3).

###### Tabelle settimana per settimana (kg)
##### Fase 1
| Slot | Esercizio | W3 | W7 | W11 | W15 | W19 |
|---|---|---|---|---|---|---|
| R2 | Rematore T-bar triangolo (Target) | 3×8@40 | 3×8@40 | 4×8@40 | 4×8@40 | 4×8@40 |
| R2 | Lat machine triangolo (Target) | 3×8@65 | 3×8@65 | 4×8@65 | 4×8@65 | 4×8@65 |
| C | Rematore al multipower | 3×10@30 | = | = | = | = |
| R3c | Spinte manubri panca piana (Target) | 3×8@26 | 3×8@26 | 3×8@26 | 3×9@26 | 3×9@26 |
| C | Panca piana al multipower | 3×10@30 | = | = | = | = |
| C | Croci manubri su panca piana | 2×10@12 | = | = | = | = |
| C | French press manubri su panca piana | 3×8@12 | = | = | = | = |
| C | French press corda al cavo basso | 3×10@30 | = | = | = | = |
| AB | Crunch su hyperextension (Target) | 3×12@20 | 3×12@20 | 3×12@20 | 3×12@20 | 3×12@20 |
##### Fase 2 (carichi solo dove l'esercizio è stato testato nel giorno C)
| Slot | Esercizio | W23 | W27 | W31 | W35 | W39 |
|---|---|---|---|---|---|---|
| R2 | Rematore T-bar triangolo | 3×9@40 | 3×9@40 | 4×9@40 | 4×9@40 | 4×9@40 |
| R2 | Lat machine triangolo | 3×9@65 | 3×9@65 | 4×9@65 | 4×9@65 | 4×9@65 |
| C | **V** Lat machine presa larga | 3×10 | = | = | = | = |
| R3c | Spinte manubri panca piana | 4×9@26 | 4×9@26 | 3×10@26 | 3×10@26 | 3×10@26 |
| C | **V** Panca 30° al multipower | 3×10 | = | = | = | = |
| C | **V** Croci ai cavi altezza petto seduto | 2×10 | = | = | = | = |
| C | **V** Push down barra al cavo alto | 3×8 | = | = | = | = |
| C | **V** French press corda al cavo alto | 3×10 | = | = | = | = |
| AB | Crunch su hyperextension | 3×13@20 | 3×13@20 | 3×14@20 | 3×14@20 | 3×15@20 |
##### Scarico 3
T-bar 3×9@40 · Lat triangolo 3×9@65 · Lat presa larga 2×10 · Spinte **2×10**@26 · Panca 30° 2×10 · Croci cavi 2×10 · Push down 2×8 · French corda cavo alto 2×10 · Crunch **3×15**@20.
##### Fase 3
| Slot | Esercizio | W43 | W47 | W51 | W55 | W59 |
|---|---|---|---|---|---|---|
| R2 | Rematore T-bar triangolo | 3×7@40 | 4×7@40 | 3×8@40 | 4×8@40 | 3×6@40 |
| R2 | Lat machine triangolo | 3×7@65 | 4×7@65 | 3×8@65 | 4×8@65 | 3×6@65 |
| C | **V** Rematore manubrio | 3×10 | = | = | = | = |
| R3c | Spinte manubri panca piana | 3×8@26 | 3×8@26 | 4×8@26 | 3×9@26 | 4×9@26 |
| C | **V** Panca 45° al multipower | 3×10 | = | = | = | = |
| C | **V** Croci ai cavi alti | 2×10 | = | = | = | = |
| C | French press manubri su panca piana (torna dalla Fase 1) | 3×8@12 | = | = | = | = |
| C | French press corda al cavo basso (torna dalla Fase 1) | 3×10@30 | = | = | = | = |
| AB | Crunch su hyperextension | 3×12@20 | 3×12@20 | 3×13@20 | n.v. | 3×14@20 |

###### Cosa confermano i dati
1. **Il giorno C non ha un fondamentale (nessun R1)**: 9 esercizi, i due Target della schiena (T-bar e lat triangolo, stessa tabella) e le spinte manubri come Target del petto. [Certo]
2. **Rematore T-bar e lat triangolo seguono la tabella R2** (F1 3×8,3×8,4×8,4×8,4×8; F2 3×9,3×9,4×9,4×9,4×9; F3 3×7,4×7,3×8,4×8,3×6; Scarico 3×9). Stessa tabella dello stacco rumeno (giorno B) e delle spinte 45° (giorno A). [Certo]
3. **Crunch su hyperextension = tabella AB** (F1 3×12 fisso; F2 3×13,3×13,3×14,3×14,3×15; F3 3×12,3×12,3×13,3×13 (W55 dedotto),3×14; Scarico 3×15). [Certo salvo W55]
4. **Spinte manubri (Target petto) hanno una progressione propria, simile alla military ma non uguale** (la chiamiamo R3c): F1 3×8,3×8,3×8,3×9,3×9 · F2 4×9,4×9,3×10,3×10,**3×10** · F3 3×8,3×8,4×8,3×9,4×9 · Scarico **2×10**. La military del giorno B ha F2 c5 = 4×10 e Scarico 3×10: **le due tabelle divergono sul ciclo 5 di Fase 2 e sullo Scarico** (verificato rileggendo W38 e Scarico 2 del giorno B). [Certo]
5. **Complementari invariati nelle 5 settimane di ogni fase, come nei giorni A e B**; stessa serie×rip dello slot anche cambiando variante (rematore 3×10 → lat larga 3×10 → rematore manubrio 3×10; panca 3×10 in tutte e tre le fasi; croci 2×10; French manubri 3×8 → push down 3×8 → French manubri 3×8). Regola reps complementare = reps del test − 2 confermata (test 12 → 10, test 10 → 8; croci 12 → 2×10 con soli 2 set). [Certo]
6. **Scarico**: complementari −1 serie con minimo 2 (3→2, croci restano 2); T-bar e lat R2 invariati 3×9; spinte 2×10 (−1 dall'ultima settimana di F2); crunch 3×15. [Certo]
7. **In Fase 3 tornano due esercizi della Fase 1 (French manubri @12, French corda basso @30)**, gli altri 3 complementari sono varianti nuove senza carico. Il carico si mostra solo per gli esercizi testati nel giorno C (T-bar, lat triangolo, spinte, crunch, rematore multipower, panca multipower, croci manubri, French manubri, French corda basso). [Certo]
8. Carichi fissi per tutto il blocco: T-bar 40, lat triangolo 65, spinte 26, crunch 20, e i complementari testati. [Certo]

###### 3. Lezione per il motore
La progressione serie×rip **non è decisa dal "ruolo" ma dall'esercizio nello slot**: nei tre giorni letti esistono almeno quattro tabelle per i Target (R1, R2, R3, R3b/R3c). Va tenuta come dato per slot (`tabella_prog` nel file di dati), non nel codice. La somiglianza tra le tabelle R3b (military) e R3c (spinte) suggerisce che esista una famiglia "R3 alternativa"; la differenza sul ciclo 5 resta da spiegare (potrebbe dipendere dal volume settimanale del gruppo).

###### 4. Precisazioni dell'utente (28/10)
- Il **rematore T-bar** è il **punto di riferimento (guida) della schiena**: non è un fondamentale, ma è il primo esercizio costruito e strutturato per quel gruppo. Come già deciso per le spalle, **la guida ruota tra i blocchi**: si può alternare un rematore con un esercizio di tirata alla sbarra quando serve cambiare stimolo.
- **Servono sempre alternative equivalenti** per ogni esercizio (scelta in fase di test e in seduta).


### Giorno D
Video: Screen_Recording_20261028_060851 (Fase 1), _060942 (Fase 2), _060957 (Scarico 4), _061102 (Fase 3). Workout D = W4, 8, 12, 16, 20 (Fase 1) · 24, 28, 32, 36, 40 (Fase 2) · Scarico 4 · 44, 48, 52, 56, 60 (Fase 3). **Tutte le 15 settimane + lo Scarico sono nei video, nessuna cella mancante.**

###### Tabelle settimana per settimana (kg)
##### Fase 1
| Slot | Esercizio | W4 | W8 | W12 | W16 | W20 |
|---|---|---|---|---|---|---|
| R2 | Spinte in alto manubri seduto (Target, guida spalle) | 3×8@20 | 3×8@20 | 4×8@20 | 4×8@20 | 4×8@20 |
| C | Alzate laterali manubri in piedi | 3×10@10 | = | = | = | = |
| C | Alzate laterali manubrio busto inclinato | 2×12@8 | = | = | = | = |
| R1 | **Stacco da terra (Target, fondamentale)** | 4×5@63 | 4×5@63 | 4×6@63 | 4×5@67,5 | 4×5@67,5 |
| C | Leg extension | 3×10@55 | = | = | = | = |
| C | Leg curl | 3×10@50 | = | = | = | = |
| C | Curl bilanciere EZ (solo dischi) | 4×8@30 | = | = | = | = |
| C | Curl manubri su panca 60° | 3×10@10 | = | = | = | = |
##### Fase 2
| Slot | Esercizio | W24 | W28 | W32 | W36 | W40 |
|---|---|---|---|---|---|---|
| R2 | Spinte in alto manubri seduto | 3×9@20 | 3×9@20 | 4×9@20 | 4×9@20 | 4×9@20 |
| C | **V** Alzate laterali su panca 30° | 3×10 | = | = | = | = |
| C | **V** Alzate laterali manubri seduto | 2×12 | = | = | = | = |
| R1 | Stacco da terra | 3×6@67,5 | 3×6@67,5 | 4×6@67,5 | 4×6@67,5 | 3×7@67,5 |
| C | Leg extension | 3×10@55 | = | = | = | = |
| C | Leg curl | 3×10@50 | = | = | = | = |
| C | **V** Curl manubri su panca 45° | 4×8 | = | = | = | = |
| C | **V** Curl manubri hammer seduto | 3×10 | = | = | = | = |
##### Scarico 4
Spinte 3×9@20 · Alzate laterali panca 30° 2×10 · Alzate seduto 2×12 · **Stacco 3×7@58,5** (11RM) · Leg extension 2×10@55 · Leg curl 2×10@50 · Curl 45° 3×8 · Hammer 2×10.
##### Fase 3
| Slot | Esercizio | W44 | W48 | W52 | W56 | W60 |
|---|---|---|---|---|---|---|
| R2 | Spinte in alto manubri seduto | 3×7@20 | 4×7@20 | 3×8@20 | 4×8@20 | 3×6@20 |
| C | Alzate laterali manubri in piedi (torna dalla Fase 1) | 3×10@10 | = | = | = | = |
| C | **V** Alzate laterali al cavo medio | 2×12 | = | = | = | = |
| R1 | Stacco da terra | 3×5@72 | 3×5@72 | 4×5@72 | 4×5@72 | **4×3@76,5** |
| C | Leg extension | 3×10@55 | = | = | = | = |
| C | Leg curl | 3×10@50 | = | = | = | = |
| C | **V** Curl manubri in piedi | 4×8 | = | = | = | = |
| C | Curl manubri su panca 60° (torna dalla Fase 1) | 3×10@10 | = | = | = | = |

###### Cosa confermano i dati
1. **Lo stacco è R1 al 100%**: stessa tabella e stessa scala RM della panca e dello squat (F1 4×5,4×5,4×6,4×5,4×5; F2 3×6,3×6,4×6,4×6,3×7; F3 3×5,3×5,4×5,4×5,4×3; Scarico 3×7). Carichi: **9RM 63 · 7RM 67,5 · 5RM 72 · 3RM 76,5 · 11RM 58,5 = 0,9 × 90 × (37−n)/36**, con stima di test 90 kg (Test 4): conferma del `fattore_lavoro` 0,90 (vedi giorno B). [Certo]
2. **Le spinte in alto manubri seduto (Target e guida spalle del Blocco 2) seguono la tabella R2** (F1 3×8,3×8,4×8,4×8,4×8; F2 3×9,3×9,4×9,4×9,4×9; F3 3×7,4×7,3×8,4×8,3×6; Scarico 3×9), **non** la R3b della military del Blocco 2 giorno B. Quindi la progressione dipende dallo slot e non dal gruppo muscolare. [Certo]
3. **Nessun ruolo L nel Blocco 2 a 4 giorni**: i tre fondamentali (panca A, squat B, stacco D) compaiono ciascuno una volta a settimana come R1. Il giorno C non ha fondamentale. Lo schema L (seconda esposizione leggera) resta valido solo per i casi con meno giorni o con fondamentale ripetuto, e per ora non è confermato dal Blocco 2. [Certo sui dati, da non estendere]
4. **Giorno D: 8 esercizi**, nessun addome. Spalle: R2 + 2 C (3×10, 2×12) · Schiena: solo lo stacco · Gambe/glutei: 2 C fissi (leg extension, leg curl: stessi esercizi e stesso carico in tutte le fasi) · Bicipiti: 2 C (4×8 e 3×10). Complementari invariati nelle 5 settimane di ogni fase; le varianti cambiano in Fase 2 (4 su 6), in Fase 3 ne tornano due dalla Fase 1. [Certo]
5. **Reps dei complementari = reps del test − 2**: curl EZ test 10 → 4×8; curl 60° test 12 → 3×10; leg ext test 12 → 3×10; alzate busto inclinato test 14 → 2×12. Il numero di serie dipende dallo slot, non dall'esercizio. [Certo]
6. **Scarico**: stacco 11RM 3×7; spinte 3×9 (stessa del ciclo 5); complementari −1 serie (min 2): 3→2, 2→2, 4→3 (curl 45° 3×8). [Certo]
7. **Carichi mostrati solo per gli esercizi testati nel giorno D** (spinte, alzate laterali piedi, alzate busto inclinato, leg ext, leg curl, curl EZ, curl 60°, stacco). Le varianti compaiono senza kg. [Certo]
8. Curl EZ: solo dischi (30 kg totali con bilanciere, vedi `carico_modo`).

