/*
  PhotoTips Service Worker — update/cache strategy copied from ChinaYunnan_0916.
  - RELEASE_VERSION is the public app version; BUILD_ID is the deploy/build version.
  - build.json is the update probe.
  - asset-manifest.json stores SHA-256 for App Shell assets, so an install reuses unchanged files from the previous App Cache.
  - offline-manifest.json stores packaged image SHA-256; the stable Image Cache refreshes only files whose content actually changed.
  - HTML navigation is Network First; App Shell is Cache First; images are Cache First.
*/
const RELEASE_VERSION = '1.1.5';
const BUILD_ID = '20260918-035500';
const STORAGE_SCHEMA = 'v1';
const APP_CACHE = `photo-tips-app-${RELEASE_VERSION}-${BUILD_ID}`;
const IMAGE_CACHE = `photo-tips-images-${STORAGE_SCHEMA}`;
const OFFLINE_META_CACHE = `photo-tips-offline-${STORAGE_SCHEMA}`;
const PROJECT_CACHE_PREFIX = 'photo-tips-';
const APP_CACHE_PREFIX = 'photo-tips-app-';
const BUILD_META_URL = './build.json';
const ASSET_MANIFEST_URL = './asset-manifest.json';
const OFFLINE_MANIFEST_URL = './offline-manifest.json';

const CORE_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './offline-manifest.json',
  `./css/style.css?b=${BUILD_ID}`,
  `./js/settings.js?b=${BUILD_ID}`,
  `./js/app.js?b=${BUILD_ID}`,
  `./js/offline.js?b=${BUILD_ID}`,
  `./data/tips.js?b=${BUILD_ID}`,
  './data/tips.json'
];

function canStore(response){return !!response&&(response.ok||response.type==='opaque');}
function appCacheNames(names){return names.filter(name=>name.startsWith(APP_CACHE_PREFIX)&&name!==APP_CACHE);}
function manifestAssetEntry(manifest,asset){
  const assets=manifest?.assets&&typeof manifest.assets==='object'?manifest.assets:{};
  if(Object.prototype.hasOwnProperty.call(assets,asset))return {key:asset,hash:assets[asset]};
  const bare=String(asset).split('?',1)[0];
  const key=Object.keys(assets).find(candidate=>candidate.split('?',1)[0]===bare);
  return key?{key,hash:assets[key]}:null;
}
async function parseCachedAssetManifest(cacheName){
  try{const cache=await caches.open(cacheName);const response=await cache.match(ASSET_MANIFEST_URL);if(!response?.ok)return null;const data=await response.json();return data&&typeof data==='object'&&data.assets&&typeof data.assets==='object'?data:null;}catch{return null;}
}
async function fetchCurrentAssetManifest(){
  const response=await fetch(`${ASSET_MANIFEST_URL}?b=${encodeURIComponent(BUILD_ID)}`,{cache:'no-store'});
  if(!response.ok)throw new Error(`Asset manifest unavailable: ${response.status}`);
  const data=await response.json();
  if(data?.version!==RELEASE_VERSION||data?.build!==BUILD_ID||!data?.assets)throw new Error('Asset manifest build mismatch');
  return data;
}
async function readOfflineManifestFromCache(cache){
  try{const response=await cache?.match(OFFLINE_MANIFEST_URL);if(!response?.ok)return null;const data=await response.json();return data&&typeof data==='object'?data:null;}catch{return null;}
}
async function responseSha256(response){
  if(!response||response.type==='opaque'||!globalThis.crypto?.subtle)return '';
  try{const buffer=await response.clone().arrayBuffer();const digest=await crypto.subtle.digest('SHA-256',buffer);return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');}catch{return '';}
}
async function replaceCachedLocalImage(imageCache,asset){
  try{const response=await fetch(new Request(asset,{cache:'reload'}));if(!canStore(response))throw new Error(`HTTP ${response.status}`);await imageCache.put(asset,response.clone());return true;}
  catch(error){await imageCache.delete(asset);console.warn('Changed image refresh failed; stale cache removed',asset,error);return false;}
}
function packagedImageAssets(manifest){
  if(Array.isArray(manifest?.imageAssets))return manifest.imageAssets;
  const all=[...(manifest?.thumbs||[]),...(manifest?.full||[])].map(x=>typeof x==='string'?x:x?.url).filter(Boolean);
  return [...new Set(all)];
}
function packagedImageHashes(manifest){
  if(manifest?.imageHashes&&typeof manifest.imageHashes==='object')return manifest.imageHashes;
  const out={};for(const item of [...(manifest?.thumbs||[]),...(manifest?.full||[])])if(item?.url&&item?.sha256)out[item.url]=item.sha256;return out;
}
async function reconcilePackagedImages(previousManifest,currentManifest,{verifyCached=false}={}){
  const imageCache=await caches.open(IMAGE_CACHE);
  const currentHashes=packagedImageHashes(currentManifest),previousHashes=packagedImageHashes(previousManifest);
  const currentAssets=new Set(packagedImageAssets(currentManifest)),previousAssets=new Set(packagedImageAssets(previousManifest));
  let checked=0,updated=0,removed=0,failed=0;
  for(const asset of previousAssets){if(currentAssets.has(asset))continue;if(await imageCache.delete(asset))removed++;}
  for(const asset of currentAssets){
    const expected=String(currentHashes[asset]||'');if(!expected)continue;
    const cached=await imageCache.match(asset,{ignoreSearch:true});if(!cached)continue;
    checked++;
    let changed=Boolean(previousHashes[asset]&&previousHashes[asset]!==expected);
    if(!changed&&(verifyCached||!previousHashes[asset])){const actual=await responseSha256(cached);changed=Boolean(actual&&actual!==expected);}
    if(!changed)continue;
    if(await replaceCachedLocalImage(imageCache,asset))updated++;else failed++;
  }
  try{const meta=await caches.open(OFFLINE_META_CACHE);await meta.put('./last-image-reconcile.json',new Response(JSON.stringify({build:BUILD_ID,checked,updated,removed,failed,at:Date.now()}),{headers:{'Content-Type':'application/json'}}));}catch{}
  return {checked,updated,removed,failed};
}
async function forceRefreshAppShell(){
  const cache=await caches.open(APP_CACHE),currentManifest=await fetchCurrentAssetManifest();let checked=0,updated=0,failed=0;
  for(const asset of CORE_SHELL){
    checked++;
    try{
      const response=await fetch(new Request(asset,{cache:'reload'}));if(!canStore(response))throw new Error(`HTTP ${response.status}`);
      const previous=await cache.match(asset),before=previous?await responseSha256(previous):'',after=await responseSha256(response);
      await cache.put(asset,response.clone());if(!before||!after||before!==after)updated++;
    }catch(error){failed++;console.warn('Forced App Shell refresh failed',asset,error);}
  }
  await cache.put(ASSET_MANIFEST_URL,new Response(JSON.stringify(currentManifest),{headers:{'Content-Type':'application/json'}}));
  try{const buildResponse=await fetch(`${BUILD_META_URL}?force=${Date.now()}`,{cache:'no-store'});if(buildResponse.ok)await cache.put(BUILD_META_URL,buildResponse.clone());}catch{}
  return {checked,updated,failed};
}
async function installAppShell(){
  const cache=await caches.open(APP_CACHE),names=await caches.keys(),previousNames=appCacheNames(names).sort().reverse();
  let previousName=null,previousManifest=null,previousCache=null;
  for(const name of previousNames){const manifest=await parseCachedAssetManifest(name);if(manifest){previousName=name;previousManifest=manifest;previousCache=await caches.open(name);break;}}
  const currentManifest=await fetchCurrentAssetManifest();
  for(const asset of CORE_SHELL){
    let reused=false;
    if(previousCache){
      const previousEntry=manifestAssetEntry(previousManifest,asset),currentEntry=manifestAssetEntry(currentManifest,asset);
      if(previousEntry&&currentEntry&&previousEntry.hash===currentEntry.hash){const cached=await previousCache.match(previousEntry.key);if(cached){await cache.put(asset,cached.clone());reused=true;}}
    }
    if(reused)continue;
    const response=await fetch(new Request(asset,{cache:'no-cache'}));if(!canStore(response))throw new Error(`Core asset unavailable: ${asset}`);await cache.put(asset,response.clone());
  }
  await cache.put(ASSET_MANIFEST_URL,new Response(JSON.stringify(currentManifest),{headers:{'Content-Type':'application/json'}}));
  try{const buildResponse=await fetch(`${BUILD_META_URL}?b=${encodeURIComponent(BUILD_ID)}`,{cache:'no-store'});if(buildResponse.ok)await cache.put(BUILD_META_URL,buildResponse.clone());}catch{}
  const previousOffline=await readOfflineManifestFromCache(previousCache),currentOffline=await readOfflineManifestFromCache(cache);
  if(currentOffline)await reconcilePackagedImages(previousOffline,currentOffline,{verifyCached:!previousOffline?.imageHashes});
  return previousName;
}

self.addEventListener('install',event=>{event.waitUntil((async()=>{await installAppShell();await self.skipWaiting();})());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const names=await caches.keys(),keep=new Set([APP_CACHE,IMAGE_CACHE,OFFLINE_META_CACHE]);await Promise.all(names.map(name=>name.startsWith(PROJECT_CACHE_PREFIX)&&!keep.has(name)?caches.delete(name):Promise.resolve(false)));await self.clients.claim();})());});

function isPhotoRequest(request,url){if(request.destination==='image')return true;return /\.(?:avif|webp|png|jpe?g|gif|svg)(?:$|\?)/i.test(url.pathname+url.search);}
function eventlessPut(cache,request,response){cache.put(request,response).catch(()=>{});}
async function cacheFirstImage(request){
  const cache=await caches.open(IMAGE_CACHE),cached=await cache.match(request,{ignoreSearch:true});if(cached)return cached;
  try{const response=await fetch(request);if(canStore(response))eventlessPut(cache,request,response.clone());return response;}catch{return new Response('',{status:503,statusText:'Image unavailable offline'});}
}
async function documentNetworkFirst(request){
  try{const response=await fetch(request,{cache:'no-cache'});if(canStore(response))return response;}catch{}
  const cache=await caches.open(APP_CACHE),fallback=await cache.match('./index.html')||await cache.match('./');if(fallback)return fallback;return new Response('Offline',{status:503,statusText:'Offline'});
}
async function appCacheFirst(request){
  const cache=await caches.open(APP_CACHE),cached=await cache.match(request);if(cached)return cached;
  try{const response=await fetch(request,{cache:'no-cache'});if(canStore(response))eventlessPut(cache,request,response.clone());return response;}catch{return new Response('Offline',{status:503,statusText:'Offline'});}
}
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);
  if(isPhotoRequest(request,url)){event.respondWith(cacheFirstImage(request));return;}
  const sameOrigin=url.origin===self.location.origin;if(!sameOrigin)return;
  if(/\/build\.json$/i.test(url.pathname)){event.respondWith(fetch(request,{cache:'no-store'}).catch(()=>new Response('',{status:503,statusText:'Build check unavailable'})));return;}
  if(request.mode==='navigate'||request.destination==='document'){event.respondWith(documentNetworkFirst(request));return;}
  const appLike=request.destination==='script'||request.destination==='style'||(/\/(?:data\/[^/]+|offline-manifest|asset-manifest)\.json$/i.test(url.pathname))||/\.webmanifest$/i.test(url.pathname);
  if(appLike)event.respondWith(appCacheFirst(request));
});

async function readOfflineManifest(){
  const cache=await caches.open(APP_CACHE);let response=await cache.match(OFFLINE_MANIFEST_URL);if(!response)response=await fetch(OFFLINE_MANIFEST_URL,{cache:'no-store'});if(!response||!response.ok)throw new Error('offline-manifest.json unavailable');return response.json();
}
async function verifyCached(cache,url,sha=''){
  const res=await cache.match(url,{ignoreSearch:true});if(!res)return false;if(!sha)return true;try{return (await responseSha256(res))===sha;}catch{return true;}
}
function coreRecords(manifest){
  if(Array.isArray(manifest?.core))return manifest.core.map(x=>typeof x==='string'?{url:x}:{...x});
  return (manifest?.coreAssets||CORE_SHELL).map(url=>({url}));
}
function thumbRecords(manifest){return Array.isArray(manifest?.thumbs)?manifest.thumbs.map(x=>typeof x==='string'?{url:x}:{...x}):[];}
function fullRecords(manifest){return Array.isArray(manifest?.full)?manifest.full.map(x=>typeof x==='string'?{url:x}:{...x}):[];}
async function checkOffline(manifest,selections={thumbs:true,full:true}){
  const app=await caches.open(APP_CACHE),images=await caches.open(IMAGE_CACHE),core=coreRecords(manifest),thumbs=thumbRecords(manifest),full=fullRecords(manifest),missing=[];
  let coreMissing=0,thumbMissing=0,fullMissing=0;
  for(const item of core)if(!(await verifyCached(app,item.url,item.sha256||''))){coreMissing++;missing.push({kind:'core',url:item.url});}
  if(selections.thumbs!==false)for(const item of thumbs)if(!(await verifyCached(images,item.url,item.sha256||''))){thumbMissing++;missing.push({kind:'thumb',url:item.url});}
  if(selections.full!==false)for(const item of full)if(!(await verifyCached(images,item.url,item.sha256||''))){fullMissing++;missing.push({kind:'full',url:item.url});}
  return {coreTotal:core.length,coreMissing,thumbTotal:thumbs.length,thumbMissing,fullTotal:full.length,fullMissing,missing,checkedAt:Date.now(),version:manifest.version||''};
}
async function fetchAndCache(cache,item){
  const response=await fetch(new Request(item.url,{cache:'reload'}));if(!canStore(response))throw new Error(`HTTP ${response.status} ${item.url}`);
  if(item.sha256){const actual=await responseSha256(response);if(actual&&actual!==item.sha256)throw new Error(`SHA mismatch ${item.url}`);}await cache.put(item.url,response.clone());
}
async function prepareOffline(manifest,selections,port,{retryOnly=false}={}){
  const app=await caches.open(APP_CACHE),images=await caches.open(IMAGE_CACHE),groups=[{kind:'core',items:coreRecords(manifest),cache:app,enabled:true},{kind:'thumb',items:thumbRecords(manifest),cache:images,enabled:selections.thumbs!==false},{kind:'full',items:fullRecords(manifest),cache:images,enabled:selections.full!==false}],enabled=groups.filter(g=>g.enabled);
  const total=enabled.reduce((n,g)=>n+g.items.length,0);let done=0;
  for(const group of enabled)for(const item of group.items){let already=false;try{already=await verifyCached(group.cache,item.url,item.sha256||'');}catch{}if(!already){try{await fetchAndCache(group.cache,item);}catch(error){console.warn('Offline asset failed',item.url,error);}}done++;port?.postMessage({type:'OFFLINE_PROGRESS',done,total,kind:group.kind,url:item.url});}
  const result=await checkOffline(manifest,selections),meta=await caches.open(OFFLINE_META_CACHE);await meta.put('./offline-prep-result.json',new Response(JSON.stringify({...result,selections,preparedAt:Date.now(),retryOnly}),{headers:{'Content-Type':'application/json'}}));return result;
}
async function clearOffline(scope){
  if(scope==='images'){await caches.delete(IMAGE_CACHE);await caches.delete(OFFLINE_META_CACHE);}
  else if(scope==='all'){
    await caches.delete(IMAGE_CACHE);await caches.delete(OFFLINE_META_CACHE);
    const app=await caches.open(APP_CACHE),keep=new Set(CORE_SHELL.map(asset=>new URL(asset,self.registration.scope).href)),keys=await app.keys();await Promise.all(keys.map(request=>keep.has(request.url)?Promise.resolve(false):app.delete(request)));
  }
  return true;
}

self.addEventListener('message',event=>{
  const msg=event.data||{},port=event.ports?.[0];
  if(msg.type==='GET_BUILD_INFO'){port?.postMessage({type:'BUILD_INFO',version:RELEASE_VERSION,build:BUILD_ID});return;}
  if(msg.type==='SKIP_WAITING'){event.waitUntil(self.skipWaiting());return;}
  if(msg.type==='FORCE_REFRESH_APP_SHELL'&&port){event.waitUntil((async()=>{try{const result=await forceRefreshAppShell();port.postMessage({type:'RESULT',ok:true,result});}catch(error){port.postMessage({type:'RESULT',ok:false,error:String(error?.message||error)});}})());return;}
  if(msg.type==='RECONCILE_IMAGES'&&port){event.waitUntil((async()=>{try{const cache=await caches.open(APP_CACHE),manifest=await readOfflineManifestFromCache(cache);if(!manifest)throw new Error('offline manifest unavailable');const result=await reconcilePackagedImages(manifest,manifest,{verifyCached:true});port.postMessage({type:'RESULT',ok:true,result});}catch(error){port.postMessage({type:'RESULT',ok:false,error:String(error?.message||error)});}})());return;}
  if(!port)return;
  const allowed=['OFFLINE_CHECK','OFFLINE_PREPARE','OFFLINE_RETRY','OFFLINE_CLEAR'];if(!allowed.includes(msg.type))return;
  event.waitUntil((async()=>{try{const manifest=await readOfflineManifest(),selections={thumbs:msg.selections?.thumbs!==false,full:msg.selections?.full!==false};let result;if(msg.type==='OFFLINE_CHECK')result=await checkOffline(manifest,selections);else if(msg.type==='OFFLINE_PREPARE')result=await prepareOffline(manifest,selections,port);else if(msg.type==='OFFLINE_RETRY')result=await prepareOffline(manifest,selections,port,{retryOnly:true});else{await clearOffline(msg.scope||'images');result=await checkOffline(manifest,selections);}port.postMessage({type:'OFFLINE_RESULT',result});}catch(error){port.postMessage({type:'OFFLINE_ERROR',error:String(error?.message||error)});}})());
});
