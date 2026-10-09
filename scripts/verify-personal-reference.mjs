import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const fixture='/files/IMG_9145_01a11d19-5534-7095-86a0-f120df9d263a.heic';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
const page=await browser.newPage({acceptDownloads:true});await page.goto('http://localhost:48371');
async function ready(){await page.waitForFunction(()=>!document.querySelector('fieldset').disabled,null,{timeout:360000});assert.deepEqual(await page.locator('.error').allTextContents(),[]);}
await page.getByLabel('Capture date').fill('2026-10-08T15:57:52');
assert((await page.locator('#ios-versions option').evaluateAll(ns=>ns.map(n=>n.value))).includes('26.6.2'));
await page.getByLabel('iOS version',{exact:true}).fill('26.6.2');
await page.getByLabel('Capture date').fill('2026-10-08T16:00');assert.equal(await page.getByLabel('iOS version',{exact:true}).inputValue(),'26.6.2');
await page.getByLabel('Choose photo',{exact:true}).setInputFiles(fixture);await ready();
await page.getByLabel('Import from a real photo',{exact:true}).setInputFiles(fixture);await ready();
const before=JSON.parse(execFileSync('exiftool',['-j','-n','-G1','-u',fixture]))[0];
for(const format of ['jpeg','heic']){
await page.getByLabel('Output format').selectOption(format);await page.getByRole('button',{name:/Create photo|Regenerate photo/}).click();await ready();
const d=page.waitForEvent('download');await page.getByRole('button',{name:/Download/}).click();const path='artifacts/personal-reference.'+(format==='jpeg'?'jpg':'heic');await(await d).saveAs(path);
const after=JSON.parse(execFileSync('exiftool',['-j','-n','-G1','-u',path]))[0];
for(const k of ['IFD0:Make','IFD0:Model','IFD0:HostComputer'])assert.equal(after[k],before[k]);assert.equal(after['IFD0:Software'],'26.6.2');
for(const [k,v]of Object.entries(before))if(k.startsWith('Apple:'))assert.deepEqual(after[k],v,k);
const validation=execFileSync('exiftool',['-validate','-warning','-error',path],{encoding:'utf8'});assert(!/Warning|Error/.test(validation),validation);
console.log(format+' native iPhone HEIC decode, complete Apple payload and IDs, Software26.6.2/HostComputer verified');
}
}finally{await browser.close();}

