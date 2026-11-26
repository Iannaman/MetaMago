import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true,viewport:{width:375,height:800}}),errors=[],downloads=[];let accept=true;
 page.on('pageerror',e=>errors.push(e.message));page.on('download',d=>downloads.push(d.suggestedFilename()));page.on('dialog',d=>accept?d.accept():d.dismiss());
 const id=x=>page.locator('#'+x);await page.goto(pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)),'../MetaMago-Office.html')).href);
 async function preset(p){await id('navHome').click();await id('quickPreset').selectOption(p);await id('quickPresetStart').click()}
 await preset('internal');assert.equal(await id('batchAuthorMode').inputValue(),'replace');assert.equal(await id('batchRun').isDisabled(),true);
 await page.evaluate(()=>{$('batchOwner').value='Secret-test-1234';$('batchCompany').value='Draft';$('batchCompanyOn').checked=true});
 accept=false;await preset('external');assert.equal(await id('viewHome').isVisible(),true);assert.equal(await page.evaluate(()=>$('batchCompany').value),'Draft');
 accept=true;await preset('external');assert.equal(await id('batchPrivacyOffice').isChecked(),true);assert.equal(await id('batchPrivacyPdf').isChecked(),true);assert.equal(await id('batchCompanyOn').isChecked(),false);assert.equal(await id('batchOwner').inputValue(),'');
 await preset('confidential');assert.equal(await id('batchProtectOn').isChecked(),true);assert.equal(await id('batchWatermarkOn').isChecked(),true);assert.equal(await id('batchPrivacyOffice').isChecked(),false);assert.equal(await id('batchOwner').inputValue(),'');
 await preset('identity');assert.equal(await id('batchProtectOn').isChecked(),false);assert.equal(await id('batchPrivacyOffice').isChecked(),true);
 await preset('standard');assert.equal(await id('compliancePanel').evaluate(e=>e.open),true);
 await preset('analyse');assert.equal(await id('viewInspect').isVisible(),true);
 assert.deepEqual(errors,[]);assert.deepEqual(downloads,[]);
 console.log('PASS Quick Actions: six presets, cancel, reset, credentials excluded, no automatic processing');
}finally{await browser.close()}
