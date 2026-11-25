# Changelog

## Office Edition 1.2.0 — MetaMago Mark (candidato)
- Contrassegno applicativo facoltativo con tre proprietà personalizzate standard: Editor, Version, Edition; nessuna informazione personale o timestamp aggiunto.
- Azioni esplicite per mantenere, aggiungere/aggiornare o rimuovere il contrassegno, incluse nel confronto prima del salvataggio. Stato originale mantenuto di default.
- Rilevamento all'apertura, segnalazione dei conflitti, ispettore di sola lettura delle proprietà personalizzate.
- Verifica strutturale delle proprietà personalizzate non modificate e assegnazione dinamica dei PID per i nuovi campi.
- Test browser per assenza di tag di default, aggiunta, aggiornamento, rimozione, preservazione di proprietà estranee e conflitti.
- Desktop resta 1.0.0-beta; GitHub Pages non ancora attivato.

## Office Edition 1.1.0 — Simple Magic
- Modalità Semplice predefinita e Avanzata; indicatore del tipo di documento.
- Rubrica indipendente con ricerca, inserimento e rimozione contatti, cancellazione esplicita e importazione/export JSON validati; memoria facoltativa.
- Profili rapidi; ultimo autore selezionabile dagli autori; autocompletamento e conferma dei nomi digitati al salvataggio.
- Date nel confronto in formato italiano, scorciatoia per copiare la creazione e avviso su date incoerenti.
- Schermata di completamento con download ripetibile e apertura del documento successivo; avvisi solo per modifiche non salvate.
- Errore di apertura esplicito sul documento precedente rimasto attivo; ripristino campi e controlli nome copia.
- Test browser Chromium offline sui tre formati e sui principali flussi utente.
- Motore Open XML invariato. Desktop resta 1.0.0-beta. MetaMago Mark e GitHub Pages non ancora implementati.

## Non rilasciato — Office Edition 1.0 Beta e pulizia
- Aggiunta Office Edition: singolo HTML offline con JSZip incluso, autori, date, profili, rubrica importabile/esportabile, confronto e salvataggio su copia.
- Office Edition: stato finale reversibile, verifica delle parti non modificate e rifiuto dei file non supportati.
- Desktop: memorizzazione automatica rubrica disattivata, conferma ripristino, dialogo copia coerente con il rifiuto della sovrascrittura.
- Aggiunto test per la protezione delle copie esistenti; corretto il codice di uscita dell'avviatore dei test.
- Ripuliti metadati delle fixture DOCX e PPTX, rimosso asset PNG inutilizzato e documentazione di pubblicazione automatica.
- Build locale/CI per entrambe le edizioni; nessuna pubblicazione automatica.
- Collaudo Office 365 e Edge aziendale ancora necessario.

## 1.0.0-beta
- Primo pacchetto Desktop candidato: nome MetaMago, logo, icona e link GitHub.
- Editor Word, Excel e PowerPoint, rubrica, protezioni reversibili e backup.
- Test Windows, documentazione e packaging.
