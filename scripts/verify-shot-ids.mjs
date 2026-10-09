import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({acceptDownloads:true});page.on('pageerror',console.error);
try{
 await page.goto('http://localhost:48371');
 async function ready(){await page.waitForFunction(()=>!document.querySelector('fieldset').disabled,null,{timeout:360000});assert.deepEqual(await page.locator('.error').allTextContents(),[]);}
 await page.getByLabel('Choose photo',{exact:true}).setInputFiles('/tmp/editexif-idtest/a.jpg');await ready();
 await page.getByLabel('Output format').selectOption('jpeg');
 const original=JSON.parse(execFileSync('exiftool',['-j','-n','-u','-G1','/tmp/editexif-idtest/a.jpg']))[0];
 for(const format of ['jpeg','heic']){
  await page.getByLabel('Output format').selectOption(format);
  await page.getByRole('button',{name:/Create photo|Regenerate photo/}).click();await ready();
  const download=page.waitForEvent('download');await page.getByRole('button',{name:/Download/}).click();const path='artifacts/ids-preserved.'+(format==='jpeg'?'jpg':'heic');await(await download).saveAs(path);
  const after=JSON.parse(execFileSync('exiftool',['-j','-n','-u','-G1',path]))[0];
  for(const key of ['Apple:ContentIdentifier','Apple:BurstUUID','Apple:PhotoIdentifier','Apple:ImageUniqueID','Apple:ImageCaptureRequestID','ExifIFD:ImageUniqueID'])assert.equal(after[key],original[key],key);
  console.log(format+' all six input IDs preserved into template with absent slots');
 }
}finally{await browser.close();}

