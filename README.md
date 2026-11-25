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
| Rubrica locale | Sì, import/export JSON | Sì |
| Profili riutilizzabili | Sì | Non ancora |
| Salvataggio su copia | Sì, unica modalità | Sì, predefinito |
| Sovrascrittura con backup | No | Sì |
| Stato finale | Imposta/rimuovi | Imposta/mantieni |
| Sola lettura Windows | No | Sì |

### Office Edition — v1.1.0 · Simple Magic
1. Scarica [MetaMago-Office.html](Office/MetaMago-Office.html) (usa Download raw file nella pagina del file), oppure il file HTML dagli artifact di [Actions](https://github.com/Iannaman/MetaMago/actions) o dalle [Release](https://github.com/Iannaman/MetaMago/releases) quando disponibili.
2. Aprilo con Microsoft Edge da una cartella autorizzata.
3. Seleziona o trascina un documento, modifica le proprietà e salva una copia.
4. Verifica il risultato in Office > File > Informazioni.

La modalità Semplice è predefinita; Avanzata mostra altre proprietà e protezione. Puoi gestire la rubrica anche senza aprire un documento, richiamare un profilo dal menu rapido, selezionare l'ultimo autore con un clic e confermare i nomi digitati anche al salvataggio. La schermata di completamento permette di scaricare di nuovo la copia o aprire un altro documento. Il confronto mostra le date in italiano.

Il file è autonomo, contiene il motore ZIP e non richiede server, macro, PowerShell o connessione di rete durante l'elaborazione. Il salvataggio della rubrica/profili nel browser è facoltativo; su computer condivisi preferire il solo uso temporaneo. Non distribuire rubriche personali tramite il repository.

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
`Office/MetaMago-Office.html`: versione autonoma HTML, CSS, JavaScript, JSZip 3.10.1 (MIT), con avvisi di licenza inclusi nel file.
`MetaMago.ps1` e `Metadata-Core.ps1`: interfaccia e motore Desktop.
`Test/` e `Test-OfficeMetadata.ps1`: fixture sintetiche e test automatici Desktop.
`Build-Release.ps1`: genera esclusivamente ZIP Desktop, HTML Office e SHA256 in `dist/`.
La CI Windows verifica sintassi e test Desktop, poi crea gli artifact di entrambe le edizioni. Il job Office Browser usa Chromium e Playwright per verificare il file HTML locale e i flussi principali. I test di entrambe le edizioni devono superarsi prima di una release. Vedi [collaudo manuale](docs/COLLAUDO.md). La pubblicazione di release resta manuale tramite GitHub.

## Licenza e supporto
Licenza [MIT](LICENSE), progetto indipendente non affiliato a Microsoft. [Issues](https://github.com/Iannaman/MetaMago/issues) per segnalazioni con dati fittizi. [Changelog](CHANGELOG.md).
