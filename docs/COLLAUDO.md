# Collaudo manuale — Windows / Office 365

Usare esclusivamente documenti sintetici o copie autorizzate.

## Office Edition 1.6.0 — Quality
- [ ] Aprire e salvare copie autorizzate di Word/Excel/PowerPoint, anche con template, macro non eseguite e proprietà personalizzate.
- [ ] Verificare rifiuto di ZIP troncati, duplicati, contenuto non coerente con estensione e CRC alterati; originali invariati.
- [ ] Chiudere documento dopo salvataggio e con modifiche non salvate; verificare conferma, reset campi e focus.
- [ ] Interrompere anteprima o generazione batch; verificare nessun download e nuova anteprima obbligatoria.
- [ ] Verificare layout 320/375 px, zoom 200%, tastiera e screen reader, entrambe le lingue.
- [ ] Misurare tempi e memoria su copie sintetiche di grandi dimensioni; non sono ancora disponibili risultati benchmark.
- [ ] Collaudo aziendale con IT e verifica delle proprietà nell'applicazione Office, senza risalvare gli originali.

### Regressione 1.5.0 — Global
- [ ] Avviare con browser italiano e inglese; verificare lingua, date, errori, confronto, gruppi e batch; cambiare lingua dopo avere salvato/esportato i dati.
- [ ] Navigare da tastiera, verificare focus, link salta al contenuto e lettura delle etichette.
- [ ] Online, abilitare uso offline; attendere la conferma e ricaricare il sito senza connessione. Provare installazione Edge solo se consentita.
- [ ] Verificare la cache: soltanto file statici del programma, nessun documento/rubrica/ZIP; controllare aggiornamento dopo chiusura e riapertura.

### Regressione 1.4.0 — Team
- [ ] Creare, modificare ed eliminare gruppi senza documento; importare/esportare JSON con gruppi e un JSON precedente.
- [ ] Importare CSV UTF-8 Nome/Cognome e Nominativo con virgole e punto e virgola; verificare il rifiuto di righe non valide.
- [ ] Aggiungere un gruppo agli autori esistenti e sostituirli esplicitamente.
- [ ] Selezionare DOCX, XLSX, PPTX, un file non valido, un file già conforme e due nomi uguali; controllare anteprima e ZIP.
- [ ] Cambiare una regola dopo l'anteprima: deve essere richiesta una nuova verifica. Verificare limiti, nomi univoci e campi non selezionati.
- [ ] Aprire ogni copia in Office e controllare gli originali, il download ripetuto e nessun salvataggio permanente online.

### Regressione 1.3.0 — Web
- [ ] Aprire il sito Pages su Edge e verificare versione ONLINE, pagina iniziale e link Scarica versione offline.
- [ ] Scaricare l'HTML, verificare SHA256 e aprirlo localmente: versione OFFLINE e nessuna installazione.
- [ ] Online la rubrica deve rimanere in memoria; esportare/importare JSON e verificare che un ricaricamento non ripristini i nominativi.
- [ ] Controllare nella scheda Network del browser che l'elaborazione non invii documenti o dati a server.
- [ ] Eseguire una modifica per ciascun formato e controllare il risultato in Office; verificare policy aziendali prima di usare documenti di lavoro.

### Regressione 1.2.0
- [ ] Senza selezionare alcuna azione Mark, modificare un metadato e verificare che non siano aggiunte proprietà MetaMago.
- [ ] In Avanzata scegliere Aggiungi / aggiorna; controllare il confronto e salvare una copia anche senza altri cambiamenti.
- [ ] In Office, File > Informazioni > Proprietà > Proprietà avanzate > Personalizza, verificare Editor, Version ed Edition, senza alterazioni visibili del contenuto.
- [ ] Riaprire la copia in MetaMago: controllare rilevamento e ispettore, quindi rimuovere il contrassegno da un'altra copia. Verificare che proprietà estranee e stato finale restino invariati.
- [ ] Verificare che un nuovo documento non erediti la scelta Mark precedente.
- [ ] Verificare con l'IT che l'uso della funzione sia appropriato per documenti istituzionali.

### Regressione 1.1.0
- [ ] Prima di aprire un documento, aggiungere un contatto, cercarlo, esportare e importare la rubrica.
- [ ] Aprire un documento: solo i campi essenziali devono essere visibili; passare ad Avanzata e tornare a Semplice senza perdere le modifiche.
- [ ] Inserire un autore senza premere Aggiungi: verificare il confronto e salvare direttamente.
- [ ] Provare profilo rapido, scelta ultimo autore, copia data e avviso cronologia.
- [ ] Verificare schermata Copia pronta, nuovo download, apertura altro documento senza conferma se le modifiche sono già state scaricate.
- [ ] Provare apertura fallita con un documento già attivo: il nome del precedente deve essere esplicito.
- [ ] Aprire `Office/MetaMago-Office.html` in Edge da una cartella locale autorizzata, anche offline.
- [ ] Provare selezione e trascinamento dei tre file di `Test/`.
- [ ] Aggiungere e rimuovere più autori; impostare ultimo autore, date e titolo.
- [ ] Provare altre proprietà, confronto prima/dopo, campi invariati e svuotati.
- [ ] Provare rubrica e profili: import/export JSON, persistenza facoltativa, cancellazione.
- [ ] Salvare una copia e controllare che l'originale non cambi.
- [ ] Aprire il risultato in Office > File > Informazioni, senza risalvare. Verificare autori multipli, data e contenuto.
- [ ] Contrassegnare come finale e rimuovere lo stato finale su una copia.
- [ ] Provare file non supportati, cifrati o firmati: verificare rifiuto e messaggio.
- [ ] Verificare la compatibilità con le policy aziendali insieme all'IT.

## Desktop Edition
- [ ] Avvio BAT da cartella con spazi, apertura interfaccia e icona.
- [ ] Link profilo, repository e release.
- [ ] Esegui-Test.bat restituisce PASS sui tre formati.
- [ ] Provare due autori, date locali/UTC e proprietà avanzate in Office.
- [ ] Verificare che la rubrica non memorizzi automaticamente gli autori; attivare la casella e riavviare.
- [ ] Provare ripristino campi con conferma, copia esistente rifiutata e backup sovrascrittura.
- [ ] Provare sola lettura e avviso finale.
- [ ] Provare template e macro autorizzati; verificare assenza di riparazioni.
- [ ] Verificare rifiuto di file cifrati/firmati e visualizzazione a 100%, 125%, 150% DPI.

La CI esegue i test PowerShell e produce entrambi i file di distribuzione con checksum. Il job Office Browser testa Chromium con file HTML locale e connessione offline; non sostituisce la prova Edge/Office 365 nell'ambiente aziendale. Pubblicare le release manualmente dopo il collaudo.
