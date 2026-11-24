# Execute on Windows to run the real engine against disposable copies.
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'Metadata-Core.ps1')
$dir=Join-Path ([IO.Path]::GetTempPath()) ('OfficeMetadataTest-'+[Guid]::NewGuid().ToString('N'));[void][IO.Directory]::CreateDirectory($dir)
function Hash-Parts([string]$file){
 $z=[IO.Compression.ZipFile]::OpenRead($file);$h=@{};$sha=[Security.Cryptography.SHA256]::Create()
 try{foreach($e in $z.Entries){if($e.FullName -in @('docProps/core.xml','docProps/app.xml','docProps/custom.xml','_rels/.rels','[Content_Types].xml')){continue};$s=$e.Open();try{$h[$e.FullName]=[Convert]::ToBase64String($sha.ComputeHash($s))}finally{$s.Dispose()}};return $h}finally{$sha.Dispose();$z.Dispose()}
}
try{
 foreach($fixture in Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot 'Test') -File){
  $source=Join-Path $dir $fixture.Name;Copy-Item -LiteralPath $fixture.FullName -Destination $source
  $dest=Join-Path $dir ('Copia-'+$fixture.Name);$oldHash=(Get-FileHash -LiteralPath $source).Hash;$oldParts=Hash-Parts $source
  $changes=[ordered]@{Author='Mario Rossi; Anna Verdi';LastAuthor='Anna Verdi';Created='2020-01-02T10:00:00Z';Modified='2021-03-04T11:00:00Z';Title='Test metadati';Company='Ente di prova';Manager='Responsabile';Comments='Test & <XML>';Category='Test';LastPrinted='2021-03-04T10:00:00Z'}
  $r=Write-Metadata $source $dest $changes $true $false;$actual=Read-Metadata $dest
  foreach($key in $changes.Keys){if($actual.Fields[$key] -cne $changes[$key]){throw "Campo non corrispondente: $key"}}
  if(!$actual.Final){throw 'Flag finale mancante'};if((Get-FileHash -LiteralPath $source).Hash -ne $oldHash){throw 'Originale modificato'}
  $newParts=Hash-Parts $dest;if($oldParts.Count -ne $newParts.Count){throw 'Numero parti diverso'};foreach($k in $oldParts.Keys){if($oldParts[$k] -ne $newParts[$k]){throw "Contenuto alterato: $k"}}
  $r=Write-Metadata $source $source ([ordered]@{Title='Sovrascrittura';Author='Autore test'}) $false $false
  if(!(Test-Path -LiteralPath $r.Backup) -or (Get-FileHash -LiteralPath $r.Backup).Hash -ne $oldHash){throw 'Backup non corrispondente'}
  if((Read-Metadata $source).Fields.Title -ne 'Sovrascrittura'){throw 'Sovrascrittura non riuscita'}
  $r=Write-Metadata $dest $dest ([ordered]@{Title=''}) $false $true
  if((Read-Metadata $dest).Fields.Title -ne '' -or !(Get-Item -LiteralPath $dest).IsReadOnly){throw 'Rimozione campo o sola lettura fallita'}
  Write-Host "PASS: $($fixture.Name) - metadati, contenuto, copia, backup, finale, sola lettura" -ForegroundColor Green
 }
 Write-Host 'Tutti i test automatici completati.' -ForegroundColor Green
}finally{Get-ChildItem -LiteralPath $dir -File -ErrorAction SilentlyContinue | ForEach-Object {$_.IsReadOnly=$false};Remove-Item -LiteralPath $dir -Recurse -Force -ErrorAction SilentlyContinue}
