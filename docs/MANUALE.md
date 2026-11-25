# MetaMago Protection Edition 2.2.0 — Manuale utente

MetaMago modifica proprietà dichiarative dei documenti Office autorizzati, non il contenuto, le firme, i registri ufficiali o l'identità verificata. L'edizione web elabora i file nel browser e produce nuove copie. Questa versione è candidata alla stabilità; verificare autorizzazione IT e collaudo su Office.

## Avvio
Apri [MetaMago](https://iannaman.github.io/MetaMago/). Premi Installa applicazione se vuoi una finestra autonoma; se il browser non presenta il prompt, segui le istruzioni del menu Edge/Chrome. Non modificare le policy aziendali. Il sito può mostrare una versione precedente fino al deploy. Verifica il numero di versione in alto. Da 2.0.1, quando compare Nuovo aggiornamento disponibile, salva le copie ed esporta la configurazione prima di premere Aggiorna applicazione e confermare. Non vengono ricaricate le altre finestre; ciascuna mostra un avviso. Puoi cercare aggiornamenti in Impostazioni. Il primo passaggio da versioni precedenti può richiedere la chiusura di tutte le finestre e riapertura; vedi PAGES.md.

## Attività
| Attività | Procedura |
|---|---|
| Modifica | Home → scegli un documento → modalità semplice o avanzata → modifica i campi → controlla riepilogo → salva copia → apri in Office e verifica File > Informazioni |
| Più documenti | Seleziona fino a 20 file e 100 MiB complessivi → scegli campi espliciti o profilo/gruppo → anteprima → conferma ZIP → controlla esiti |
| Analizza | Scegli file o originale aperto → completa i controlli → leggi indizi privacy e modello; non modifica il documento |
| Confronta | Scegli A/B o originale e ultima copia → confronta proprietà standard, stato finale e Mark → esporta report se autorizzato |
| Rubrica e profili | Aggiungi nominativi, importa JSON/CSV/XLSX, crea gruppi; salva profili dalla modifica. Esporta per conservare |
| Modelli | Scegli modello predefinito o crea regole personalizzate → verifica nell'Inspector; non modifica automaticamente i file |

Il Mark è facoltativo e predefinito su mantieni. Un Mark completo riconosciuto può essere aggiornato o rimosso esplicitamente; un conflitto resta invariato. Non è firma digitale. Autori e date non provano la provenienza; Office può aggiornarli a un nuovo salvataggio.

## Configurazione e sessione
Impostazioni → Esporta configurazione per ottenere un JSON con rubrica, gruppi, profili, modelli personalizzati, tema e preferenza Worker. Non contiene documenti, bozze, report o cronologia. Può contenere dati personali nei campi di configurazione: conservalo in una cartella autorizzata. Importa configurazione valida (massimo 8 MiB), verifica l'avviso e conferma la sostituzione. L'importazione annulla l'anteprima batch e quella XLSX; non cambia le proprietà del documento aperto. I singoli export di rubrica/modelli restano disponibili. Nessuna persistenza della configurazione nel sito. Per terminare, salva le copie ed esporta ciò che serve, poi premi Termina sessione e conferma. I dati in memoria vengono abbandonati con la ricarica; i file scaricati, la cache tecnica e la cronologia del browser non vengono cancellati. Non è una cancellazione sicura.

## Prestazioni e risoluzione problemi
Impostazioni → Prestazioni permette il Worker o il motore compatibile. Il Worker non è necessariamente più rapido: sui primi test sintetici il costo di avvio ha aumentato i tempi totali. Se non è disponibile, il programma usa il fallback. Se fallisce dopo l'avvio, nessun download viene prodotto. I limiti per documento sono 50 MiB di file e 150 MiB decompressi. Formati moderni DOCX/DOCM/DOTX/DOTM, XLSX/XLSM/XLTX/XLTM, PPTX/PPTM/POTX/POTM/PPSX/PPSM; cifrati, firmati, Strict, ZIP64 e formati legacy non supportati. Non esegue macro. Non tentare di aggirare le protezioni. Se non riesci a salvare, leggi il messaggio e conserva l'originale. Verifica il download: MetaMago non può attestare il salvataggio sul disco.

## Privacy e supporto
Inspector e report non certificano conformità o assenza di dati sensibili. Usa anche Ispeziona documento in Office prima della diffusione. Report e backup vanno gestiti come documenti potenzialmente riservati. Segnala errori con versione, browser, passaggi, testo errore e file sintetico; non pubblicare documenti reali, rubriche o nominativi su GitHub. [Issues](https://github.com/Iannaman/MetaMago/issues).

Approfondimenti: [Inspector](INSPECTOR.md), [Automation](AUTOMATION.md), [Audit](AUDIT.md), [Performance](PERFORMANCE.md), [collaudo](COLLAUDO.md).

## PDF
Dalla Home apri un PDF oppure scegli Metadati PDF. I valori Info e XMP sono affiancati; modifica solo i campi interessati. I campi selezionati e vuoti rimuovono le proprietà supportate, non tutti i dati identificativi. I PDF protetti, con firme/campi firma o PDF/A dichiarato non sono riscritti. Controlla sempre la copia nel lettore. Vedi [guida PDF](PDF.md).

## Protezione PDF
Apri un PDF accettato dall'editor; salva o ripristina eventuali modifiche ai metadati, scegli originale o ultima copia verificata. Imposta password proprietario, eventuale password di apertura e autorizzazioni. Conserva le password, conferma, scarica una nuova copia _protetto.pdf e provala nel lettore. Senza password di apertura il documento è leggibile da chiunque; le restrizioni non sono assolute. Non rimuove protezioni esistenti. Vedi [guida Protection](PROTECTION.md).
