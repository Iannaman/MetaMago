<p align="center"><img src="assets/logo.svg" width="110" alt="MetaMago logo"></p>

# MetaMago 🪄
**Le proprietà cambiano, il contenuto no.**

Editor locale dei metadati di Microsoft Word, Excel e PowerPoint. Sviluppato da [Iannaman](https://github.com/Iannaman). Office Edition 3.1.4 è candidata al rilascio stabile; Desktop Edition resta beta. Il collaudo manuale su Office ed Edge aziendale è necessario prima di adottarla.

## Scegli l'edizione

| | Office Edition (consigliata per semplicità) | Desktop Edition |
|---|---|---|
| Avvio | Sito web o app installata (PWA) | BAT + PowerShell 5.1 / Windows Forms |
| Installazione | Facoltativa, dal browser | Nessuna |
| Modifica autori, date, proprietà | Sì | Sì |
| Rubrica locale | Sì, JSON, CSV e XLSX | Sì |
| Gruppi di autori e modifica massiva | Sì | No |
| Profili riutilizzabili | Sì | Non ancora |
| Salvataggio su copia | Sì, unica modalità | Sì, predefinito |
| Sovrascrittura con backup | No | Sì |
| Stato finale | Imposta/rimuovi | Imposta/mantieni |
| MetaMago Mark e ispettore proprietà personalizzate | Sì, facoltativo | Non ancora |
| Sola lettura Windows | No | Sì |

### Office Edition — v3.1.4 · Guided Experience

[**Avvia MetaMago**](https://iannaman.github.io/MetaMago/). Per aprirlo in una finestra dedicata, premi **Installa applicazione** o usa il comando App di Edge, se consentito. Seleziona un documento, modifica le proprietà e salva una copia. Verifica il risultato in Office > File > Informazioni.

La modalità Semplice è predefinita; Avanzata mostra altre proprietà e protezione. Puoi gestire la rubrica anche senza aprire un documento, richiamare un profilo dal menu rapido, selezionare l'ultimo autore con un clic e confermare i nomi digitati anche al salvataggio. La schermata di completamento permette di scaricare di nuovo la copia o aprire un altro documento. Le date visualizzate seguono la lingua selezionata; il confronto Audit usa valori originali.

**Guided Experience (3.1.4, candidato):** percorso batch in quattro passaggi basato sullo stato reale e dettagli tecnici PDF separati.

**Quick Actions (3.1.3, candidato):** sei preset guidati, conferma esplicita e nessuna modifica automatica.

**Smart Detection (3.1.2, candidato):** riepiloghi automatici basati sui metadati letti e sugli esiti Privacy Inspector, avvisi per protezioni e incompatibilità, senza certificazioni implicite o modifiche automatiche.

**Motion Update (3.1.1, candidato):** microinterazioni drag & drop, transizioni di navigazione, indicatore di elaborazione legato allo stato reale, feedback visivo e rispetto di prefers-reduced-motion; nessuna dipendenza aggiuntiva.

**Smart Interface (3.1.0, candidato):** dashboard orientata al documento, selezione multipla dalla home, quattro azioni rapide e strumenti professionali a divulgazione progressiva; motori di elaborazione invariati.

**PDF Compatibility (3.0.2, candidato):** percorso alternativo QPDF in sola lettura quando l’editor rifiuta un PDF; nessuna riscrittura permissiva, originali invariati.

**Stability Update (3.0.1, candidato):** correzioni di conservazione del modello nei workflow, annullamento batch, password su nuova selezione e interpretazione conservativa delle regole PDF. Test di regressione aggiuntivi.

**Unified Professional Edition (3.0.0, candidato):** guida iniziale per obiettivo, ripresa PDF, configurazione unificata con workflow e compatibilità backup v1, verifica facoltativa delle copie batch prima della cifratura. I controlli non conclusivi bloccano la singola copia quando il modello è selezionato.

**Optimization Edition (2.9.0, candidato):** ZIP batch in Blob con avanzamento, limite di 150 MiB per le copie aggregate, punti di sospensione tra file, migliore adattamento mobile. Nessuna promessa di riduzione RAM o velocità senza benchmark reali.

**Workflow Edition (2.8.0, candidato):** configurazioni batch riutilizzabili in sessione, import/export JSON senza password, pulizia identificativi Office/PDF prima di filigrana e cifratura. Verifica documentale separata.

**Compliance Edition (2.7.0, candidato):** controllo in sola lettura di più documenti Office e PDF rispetto ai modelli, esito per regola, report CSV/HTML. Regole PDF non supportate non conclusive; nessuna certificazione legale.

**Privacy Edition (2.6.0, candidato):** rimozione selettiva delle proprietà Office supportate e del Mark, copia verificata e analisi dei residui. Non modifica il contenuto, commenti, revisioni o macro; non certifica anonimizzazione.

**PDF Batch Edition (2.5.0, candidato):** batch misto Office/PDF per autori e Mark; titolo PDF facoltativo, impronta SHA-256 tra anteprima e salvataggio, verifica strutturale QPDF, ZIP e report. Filigrana e protezione AES-256 applicabili in batch, con cifratura per ultima e password comuni non incluse nei report. Le proprietà solo Office non vengono applicate ai PDF.

**Publication Edition (2.4.0):** profili Bozza/Uso interno/Distribuzione esterna, filigrana testuale su tutte le pagine (posizione, dimensione, opacità, colore), pulizia selettiva Info/XMP e Mark, appiattimento conservativo dei soli campi di testo AcroForm semplici. Nuova copia verificata con QPDF, utilizzabile dalla sezione Proteggi PDF. Non è redazione sicura né anonimizzazione. Vedi [Publication](docs/PUBLICATION.md).

**PDF Inspector Edition (2.3.0):** Inspector unificato Office/PDF in sola lettura, QPDF structural check, SHA-256 dell'originale, indicatori privacy, firme/campi firma, annotazioni nascoste, allegati (soli nomi), JavaScript, azioni, riferimenti esterni, moduli, livelli e contenuti multimediali; PDF cifrati con password autorizzata e permessi. Nessuna rimozione di protezioni, verifica crittografica delle firme o certificazione PDF/A; XMP cifrato non letto. [Guida PDF Inspector](docs/PDF-INSPECTOR.md).

**Protection Edition (2.2.0):** cifratura PDF AES-256 R6 con QPDF 12.2.0 in Worker WebAssembly, password proprietario obbligatoria, password di apertura facoltativa, permessi stampa/modifica/copia, verifica dell'output prima del download. Le restrizioni non sono un blocco assoluto; nessuna rimozione di protezioni esistenti. Dipendenza QPDF WASM 0.1.0 a versione esatta, licenze incluse, checksum WASM registrato nella build; integrity npm fissata nel lockfile e SHA256 WASM verificato dalla build. Vedi [guida Protection](docs/PROTECTION.md).

**PDF Edition (2.1.0):** modulo dedicato per PDF non cifrati e senza firme/campi firma, massimo 20 MiB. Confronto Info/XMP e modifica selettiva dei campi standard con sincronizzazione delle rappresentazioni XMP supportate. Proprietà Info testuali personalizzate e Mark PDF facoltativo; conservazione dei campi non selezionati, controllo delle parti originali e test di rendering. PDF/A dichiarato e XMP non supportato esclusi. Nessuna rimozione sicura dei dati o certificazione PDF/A. Il batch e Audit Office non includono ancora PDF; dalla 2.3.0 Inspector supporta PDF. Vedi [guida PDF](docs/PDF.md).

**Update Fix (2.0.1):** aggiornamenti PWA rilevati dal browser, avviso e pulsante di aggiornamento con conferma, verifica manuale in Impostazioni. Nessuna ricarica automatica delle finestre aperte, blocco durante l'elaborazione, eliminazione delle sole cache obsolete di MetaMago dopo l'attivazione. Il passaggio dalle versioni precedenti può richiedere una chiusura di tutte le finestre o la disattivazione del vecchio Service Worker. Vedi [GitHub Pages](docs/PAGES.md).

**Professional Edition:** Home con stato area di lavoro e accesso a tutte le attività principali, guida contestuale per attività, esportazione/importazione unificata di configurazione (rubrica, gruppi, profili, modelli, tema e modalità di elaborazione), chiusura esplicita della sessione dopo conferma. Nessun documento, report o cronologia viene incluso nel backup. Riconoscimento conservativo dei Mark incompleti o non validi. Vedi il [manuale utente](docs/MANUALE.md) e la [checklist di rilascio](docs/RELEASE.md).

**Performance Edition:** generazione ZIP e verifica binaria in un Web Worker locale temporaneo, con motore compatibile se il Worker non può avviarsi. Analisi e serializzazione XML restano sul thread principale. Le parti compresse identiche sono verificate con una sola decompressione e CRC, senza accumulare l'output decompresso; per parti diverse resta il confronto byte per byte. Buffer preallocati per le letture, limiti invariati. Impostazioni mostra modalità, durata dell'ultima fase ZIP e conteggi di parti, solo per sessione. Benchmark sintetico riproducibile, non una promessa di velocità o memoria complessiva. Vedi [guida Performance](docs/PERFORMANCE.md).

**Audit Edition:** confronto in sola lettura di due documenti Office (anche formati differenti), oppure originale aperto e ultima copia verificata. Confronta proprietà standard, stato finale e MetaMago Mark; filtro differenze. Report CSV UTF-8 e HTML stampabile per confronto, Inspector (anche modello selezionato), copia verificata, anteprima ed esito batch. Esportazione esplicita con avviso di riservatezza, protezione CSV da formule e escaping HTML; nessun registro persistente. I report sono descrittivi, non firmati, non provano autenticità o avvenuto salvataggio sul disco. Vedi [guida Audit](docs/AUDIT.md).

**Automation Edition:** modelli documentali predefiniti e personalizzati, verifiche di presenza/assenza/uguaglianza esatta, coerenza date e indicatori privacy nell'Inspector. I modelli non modificano automaticamente i documenti e non certificano la conformità. Import/export JSON dedicato; modelli personalizzati in memoria per sessione. Suggerimenti per i nomi delle copie in editor e batch, con estensione preservata, caratteri non ammessi rimossi e collisioni batch gestite. La rubrica importa XLSX da un foglio visibile con intestazioni Nominativo oppure Nome/Cognome (anche inglese), anteprima e conferma esplicita. Formule nelle celle dei nominativi non ammesse; nessun collegamento seguito. Vedi [guida Automation](docs/AUTOMATION.md).

**Inspector Edition:** dalla Home o dal menu **Analizza documento** puoi aprire un file in sola lettura oppure analizzare l'originale già aperto, senza alterare le modifiche in corso. Il punteggio di completezza (0–100) assegna 20 punti ciascuno a: autori, ultimo autore, titolo, società/ente, date di creazione e modifica presenti e coerenti. Il Privacy Inspector segnala proprietà dichiarative, commenti, revisioni Word riconosciute, fogli Excel nascosti, diapositive nascoste e note PowerPoint, collegamenti esterni, oggetti incorporati e indicatori VBA. I conteggi sono indizi strutturali, non numeri di commenti o dati personali. Controlli XML mirati entro 300 parti e 32 MiB (8 MiB per parte); risultati parziali/non conclusivi sono espliciti. Non analizza tutto il contenuto, non esegue macro, non segue link, non rimuove elementi e non certifica privacy o conformità. Vedi [guida Inspector](docs/INSPECTOR.md). Per la condivisione esterna usa anche Ispeziona documento di Office.

**Experience Edition:** Home orientata alle attività, navigazione laterale (adattiva su schermi piccoli), sezioni dedicate alla modifica singola, batch, rubrica e profili, impostazioni e guida. Cambiare sezione non scarta il documento corrente. Tema chiaro, scuro o di sistema per la sessione; guida interattiva in tre passaggi e scorciatoie Alt+Maiusc+1–9. L’installazione dell’app resta in Home. Il motore di elaborazione non cambia. Vedi [studio UX](docs/UX.md).

**Quality Edition:** controlli ZIP prima della decompressione (directory, nomi duplicati, percorsi, dimensioni, intestazioni e intervalli), limite effettivo di decompressione e controllo CRC delle parti lette, verifica dei tipi di contenuto Open XML. I formati ZIP64, multidisco, archivi con nomi non UTF-8 e strutture anomale non sono supportati. Il CRC rileva corruzione, non certifica autenticità. Chiudi documento libera i riferimenti applicativi alla copia corrente; non è una cancellazione sicura della memoria. Il batch può essere interrotto fra documenti: nessuno ZIP viene scaricato se annullato. Migliorata la visualizzazione su schermi piccoli.

**Global Edition:** italiano e inglese selezionati dalla lingua del browser, con selettore manuale. Cambiare lingua ricarica la pagina dopo conferma; salva le copie ed esporta la rubrica prima di cambiare. L’installazione PWA è facoltativa, tramite un browser compatibile e nel rispetto delle policy aziendali. La cache tecnica contiene esclusivamente risorse pubbliche statiche, non documenti o contatti. Migliorati focus da tastiera, collegamento di salto al contenuto e rendering delle righe batch fuori schermo. Non costituisce certificazione WCAG né garanzia di installabilità su ogni dispositivo.

**Team Edition:** crea gruppi di soli autori nella rubrica, aggiungili o sostituisci gli autori in un documento. Importa contatti da CSV UTF-8 (intestazione Nominativo oppure Nome;Cognome, separatore virgola o punto e virgola, modello scaricabile). Il JSON include anche i gruppi ed è compatibile con i file precedenti senza gruppi. Non usare rubriche personali nel repository.

Per la modifica massiva apri **Modifica più documenti**, oppure trascina più file nella zona iniziale. Seleziona fino a 20 file, 100 MiB complessivi (50 MiB ciascuno). Scegli se aggiungere o sostituire autori, impostare esplicitamente ultimo autore, società, responsabile o MetaMago Mark. I campi non selezionati, date, titoli e stato finale restano invariati. Caricare un gruppo precompila la modalità aggiunta; caricare un profilo precompila solo i suoi valori non vuoti (autori in sostituzione). Controlla l'anteprima per ogni documento, poi conferma. Il risultato è uno ZIP con le sole copie modificate e verificate; errori, file invariati e file esclusi sono elencati nella pagina. Nessuna sovrascrittura, nessun invio al server.

**MetaMago Mark:** in modalità Avanzata puoi scegliere di aggiungere, aggiornare o rimuovere il contrassegno applicativo. La scelta predefinita mantiene lo stato originale: nessun contrassegno viene aggiunto in automatico. Le tre proprietà testuali personalizzate sono `MetaMago.Editor` (`Edited with MetaMago`), `MetaMago.Version` (`2.4.0`) e `MetaMago.Edition` (`Office`). L'app rileva i contrassegni presenti e mostra le proprietà personalizzate originali in un ispettore di sola lettura. Nomi riservati non riconosciuti o duplicati vengono preservati; non vengono sovrascritti. Nessun dato personale, timestamp o identificativo del dispositivo viene aggiunto. Il contrassegno non è una firma digitale né prova di provenienza, può essere modificato o rimosso da Office e da altri programmi.

Il file è autonomo, contiene il motore ZIP e non richiede server, macro, PowerShell o connessione di rete durante l'elaborazione. Nella versione web e installata la memorizzazione permanente dei nominativi è disabilitata per evitare la condivisione dello storage tra progetti dello stesso dominio. Usa import/export JSON. La visita al sito può generare normali log del servizio di hosting. Non distribuire rubriche personali tramite il repository.

### Desktop Edition
Scarica il pacchetto portable dagli artifact di Actions o dalle Release quando disponibili. Estrai tutto e avvia `Avvia-MetaMago.bat`. In alternativa, scarica il sorgente e avvia lo stesso file dalla root. Richiede Windows 10/11, Windows PowerShell 5.1, Windows Forms e .NET Framework; non usa Office COM. L'avviatore usa ExecutionPolicy Bypass a livello di processo: non usarlo se non autorizzato dalle policy locali. Vedi [guida Desktop](LEGGIMI.txt).

## Formati
| Word | Excel | PowerPoint |
|---|---|---|
| DOCX, DOCM, DOTX, DOTM | XLSX, XLSM, XLTX, XLTM | PPTX, PPTM, POTX, POTM, PPSX, PPSM |

I file con macro non vengono eseguiti. Non supportati: DOC, XLS, PPT, XLSB, file cifrati, file firmati digitalmente, varianti Strict non riconosciute. Protezioni IRM e password non sono gestite.

## Limiti e sicurezza
- Si modificano solo proprietà dichiarative Open XML, non l'identità verificata, il protocollo, i log, le firme o la cronologia Microsoft 365. Utilizzare su documenti autorizzati con attribuzioni corrette.
- Le date interne sono diverse dalle date Windows; Office può aggiornare ultimo autore e data a un nuovo salvataggio. Gli autori multipli sono memorizzati con punto e virgola; verificarne la resa nella propria versione Office.
- Contrassegna come finale e sola lettura sono reversibili, non sono password e non bloccano il singolo campo Autore.
- Nessuna telemetria prevista. I link GitHub aprono siti esterni solo su richiesta. L'installazione PWA non garantisce l'autorizzazione da parte dei controlli aziendali: rispettare le policy.
- La rubrica non è quella Microsoft 365/Outlook. Non inserire documenti, nominativi o profili reali nelle segnalazioni.

## Sviluppo e distribuzione
`Office/src/`: template, CSS e moduli JavaScript (metadati, contrassegno, rubrica, interfaccia, gruppi e batch). `Office/vendor/jszip.min.js`: JSZip 3.10.1 (MIT), con avvisi di licenza inclusi. `Office/VERSION`: versione unica.
`Office/MetaMago-Office.html`: prodotto generato e non più versionato. Con Node.js 22 esegui `npm ci --prefix Office/pdf-deps --ignore-scripts --no-audit --no-fund`, quindi `node Office/build.mjs` e `node Office/build.mjs --check --pages` per confrontare la build ripetuta e generare i soli file pubblicabili in `dist/pages/`. PDF-lib 1.17.1 e dipendenze sono bloccate dal lockfile; licenze incluse nell'HTML generato. Nessuna dipendenza remota durante l'uso. Il workflow Windows genera l'HTML prima del pacchetto portable.
`MetaMago.ps1` e `Metadata-Core.ps1`: interfaccia e motore Desktop.
`Test/` e `Test-OfficeMetadata.ps1`: fixture sintetiche e test automatici Desktop.
`Build-Release.ps1`: genera esclusivamente ZIP Desktop, HTML Office e SHA256 in `dist/`.
La CI Windows verifica sintassi e test Desktop, poi crea gli artifact di entrambe le edizioni. Il job Office Browser usa Chromium e Playwright per verificare il file HTML locale, i flussi principali e il contrassegno sui tre formati, CSV, gruppi e batch misti. Il job testa anche la versione web sotto un percorso di progetto, l'installabilità PWA e l'assenza di richieste di rete durante l'elaborazione. I test di entrambe le edizioni devono superarsi prima di una release. Il workflow **Deploy MetaMago Web** è manuale, ripete i test browser e pubblica soltanto il sito generato; vedi [guida Pages](docs/PAGES.md). Vedi [collaudo manuale](docs/COLLAUDO.md). La pubblicazione di release resta manuale tramite GitHub.

## Licenza e supporto
Licenza [MIT](LICENSE), progetto indipendente non affiliato a Microsoft. [Issues](https://github.com/Iannaman/MetaMago/issues) per segnalazioni con dati fittizi. [Changelog](CHANGELOG.md).
