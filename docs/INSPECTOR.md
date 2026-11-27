# Privacy Inspector — MetaMago 1.8.0

## Utilizzo
Apri **Analizza documento** dalla Home o dalla navigazione. Scegli un file Office oppure **Analizza originale aperto** (l'originale caricato nell'editor, non la bozza). Puoi anche trascinare un singolo file nella zona di analisi. L'Inspector non produce copie, non modifica l'originale e non rimuove dati. Chiudi analisi elimina i risultati visualizzati, non è una cancellazione sicura della memoria.

## Punteggio
Cinque controlli binari da 20 punti: autore presente, ultimo autore presente, titolo presente, società/ente presente, date di creazione e modifica entrambe interpretabili e in ordine cronologico. Le proprietà vuote non ottengono punti. Il punteggio è una convenzione di completezza, non una misura di privacy, autenticità, sicurezza, conformità o integrità integrale. Un valore basso può essere corretto per una pubblicazione anonima. I modelli personalizzabili sono previsti nella roadmap successiva.

## Privacy Inspector
| Categoria | Indicatore |
|---|---|
| Autori | Creator e lastModifiedBy non vuoti |
| Proprietà personalizzate | Elementi della parte custom, compreso il Mark |
| Commenti | Nomi/tipi di parte e relazioni riconosciute |
| Revisioni Word | Marcatori OOXML riconosciuti nelle parti testuali selezionate |
| Fogli nascosti | Attributi hidden e veryHidden nel workbook |
| Slide nascoste | Attributo show=false/0 nelle parti slide |
| Note relatore | Parti/relazioni notesSlide, anche vuote |
| Link esterni | TargetMode External nelle relazioni o parti externalLink di Excel |
| Oggetti incorporati | Embeddings, OLE, relazioni package |
| Macro VBA | Estensione macro-enabled, parti e relazioni VBA |

Un conteggio indica il numero di indizi distinti (parti, proprietà, relazioni o fogli), non necessariamente il numero di oggetti o commenti effettivi. Più indizi possono riguardare lo stesso elemento. I collegamenti non vengono aperti, gli oggetti non vengono eseguiti e non viene mostrato il contenuto delle macro. Le categorie specifiche di altri formati sono non applicabili. Le segnalazioni non implicano automaticamente una violazione.

## Limiti
Controlli strutturali e XML mirati, con i limiti ZIP già applicati dall'editor. Fino a 300 parti XML e 32 MiB dichiarati totali per scansione mirata, 8 MiB per parte. Parti mancanti, danneggiate o saltate rendono l'analisi parziale; una categoria senza indizi diventa non conclusiva. Non sono analizzati tutto il testo o le immagini, i valori delle celle, i contenuti degli oggetti incorporati, formule arbitrarie o macro, e non è garantita la copertura di tutte le varianti OOXML. Non è un antivirus né un sostituto di Ispeziona documento di Microsoft Office. L'Inspector non verifica l'integrità completa di tutte le parti. File non supportati o firmati restano esclusi dal motore esistente.

I dati sono elaborati nel browser, non inviati a server. Non usare documenti reali in segnalazioni pubbliche. Prima di condividere file esternamente, seguire le procedure dell'organizzazione e usare anche le funzioni native Office.

## Privacy Inspector 2.0 (3.5.0 candidate)

Before opening or analysing an original, optionally enable **Analizza anche possibili dati personali nel testo**. Structural findings are filterable by status and include bounded technical references and suggested checks. Optional pattern detection is local and reports counts and references only, not matched strings. Existing property tables and Office metadata reports may still contain confidential metadata. Office analysis covers recognized text and standard metadata; unencrypted PDF analysis covers extractable text on up to 50 pages. No OCR, images, formulas or embedded-file extraction; encrypted PDF text is unavailable. Use **Prepara una copia unica → Confronta privacy prima e dopo** for optional structural and text comparison of original and verified copy. A reduction in occurrences does not demonstrate removal of particular identities or anonymisation. See [coverage and limitations](PRIVACY-3.5.md).
