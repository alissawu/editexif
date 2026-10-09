import test from 'node:test';
import assert from 'node:assert/strict';
import {commonZones,timezoneOptions,zoneForCoordinates,withLocationTimezone} from './timezones';
import {offsetFor,type Settings} from './settings';
test('timezone options cover browser Intl and prioritize common zones',()=>{
 const all=timezoneOptions('Asia/Kathmandu');assert.deepEqual(all.slice(0,5),commonZones);
 for(const zone of Intl.supportedValuesOf('timeZone'))assert(all.includes(zone));
 assert(all.includes('Asia/Kathmandu'));assert(all.includes('UTC'));assert.equal(new Set(all).size,all.length);
});
test('GPS auto-picks IANA timezone only for valid coordinates',()=>{
 assert.equal(zoneForCoordinates('40.7128','-74.0060'),'America/New_York');
 assert.equal(zoneForCoordinates('35.6762','139.6503'),'Asia/Tokyo');
 assert.equal(zoneForCoordinates('','0'),undefined);assert.equal(zoneForCoordinates('91','0'),undefined);
 const s={location:true,latitude:'-33.8688',longitude:'151.2093',timezone:'UTC'} as Settings;
 assert.equal(withLocationTimezone(s).timezone,'Australia/Sydney');assert.equal(withLocationTimezone({...s,location:false}).timezone,'UTC');
});
test('common-zone winter/summer offsets come from capture date',()=>{
 for(const [zone,winter,summer] of [['America/Los_Angeles','-08:00','-07:00'],['America/Chicago','-06:00','-05:00'],['Europe/London','+00:00','+01:00'],['Asia/Tokyo','+09:00','+09:00']]){
  assert.equal(offsetFor('2026-01-15T12:00',zone).offset,winter);assert.equal(offsetFor('2026-07-15T12:00',zone).offset,summer);
 }
});

