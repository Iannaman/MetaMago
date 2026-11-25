<p align="center"><img src="assets/logo.svg" width="110" alt="MetaMago logo"></p>

# MetaMago 🪄
**Le proprietà cambiano, il contenuto no.**

Editor locale dei metadati di Microsoft Word, Excel e PowerPoint. Sviluppato da [Iannaman](https://github.com/Iannaman). Entrambe le edizioni sono in beta.

## Scegli l'edizione

| | Office Edition (consigliata per semplicità) | Desktop Edition |
|---|---|---|
| Avvio | Un file HTML in Edge/Chromium | BAT + PowerShell 5.1 / Windows Forms |
| Installazione | Nessuna | Nessuna |
| Funzionamento offline | Sì | Sì |
| Modifica autori, date, proprietà | Sì | Sì |
| Rubrica locale | Sì, import/export JSON e import CSV | Sì |
| Gruppi di autori e modifica massiva | Sì | No |
| Profili riutilizzabili | Sì | Non ancora |
| Salvataggio su copia | Sì, unica modalità | Sì, predefinito |
| Sovrascrittura con backup | No | Sì |
| Stato finale | Imposta/rimuovi | Imposta/mantieni |
| MetaMago Mark e ispettore proprietà personalizzate | Sì, facoltativo | Non ancora |
| Sola lettura Windows | No | Sì |

### Office Edition — v1.6.0 · Quality Edition

**Online:** [Avvia MetaMago Web](https://iannaman.github.io/MetaMago/) (disponibile dopo il primo deploy Pages).

**Offline:**
1. Scarica [MetaMago-Office.html](Office/MetaMago-Office.html) (usa Download raw file nella pagina del file), oppure il file HTML dagli artifact di [Actions](https://github.com/Iannaman/MetaMago/actions) o dalle [Release](https://github.com/Iannaman/MetaMago/releases) quando disponibili.
2. Aprilo con Microsoft Edge da una cartella autorizzata.
3. Seleziona o trascina un documento, modifica le proprietà e salva una copia.
4. Verifica il risultato in Office > File > Informazioni.

La modalità Semplice è predefinita; Avanzata mostra altre proprietà e protezione. Puoi gestire la rubrica anche senza aprire un documento, richiamare un profilo dal menu rapido, selezionare l'ultimo autore con un clic e confermare i nomi digitati anche al salvataggio. La schermata di completamento permette di scaricare di nuovo la copia o aprire un altro documento. Il confronto mostra le date in italiano.

**Quality Edition:** controlli ZIP prima della decompressione (directory, nomi duplicati, percorsi, dimensioni, intestazioni e intervalli), limite effettivo di decompressione e controllo CRC delle parti lette, verifica dei tipi di contenuto Open XML. I formati ZIP64, multidisco, archivi con nomi non UTF-8 e strutture anomale non sono supportati. Il CRC rileva corruzione, non certifica autenticità. Chiudi documento libera i riferimenti applicativi alla copia corrente; non è una cancellazione sicura della memoria. Il batch può essere interrotto fra documenti: nessuno ZIP viene scaricato se annullato. Migliorata la visualizzazione su schermi piccoli. Nessun Web Worker o benchmark prestazionale introdotto.

**Global Edition:** italiano e inglese selezionati dalla lingua del browser, con selettore manuale. Cambiare lingua ricarica la pagina dopo conferma; salva le copie ed esporta la rubrica prima di cambiare. Il sito può preparare una cache offline tramite **Abilita uso offline del sito**; installazione PWA tramite browser compatibile, se consentita dall'organizzazione. La cache contiene esclusivamente risorse pubbliche statiche, non documenti o contatti. Per un uso offline indipendente dalla cache, scarica il file HTML. Migliorati focus da tastiera, collegamento di salto al contenuto e rendering delle righe batch fuori schermo. Non costituisce certificazione WCAG né garanzia di installabilità su ogni dispositivo.

**Team Edition:** crea gruppi di soli autori nella rubrica, aggiungili o sostituisci gli autori in un documento. Importa contatti da CSV UTF-8 (intestazione Nominativo oppure Nome;Cognome, separatore virgola o punto e virgola, modello scaricabile). Il JSON include anche i gruppi ed è compatibile con i file precedenti senza gruppi. Non usare rubriche personali nel repository.

Per la modifica massiva apri **Modifica più documenti**, oppure trascina più file nella zona iniziale. Seleziona fino a 20 file, 100 MiB complessivi (50 MiB ciascuno). Scegli se aggiungere o sostituire autori, impostare esplicitamente ultimo autore, società, responsabile o MetaMago Mark. I campi non selezionati, date, titoli e stato finale restano invariati. Caricare un gruppo precompila la modalità aggiunta; caricare un profilo precompila solo i suoi valori non vuoti (autori in sostituzione). Controlla l'anteprima per ogni documento, poi conferma. Il risultato è uno ZIP con le sole copie modificate e verificate; errori, file invariati e file esclusi sono elencati nella pagina. Nessuna sovrascrittura, nessun invio al server.

**MetaMago Mark:** in modalità Avanzata puoi scegliere di aggiungere, aggiornare o rimuovere il contrassegno applicativo. La scelta predefinita mantiene lo stato originale: nessun contrassegno viene aggiunto in automatico. Le tre proprietà testuali personalizzate sono `MetaMago.Editor` (`Edited with MetaMago`), `MetaMago.Version` (`1.6.0`) e `MetaMago.Edition` (`Office`). L'app rileva i contrassegni presenti e mostra le proprietà personalizzate originali in un ispettore di sola lettura. Nomi riservati non riconosciuti o duplicati vengono preservati; non vengono sovrascritti. Nessun dato personale, timestamp o identificativo del dispositivo viene aggiunto. Il contrassegno non è una firma digitale né prova di provenienza, può essere modificato o rimosso da Office e da altri programmi.

Il file è autonomo, contiene il motore ZIP e non richiede server, macro, PowerShell o connessione di rete durante l'elaborazione. Nella versione offline il salvataggio della rubrica/profili nel browser è facoltativo; online è disabilitato per evitare la condivisione dello storage tra progetti dello stesso dominio. Usa import/export JSON. La visita al sito può generare normali log del servizio di hosting. Non distribuire rubriche personali tramite il repository.

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
- Nessuna telemetria prevista. I link GitHub aprono siti esterni solo su richiesta. Il funzionamento offline non garantisce l'autorizzazione da parte dei controlli aziendali: rispettare le policy.
- La rubrica non è quella Microsoft 365/Outlook. Non inserire documenti, nominativi o profili reali nelle segnalazioni.

## Sviluppo e distribuzione
`Office/src/`: template, CSS e moduli JavaScript (metadati, contrassegno, rubrica, interfaccia, gruppi e batch). `Office/vendor/jszip.min.js`: JSZip 3.10.1 (MIT), con avvisi di licenza inclusi. `Office/VERSION`: versione unica.
`Office/MetaMago-Office.html`: prodotto autonomo generato; non modificarlo direttamente. Dopo una modifica ai sorgenti, esegui `node Office/build.mjs` (Node.js 22), poi committa sorgenti e HTML. `node Office/build.mjs --check --pages` verifica la riproducibilità e genera i soli file pubblicabili in `dist/pages/`.
`MetaMago.ps1` e `Metadata-Core.ps1`: interfaccia e motore Desktop.
`Test/` e `Test-OfficeMetadata.ps1`: fixture sintetiche e test automatici Desktop.
`Build-Release.ps1`: genera esclusivamente ZIP Desktop, HTML Office e SHA256 in `dist/`.
La CI Windows verifica sintassi e test Desktop, poi crea gli artifact di entrambe le edizioni. Il job Office Browser usa Chromium e Playwright per verificare il file HTML locale, i flussi principali e il contrassegno sui tre formati, CSV, gruppi e batch misti. Il job testa anche la versione web sotto un percorso di progetto, il download offline e l'assenza di richieste di rete durante l'elaborazione. I test di entrambe le edizioni devono superarsi prima di una release. Il workflow **Deploy MetaMago Web** è manuale, ripete i test browser e pubblica soltanto il sito generato; vedi [guida Pages](docs/PAGES.md). Vedi [collaudo manuale](docs/COLLAUDO.md). La pubblicazione di release resta manuale tramite GitHub.

## Licenza e supporto
Licenza [MIT](LICENSE), progetto indipendente non affiliato a Microsoft. [Issues](https://github.com/Iannaman/MetaMago/issues) per segnalazioni con dati fittizi. [Changelog](CHANGELOG.md).
