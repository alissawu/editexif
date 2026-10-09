import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({acceptDownloads:true});const requests=[];const errors=[];
page.on('console',m=>console.log(m.text()));page.on('request',r=>requests.push({url:r.url(),method:r.method()}));page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:48371');
async function ready(){await page.waitForFunction(()=>!document.querySelector('fieldset').disabled,null,{timeout:180000});assert.deepEqual(await page.locator('.error').allTextContents(),[]);}
async function input(path){await page.getByLabel('Choose photo',{exact:true}).setInputFiles(path);await ready();}
async function output(path){await page.getByRole('button',{name:/Create photo|Regenerate photo/}).click();await ready();const promise=page.waitForEvent('download');await page.getByRole('button',{name:/Download/}).click();await(await promise).saveAs(path);return JSON.parse(execFileSync('exiftool',['-j','-n','-G1',path]))[0];}
await input('/tmp/editexif-full/16pro_gsmarena_1101.jpg');
await page.getByLabel('Capture date').fill('2026-07-07T09:12');await page.getByLabel('Timezone',{exact:true}).fill('America/New_York');
let meta=await output('artifacts/real.heic');assert.equal(meta['ExifIFD:DateTimeOriginal'],'2026:07:07 09:12:00');assert.equal(meta['ExifIFD:OffsetTimeOriginal'],'-04:00');assert.equal(meta['ExifIFD:ExifImageWidth'],4032);assert.equal(meta['ExifIFD:ExifImageHeight'],3024);assert.equal(execFileSync('exiftool',['-s3','-Software','artifacts/real.heic'],{encoding:'utf8'}).trim(),'18.0');
assert(!Object.keys(meta).some(k=>/^(XMP|IPTC|Photoshop|Apple|MakerNotes|JUMBF|C2PA|GPS):/.test(k)));
await input('artifacts/real.heic');await page.getByLabel('Output format').selectOption('jpeg');
await page.getByLabel('Include GPS').check();await page.getByLabel('Latitude',{exact:true}).fill('-33.8688');await page.getByLabel('Longitude',{exact:true}).fill('151.2093');await page.getByLabel('Altitude / m').fill('-4');await page.getByRole('button',{name:"Use location's timezone"}).click();
meta=await output('artifacts/heic-roundtrip.jpg');assert.equal(meta['ExifIFD:OffsetTimeOriginal'],'+10:00');assert.equal(meta['GPS:GPSLatitudeRef'],'S');assert.equal(meta['GPS:GPSAltitudeRef'],1);assert.equal(meta['ExifIFD:ExifImageWidth'],4032);
await page.getByLabel('Reference camera photo').setInputFiles('/tmp/editexif-full/15pro_tele.jpg');meta=await output('artifacts/reference.jpg');assert.equal(meta['IFD0:Model'],'iPhone 15 Pro');assert.equal(meta['ExifIFD:FocalLength'],9);assert.equal(meta['ExifIFD:FocalLengthIn35mmFormat'],77);
await page.getByLabel('Choose photo',{exact:true}).setInputFiles('/tmp/editexif-picsart.png');await ready();meta=await output('artifacts/png-clean.jpg');assert(!Object.keys(meta).some(k=>/^(XMP|IPTC|Photoshop|JUMBF|C2PA):/.test(k)));assert(!Object.values(meta).some(v=>String(v).includes('Picsart')));
await page.screenshot({path:'artifacts/desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/mobile.png',fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
assert.deepEqual(errors,[]);assert(!requests.some(r=>r.method!=='GET'||(/^(https?:)/.test(r.url)&&!r.url.startsWith('http://localhost:48371'))));
await writeFile('artifacts/browser-results.json',JSON.stringify({passed:true,requests,errors,meta},null,2));await browser.close();console.log('Real 12MP JPEG to HEIC, HEIC to JPEG, GPS/date, reference lens, dirty PNG stripping, mobile overflow and no image uploads passed.');
