// Научный слог — офлайн-кэш. Страница: сначала сеть (свежая версия), без сети — из кэша.
const V="nslog-v3";
const CORE=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function netFirst(r){
 const tm=new Promise(res=>setTimeout(()=>res(null),5000));
 const net=fetch(r,{cache:"no-cache"}).then(res=>{if(res.ok){const cl=res.clone();caches.open(V).then(c=>c.put("./index.html",cl))}return res}).catch(()=>null);
 return Promise.race([net,tm]).then(res=>res||caches.match("./index.html").then(hit=>hit||net.then(n=>n||Response.error())));
}
self.addEventListener("fetch",e=>{
 const r=e.request;if(r.method!=="GET")return;
 const u=new URL(r.url);
 if(u.hostname==="fonts.googleapis.com"||u.hostname==="fonts.gstatic.com"){
  e.respondWith(caches.open(V).then(c=>c.match(r).then(hit=>{const net=fetch(r).then(res=>{c.put(r,res.clone());return res}).catch(()=>hit);return hit||net})));return}
 if(u.origin!==location.origin)return;
 if(r.mode==="navigate"||/\/(index\.html)?$/.test(u.pathname)){e.respondWith(netFirst(r));return}
 e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>{
  const net=fetch(r).then(res=>{if(res.ok){const cl=res.clone();caches.open(V).then(c=>c.put(r,cl))}return res}).catch(()=>hit);
  return hit||net}));
});
