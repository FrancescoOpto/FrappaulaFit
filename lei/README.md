# Frappaula Fit · Lei

App separata, solo per lei, pubblicata su https://francescoopto.github.io/FrappaulaFit/lei/ (l'app di Francesco resta su https://francescoopto.github.io/FrappaulaFit/, invariata).

## Programma
- Fonte: libro "Glutei", cap. II, **programmazione per intermedi** (18 settimane: volume → ibrida volume/carico → intensificazione), note in `docs/note_elaborate/GLUTEI_cap2_programmazione.md`.
- Proposta approvata il 16/11/2026: `docs/PROPOSTA_PROGRAMMA_DONNA.md`. Tre sedute A, B, C: prima i glutei del libro (Tab. 2.25, un gruppo diverso a rotazione, esercizi diversi a ogni fase), poi la parte alta (dorso in tutte le sedute, 12 serie a settimana) e l'addome.
- Dati in `src/data/programma.ts` (righe del libro settimana per settimana), esercizi in `src/data/esercizi.ts`.
- Calendario (`src/motore/calendario.ts`): giro completo = Fase 1 × 6, scarico, Fase 2 × 6, scarico, Fase 3 × 6, con il test davanti; poi scarico, nuovo test e si riparte. 3 mesi → 4 + 3 + 3 settimane (si arriva comunque all'intensificazione); 6 mesi → il programma intero.
- Carichi (`src/motore/prescrizione.ts`): squat e stacco in % del massimale (senza fattore 0,9); gli altri in "n RM" dal test (Brzycki fino a 14 ripetizioni, oltre la Tab. 2.23 del libro); "+10/15 %" del libro → +10 % (+15/20 % → +15 %) con tetto a una ripetizione di riserva [Ipotesi]; il carico scritto da lei sostituisce il piano e ne segue gli aumenti.
- Scarico [Ipotesi]: prima settimana della fase finita con metà delle serie (minimo 2).
- Dimagrimento: una serie in meno su parte alta e glutei complementari (mai sui pesanti), circuito con recuperi più brevi; i carichi non cambiano.
- Modalità **classica** o **circuito PHA**, scelta prima di ogni seduta (`src/motore/seduta.ts`): in PHA squat, stacco, hip thrust e squat con fermo restano a serie normali, il resto in circuito alternando glutei e parte alta (transizioni 30″ / fine giro 2′30″; in Dimagrimento 20″ / 2′). In classica, oltre il tetto di tempo, la parte alta perde serie (mai sotto 2).
- Progressione doppia sulla parte alta: tutte le serie in cima al range → +1 passo di carico la volta dopo.

## Tecnica
- Stesso stack dell'app di Francesco (Vite + Preact + signals, PWA), grafica uguale con accento rosa, tema scuro o chiaro.
- Indipendente: IndexedDB `frappaula-lei`, chiavi di sincronizzazione `lei:*` sulla stessa tabella Supabase, service worker e cache propri, localStorage `frappaula-lei-*`.
- Comandi: `npm run dev:lei` (porta 5174), test in `src/motore/lei.test.ts` (girano con `npm test`), la build normale (`npm run build`) costruisce entrambe le app.
