import {wasmUrl} from './engine-assets';
import {readHeader} from './header-metadata';
const tool=()=>import('@uswriting/exiftool');
import {verifyExport,verifyAppleMakerNotes} from './verify';

import {resolveShotIds} from './shot-ids';
import { buildTags, type Tags, type Settings } from './settings';
const localFetch = async (..._args: unknown[]) => fetch(wasmUrl);
async function read(file: File): Promise<Tags> {
 const {parseMetadata}=await tool();
 const result=await parseMetadata({name:'input.'+(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,''),data:file},{fetch:localFetch,args:['-j','-n','-G1','-u'],transform:JSON.parse});
 if(!result.success) throw Error(result.error);
 return (result.data as Tags[])[0];
}
async function decode(file:File, metadata:Tags){
 try{return await createImageBitmap(file,{imageOrientation:'from-image'});}catch{
  const heif=await import('libheif-js/libheif-wasm/libheif-bundle.mjs');const lib=await heif.default();
  const images=new lib.HeifDecoder().decode(new Uint8Array(await file.arrayBuffer()));
  if(!images.length)throw Error('This image could not be decoded. Try JPEG, PNG, WebP or a standard HEIC.');
  const image=images[0], width=image.get_width(), height=image.get_height();
  if(width*height>50_000_000){images.forEach(i=>i.free());throw Error('Use a photo under 50 megapixels.');}
  const canvas=new OffscreenCanvas(width,height),ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(width,height);
  try{await new Promise<void>((resolve,reject)=>image.display(pixels,result=>result?resolve():reject(Error('HEIC decoding failed.'))));ctx.putImageData(pixels,0,0);}finally{images.forEach(i=>i.free());}
  // libheif applies HEIF item transforms. Some inputs also use EXIF orientation; the codec already handles container rotations.
  void metadata;return createImageBitmap(canvas);
 }
}
self.onmessage=async (event:MessageEvent<{id:number;action:'inspect'|'import'|'export';file:File;reference?:File;makerNotes?:{path:string;sha256:string};base:Tags;settings:Settings}>)=>{
 const {id,action,file,reference,makerNotes,base,settings}=event.data;
 try{
  if(file.size>60*1024*1024) throw Error('Use a photo under 60 MB.');
  self.postMessage({id,status:'Reading metadata locally…'});
  const before=action==='export'?await read(file):await readHeader(file);
  const mw=Number(before['File:ImageWidth']??before['ExifIFD:ExifImageWidth']), mh=Number(before['File:ImageHeight']??before['ExifIFD:ExifImageHeight']);
  if(mw*mh>50_000_000)throw Error('Use a photo under 50 megapixels to keep browser memory safe.');
  if(action==='import'){self.postMessage({id,result:{before}});return;}
  if(action==='inspect'){
   self.postMessage({id,result:{before}});return;
  }
  if(reference && reference.size>60*1024*1024)throw Error('Reference must be under 60 MB.');
  const referenceMeta=reference?await read(reference):undefined;
  const chosen=base;
  let makerSource:Blob|undefined, makerMeta:Tags|undefined;
  if(chosen['EXIF:Make']==='Apple'){
   if(reference){
    if(!referenceMeta?.['Apple:MakerNoteVersion'])throw Error('Apple reference has no intact MakerNotes. Choose an original camera photo or remove the reference.');
    makerSource=reference;makerMeta=referenceMeta;
   }else if(makerNotes){
    const res=await fetch(makerNotes.path);if(!res.ok)throw Error('Could not load sample MakerNotes.');
    makerSource=await res.blob();
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await makerSource.arrayBuffer()))).map(n=>n.toString(16).padStart(2,'0')).join('');
    if(hash!==makerNotes.sha256)throw Error('Sample MakerNotes failed integrity check.');
    makerMeta=await read(new File([makerSource],'sample.exif'));
    if(makerMeta['IFD0:Model']!==chosen['EXIF:Model'])throw Error('Sample MakerNotes model mismatch.');
   }else throw Error('This Apple template has no sourced MakerNotes.');
  }
  if(!chosen['EXIF:Model'])throw Error('Reference has no camera model in standard EXIF. Use a camera original or remove the reference.');
  buildTags(chosen,settings,1,1);
  const sameFormat=(settings.format==='jpeg'&&before['File:FileType']==='JPEG')||(settings.format==='heic'&&before['File:FileType']==='HEIC');
  let width=Number(before['File:ImageWidth']??before['ExifIFD:ExifImageWidth']);
  let height=Number(before['File:ImageHeight']??before['ExifIFD:ExifImageHeight']);
  const lossless=sameFormat&&Number.isSafeInteger(width)&&Number.isSafeInteger(height)&&width>0&&height>0;
  let clean:Blob,preview:Blob|undefined;
  if(lossless){
   self.postMessage({id,status:'Keeping original encoded pixels…'});
   clean=file;
  }else{
  self.postMessage({id,status:'Re-encoding clean pixels…'});
  const bitmap=await decode(file,before); width=bitmap.width;height=bitmap.height;
  if(width*height>50_000_000){bitmap.close();throw Error('Use a photo under 50 megapixels to keep browser memory safe.');}
  const canvas=new OffscreenCanvas(width,height);const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
  ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(bitmap,0,0);bitmap.close();
  preview=await canvas.convertToBlob({type:'image/jpeg',quality:0.85});

  if(settings.format==='heic'){
   const heif=await import('elheif');await heif.ensureInitialized();const rgba=ctx.getImageData(0,0,width,height);const result=heif.jsEncodeImage(new Uint8Array(rgba.data.buffer),width,height);
   if(result.err||!result.data.length)throw Error(result.err||'HEIC encoder failed. Try JPEG.');
   clean=new Blob([new Uint8Array(result.data)],{type:'image/heic'});
  }else clean=await canvas.convertToBlob({type:'image/jpeg',quality:0.94});
  }
  const tags=buildTags(chosen,settings,width,height);
  if(lossless){tags['EXIF:Orientation']=Number(before['IFD0:Orientation']??1);tags['EXIF:ColorSpace']=Number(before['ExifIFD:ColorSpace']??1);}
  const shotIds=resolveShotIds(before,makerMeta??{});
  tags['EXIF:ImageUniqueID']=shotIds['ExifIFD:ImageUniqueID'];
  self.postMessage({id,status:'Writing EXIF and checking output…'});
  const {writeMetadata}=await tool();
  const output=await writeMetadata({name:'clean.'+(settings.format==='heic'?'heic':'jpg'),data:clean},tags,{fetch:localFetch,args:['-all=','-tagsFromFile','@','-ICC_Profile','-n','-q','-q']});
  if(!output.success)throw Error(output.error);
  let blob=new Blob([output.data],{type:settings.format==='heic'?'image/heic':'image/jpeg'});
  if(makerSource&&makerMeta){const {copyAppleMakerNotes}=await import('./makernotes');const copied=await copyAppleMakerNotes(blob,makerSource,settings.format,shotIds);blob=copied.blob;}
  const after=await read(new File([blob],'output.'+(settings.format==='heic'?'heic':'jpg')));
  for(const key of ['ExifIFD:ExifImageWidth','ExifIFD:ExifImageHeight'])if(Number(after[key])!==(key.endsWith('Width')?width:height))throw Error('Output dimensions did not verify. No download created.');
  const preservedHdr:Tags={};
  if(lossless&&settings.format==='heic'){
   for(const k of ['XMP-HDRGainMap:HDRGainMapVersion','XMP-HDRGainMap:HDRGainMapHeadroom','XMP-x:XMPToolkit'])if(before[k]!==undefined)preservedHdr[k]=before[k];
  }
  verifyExport(after,tags,!!makerSource,preservedHdr);
  if(makerMeta)verifyAppleMakerNotes(after,makerMeta,shotIds,before);
  self.postMessage({id,result:{blob,preview,before,after,width,height,tags}});
 }catch(error){self.postMessage({id,error:error instanceof Error?error.message:String(error)});}
};
