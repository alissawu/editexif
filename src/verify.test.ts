import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyExport} from './verify';
test('readback validates camera and requested time',()=>{
 verifyExport({'IFD0:Model':'iPhone 15','ExifIFD:DateTimeOriginal':'2026:07:07 09:12:00','ExifIFD:FocalLength':5.10000001},{'EXIF:Model':'iPhone 15','EXIF:DateTimeOriginal':'2026:07:07 09:12:00','EXIF:FocalLength':5.1});
 assert.throws(()=>verifyExport({'IFD0:Model':'Other'},{'EXIF:Model':'iPhone 15'}),/Model/);
 assert.throws(()=>verifyExport({}, {'EXIF:OffsetTimeOriginal':'-04:00'}),/OffsetTime/);
});
test('unexpected editor or location metadata fails closed',()=>{
 assert.throws(()=>verifyExport({'XMP-xmp:CreatorTool':'Picsart'},{}),/private/);
 assert.throws(()=>verifyExport({'GPS:GPSLatitude':1},{}),/location/);
});

test('full Apple payload and preserved input identity verify',async()=>{
 const {verifyAppleMakerNotes}=await import('./verify');
 const source={'Apple:MakerNoteVersion':15,'Apple:Apple_0x00ff':'opaque','Apple:PhotoIdentifier':'reference'};
 const ids={'Apple:PhotoIdentifier':'input'};
 verifyAppleMakerNotes({...source,...ids},source,ids,ids);
 assert.throws(()=>verifyAppleMakerNotes({...source,...ids,'Apple:Apple_0x00ff':'lost'},source,ids,ids),/survive/);
 assert.throws(()=>verifyAppleMakerNotes(source,source,{'Apple:PhotoIdentifier':'reference'},{}),/reused/);
});

test('lossless HDR readback permits only unchanged rendering metadata',()=>{
 const hdr={'XMP-HDRGainMap:HDRGainMapVersion':131072,'XMP-HDRGainMap:HDRGainMapHeadroom':4.5};
 verifyExport(hdr,{},false,hdr);
 assert.throws(()=>verifyExport({...hdr,'XMP-HDRGainMap:HDRGainMapHeadroom':2},{},false,hdr),/private/);
 const editor={'XMP-xmp:CreatorTool':'Editor'};
 assert.throws(()=>verifyExport(editor,{},false,editor),/private/);
});
