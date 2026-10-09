declare module 'elheif' {
 export function ensureInitialized(): Promise<void>;
 export function jsDecodeImage(data: Uint8Array): { err: string; data: { width: number; height: number; data: Uint8Array }[] };
 export function jsEncodeImage(data: Uint8Array, width: number, height: number): { err: string; data: Uint8Array };
}
