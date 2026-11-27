# Checklist di rilascio — Office Edition

Versione candidata: leggere `Office/VERSION` (3.3.2 al momento di questo aggiornamento). Non segnare un controllo come superato senza evidenza riferita al commit esatto. La Desktop Edition resta beta.

## Gate automatici
- [ ] Windows tests: integrazione PowerShell, pacchetto portable, build deterministica e intera suite Chromium (Office, PDF, privacy, batch, workflow, audit, PWA e UX).
- [ ] Matrice Chromium / Firefox / WebKit verde, rendering PDF incluso.
- [ ] Tre migrazioni PWA indipendenti consecutive: nessun risultato intermittente ignorato.
- [ ] Regressione workflow: controllo privacy preliminare salvato, backup e compatibilità legacy, esclusione delle password.
- [ ] Nessun errore JavaScript inatteso, verifica strutturale indipendente QPDF e originali invariati nei test pertinenti.
- [ ] Per la 3.4.0: regressioni motore combinato Office/PDF e interfaccia guidata, verifica indipendente delle copie, annullamento senza download, credenziali escluse dal piano, originali e bozze preservati.
- [ ] Verifica dei benchmark sintetici; nessuna promessa di velocità o RAM non misurata.
- [ ] Controllo dipendenze: lockfile, licenze, integrity npm, hash WASM e renderer; revisione delle segnalazioni di sicurezza applicabili (inclusi JSZip vendorizzato e PDF.js incorporato).

## Gate manuali
Seguire [il piano di accettazione](../Office/EXPERIENCE-VALIDATION.md).
- [ ] Windows 10/11, Edge e Chrome ammessi, PWA in finestra autonoma.
- [ ] Word, Excel e PowerPoint reali: aprire originali/copie sintetici e verificare proprietà, contenuto, Mark e macro preservate senza esecuzione.
- [ ] Lettore PDF: proprietà, pagine, filigrana, password e restrizioni.
- [ ] Accessibilità con tastiera, zoom, lettore di schermo e contrasto; entrambe le lingue.
- [ ] Test osservato con utenti non tecnici; registrare esiti e difetti, non solo obiettivi.
- [ ] Verificare autorizzazione IT e procedure sui documenti istituzionali.
- [ ] Registrare versione, commit, ambiente, data, esito, eventuali difetti e responsabile del collaudo senza dati riservati nel repository.

## Pubblicazione
Dopo i gate automatici, un eventuale deploy candidato deve essere esplicitamente identificato come tale. La promozione stabile richiede anche il collaudo manuale. Avviare manualmente Deploy MetaMago Web su main, verificare job verde, versione effettiva nel browser, aggiornamento PWA consensuale e download di prova. Per una release GitHub, usare il tag v seguito dalla versione di Office/VERSION sul commit collaudato; mantenerla pre-release fino al completamento dei gate manuali. Non promuovere in produzione se fallisce un controllo essenziale. Per rollback usare un revert verificato e nuovo deploy manuale; non riscrivere la cronologia.

I report non certificano anonimizzazione, autenticità o conformità legale; le restrizioni PDF non costituiscono un blocco assoluto.
