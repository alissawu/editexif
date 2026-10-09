import {chromium} from 'playwright';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const native='/files/IMG_9145_01a11d19-5534-7095-86a0-f120df9d263a.heic';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
const page=await browser.newPage({acceptDownloads:true});const requests=[];page.on('request',r=>requests.push([r.method(),r.url()]));await page.goto('http://localhost:48371');
async function ready(){await page.waitForFunction(()=>!document.querySelector('fieldset').disabled,null,{timeout:360000});assert.deepEqual(await page.locator('.error').allTextContents(),[]);}
const input=page.getByLabel('Import from a real photo',{exact:true});assert.equal(await input.getAttribute('accept'),'image/*,.heic,.heif');assert.equal(await input.getAttribute('capture'),null);
await page.getByLabel('Choose photo',{exact:true}).setInputFiles('/tmp/editexif-no-ids.png');await ready();
await input.setInputFiles(native);await ready();
assert.equal(await page.getByLabel('Phone',{exact:true}).locator('option:checked').textContent(),'iPhone 16 Pro');
assert.equal(await page.getByLabel('iOS version',{exact:true}).inputValue(),'26.6.2');assert.equal(await page.getByLabel('Capture date').inputValue(),'2026-10-08T15:57:52');
assert.equal(await page.getByLabel('Timezone',{exact:true}).inputValue(),'America/New_York');assert(await page.getByLabel('Include GPS').isChecked());assert(Number(await page.getByLabel('Longitude',{exact:true}).inputValue())<0);assert.equal(await page.locator('.imported-note').count(),1);
await page.getByLabel('Capture date').fill('2026-10-09T12:34');await page.getByLabel('iOS version',{exact:true}).fill('26.7.1');await page.getByLabel('Include GPS').uncheck();
const source=JSON.parse(execFileSync('exiftool',['-j','-n','-G1','-u',native]))[0];let previous;
for(const format of ['jpeg','heic']){
await page.getByLabel('Output format').selectOption(format);await page.getByRole('button',{name:/Create photo|Regenerate photo/}).click();await ready();const promise=page.waitForEvent('download');await page.getByRole('button',{name:/Download/}).click();const path='artifacts/imported.'+(format==='jpeg'?'jpg':'heic');await(await promise).saveAs(path);
const meta=JSON.parse(execFileSync('exiftool',['-j','-n','-G1','-u',path]))[0];assert.equal(meta['IFD0:Software'],'26.7.1');assert.equal(meta['IFD0:HostComputer'],'iPhone 16 Pro');assert.equal(meta['ExifIFD:DateTimeOriginal'],'2026:10:09 12:34:00');assert(!Object.keys(meta).some(k=>k.startsWith('GPS:')));
for(const [k,v]of Object.entries(source)){if(!k.startsWith('Apple:'))continue;if(/:(ContentIdentifier|BurstUUID|ImageUniqueID|ImageCaptureRequestID|PhotoIdentifier)$/.test(k)){assert.notEqual(meta[k],v);if(previous)assert.notEqual(meta[k],previous[k]);}else assert.deepEqual(meta[k],v,k);}
previous=meta;console.log(format+' imported reference, editable settings, unknown MakerNotes and regenerated reference IDs passed');
}
await page.getByRole('button',{name:'Clear',exact:true}).click();assert.equal(await page.locator('.imported-note').count(),0);
await input.setInputFiles('/tmp/editexif-picsart.png');await ready();const note=await page.locator('.import-photo [role=status]').innerText();assert(note.includes('GPS coordinates'));assert(note.includes('Apple MakerNotes'));assert(!await page.getByLabel('Include GPS').isChecked());
await page.getByLabel('Output format').selectOption('jpeg');await page.getByRole('button',{name:/Create photo|Regenerate photo/}).click();await ready();console.log('Stripped-file import identifies missing fields, uses fallback template, and exports');
await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'artifacts/import-mobile.png',fullPage:true});
assert(!requests.some(([method,url])=>method!=='GET'||(/^https?:/.test(url)&&!url.startsWith('http://localhost:48371'))));console.log('Plain picker, clear, mobile overflow and no uploads passed');
}finally{await browser.close();}

