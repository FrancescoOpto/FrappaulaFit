# FRAPPAULA FIT - MEMORIA GENERALE (indice + regole metodologiche) - aggiornato 28/10/2026 mattina
Progetto: PWA di bodybuilding personale (Francesco + moglie), ispirata a V Athlete (no copia di grafica/video/testi), 3 giorni/sett., ~60'/seduta.
NON iniziare codice finche' l'utente non conferma di aver finito il materiale. L'utente vuole che io decida da "personal trainer" (non fare domande sulle scelte tecniche): decisioni motivate da libri + dati.

## MAPPA FILE (cartella notes/)
- cap1_a, cap1_b, cap2 ... cap6, cap7_a, cap7_b, cap8_9, cap10: note per capitolo del libro Project Bodybuilding (completo, 341-377 inclusi; 328 bianca)
- ebook1_a/b, ebook2_a/b, ebook3: note ebook V Athlete
- struttura_programma_vathlete.md: decodifica Blocco 1 (giorni A-D, fasi 1-3, scarico) + chiarimenti test
- appunti_keep_utente.md: note Keep dell'utente + test reali Blocco 2 + riconciliazione con i video
- decisioni_app.md, app_ux_vathlete.md: decisioni e UX
- Design (artifact privato): 2VvUBzC8CkMRrZPJHAPZ1J (canvas.json + 6 schermate .dc.html); TestRM.dc.html ha la scritta "≈85% del massimale" da correggere (scala 9->7->5->3RM).

## STRUTTURA PROGRAMMA (app di riferimento, Blocco 1) [Certo salvo indicato]
- Anno > Blocco > Fasi: Test (4 sedute A-D) | Fase 1 (20 workout) | Fase 2 (20) | Scarico (4) | Fase 3 (20) = 68 sedute (~17 sett. a 4/sett.). Poi NUOVA settimana test prima del Blocco 2.
- Giorni ciclici A/B/C/D: A Petto/Spalle/Bicipiti/Addome; B Gambe-glutei/Schiena/Tricipiti; C Spalle/Petto/Bicipiti/Addome; D Schiena/Gambe-glutei/Tricipiti.
- Seduta tipo 3+2+2+1: 3 esercizi gruppo principale (il 1o e' il "fondamentale" a RM), 2 gruppo secondario, 2 muscoli piccoli, 1 addome; bicipiti+tricipiti = 7 serie totali; i marcati "Target" progrediscono, gli altri restano fissi.
- TEST (chiarito dall'utente): tutti i carichi (fondamentali, Target, complementari) sono inseriti da lui in test; stessi esercizi delle fasi; nelle fasi avanzate 1-2 esercizi possono cambiare senza ritest (si riusa il peso dell'esercizio simile).
- Carico 1o Target (fondamentale) = 1RM x (37-n)/36 (Brzycki), arrotondato 0,5 kg: Fase 1 sett.1-3 9RM (78%), sett.4-5 e tutta Fase 2 7RM (83%), Fase 3 sett.1-4 5RM (89%), sett.5 3RM (94%); Scarico 11RM (72%) o 13RM (67%). Fondamentale "leggero" (panca giorno C, squat giorno D) = 2 gradini sotto: 11->9->7RM. Altri Target e complementari: carico FISSO tutto il blocco (dal test), cambia solo il volume.
- Ritmo settimanale per fase (5 sett.): sett.1=sett.2; sett.3 1o gradino; sett.4 2o gradino; sett.5 ripetizione/picco.
- Tabelle serie x rip comuni (Fase 3, sett.1->5): 1o Target 3x5,3x5,4x5,4x5,4x3; 2o Target 3x7,4x7,3x8,4x8,3x6; 3o Target 3x8,4x8,4x8,3x9,3x10. Fase 1: 1o Target 4x5 (+1 rip sett.3, poi +carico sett.4); 2o Target +1 serie sett.3; 3o Target +1 serie sett.4. Fase 2: carichi fermi, 3x6 -> 4x6 (sett.3) -> 3x7 (sett.5); +1 rip ai complementari; stripping -30% sull'ultima serie dell'ultimo esercizio di ogni gruppo [dalle note utente].
- Scarico: -carico solo sul 1o Target; altri Target stesso carico ma 2-3 serie; complementari 2 serie, rip piu' alte.
- Cambio varianti in Fase 2/3 (croci vs aperture, curl seduto, curl 60 vs 45...) senza cambiare la logica.
- Dubbio aperto: 4x5@5RM / 4x3@3RM in Fase 3 non e' sostenibile al 100% con recuperi normali (Brzycki): servono back-off o correzione automatica carico.

## DECISIONI METODOLOGICHE FRAPPAULA FIT (mie, da personal trainer)
1. [CORRETTO 28/10 dai video dei test] TEST FONDAMENTALI = STIMA INDIRETTA: l'utente inserisce reps qualsiasi + carico, l'app calcola Brzycki 1RM = carico*36/(37-reps), arrotondato 0,5 kg (verificato: 4x80->87,5; 5x40->45; 5x50->56,5; 5x80->90); salva '1@kg'; pulsanti 'Salva e completa'/'Non mi torna, ricalcola'. Il 3RM resta il consiglio (ebook: stima affidabile a 3-5 rip), non un obbligo. Vecchia idea 3RM fisso = caso particolare (36/34). Dettagli: specs/TEST_INIZIO_BLOCCO.md. Motivi originali del 3RM: Motivi: libro (APREE.3, cap.10: "carico max su 3 rip / 0,944"), pratica dell'utente (panca 3 rip con 97,5 kg), meno rischio e meno variabilita' di un 1RM vero. Se non testabile: stima da 6-8RM (Brzycki, avviso sopra 10 rip) o APREE nelle prime sedute.
2. TEST TARGET E COMPLEMENTARI = serie unica a 10, 12 o 14RM (reps fisse decise dall'app, l'utente inserisce solo il carico; 14RM per alzate busto inclinato, crunch, curl seduto, French corda): carico con cui si fanno 10 rip (multiarticolari, lat machine, french, rematori) o 12 rip (macchine, isolamento, unilaterali, cavi) o 14 (isolamento piccoli muscoli/addome) a cedimento tecnico (RIR 0-1). Regola [Certo, verificata sui 4 video]: rip di test = rip di lavoro della Fase 1 + 2 (3x8 -> 10; 3x10 -> 12; 3x12 -> 14). Test all'inizio di OGNI blocco (1,2,3) su fondamentali + Target + complementari. Il carico testato viene usato cosi' com'e' per tutto il blocco: parte con RIR ~2 (come il kick-off del libro) e il margine si consuma con il volume (3x8 -> 4x9), che e' la progressione dell'app di riferimento. Non 6RM/8RM: con carichi da 6-8RM le 3x8 non si completano; oltre 12 rip e' inaffidabile.
3. Test con 1-2 alternative equivalenti per esercizio (classi di sostituzione); esercizio nuovo = riuso del carico del simile, correggibile in seduta (regola RIR: troppo facile >3 RIR sale, impossibile scende).
4. 3 sedute/sett.: il libro stesso consiglia 3 sedute il primo anno (Adaptation fullbody A/B/C; Strength e Grow 2+1: A, B + C fullbody senza gambe). Mappa da fare: ~51 sedute (3 test + 45 + 3 scarico) in ~17 sett.
5. Rientro dopo stop (libro): 1 sett. normale; 2 sett. ripeti ultima settimana; 3 sett. prima sett. kick-off + ultima; >3 sett. kick-off completo.
6. Scarico: strategia 1 (riposo totale) o riduzione serie/sedute (libro cap.10).
7. Cardio opzionale: RPE 11-13, max 3 sedute 30'-30'-45'. Donna: nessun programma specifico del ciclo nel libro -> suggerimenti ciclo solo opzionali e a basso peso; profilo moglie = stesse regole, focus glutei (hip thrust fondamentale), deficit piu' lievi (taglio 350 vs 500 kcal; pre-forza 100-150 vs 200-300).
8. [CORRETTO 28/10] Fondamentali permanenti: panca piana, squat, stacco da terra; hip thrust (lei). Military NON fondamentale: l'esercizio guida di ogni gruppo ruota per blocco (spalle: B1 military, B2 spinte in alto manubri seduto), e' un Target con carico fisso (10RM); ebook B2: military/rematore/trazioni sono fondamentali opzionali sostituibili. Dorso nessun fondamentale. Niente video: icona + link YouTube. Timer recupero con suono/vibrazione/notifica (iPhone: PWA su Home).
9. Tecnologia: PWA GitHub Pages + DB gratuito (Supabase/Firebase) con 2 login, offline, export backup.

## DATI REALI UTENTE (Blocco 2): panca 3 rip x 97,5 kg (1RM ~103); manubri panca 45 10x28; chest press 12x20/braccio; croci bassi 12x20/braccio; lat triangolo 10x70; rematore singolo 12x32; french bil sagomato 10x20; corda basso 12x25; vertical traction 10x30+30.

## DA FARE / MANCANTE
- Test 1-4 del Blocco 2 analizzati (28/10): tabella reale in specs/TEST_INIZIO_BLOCCO.md (34 esercizi, 3 con stima: panca, squat, stacco; military = Target 10RM, guida spalle nel Blocco 1; nel Blocco 2 la guida e' spinte manubri seduto).
- Libro glutei + libro allenamento femminile (da ricevere); eventuali dettagli Blocco 2 oltre alle note Keep.
- (facoltativo) schermata di fine blocco / test A-D; l'utente ha chiarito la logica a parole.
- Poi: struttura 3 giorni 60', libreria esercizi + classi, schermata Settings, correzione mockup TestRM, repo GitHub + PWA.
