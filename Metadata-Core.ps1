# Windows PowerShell 5.1. Open XML metadata engine.
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$script:CoreNS='http://schemas.openxmlformats.org/package/2006/metadata/core-properties'
$script:DcNS='http://purl.org/dc/elements/1.1/'
$script:DtNS='http://purl.org/dc/terms/'
$script:XsiNS='http://www.w3.org/2001/XMLSchema-instance'
$script:AppNS='http://schemas.openxmlformats.org/officeDocument/2006/extended-properties'
$script:RelNS='http://schemas.openxmlformats.org/package/2006/relationships'
$script:TypeNS='http://schemas.openxmlformats.org/package/2006/content-types'
$script:Specs=[ordered]@{
 Author=@('core','dc','creator',$script:DcNS); LastAuthor=@('core','cp','lastModifiedBy',$script:CoreNS)
 Created=@('core','dcterms','created',$script:DtNS); Modified=@('core','dcterms','modified',$script:DtNS)
 Title=@('core','dc','title',$script:DcNS); Subject=@('core','dc','subject',$script:DcNS)
 Keywords=@('core','cp','keywords',$script:CoreNS); Comments=@('core','dc','description',$script:DcNS)
 Category=@('core','cp','category',$script:CoreNS); Status=@('core','cp','contentStatus',$script:CoreNS)
 Revision=@('core','cp','revision',$script:CoreNS); Version=@('core','cp','version',$script:CoreNS)
 Language=@('core','dc','language',$script:DcNS); Identifier=@('core','dc','identifier',$script:DcNS)
 Company=@('app','','Company',$script:AppNS); Manager=@('app','','Manager',$script:AppNS)
 LastPrinted=@('core','cp','lastPrinted',$script:CoreNS)
}
$script:Formats=@('.docx','.docm','.dotx','.dotm','.xlsx','.xlsm','.xltx','.xltm','.pptx','.pptm','.potx','.potm','.ppsx','.ppsm')
function Read-XmlPart($zip,[string]$path) {
 $entry=$zip.GetEntry($path); if ($null -eq $entry) { throw "Parte XML mancante: $path" }
 $s=$entry.Open(); $reader=$null
 try { $settings=New-Object System.Xml.XmlReaderSettings; $settings.DtdProcessing='Prohibit'; $settings.XmlResolver=$null; $settings.MaxCharactersInDocument=16777216
  $reader=[System.Xml.XmlReader]::Create($s,$settings); $x=New-Object System.Xml.XmlDocument; $x.PreserveWhitespace=$true; $x.XmlResolver=$null; $x.Load($reader); return ,$x
 } finally { if($reader){$reader.Dispose()}; $s.Dispose() }
}
function Write-XmlPart($zip,[string]$path,$xml) {
 $old=$zip.GetEntry($path); if($old){$old.Delete()}; $e=$zip.CreateEntry($path,[IO.Compression.CompressionLevel]::Optimal); $s=$e.Open()
 try{$xml.Save($s)}finally{$s.Dispose()}
}
function Get-RelationshipType([string]$kind) {
 switch($kind){ 'core' {'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties'} 'app' {'http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties'} 'custom' {'http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties'} }
}
function Get-PartPath($rels,[string]$kind) {
 $type=Get-RelationshipType $kind
 $matches=@($rels.DocumentElement.ChildNodes | Where-Object {$_ -is [System.Xml.XmlElement] -and ($_.GetAttribute('Type') -eq $type -or ($kind -ne 'core' -and $_.GetAttribute('Type') -eq $type.Replace('http://schemas.openxmlformats.org/officeDocument/2006/','http://purl.oclc.org/ooxml/officeDocument/')))})
 if($matches.Count -gt 1){throw "Relazioni duplicate per $kind"}; if(!$matches.Count){return $null}
 $r=$matches[0]; $t=$r.GetAttribute('Target'); if($r.GetAttribute('TargetMode') -eq 'External' -or $t -match '[\\?#:%]'){throw "Percorso non supportato: $t"}
 $t=$t.TrimStart('/'); if($t.StartsWith('./')){$t=$t.Substring(2)}; if($t -match '(^|/)\.\.?(/|$)' -or !$t){throw "Percorso non supportato: $t"}; return $t
}
function Assert-Package($zip) {
 if($null -eq $zip.GetEntry('[Content_Types].xml') -or $null -eq $zip.GetEntry('_rels/.rels')){throw 'Il file non e un documento Office Open XML valido.'}
 if(@($zip.Entries | Where-Object {$_.FullName -like '_xmlsignatures/*'}).Count){throw 'Documento con firma digitale del pacchetto: modifica annullata per non invalidare la firma.'}
 $rels=Read-XmlPart $zip '_rels/.rels'
 if(@($rels.DocumentElement.ChildNodes | Where-Object {$_ -is [System.Xml.XmlElement] -and $_.GetAttribute('Type') -like 'http://purl.oclc.org/ooxml/*'}).Count){throw 'Formato Office Open XML Strict non supportato.'}
 if(@($rels.DocumentElement.ChildNodes | Where-Object {$_ -is [System.Xml.XmlElement] -and $_.GetAttribute('Type') -match 'digital-signature'}).Count){throw 'Documento firmato: modifica annullata.'}
 return ,$rels
}
function Get-PartInfo($zip,$rels,[string]$kind) {
 $path=Get-PartPath $rels $kind
 if(!$path){return @{Path=$null; Xml=$null}}
 $xml=Read-XmlPart $zip $path
 $ns=switch($kind){'core'{$script:CoreNS};'app'{$script:AppNS};'custom'{'http://schemas.openxmlformats.org/officeDocument/2006/custom-properties'}}
 $root=if($kind -eq 'core'){'coreProperties'}else{'Properties'}
 if($xml.DocumentElement.LocalName -ne $root -or $xml.DocumentElement.NamespaceURI -ne $ns){throw "Schema $kind non supportato (eventuale formato Strict)."}
 return @{Path=$path;Xml=$xml}
}
function Get-Field($part,$spec) {
 if($null -eq $part.Xml){return ''}; $n=@($part.Xml.DocumentElement.ChildNodes | Where-Object {$_ -is [System.Xml.XmlElement] -and $_.LocalName -ceq $spec[2] -and $_.NamespaceURI -eq $spec[3]}); if($n.Count -gt 1){throw "Proprieta duplicata: $($spec[2])"}; if($n.Count){return [string]$n[0].InnerText}; return ''
}
function New-Part($zip,$rels,$types,[string]$kind) {
 $path="docProps/$kind.xml"; if($zip.GetEntry($path)){throw "Parte non collegata gia presente: $path"}
 $xml=New-Object System.Xml.XmlDocument
 switch($kind){
 'core' {$xml.LoadXml('<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>');$ct='application/vnd.openxmlformats-package.core-properties+xml'}
 'app' {$xml.LoadXml('<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"/>');$ct='application/vnd.openxmlformats-officedocument.extended-properties+xml'}
 'custom' {$xml.LoadXml('<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"/>');$ct='application/vnd.openxmlformats-officedocument.custom-properties+xml'}
 }
 $ids=@($rels.DocumentElement.ChildNodes | Where-Object {$_ -is [System.Xml.XmlElement]} | ForEach-Object {$_.GetAttribute('Id')}); $i=1;while($ids -contains "rId$i"){$i++}
 $rel=$rels.CreateElement('Relationship',$script:RelNS);$rel.SetAttribute('Id',"rId$i");$rel.SetAttribute('Type',(Get-RelationshipType $kind));$rel.SetAttribute('Target',$path);[void]$rels.DocumentElement.AppendChild($rel)
 $found=@($types.DocumentElement.ChildNodes | Where-Object {$_ -is [System.Xml.XmlElement] -and $_.GetAttribute('PartName') -eq "/$path"}); if($found.Count){throw "Content type gia presente per $path"}
 $over=$types.CreateElement('Override',$script:TypeNS);$over.SetAttribute('PartName',"/$path");$over.SetAttribute('ContentType',$ct);[void]$types.DocumentElement.AppendChild($over)
 return @{Path=$path;Xml=$xml}
}
function Set-Field($part,$spec,[string]$value) {
 $xml=$part.Xml; $n=@($xml.DocumentElement.ChildNodes | Where-Object {$_ -is [System.Xml.XmlElement] -and $_.LocalName -ceq $spec[2] -and $_.NamespaceURI -eq $spec[3]}); if($n.Count -gt 1){throw 'Proprieta duplicata.'}
 if($value -eq ''){if($n.Count){[void]$xml.DocumentElement.RemoveChild($n[0])};return}
 if($n.Count){$node=$n[0]}else{$node=$xml.CreateElement($spec[1],$spec[2],$spec[3]);[void]$xml.DocumentElement.AppendChild($node)}
 $node.InnerText=$value
 if($spec[2] -in @('created','modified')){
  $a=$xml.CreateAttribute('xmlns','dcterms','http://www.w3.org/2000/xmlns/');$a.Value=$script:DtNS;[void]$node.Attributes.SetNamedItem($a)
  $a=$xml.CreateAttribute('xsi','type',$script:XsiNS);$a.Value='dcterms:W3CDTF';[void]$node.Attributes.SetNamedItem($a)
 }
}
function Get-Final($part){
 if(!$part.Xml){return $false};$n=$part.Xml.SelectSingleNode("/*[local-name()='Properties']/*[local-name()='property' and @name='_MarkAsFinal']/*[local-name()='bool']");return ($null -ne $n -and $n.InnerText -in @('true','1'))
}
function Set-Final($part){
 $x=$part.Xml;$ns=$x.DocumentElement.NamespaceURI;$n=@($x.DocumentElement.ChildNodes | Where-Object {$_ -is [System.Xml.XmlElement] -and $_.GetAttribute('name') -ieq '_MarkAsFinal'});if($n.Count -gt 1){throw 'Proprieta finale duplicata.'}
 if($n.Count){$p=$n[0];while($p.HasChildNodes){[void]$p.RemoveChild($p.FirstChild)}}else{$p=$x.CreateElement('property',$ns);$ids=@($x.DocumentElement.ChildNodes|Where-Object{$_ -is [System.Xml.XmlElement]}|ForEach-Object{$_.GetAttribute('pid')});$i=2;while($ids -contains [string]$i){$i++};$p.SetAttribute('pid',[string]$i);[void]$x.DocumentElement.AppendChild($p)}
 $p.SetAttribute('name','_MarkAsFinal');$p.SetAttribute('fmtid','{D5CDD505-2E9C-101B-9397-08002B2CF9AE}');$v=$x.CreateElement('vt','bool','http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes');$v.InnerText='true';[void]$p.AppendChild($v)
}
function Read-Metadata([string]$path){
 if([IO.Path]::GetExtension($path) -notin $script:Formats){throw 'Formato non supportato. Usare un formato Office Open XML moderno.'}
 try{$zip=[IO.Compression.ZipFile]::OpenRead($path)}catch{throw 'Impossibile aprire il pacchetto. File in uso, cifrato con password, protetto da IRM o danneggiato.'}
 try{$rels=Assert-Package $zip;$parts=@{core=(Get-PartInfo $zip $rels 'core');app=(Get-PartInfo $zip $rels 'app');custom=(Get-PartInfo $zip $rels 'custom')};$fields=[ordered]@{};foreach($key in $script:Specs.Keys){$spec=$script:Specs[$key];$fields[$key]=Get-Field $parts[$spec[0]] $spec};return @{Fields=$fields;Final=(Get-Final $parts.custom)}}finally{$zip.Dispose()}
}
function Format-DateLocal([string]$raw){
 if(!$raw){return ''};try{$dt=[DateTimeOffset]::Parse($raw,[Globalization.CultureInfo]::InvariantCulture,[Globalization.DateTimeStyles]::AssumeUniversal);return $dt.LocalDateTime.ToString('yyyy-MM-dd HH:mm:ss')}catch{return $raw}
}
function Convert-DateInput([string]$value){
 if([string]::IsNullOrWhiteSpace($value)){return ''};$value=$value.Trim();$culture=[Globalization.CultureInfo]::InvariantCulture
 if($value -match '(Z|[+-]\d\d:\d\d)$'){$d=[DateTimeOffset]::Parse($value,$culture,[Globalization.DateTimeStyles]::None);return $d.UtcDateTime.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'",$culture)}
 $d=[DateTime]::ParseExact($value,[string[]]@('yyyy-MM-dd HH:mm:ss','yyyy-MM-dd HH:mm','yyyy-MM-dd'),$culture,[Globalization.DateTimeStyles]::None)
 if([TimeZoneInfo]::Local.IsInvalidTime($d) -or [TimeZoneInfo]::Local.IsAmbiguousTime($d)){throw 'Ora locale ambigua o non valida per il cambio ora. Specificare un offset ISO, ad es. 2026-10-25T02:30:00+01:00.'}
 return $d.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'",$culture)
}
function Write-Metadata([string]$source,[string]$destination,$changes,[bool]$markFinal=$false,[bool]$readOnly=$false){
 $source=[IO.Path]::GetFullPath($source);$destination=[IO.Path]::GetFullPath($destination);$same=[string]::Equals($source,$destination,[StringComparison]::OrdinalIgnoreCase)
 if([IO.Path]::GetExtension($source) -ine [IO.Path]::GetExtension($destination)){throw 'Mantenere la stessa estensione del file originale.'}
 if(!$same -and [IO.File]::Exists($destination)){throw 'La copia esiste gia: scegliere un nome nuovo.'}
 $guard=[IO.File]::Open($source,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::None);$guard.Dispose()
 if($same -and (Get-Item -LiteralPath $source).IsReadOnly){throw 'Il file originale e di sola lettura. Salvare una copia.'}
 $before=Read-Metadata $source; $tmp=[IO.Path]::Combine([IO.Path]::GetDirectoryName($destination),'.metadata-'+[Guid]::NewGuid().ToString('N')+[IO.Path]::GetExtension($source));$backup=$null
 try{
  [IO.File]::Copy($source,$tmp,$false);[IO.File]::SetAttributes($tmp,([IO.File]::GetAttributes($tmp) -band (-bnot [IO.FileAttributes]::ReadOnly)))
  $zip=[IO.Compression.ZipFile]::Open($tmp,[IO.Compression.ZipArchiveMode]::Update)
  try{$rels=Assert-Package $zip;$types=Read-XmlPart $zip '[Content_Types].xml';$parts=@{};$dirty=@{};$newPart=$false
   foreach($key in $changes.Keys){if(!$script:Specs.Contains($key)){throw "Campo sconosciuto: $key"};$spec=$script:Specs[$key];$kind=$spec[0];if(!$parts.ContainsKey($kind)){$parts[$kind]=Get-PartInfo $zip $rels $kind};if(!$parts[$kind].Xml){if([string]$changes[$key] -eq ''){continue};$parts[$kind]=New-Part $zip $rels $types $kind;$newPart=$true};Set-Field $parts[$kind] $spec ([string]$changes[$key]);$dirty[$kind]=$true}
   if($markFinal){$parts.custom=Get-PartInfo $zip $rels 'custom';if(!$parts.custom.Xml){$parts.custom=New-Part $zip $rels $types 'custom';$newPart=$true};Set-Final $parts.custom;$dirty.custom=$true}
   foreach($kind in $dirty.Keys){Write-XmlPart $zip $parts[$kind].Path $parts[$kind].Xml};if($newPart){Write-XmlPart $zip '_rels/.rels' $rels;Write-XmlPart $zip '[Content_Types].xml' $types}
  }finally{$zip.Dispose()}
  $after=Read-Metadata $tmp;foreach($key in $script:Specs.Keys){$expected=if($changes.Contains($key)){[string]$changes[$key]}else{[string]$before.Fields[$key]};if([string]$after.Fields[$key] -cne $expected){throw "Verifica fallita per $key"}};if(($markFinal -or $before.Final) -and !$after.Final){throw 'Verifica della protezione finale fallita.'}
  if($same){$backup=$source+'.backup-'+[Guid]::NewGuid().ToString('N').Substring(0,8)+[IO.Path]::GetExtension($source);[IO.File]::Replace($tmp,$source,$backup)}else{[IO.File]::Move($tmp,$destination)}
  $warning='';if($readOnly){try{[IO.File]::SetAttributes($destination,([IO.File]::GetAttributes($destination) -bor [IO.FileAttributes]::ReadOnly))}catch{$warning='File salvato, ma impossibile impostare la sola lettura: '+$_.Exception.Message}}
  return @{Path=$destination;Backup=$backup;Warning=$warning}
 }finally{if([IO.File]::Exists($tmp)){try{[IO.File]::Delete($tmp)}catch{}}}
}
