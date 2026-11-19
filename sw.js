const V='bibly-v2';
const F=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-touch-icon.png','icons/favicon-32.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!=='bibly-rem').map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(c=>{
    const n=fetch(e.request).then(r=>{if(r&&r.ok){const k=r.clone();caches.open(V).then(x=>x.put(e.request,k))}return r}).catch(()=>c);
    return c||n;
  }));
});

/* Recordatorio de lectura */
const RK='bibly-rem';
async function getRem(){const c=await caches.open(RK);const r=await c.match('rem');return r?r.json():null}
async function putRem(o){const c=await caches.open(RK);await c.put('rem',new Response(JSON.stringify(o),{headers:{'Content-Type':'application/json'}}))}
self.addEventListener('message',e=>{
  const d=e.data;
  if(d&&d.type==='rem')e.waitUntil((async()=>{
    const o=await getRem();
    const nt=(o&&o.notified&&o.notified>(d.notified||''))?o.notified:d.notified;
    await putRem({on:d.on,t:d.t,read:d.read,notified:nt});
  })());
});
self.addEventListener('periodicsync',e=>{
  if(e.tag!=='bibly-reminder')return;
  e.waitUntil((async()=>{
    const r=await getRem();if(!r||!r.on)return;
    const n=new Date(),p=x=>String(x).padStart(2,'0');
    const td=n.getFullYear()+'-'+p(n.getMonth()+1)+'-'+p(n.getDate()),hm=p(n.getHours())+':'+p(n.getMinutes());
    if(r.read===td||r.notified===td||hm<r.t)return;
    r.notified=td;await putRem(r);
    await self.registration.showNotification('Bibly · Hora de tu lectura',{body:'Hoy aún no has leído. ¡Lee un poco y mantén tu racha!',icon:'icons/icon-192.png',badge:'icons/favicon-32.png',tag:'bibly-rem'});
  })());
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{
    for(const c of l){if('focus' in c)return c.focus()}
    return self.clients.openWindow('./');
  }));
});
