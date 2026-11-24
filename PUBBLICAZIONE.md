# Pubblicare MetaMago su GitHub

Il repository `Iannaman/MetaMago` non viene creato dal pacchetto finché non esegui lo script di pubblicazione. È stata scelta una licenza MIT e una release beta in bozza: rivedi la licenza e i file prima di confermare.

## Prerequisiti (solo sviluppatore)
Installa Git e GitHub CLI dai siti ufficiali oppure da PowerShell:

```powershell
winget install --id Git.Git -e
winget install --id GitHub.cli -e
```

Riapri il terminale e accedi (nessun token da inserire nei file):

```powershell
gh auth login
gh auth status
gh auth setup-git
gh auth refresh -h github.com -s workflow
```

Configura Git se necessario (`git config --global user.name` e `git config --global user.email`, usando l'indirizzo GitHub noreply se preferisci non divulgare quello personale).

## Procedura
1. Estrai il pacchetto sorgente. Esegui `Esegui-Test.bat` e il collaudo manuale.
2. Verifica i file sintetici e la licenza, quindi avvia `Pubblica-GitHub.bat`. Dopo il test e la build, digita `PUBBLICA` per creare il repository pubblico e caricare i sorgenti. Lo script crea anche una release prerelease in bozza con ZIP e SHA256SUMS.
3. Controlla [Actions](https://github.com/Iannaman/MetaMago/actions) e [Releases](https://github.com/Iannaman/MetaMago/releases). Quando tutto è verificato, apri la bozza e seleziona Publish release.

## Riprendere dopo un errore
Lo script non sovrascrive repository esistenti. Se fallisce dopo git init, controlla `git status`, `git remote -v`, `gh repo view Iannaman/MetaMago`. Completa il commit se mancante. Se il repository non esiste, esegui `gh repo create Iannaman/MetaMago --public --source=. --remote=origin --push`. Se esiste ed è quello corretto, configura il remote solo se assente e usa `git push -u origin main`. Non forzare il push. Per creare la bozza mancante esegui:

```powershell
.\Build-Release.ps1
gh release create v1.0.0-beta dist/MetaMago-v1.0.0-beta-portable.zip dist/SHA256SUMS.txt --repo Iannaman/MetaMago --target main --draft --prerelease --title "MetaMago 1.0.0 beta" --notes-file CHANGELOG.md
```

## Alternativa manuale
Apri https://github.com/new, scegli `MetaMago` sotto Iannaman, pubblico (o privato per collaudo), non inizializzare con README/licenza se usi Git locale. Carica i file sorgente, non i documenti personali o la rubrica. Crea la release allegando i file in `dist`.
