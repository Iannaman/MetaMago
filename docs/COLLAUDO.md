# Collaudo manuale — Windows / Office 365

Usare esclusivamente documenti sintetici o copie autorizzate.

## Office Edition 1.2.0
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
