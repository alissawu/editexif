import type {Tags} from './settings';
// Verify exact settings against EXIF readback, not filename or container-derived tags.
export function verifyExport(after:Tags,expected:Tags,allowApple=false,preservedHdr:Tags={}){
 const fields=['ImageUniqueID','Make','Model','LensModel','DateTimeOriginal','CreateDate','ModifyDate','OffsetTime','OffsetTimeOriginal','OffsetTimeDigitized','Orientation','ExifImageWidth','ExifImageHeight','FocalLength','FocalLengthIn35mmFormat','FNumber','ISO','ExposureTime'];
 for(const name of fields){
  const wanted=expected['EXIF:'+name];if(wanted===undefined)continue;
  const actual=after[(name==='Make'||name==='Model'||name==='ModifyDate'||name==='Orientation'?'IFD0:':'ExifIFD:')+name];
  const equal=typeof wanted==='number'?Number.isFinite(Number(actual))&&Math.abs(Number(actual)-wanted)<=Math.max(1e-9,Math.abs(wanted)*1e-6):String(actual)===String(wanted);
  if(!equal)throw Error('Output '+name+' did not verify. No download created.');
 }
 if(Object.keys(after).some(k=>/^(XMP[^:]*|IPTC|Photoshop|JUMBF|C2PA|MakerNotes):/.test(k)&&!(['XMP-HDRGainMap:HDRGainMapVersion','XMP-HDRGainMap:HDRGainMapHeadroom','XMP-x:XMPToolkit'].includes(k)&&preservedHdr[k]!==undefined&&after[k]===preservedHdr[k])))throw Error('Unexpected private/editor metadata in output. No download created.');
 if(!allowApple&&Object.keys(after).some(k=>k.startsWith('Apple:')))throw Error('Unexpected Apple MakerNotes.');
 if(expected['EXIF:GPSLatitude']===undefined&&Object.keys(after).some(k=>k.startsWith('GPS:')))throw Error('Unexpected location metadata in output. No download created.');
}

export function verifyAppleMakerNotes(after:Tags,source:Tags,ids:Tags,input:Tags={}){
 if(after['Apple:MakerNoteVersion']!==source['Apple:MakerNoteVersion'])throw Error('MakerNotes version did not verify.');
 for(const [key,value] of Object.entries(source)){
  if(!key.startsWith('Apple:')||ids[key]!==undefined)continue;
  if(JSON.stringify(after[key])!==JSON.stringify(value))throw Error('MakerNotes '+key+' did not survive copying.');
 }
 for(const [key,value] of Object.entries(ids)){
  if(after[key]!==value)throw Error('New per-shot identifier did not verify: '+key);
  if(input[key]!==value&&after[key]===source[key])throw Error('Reference shot identifier was reused.');
 }
}
