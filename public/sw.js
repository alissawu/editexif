// Cache shipped immutable assets only. No uploaded photos, HTML or API responses.
const CACHE='editexif-assets-v1';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!/^\/(assets|engine)\//.test(url.pathname))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const found=await cache.match(event.request);if(found)return found;
  const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;
 }));
});
