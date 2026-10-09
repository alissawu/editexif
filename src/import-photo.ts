import {referenceTags,type Tags,type Settings,offsetFor} from './settings';
import {defaultSoftware} from './software';
import {zoneForCoordinates} from './timezones';
export type Profile={id:string;name:string;platform:string;lenses:{id:string;name:string;source:string;tags:Tags;makerNotes?:{path:string;sha256:string}}[]};
export function importPhoto(metadata:Tags,filename:string,profiles:Profile[],fallback:Settings){
 const missing:string[]=[];
 const model=String(metadata['IFD0:Model']??'');
 let phone=profiles.findIndex(p=>p.name===model);if(phone<0)phone=0;
 if(!model)missing.push('camera model');
 const lensName=String(metadata['ExifIFD:LensModel']??'');
 let lens=profiles[phone].lenses.findIndex(l=>l.tags['EXIF:LensModel']===lensName);if(lens<0)lens=0;
 if(!lensName)missing.push('lens');
 const catalog=profiles.map(p=>({...p,lenses:[...p.lenses]}));
 const tags={...catalog[phone].lenses[lens].tags,...referenceTags(metadata)};
 if(model&&profiles[phone].name!==model){
  phone=catalog.length;lens=0;catalog.push({id:'imported',name:model,platform:metadata['IFD0:Make']==='Apple'?'ios':'android',lenses:[{id:'imported',name:lensName||'Imported lens',source:'',tags}]});
 }else if(lensName&&catalog[phone].lenses[lens].tags['EXIF:LensModel']!==lensName){
  lens=catalog[phone].lenses.length;catalog[phone].lenses.push({id:'imported',name:lensName,source:'',tags,makerNotes:catalog[phone].lenses[0].makerNotes});
 }else catalog[phone].lenses[lens]={...catalog[phone].lenses[lens],tags};
 const dateTag=metadata['ExifIFD:DateTimeOriginal']??metadata['ExifIFD:CreateDate'];
 const date=typeof dateTag==='string'?dateTag.replace(/^([0-9]{4}):([0-9]{2}):([0-9]{2}) /,'$1-$2-$3T').slice(0,19):fallback.date;
 let validDate=date;try{offsetFor(date,'UTC');}catch{validDate=fallback.date;}
 if(!dateTag||date!==validDate)missing.push('capture date/time');
 const coordinate=(key:string,ref:string,negative:string)=>{
  const value=metadata['GPS:'+key];if(value===undefined||!Number.isFinite(Number(value)))return '';
  return String(Math.abs(Number(value))*(metadata['GPS:'+ref]===negative?-1:1));
 };
 const latitude=coordinate('GPSLatitude','GPSLatitudeRef','S'),longitude=coordinate('GPSLongitude','GPSLongitudeRef','W');
 const gpsZone=zoneForCoordinates(latitude,longitude);const location=!!gpsZone;
 if(!location)missing.push('GPS coordinates');
 let timezone=gpsZone??fallback.timezone;
 const offset=metadata['ExifIFD:OffsetTimeOriginal']??metadata['ExifIFD:OffsetTime'];
 // EXIF stores an offset, not an IANA location. Keep an exact fixed offset if GPS is absent.
 if(!gpsZone&&typeof offset==='string'&&/^[+-][0-9]{2}:[0-9]{2}$/.test(offset))timezone=offset;
 if(!gpsZone&&!offset)missing.push('timezone');
 const software=metadata['IFD0:Software'];if(software===undefined)missing.push('camera software');
 const altitude=metadata['GPS:GPSAltitude']===undefined?'':String(Number(metadata['GPS:GPSAltitude'])*(Number(metadata['GPS:GPSAltitudeRef'])===1?-1:1));
 if(location&&!altitude)missing.push('GPS altitude');
 const hasMakerNotes=metadata['Apple:MakerNoteVersion']!==undefined;
 if(tags['EXIF:Make']==='Apple'&&!hasMakerNotes)missing.push('Apple MakerNotes');
 const settings:Settings={...fallback,date:validDate,timezone,software:software===undefined?defaultSoftware(catalog[phone].name,validDate,String(tags['EXIF:Software']??'')):String(software),location,latitude:location?latitude:'',longitude:location?longitude:'',altitude:location?altitude:'',filename:filename.replace(/\.[^.]*$/,'').replace(/[^a-zA-Z0-9_ -]/g,'_').slice(0,80)||fallback.filename,format:String(metadata['File:FileType']).match(/HEIC|HEIF/)?'heic':'jpeg'};
 return {catalog,phone,lens,settings,missing,hasMakerNotes};
}

