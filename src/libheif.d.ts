declare module 'libheif-js/libheif-wasm/libheif-bundle.mjs' {
 type Image={get_width():number;get_height():number;free():void;display(data:ImageData,callback:(data:ImageData|null)=>void):void};
 export default function init():Promise<{HeifDecoder:new()=>{decode(data:Uint8Array):Image[]}}>;
}
