import { parseMetadata, writeMetadata } from '@uswriting/exiftool';
import {verifyExport} from './verify';
import { buildTags, referenceTags, type Tags, type Settings } from './settings';
const localFetch = async (..._args: unknown[]) => fetch('/zeroperl.wasm');
async function read(file: File): Promise<Tags> {
 const result=await parseMetadata({name:'input.'+(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,''),data:file},{fetch:localFetch,args:['-j','-n','-G1'],transform:JSON.parse});
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
self.onmessage=async (event:MessageEvent<{id:number;action:'inspect'|'export';file:File;reference?:File;base:Tags;settings:Settings}>)=>{
 const {id,action,file,reference,base,settings}=event.data;
 try{
  if(file.size>60*1024*1024) throw Error('Use a photo under 60 MB.');
  self.postMessage({id,status:'Reading metadata locally…'});
  const before=await read(file);
  const mw=Number(before['File:ImageWidth']??before['ExifIFD:ExifImageWidth']), mh=Number(before['File:ImageHeight']??before['ExifIFD:ExifImageHeight']);
  if(mw*mh>50_000_000)throw Error('Use a photo under 50 megapixels to keep browser memory safe.');
  if(action==='inspect'){
   const bitmap=await decode(file,before);const scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));
   const c=new OffscreenCanvas(Math.max(1,Math.round(bitmap.width*scale)),Math.max(1,Math.round(bitmap.height*scale)));
   const ctx=c.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(bitmap,0,0,c.width,c.height);bitmap.close();
   self.postMessage({id,result:{before,preview:await c.convertToBlob({type:'image/jpeg',quality:0.85})}});return;
  }
  if(reference && reference.size>60*1024*1024)throw Error('Reference must be under 60 MB.');
  const chosen=reference?referenceTags(await read(reference)):base;
  if(!chosen['EXIF:Model'])throw Error('Reference has no camera model in standard EXIF. Use a camera original or remove the reference.');
  buildTags(chosen,settings,1,1);
  self.postMessage({id,status:'Re-encoding clean pixels…'});
  const bitmap=await decode(file,before); const {width,height}=bitmap;
  if(width*height>50_000_000){bitmap.close();throw Error('Use a photo under 50 megapixels to keep browser memory safe.');}
  const canvas=new OffscreenCanvas(width,height);const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
  ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(bitmap,0,0);bitmap.close();
  const preview=await canvas.convertToBlob({type:'image/jpeg',quality:0.85});
  let clean:Blob;
  if(settings.format==='heic'){
   const heif=await import('elheif');await heif.ensureInitialized();const rgba=ctx.getImageData(0,0,width,height);const result=heif.jsEncodeImage(new Uint8Array(rgba.data.buffer),width,height);
   if(result.err||!result.data.length)throw Error(result.err||'HEIC encoder failed. Try JPEG.');
   clean=new Blob([new Uint8Array(result.data)],{type:'image/heic'});
  }else clean=await canvas.convertToBlob({type:'image/jpeg',quality:0.94});
  const tags=buildTags(chosen,settings,width,height);
  self.postMessage({id,status:'Writing EXIF and checking output…'});
  const output=await writeMetadata({name:'clean.'+(settings.format==='heic'?'heic':'jpg'),data:clean},tags,{fetch:localFetch,args:['-n','-q','-q']});
  if(!output.success)throw Error(output.error);
  const blob=new Blob([output.data],{type:settings.format==='heic'?'image/heic':'image/jpeg'});
  const after=await read(new File([blob],'output.'+(settings.format==='heic'?'heic':'jpg')));
  for(const key of ['ExifIFD:ExifImageWidth','ExifIFD:ExifImageHeight'])if(Number(after[key])!==(key.endsWith('Width')?width:height))throw Error('Output dimensions did not verify. No download created.');
  verifyExport(after,tags);
  self.postMessage({id,result:{blob,preview,before,after,width,height,tags}});
 }catch(error){self.postMessage({id,error:error instanceof Error?error.message:String(error)});}
};
