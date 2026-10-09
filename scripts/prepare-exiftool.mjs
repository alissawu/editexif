// Extract the CLI literal from the pinned installed dependency, never from uploads.
import {readFile,writeFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const pkg=JSON.parse(await readFile('node_modules/@uswriting/exiftool/package.json','utf8'));
if(pkg.version!=='1.0.9')throw Error('Review CLI extraction after upgrading ExifTool');
const source=await readFile('node_modules/@uswriting/exiftool/dist/esm/index.js','utf8');
const tick=String.fromCharCode(96);
const start=source.indexOf('var y='+tick)+6;
if(start===5)throw Error('CLI string not found');
let end=start+1;
for(;end<source.length;end++){if(source.charCodeAt(end)===92){end++;continue;}if(source[end]===tick)break;}
const literal=source.slice(start,end+1);
if(literal.split(String.fromCharCode(92)+'$'+'{').join('').includes('$'+'{'))throw Error('Unexpected executable interpolation');
const cli=runInNewContext(literal,{}, {timeout:1000});
if(!cli.startsWith('use strict;')||!cli.includes('13.42'))throw Error('Unexpected CLI payload');
await writeFile('public/exiftool.pl',cli);
console.log('Prepared pinned ExifTool CLI asset');

const {mkdir,readdir,unlink}=await import('node:fs/promises');
const {createHash}=await import('node:crypto');
await mkdir('public/engine',{recursive:true});
for(const name of await readdir('public/engine'))await unlink('public/engine/'+name);
const assets={};
for(const [key,name,data] of [['wasmUrl','zeroperl',await readFile('public/zeroperl.wasm')],['cliUrl','exiftool',Buffer.from(cli)]]){
 const suffix=key==='wasmUrl'?'.wasm':'.pl';const hash=createHash('sha256').update(data).digest('hex').slice(0,16);const path='/engine/'+name+'-'+hash+suffix;
 await writeFile('public'+path,data);assets[key]=path;
}
await writeFile('src/engine-assets.ts',Object.entries(assets).map(([key,path])=>'export const '+key+'='+JSON.stringify(path)+';').join('\n'));
