# Prompt per Claude Code — Pianificatore a obiettivo ed energia

Leggi, in quest'ordine: `CLAUDE.md`, `SPEC.md`, **`SPEC_PIANIFICATORE.md`** (nuova: estende SPEC §3/§14 e sostituisce §15), `docs/note_elaborate/BLOCCO3_programma.md`.

Aggiungi tu a `CLAUDE.md` la riga d'ordine di lettura per `SPEC_PIANIFICATORE.md` (non l'ho toccato per non sovrascrivere le tue modifiche).

## Obiettivo
All'avvio (o reset dati, o "Cambia obiettivo") l'app chiede **obiettivo** (massa / mantenimento / dimagrimento) e **durata**, poi **stato energetico**; costruisce un piano a tappe senza rifare i test. Il dimagrimento usa il modulo **Preservazione**, ricavato per trasformazione dai dati del Blocco 3 (nessuna tabella nuova). Calcolatore TDEE/calorie/macro opzionale (formule del libro). Ciclo di sedute indipendente dalla settimana di calendario.

## Regole di lavoro
- **Non riscrivere il codice esistente**: estendi `Obiettivo`, `pianificatore.ts`, `regole_coach.ts`, `correnti.ts`, `Setup.tsx`. I test esistenti devono restare verdi.
- Prima di iniziare: **riassumi il piano in 10 righe** e segnala conflitti con il codice (es. `fonte` in `RegolaCoach` va estesa a `'metodo' | 'libro' | 'evidenza' | 'ipotesi'`).
- Ordine: (1) motore puro + test (`energia.ts`, `preservazione.ts`, `ricalcolo.ts`, tappe nel pianificatore); (2) dati e UI; (3) regole coach; (4) tipo di serie `back_off` solo come dato (non inserirlo nei Blocchi 1–3).
- I test di accettazione sono in `SPEC_PIANIFICATORE.md` §12 (valori numerici già verificati): implementali tutti.
- Non inventare dove la spec dice "non implementare" o "da definire" (aumenti forzati Fase 3, Anno 2–3, profilo moglie).
- Verifica con test e con l'app aperta in un browser headless prima di dichiarare finito.
