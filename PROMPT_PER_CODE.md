# Prompt da incollare in Claude Code (aggiornamento del 28/10/2026)

Leggi CLAUDE.md, SPEC.md, TEST_INIZIO_BLOCCO.md e docs/note_elaborate/BLOCCO2_programma.md (nuovo). Poi:

1. Se c'è già codice nel progetto: confrontalo con le novità del 28/10 e aggiornalo. Se non c'è, parti dal motore dei carichi.
2. Novità da applicare (dettagli nelle sezioni indicate):
   - Formula carichi RM con `fattore_lavoro` = 0,90 (SPEC §6.2; caso di verifica §6.4).
   - Progressioni serie×rip per slot, non per ruolo: tabelle R1, R2, R3, R3b, R3c, AB (BLOCCO2_programma.md §A2). Mettile in un file di dati (`data/`), non nel codice.
   - Nessun ruolo L nel Blocco 2 a 4 giorni (BLOCCO2_programma.md §A1).
   - Persistenza dei carichi: il kg modificato dall'utente resta salvato per le sedute successive; il massimale resta in memoria per il blocco ed è modificabile (SPEC §9.2b).
   - Test a inizio blocco: stima Brzycki per i fondamentali, serie unica 10/12/14RM per gli altri (TEST_INIZIO_BLOCCO.md).
   - Motore coach (SPEC §14) e pianificatore a obiettivo (SPEC §15): per ora solo la struttura dati, non l'interfaccia.
3. Scrivi test automatici con i casi di SPEC §6.4 e con le tabelle di BLOCCO2_programma.md (panca, squat, stacco: stima 87,5 / 56,5 / 90).
4. Prima di scrivere codice, riassumi in 10 righe il piano e segnala dubbi o contraddizioni tra i file. Non inventare dove la specifica dice "da definire".
