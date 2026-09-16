(()=>{
'use strict';
const KEY='photo-tips-ui-layout-v1';
const VALID=new Set(['mobile','desktop']);
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

function read(){
  try{const v=localStorage.getItem(KEY);return VALID.has(v)?v:'mobile';}catch{return 'mobile';}
}
function save(v){try{localStorage.setItem(KEY,v);}catch{}}
function sync(){
  const mode=read();
  document.documentElement.dataset.uiLayout=mode;
  $$('[data-ui-layout-select]').forEach(el=>{el.value=mode;});
  $$('[data-layout-current]').forEach(el=>{el.textContent=`目前：${mode==='desktop'?'電腦版':'手機版'}`;});
}
function open(){
  const d=$('#settings-dialog');if(!d)return;sync();
  if(!d.open){d.showModal?.();if(!d.open)d.setAttribute('open','');}
}
function close(){const d=$('#settings-dialog');if(d?.open)d.close();}
function setMode(mode){
  if(!VALID.has(mode))return;
  const previous=read();
  save(mode);sync();
  if(previous!==mode){
    const label=mode==='desktop'?'電腦版':'手機版';
    const current=$('[data-layout-current]');if(current)current.textContent=`正在切換為${label}…`;
    setTimeout(()=>location.reload(),160);
  }
}
function init(){
  sync();
  $('#settings-btn')?.addEventListener('click',open);
  $$('[data-settings-close]').forEach(b=>b.addEventListener('click',close));
  $('#settings-dialog')?.addEventListener('click',e=>{if(e.target===$('#settings-dialog'))close();});
  $$('[data-ui-layout-select]').forEach(s=>s.addEventListener('change',e=>setMode(e.target.value)));
  $$('[data-app-check-update]').forEach(b=>b.addEventListener('click',()=>{if(window.PhotoTipsUpdateSystem?.checkNow)window.PhotoTipsUpdateSystem.checkNow(b);}));
  $$('[data-app-force-reload]').forEach(b=>b.addEventListener('click',()=>{if(window.PhotoTipsUpdateSystem?.forceReload)window.PhotoTipsUpdateSystem.forceReload(b);else setTimeout(()=>location.reload(),160);}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
