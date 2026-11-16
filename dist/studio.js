import {closeDialog} from './ui-motion.js';
import {normalizeWardrobe,selectedItems,toggleItem} from './wardrobe.js';
import {islands,bridges} from './world-layout.js';
const defaults={light:'#c5c8ea',brightness:100,fur:'#f4eee5',fluff:100,roundness:50,accessory:'none'};
let saved={};try{saved=JSON.parse(localStorage.getItem('lab-appearance-v2'))||{};}catch{}
const validColor=v=>/^#[0-9a-f]{6}$/i.test(v);
const appearance={...defaults,...saved};for(const key of ['light','fur'])if(!validColor(appearance[key]))appearance[key]=defaults[key];
for(const [key,min,max] of [['brightness',55,150],['fluff',50,100],['roundness',0,100]])appearance[key]=Number.isFinite(+appearance[key])?Math.min(max,Math.max(min,+appearance[key])):defaults[key];
appearance.accessory=normalizeWardrobe(appearance.accessory);
delete appearance.sunglasses;
window.labAppearance=appearance;
window.addEventListener('lab:equip-winter',()=>{let items=selectedItems(appearance.accessory);if(!items.some(v=>['ski','board'].includes(v)))items.push('ski');if(!items.some(v=>['sunglasses','goggles'].includes(v)))items.push('goggles');if(!items.includes('helmet')){items=items.filter(v=>!['santa','bunny-ears','cat-ears','bear-ears'].includes(v));items.push('helmet');}appearance.accessory=normalizeWardrobe(items.join(','));update();});
const studio=document.getElementById('studio'),tabs=[...studio.querySelectorAll('[data-studio]')];
function update(){
  document.documentElement.style.setProperty('--light',appearance.light);

  document.getElementById('light-color').value=appearance.light;document.getElementById('light-level').value=appearance.brightness;document.getElementById('light-value').textContent=appearance.brightness+'%';document.getElementById('fur-length').value=appearance.fluff;document.getElementById('roundness').value=appearance.roundness;
  for(const key of ['light','fur','accessory'])studio.querySelectorAll('[data-'+key+']').forEach(b=>b.setAttribute('aria-pressed',key==='accessory'?(b.dataset[key]==='none'?appearance.accessory==='none':selectedItems(appearance.accessory).includes(b.dataset[key])):b.dataset[key]===appearance[key]));
  studio.querySelector('[data-reset-eyes]')?.setAttribute('aria-pressed',!selectedItems(appearance.accessory).some(v=>v.startsWith('eyes-')));
  window.dispatchEvent(new CustomEvent('lab:appearance',{detail:{...appearance}}));
  try{localStorage.setItem('lab-appearance-v2',JSON.stringify(appearance));}catch{document.querySelector('.studio-saved').textContent='설정을 저장할 수 없습니다. 이 화면에서는 계속 적용됩니다.';}
}
function selectTab(id){for(const b of tabs){const active=b.dataset.studio===id;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1;document.getElementById('pane-'+b.dataset.studio).hidden=!active;}window.labPreviewVisible=studio.open&&id==='fluff';window.dispatchEvent(new Event('lab:preview'));}
function openStudio(tab){document.getElementById('park-menu').open=false;window.dismissParkDiscovery?.();if(!studio.open)studio.showModal();document.body.classList.add('studio-open');selectTab(tab);window.dispatchEvent(new Event('lab:pause'));window.labSound?.('open');}
function closeStudio(){if(document.body.classList.contains('invite-gate'))return;closeDialog(studio);}
document.getElementById('open-social').onclick=()=>openStudio('social');document.getElementById('open-map').onclick=()=>openStudio('map');document.getElementById('open-wardrobe').onclick=()=>openStudio('fluff');document.getElementById('open-settings').onclick=()=>openStudio('light');document.getElementById('close-studio').onclick=closeStudio;
studio.addEventListener('close',()=>{document.body.classList.remove('studio-open');window.labPreviewVisible=false;window.dispatchEvent(new Event('lab:preview'));document.querySelector('#park-menu summary').focus({preventScroll:true});window.labSound?.('close');});
studio.addEventListener('click',e=>{if(e.target===studio){const r=studio.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeStudio();}const b=e.target.closest('button');if(!b)return;if(b.dataset.studio){selectTab(b.dataset.studio);window.labSound?.('select');}for(const key of ['light','fur','accessory'])if(b.dataset[key]){appearance[key]=key==='accessory'?toggleItem(appearance[key],b.dataset[key]):b.dataset[key];update();window.labSound?.('select');}});
studio.querySelector('[role=tablist]').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const current=tabs.indexOf(document.activeElement),index=e.key==='Home'?0:e.key==='End'?tabs.length-1:(current+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;selectTab(tabs[index].dataset.studio);tabs[index].focus();});
for(const [id,key] of [['light-color','light'],['light-level','brightness'],['fur-length','fluff'],['roundness','roundness']])document.getElementById(id).addEventListener('input',e=>{appearance[key]=key==='light'?e.target.value:Number(e.target.value);update();});

const map=document.getElementById('island-map');
const mapPositions={alpine:[50,8],science:[50,28],history:[15,42],law:[85,42],park:[50,51],art:[15,68],philosophy:[85,68],nature:[50,76],spa:[50,95],wish:[85,88]};
const point=i=>({x:mapPositions[i.id][0],y:mapPositions[i.id][1]});
map.innerHTML='<svg class="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+bridges.map(([a,b])=>{const p=point(a),q=point(b);return `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`;}).join('')+'</svg>'+islands.filter(i=>!i.hidden).map(i=>{const p=point(i);return `<button data-island="${i.id}" aria-label="${i.name} 이동" style="--island:${i.color};left:${p.x}%;top:${p.y}%"><span class="island-dot"></span><span>${i.name}<small>${i.subject}</small></span></button>`;}).join('');
map.addEventListener('click',e=>{const b=e.target.closest('[data-island]');if(b&&window.travelToIsland){closeStudio();window.travelToIsland(b.dataset.island);}});
window.addEventListener('lab:region',e=>map.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',b.dataset.island===e.detail?'location':'false')));
update();

window.addEventListener('keydown',e=>{if(document.body.classList.contains('invite-gate')||e.code!=='KeyM'||e.repeat||e.metaKey||e.ctrlKey||e.altKey||e.target.closest?.('input,textarea,select,[contenteditable=true]')||document.querySelector('#learning').open)return;e.preventDefault();if(studio.open&&!document.querySelector('#pane-map').hidden)closeStudio();else openStudio('map');});
function fillPlaces(){const box=document.querySelector('#winter-places');box.replaceChildren();for(const place of window.labWinter?.destinations||[]){const b=document.createElement('button');b.textContent=place.name;b.onclick=()=>{closeStudio();window.travelToPlace?.(place.id)};box.append(b);}}
window.addEventListener('lab:winter-ready',fillPlaces);fillPlaces();

studio.addEventListener('click',e=>{const tab=e.target.closest('[data-custom-tab]');if(tab){studio.querySelectorAll('[data-custom-tab]').forEach(b=>b.setAttribute('aria-pressed',b===tab));studio.querySelectorAll('[data-custom-panel]').forEach(p=>p.hidden=p.dataset.customPanel!==tab.dataset.customTab);}if(e.target.closest('[data-reset-eyes]')){appearance.accessory=normalizeWardrobe(selectedItems(appearance.accessory).filter(v=>!v.startsWith('eyes-')).join(','));update();}});

studio.addEventListener('cancel',e=>{e.preventDefault();closeStudio();});
