import {MemoryFileSystem,ZeroPerl} from '@6over3/zeroperl-ts';
import type {Tags} from './settings';
// A separate trusted CLI runtime lets ExifTool resolve/rewrite complete MakerNote
// offsets using -tagsFromFile, rather than assembling a lossy known-tag list.
// Uploaded bytes are mounted as data under fixed paths, never as scripts/config.
export async function copyAppleMakerNotes(output:Blob,reference:Blob,format:'heic'|'jpeg',ids:Tags){
 const fs=new MemoryFileSystem({'/':''});
 const cli=await fetch('/exiftool.pl');if(!cli.ok)throw Error('Could not load local MakerNotes engine.');
 // ExifTool normally forbids creating absent MakerNote slots. Relax only
 // the five documented Apple shot-ID strings in a trusted static config.
 // Never accept uploaded Perl/config or modify unknown vendor tag definitions.
 fs.addFile('/shot-ids.config',"require Image::ExifTool::Apple; for my $id (0x0b,0x11,0x15,0x20,0x2b) { $Image::ExifTool::Apple::Main{$id}{Permanent}=0; } 1;");
 fs.addFile('/exiftool',await cli.text());fs.addFile('/reference',reference);fs.addFile('/image.'+(format==='heic'?'heic':'jpg'),output);
 let errors='';
 const perl=await ZeroPerl.create({fileSystem:fs,fetch:async()=>fetch('/zeroperl.wasm'),stdout:()=>{},stderr:data=>{errors+=typeof data==='string'?data:new TextDecoder().decode(data);}});
 try{
  const args=['-n','-q','-tagsFromFile','/reference','-MakerNotes','-o','/copied','/image.'+(format==='heic'?'heic':'jpg')];
  const copied=await perl.runFile('/exiftool',args);perl.flush();
  if(!copied.success||copied.exitCode!==0||errors.trim())throw Error('MakerNotes copy failed. '+errors.trim());
  await perl.reset();errors='';
  const result=await perl.runFile('/exiftool',['-config','/shot-ids.config','-n','-q',...Object.entries(ids).map(([k,v])=>'-'+k+'='+v),'-o','/result','/copied']);perl.flush();
  if(!result.success||result.exitCode!==0||errors.trim())throw Error('MakerNotes copy failed. '+errors.trim());
  const node=fs.lookup('/result');if(!node||node.type!=='file')throw Error('MakerNotes output missing.');
  const data=node.content instanceof Blob?await node.content.arrayBuffer():new Uint8Array(node.content).buffer;
  return {blob:new Blob([data],{type:output.type}),ids};
 }finally{perl.dispose();}
}

