# Prompt per Code — Blocco 3 (28/10/2026)
Leggi `docs/note_elaborate/BLOCCO3_programma.md` (nuovo) e `docs/note_elaborate/decisioni_app.md` (sezione "Blocco 3 completo"). Poi confronta con il codice esistente e **integra, senza riscrivere**:
1. **Carichi dei fondamentali per blocco:** il fattore 0,9×(37−n)/36 vale per il Blocco 2; nel Blocco 3 il carico è `round_0.5(1RM × pct)` con pct per fase 77/82/87 % (Scarico 77 %). Rendi le % **dati per blocco** (`data/`), non una formula fissa.
2. **Tabelle Blocco 3** per slot e per settimana (BLOCCO3_programma.md §B): includi la **seconda riga Target ×12** (1→2 serie dalla settimana 3) e le righe a serie singola.
3. **Tipo di serie `rest_pause`, due varianti:** `1×40` = 40 ripetizioni totali al carico del test (pause brevi); `1×10` = "10 + 3 volte max": 10 rip, pausa 30", max rip, pausa 40", max rip, pausa 50", max rip (testo dell'app). Un solo campo kg per riga, registra le rip di ogni mini-serie, timer con le pause indicate.
4. **Flag `esclude_bilanciere`** per le versioni al multipower (test: serie unica, il carico inserito esclude il bilanciere). La stima del massimale (Brzycki) solo per squat, panca, stacco **liberi**.
5. **Gruppi per giorno variabili per blocco** (Blocco 2: A petto/schiena/tricipiti; Blocco 3: A spalle/schiena/tricipiti), nessun ruolo L.
6. Il Blocco 3 **non è una "definizione"**: l'obiettivo (massa/mantenimento/definizione) è una scelta dell'utente (SPEC §15).
7. Test automatici: squat 1RM 90 → Fase1/2/3 = 69,5/74/78,5; panca e stacco 1RM 101,5 → 78/83/88,5; scarico 3×4@77%.
Riassumi il piano in 10 righe prima di scrivere codice.
