# Prompt per Claude Code — Aggiornamento v2 (pianificatore, energia, interfaccia, restyle)

Leggi `SPEC_PIANIFICATORE.md` **versione 2** (sostituisce la v1 che hai già implementato in `d5983c2`). Parti da **§0b** (elenco delle modifiche) e applicale come differenza: **non riscrivere** il codice esistente.

Prima di iniziare **riassumi il piano in 10 righe** e segnala i conflitti col codice. Poi, in quest'ordine, **con un commit per ogni punto**:
1. **Motore e test:** nuovo modello TDEE con passi e allenamenti (§3.1); Preservazione senza "serie −1", con sequenza cicli rivista e scala per tempo (§4.3, §4.4, §4.7); test dei fondamentali con ripetizioni di riserva (§7.4). Aggiorna (non cancellare) i test che codificavano le regole sostituite.
2. **Interfaccia (funzioni):** contatore "completate/totali" senza 77/82/S; testate per modulo; anteprima di tutte le sedute future + modalità prova (§11b); scheda "Piano" per esercizio; campo RIR nel test; calcolatore TDEE con stepper dei passi da 1.000.
3. **Restyle grafico (§11c), ora da fare:** solo aspetto, nessuna modifica a logica o dati. Ordine: token e componenti → Percorso (con la griglia dei cicli) → Seduta → altre schermate → icone degli esercizi (`IconaEsercizio`, pittogrammi SVG nostri, nessuna immagine scaricata). Se una sagoma non è leggibile a 24 px, usa l'icona del gruppo muscolare e segnalamelo.

Verifica con test (§12) e con l'app aperta in un browser headless (anche a larghezza telefono, 390 px) prima di dichiarare finito. Riporta il totale di serie del Blocco 3 W1 prima e dopo la Preservazione e due screenshot (Percorso e Seduta).
