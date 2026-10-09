import type {Tags} from './settings';
export const shotIdNames=['ContentIdentifier','BurstUUID','ImageUniqueID','ImageCaptureRequestID','PhotoIdentifier'];
const hasId=(value:unknown):value is string=>typeof value==='string'&&value.trim().length>0;
// Input identity wins. Template/reference identity must never leak into a new shot.
export function resolveShotIds(input:Tags,source:Tags):Tags {
 const ids:Tags={};
 for(const name of shotIdNames){
  const key='Apple:'+name;
  const inputValue=input[key]??(name==='ContentIdentifier'?input['Keys:ContentIdentifier']:undefined);
  if(hasId(inputValue))ids[key]=inputValue;
  else if(hasId(source[key]))ids[key]=crypto.randomUUID().toUpperCase();
 }
 const exifId=input['ExifIFD:ImageUniqueID']??input['XMP-exif:ImageUniqueID'];
 ids['ExifIFD:ImageUniqueID']=hasId(exifId)?exifId:crypto.randomUUID().replace(/-/g,'').toUpperCase();
 return ids;
}

