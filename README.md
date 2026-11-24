<p align="center"><img src="assets/logo.svg" width="110" alt="MetaMago logo"></p>

# MetaMago 🪄
**Le proprietà cambiano, il contenuto no.**

Editor locale e portable dei metadati di Microsoft Word, Excel e PowerPoint per Windows 10/11. Sviluppato da [Iannaman](https://github.com/Iannaman). Versione **1.0.0-beta**: da collaudare su Office 365 prima dell'uso operativo.

## Download e avvio
Scarica `MetaMago-v1.0.0-beta-portable.zip` dalle [Release](https://github.com/Iannaman/MetaMago/releases), estrai tutta la cartella e avvia `Avvia-MetaMago.bat`. In alternativa, scarica il codice sorgente. Non serve installare moduli, Python o Office COM. Richiede Windows PowerShell 5.1, Windows Forms e .NET Framework. Office è utile per verificare il risultato. Non eseguire script se vietato dalle policy del proprio ente.

## Funzionalità
- Autori multipli, ultimo autore, date di creazione/modifica/stampa, titolo, oggetto, società, responsabile, categoria, parole chiave, commenti descrittivi, stato, revisione, versione, lingua e identificativo.
- Rubrica locale persistente, selezione multipla, aggiunta e rimozione contatti.
- Salvataggio su copia per default; sovrascrittura facoltativa con backup univoco.
- Contrassegna come finale (avviso reversibile) e sola lettura Windows (flag rimovibile).
- Verifica dei campi dopo la scrittura. Elaborazione offline; le macro non vengono eseguite.
- Link al profilo dello sviluppatore, repository e release nell'interfaccia.

| Word | Excel | PowerPoint |
|---|---|---|
| DOCX, DOCM, DOTX, DOTM | XLSX, XLSM, XLTX, XLTM | PPTX, PPTM, POTX, POTM, PPSX, PPSM |

## Come si usa
1. Chiudi il documento in Office e aprilo in MetaMago.
2. Modifica i campi, separa gli autori con `;`, o selezionali in rubrica.
3. Inserisci le date locali nel formato `AAAA-MM-GG HH:mm:ss` (o ISO con offset).
4. Scegli copia oppure originale con backup; conferma il salvataggio.
5. Controlla in Office > File > Informazioni > Proprietà, senza risalvare il file se vuoi conservare i metadati appena impostati.

## Limiti e uso responsabile
MetaMago modifica le proprietà dichiarative Open XML, non la cronologia, le firme, l'identità verificata o i log di Microsoft 365. Le date interne non sono le date del filesystem. Office può aggiornare automaticamente ultimo autore e data di modifica a un nuovo salvataggio. La rubrica è locale (`%LOCALAPPDATA%/OfficeMetadataEditor/rubrica.json`), non quella Outlook aziendale. I flag di protezione non impediscono modifiche intenzionali; non è possibile bloccare solo l'autore. Non supporta DOC/XLS/PPT, XLSB, file cifrati, IRM o firmati digitalmente; varianti Strict non supportate. Usare soltanto su documenti di cui si è autorizzati a modificare i metadati, senza attribuzioni ingannevoli. Nessuna telemetria; il browser si apre solo quando si seleziona un link.

## Sviluppo e test
`MetaMago.ps1`: GUI Windows Forms; `Metadata-Core.ps1`: motore Open XML; `Test-OfficeMetadata.ps1`: test di integrazione. Avvia `Esegui-Test.bat` per verificare i tre file sintetici inclusi. Il test confronta i campi, gli hash delle parti non modificabili, copie e backup. La CI esegue il test su Windows; non verifica l'interfaccia grafica né la resa in Office. Vedi [collaudo manuale](docs/COLLAUDO.md). Il pacchetto iniziale non è stato eseguito in Windows nell'ambiente di preparazione.

## Supporto e licenza
Segnala problemi nelle [Issues](https://github.com/Iannaman/MetaMago/issues) usando solo file fittizi, senza dati riservati. Licenza MIT (vedi `LICENSE`). Progetto indipendente, non affiliato a Microsoft.
