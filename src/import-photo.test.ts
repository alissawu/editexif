import test from 'node:test';import assert from 'node:assert/strict';
import profiles from '../templates/phones.json';import {importPhoto} from './import-photo';import {offsetFor,type Settings} from './settings';
const fallback:Settings={date:'2026-10-08T12:00',timezone:'America/New_York',software:'26.7.1',filename:'IMG_0001',format:'heic',location:false,latitude:'',longitude:'',altitude:''};
test('complete camera import maps every available setting including custom lens',()=>{
 const r=importPhoto({'IFD0:Make':'Apple','IFD0:Model':'iPhone 16 Pro','IFD0:Software':'26.6.2','ExifIFD:LensModel':'custom lens','ExifIFD:DateTimeOriginal':'2026:10:08 15:57:52','GPS:GPSLatitude':40.72,'GPS:GPSLatitudeRef':'N','GPS:GPSLongitude':73.99,'GPS:GPSLongitudeRef':'W','GPS:GPSAltitude':3,'GPS:GPSAltitudeRef':1,'File:FileType':'HEIC','Apple:MakerNoteVersion':17},'IMG_9145.heic',profiles,fallback);
 assert.equal(r.catalog[r.phone].lenses[r.lens].tags['EXIF:LensModel'],'custom lens');assert.equal(r.settings.date,'2026-10-08T15:57:52');assert.equal(r.settings.software,'26.6.2');assert.equal(r.settings.timezone,'America/New_York');assert.equal(r.settings.longitude,'-73.99');assert.equal(r.settings.altitude,'-3');assert.equal(r.settings.filename,'IMG_9145');assert.equal(r.settings.format,'heic');assert.deepEqual(r.missing,[]);assert(r.hasMakerNotes);
});
test('stripped picker output reports missing fields and never invents GPS',()=>{
 const r=importPhoto({'File:FileType':'JPEG'},'converted.jpeg',profiles,fallback);
 for(const key of ['camera model','lens','capture date/time','timezone','GPS coordinates','camera software','Apple MakerNotes'])assert(r.missing.includes(key));
 assert.equal(r.settings.location,false);assert.equal(r.settings.latitude,'');assert.equal(r.settings.software,'26.7.1');assert.equal(r.settings.date,fallback.date);assert.equal(r.hasMakerNotes,false);
});
test('offset-only EXIF preserves exact timezone without inventing IANA identity',()=>{
 const r=importPhoto({'ExifIFD:DateTimeOriginal':'2026:10:08 15:57:52','ExifIFD:OffsetTimeOriginal':'+05:30'},'x.jpg',profiles,fallback);
 assert.equal(r.settings.timezone,'+05:30');assert.equal(offsetFor(r.settings.date,r.settings.timezone).offset,'+05:30');
});
test('unsupported camera is still editable with imported capture tags',()=>{
 const r=importPhoto({'IFD0:Make':'Nikon','IFD0:Model':'Z 6','ExifIFD:LensModel':'50 mm'},'x.jpg',profiles,fallback);
 assert.equal(r.catalog[r.phone].name,'Z 6');assert.equal(r.catalog[r.phone].lenses[0].tags['EXIF:Make'],'Nikon');
});

