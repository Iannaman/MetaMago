# Windows PowerShell 5.1 / WinForms
param([string]$Path)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
. (Join-Path $PSScriptRoot 'Metadata-Core.ps1')
[Windows.Forms.Application]::EnableVisualStyles()
$script:Current=$null;$script:Original=$null;$script:Initial=@{};$script:Boxes=@{};$script:LastOutput=$null;$script:SourceStamp=$null
$script:ContactDir=Join-Path $env:LOCALAPPDATA 'OfficeMetadataEditor';$script:ContactFile=Join-Path $script:ContactDir 'rubrica.json';$script:Contacts=@()
$dates=@('Created','Modified','LastPrinted')
function Notify([string]$message,[string]$title='MetaMago',[string]$kind='Information') { [void][Windows.Forms.MessageBox]::Show($form,$message,$title,[Windows.Forms.MessageBoxButtons]::OK,([Windows.Forms.MessageBoxIcon]$kind)) }
function Confirm([string]$message){return ([Windows.Forms.MessageBox]::Show($form,$message,'Conferma',[Windows.Forms.MessageBoxButtons]::YesNo,[Windows.Forms.MessageBoxIcon]::Warning) -eq [Windows.Forms.DialogResult]::Yes)}
function Add-Control($parent,$type,[int]$x,[int]$y,[int]$w,[int]$h,[string]$text=''){
 $c=New-Object "System.Windows.Forms.$type";$c.Location=New-Object Drawing.Point($x,$y);$c.Size=New-Object Drawing.Size($w,$h);$c.Text=$text;$parent.Controls.Add($c);return $c
}
function Button($parent,$x,$y,$w,$h,$text,$action){$b=Add-Control $parent 'Button' $x $y $w $h $text;$b.Add_Click($action);return $b}
$form=New-Object Windows.Forms.Form;$form.Text='MetaMago  |  1.0.0 beta';$form.StartPosition='CenterScreen';$form.ClientSize=New-Object Drawing.Size(940,730);$form.MinimumSize=New-Object Drawing.Size(956,769);$form.Font=New-Object Drawing.Font('Segoe UI',10);$form.AutoScaleMode='Dpi';$form.BackColor=[Drawing.Color]::FromArgb(245,247,250)
$header=Add-Control $form 'Panel' 0 0 940 82;$header.Anchor='Top,Left,Right';$header.BackColor=[Drawing.Color]::FromArgb(25,47,75)
$heading=Add-Control $header 'Label' 24 13 550 35 'MetaMago';$heading.ForeColor=[Drawing.Color]::White;$heading.Font=New-Object Drawing.Font('Segoe UI Semibold',21)
$subtitle=Add-Control $header 'Label' 26 51 590 23 'WORD / EXCEL / POWERPOINT  |  Le proprieta cambiano, il contenuto no.';$subtitle.ForeColor=[Drawing.Color]::FromArgb(200,219,235)
$profileUrl='https://github.com/Iannaman'
$repositoryUrl='https://github.com/Iannaman/MetaMago'
function Open-ProjectLink([string]$url){try{Start-Process -FilePath $url -ErrorAction Stop}catch{Notify ('Impossibile aprire il link: '+$url) 'MetaMago' 'Warning'}}
$credit=Add-Control $header 'Label' 640 8 280 22 'Developed by Iannaman';$credit.ForeColor=[Drawing.Color]::White;$credit.Anchor='Top,Right'
$profileLink=Add-Control $header 'LinkLabel' 640 32 135 24 'Profilo GitHub';$profileLink.LinkColor=[Drawing.Color]::FromArgb(208,198,255);$profileLink.ActiveLinkColor=[Drawing.Color]::White;$profileLink.Anchor='Top,Right';$profileLink.Add_LinkClicked({Open-ProjectLink $profileUrl})
$repoLink=Add-Control $header 'LinkLabel' 775 32 145 24 'Repository';$repoLink.LinkColor=[Drawing.Color]::FromArgb(208,198,255);$repoLink.ActiveLinkColor=[Drawing.Color]::White;$repoLink.Anchor='Top,Right';$repoLink.Add_LinkClicked({Open-ProjectLink $repositoryUrl})
$releaseLink=Add-Control $header 'LinkLabel' 640 55 280 23 'Release e aggiornamenti';$releaseLink.LinkColor=[Drawing.Color]::FromArgb(208,198,255);$releaseLink.ActiveLinkColor=[Drawing.Color]::White;$releaseLink.Anchor='Top,Right';$releaseLink.Add_LinkClicked({Open-ProjectLink ($repositoryUrl+'/releases')})
$iconPath=Join-Path $PSScriptRoot 'assets\MetaMago.ico';if(Test-Path -LiteralPath $iconPath){$form.Icon=New-Object Drawing.Icon($iconPath)}
$open=Button $form 20 97 150 34 'Apri documento...' {Open-Document}
$fileBox=Add-Control $form 'TextBox' 182 99 738 31;$fileBox.ReadOnly=$true;$fileBox.Anchor='Top,Left,Right';$fileBox.Text='Nessun documento selezionato'
$tabs=Add-Control $form 'TabControl' 20 148 900 420;$tabs.Anchor='Top,Bottom,Left,Right'
$general=New-Object Windows.Forms.TabPage;$general.Text='  Principali  ';$general.BackColor=[Drawing.Color]::White;$general.AutoScroll=$true;$tabs.TabPages.Add($general)
$advanced=New-Object Windows.Forms.TabPage;$advanced.Text='  Altri metadati  ';$advanced.BackColor=[Drawing.Color]::White;$advanced.AutoScroll=$true;$tabs.TabPages.Add($advanced)
$book=New-Object Windows.Forms.TabPage;$book.Text='  Rubrica autori  ';$book.BackColor=[Drawing.Color]::White;$book.AutoScroll=$true;$tabs.TabPages.Add($book)
function Field($parent,[string]$key,[string]$label,[int]$y,[int]$width=600,[int]$height=28){
 [void](Add-Control $parent 'Label' 18 ($y+3) 240 25 $label);$t=Add-Control $parent 'TextBox' 262 $y $width $height;if($height -gt 30){$t.Multiline=$true;$t.ScrollBars='Vertical'};$script:Boxes[$key]=$t;return $t
}
[void](Field $general 'Author' 'Autori (separati da ;)' 19 465 55);[void](Button $general 737 19 125 31 'Da rubrica...' { $tabs.SelectedTab=$book })
[void](Add-Control $general 'Label' 262 77 600 24 'Nomi o indirizzi e-mail separati da punto e virgola.')
[void](Field $general 'LastAuthor' 'Ultima modifica da' 109 465);[void](Button $general 737 107 125 31 'Da autore' { $script:Boxes.LastAuthor.Text=(@($script:Boxes.Author.Text -split ';' | ForEach-Object {$_.Trim()} | Where-Object {$_}) | Select-Object -First 1) })
[void](Field $general 'Created' 'Creazione documento' 155 465);[void](Button $general 737 153 125 31 'Adesso' {$script:Boxes.Created.Text=[DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss')})
[void](Field $general 'Modified' 'Ultima modifica documento' 199 465);[void](Button $general 737 197 125 31 'Adesso' {$script:Boxes.Modified.Text=[DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss')})
[void](Add-Control $general 'Label' 262 232 600 23 'Date locali: AAAA-MM-GG HH:mm:ss (es. 2026-11-24 14:30:00).')
[void](Field $general 'Title' 'Titolo' 264);[void](Field $general 'Subject' 'Oggetto' 309)
[void](Add-Control $general 'Label' 18 353 844 25 'I campi svuotati vengono rimossi. I campi non modificati restano invariati.')
[void](Field $advanced 'Company' 'Societa / Ente' 14);[void](Field $advanced 'Manager' 'Responsabile' 48);[void](Field $advanced 'Category' 'Categoria' 82);[void](Field $advanced 'Keywords' 'Parole chiave' 116);[void](Field $advanced 'Comments' 'Commenti (proprieta)' 150 600 55);[void](Field $advanced 'Status' 'Stato contenuto' 213);[void](Field $advanced 'Revision' 'Revisione' 247 230);[void](Field $advanced 'Version' 'Versione' 281 230);[void](Field $advanced 'Language' 'Lingua (es. it-IT)' 315 230);[void](Field $advanced 'Identifier' 'Identificativo' 349);[void](Field $advanced 'LastPrinted' 'Ultima stampa (data)' 383 465);[void](Button $advanced 737 381 125 31 'Adesso' {$script:Boxes.LastPrinted.Text=[DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss')});$advanced.AutoScrollMinSize=New-Object Drawing.Size(0,435)
[void](Add-Control $book 'Label' 18 15 840 48 'Seleziona uno o piu contatti da inserire nel documento. La rubrica e locale al profilo Windows; non modifica la rubrica di Microsoft 365.')
$list=Add-Control $book 'ListBox' 18 70 550 230;$list.SelectionMode='MultiExtended'
[void](Button $book 584 70 280 34 'Aggiungi agli autori' {Use-Contacts 'Author'})
[void](Button $book 584 112 280 34 'Imposta ultima modifica da' {Use-Contacts 'LastAuthor'})
[void](Button $book 584 154 280 34 'Memorizza autori del documento' {Remember-Authors})
[void](Button $book 584 196 280 34 'Rimuovi contatti selezionati' {Remove-Contacts})
[void](Add-Control $book 'Label' 18 308 800 24 'Nuovo contatto: nome completo oppure indirizzo e-mail')
$contact=Add-Control $book 'TextBox' 18 337 550 28;[void](Button $book 584 335 280 32 'Salva in rubrica' {Add-Contact})
$footer=Add-Control $form 'Panel' 20 580 900 128;$footer.Anchor='Bottom,Left,Right'
$saveCopy=Add-Control $footer 'RadioButton' 0 0 260 26 'Salva una nuova copia (consigliato)';$saveCopy.Checked=$true
$saveOriginal=Add-Control $footer 'RadioButton' 275 0 340 26 'Sovrascrivi originale (con backup)'
$mark=Add-Control $footer 'CheckBox' 0 32 270 26 'Contrassegna come finale';$readOnly=Add-Control $footer 'CheckBox' 275 32 235 26 'Sola lettura Windows'
$remember=Add-Control $footer 'CheckBox' 520 32 365 26 'Memorizza autori in rubrica locale';$remember.Checked=$false
$reset=Button $footer 0 68 155 40 'Ripristina campi' {if($script:Current -and (!(Has-Changes) -or (Confirm 'Ripristinare i campi e perdere le modifiche non salvate?'))){Load-Document $script:Current}}
$reveal=Button $footer 165 68 170 40 'Mostra file salvato' {if($script:LastOutput -and [IO.File]::Exists($script:LastOutput)){Start-Process explorer.exe -ArgumentList ('/select,"'+$script:LastOutput+'"')}};$reveal.Enabled=$false
$save=Button $footer 670 68 230 40 'SALVA DOCUMENTO' {Save-Document};$save.Anchor='Bottom,Right';$save.BackColor=[Drawing.Color]::FromArgb(26,86,145);$save.ForeColor=[Drawing.Color]::White;$save.FlatStyle='Flat';$save.Font=New-Object Drawing.Font('Segoe UI Semibold',11)
$status=Add-Control $form 'Label' 20 704 900 22 'Aprire un documento per iniziare.';$status.Anchor='Bottom,Left,Right';$status.ForeColor=[Drawing.Color]::FromArgb(48,77,104)
function Set-Enabled([bool]$value){$general.Enabled=$value;$advanced.Enabled=$value;$save.Enabled=$value;$reset.Enabled=$value;$mark.Enabled=$value;$readOnly.Enabled=$value;$saveCopy.Enabled=$value;$saveOriginal.Enabled=$value}
function Split-Authors([string]$value){return @($value -split '[;\r\n]+' | ForEach-Object {$_.Trim()} | Where-Object {$_} | Select-Object -Unique)}
function Refresh-Contacts{$list.Items.Clear();foreach($item in $script:Contacts){[void]$list.Items.Add([string]$item)}}
function Save-Contacts{[void][IO.Directory]::CreateDirectory($script:ContactDir);$json=ConvertTo-Json -InputObject @($script:Contacts) -Compress;[IO.File]::WriteAllText($script:ContactFile,$json,(New-Object Text.UTF8Encoding($false)));Refresh-Contacts}
function Load-Contacts{if([IO.File]::Exists($script:ContactFile)){try{$script:Contacts=@((Get-Content -LiteralPath $script:ContactFile -Raw -Encoding UTF8 | ConvertFrom-Json) | Where-Object {$_ -is [string] -and $_});Refresh-Contacts}catch{Notify ('Rubrica non leggibile: '+$_.Exception.Message) 'Rubrica' 'Warning'}}}
function Add-Contact{try{$v=$contact.Text.Trim();if(!$v -or $v -match '[;\r\n]'){throw 'Inserire un singolo nome o indirizzo e-mail, senza punto e virgola.'};$script:Contacts=@(@($script:Contacts)+@($v) | Sort-Object -Unique);Save-Contacts;$contact.Clear()}catch{Notify $_.Exception.Message 'Rubrica' 'Warning'}}
function Remember-Authors{try{if(!$script:Current){throw 'Aprire prima un documento.'};$script:Contacts=@(@($script:Contacts)+@(Split-Authors $script:Boxes.Author.Text) | Sort-Object -Unique);Save-Contacts}catch{Notify $_.Exception.Message 'Rubrica' 'Warning'}}
function Remove-Contacts{try{$selected=@($list.SelectedItems | ForEach-Object {[string]$_});if(!$selected.Count){return};if(Confirm 'Eliminare dalla rubrica locale i contatti selezionati?'){$script:Contacts=@($script:Contacts | Where-Object {$_ -notin $selected});Save-Contacts}}catch{Notify $_.Exception.Message 'Rubrica' 'Warning'}}
function Use-Contacts([string]$key){if(!$script:Current){Notify 'Aprire prima un documento.';return};$selected=@($list.SelectedItems | ForEach-Object {[string]$_});if(!$selected.Count){return};if($key -eq 'LastAuthor'){if($selected.Count -ne 1){Notify 'Selezionare un solo contatto per Ultima modifica da.';return};$script:Boxes.LastAuthor.Text=$selected[0]}else{$script:Boxes.Author.Text=(@(@(Split-Authors $script:Boxes.Author.Text)+$selected | Select-Object -Unique) -join '; ')};$tabs.SelectedTab=$general}
function Load-Document([string]$p){try{$p=[IO.Path]::GetFullPath($p);$metadata=Read-Metadata $p;$script:Current=$p;$script:SourceStamp=(Get-Item -LiteralPath $p).LastWriteTimeUtc.Ticks;$script:Original=$metadata;$script:Initial=@{};foreach($key in $script:Specs.Keys){$v=[string]$metadata.Fields[$key];if($key -in $dates){$v=Format-DateLocal $v};$script:Boxes[$key].Text=$v;$script:Initial[$key]=$script:Boxes[$key].Text};$fileBox.Text=$p;$mark.Checked=$false;$readOnly.Checked=$false;$saveCopy.Checked=$true;Set-Enabled $true;$status.Text=if($metadata.Final){'Documento caricato. Gia contrassegnato come finale (stato conservato).'}else{'Documento caricato. Modificare i campi desiderati.'};$tabs.SelectedTab=$general}catch{Notify $_.Exception.Message 'Impossibile aprire' 'Error'}}
function Has-Changes{if(!$script:Current){return $false};foreach($key in $script:Specs.Keys){if($script:Boxes[$key].Text -cne $script:Initial[$key]){return $true}};return ($mark.Checked -or $readOnly.Checked)}
function Open-Document{if((Has-Changes) -and !(Confirm 'Abbandonare le modifiche non salvate?')){return};$dlg=New-Object Windows.Forms.OpenFileDialog;$dlg.Title='Seleziona un documento Office';$dlg.Filter='Documenti Office|*.docx;*.docm;*.dotx;*.dotm;*.xlsx;*.xlsm;*.xltx;*.xltm;*.pptx;*.pptm;*.potx;*.potm;*.ppsx;*.ppsm|Word|*.docx;*.docm;*.dotx;*.dotm|Excel|*.xlsx;*.xlsm;*.xltx;*.xltm|PowerPoint|*.pptx;*.pptm;*.potx;*.potm;*.ppsx;*.ppsm';try{if($dlg.ShowDialog($form) -eq 'OK'){Load-Document $dlg.FileName}}finally{$dlg.Dispose()}}
function Save-Document{if(!$script:Current){return};try{
 if((Get-Item -LiteralPath $script:Current).LastWriteTimeUtc.Ticks -ne $script:SourceStamp){throw 'Il documento e cambiato dopo la lettura. Riaprirlo prima di salvare.'}
 $changes=[ordered]@{};foreach($key in $script:Specs.Keys){$v=$script:Boxes[$key].Text;if($v -ceq $script:Initial[$key]){continue};if($key -in $dates){try{$v=Convert-DateInput $v}catch{throw "Data non valida ($key): $($_.Exception.Message)"}}elseif($key -eq 'Author'){$v=(@(Split-Authors $v) -join '; ')}else{$v=$v.Replace("`r`n","`n").Replace("`r","`n")};$changes[$key]=$v}
 $dest=$script:Current
 if($saveOriginal.Checked){if(!(Confirm 'Sovrascrivere il documento originale? Verra conservato un backup nella stessa cartella.')){return}}
 else{$dlg=New-Object Windows.Forms.SaveFileDialog;$ext=[IO.Path]::GetExtension($script:Current);$dlg.Title='Salva una nuova copia';$dlg.Filter="Documento $ext|*$ext";$dlg.DefaultExt=$ext.TrimStart('.');$dlg.AddExtension=$true;$dlg.OverwritePrompt=$false;$dlg.InitialDirectory=[IO.Path]::GetDirectoryName($script:Current);$dlg.FileName=[IO.Path]::GetFileNameWithoutExtension($script:Current)+'_metadati'+$ext;try{if($dlg.ShowDialog($form) -ne 'OK'){return};$dest=$dlg.FileName}finally{$dlg.Dispose()};if([string]::Equals([IO.Path]::GetFullPath($dest),$script:Current,[StringComparison]::OrdinalIgnoreCase)){throw 'Per sovrascrivere usare la scelta dedicata.'}}
 $form.Cursor=[Windows.Forms.Cursors]::WaitCursor;$status.Text='Salvataggio e verifica delle proprieta...';$form.Refresh()
 $result=Write-Metadata $script:Current $dest $changes $mark.Checked $readOnly.Checked;$script:LastOutput=$result.Path;$reveal.Enabled=$true
 $message="Documento salvato e metadati verificati:`r`n$($result.Path)";if($result.Backup){$message+="`r`n`r`nBackup originale:`r`n$($result.Backup)"};if($result.Warning){$message+="`r`n`r`n$($result.Warning)"}
 # Load output so the screen corresponds to the actual saved file.
 Load-Document $result.Path;if($remember.Checked){Remember-Authors};$status.Text='Salvataggio completato. Metadati verificati.';Notify $message 'Salvataggio completato'
 }catch{$status.Text='Operazione non completata.';Notify ($_.Exception.Message+"`r`n`r`nChiudere il documento in Office e verificare i permessi della cartella.") 'Errore di salvataggio' 'Error'}finally{$form.Cursor=[Windows.Forms.Cursors]::Default}}
$form.Add_FormClosing({param($sender,$e) if((Has-Changes) -and !(Confirm 'Chiudere senza salvare le modifiche?')){$e.Cancel=$true}})
Set-Enabled $false;Load-Contacts
if($Path){Load-Document $Path}
[void]$form.ShowDialog();$form.Dispose()
