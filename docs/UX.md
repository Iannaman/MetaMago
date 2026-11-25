# MetaMago — studio UX v1.7.0

## Obiettivi e ipotesi
Ridurre la ricerca dei comandi per utenti non tecnici; mantenere il flusso su copia, senza caricare documenti su server. Evitare nuove sezioni vuote o l’obbligo di seguire un wizard. Queste sono ipotesi progettuali, non risultati di test con persone.

## User flow
- Home → scelta o trascinamento di un file → Modifica documento → proprietà semplici o avanzate → riepilogo → copia verificata → nuovo documento/chiusura.
- Home → più file → Più documenti → regole → anteprima per file → conferma → ZIP di copie; esclusi ed errori segnalati.
- Rubrica e profili → nominativo/gruppo/importazione → esportazione JSON → riuso in modifica singola o batch.
- Impostazioni → tema o lingua. Il tema è per sessione; il cambio lingua richiede conferma e ricarica.
- Home o Guida → guida interattiva facoltativa → Modifica documento. Nessun passaggio obbligatorio.
- Navigazione tra attività non elimina modifiche; apertura di un nuovo documento/chiusura richiedono la conferma esistente se necessario. Navigazione bloccata durante elaborazione.

## User journey e scenari
| Persona/scenario | Obiettivo | Possibile attrito | Risposta UX |
|---|---|---|---|
| Collega al primo utilizzo | Modificare titolo e autore | Troppi controlli, paura di sovrascrivere | Home, modalità semplice, riepilogo e copia |
| Referente di gruppo | Applicare autori a più file | Ripetere i nomi, confondere copia e originale | Rubrica/gruppi e batch dedicati, anteprima |
| Utente che alterna attività | Creare un gruppo senza perdere il documento aperto | Modifiche non salvate | Stato nella navigazione, mantenimento del lavoro |
| Utente con tastiera o schermo piccolo | Raggiungere e identificare i comandi | Navigazione lunga, contrasto, overflow | Focus, scorciatoie, tema e layout responsivo |

## Validazione da fare
Test osservato con almeno 5 utenti non tecnici: aprire un DOCX e salvare copia; creare gruppo e riutilizzarlo; batch misto; passare a Rubrica e tornare; installare l’app se consentito. Usare documenti sintetici. Raccogliere completamento senza aiuto, tempo, errori, comprensione della copia e feedback. Obiettivi preliminari: almeno 4/5 completano ciascun flusso principale senza aiuto e tutti comprendono che l’originale è preservato. Non attribuire risultati prima del test. Il tema e l’accessibilità richiedono ancora verifica manuale di contrasto, screen reader e zoom.

## Roadmap
1.7 Experience: navigazione e guida; 1.8 Inspector: analisi in sola lettura; 1.9 Automation: regole e modelli; 1.10 Audit: confronto e report; 1.11 Performance: benchmark e worker; 2.0 Professional: consolidamento dopo collaudo. Nessuna voce vuota per funzionalità future.

## Estensione v1.8.0
Home → Analizza documento → scelta file oppure originale aperto → punteggio e proprietà originali → segnalazioni Privacy Inspector → chiudi analisi oppure torna all'editor. Nessuna modifica o download automatico. Test osservato: verificare che l’utente distingua completezza dei metadati da privacy e non interpreti il mancato rilevamento come certificazione.

## Estensione v1.9.0
Modelli documentali → scegli un modello o crea regole → salva → Inspector → seleziona modello → verifica; nessuna correzione automatica. Editor → suggerisci nome → controlla → salva copia; batch → schema nome → anteprima → conferma ZIP. Rubrica → import XLSX → foglio visibile → anteprima → conferma. Testare la distinzione tra profilo di modifica e modello di verifica.

## Estensione v1.10.0
Confronta documenti → scegli A e B oppure usa originale/copia aperti → confronto → filtro differenze → report facoltativo. Inspector, copia verificata e batch → report con conferma di riservatezza. Distinguere report di anteprima da report di esito e spiegare che non costituiscono una certificazione o un registro immodificabile.
