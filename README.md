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
| `src/data/` | **Il programma come dati**: libreria esercizi (`esercizi.ts`), contenitori per N sedute (`contenitori.ts`), tabelle serie×rip, scale RM, recuperi, volumi (`tabelle.ts`). Si modificano senza toccare la logica. |
| `src/motore/` | Logica pura e testata: formula dei carichi (`carichi.ts`), prescrizione serie×rip@kg per seduta (`prescrizione.ts`), generatore delle sedute e rigenerazione al confine di ciclo (`generatore.ts`). |
| `src/store/` | Stato con signals, persistenza IndexedDB (`db.ts`), sincronizzazione Supabase via REST (`sync.ts`). |
| `src/ui/` | Schermate Preact: Setup, Home, Seduta (anche in modalità test), Esercizio con timer, Progressi, Check-in, Impostazioni. Router a hash. |
| `supabase/schema.sql` | Tabella `kv` con RLS per la sincronizzazione (facoltativa). |
| `docs/` | Materiale di studio e note metodologiche (vedi `docs/INDICE_MATERIALE.md`). |

## Come funziona il programma

- **Blocco** = Test (1 ciclo) → Fase 1 (5) → Fase 2 (5) → Scarico (1) → Fase 3 (5). Un ciclo = un giro del contenitore (N sedute). N=3 → 51 sedute; N=4 → 68. Blocco breve: 12 cicli.
- **Test**: fondamentali a 3RM (`1RM = kg × 36 / 34`); Target e complementari con il carico di 10 o 12 ripetizioni a cedimento. Il carico dei Target resta fisso per tutto il blocco, cambia il volume.
- **Carico fondamentali**: `1RM × (37 − n) / 36` con la scala 9RM → 7RM → 5RM → 3RM (Fase 1 → Fase 3), 11RM in scarico. Il fondamentale "leggero" (seconda esposizione) sta due gradini sotto.
- **Ruoli**: R1 fondamentale, R2/R3 Target, L fondamentale leggero, C complementare, AB addome. Le tabelle serie×rip valgono per ruolo, qualunque sia il contenitore.
- **Autocorrezione**: ripetizioni mancate → serie successiva a −5 %; due sedute di fila → −2,5 % sul ciclo dopo (modificabile in Impostazioni → Test).
- **Modifiche in corso d'opera**: cambiare N, T, priorità o esclusioni rigenera solo le sedute future dal prossimo confine di ciclo; test, carichi e storico restano.

## Pubblicazione

Push su `main` → GitHub Action `deploy.yml` costruisce e pubblica su GitHub Pages (`https://francescoopto.github.io/FrappaulaFit/`). Nelle impostazioni del repository, Pages deve essere impostato su "GitHub Actions".

Installazione sul telefono: Android Chrome → menu → "Installa app"; iPhone Safari → Condividi → "Aggiungi alla schermata Home".

## Sincronizzazione (facoltativa)

1. Crea un progetto gratuito su supabase.com, esegui `supabase/schema.sql` nell'editor SQL.
2. In Authentication → Providers lascia Email; in Authentication → Settings puoi disattivare la conferma email per semplificare.
3. Nell'app: Impostazioni → Sincronizzazione → inserisci URL e chiave anon del progetto, poi crea un account per persona.
4. Per evitare la pausa dei progetti gratuiti inattivi, il workflow `keepalive.yml` interroga il database ogni 5 giorni: aggiungi i segreti `SUPABASE_URL` e `SUPABASE_ANON_KEY` nel repository.

## Stato delle verifiche

- [Certo] Motore: 41 test automatici passano, inclusi tutti i casi di SPEC §6.4 e le tabelle §7 dell'app di riferimento.
- [Certo] Flusso completo verificato in browser (Chromium): setup → test → seduta → serie con timer e autocorrezione → completamento → storico → persistenza dopo ricarica.
- [Non verificato] Timer con suono/vibrazione e notifiche su telefono reale (Android Chrome, iPhone PWA): da provare sui dispositivi.
- [Non verificato] Sincronizzazione Supabase su un progetto reale.
- [Provvisorio] Profilo "Donna – focus glutei": in attesa dei libri su glutei e allenamento femminile.
