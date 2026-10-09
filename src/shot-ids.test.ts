import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveShotIds} from './shot-ids';
import {verifyAppleMakerNotes} from './verify';
test('preserves input ids ahead of cloned reference ids',()=>{
 const input={'Apple:PhotoIdentifier':'INPUT','Apple:ContentIdentifier':'LIVE','ExifIFD:ImageUniqueID':'a1b2'};
 const ids=resolveShotIds(input,{'Apple:PhotoIdentifier':'REFERENCE','Apple:ContentIdentifier':'REFERENCE-LIVE'});
 assert.equal(ids['Apple:PhotoIdentifier'],'INPUT');assert.equal(ids['Apple:ContentIdentifier'],'LIVE');assert.equal(ids['ExifIFD:ImageUniqueID'],'a1b2');
});
test('regenerates only missing ids and does not invent absent Apple slots',()=>{
 const source={'Apple:PhotoIdentifier':'REFERENCE','Apple:BurstUUID':'BURST'};
 const a=resolveShotIds({},source),b=resolveShotIds({},source);
 for(const key of Object.keys(a)){assert.notEqual(a[key],b[key]);assert.notEqual(a[key],source[key as keyof typeof source]);}
 assert.equal(a['Apple:ImageUniqueID'],undefined);assert.match(String(a['ExifIFD:ImageUniqueID']),/^[A-F0-9]{32}$/);
});
test('empty ids are missing; already-matching input and reference is valid',()=>{
 const source={'Apple:MakerNoteVersion':1,'Apple:PhotoIdentifier':'INPUT'};
 const input={'Apple:PhotoIdentifier':'INPUT','ExifIFD:ImageUniqueID':''};const ids=resolveShotIds(input,source);
 assert.doesNotThrow(()=>verifyAppleMakerNotes({...source,...ids},source,ids,input));
 assert.throws(()=>verifyAppleMakerNotes(source,source,ids,{}));
});


test('unknown Apple payload changes still fail closed',()=>{
 const source={'Apple:MakerNoteVersion':15,'Apple:Apple_0x0030':0.42,'Apple:PhotoIdentifier':'REF'};
 const ids=resolveShotIds({},source);
 assert.doesNotThrow(()=>verifyAppleMakerNotes({...source,...ids},source,ids));
 assert.throws(()=>verifyAppleMakerNotes({...source,...ids,'Apple:Apple_0x0030':0.5},source,ids));
});


test('standard XMP and HEIC Keys input identities survive without copying history',()=>{
 const ids=resolveShotIds({'Keys:ContentIdentifier':'LIVE-INPUT','XMP-exif:ImageUniqueID':'EXIF-INPUT'},{'Apple:ContentIdentifier':'REF'});
 assert.equal(ids['Apple:ContentIdentifier'],'LIVE-INPUT');assert.equal(ids['ExifIFD:ImageUniqueID'],'EXIF-INPUT');
 assert(!Object.keys(ids).some(k=>k.startsWith('XMP')||k.startsWith('Keys:')));
});

