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

