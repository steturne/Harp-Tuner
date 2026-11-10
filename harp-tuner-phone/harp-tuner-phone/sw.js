/* HARP TUNER 2000 on a phone: keeps a copy of every file, so the tuner opens with no signal once it has been opened.
   It answers from the copy straight away and fetches each file afresh behind it: a new upload shows the time after next it opens.
   Change V when files are added or removed. The weather (another site) is never kept. */
const V='harp-tuner-2',FILES=['index.html','tuner.js','harp-sound.js','harp-tuner.js','harp-tuner-2000-body.jpg','harp-tuner-2000-parts.png',
  'manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(caches.open(V).then(async c=>{const kept=await c.match(r,{ignoreSearch:true})||r.mode==='navigate'&&await c.match('index.html');   /* the folder's own address is index.html */
    const fresh=fetch(r).then(n=>{if(n&&n.ok)c.put(r,n.clone());return n;}).catch(()=>null);
    if(kept){e.waitUntil(fresh);return kept;}return (await fresh)||new Response('Offline',{status:503});}));});
