import {parse} from 'exifr';
import type {Tags} from './settings';
// Bounded Blob reads follow metadata offsets, never decode pixels.
export async function readHeader(file:File):Promise<Tags>{
 const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
 const type=bytes[0]===255&&bytes[1]===216?'JPEG':String.fromCharCode(...bytes.slice(4,8))==='ftyp'?'HEIC':bytes[0]===137&&bytes[1]===80?'PNG':bytes[0]===82&&bytes[1]===73?'WEBP':'';
 if(!type)throw Error('Unsupported image metadata format.');
 const groups=await parse(file,{mergeOutput:false,reviveValues:false,translateValues:false,makerNote:true,chunkLimit:32});
 const tags:Tags={'File:FileType':type};
 for(const [group,prefix] of [['ifd0','IFD0'],['exif','ExifIFD'],['gps','GPS']])for(const [key,value] of Object.entries(groups?.[group]??{}))if(typeof value==='string'||typeof value==='number')tags[prefix+':'+key]=value;
 if(groups?.gps?.latitude!==undefined)tags['GPS:GPSLatitude']=Math.abs(groups.gps.latitude);
 if(groups?.gps?.longitude!==undefined)tags['GPS:GPSLongitude']=Math.abs(groups.gps.longitude);
 const note=groups?.makerNote;
 if(note instanceof Uint8Array&&new TextDecoder().decode(note.slice(0,10))==='Apple iOS\0')tags['Apple:MakerNoteVersion']='present';
 return tags;
}
