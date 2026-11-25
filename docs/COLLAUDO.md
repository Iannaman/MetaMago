# Collaudo manuale — Windows / Office 365

Usare esclusivamente documenti sintetici o copie autorizzate.

## Office Edition
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

La CI esegue i test PowerShell e produce entrambi i file di distribuzione con checksum. Il controllo HTML in build è statico, non sostituisce un test nel browser. Pubblicare le release manualmente dopo il collaudo.
