import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({timezoneId:'Europe/Paris'});await page.goto('http://localhost:48371');
 assert.equal(await page.getByLabel('Timezone',{exact:true}).inputValue(),'Europe/Paris');
 const zones=await page.locator('#timezones option').evaluateAll(nodes=>nodes.map(n=>n.value));
 assert.deepEqual(zones.slice(0,5),['America/Los_Angeles','America/New_York','America/Chicago','Europe/London','Asia/Tokyo']);
 for(const z of Intl.supportedValuesOf('timeZone'))assert(zones.includes(z));
 await page.getByLabel('Include GPS').check();await page.getByLabel('Latitude',{exact:true}).fill('35.6762');await page.getByLabel('Longitude',{exact:true}).fill('139.6503');
 assert.equal(await page.getByLabel('Timezone',{exact:true}).inputValue(),'Asia/Tokyo');
 await page.getByLabel('Timezone',{exact:true}).fill('UTC');assert.equal(await page.getByLabel('Timezone',{exact:true}).inputValue(),'UTC');
 await page.getByLabel('Longitude',{exact:true}).fill('139.65');assert.equal(await page.getByLabel('Timezone',{exact:true}).inputValue(),'Asia/Tokyo');
 console.log('Browser timezone default, ordered IANA search options, GPS automation and manual override pass');
}finally{await browser.close();}
