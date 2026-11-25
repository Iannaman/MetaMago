import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)),'../MetaMago-Office.html')).href);
 const r=await page.evaluate(()=>{workflows=[validateWorkflow({name:'Synthetic',options:workflowCapture()})];$('batchOwner').value='Never-export-123';const c=configData(),old={...c,version:1};delete old.workflows;return {version:c.version,count:validateConfiguration(c).workflows.length,legacy:validateConfiguration(old).workflows.length,secret:JSON.stringify(c).includes('Never-export-123')}});
 assert.deepEqual(r,{version:2,count:1,legacy:0,secret:false});
 await page.locator('#unifiedGoal').selectOption('check');await page.locator('#unifiedStart').click();assert.equal(await page.locator('#compliancePanel').evaluate(e=>e.open),true);assert.deepEqual(errors,[]);
 console.log('PASS unified configuration and guided entry');
}finally{await browser.close()}
