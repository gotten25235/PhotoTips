(()=>{
'use strict';

const LAYOUT_STORAGE_KEY='photo-tips-ui-layout-v1';
const THEME_STORAGE_KEY='photo-tips-color-theme-v1';
const VALID_LAYOUTS=new Set(['mobile','desktop']);
const VALID_THEMES=new Set(['system','light','dark']);
const darkScheme=window.matchMedia?.('(prefers-color-scheme: dark)');
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
let storageAvailable=true;

function readLayout(){
  try{
    const value=localStorage.getItem(LAYOUT_STORAGE_KEY);
    if(VALID_LAYOUTS.has(value))return value;
    localStorage.setItem(LAYOUT_STORAGE_KEY,'mobile');
    return 'mobile';
  }catch{storageAvailable=false;return 'mobile';}
}
function readTheme(){
  try{
    const value=localStorage.getItem(THEME_STORAGE_KEY);
    if(VALID_THEMES.has(value))return value;
    localStorage.setItem(THEME_STORAGE_KEY,'system');
    return 'system';
  }catch{storageAvailable=false;return 'system';}
}
function save(key,value){
  try{localStorage.setItem(key,value);return true;}
  catch{storageAvailable=false;return false;}
}

let mode=readLayout();
let theme=readTheme();

function resolvedTheme(){
  if(theme==='dark'||theme==='light')return theme;
  return darkScheme?.matches?'dark':'light';
}
function syncTheme(){
  const resolved=resolvedTheme();
  const root=document.documentElement;
  const schemeValue=theme==='light'?'only light':theme==='dark'?'dark':'light dark';
  root.dataset.themePreference=theme;
  root.dataset.theme=resolved;
  root.style.colorScheme=schemeValue;
  $$('[data-color-theme-select]').forEach(select=>{select.value=theme;});
  const schemeMeta=document.querySelector('meta[name="color-scheme"]');
  if(schemeMeta)schemeMeta.setAttribute('content',schemeValue);
  const themeMeta=document.querySelector('meta[name="theme-color"]');
  if(themeMeta)themeMeta.setAttribute('content',resolved==='dark'?'#0a1412':'#f5f3ec');
  window.dispatchEvent(new CustomEvent('phototips:theme-change',{detail:{preference:theme,resolved}}));
}
function syncLayout(){
  document.documentElement.dataset.uiLayout=mode;
  $$('[data-ui-layout-select]').forEach(select=>{select.value=mode;});
  $$('[data-layout-current]').forEach(el=>{el.textContent=`目前：${mode==='desktop'?'電腦版':'手機版'}`;});
}
function sync(){syncTheme();syncLayout();}

function open(){
  const d=$('#settings-dialog');if(!d)return;sync();
  if(!d.open){d.showModal?.();if(!d.open)d.setAttribute('open','');}
}
function close(){const d=$('#settings-dialog');if(d?.open)d.close();}
function setLayout(value){
  if(!VALID_LAYOUTS.has(value)||value===mode){syncLayout();return false;}
  mode=value;save(LAYOUT_STORAGE_KEY,mode);syncLayout();return true;
}
function setTheme(value){
  if(!VALID_THEMES.has(value)||value===theme){syncTheme();return false;}
  theme=value;save(THEME_STORAGE_KEY,theme);syncTheme();return true;
}
function toast(message){
  const el=$('#toast');if(!el||!message)return;
  el.textContent=message;el.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('show'),1500);
}

function init(){
  sync();
  $('#settings-btn')?.addEventListener('click',open);
  $$('[data-settings-close]').forEach(b=>b.addEventListener('click',close));
  $('#settings-dialog')?.addEventListener('click',e=>{if(e.target===$('#settings-dialog'))close();});
  $$('[data-color-theme-select]').forEach(select=>select.addEventListener('change',e=>{
    if(setTheme(e.target.value)){
      const label=theme==='system'?'系統預設':theme==='light'?'淺色主題':'深色主題';
      toast(`主題已切換為${label}`);
    }
  }));
  $$('[data-ui-layout-select]').forEach(select=>select.addEventListener('change',e=>{
    if(setLayout(e.target.value)){
      toast(`介面已切換為${mode==='desktop'?'電腦版':'手機版'}，正在重新載入…`);
      setTimeout(()=>location.reload(),180);
    }
  }));
  $$('[data-app-check-update]').forEach(b=>b.addEventListener('click',()=>{if(window.PhotoTipsUpdateSystem?.checkNow)window.PhotoTipsUpdateSystem.checkNow(b);}));
  $$('[data-app-force-reload]').forEach(b=>b.addEventListener('click',()=>{if(window.PhotoTipsUpdateSystem?.forceReload)window.PhotoTipsUpdateSystem.forceReload(b);else setTimeout(()=>location.reload(),160);}));
}

const onSystemThemeChange=()=>{if(theme==='system')syncTheme();};
try{darkScheme?.addEventListener?.('change',onSystemThemeChange);}catch{try{darkScheme?.addListener?.(onSystemThemeChange);}catch{}}

window.PhotoTipsSettingsSystem={
  sync,
  getLayout:()=>mode,
  getTheme:()=>theme,
  getResolvedTheme:()=>resolvedTheme(),
  isStorageAvailable:()=>storageAvailable,
  storageKey:LAYOUT_STORAGE_KEY,
  themeStorageKey:THEME_STORAGE_KEY
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
