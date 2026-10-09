import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
// zeroperl 1.0.10 checks window + document and mistakes a browser worker for Node.
// Extend that check during bundling only; never edit dependencies on disk.
function workerBrowserFix(): Plugin {
 return {name:'zeroperl-browser-worker',enforce:'pre',transform(code,id){
  if(id.includes('@6over3/zeroperl-ts')&&id.endsWith('.js')){
   const patched=code.replace('typeof window<'+String.fromCharCode(34)+'u'+String.fromCharCode(34)+'&&typeof document<'+String.fromCharCode(34)+'u'+String.fromCharCode(34),'(typeof window !== "undefined" && typeof document !== "undefined") || (typeof WorkerGlobalScope !== "undefined" && globalThis instanceof WorkerGlobalScope)');
   if(patched===code)throw Error('zeroperl browser detection changed; review compatibility patch');
   return patched;
  }
 }};
}
export default defineConfig({ plugins: [react(),workerBrowserFix()], worker: { format: 'es',plugins:()=>[workerBrowserFix()] } });
