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
