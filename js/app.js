(()=>{
'use strict';
const tips=Array.isArray(window.PHOTO_TIPS)?window.PHOTO_TIPS:[];
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

const PRIMARY=['全部','男生','女生','人像','風景','建築','夜景','動態','調色','攝影基礎'];
const SECONDARY=['全部','站姿','坐姿','全身','半身','低機位','高機位','廣角','長焦','抓拍','構圖','曝光','快門','閃光燈','逆光','人像模式','後製'];
const IMAGE_TYPES=['全部','人像圖','風景圖','建築圖','夜景圖','動態圖','教學圖'];
const IMAGE_TYPE_LABEL={portrait:'人像圖',landscape:'風景圖',architecture:'建築圖',night:'夜景圖',action:'動態圖',tutorial:'教學圖'};

let savedMode='source';
try{savedMode=localStorage.getItem('photo-tips-group-mode-v1')||'source';}catch{}
if(!['source','topic'].includes(savedMode))savedMode='source';

const state={
  primary:'全部',secondary:'全部',imageType:'全部',groupMode:savedMode,groupFilter:'',query:'',favoritesOnly:false,
  filtered:tips.slice(),readerPool:[],readerIndex:0,readerGroup:null
};
let favorites=new Set();
let seriesProgress={};
let swipeSuppressUntil=0;
try{favorites=new Set(JSON.parse(localStorage.getItem('photo-tips-favorites-v1')||'[]'));}catch{}
try{seriesProgress=JSON.parse(localStorage.getItem('photo-tips-series-progress-v4')||'{}')||{};}catch{}

function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function saveFav(){try{localStorage.setItem('photo-tips-favorites-v1',JSON.stringify([...favorites]));}catch{}updateFavCount();}
function saveProgress(){try{localStorage.setItem('photo-tips-series-progress-v4',JSON.stringify(seriesProgress));}catch{}}
function updateFavCount(){$('#fav-count').textContent=favorites.size;}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),1400);}
function imageTypeOf(t){return IMAGE_TYPE_LABEL[t.imageCategory]||'其他圖';}
function matchesPrimary(t,p){if(p==='全部')return true;if(p==='男生'||p==='女生')return t.genders.includes(p);return t.categories.includes(p);}
function matchesImageType(t,v){return v==='全部'||imageTypeOf(t)===v;}

function groupInfoForTip(t,mode=state.groupMode){
  if(mode==='topic')return {id:`topic:${t.topicSeries}`,label:t.topicSeries};
  return {id:`source:${t.sourceId}`,label:t.sourceSeries||t.series||t.sourceTitle};
}
function groupByMode(items,mode=state.groupMode){
  const map=new Map();
  for(const t of items){
    const info=groupInfoForTip(t,mode);
    if(!map.has(info.id))map.set(info.id,{id:info.id,label:info.label,items:[]});
    map.get(info.id).items.push(t);
  }
  return [...map.values()];
}
function groupProgressKey(group){return `${state.groupMode}|${group.id}`;}
function getStackIndex(group){
  const saved=Number(seriesProgress[groupProgressKey(group)]);
  const idx=group.items.findIndex(t=>t.id===saved);
  return idx>=0?idx:0;
}
function sourceCount(items){return new Set(items.map(t=>t.sourceId)).size;}

function renderFilters(){
  $('#primary-filters').innerHTML=PRIMARY.map(x=>`<button type="button" class="filter-chip" data-primary="${esc(x)}">${esc(x)}</button>`).join('');
  $('#secondary-filters').innerHTML=SECONDARY.map(x=>`<button type="button" class="filter-chip" data-secondary="${esc(x)}">${esc(x)}</button>`).join('');
  $('#image-filters').innerHTML=IMAGE_TYPES.map(x=>`<button type="button" class="filter-chip" data-imagetype="${esc(x)}">${esc(x)}</button>`).join('');
  renderGroupFilter();
}
function renderGroupFilter(){
  const groups=groupByMode(tips,state.groupMode);
  const select=$('#series-filter');
  const prefix=state.groupMode==='source'?'全部來源':'全部主題';
  select.innerHTML=`<option value="">${prefix}（${groups.length}）</option>`+groups.map(g=>`<option value="${esc(g.id)}">${esc(g.label)}</option>`).join('');
  if(!groups.some(g=>g.id===state.groupFilter))state.groupFilter='';
  select.value=state.groupFilter;
  $('#series-filter-label').textContent=state.groupMode==='source'?'來源系列':'主題系列';
}
function renderFiltersState(){
  $$('#primary-filters .filter-chip').forEach(b=>b.classList.toggle('is-active',b.dataset.primary===state.primary));
  $$('#secondary-filters .filter-chip').forEach(b=>b.classList.toggle('is-active',b.dataset.secondary===state.secondary));
  $$('#image-filters .filter-chip').forEach(b=>b.classList.toggle('is-active',b.dataset.imagetype===state.imageType));
  $$('.quick-card[data-primary]').forEach(b=>b.classList.toggle('is-active',b.dataset.primary===state.primary));
  $$('#group-mode-toggle [data-group-mode]').forEach(b=>b.classList.toggle('is-active',b.dataset.groupMode===state.groupMode));
  $('#group-mode-note').textContent=state.groupMode==='source'?'同一支來源影片放在一起':'把不同來源的相同拍法整理在一起';
  $('#fav-btn').setAttribute('aria-pressed',state.favoritesOnly?'true':'false');
  $('#series-filter').value=state.groupFilter;
}

function apply(){
  const q=state.query.trim().toLowerCase();
  state.filtered=tips.filter(t=>
    matchesPrimary(t,state.primary)&&
    (state.secondary==='全部'||t.tags.includes(state.secondary))&&
    matchesImageType(t,state.imageType)&&
    (!state.groupFilter||groupInfoForTip(t).id===state.groupFilter)&&
    (!state.favoritesOnly||favorites.has(t.id))&&
    (!q||[t.title,t.text,t.sourceSeries,t.sourceTitle,t.topicSeries,t.tags.join(' '),t.scenes.join(' '),t.genders.join(' '),imageTypeOf(t)].join(' ').toLowerCase().includes(q))
  );
  renderStacks();renderDesktopGroups();renderSummary();
}

function card(t){
  const meta=[imageTypeOf(t),...t.genders.slice(0,1),...t.categories.filter(x=>x!=='人像').slice(0,1),...t.tags.filter(x=>!['人像','風景','建築'].includes(x)).slice(0,1)].filter(Boolean).slice(0,4);
  return `<article class="tip-card" tabindex="0" data-tip="${t.id}" aria-label="第 ${t.id} 招 ${esc(t.title)}">
    <div class="tip-image"><img loading="lazy" decoding="async" src="${t.thumb}" alt="${esc(t.title)}"><span class="tip-no">${String(t.id).padStart(2,'0')}</span><button type="button" class="tip-fav${favorites.has(t.id)?' is-saved':''}" data-fav="${t.id}" aria-label="${favorites.has(t.id)?'取消收藏':'收藏'} ${esc(t.title)}">${favorites.has(t.id)?'♥':'♡'}</button></div>
    <div class="tip-copy"><div class="tip-meta">${meta.map((x,i)=>`<span class="mini-tag${i===0?' is-image-class':''}">${esc(x)}</span>`).join('')}</div><h3>${esc(t.title)}</h3><div class="tip-series">${esc(state.groupMode==='source'?t.sourceSeries:t.topicSeries)}</div><p>${esc(t.text)}</p></div>
  </article>`;
}

function stackMarkup(group){
  const idx=getStackIndex(group),t=group.items[idx];
  const prev=idx>0?group.items[idx-1]:null,next=idx<group.items.length-1?group.items[idx+1]:null;
  const meta=[imageTypeOf(t),...t.genders.slice(0,1),...t.tags.slice(0,1)].filter(Boolean).slice(0,3);
  const back2=group.items.length>2?`<div class="stack-back stack-back-two" aria-hidden="true"></div>`:'';
  const back1=group.items.length>1?`<div class="stack-back stack-back-one" aria-hidden="true"></div>`:'';
  const extra=state.groupMode==='source'?esc(t.sourceTitle):`來自 ${sourceCount(group.items)} 個來源`;
  return `<section class="series-stack" data-stack-group="${esc(group.id)}">
    <header class="series-stack-head"><div><span class="eyebrow">${state.groupMode==='source'?'SOURCE SERIES':'TOPIC SERIES'}</span><h3>${esc(group.label)}</h3><small>${extra}</small></div><span>${group.items.length} 招</span></header>
    <div class="stack-stage" data-stack-stage="${esc(group.id)}">${back2}${back1}
      <article class="series-card-main" tabindex="0" data-tip="${t.id}" data-group-id="${esc(group.id)}" aria-label="${esc(group.label)}，第 ${idx+1} 張，共 ${group.items.length} 張：${esc(t.title)}">
        <div class="series-card-image"><img draggable="false" src="${t.thumb}" alt="${esc(t.title)}"><span class="series-tip-no">TIP ${String(t.id).padStart(2,'0')}</span><button type="button" class="tip-fav series-fav${favorites.has(t.id)?' is-saved':''}" data-fav="${t.id}" aria-label="${favorites.has(t.id)?'取消收藏':'收藏'} ${esc(t.title)}">${favorites.has(t.id)?'♥':'♡'}</button></div>
        <div class="series-card-copy"><div class="series-card-tags">${meta.map(x=>`<span>${esc(x)}</span>`).join('')}</div><h4>${esc(t.title)}</h4><p>${esc(t.text)}</p></div>
      </article>
    </div>
    <footer class="series-stack-foot"><button type="button" class="stack-arrow" data-stack-prev="${esc(group.id)}" ${prev?'':'disabled'} aria-label="上一張">←</button><div class="stack-progress"><b>${idx+1} / ${group.items.length}</b><span>${group.items.length>1?'左右滑動 · 點開看完整系列':'點開看完整技巧'}</span></div><button type="button" class="stack-arrow" data-stack-next="${esc(group.id)}" ${next?'':'disabled'} aria-label="下一張">→</button></footer>
  </section>`;
}
function renderStacks(){
  const groups=groupByMode(state.filtered),el=$('#series-stacks');
  el.innerHTML=groups.map(stackMarkup).join('');el.hidden=state.filtered.length===0;$('#empty').hidden=state.filtered.length>0;
}

function desktopGroupMarkup(group){
  const imageTypes=[...new Set(group.items.map(imageTypeOf))];
  const sub=state.groupMode==='source'
    ? `${group.items.length} 招 · ${esc(group.items[0]?.sourceTitle||group.label)}`
    : `${group.items.length} 招 · 來自 ${sourceCount(group.items)} 個來源`;
  return `<section class="series-panel" data-desktop-group="${esc(group.id)}">
    <header class="series-panel-head"><div><span class="eyebrow">${state.groupMode==='source'?'SOURCE SERIES':'TOPIC SERIES'}</span><h3>${esc(group.label)}</h3><div class="series-panel-sub">${sub}</div></div><button type="button" class="series-only-btn" data-group-only="${esc(group.id)}">只看這個${state.groupMode==='source'?'來源':'主題'}</button></header>
    <div class="series-type-row">${imageTypes.map(x=>`<span class="series-type-chip">${esc(x)}</span>`).join('')}</div>
    <div class="series-panel-grid">${group.items.map(card).join('')}</div>
  </section>`;
}
function renderDesktopGroups(){
  const groups=groupByMode(state.filtered),el=$('#series-desktop');
  el.innerHTML=groups.map(desktopGroupMarkup).join('');el.hidden=state.filtered.length===0;
  $('#tips-grid').innerHTML='';$('#tips-grid').hidden=true;
  $('#result-count').textContent=`${state.filtered.length} 招 · ${groups.length} ${state.groupMode==='source'?'來源':'主題'}`;
}

function renderSummary(){
  const active=[];
  if(state.primary!=='全部')active.push(state.primary);if(state.secondary!=='全部')active.push(state.secondary);if(state.imageType!=='全部')active.push(state.imageType);
  if(state.groupFilter){const g=groupByMode(tips).find(x=>x.id===state.groupFilter);if(g)active.push(g.label);}
  if(state.query)active.push(`「${state.query}」`);if(state.favoritesOnly)active.push('我的收藏');
  const el=$('#active-summary');el.hidden=!active.length;el.textContent=active.length?`目前篩選：${active.join(' · ')}`:'';
  const modeTitle=state.groupMode==='source'?'來源系列':'主題系列';
  $('#tips-title').textContent=state.favoritesOnly?'我的收藏':state.primary==='全部'?modeTitle:`${state.primary} · ${modeTitle}`;
}
function setPrimary(v){state.primary=v;renderFiltersState();apply();$('#tips').scrollIntoView({behavior:'smooth',block:'start'});}
function setGroupMode(v){
  if(!['source','topic'].includes(v)||v===state.groupMode)return;
  state.groupMode=v;state.groupFilter='';
  try{localStorage.setItem('photo-tips-group-mode-v1',v);}catch{}
  renderGroupFilter();renderFiltersState();apply();
}
function reset(){state.primary='全部';state.secondary='全部';state.imageType='全部';state.groupFilter='';state.query='';state.favoritesOnly=false;$('#search').value='';renderFiltersState();apply();}
function toggleFav(id){if(favorites.has(id)){favorites.delete(id);toast('已取消收藏');}else{favorites.add(id);toast('已加入收藏');}saveFav();apply();if($('#reader').open)renderReader();}

function getReaderTip(){return state.readerPool[state.readerIndex]||null;}
function openReader(id){
  const target=tips.find(t=>t.id===id);if(!target)return;
  const info=groupInfoForTip(target);
  state.readerPool=tips.filter(t=>groupInfoForTip(t).id===info.id);
  state.readerIndex=Math.max(0,state.readerPool.findIndex(t=>t.id===id));
  state.readerGroup={...info,mode:state.groupMode};
  seriesProgress[`${state.groupMode}|${info.id}`]=id;saveProgress();
  renderReader();const d=$('#reader');if(!d.open){if(d.showModal)d.showModal();else d.setAttribute('open','');}$('#reader-scroll').scrollTop=0;
}
function renderReader(direction=''){
  const t=getReaderTip();if(!t)return;
  $('#reader-head-title').textContent=state.readerGroup?.label||groupInfoForTip(t).label;
  const pills=[`<span class="reader-pill accent">${esc(imageTypeOf(t))}</span>`,...t.genders.map(x=>`<span class="reader-pill accent">${esc(x)}</span>`),...t.categories.map(x=>`<span class="reader-pill">${esc(x)}</span>`),...t.tags.slice(0,4).map(x=>`<span class="reader-pill">${esc(x)}</span>`)].join('');
  const details=[['圖片分類',imageTypeOf(t)],['來源系列',t.sourceSeries],['主題系列',t.topicSeries]];
  if(t.scenes.length)details.push(['場景',t.scenes.join('、')]);if(t.tags.length)details.push(['拍法',t.tags.slice(0,6).join('、')]);if(t.genders.length)details.push(['畫面人物',t.genders.join('、')]);
  $('#reader-scroll').innerHTML=`<article class="reader-article${direction?' reader-'+direction:''}"><figure class="reader-figure"><img src="${t.image}" alt="${esc(t.title)}"><span class="reader-number">TIP ${String(t.id).padStart(2,'0')}</span></figure><div class="reader-copy"><div class="reader-kicker">${pills}</div><h2>${esc(t.title)}</h2><p class="reader-intro">${esc(t.text)}</p><div class="reader-grid">${details.map(([a,b])=>`<div class="reader-detail"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}</div><div class="reader-source"><span>${esc(t.sourceTitle||t.sourceLabel||'原始影片')}</span><a href="${esc(t.source)}" target="_blank" rel="noopener noreferrer">查看來源 ↗</a></div><button type="button" class="reader-save${favorites.has(t.id)?' is-saved':''}" data-reader-fav="${t.id}">${favorites.has(t.id)?'♥ 已收藏':'♡ 收藏這招'}</button></div></article>`;
  $('#reader-pos').textContent=`${state.readerIndex+1} / ${state.readerPool.length} · ${state.readerGroup?.mode==='topic'?'主題':'來源'}內左右滑動`;
  $$('#reader [data-reader-nav]').forEach(b=>{b.disabled=(b.dataset.readerNav==='prev'?state.readerIndex<=0:state.readerIndex>=state.readerPool.length-1);});
}
function navReader(dir){
  const n=state.readerIndex+(dir==='prev'?-1:1);if(n<0||n>=state.readerPool.length)return;state.readerIndex=n;
  const t=getReaderTip();if(t&&state.readerGroup){seriesProgress[`${state.readerGroup.mode}|${state.readerGroup.id}`]=t.id;saveProgress();}
  renderReader(dir);$('#reader-scroll').scrollTop=0;renderStacks();
}
function moveStack(groupId,dir){
  const group=groupByMode(state.filtered).find(g=>g.id===groupId);if(!group)return false;const idx=getStackIndex(group),next=idx+(dir==='prev'?-1:1);if(next<0||next>=group.items.length)return false;
  seriesProgress[groupProgressKey(group)]=group.items[next].id;saveProgress();renderStacks();return true;
}

function bindStackSwipe(){
  let active=null;
  $('#series-stacks').addEventListener('touchstart',e=>{const card=e.target.closest('.series-card-main');if(!card||e.target.closest('button'))return;const t=e.changedTouches[0];active={card,groupId:card.dataset.groupId,sx:t.clientX,sy:t.clientY,dx:0,dragging:false};card.classList.add('is-touching');},{passive:true});
  $('#series-stacks').addEventListener('touchmove',e=>{if(!active)return;const t=e.changedTouches[0],dx=t.clientX-active.sx,dy=t.clientY-active.sy;if(!active.dragging&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)*1.05)active.dragging=true;if(!active.dragging)return;active.dx=dx;active.card.style.transform=`translateX(${dx}px) rotate(${Math.max(-4,Math.min(4,dx/45))}deg)`;active.card.style.transition='none';},{passive:true});
  $('#series-stacks').addEventListener('touchend',()=>{if(!active)return;const a=active;active=null;a.card.classList.remove('is-touching');const should=a.dragging&&Math.abs(a.dx)>55;if(should){const dir=a.dx>0?'prev':'next';const g=groupByMode(state.filtered).find(x=>x.id===a.groupId),idx=g?getStackIndex(g):0;const valid=g&&(dir==='prev'?idx>0:idx<g.items.length-1);if(valid){swipeSuppressUntil=Date.now()+350;a.card.style.transition='transform .16s ease, opacity .16s ease';a.card.style.transform=`translateX(${a.dx>0?'115%':'-115%'}) rotate(${a.dx>0?5:-5}deg)`;a.card.style.opacity='.15';setTimeout(()=>moveStack(a.groupId,dir),150);return;}}a.card.style.transition='transform .22s cubic-bezier(.2,.8,.2,1)';a.card.style.transform='';setTimeout(()=>{if(a.card)a.card.style.transition='';},230);},{passive:true});
  $('#series-stacks').addEventListener('touchcancel',()=>{if(active){active.card.style.transform='';active.card.classList.remove('is-touching');active=null;}},{passive:true});
}

function initEvents(){
  document.addEventListener('click',e=>{
    const b=e.target.closest('button'),stackCard=e.target.closest('.series-card-main'),c=e.target.closest('.tip-card');
    if(b?.dataset.fav){e.stopPropagation();toggleFav(Number(b.dataset.fav));return;}if(b?.dataset.readerFav){toggleFav(Number(b.dataset.readerFav));return;}
    if(b?.dataset.stackPrev){moveStack(b.dataset.stackPrev,'prev');return;}if(b?.dataset.stackNext){moveStack(b.dataset.stackNext,'next');return;}
    if(b?.dataset.groupMode){setGroupMode(b.dataset.groupMode);return;}if(b?.dataset.groupOnly){state.groupFilter=b.dataset.groupOnly;renderFiltersState();apply();$('#tips').scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(b?.dataset.primary){setPrimary(b.dataset.primary);return;}if(b?.dataset.secondary){state.secondary=b.dataset.secondary;renderFiltersState();apply();return;}if(b?.dataset.imagetype){state.imageType=b.dataset.imagetype;renderFiltersState();apply();return;}
    if(b?.hasAttribute('data-reset')){reset();return;}if(b?.hasAttribute('data-reader-close')){$('#reader').close();return;}if(b?.dataset.readerNav){navReader(b.dataset.readerNav);return;}
    if(stackCard&&!b){if(Date.now()<swipeSuppressUntil)return;openReader(Number(stackCard.dataset.tip));return;}if(c&&!b){openReader(Number(c.dataset.tip));}
  });
  document.addEventListener('keydown',e=>{const c=e.target.closest?.('.tip-card,.series-card-main');if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openReader(Number(c.dataset.tip));}if($('#reader').open&&e.key==='ArrowLeft')navReader('prev');if($('#reader').open&&e.key==='ArrowRight')navReader('next');});
  $('#search').addEventListener('input',e=>{state.query=e.target.value;apply();});$('#clear-search').addEventListener('click',()=>{$('#search').value='';state.query='';apply();});
  $('#series-filter').addEventListener('change',e=>{state.groupFilter=e.target.value;apply();});$('#reset-btn').addEventListener('click',reset);$('#fav-btn').addEventListener('click',()=>{state.favoritesOnly=!state.favoritesOnly;renderFiltersState();apply();});
  $('#random-btn').addEventListener('click',()=>{const pool=state.filtered.length?state.filtered:tips;if(!pool.length)return;const t=pool[Math.floor(Math.random()*pool.length)];openReader(t.id);});
  $('#theme-btn').addEventListener('click',()=>{const n=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=n;localStorage.setItem('photo-tips-theme-v1',n);});
  $('#reader').addEventListener('click',e=>{if(e.target===$('#reader'))$('#reader').close();});
  let sx=0,sy=0;$('#reader-scroll').addEventListener('touchstart',e=>{const t=e.changedTouches[0];sx=t.clientX;sy=t.clientY;},{passive:true});$('#reader-scroll').addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.25)navReader(dx>0?'prev':'next');},{passive:true});
  bindStackSwipe();
}
function init(){renderFilters();renderFiltersState();updateFavCount();apply();initEvents();if(location.protocol.startsWith('http')&&'serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
