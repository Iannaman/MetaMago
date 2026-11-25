$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$dist=Join-Path $root 'dist'
[void][IO.Directory]::CreateDirectory($dist)
$archive=Join-Path $dist 'MetaMago-Desktop-v1.0.0-beta-portable.zip'
$office=Join-Path $root 'Office\MetaMago-Office.html'
$officeOut=Join-Path $dist 'MetaMago-Office.html'
$stage=Join-Path ([IO.Path]::GetTempPath()) ('MetaMago-'+[Guid]::NewGuid().ToString('N'))
try {
 if (!(Test-Path -LiteralPath $office -PathType Leaf)) {throw 'Office Edition mancante'}
 $html=Get-Content -LiteralPath $office -Raw -Encoding UTF8
 foreach($marker in @('MetaMago','JSZip','</html>')) {
  if (!$html.Contains($marker)) {throw "Office Edition: marker mancante ($marker)"}
 }
 $folder=Join-Path $stage 'MetaMago'
 [void][IO.Directory]::CreateDirectory($folder)
 foreach($item in @('MetaMago.ps1','Metadata-Core.ps1','Avvia-MetaMago.bat','Esegui-Test.bat','Test-OfficeMetadata.ps1','LEGGIMI.txt','LICENSE','README.md','assets','Test')){
  Copy-Item -LiteralPath (Join-Path $root $item) -Destination $folder -Recurse
 }
 Compress-Archive -LiteralPath $folder -DestinationPath $archive -Force
 Copy-Item -LiteralPath $office -Destination $officeOut -Force
 $lines=foreach($file in @($archive,$officeOut)){
  (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()+'  '+[IO.Path]::GetFileName($file)
 }
 Set-Content -LiteralPath (Join-Path $dist 'SHA256SUMS.txt') -Value $lines -Encoding ASCII
 Write-Host "Creati: $archive e $officeOut"
} finally {if(Test-Path -LiteralPath $stage){Remove-Item -LiteralPath $stage -Recurse -Force}}
