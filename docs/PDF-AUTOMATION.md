# MetaMago 2.5.0 — PDF Automation Edition (candidato)

## Batch
Più documenti → Elabora più PDF. Carica fino a 10 PDF, 20 MiB per file e 60 MiB aggregati, anche trascinando un gruppo di soli PDF dalla Home. Batch Office e PDF separati; niente batch misto. Seleziona campi Info/XMP standard, Mark, pulizia custom Info modificabile e/o filigrana centrale grigia 36 pt, opacità 30%. Un campo selezionato vuoto rimuove la proprietà supportata. Preset Bozza, Uso interno, Distribuzione esterna. La pulizia non è redazione sicura. Non include appiattimento o cifratura multipla: si eseguono singolarmente.

Anteprima per file (valori prima/dopo, operazioni, esclusi/invariati), verifica QPDF e hash SHA-256. Conferma distinta per generare lo ZIP; riapertura e ricalcolo hash/piano prima della riscrittura, verifica strutturale della copia. Solo le copie verificate sono incluse, massimo 60 MiB di output PDF complessivo, nomi univoci. PDF cifrati, firmati, PDF/A dichiarati, incompatibili o non verificabili esclusi. Un errore su un file non annulla gli altri. L'annullamento attende il documento corrente e non scarica lo ZIP. Le modifiche alle impostazioni invalidano il piano e il risultato precedente.

## Modelli
Esporta/Importa modello PDF: JSON di tipo MetaMago.PDFRecipe, versione 1. Campi standard, Mark, custom booleano, testo filigrana. Dichiarativo, non esegue codice; nessuna password. File massimo 256 KiB; import validato e confermato. I modelli possono contenere nominativi o informazioni riservate. Non sono salvati automaticamente né aggiunti al backup configurazione Office. I preset sono distinti dai modelli di verifica Office.

## Confronto
Confronta documenti accetta anche PDF non protetti da password di apertura, con controllo strutturale superato. Per PDF/Office: autore, titolo, oggetto, parole chiave, creazione e modifica (Info vs proprietà Office). Per PDF/PDF anche creatore/produttore Info e campi standard XMP. Date complete con fuso normalizzate, valori binari/non testuali/troncati e XMP non leggibile non conclusivi. Non confronta testo, immagini, identità, altri campi o validità firme. Nessuna modifica.

## Report
CSV e HTML per anteprima/esito batch, confronto e Inspector PDF. Report descrittivi non firmati, esplicitamente confermati, escaping CSV/HTML. Possono contenere nomi e metadati; nessuna password o chiave. I report Inspector possono essere parziali. Nessun invio di file, nuovo servizio o libreria. Restano i limiti dei moduli PDF precedenti. Test sintetici automatici, collaudo manuale Edge/Acrobat ancora necessario. Deploy manuale.
