# Changelog

## Office Edition 3.4.0 — Unified Workspace Edition (candidato)
- Gestore condiviso delle sessioni Office e PDF, selezione del documento attivo e bozze indipendenti.
- Motore combinato Office: metadati, pulizia selettiva, stato finale e Mark in una riscrittura verificata.
- Motore PDF: metadati standard, pulizia, filigrana, appiattimento compatibile e cifratura AES-256 R6 per ultima, con verifica delle operazioni.
- Piano guidato con import delle modifiche non salvate supportate, riepilogo, conferma esplicita, un solo download e invalidazione al cambio di configurazione.
- Credenziali separate, azzeramento del piano al cambio di documento o schermata, originale e bozza preservati. Percorsi specialistici mantenuti.
- Test motori e interfaccia end-to-end; verifica della candidata sul commit versionato e collaudo manuale ancora necessari.

## Office Edition 3.3.2 — PWA Validation Update (candidato)
- Rafforzato il gate di migrazione PWA: handshake del worker attivo, verifica della shell, controllo della prima navigazione e del controller.
- Tre esecuzioni indipendenti obbligatorie senza retry che nascondano un errore, sia in CI sia nel deploy.
- Diagnostica aggiuntiva e polling esplicito dei risultati booleani asincroni: il test non apre una nuova finestra prima dell’effettiva attivazione. Test di regressione sul polling stesso. Nessuna modifica al motore PWA; conferma in CI necessaria.

## Office Edition 3.3.1 — Stability & Quality Edition (candidato)
- Salvataggio e ripristino del controllo privacy preliminare nei workflow e nei backup; nessuna password inclusa.
- Compatibilità con workflow precedenti privi del campo: controllo disattivato; valori non booleani rifiutati.
- Test di regressione per ripristino, roundtrip configurazione e ricette legacy.
- Test end-to-end allineati dinamicamente a Office/VERSION, senza versioni hardcoded.
- Checklist di rilascio allineata alla versione corrente e collaudo manuale esplicitamente ancora necessario.

## Office Edition 3.3.0 — Visual Experience Edition (candidato)
- Consolidamento di UX Cleanup, Visual Identity, Document Workspace, Visual Comparison, Visual Storytelling, Visual PDF Preview e Usability Optimization.
- Illustrazioni contestuali anche nella scheda documento e accesso diretto all’anteprima del PDF originale.
- Messaggi di annullamento e errore coerenti con il formato di download; ripristino dell’etichetta dopo invalidazione.
- Rendering reale con controllo pixel su tre motori browser e test end-to-end Word con download diretto e originali invariati.
- Checklist di accettazione, misure UX e collaudo manuale da completare.

## Office Edition 3.2.7 — Usability Optimization (candidato)
- Download diretto opzionale per una sola selezione; ZIP per più file e modalità professionale predefinita.
- Preset pubblicazione esterna con controlli privacy preliminari, distinti dalla sola rimozione identificativi e inclusi nei report.
- Conferma solo in presenza di selezioni o impostazioni da sostituire; indicazione della pagina effettivamente renderizzata.
- Test reali per singolo PDF, ripetizione del download, anteprima e annullamento.

## Office Edition 3.2.6 — Visual PDF Preview (candidato)
- Rendering locale pagina singola e confronto della pagina con una copia temporanea per pubblicazione.
- PDF.js 6.5.438 incorporato con integrità SHA-512 verificata, worker locale, CSP invariata, nessun link o modulo interattivo.
- Limiti di dimensioni, timeout, invalidazione dell’anteprima e nessun download automatico.
- Collaudo con PDF sintetico e confronto pixel; validazione completa ancora necessaria.

## Office Edition 3.2.5 — Visual Storytelling (candidato)
- Guida illustrata in quattro passaggi con esempio sintetico di metadati, scansione, rimozione e copia separata.
- Animazioni a durata limitata, controlli manuali e rispetto di prefers-reduced-motion.
- Nessuna elaborazione reale nella dimostrazione; test di navigazione, isolamento della sessione e accessibilità.

## Office Edition 3.2.4 — Visual Comparison (candidato)
- Confronto grafico originale/copia basato sulle effettive modifiche Office, PDF e batch.
- Distinzione esplicita tra modifiche previste e copia verificata, rimozioni e Info/XMP discordanti.
- Test di modifica, reset, salvataggio, confronto batch e visualizzazione mobile.

## Office Edition 3.2.3 — Document Workspace (candidato)
- Apertura singolo file dalla home verso scheda unificata con illustrazione, nome, proprietà originali e azioni compatibili.
- Navigazione contestuale verso i motori di modifica, ispezione, pulizia e protezione senza riselezionare il file.
- Bozze conservate; limiti dei parser e controlli di sicurezza invariati.

## Office Edition 3.2.2 — Visual Identity (candidato)
- Illustrazione di apertura con Word, Excel, PowerPoint e PDF; quattro metafore visive per le azioni rapide.
- Rappresentazione schematica del formato nei riepiloghi documento; nessuna anteprima di pagina simulata.
- SVG nativi, nessuna dipendenza o richiesta di rete, tema chiaro/scuro e test dedicati.

## Office Edition 3.2.1 — UX Cleanup (candidato)
- Home centrata su apertura documenti e quattro azioni, rimozione duplicazione percorso guidato e schede professionali.
- Preset espandibili, sessione visibile con documenti aperti, navigazione mobile a scorrimento orizzontale.
- Migrazione dei test di navigazione verso il percorso unificato dei preset.

## Office Edition 3.2.0 — Experience Edition (candidato)
- Annullamento ZIP senza eccezioni nel callback di avanzamento; test di cancellazione durante l’archiviazione.
- Consolidamento di Smart Interface, Motion, Smart Detection, Quick Actions, Guided Experience e Design System.
- Riepiloghi più conservativi per campi non interpretabili e regioni accessibili ripulite correttamente.
- Collaudo end-to-end del preset privacy su batch misto Office/PDF, annullamento, anteprima, ZIP e verifica degli originali.
- Checklist di accettazione automatica e manuale; nessuna dichiarazione di stabilità prima della validazione.

## Office Edition 3.1.5 — Design System (candidato)
- Token grafici condivisi, icone SVG delle azioni rapide, target touch da almeno 44 px.
- Regioni con nome accessibile, focus visibile e supporto colori forzati.
- Test accessibilità di base, tastiera, tema scuro e layout responsive.

## Office Edition 3.1.4 — Guided Experience (candidato)
- Indicatore contestuale batch in quattro passaggi, basato su file, anteprima e ZIP effettivi.
- Errori PDF-lib di parsing presentati con messaggio leggibile e dettagli tecnici espandibili.
- Test dedicati per transizioni, invalidazione dell’anteprima ed errori.

## Office Edition 3.1.3 — Quick Actions (candidato)
- Sei preset guidati dalla home: uso interno, pubblicazione esterna, riservato PDF, rimozione identificativi, standard aziendale e sola analisi.
- Sostituzione esplicita delle impostazioni batch, password azzerate, nessuna elaborazione o salvataggio automatico.
- Test di regressione dedicati.

## Office Edition 3.1.2 — Smart Detection (candidato)
- Riepilogo automatico Office/PDF e indicazioni contestuali sui metadati rilevati.
- Riepilogo Privacy Inspector con categorie presenti e non conclusive, avvisi per firme, restrizioni, cifratura e parser incompatibile.
- Nessuna modifica automatica; analisi completa accessibile dall’editor. Test di regressione dedicati.

## Office Edition 3.1.1 — Motion Update (candidato)
- Microinterazioni drag & drop, schede e navigazione, animazione breve delle viste.
- Indicatore scansione/attesa legato al reale stato busy, feedback per esiti ed errori.
- Rispetto di prefers-reduced-motion; nessuna dipendenza o modifica dei motori documentali.
- Test dedicati di stato, navigazione e movimento ridotto.

## Office Edition 3.1.0 — Smart Interface (candidato)
- Home orientata al documento e selezione multipla con instradamento automatico verso editor Office/PDF o batch.
- Quattro azioni rapide e strumenti professionali raggruppati; interfaccia responsive, tema scuro e traduzioni.
- Conservazione della navigazione, delle bozze e dei controlli di integrità; test di regressione dedicati.

## Office Edition 3.0.2 — PDF Compatibility (candidato)
- Analisi QPDF in sola lettura offerta dopo rifiuto del parser PDF-lib; nessuna modifica permissiva.
- Indicazione separata del fallimento del parser e del precedente documento ancora aperto.
- Test di regressione del percorso alternativo.

## Office Edition 3.0.1 — Stability Update (candidato)
- Impedisce la disattivazione implicita di Compliance quando un modello selezionato viene eliminato; riferimenti ai modelli predefiniti indipendenti dalla lingua.
- Nuovi test di compatibilità Chromium, Firefox, WebKit e blocco Compliance su copie reali.
- Conservazione della selezione Compliance nei workflow; rifiuto esplicito del caricamento se il modello manca.
- Svuotamento password alla nuova selezione; esiti batch coerenti in caso di annullamento o errore ZIP.
- Regole PDF non equivalenti trattate come non conclusive; riuso Blob nel download.
- Test di regressione aggiuntivi.

## Office Edition 3.0.0 — Unified Professional Edition (candidato)
- Percorso guidato per obiettivo e ripresa della sessione PDF.
- Backup configurazione v2 con workflow, compatibile con import v1; nessuna password.
- Verifica facoltativa delle copie batch prima della cifratura, esclusione se esito non superato.

## Office Edition 2.9.0 — Optimization Edition (candidato)
- ZIP batch in Blob con avanzamento e annullamento; limite aggregato copie 150 MiB.
- Cessione del controllo al browser tra documenti, miglioramenti CSS mobile e test dinamico versione.
- Nessuna modifica ai controlli di integrità.

## Office Edition 2.8.0 — Workflow Edition (candidato)
- Configurazioni batch riutilizzabili, import/export JSON senza credenziali.
- Pulizia identificativi Office/PDF integrata nella sequenza batch.
- Rifiuto delle operazioni incompatibili; verifica documentale separata.

## Office Edition 2.7.0 — Compliance Edition (candidato)
- Controllo massivo in sola lettura rispetto ai modelli, esiti per regola e documento, report CSV/HTML.
- Verifiche PDF limitate con risultati non conclusivi espliciti; nessuna certificazione legale.

## Office Edition 2.6.0 — Privacy Edition (candidato)
- Pulizia selettiva metadati Office con consenso, verifica della copia e analisi degli elementi residui.
- Test di conservazione delle parti di contenuto Word, Excel e PowerPoint.
- Nessuna rimozione automatica di commenti, revisioni o macro; nessuna certificazione di anonimizzazione.

## Office Edition 2.5.0 — PDF Batch Edition (candidato)
- Batch misto per autori, Mark e titolo PDF; verifica SHA-256 tra anteprima e salvataggio e controllo QPDF della copia.
- Esclusione esplicita di PDF incompatibili e proprietà solo Office; report e ZIP comuni.
- Filigrana e protezione AES-256 in batch; collaudo richiesto.

## Office Edition 2.4.0 — Publication Edition (candidato)
- Profili di pubblicazione e riepilogo con conferma, filigrana testuale su tutte le pagine con posizione/colore/opacità/dimensione, gestione rotazione e CropBox.
- Rimozione selettiva delle proprietà standard Info/XMP supportate, delle proprietà Info custom modificabili e del Mark riconosciuto.
- Appiattimento conservativo dei soli campi testuali AcroForm semplici con appearance esistente; rifiuto dei moduli incompatibili.
- Copia separata, verifica strutturale QPDF prima/dopo, controllo geometria e numero pagine; integrazione sorgente con Protection. Non è redazione sicura; niente rimozione di firme o protezioni.
- Test browser e verifiche indipendenti Poppler/QPDF; deploy manuale.

## Office Edition 2.3.0 — PDF Inspector Edition (candidato)
- Inspector unificato Office/PDF in sola lettura, accesso da editor PDF, SHA-256 dei byte originali, versione e numero di pagine, controllo strutturale QPDF, permessi di lettura.
- Rilevamento mirato di metadati, firme/campi firma, annotazioni e flag nascosti, allegati, JavaScript, azioni, riferimenti esterni, moduli, livelli, multimedia e restrizioni. PDF/A dichiarato (non validato) da XMP supportato.
- PDF cifrati: verifica password autorizzata, permessi, analisi strutturale; nessun file decrittato, XMP cifrato non letto. Stato non conclusivo se controllo incompleto. Nessuna esecuzione di azioni o estrazione allegati.
- Test browser con fixture sintetiche, cifrate, firme simulate, contenuto attivo non eseguito, SHA-256, limiti e regressioni Office. Desktop invariata, deploy manuale.

## Office Edition 2.2.0 — Protection Edition (candidato)
- Protezione PDF originale o copia metadati verificata, AES-256 R6, password proprietario obbligatoria e apertura facoltativa, stampa/modifica/copia configurabili.
- QPDF 12.2.0 WebAssembly in Worker temporaneo, risorse incorporate nell'HTML e nessuna richiesta di rete durante il trattamento; CSP autorizza solo compilazione WASM oltre agli script con hash.
- Verifica permessi, password, pagine e struttura prima del download, nessun fallback non cifrato. Password non memorizzate da MetaMago. Nessuna rimozione delle protezioni esistenti.
- Test browser e QPDF nativo indipendente, confronto rendering. Candidato, deploy manuale.

## Office Edition 2.1.0 — PDF Edition (candidato)
- Modulo PDF separato, riconoscimento da Home e apertura singola, proprietà Info e XMP a confronto, modifica selettiva dei campi standard e proprietà Info testuali, Mark PDF facoltativo.
- Rifiuto conservativo di cifratura, firme/campi firma, restrizioni rilevate, PDF/A dichiarato e XMP non supportato. Nessuna rimozione di protezioni.
- Verifica strutturale della copia e confronto renderizzato di fixture sintetiche nei test. PDF-lib 1.17.1 e dipendenze bloccate via npm lockfile e incorporate nell'HTML, non da CDN. HTML generato escluso dal versionamento; CI genera e verifica build ripetuta.
- Max 20 MiB PDF; protezione, Inspector, batch e confronto PDF rinviati alle release successive. Desktop engine invariato, deploy manuale.

## Office Edition 2.0.1 — Update Fix
- Avviso di nuova versione PWA e comando Aggiorna applicazione con conferma di perdita dei dati in memoria; nessuna ricarica automatica delle altre finestre.
- Verifica manuale in Impostazioni, controllo al ritorno in primo piano e registrazione senza cache HTTP del Worker; controllo della coerenza HTML/versione prima dell'attivazione.
- Attivazione esplicita del Worker, rimozione delle sole cache obsolete nello scope MetaMago, test di aggiornamento multi-finestra e migrazione da cache precedente.
- La transizione iniziale da una versione precedente può richiedere di chiudere tutte le finestre o rimuovere il vecchio Worker. Deploy manuale, Desktop invariata.

## Office Edition 2.0.0 — Professional Edition (candidato al rilascio stabile)
- Home consolidata con stato dell'area di lavoro, ripresa modifica e accesso a Inspector, confronto, modelli, batch e rubrica.
- Guida per attività in italiano e inglese, miglioramenti di focus e layout.
- Backup configurazione JSON unico: rubrica, gruppi, profili, modelli e preferenze; import validato con conferma e annullamento dell'anteprima batch, documento corrente invariato.
- Fine sessione esplicita e avvisi di ricarica coerenti; nessuna cancellazione dei file scaricati o promessa di cancellazione sicura della memoria.
- Mark riconosciuto solo quando tutte e tre le proprietà rispettano il formato previsto; conflitti preservati. Nomi dei modelli predefiniti riservati in entrambe le lingue.
- Manuale, checklist di rilascio e test di regressione di configurazione/sessione; Desktop invariato, deploy manuale. Adozione stabile subordinata al collaudo reale.

## Office Edition 1.11.0 — Performance Edition (candidato)
- Generazione ZIP e verifica delle parti non modificate in Web Worker locale temporaneo; fallback compatibile se non disponibile, errore senza download se il Worker fallisce durante il lavoro.
- Verifica di uguaglianza delle parti compresse, con CRC e dimensione effettiva verificati una volta; confronto byte per byte quando differiscono. Buffer preallocati, niente duplicazione dell'output per il percorso identico.
- Analisi XML e verifica delle proprietà ancora sul thread principale; limiti 50/150 MiB e batch invariati. Nessuna nuova dipendenza, richiesta di rete o persistenza.
- Impostazione di compatibilità, indicatori locali di durata ZIP e conteggi; benchmark sintetico e test di equivalenza e corruzione. Desktop invariato, deploy manuale.

## Office Edition 1.10.0 — Audit Edition (candidato)
- Confronto in sola lettura di due documenti, anche di formati differenti; riuso originale e ultima copia verificata, filtro differenze, valori originali delle proprietà standard, stato finale e Mark.
- Report CSV UTF-8 e HTML stampabile per confronto, Inspector e modello selezionato, copia verificata e anteprima/esito batch.
- Conferma esplicita e avviso riservatezza, protezione CSV contro celle formula e HTML senza script o risorse esterne; report non firmati, nessun registro persistente.
- Test dedicati, italiano/inglese e scorciatoia Alt+Maiusc+9; motore di riscrittura e Desktop invariati, deploy manuale.

## Office Edition 1.9.0 — Automation Edition (candidato)
- Vista Modelli documentali: tre modelli predefiniti, regole presenza/assenza/uguaglianza, formato, date e indicatori privacy, import/export JSON dei personalizzati.
- Verifica dei modelli in Inspector, separata dal punteggio di completezza e senza modifiche automatiche.
- Suggerimenti nome copia in editor e batch, usando titolo/data/nome originale, estensione preservata e collisioni batch evitate. Modelli non applicabili ignorati nel batch per la sola rinomina.
- Import XLSX in rubrica: selezione foglio visibile, intestazioni italiane/inglesi, anteprima e conferma, deduplicazione, rifiuto formule nelle celle dei nominativi.
- Test dedicati, traduzioni e navigazione Alt+Maiusc+8; motore di riscrittura e Desktop invariati, deploy manuale.

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
