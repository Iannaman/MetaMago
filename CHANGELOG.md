# Changelog

## Office Edition 1.8.0 — Inspector Edition (candidato)
- Nuova vista di analisi in sola lettura, indipendente dall’editor; accessibile anche dall’originale aperto.
- Punteggio trasparente di completezza, cinque controlli a peso uguale, proprietà originali e stato MetaMago Mark.
- Privacy Inspector: indicatori di autori, proprietà personalizzate, commenti, revisioni Word, fogli nascosti, slide nascoste, note relatore, link esterni, oggetti incorporati e VBA.
- Controlli XML con limiti espliciti, esito parziale/non conclusivo e nessuna rimozione automatica; nessuna connessione agli URL rilevati.
- Interfaccia italiana/inglese, temi, scorciatoia Alt+Maiusc+7; test sintetici per i tre formati e conservazione del lavoro in corso. Motore di modifica e Desktop invariati, deploy manuale.

## Office Edition 1.7.0 — Experience Edition (candidato)
- Home per attività, navigazione laterale responsive, viste separate e mantenimento del lavoro in corso durante la navigazione.
- Apertura e drag-and-drop dalla Home; passaggio automatico alla modifica singola o batch.
- Guida interattiva ripetibile in tre passaggi, scorciatoie da tastiera e stato del documento nella navigazione.
- Tema chiaro/scuro/sistema per sessione senza nuove scritture nello storage; italiano e inglese.
- Studio UX e test automatici di navigazione, guida, temi e mantenimento delle modifiche. Motore Open XML e Desktop invariati; deploy manuale.

## Office Edition 1.6.1 — Quality Edition
- Interfaccia web unificata: rimosse le scelte di download HTML e attivazione cache; unico comando Installa applicazione con guida al menu del browser.
- Cache PWA tecnica automatica limitata alle risorse pubbliche; finestra standalone; nessuna persistenza dei nominativi online.
- Pages pubblica solo pagina, licenza, manifest, service worker e icone. Il file HTML generato resta nel repository per sviluppo e collaudo. Desktop invariato.

## Office Edition 1.6.0 — Quality Edition (candidato)
- Corrette collisioni tra la funzione di traduzione e variabili locali nell'ispezione XML e nella tabella delle proprietà.
- Validazione preventiva della directory ZIP, nomi duplicati, percorsi, header e intervalli; esclusione ZIP64/multidisco; decompressione a dimensione controllata e CRC delle parti lette.
- Validazione delle relazioni e tipi di contenuto del documento e delle proprietà, confronto più efficiente dei nomi delle parti.
- Chiusura esplicita documento, blocco cambio lingua durante elaborazione, annullamento cooperativo batch senza download, reset selezione batch non valida.
- Etichette accessibili e layout su schermi piccoli, rispetto esplicito di hidden.
- Test aggiuntivi di sicurezza e regressione; esiti per suite e diagnostica degli errori. Desktop invariato, deploy manuale. Restano necessari Office 365/Edge aziendale e benchmark.

## Office Edition 1.5.0 — Global Edition (candidato)
- Interfaccia italiana/inglese, selezione dalla lingua del browser e cambio manuale con conferma; date e messaggi localizzati, CSV con intestazioni inglesi e italiane.
- PWA facoltativa: manifest, icone 192/512, service worker con cache statica limitata al sito; possibilità di riaprire l'app offline dopo preparazione riuscita. Nessuna cache di documenti o rubriche.
- Focus visibile, link salta al contenuto, rispetto del movimento ridotto, controlli più facilmente selezionabili; rendering differito delle righe batch fuori schermo.
- Corretto il selettore dei test della rubrica dopo l'aggiunta del pannello gruppi nella v1.4.0.
- Test lingua inglese e cache PWA; distribuzione Pages manuale. Desktop invariato.

## Office Edition 1.4.0 — Team Edition (candidato)
- Gruppi di autori indipendenti dai profili, creazione/modifica/eliminazione, aggiunta o sostituzione autori nel singolo documento.
- Import CSV UTF-8 con intestazione Nominativo oppure Nome/Cognome, separatore virgola o punto e virgola, modello scaricabile e conferma.
- Gruppi inclusi nella rubrica JSON, compatibilità con file precedenti e persistenza solo facoltativa offline.
- Batch misto Word/Excel/PowerPoint: massimo 20 file e 100 MiB complessivi, regole esplicite, anteprima per file, conferma e unico ZIP delle copie verificate.
- Esclusione di file non supportati/danneggiati/invariati, stato per file, nomi univoci, download ripetibile.
- Date, titoli, stato finale e proprietà non selezionate preservati; MetaMago Mark resta esplicito. Motore Open XML invariato.
- Test browser dedicati nella CI e nel deploy manuale Pages. Desktop invariato.

## Office Edition 1.3.0 — MetaMago Web
- Sorgenti modulari con versione centralizzata; build Node senza dipendenze, riproducibile e controllata in CI.
- HTML offline e pagina web identici, con riconoscimento del contesto di esecuzione e download della copia autonoma dal sito.
- Versione web senza persistenza dei nominativi nel browser; import/export JSON invariati. Nessun upload di documenti, analytics o richieste applicative di rete.
- CSP con hash SHA-256 dei due script incorporati, blocco delle connessioni e delle risorse esterne; policy no-referrer.
- Test browser aggiuntivi via HTTP sotto percorso /MetaMago/, controllo richieste, storage e download identico all'HTML offline.
- Workflow manuale GitHub Pages con test obbligatori, artifact selettivo (index, HTML offline, checksum e licenza), nessun deploy automatico a ogni push.
- Desktop invariato. Attivazione Pages e primo deploy richiesti; collaudo Edge/Office 365 ancora necessario.

## Office Edition 1.2.0 — MetaMago Mark
- Contrassegno applicativo facoltativo con tre proprietà personalizzate standard: Editor, Version, Edition; nessuna informazione personale o timestamp aggiunto.
- Azioni esplicite per mantenere, aggiungere/aggiornare o rimuovere il contrassegno, incluse nel confronto prima del salvataggio. Stato originale mantenuto di default.
- Rilevamento all'apertura, segnalazione dei conflitti, ispettore di sola lettura delle proprietà personalizzate.
- Verifica strutturale delle proprietà personalizzate non modificate e assegnazione dinamica dei PID per i nuovi campi.
- Test browser per assenza di tag di default, aggiunta, aggiornamento, rimozione, preservazione di proprietà estranee e conflitti.
- Desktop resta 1.0.0-beta; GitHub Pages non ancora attivato.

## Office Edition 1.1.0 — Simple Magic
- Modalità Semplice predefinita e Avanzata; indicatore del tipo di documento.
- Rubrica indipendente con ricerca, inserimento e rimozione contatti, cancellazione esplicita e importazione/export JSON validati; memoria facoltativa.
- Profili rapidi; ultimo autore selezionabile dagli autori; autocompletamento e conferma dei nomi digitati al salvataggio.
- Date nel confronto in formato italiano, scorciatoia per copiare la creazione e avviso su date incoerenti.
- Schermata di completamento con download ripetibile e apertura del documento successivo; avvisi solo per modifiche non salvate.
- Errore di apertura esplicito sul documento precedente rimasto attivo; ripristino campi e controlli nome copia.
- Test browser Chromium offline sui tre formati e sui principali flussi utente.
- Motore Open XML invariato. Desktop resta 1.0.0-beta. MetaMago Mark e GitHub Pages non ancora implementati.

## Non rilasciato — Office Edition 1.0 Beta e pulizia
- Aggiunta Office Edition: singolo HTML offline con JSZip incluso, autori, date, profili, rubrica importabile/esportabile, confronto e salvataggio su copia.
- Office Edition: stato finale reversibile, verifica delle parti non modificate e rifiuto dei file non supportati.
- Desktop: memorizzazione automatica rubrica disattivata, conferma ripristino, dialogo copia coerente con il rifiuto della sovrascrittura.
- Aggiunto test per la protezione delle copie esistenti; corretto il codice di uscita dell'avviatore dei test.
- Ripuliti metadati delle fixture DOCX e PPTX, rimosso asset PNG inutilizzato e documentazione di pubblicazione automatica.
- Build locale/CI per entrambe le edizioni; nessuna pubblicazione automatica.
- Collaudo Office 365 e Edge aziendale ancora necessario.

## 1.0.0-beta
- Primo pacchetto Desktop candidato: nome MetaMago, logo, icona e link GitHub.
- Editor Word, Excel e PowerPoint, rubrica, protezioni reversibili e backup.
- Test Windows, documentazione e packaging.
