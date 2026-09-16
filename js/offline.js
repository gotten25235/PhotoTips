(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const STATE_KEY='photo-tips-offline-prep-v1';
let deferredInstallPrompt=null;
let manifest=null;
let state={lastPreparedAt:0,lastCheck:null,selections:{thumbs:true,full:true},nudged:false};
try{const raw=localStorage.getItem(STATE_KEY);if(raw){const x=JSON.parse(raw);state={...state,...x,selections:{...state.selections,...(x.selections||{})}};}}catch{}

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;syncInstallButton();});
window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;syncInstallButton();});

function save(){try{localStorage.setItem(STATE_KEY,JSON.stringify(state));}catch{}}
function fmtTime(v){if(!v)return '尚未完成';try{return new Intl.DateTimeFormat('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(v));}catch{return new Date(v).toLocaleString('zh-TW');}}
function fmtBytes(n){n=Number(n)||0;if(n<1024)return `${n} B`;if(n<1024**2)return `${(n/1024).toFixed(1)} KB`;return `${(n/1024**2).toFixed(1)} MB`;}
function canSW(){return 'serviceWorker'in navigator&&(location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname));}
function selections(){return {thumbs:state.selections.thumbs!==false,full:state.selections.full!==false};}
function ready(result=state.lastCheck){const s=selections();if(!result||Number(result.coreMissing)!==0)return false;if(s.thumbs&&Number(result.thumbMissing)!==0)return false;if(s.full&&Number(result.fullMissing)!==0)return false;return true;}
function isStandalone(){return matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;}

async function loadManifest(){
  if(manifest)return manifest;
  try{const r=await fetch(`./offline-manifest.json?t=${Date.now()}`,{cache:'no-store'});if(r.ok){manifest=await r.json();return manifest;}}catch{}
  try{const names=(await caches.keys()).filter(n=>n.startsWith('photo-tips-app-')).sort().reverse();for(const name of names){const c=await caches.open(name),r=await c.match('./offline-manifest.json');if(r){manifest=await r.json();return manifest;}}}catch{}
  return null;
}
function bytesMeta(){
  if(!manifest)return {thumb:0,full:0,total:0};
  const thumb=(manifest.thumbs||[]).reduce((a,x)=>a+(x.bytes||0),0),full=(manifest.full||[]).reduce((a,x)=>a+(x.bytes||0),0);
  return {thumb,full,total:thumb+full};
}
async function ensureSW(){
  if(!canSW())throw new Error('請使用 START.bat 開啟網站，才能使用離線準備');
  const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
  try{await reg.update();}catch{}
  const pending=reg.installing||reg.waiting;
  if(pending&&pending.state!=='activated'){
    await new Promise(resolve=>{
      const timer=setTimeout(resolve,5000);
      const done=()=>{if(pending.state==='activated'||pending.state==='redundant'){clearTimeout(timer);pending.removeEventListener('statechange',done);resolve();}};
      pending.addEventListener('statechange',done);done();
    });
  }
  await navigator.serviceWorker.ready;
  return reg;
}
async function swRequest(type,payload={},onProgress){
  const reg=await ensureSW();
  const worker=reg.active||reg.waiting||navigator.serviceWorker.controller||reg.installing;
  if(!worker)throw new Error('離線服務尚未啟動，請重新整理後再試');
  return await new Promise((resolve,reject)=>{
    const ch=new MessageChannel();let timer=setTimeout(()=>reject(new Error('離線服務回應逾時')),180000);
    ch.port1.onmessage=e=>{const m=e.data||{};if(m.type==='OFFLINE_PROGRESS'){onProgress?.(m);return;}clearTimeout(timer);if(m.type==='OFFLINE_ERROR')reject(new Error(m.error||'離線準備失敗'));else if(m.type==='OFFLINE_RESULT')resolve(m.result||{});};
    worker.postMessage({type,...payload},[ch.port2]);
  });
}

function syncConnection(){
  const badge=$('#connection-badge');if(badge){badge.textContent=navigator.onLine?'● 線上':'● 離線';badge.classList.toggle('is-offline',!navigator.onLine);}
  const line=$('[data-offline-connection]');if(line)line.textContent=navigator.onLine?'線上，可下載或更新離線內容':'目前離線，使用已準備的內容';
  syncShortcut();
}
function syncShortcut({working=false}={}){
  const b=$('#offline-btn');if(!b)return;
  let wide='⇩ 離線準備',compact='⇩ 離線',mode='idle';
  if(working){wide='… 準備中';compact='… 離線';mode='working';}
  else if(ready()&&navigator.onLine){wide='✓ 離線已備妥';compact='✓ 離線';mode='ready';}
  else if(ready()&&!navigator.onLine){wide='✓ 離線可用';compact='✓ 離線';mode='ready';}
  else if(!navigator.onLine){wide='! 離線未備妥';compact='! 離線';mode='partial';}
  b.dataset.state=mode;b.querySelector('[data-offline-wide]').textContent=wide;b.querySelector('[data-offline-compact]').textContent=compact;
}
function statusIcon(missing,enabled=true){if(!enabled)return '–';if(missing===0)return '✓';if(Number.isFinite(missing))return '!';return '○';}
function paint(result=state.lastCheck){
  const d=$('#offline-dialog');if(!d)return;
  const s=selections(),m=bytesMeta();
  $('[data-thumb-size]').textContent=`${manifest?.thumbs?.length||0} 張縮圖 · ${fmtBytes(m.thumb)}`;
  $('[data-full-size]').textContent=`${manifest?.full?.length||0} 張完整圖 · ${fmtBytes(m.full)}`;
  const selectedBytes=(s.thumbs?m.thumb:0)+(s.full?m.full:0);
  $('[data-total-size]').textContent=`約 ${fmtBytes(selectedBytes)} + 核心檔`;
  $('[data-last-prepared]').textContent=fmtTime(state.lastPreparedAt);
  $('[data-offline-thumb]').checked=s.thumbs;$('[data-offline-full]').checked=s.full;
  const coreMiss=result?Number(result.coreMissing):NaN,thumbMiss=result?Number(result.thumbMissing):NaN,fullMiss=result?Number(result.fullMissing):NaN;
  $('[data-core-status]').textContent=statusIcon(coreMiss,true);$('[data-core-label]').textContent=Number.isFinite(coreMiss)?`網頁核心 ${Math.max(0,(result.coreTotal||0)-coreMiss)} / ${result.coreTotal||0}`:'網頁核心';
  $('[data-thumb-status]').textContent=statusIcon(thumbMiss,s.thumbs);$('[data-thumb-label]').textContent=!s.thumbs?'縮圖（未選）':Number.isFinite(thumbMiss)?`預覽縮圖 ${Math.max(0,(result.thumbTotal||0)-thumbMiss)} / ${result.thumbTotal||0}`:'預覽縮圖';
  $('[data-full-status]').textContent=statusIcon(fullMiss,s.full);$('[data-full-label]').textContent=!s.full?'完整圖（未選）':Number.isFinite(fullMiss)?`完整圖片 ${Math.max(0,(result.fullTotal||0)-fullMiss)} / ${result.fullTotal||0}`:'完整圖片';
  const badge=$('[data-offline-badge]');
  if(!canSW()){badge.textContent='需 START.bat';badge.dataset.state='partial';}
  else if(ready(result)){badge.textContent=navigator.onLine?'✓ 離線已備妥':'✓ 離線可用';badge.dataset.state='ready';}
  else if(result){badge.textContent='尚未完整';badge.dataset.state='partial';}else{badge.textContent='尚未檢查';badge.dataset.state='idle';}
  renderMissing(result);
  syncConnection();
}
function renderMissing(result){
  const box=$('[data-missing-box]'),list=$('[data-missing-list]'),summary=$('[data-missing-summary]');if(!box||!list)return;
  const s=selections();const rows=(result?.missing||[]).filter(x=>x.kind==='core'||(x.kind==='thumb'&&s.thumbs)||(x.kind==='full'&&s.full));
  box.hidden=!rows.length;summary.textContent=rows.length?`查看未下載項目（${rows.length}）`:'查看未下載項目';
  list.innerHTML=rows.slice(0,50).map(x=>`<div class="offline-missing-item"><b>${x.kind==='core'?'核心':x.kind==='thumb'?'縮圖':'完整圖'}</b><code>${String(x.url).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</code></div>`).join('')+(rows.length>50?`<p class="offline-more">另有 ${rows.length-50} 個項目。</p>`:'');
  const retry=$('[data-offline-retry]');if(retry)retry.hidden=!rows.length;
}
function setProgress(done,total,label=''){
  const pct=total?Math.round(done/total*100):0;
  $('[data-progress-bar]').style.width=`${pct}%`;$('[data-progress-label]').textContent=label||`${pct}%`;$('[data-progress-count]').textContent=total?`${done} / ${total}`:'';
}
function working(on,label=''){
  $$('#offline-dialog button').forEach(b=>{if(!b.hasAttribute('data-offline-close'))b.disabled=on;});
  if(on)setProgress(0,1,label||'準備中…');syncShortcut({working:on});
}
function $$(s,r=document){return [...r.querySelectorAll(s)];}
async function check({quiet=false}={}){
  if(!canSW()){state.lastCheck=null;paint();if(!quiet)showToast('請用 START.bat 開啟，才能檢查離線資料');return null;}
  try{if(!quiet)working(true,'正在檢查 Cache…');const r=await swRequest('OFFLINE_CHECK',{selections:selections()});state.lastCheck=r;save();paint(r);return r;}
  catch(e){if(!quiet)showToast(e.message);return null;}
  finally{if(!quiet){working(false);setProgress(0,0,'檢查完成');}}
}
async function prepare(retry=false){
  if(!navigator.onLine){showToast('目前離線，無法下載缺少內容');return;}
  try{
    working(true,retry?'正在重試缺少項目…':'正在下載離線內容…');
    const type=retry?'OFFLINE_RETRY':'OFFLINE_PREPARE';
    const r=await swRequest(type,{selections:selections()},p=>{const label=p.kind==='core'?'網頁核心':p.kind==='thumb'?'預覽縮圖':'完整圖片';setProgress(p.done,p.total,`正在下載：${label}`);});
    state.lastCheck=r;if(ready(r))state.lastPreparedAt=Date.now();save();paint(r);setProgress(1,1,ready(r)?'✓ 離線準備完成':'下載完成，但仍有缺少項目');showToast(ready(r)?'離線內容已準備完成':'仍有未下載項目，可按重試');
  }catch(e){showToast(e.message);}
  finally{working(false);}
}
async function clear(scope){
  const text=scope==='all'?'清除離線下載並重新建立核心快取？':'清除所有離線圖片快取？';if(!confirm(text))return;
  try{working(true,'正在清除…');const r=await swRequest('OFFLINE_CLEAR',{scope,selections:selections()});state.lastCheck=r;state.lastPreparedAt=0;save();paint(r);setProgress(0,0,'已清除');showToast('離線資料已清除');}catch(e){showToast(e.message);}finally{working(false);}
}
function showToast(msg){const t=$('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),1800);}
function syncInstallButton(){const b=$('[data-offline-install]');if(!b)return;b.hidden=isStandalone();b.textContent=isStandalone()?'已安裝':'＋ 安裝到主畫面';}
async function install(){if(isStandalone()){showToast('已在 App 模式開啟');return;}if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;syncInstallButton();return;}showToast('iPhone：Safari 分享 → 加入主畫面；Android：瀏覽器選單 → 安裝');}
function open(){const d=$('#offline-dialog');if(!d)return;if(!d.open){d.showModal?.();if(!d.open)d.setAttribute('open','');}paint();check({quiet:true});}
function close(){const d=$('#offline-dialog');if(d?.open)d.close();}

function bind(){
  $('#offline-btn')?.addEventListener('click',open);$$('[data-offline-close]').forEach(b=>b.addEventListener('click',close));
  $('#offline-dialog')?.addEventListener('click',e=>{if(e.target===$('#offline-dialog'))close();});
  $('[data-offline-thumb]')?.addEventListener('change',e=>{state.selections.thumbs=e.target.checked;save();paint();});
  $('[data-offline-full]')?.addEventListener('change',e=>{state.selections.full=e.target.checked;save();paint();});
  $('[data-offline-select-all]')?.addEventListener('click',()=>{state.selections={thumbs:true,full:true};save();paint();});
  $('[data-offline-select-none]')?.addEventListener('click',()=>{state.selections={thumbs:false,full:false};save();paint();});
  $('[data-offline-prepare]')?.addEventListener('click',()=>prepare(false));
  $('[data-offline-retry]')?.addEventListener('click',()=>prepare(true));
  $('[data-offline-check]')?.addEventListener('click',()=>check());
  $('[data-offline-clear-images]')?.addEventListener('click',()=>clear('images'));
  $('[data-offline-clear-all]')?.addEventListener('click',()=>clear('all'));
  $('[data-offline-install]')?.addEventListener('click',install);
  window.addEventListener('online',syncConnection);window.addEventListener('offline',syncConnection);
}

async function init(){
  await loadManifest();bind();syncInstallButton();syncConnection();paint();
  if(canSW())try{await ensureSW();await check({quiet:true});}catch{}
  if(!state.nudged){state.nudged=true;save();setTimeout(()=>showToast(`出門前可按「⇩ 離線準備」下載全部 ${window.PHOTO_TIPS?.length||0} 招`),1200);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
