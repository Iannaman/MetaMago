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
La build genera solo `index.html`, `MetaMago-Office.html`, `SHA256SUMS.txt` e `LICENSE.txt`, più `manifest.webmanifest`, `sw.js` e le due icone PNG PWA. I documenti di prova, gli script Desktop e i sorgenti modulari non sono inclusi nell'artifact Pages (restano accessibili nel repository pubblico). La pagina e il file scaricabile sono byte per byte identici; la modalità dipende dal protocollo.

## Privacy
Il browser elabora localmente i documenti e le rubriche; nessun upload, API, analytics o account. GitHub può registrare le visite al sito come normale hosting. La CSP limita script a hash noti e blocca le connessioni applicative. Online la memoria permanente della rubrica è disabilitata; esporta JSON per conservarla. Per uso istituzionale, verifica l'autorizzazione IT e considera la copia offline verificata con il checksum, perché il sito può essere aggiornato. Non usare per alterare registri ufficiali o attribuzioni non veritiere.

## Sviluppo
```sh
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
```
Node 22 è necessario solo per sviluppare e collaudare, non per utilizzare l'HTML. Non committare `dist/` o `node_modules/`. La PWA è facoltativa: premi Abilita uso offline del sito e attendi la conferma. La cache può essere cancellata dal browser; per una copia indipendente scarica l'HTML. Installazione e service worker dipendono dal browser e dalle policy IT. Dopo un nuovo deploy, chiudi tutte le schede dell'app e riaprila per consentire l'attivazione del service worker aggiornato.
