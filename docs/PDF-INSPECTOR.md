# MetaMago 2.3.0 — PDF Inspector Edition

## Utilizzo
Scegli Analizza documento e carica un PDF, o usa Analizza PDF aperto nell'Inspector o nell'editor. La scansione è indipendente dall'editor e non modifica il file. La scheda mostra nome, versione PDF (ricavata da QPDF), pagine, SHA-256 dei byte originali (se Web Crypto disponibile), stato strutturale, cifratura e autorizzazioni. L'impronta non autentica il documento.

Per un PDF con password di apertura viene mostrato un risultato incompleto e un campo per inserire una password autorizzata. Una password errata mantiene il risultato non conclusivo. Sono accettati fino a 127 byte UTF-8, senza NUL. Le password sono svuotate dall'interfaccia, non memorizzate dall'app, non restituite dal Worker; non si promette cancellazione sicura della memoria. Nessun file decrittato viene generato. I permessi dichiarati non sono una garanzia di applicazione da ogni lettore.

## Indizi
- Info e XMP: proprietà standard e fino a 100 proprietà Info, valori testuali troncati a 2000 caratteri; valori binari non decodificati. XMP del catalogo per PDF non cifrati nei formati supportati (limite 1 MiB); PDF/A dichiarato rilevato nello schema riconosciuto, non validato. XMP cifrato non letto.
- Firme digitali/campi firma, restrizioni DocMDP/FieldMDP; non verifica validità, certificati, identità o integrità delle firme.
- Annotazioni e relativi flag Invisible, Hidden, NoView; allegati dichiarati (fino a 100 nomi, 300 caratteri ciascuno, non estratti); azioni JavaScript, OpenAction, AA, URI, Launch, SubmitForm e altri riferimenti riconosciuti; moduli, livelli opzionali, multimedia.
- I conteggi sono indizi strutturali, non numero esatto di annotazioni o allegati; più dizionari possono riferirsi allo stesso elemento. OpenAction può anche essere una semplice destinazione. Non si eseguono azioni né si seguono URL. La scansione comprende anche oggetti enumerati non raggiungibili, che possono non essere visibili.

## Copertura e limiti
QPDF 12.2.0 nel Worker locale già utilizzato per Protection. Analisi JSON senza stream; solo campi selezionati e conteggi tornano alla UI. QPDF --check è un controllo strutturale parziale, non rendering, validazione PDF/A o scansione antivirus. Exit 3 segnala avvisi, exit non zero di --check produce esito parziale; le assenze diventano non conclusive. Input massimo 20 MiB, 2000 pagine, 25000 oggetti, JSON fino a 16 MiB (conteggio in unità di testo), 200000 nodi/dizionari visitati e profondità 80, Worker 120 secondi. I limiti post-parsing non garantiscono un tetto di RAM. Non leggere PDF non attendibili; se WASM/policy blocca il Worker, nessuna analisi viene inventata. Non analizza testo, immagini, contenuti degli allegati, JavaScript o contenuto dei livelli. Non certifica assenza di informazioni sensibili. I risultati sono di sessione; report PDF e batch previsti per 2.5.0.

## Test e rilascio
Fixture sintetiche, firme simulate (non certificate), allegati e JavaScript non eseguiti, controlli SHA-256 con Node, cifratura prodotta da QPDF nativo, password errata e corretta, sole restrizioni, limiti e chiusura risultato, regressione Inspector Office. Collaudo manuale Edge/Acrobat e policy IT necessario. Deploy manuale.
