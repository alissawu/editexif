export type Tags = Record<string, string | number>;
export type Settings = { date: string; timezone: string; software: string; filename: string; format: 'heic' | 'jpeg'; location: boolean; latitude: string; longitude: string; altitude: string };
export function randomFilename() { return 'IMG_' + String(crypto.getRandomValues(new Uint32Array(1))[0] % 10000).padStart(4, '0'); }
export function localDate() { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19); }
// Only standard capture tags are copied. Never propagate identity, GPS, maker notes, signed manifests or editor history.
export const captureKeys = new Set(['Make','Model','Software','LensModel','LensMake','FocalLength','FocalLengthIn35mmFormat','FNumber','ExposureTime','ISO','ExposureProgram','MeteringMode','Flash','WhiteBalance','ExposureCompensation','SceneCaptureType','SensingMethod','XResolution','YResolution','ResolutionUnit']);
export function referenceTags(metadata: Tags): Tags {
 const result: Tags = {};
 for (const [key,value] of Object.entries(metadata)) { const [group,name] = key.split(':'); if (['IFD0','ExifIFD','IFD1'].includes(group) && captureKeys.has(name) && group !== 'IFD1') result['EXIF:' + name] = value; }
 return result;
}
export function offsetFor(date: string, timezone: string) {
 if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}(:[0-9]{2})?$/.test(date)) throw Error('Choose a valid capture date.');
 const wall = Date.parse(date + 'Z');
 if(!Number.isFinite(wall) || new Date(wall).toISOString().slice(0,19)!==(date.length===16?date+':00':date))throw Error('Choose a valid calendar date.');
 const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23' });
 const partsAt = (ms: number) => { const parts=Object.fromEntries(formatter.formatToParts(ms).map(p=>[p.type,p.value])); return Date.UTC(+parts.year,+parts.month-1,+parts.day,+parts.hour,+parts.minute,+parts.second); };
 let instant=wall;
 for(let i=0;i<4;i++) instant = wall - (partsAt(instant) - instant);
 if(partsAt(instant) !== wall) throw Error('This local time falls in a daylight-saving gap. Choose another time.');
 const minutes=(wall-instant)/60000;
 const sign=minutes<0?'-':'+';const abs=Math.abs(minutes);
 return { offset: sign+String(Math.floor(abs/60)).padStart(2,'0')+':'+String(abs%60).padStart(2,'0'), instant };
}
export function buildTags(base: Tags, s: Settings, width: number, height: number): Tags {
 const {offset, instant}=offsetFor(s.date,s.timezone);
 const date=s.date.replace('T',' ').replace(/-/g,':')+(s.date.length===16?':00':'');
 const tags: Tags={...base,'EXIF:ExifVersion':'0232','EXIF:FlashpixVersion':'0100','EXIF:Orientation':1,'EXIF:ExifImageWidth':width,'EXIF:ExifImageHeight':height,'EXIF:ColorSpace':1,'EXIF:DateTimeOriginal':date,'EXIF:CreateDate':date,'EXIF:ModifyDate':date,'EXIF:OffsetTime':offset,'EXIF:OffsetTimeOriginal':offset,'EXIF:OffsetTimeDigitized':offset};
 delete tags['EXIF:Software']; if(s.software.trim()) tags['EXIF:Software']=s.software.trim();
 if(!/^[a-zA-Z0-9_ -]{1,80}$/.test(s.filename)) throw Error('Use a filename with letters, numbers, spaces, underscores or hyphens.');
 if(s.location){
  const lat=Number(s.latitude),lon=Number(s.longitude);
  if(!s.latitude.trim()||!s.longitude.trim()||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180) throw Error('Enter valid latitude and longitude.');
  tags['EXIF:GPSLatitude']=Math.abs(lat);tags['EXIF:GPSLatitudeRef']=lat<0?'S':'N';tags['EXIF:GPSLongitude']=Math.abs(lon);tags['EXIF:GPSLongitudeRef']=lon<0?'W':'E';
  const utc=new Date(instant);tags['EXIF:GPSDateStamp']=utc.toISOString().slice(0,10).replace(/-/g,':');tags['EXIF:GPSTimeStamp']=utc.toISOString().slice(11,19);
  if(s.altitude.trim()){const alt=Number(s.altitude);if(!Number.isFinite(alt))throw Error('Altitude must be a number.');tags['EXIF:GPSAltitude']=Math.abs(alt);tags['EXIF:GPSAltitudeRef']=alt<0?1:0;}
 }
 return tags;
}
