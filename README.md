# Frappaula Fit

PWA personale di bodybuilding a blocchi: test dei massimali, carichi calcolati, sedute generate, registrazione serie per serie, timer di recupero, storico. Specifica completa in [SPEC.md](SPEC.md).

## Avvio

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # motore dei carichi e generatore (Vitest)
npm run build      # dist/ con service worker e manifest
npm run preview    # anteprima della build su http://localhost:4173/FrappaulaFit/
```

## Struttura

| Cartella | Contenuto |
|---|---|
| `src/data/` | **Il programma come dati**: libreria esercizi (`esercizi.ts`), contenitori generici per N sedute (`contenitori.ts`), **Blocchi 1, 2 e 3 a 4 giorni letti dai video** (`blocco1.ts`, `blocco2.ts`, `blocco3.ts`: tabella per slot, varianti per fase con serie×rip proprie, righe rest-pause e seconde righe ×12), tabelle serie×rip R1/R2/R3/R3b/R3c/AB, scale RM, recuperi, volumi (`tabelle.ts`), regole del motore coach con fonte (`regole_coach.ts`). Si modificano senza toccare la logica. |
| `src/motore/` | Logica pura e testata: formula dei carichi (`carichi.ts`), prescrizione serie×rip@kg per seduta (`prescrizione.ts`), carichi correnti (`correnti.ts`), generatore delle sedute con varianti per fase e rigenerazione al confine di ciclo (`generatore.ts`), pianificatore a obiettivo (`pianificatore.ts`, solo logica). |
| `src/store/` | Stato con signals, persistenza IndexedDB (`db.ts`), sincronizzazione Supabase via REST (`sync.ts`). |
| `src/ui/` | Schermate Preact: Setup, Home, Seduta (anche in modalità test), Esercizio con timer, Progressi, Check-in, Impostazioni. Router a hash. |
| `supabase/schema.sql` | Tabella `kv` con RLS per la sincronizzazione (facoltativa). |
| `docs/` | Materiale di studio e note metodologiche (vedi `docs/INDICE_MATERIALE.md`). |

## Come funziona il programma

- **Blocco** = Test (1 ciclo) → Fase 1 (5) → Fase 2 (5) → Scarico (1) → Fase 3 (5). Un ciclo = un giro del contenitore (N sedute). N=3 → 51 sedute; N=4 → 68. Blocco breve: 12 cicli.
- **Test a inizio blocco** (`TEST_INIZIO_BLOCCO.md`): fondamentali permanenti (panca, squat, stacco, hip thrust) con **stima del massimale** — reps qualsiasi + carico, `1RM = kg × 36 / (37 − reps)` arrotondato (4×80 → 87,5), salvato come `1@kg`; tutti gli altri con **serie unica** a N RM, dove N = ripetizioni di lavoro della Fase 1 + 2 (3×8 → 10, 3×10 → 12, 3×12 → 14), salvato `N@kg` e usato fisso per tutto il blocco.
- **Esercizio guida** del gruppo (es. spalle): non è un fondamentale, ruota per blocco (`ROTAZIONE_GUIDA`: Blocco 1 military press, Blocco 2 spinte manubri seduto) ed è un Target a carico fisso. Promuovibile a fondamentale dalle Impostazioni → Test.
- **Carico fondamentali**: `fattore_lavoro × 1RM stimato × (37 − n) / 36` con la scala 9RM → 7RM → 5RM → 3RM (Fase 1 → Fase 3), 11RM in scarico; `fattore_lavoro` = 0,9 di default (l'app di riferimento: stima 87,5 → 9RM 61,5), modificabile in Impostazioni → Test. Il fondamentale "leggero" (seconda esposizione) sta due gradini sotto.
- **Ruoli e tabelle**: il ruolo (R1 fondamentale, R2/R3 Target, L fondamentale leggero, C complementare, AB addome) decide badge, recupero e tipo di test; la **tabella di progressione** è un dato dello slot (R1, R2, R3, R3b military, R3c spinte manubri, AB), perché nei video dipende dall'esercizio nello slot e non dal gruppo.
- **Blocco 3** (`blocco3.ts`): fondamentali liberi a percentuale piatta del massimale (77 % → 82 % → 87 %, scarico 77 %, tabella `B3_F` con `CARICO_PER_TABELLA`, senza fattore 0,9), Target 3×8 senza rampa (`B3_T8`, `B3_T10`), seconda riga ×12 del Target principale (1 → 2 serie dalla settimana 3, senza carico, sparisce in scarico), righe **rest-pause** (`1×40` = 40 ripetizioni totali con pause brevi; `1×10` = 10 + 3 mini-serie a cedimento con pause 30/40/50″; in scarico 2×12 / 2×10), squat e panca anche al multipower (`esclude_bilanciere`). Dopo il Blocco 3 si ricomincia dal Blocco 1.
- **Programmi letti dai video (4 giorni, uomo)**: Blocco 1 (`blocco1.ts`: panca R1 in A e leggera L in C, squat R1 in B e L in D, stacco in D, military con tabella R2, alzate laterali con tabella R3d) e Blocco 2 (`blocco2.ts`: panca/squat/stacco una volta a settimana, giorno C senza fondamentale, nessun L, military R3b, spinte manubri R3c). Complementari con varianti in Fase 2 e 3 (lo scarico usa quelle di Fase 2), anche con serie×rip diverse; le varianti senza test ereditano il carico dall'esercizio di Fase 1 dello stesso slot. **4 giorni è il default**: chi fa 3 sedute in una settimana fa la quarta la settimana dopo, la sequenza non cambia. Con 2, 3 o 5 giorni (o profilo donna) si usa il contenitore generico (segnalato nell'app come da definire). Le tabelle serie×rip valgono per ruolo, qualunque sia il contenitore.
- **Carichi correnti** (SPEC §9.2b): il kg che scrivi in seduta diventa il carico dell'esercizio per le sedute successive. Per i ruoli a carico fisso sostituisce il test; per i fondamentali con scala RM si salva il fattore `kg_inseriti / kg_previsti` e la progressione continua dal livello scelto. "Ripristina carico del piano" nella schermata esercizio e in Impostazioni → Test. Lo storico dei massimali per blocco è nei Progressi.
- **Autocorrezione**: ripetizioni mancate → serie successiva a −5 %; due sedute di fila → −2,5 % sul ciclo dopo (modificabile in Impostazioni → Test).
- **Modifiche in corso d'opera**: cambiare N, T, priorità o esclusioni rigenera solo le sedute future dal prossimo confine di ciclo; test, carichi e storico restano.

## Obiettivi, energia e moduli (SPEC_PIANIFICATORE)

- All'avvio (o da Impostazioni → Obiettivo) l'app chiede **obiettivo** (Massa / Mantenimento / Dimagrimento), **durata in cicli** e **stato energetico**; se scegli Massa in deficit avvisa (morbido: in deficit l'allenamento mantiene, non costruisce).
- **Moduli** (`src/motore/moduli.ts`): Massa = blocchi di riferimento; Mantenimento = blocco accorciato senza Fase 3; Dimagrimento = **Preservazione** (`preservazione.ts`), una trasformazione del Blocco 3 senza tabelle nuove: fondamentali 3×5 @77 % → 3×4 @82 % → scarico 2×4 @77 %, Target e complementari con una serie in meno (min 2), via seconde righe e rest-pause; sequenza con scarico ogni 5 cicli (`N=8 → 77 82 82 82 S 77 82 S`). Opzioni "preferisci le macchine" e "allenare la resistenza" (2×15–20 leggere in coda).
- **Cambio obiettivo** senza test: si applica alla fine del ciclo in corso (o subito, con conferma); il blocco si chiude, il nuovo parte con un **ciclo ponte** ai carichi del profilo. Il **profilo carichi** per esercizio (`profilo.carichi`) è la fonte dei moduli; il test si rifà solo se mancano carichi o sono più vecchi di 6 settimane.
- **Ricalcolo del massimale** (`ricalcolo.ts`): se alzi il peso su un fondamentale e completi le ripetizioni, l'app stima il nuovo massimale (Brzycki + RIR dal tocco "Facile/Giusto/Al limite") e aggiorna le sedute future se supera il vigente del 2,5 %. "Facile" sull'ultima serie di Target e complementari propone +1 passo di carico alla seduta dopo.
- **Energia** (`energia.ts`, Impostazioni → Energia): BMR Mifflin, tre stime del fabbisogno (formula × attività, regola del libro kg × 32–34, misurato), calorie per obiettivo (deficit 500/350 o da kg da perdere, tetto 1 % del peso a settimana, mai sotto il BMR), macro per kg. Non è un contacalorie.
- **Coach** (`coach.ts`, `regole_coach.ts` con fonte metodo/libro/evidenza/ipotesi): consigli in Home su peso (medie settimanali), circonferenze, trend dei carichi; le regole `ipotesi` sono disattivabili.
- Il ciclo di sedute è indipendente dalla settimana di calendario: la progressione segue il numero di seduta.

## Pubblicazione

Push su `main` → GitHub Action `deploy.yml` costruisce e pubblica su GitHub Pages: **https://francescoopto.github.io/FrappaulaFit/** (Pages impostato su "GitHub Actions").

Installazione sul telefono: Android Chrome → menu → "Installa app"; iPhone Safari → Condividi → "Aggiungi alla schermata Home".

## Sincronizzazione (facoltativa)

1. Crea un progetto gratuito su supabase.com, esegui `supabase/schema.sql` nell'editor SQL.
2. In Authentication → Providers lascia Email; in Authentication → Settings puoi disattivare la conferma email per semplificare.
3. Nell'app: Impostazioni → Sincronizzazione → inserisci URL e chiave anon del progetto, poi crea un account per persona.
4. Per evitare la pausa dei progetti gratuiti inattivi, il workflow `keepalive.yml` interroga il database ogni 5 giorni: aggiungi i segreti `SUPABASE_URL` e `SUPABASE_ANON_KEY` nel repository.

## Stato delle verifiche

- [Certo] Motore: 114 test automatici passano, inclusi i casi di SPEC §6.4, le tabelle §7 e le stime di TEST_INIZIO_BLOCCO §2.1.
- [Certo] Flusso completo verificato in browser (Chromium): setup → settimana di test (stima e serie unica) → seduta → serie con timer e autocorrezione → completamento → storico → persistenza dopo ricarica.
- [Non verificato] Timer con suono/vibrazione e notifiche su telefono reale (Android Chrome, iPhone PWA): da provare sui dispositivi.
- [Non verificato] Sincronizzazione Supabase su un progetto reale.
- [Provvisorio] Profilo "Donna – focus glutei": in attesa dei libri su glutei e allenamento femminile.
- L'**obiettivo** (massa / mantenimento / definizione) è una scelta dell'utente salvata nel profilo: non cambia il programma (SPEC §15).
