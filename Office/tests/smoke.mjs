import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const dir=await mkdtemp(resolve(tmpdir(),'metamago-test-'));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({locale:'it-IT',acceptDownloads:true,offline:true,timezoneId:'Europe/Rome'});
const page=await context.newPage();
const errors=[],dialogs=[];
page.on('console',m=>{if(m.type()==='error')console.error('BROWSER CONSOLE:',m.text())});
page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR:',e.message)});
page.on('dialog',async d=>{dialogs.push(d.message());await d.accept()});
const id=x=>page.locator('#'+x);
const wait=async (fn,arg)=>page.waitForFunction(fn,arg,{timeout:15000});
const open=async ext=>{
  await id('file').setInputFiles(resolve(root,'Test','Prova.'+ext));
  try{await wait(ext=>document.querySelector('#filename').textContent==='Prova.'+ext&&!document.querySelector('#editor').disabled,ext)}catch(e){console.error('OPEN STATUS:',await id('loadstatus').textContent());throw e}
};
const generate=async (name)=>{
  const [download]=await Promise.all([page.waitForEvent('download'),id('save').click()]);
  assert.equal(download.suggestedFilename(),name);
  const path=resolve(dir,name);
  await download.saveAs(path);
  await id('completion').waitFor({state:'visible'});
  assert.equal(await id('save').isDisabled(),true);
  assert.equal(await page.evaluate(()=>pending()),false);
  return Array.from(await readFile(path));
};
try {
  await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
  assert.equal(await id('editorSection').isVisible(),false);
  assert.equal(await page.evaluate(()=>typeof PDFLib),'object','bundled PDF library must execute');
  assert.equal(await id('persist').isChecked(),false);
  await id('navRubric').click();
  await id('contactName').fill('Ada Test');
  await id('addContact').click();
  await id('contactSearch').fill('ada');
  assert.deepEqual(await id('managecontact').locator('option').allTextContents(),['Scegli nominativo','Ada Test']);
  await id('contactSearch').fill('');
  // Import JSON without a document.
  await id('jsonfile').setInputFiles({name:'rubrica.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,contacts:['Bruno Test'],profiles:[{name:'Team Test',authors:['Ada Test','Bruno Test'],lastAuthor:'Bruno Test',company:'Example',manager:''}]}))});
  await wait(()=>document.querySelector('#rubricstatus').textContent==='Rubrica e profili importati.');
  assert.match(await id('rubricCount').textContent(),/2 nominativi, 1 profili/);
  await id('navEdit').click();
  for(const ext of ['docx','xlsx','pptx']){
    await open(ext);
    assert.equal(await id('advancedFields').isVisible(),false);
    await id('quickProfile').selectOption('Team Test');
    await id('applyprofile').click();
    await id('newauthor').fill('Carla Test');
    assert.match(await id('diff').textContent(),/Carla Test/);
    await id('authorChoices').getByRole('button',{name:'Ultimo autore: Ada Test',exact:true}).click();
    await id('created').fill('2025-01-02T10:30');
    await id('copyDate').click();
    assert.equal(await id('modified').inputValue(),await id('created').inputValue());
    await id('title').fill('Example '+ext);
    await id('advancedMode').click();
    await id('company').fill('Example Org');
    await id('final').check();
    await id('simpleMode').click();
    assert.equal(await id('advancedFields').isVisible(),false);
    assert.match(await id('diff').textContent(),/Contrassegna come finale: Sì/);
    const output=await generate('Prova_metadati.'+ext);
    const meta=await page.evaluate(async ({output,ext})=>{const m=await inspect(new Uint8Array(output),ext);return {values:m.values,final:m.final,marker:m.marker}}, {output,ext});
    assert.equal(meta.values.author,'Ada Test; Bruno Test; Carla Test');
    assert.equal(meta.values.lastAuthor,'Ada Test');
    assert.equal(meta.values.created,'2025-01-02T09:30:00Z');
    assert.equal(meta.values.modified,meta.values.created);
    assert.equal(meta.values.title,'Example '+ext);
    assert.equal(meta.values.company,'Example Org');
    assert.equal(meta.final,true);
    assert.equal(meta.marker.status,'absent','no marker without explicit opt-in');
    const before=dialogs.length;
    const [again]=await Promise.all([page.waitForEvent('download'),id('downloadAgain').click()]);
    const againPath=resolve(dir,'again.'+ext);await again.saveAs(againPath);
    assert.deepEqual(Array.from(await readFile(againPath)),output);
    assert.equal(dialogs.length,before);
    if(ext==='docx'){
      await id('file').setInputFiles({name:'invalid.docx',mimeType:'application/octet-stream',buffer:Buffer.from('invalid')});
      await wait(()=>document.querySelector('#loadstatus').textContent.includes('Rimane aperto: Prova.docx'));
      assert.equal(dialogs.length,before,'no discard prompt after successful save');
      assert.equal(await id('filename').textContent(),'Prova.docx');
    }
    console.log('PASS',ext);
  }
  await id('title').fill('Unsaved changes');
  assert.equal(await page.evaluate(()=>pending()),true);
  await id('file').setInputFiles(resolve(root,'Test','Prova.docx'));
  await wait(()=>document.querySelector('#filename').textContent==='Prova.docx'&&!document.querySelector('#editor').disabled);
  assert.match(dialogs.at(-1),/Abbandonare le modifiche non salvate/);
  assert.equal(await id('completion').isVisible(),false);
  assert.deepEqual(errors,[]);
  console.log('PASS browser flows, offline mode, no page errors');
} finally {await browser.close();await rm(dir,{recursive:true,force:true})}
