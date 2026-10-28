# Frappaula Fit — istruzioni per Claude Code

Progetto personale di Francesco (titolare di Ottica Curci, Rieti): PWA di bodybuilding per lui e per sua moglie, ispirata a un'app esistente (V Athlete) ma con grafica, testi ed esercizi propri.

## Ordine di lettura
1. `SPEC.md` — specifica completa (struttura, formule, tabelle, schermate, parti aperte).
1b. `TEST_INIZIO_BLOCCO.md` — **test di carico a inizio blocco (prevale su SPEC §6.1)**: stima Brzycki per i fondamentali, serie unica 10/12/14RM per gli altri.
2. `docs/INDICE_MATERIALE.md` — mappa di tutto il materiale.
3. `docs/note_elaborate/MEMORIA_GENERALE.md` — regole metodologiche e decisioni.
4. `docs/note_elaborate/struttura_programma_vathlete.md` — tabelle reali del Blocco 1 dell'app di riferimento (servono per i test automatici).
5. `docs/testo_integrale/` — testo del libro e degli ebook (libro e foto in OCR: possibili errori sui numeri; per i dubbi fa fede l'originale in `materiale_zip/`).

## Regole
- Lingua dell'app e dei commenti rivolti all'utente: **italiano**.
- Non copiare grafica, video, testi o marchi di V Athlete. Esercizi con nomi generici.
- Il programma (esercizi, template, tabelle) sta in **file di dati**, non nel codice. Il motore dei carichi deve avere test automatici con i casi di SPEC §6.4.
- Local-first e offline; sincronizzazione su database gratuito (Supabase) con due login. Nessun costo ricorrente.
- Android (Chrome) per Francesco, **iPhone (Safari, PWA da Home)** per la moglie: testare timer e notifiche su entrambi e riportare l'esito reale, non presunto.
- Non inventare dove la SPEC dice "da definire" o "provvisorio" (profilo moglie, Blocco 2, stripping): segnala la lacuna e proponi una scelta in una riga.
- Hosting previsto: GitHub Pages, account `FrancescoOpto`.

## Stile di lavoro richiesto dall'utente
- Risposte brevi e chiare, in italiano.
- Nessun complimento né apertura di cortesia. Se vedi un difetto o un rischio nel piano, dillo nella prima frase.
- Etichetta le affermazioni importanti: [Certo], [Probabile], [Ipotesi].
- Le scelte tecniche le decidi tu: non fare domande di metodo, ma spiega in breve perché hai scelto così. Se l'utente ti contesta senza fatti nuovi, mantieni la posizione.
- Prima di dichiarare finito: esegui i test e verifica l'app davvero (anche con un browser headless), non dedurlo dal codice.

## Stato (28/10/2026)
Materiale del Blocco 1 e libro "Project Bodybuilding" completi. Mancano i libri su glutei e allenamento femminile. Aggiunto TEST_INIZIO_BLOCCO.md dai video dei test (28/10).

**App scritta e funzionante** (vedi `README.md`): Vite + TypeScript + Preact + signals, router a hash, IndexedDB (idb-keyval), vite-plugin-pwa, Vitest.
- `src/data/`: esercizi (con `carico_modo`, `fondamentale` solo per panca/squat/stacco/hip thrust, `ROTAZIONE_GUIDA` per blocco), contenitori (N=2..5, preset uomo/donna), tabelle. `src/motore/`: carichi (`stimaMassimale`), prescrizione (`modoTest`, `ripetizioniTest` = rip Fase 1 + 2), generatore (guida per blocco, promozione a fondamentale). 47 test, casi §6.4 e TEST_INIZIO_BLOCCO inclusi. `src/store/`: stato, db, sync Supabase REST. `src/ui/`: tutte le schermate di SPEC §9.1; settimana di test a due modalità (stima / serie unica).
- Verificato in browser (Chromium): setup → test (stima 4×80 → 87,5; serie unica 10@28; completamento bloccato finché mancano esercizi) → seduta → serie con timer e autocorrezione → completamento → storico → persistenza.
- **Non verificato**: timer/notifiche su telefoni reali; sync Supabase su progetto reale; offline sul dispositivo. Profilo donna provvisorio.
- Deploy: `.github/workflows/deploy.yml` (Pages), `keepalive.yml` (Supabase). Repo git locale, nessun push.
- Comandi: `npm run dev`, `npm test`, `npm run build`, `npm run preview` (serve su `/FrappaulaFit/`).

## Modifiche recenti (leggi prima di tutto)
- 28/10: nuovo `TEST_INIZIO_BLOCCO.md` — test a inizio di ogni blocco (stima Brzycki per i fondamentali, serie unica 10/12/14RM per gli altri). Prevale su SPEC §6.1.
- 28/10: fondamentali permanenti = panca, squat, stacco (+ hip thrust per lei). Il military NON è fondamentale: l'esercizio guida di ogni gruppo ruota per blocco (spalle: B1 military, B2 spinte manubri seduto). Vedi TEST_INIZIO_BLOCCO.md §1b e SPEC §4.3.
- 28/10: nuovo `docs/note_elaborate/blocco2_giorno_A.md` (Blocco 2, giorno A, tutte le fasi/settimane). Conferma le tabelle di SPEC §7; corrette riga AB-Scarico (3×15) e riga C-Fase 2 (rip invariate). Il carico appare solo per gli esercizi testati nello stesso giorno: nella nostra app lo precompiliamo dall'esercizio equivalente.
