# Checklist di rilascio — Professional Edition 2.0.0

Versione candidata alla stabilità. Non segnare come superato un controllo senza evidenza.

## Gate automatici
- [ ] CI Windows tests verde sul commit esatto: Desktop, build riproducibile, smoke, mark, web, team, global, quality, experience, inspector, automation, audit, performance, professional.
- [ ] Nessun errore JavaScript inatteso nei test; verifica dei file generati e limiti di sicurezza.
- [ ] Verifica dei benchmark sintetici; nessuna promessa di velocità o RAM non misurata.

## Gate manuali
- [ ] Windows 10/11, Edge e Chrome ammessi, PWA in finestra autonoma.
- [ ] Office 365 Word/Excel/PowerPoint: aprire originali/copie sintetici e verificare proprietà, contenuto, Mark e macro preservate senza esecuzione.
- [ ] Test di accessibilità con tastiera, zoom e lettore di schermo; entrambe le lingue.
- [ ] Test osservato con utenti non tecnici, come definito in UX.md.
- [ ] Verifica autorizzazione IT e procedure sui documenti istituzionali.
- [ ] Registrare versione, commit, ambiente, data, esito, eventuali difetti e responsabile del collaudo in un documento interno, non nel repo pubblico se riservato.

## Pubblicazione
Dopo i gate, avvia manualmente Deploy MetaMago Web su main, verifica job verde e versione effettiva nel browser (chiudi e riapri tutte le finestre PWA per aggiornare il service worker). Crea release manuale con tag v2.0.0 sul commit collaudato. Mantieni pre-release finché i gate manuali non sono soddisfatti. La Desktop Edition resta 1.0.0-beta. Non promuovere in produzione se un test essenziale fallisce. Per rollback, predisporre un commit/revert verificato e nuovo deploy manuale; non riscrivere la cronologia.
