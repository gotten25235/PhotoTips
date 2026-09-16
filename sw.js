/* PhotoTips offline/PWA service worker.
   App shell and images use separate caches so code updates do not evict the 162 local photos.
*/
const APP_VERSION='v8';
const APP_CACHE=`photo-tips-app-${APP_VERSION}`;
const IMAGE_CACHE='photo-tips-images-v1';
const META_CACHE='photo-tips-offline-meta-v1';
const PROJECT_PREFIX='photo-tips-';
const MANIFEST_URL='./offline-manifest.json';
const FALLBACK_CORE=['./','./index.html','./css/style.css','./js/app.js','./js/offline.js','./data/tips.js','./manifest.webmanifest','./offline-manifest.json'];

function canStore(r){return r&&r.ok&&(r.type==='basic'||r.type==='default'||r.type==='cors');}
async function sha256Response(response){
  if(!response||!self.crypto?.subtle)return '';
  const buf=await response.clone().arrayBuffer();
  const hash=await crypto.subtle.digest('SHA-256',buf);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function fetchManifest(){
  const app=await caches.open(APP_CACHE);
  try{
    const res=await fetch(`${MANIFEST_URL}?t=${Date.now()}`,{cache:'no-store'});
    if(res.ok){await app.put(MANIFEST_URL,res.clone());return await res.json();}
  }catch{}
  const cached=await app.match(MANIFEST_URL);
  if(cached)return await cached.json();
  throw new Error('offline-manifest.json unavailable');
}
async function precacheCore(){
  const cache=await caches.open(APP_CACHE);
  for(const asset of FALLBACK_CORE){
    try{
      const res=await fetch(new Request(asset,{cache:'reload'}));
      if(canStore(res))await cache.put(asset,res.clone());
    }catch{}
  }
}

self.addEventListener('install',event=>event.waitUntil(precacheCore().then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const names=await caches.keys();
  const keep=new Set([APP_CACHE,IMAGE_CACHE,META_CACHE]);
  await Promise.all(names.map(name=>name.startsWith(PROJECT_PREFIX)&&!keep.has(name)?caches.delete(name):Promise.resolve(false)));
  await self.clients.claim();
})()));

async function networkFirst(request){
  const cache=await caches.open(APP_CACHE);
  try{
    const res=await fetch(request,{cache:'no-cache'});
    if(canStore(res))cache.put(request,res.clone()).catch(()=>{});
    return res;
  }catch{
    return await cache.match(request)||await cache.match('./index.html')||new Response('Offline',{status:503});
  }
}
async function cacheFirstImage(request){
  const cache=await caches.open(IMAGE_CACHE);
  const hit=await cache.match(request,{ignoreSearch:true});
  if(hit)return hit;
  try{
    const res=await fetch(request);
    if(canStore(res))cache.put(request,res.clone()).catch(()=>{});
    return res;
  }catch{return new Response('',{status:503,statusText:'Image unavailable offline'});}
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  if(/\.(?:webp|png|jpe?g|gif|svg)$/i.test(url.pathname)){event.respondWith(cacheFirstImage(event.request));return;}
  if(event.request.mode==='navigate'){event.respondWith(networkFirst(event.request));return;}
  event.respondWith(networkFirst(event.request));
});

async function verifyCached(cache,url,sha=''){
  const res=await cache.match(url,{ignoreSearch:true});
  if(!res)return false;
  if(!sha)return true;
  try{return (await sha256Response(res))===sha;}catch{return true;}
}
async function checkOffline(manifest,selections={thumbs:true,full:true}){
  const app=await caches.open(APP_CACHE), images=await caches.open(IMAGE_CACHE);
  const core=manifest.core||[];
  const thumbs=manifest.thumbs||[], full=manifest.full||[];
  const missing=[];
  let coreMissing=0,thumbMissing=0,fullMissing=0;
  for(const item of core){if(!(await verifyCached(app,item.url,item.sha256||''))){coreMissing++;missing.push({kind:'core',url:item.url});}}
  if(selections.thumbs!==false){for(const item of thumbs){if(!(await verifyCached(images,item.url,item.sha256||''))){thumbMissing++;missing.push({kind:'thumb',url:item.url});}}}
  if(selections.full!==false){for(const item of full){if(!(await verifyCached(images,item.url,item.sha256||''))){fullMissing++;missing.push({kind:'full',url:item.url});}}}
  return {coreTotal:core.length,coreMissing,thumbTotal:thumbs.length,thumbMissing,fullTotal:full.length,fullMissing,missing,checkedAt:Date.now(),version:manifest.version||''};
}
async function fetchAndCache(cache,item){
  const res=await fetch(new Request(item.url,{cache:'reload'}));
  if(!canStore(res))throw new Error(`HTTP ${res.status} ${item.url}`);
  if(item.sha256){const actual=await sha256Response(res);if(actual&&actual!==item.sha256)throw new Error(`SHA mismatch ${item.url}`);}
  await cache.put(item.url,res.clone());
}
async function prepareOffline(manifest,selections,port,{retryOnly=false}={}){
  const app=await caches.open(APP_CACHE),images=await caches.open(IMAGE_CACHE);
  const groups=[{kind:'core',items:manifest.core||[],cache:app,enabled:true},{kind:'thumb',items:manifest.thumbs||[],cache:images,enabled:selections.thumbs!==false},{kind:'full',items:manifest.full||[],cache:images,enabled:selections.full!==false}];
  const enabled=groups.filter(g=>g.enabled);
  const total=enabled.reduce((n,g)=>n+g.items.length,0);let done=0;
  for(const group of enabled){
    for(const item of group.items){
      let already=false;
      try{already=await verifyCached(group.cache,item.url,item.sha256||'');}catch{}
      if(!already){
        try{await fetchAndCache(group.cache,item);}catch(error){console.warn('Offline asset failed',item.url,error);}
      }
      done++;
      port?.postMessage({type:'OFFLINE_PROGRESS',done,total,kind:group.kind,url:item.url});
    }
  }
  const result=await checkOffline(manifest,selections);
  const meta=await caches.open(META_CACHE);
  await meta.put('./offline-prep-result.json',new Response(JSON.stringify({...result,selections,preparedAt:Date.now(),retryOnly}),{headers:{'Content-Type':'application/json'}}));
  return result;
}
async function clearOffline(scope){
  if(scope==='images'){await caches.delete(IMAGE_CACHE);await caches.delete(META_CACHE);}
  else if(scope==='all'){
    await caches.delete(IMAGE_CACHE);await caches.delete(META_CACHE);await caches.delete(APP_CACHE);await precacheCore();
  }
  return true;
}

self.addEventListener('message',event=>{
  const msg=event.data||{},port=event.ports?.[0];
  if(!port)return;
  (async()=>{
    try{
      const manifest=await fetchManifest();
      const selections={thumbs:msg.selections?.thumbs!==false,full:msg.selections?.full!==false};
      let result;
      if(msg.type==='OFFLINE_CHECK')result=await checkOffline(manifest,selections);
      else if(msg.type==='OFFLINE_PREPARE')result=await prepareOffline(manifest,selections,port);
      else if(msg.type==='OFFLINE_RETRY')result=await prepareOffline(manifest,selections,port,{retryOnly:true});
      else if(msg.type==='OFFLINE_CLEAR'){await clearOffline(msg.scope||'images');result=await checkOffline(manifest,selections);}
      else throw new Error('Unknown offline request');
      port.postMessage({type:'OFFLINE_RESULT',result});
    }catch(error){port.postMessage({type:'OFFLINE_ERROR',error:error?.message||String(error)});}
  })();
});
