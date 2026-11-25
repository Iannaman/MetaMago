# MetaMago 2.4.0 — Publication Edition (candidato)

## Flusso
Nell'editor PDF scegli originale o ultima copia metadati verificata. Salva/ripristina eventuali modifiche pendenti. Profilo Bozza (filigrana BOZZA), Uso interno (filigrana USO INTERNO), Distribuzione esterna (rimuove autore, creatore, produttore e parole chiave), Personalizzato. Sono preset modificabili, non regole di conformità. Riepilogo testuale delle operazioni e conferma prima del download. Nuova copia _pubblicazione.pdf. La copia corrente è utilizzabile come sorgente nella sezione Proteggi documento PDF, purché non siano cambiate impostazioni o sorgente.

## Funzioni e limiti
Filigrana testuale sovrapposta a tutte le pagine, centro/intestazione/piè di pagina, grigio/rosso/blu, dimensione 12–72 pt (ridotta per adattarsi alla pagina), opacità 15–80%, massimo 80 caratteri supportati da Helvetica Bold. Gestione delle rotazioni ortogonali e CropBox valido. Non è una firma né impedisce modifica; può coprire testo. Rivedere sempre le pagine nel lettore.

Pulizia selettiva tramite motore metadati esistente: campi standard Info/XMP supportati, proprietà Info custom modificabili, Mark riconosciuto. Rifiuta campi XMP non modificabili e conflitti Mark se selezionati. Le proprietà non selezionate, custom non modificabili, gli schemi sconosciuti e gli oggetti non visibili possono rimanere. Non rimuove allegati, azioni, testo, immagini o altre informazioni nascoste. Non è redazione sicura, anonimizzazione o cancellazione forense.

Appiattimento conservativo: solo campi di testo AcroForm semplici, un widget integrato nel dizionario del campo, appearance Form XObject esistente, senza NeedAppearances, calcoli, azioni sui widget o flag invisibile/nascosto/NoView. Esclusi campi gerarchici, widget multipli, widget su pagine ruotate, firme, XFA, altri tipi di campo. Non rigenera le appearance. Mantiene i valori visibili, non cancella informazioni. Non promette equivalenza visiva per ogni PDF; verificare prima della condivisione. Il catalogo AcroForm vuoto può rimanere.

## Verifica
Input come PDF Edition (20 MiB, non cifrato, non firmato, no PDF/A dichiarato). QPDF in Worker locale verifica struttura prima/dopo; rifiuta risultati parziali, warning o errori. Controlla geometria e numero pagine; verifica campi rimossi e assenza di widget dopo appiattimento. Nessuna copia in caso di verifica fallita. Output entro limite PDF esistente. Il motore non certifica integrità delle firme, assenza di dati personali o sicurezza. Nessuna nuova dipendenza, nessun invio dei documenti. Test sintetici con qpdf, pdftotext e pdftoppm, non un collaudo universale. Collaudo manuale Edge/Acrobat necessario. Deploy manuale.

Dalla 2.5.0: [PDF Automation](PDF-AUTOMATION.md), batch metadati e filigrana centrale; appiattimento e protezione rimangono singoli.
