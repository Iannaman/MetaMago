# Collaudo manuale — Windows / Office 365

Usare esclusivamente documenti sintetici o copie autorizzate.

## Office Edition 2.1.0 — PDF
- [ ] Modifica selettiva dei campi PDF Info e XMP; proprietà personalizzate e Mark; copia e originale invariato.
- [ ] Confrontare Info/XMP in Acrobat/Edge, renderizzare originale e copia; verificare resa grafica, moduli e annotazioni su fixture autorizzate.
- [ ] Verificare rifiuto PDF cifrati, firme/campi firma, PDF/A dichiarato, XML ambiguo e file troppo grandi. Verificare nessuna rimozione automatica di protezioni.
- [ ] Verificare PWA e nuova build con dipendenze bloccate. Collaudo reale ancora da eseguire.

### Regressione 2.0.1 — Update Fix
- [ ] Verificare migrazione da una versione già in cache; versione corretta dopo attivazione, eventuale attesa CDN.
- [ ] Verificare avviso aggiornamento, verifica manuale, annullamento e blocco durante elaborazione, altre finestre non ricaricate.
- [ ] Verificare nuova cache coerente, vecchia cache rimossa, cache estranee preservate, comportamento senza connessione e con policy aziendali.

### Regressione 2.0.0 — Professional
- [ ] Aprire Home e tutte le attività, verificare navigazione, focus, zoom 200%, mobile e guida IT/EN.
- [ ] Creare rubrica, gruppo, profilo, modello e preferenze; esportare configurazione e ripristinarla; verificare assenza di documenti, report e cronologia nel JSON.
- [ ] Importare configurazione errata, annullare conferma e verificare conservazione dei dati correnti; importare una valida con bozza aperta e verificare conservazione della bozza.
- [ ] Terminare sessione con conferma, verificare ricarica e assenza di dati dell’area di lavoro; annullare e verificare nessuna perdita. I file scaricati restano intatti.
- [ ] Verificare Mark incompleti, versioni non riconosciute e conflitti preservati.
- [ ] Compilare evidenze del collaudo reale e approvazione IT prima di dichiarare stabile. Vedi RELEASE.md.

### Regressione 1.11.0 — Performance
- [ ] Verificare generazione copie via Worker e motore compatibile per Word/Excel/PowerPoint, anche in PWA e con rete disattivata.
- [ ] Verificare che le parti immutate siano identiche, che un CRC corrotto venga respinto, che un errore del Worker non produca download e che la modalità compatibile funzioni.
- [ ] Eseguire benchmark sintetico e registrare tempi, ritardo del timer e conteggi parti; non interpretare il ritardo come misurazione completa della memoria o della UX.
- [ ] Collaudare su Edge aziendale e hardware reale, con documenti autorizzati di dimensioni differenti. Nessun aumento dei limiti prima delle misure.

### Regressione 1.10.0 — Audit
- [ ] Confrontare due file, anche di formati diversi, originali e copie, filtro differenze e valori identici.
- [ ] Esportare report CSV e HTML, verificare corrispondenza dei valori, escaping, celle formula e stampa.
- [ ] Esportare report Inspector con modello selezionato e analisi parziale, verificare esiti non conclusivi.
- [ ] Esportare report copia verificata, anteprima e risultato batch con file esclusi/invariati; distinguere proposte e copie elaborate.
- [ ] Verificare annullamento export, cancellazione risultati, nessuna persistenza o invio di dati; collaudo Excel/Edge manuale ancora necessario.

### Regressione 1.9.0 — Automation
- [ ] Creare, modificare, esportare e importare un modello con regole di presenza, assenza, uguaglianza, date e privacy; verificare formato non applicabile e analisi parziali.
- [ ] Confrontare la verifica del modello nell'Inspector con le proprietà originali; nessuna modifica automatica.
- [ ] Suggerire nomi da titolo/data, controllare estensione, caratteri non ammessi, collisioni batch e titolo assente; confermare prima di salvare copie.
- [ ] Importare XLSX da fogli visibili, con stringhe condivise o inline; verificare duplicati, intestazioni, formule non ammesse, anteprima e annullamento.
- [ ] Verificare italiano/inglese, tema e layout mobile; collaudare con Excel e Office reali. Non ancora eseguito manualmente.

### Regressione 1.8.0 — Inspector
- [ ] Analizzare Word, Excel, PowerPoint senza aprire l’editor, verificare proprietà e punteggio confrontandoli con Office.
- [ ] Verificare documenti sintetici con revisioni e commenti Word, fogli hidden/veryHidden, slide nascoste, note, link esterni, oggetti incorporati, indicatori VBA e proprietà personalizzate.
- [ ] Verificare esiti non applicabili, parziali e non conclusivi; nessuna garanzia di assenza di dati personali o malware.
- [ ] Analizzare l'originale durante una modifica non salvata; tornare all'editor e verificare la bozza e l'assenza di download.
- [ ] Verificare file danneggiati, limiti, chiusura analisi, lingua e layout a 375 px e tema scuro.
- [ ] Confrontare il rilevamento con Ispeziona documento di Office 365 su copie sintetiche autorizzate. Test manuale non ancora eseguito.

### Regressione 1.7.0 — Experience
- [ ] Verificare Home e viste separate, navigazione da tastiera, tema chiaro/scuro/sistema, lingua e layout mobile.
- [ ] Completare la guida, aprire file singolo e più file dalla Home; verificare che le modifiche non vadano perse passando a Rubrica o Impostazioni.
- [ ] Verificare blocco della navigazione durante elaborazione, focus dopo cambio vista, pulsante installazione e assenza di link HTML.
- [ ] Eseguire un test osservato con almeno cinque utenti non tecnici e misurare esito, tempo, errori e richieste di aiuto. Non ancora effettuato.

### Regressione 1.6.1 — Installazione
- [ ] Verificare che il sito mostri soltanto Installa applicazione, senza link di download HTML o comando cache.
- [ ] Installare da Edge o Chrome se consentito, aprire la finestra dedicata e verificare che il comando non appaia in modalità standalone.
- [ ] Verificare guida alternativa quando il prompt non è disponibile, senza aggirare le policy.

### Regressione 1.6.0 — Quality
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
