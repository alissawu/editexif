import {test} from 'node:test';
import assert from 'node:assert/strict';
import phones from '../templates/phones.json';
import {captureKeys} from './settings';
test('templates include all required models, real sources and only capture tags',()=>{
 for(const name of ['iPhone 16 Pro','iPhone 15 Pro','iPhone 15','iPhone 14','iPhone 13','Pixel 9','Galaxy S24']){
  const p=phones.find(p=>p.name===name);assert(p);
  assert(p.lenses.some(l=>l.id==='main'));assert(p.lenses.some(l=>l.id==='ultrawide'));assert(p.lenses.some(l=>l.id==='front'));
  for(const l of p.lenses){assert(l.source.startsWith('https://'));assert(l.sample.startsWith('https://'));assert(/^[a-f0-9]{64}$/.test(l.sha256));
   for(const key of Object.keys(l.tags))assert(captureKeys.has(key.split(':')[1]));
   assert.equal(typeof l.tags['EXIF:Software'],'string');assert(l.tags['EXIF:FNumber']>0);assert(l.tags['EXIF:FocalLength']>0);assert(l.tags['EXIF:FocalLengthIn35mmFormat']>0);assert(l.tags['EXIF:ExposureTime']>0);assert(l.tags['EXIF:ISO']>0);
  }
 }
});
