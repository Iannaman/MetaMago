$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$dist=Join-Path $root 'dist';[void][IO.Directory]::CreateDirectory($dist)
$archive=Join-Path $dist 'MetaMago-v1.0.0-beta-portable.zip'
$stage=Join-Path ([IO.Path]::GetTempPath()) ('MetaMago-'+[Guid]::NewGuid().ToString('N'))
try {
 $folder=Join-Path $stage 'MetaMago';[void][IO.Directory]::CreateDirectory($folder)
 foreach($item in @('MetaMago.ps1','Metadata-Core.ps1','Avvia-MetaMago.bat','Esegui-Test.bat','Test-OfficeMetadata.ps1','LEGGIMI.txt','LICENSE','README.md','assets','Test')){
  Copy-Item -LiteralPath (Join-Path $root $item) -Destination $folder -Recurse
 }
 Compress-Archive -LiteralPath $folder -DestinationPath $archive -Force
 $hash=(Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
 Set-Content -LiteralPath (Join-Path $dist 'SHA256SUMS.txt') -Value ($hash+'  '+[IO.Path]::GetFileName($archive)) -Encoding ASCII
 Write-Host "Creato: $archive"
} finally {if(Test-Path -LiteralPath $stage){Remove-Item -LiteralPath $stage -Recurse -Force}}
