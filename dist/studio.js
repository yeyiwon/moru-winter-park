import {islands,bridges} from './world-layout.js';
const defaults={light:'#c5c8ea',brightness:100,fur:'#e9e1d6',fluff:100,roundness:50,accessory:'none'};
let saved={};try{saved=JSON.parse(localStorage.getItem('lab-appearance-v2'))||{};}catch{}
const validColor=v=>/^#[0-9a-f]{6}$/i.test(v);
const appearance={...defaults,...saved};for(const key of ['light','fur'])if(!validColor(appearance[key]))appearance[key]=defaults[key];
for(const [key,min,max] of [['brightness',55,150],['fluff',50,100],['roundness',0,100]])appearance[key]=Number.isFinite(+appearance[key])?Math.min(max,Math.max(min,+appearance[key])):defaults[key];
if(!['none','star','ribbon'].includes(appearance.accessory))appearance.accessory='none';
window.labAppearance=appearance;
const studio=document.getElementById('studio'),tabs=[...studio.querySelectorAll('[data-studio]')];
function update(){
  document.documentElement.style.setProperty('--light',appearance.light);
  document.getElementById('light-color').value=appearance.light;document.getElementById('light-level').value=appearance.brightness;document.getElementById('light-value').textContent=appearance.brightness+'%';document.getElementById('fur-length').value=appearance.fluff;document.getElementById('roundness').value=appearance.roundness;
  for(const key of ['light','fur','accessory'])studio.querySelectorAll('[data-'+key+']').forEach(b=>b.setAttribute('aria-pressed',b.dataset[key]===appearance[key]));
  window.dispatchEvent(new CustomEvent('lab:appearance',{detail:{...appearance}}));
  try{localStorage.setItem('lab-appearance-v2',JSON.stringify(appearance));}catch{document.querySelector('.studio-saved').textContent='설정을 저장할 수 없습니다. 이 화면에서는 계속 적용됩니다.';}
}
function selectTab(id){for(const b of tabs){const active=b.dataset.studio===id;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1;document.getElementById('pane-'+b.dataset.studio).hidden=!active;}window.labPreviewVisible=studio.open&&id==='fluff';window.dispatchEvent(new Event('lab:preview'));}
function openStudio(tab){document.getElementById('park-menu').open=false;window.dismissParkDiscovery?.();studio.showModal();document.body.classList.add('studio-open');selectTab(tab);window.dispatchEvent(new Event('lab:pause'));window.labSound?.('open');}
function closeStudio(){studio.close();}
document.getElementById('open-map').onclick=()=>openStudio('map');document.getElementById('open-settings').onclick=()=>openStudio('light');document.getElementById('close-studio').onclick=closeStudio;
studio.addEventListener('close',()=>{document.body.classList.remove('studio-open');window.labPreviewVisible=false;window.dispatchEvent(new Event('lab:preview'));document.querySelector('#park-menu summary').focus({preventScroll:true});window.labSound?.('close');});
studio.addEventListener('click',e=>{if(e.target===studio){const r=studio.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeStudio();}const b=e.target.closest('button');if(!b)return;if(b.dataset.studio){selectTab(b.dataset.studio);window.labSound?.('select');}for(const key of ['light','fur','accessory'])if(b.dataset[key]){appearance[key]=b.dataset[key];update();window.labSound?.('select');}});
studio.querySelector('[role=tablist]').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const current=tabs.indexOf(document.activeElement),index=e.key==='Home'?0:e.key==='End'?tabs.length-1:(current+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;selectTab(tabs[index].dataset.studio);tabs[index].focus();});
for(const [id,key] of [['light-color','light'],['light-level','brightness'],['fur-length','fluff'],['roundness','roundness']])document.getElementById(id).addEventListener('input',e=>{appearance[key]=key==='light'?e.target.value:Number(e.target.value);update();});
const map=document.getElementById('island-map');
const point=i=>({x:50+i.x/46*35,y:49+i.z/53*36});
map.innerHTML='<svg class="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+bridges.map(([a,b])=>{const p=point(a),q=point(b);return `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`;}).join('')+'</svg>'+islands.map(i=>{const p=point(i);return `<button data-island="${i.id}" aria-label="${i.name}으로 이동" style="--island:${i.color};left:${p.x}%;top:${p.y}%"><span class="island-dot"></span><span>${i.name}<small>${i.subject}</small></span></button>`;}).join('');
map.addEventListener('click',e=>{const b=e.target.closest('[data-island]');if(b&&window.travelToIsland){closeStudio();window.travelToIsland(b.dataset.island);}});
window.addEventListener('lab:region',e=>map.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',b.dataset.island===e.detail?'location':'false')));
update();
