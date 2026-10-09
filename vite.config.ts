import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
// zeroperl 1.0.10 checks window + document and mistakes a browser worker for Node.
// Extend that check during bundling only; never edit dependencies on disk.
function workerBrowserFix(): Plugin {
 return {name:'zeroperl-browser-worker',enforce:'pre',transform(code,id){
  if(id.includes('@6over3/zeroperl-ts')&&id.endsWith('.js')){
   let patched=code.replace('typeof window<'+String.fromCharCode(34)+'u'+String.fromCharCode(34)+'&&typeof document<'+String.fromCharCode(34)+'u'+String.fromCharCode(34),'(typeof window !== "undefined" && typeof document !== "undefined") || (typeof WorkerGlobalScope !== "undefined" && globalThis instanceof WorkerGlobalScope)');
   if(patched===code)throw Error('zeroperl browser detection changed; review compatibility patch');
   // WebKit's asynchronous WASM compilation can stall in dedicated workers,
   // including mobile emulation. Keep compilation synchronous inside this
   // off-main-thread engine; no global WebAssembly APIs are monkey-patched.
   const asyncCompile='await WebAssembly.instantiate(e,t.wrapImports(a))';
   if(!patched.includes(asyncCompile))throw Error('zeroperl instantiate changed; review compatibility patch');
   patched=patched.replace(asyncCompile,'{instance:new WebAssembly.Instance(new WebAssembly.Module(e),t.wrapImports(a))}');
   return patched;
  }
 }};
}
export default defineConfig({ plugins: [react(),workerBrowserFix()],preview:{allowedHosts:["candidly-healthily-dandy-taipan.kitten.space"]}, worker: { format: 'es',plugins:()=>[workerBrowserFix()] } });
