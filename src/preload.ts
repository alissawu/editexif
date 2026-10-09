import {wasmUrl,cliUrl} from './engine-assets';
let started=false;
// Warm immutable downloads only, not the 25 MB compiler. Export instantiates it.
export async function preloadEngine(){
 if(started)return;started=true;
 try{await Promise.all([wasmUrl,cliUrl].map(async url=>{const response=await fetch(url);if(!response.ok)throw Error('Preload failed');await response.arrayBuffer();}));}catch{started=false;}
}
