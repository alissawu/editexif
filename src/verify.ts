import type {Tags} from './settings';
// Verify exact settings against EXIF readback, not filename or container-derived tags.
export function verifyExport(after:Tags,expected:Tags){
 const fields=['Make','Model','LensModel','DateTimeOriginal','CreateDate','ModifyDate','OffsetTime','OffsetTimeOriginal','OffsetTimeDigitized','Orientation','ExifImageWidth','ExifImageHeight','FocalLength','FocalLengthIn35mmFormat','FNumber','ISO','ExposureTime'];
 for(const name of fields){
  const wanted=expected['EXIF:'+name];if(wanted===undefined)continue;
  const actual=after[(name==='Make'||name==='Model'||name==='ModifyDate'||name==='Orientation'?'IFD0:':'ExifIFD:')+name];
  const equal=typeof wanted==='number'?Number.isFinite(Number(actual))&&Math.abs(Number(actual)-wanted)<=Math.max(1e-9,Math.abs(wanted)*1e-6):String(actual)===String(wanted);
  if(!equal)throw Error('Output '+name+' did not verify. No download created.');
 }
 if(Object.keys(after).some(k=>/^(XMP[^:]*|IPTC|Photoshop|JUMBF|C2PA|Apple|MakerNotes):/.test(k)))throw Error('Unexpected private/editor metadata in output. No download created.');
 if(expected['EXIF:GPSLatitude']===undefined&&Object.keys(after).some(k=>k.startsWith('GPS:')))throw Error('Unexpected location metadata in output. No download created.');
}
