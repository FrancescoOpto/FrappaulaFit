# Correzione Blocco 1 — fattore 0,9 e tabella L (per Code)

Leggi prima `SPEC.md` §6.2–§7, `SPEC_PIANIFICATORE.md` §4.2 e `docs/note_elaborate/BLOCCO1_verifica.md` (aggiornati il 29/10). Con i massimali reali dell'utente (panca 84,5, squat 62, stacco 87,5) il Blocco 1 usa **lo stesso fattore 0,9 del Blocco 2**: la deduzione "Blocco 1 senza 0,9" era sbagliata (derivava da massimali inventati). Non toccare Blocco 2 e Blocco 3.

## Cosa cambiare
1. `src/data/blocco1.ts`: elimina `fattore_lavoro: 1` (e il commento) dal contenitore: il Blocco 1 deve usare `impostazioni.fattore_lavoro` (default 0,9). Cerca con grep ogni altro uso o commento "senza 0,9" / `fattore_lavoro: 1` in `src/` (moduli.ts, composizione.ts, pianificatore.ts, preservazione.ts, UI, etichette, consigli) e allinea: il Mantenimento (Blocchi 1–2) usa 0,9 in entrambi i blocchi. Aggiorna anche i testi dell'interfaccia che citano il Blocco 1 senza 0,9.
2. `src/data/tabelle.ts`, tabella `L`, `fase1`: da `[[3,9],[3,9],[3,9],[3,10],[3,10]]` a `[[3,8],[3,8],[3,9],[3,9],[3,10]]` (letto nei video: panca giorno C e squat giorno D; il ciclo 2 è presunto = ciclo 1). Aggiorna il commento sul fattore: verificato anche nel Blocco 1. Le altre tabelle (R1, R2, R3, R3d, AB, L fase2/fase3/scarico) e le scale RM sono già corrette: non toccarle.
3. `src/motore/blocco1.test.ts`: i test attuali usano `rm1: 81` e `78.75`; con il 0,9 servono i massimali 90 e 87,5 (carichi attesi identici: 63 → 67,5 → 72 → 76,5, scarico 58,5). Sistema i commenti. Poi **aggiungi un blocco di test con i massimali reali**, `fattore_lavoro` 0,9, passo 0,5:
   - Test: panca 5×75, squat 5×55, stacco 4×80 → stime Brzycki 84,5 / 62 / 87,5 (usa la funzione di stima, non valori scritti a mano).
   - Panca giorno A (R1): F1 c1–3 59, c4–5 63,5 · F2 63,5 · Scarico 55 · F3 c1–4 67,5, c5 72 (serie×rip: 4×5,4×5,4×6,4×5,4×5 / 3×6,3×6,4×6,4×6,3×7 / 3×7 / 3×5,3×5,4×5,4×5,4×3).
   - Squat giorno B (R1): 43,5 / 46,5 · F2 46,5 · S 40,5 · F3 49,5 / 52,5.
   - Stacco giorno D (R1): 61,5 / 65,5 · F2 65,5 · S 57 · F3 70 / 74,5.
   - Panca giorno C (L): F1 55 (3×8,3×8,3×9,3×9,3×10) · F2 59 (3×8,3×8,3×8,3×9,3×10) · S 50,5 (3×10) · F3 59 c1–2 (3×10), 63,5 c3–5 (3×8).
   - Squat giorno D (L): F1 40,5 · F2 43,5 · S 37 · F3 43,5 c1–2, 46,5 c3–5 (stesse serie×rip).
   - Target con carico del test, invariato in tutte le fasi: spinte manubri piana 24 (10RM → F1 3×8), spinte in alto 18, military 30, alzate laterali C 10 (12RM → 3×10), stacco rumeno 20 (10RM), lat machine 60, T-bar 40, curl EZ 20 (12RM → 4×10), crunch 45/40 (14RM → 3×12).
4. Se `prescrizione.test.ts`, `composto.test.ts`, `preservazione.test.ts` o altri dipendono dal vecchio Blocco 1 senza 0,9, aggiornali con i valori nuovi e dimmi quali sono cambiati e perché. Non cambiare i risultati dei test del Blocco 2 e 3.

## Controlli e consegna
- Esegui tutti i test (`npm test`) e il build; riporta il numero di test e l'elenco di quelli modificati.
- Mostra il diff dei file toccati. Non fare altre modifiche (UI, pianificatore, libreria).
- Nota per il report: il ciclo 2 di Fase 1 della panca C, il ciclo 3 di Fase 2 dello squat B e alcune celle del crunch di Fase 2 (giorno C) non sono stati letti dai video: sono presunti dal pattern. Non presentarli come verificati.
