# GitHub Pages — MetaMago Web

Il repository è pubblico, ma la pubblicazione del sito è un'operazione separata. Non usare "Deploy from a branch": esporrebbe anche i file non destinati al sito.

## Prima pubblicazione
1. Apri [Settings > Pages](https://github.com/Iannaman/MetaMago/settings/pages).
2. In Build and deployment > Source, seleziona **GitHub Actions**.
3. Apri [Actions > Deploy MetaMago Web](https://github.com/Iannaman/MetaMago/actions/workflows/pages.yml).
4. Seleziona **Run workflow**, branch **main**, poi **Run workflow**. I test browser devono passare prima del deploy. Se richiesto, approva il deployment nell'environment `github-pages`.
5. Dopo il job Deploy, apri https://iannaman.github.io/MetaMago/ e verifica HTTPS.

## Aggiornamenti
Il deploy è manuale: un push attiva la CI ma non aggiorna automaticamente il sito. Ripeti Run workflow quando vuoi pubblicare una versione collaudata. Il workflow rifiuta branch diversi da main; non richiede token personali, server o secret aggiuntivi. Le impostazioni dell'environment GitHub Pages devono consentire main.

## File pubblicati
La build pubblica soltanto index.html, LICENSE.txt, manifest.webmanifest, sw.js e le due icone PNG. Il comando Installa applicazione usa il prompt nativo, se disponibile, oppure indica il menu del browser. Nessun link per scaricare l’HTML viene esposto nella pagina.

## Privacy
Il browser elabora localmente i documenti e le rubriche; nessun upload, API, analytics o account. GitHub può registrare le visite al sito come normale hosting. La CSP limita script a hash noti e blocca le connessioni applicative. Online la memoria permanente della rubrica è disabilitata; esporta JSON per conservarla. Per uso istituzionale, verifica l'autorizzazione IT prima di utilizzare documenti di lavoro. Non usare per alterare registri ufficiali o attribuzioni non veritiere.

## Sviluppo
```sh
node Office/build.mjs
npm ci --prefix Office/pdf-deps --ignore-scripts --no-audit --no-fund
node Office/build.mjs
node Office/build.mjs --check --pages
npm install --no-save --no-package-lock playwright@1.56.1
npx playwright install chromium
node Office/tests/smoke.mjs
node Office/tests/mark.mjs
node Office/tests/web.mjs
node Office/tests/team.mjs
node Office/tests/global.mjs
node Office/tests/quality.mjs
node Office/tests/experience.mjs
node Office/tests/inspector.mjs
node Office/tests/automation.mjs
node Office/tests/audit.mjs
node Office/tests/performance.mjs
node Office/tests/professional.mjs
node Office/tests/update.mjs
node Office/tests/pdf.mjs # richiede pdftoppm (Poppler)
node Office/tests/protection.mjs # richiede qpdf nativo e pdftoppm
```
Node 22 è necessario solo per sviluppare e collaudare, non per utilizzare l'HTML. Non committare `dist/` o `node_modules/`. La PWA è facoltativa: premi Installa applicazione e conferma nel browser, se consentito. La cache tecnica è preparata automaticamente. Dalla 2.0.1 l'app mostra un avviso quando un nuovo service worker è pronto. Premi Aggiorna applicazione dopo aver salvato copie ed esportato la configurazione; conferma la ricarica. Le altre finestre ricevono un avviso senza ricaricarsi. In Impostazioni puoi usare Verifica aggiornamenti. L'HTML rimane associato alla versione attiva e il nuovo Worker controlla la versione dell'HTML prima di installarsi. Non riutilizzare lo stesso numero di versione per pubblicazioni differenti. Per il passaggio iniziale da una versione precedente, salva il lavoro e chiudi tutte le finestre, riapri e verifica; potrebbe essere necessario ripetere dopo che il Worker ha scaricato l'aggiornamento. Se il vecchio Worker resta attivo, in Edge DevTools > Application > Service Workers usa Unregister per il solo sito MetaMago e ricarica (se autorizzato). InPrivate consente di verificare il sito con cache separata. La distribuzione CDN può richiedere tempo; nessuna promessa di aggiornamento istantaneo.

Test Inspector PDF: `node Office/tests/pdf-inspector.mjs
node Office/tests/publication.mjs` (richiede QPDF nativo, già installato nella pipeline Protection).
