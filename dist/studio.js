import {createCustomizationUI} from './customization-ui.js';
import {createWorldMap,mapFacilities} from './world-map.js';
import {closeDialog} from './ui-motion.js';
import {preparePanelOpen,syncPanelState} from './panels.js';
import {normalizeWardrobe,selectedItems} from './wardrobe.js';
import {islands,bridges} from './world-layout.js';
const defaults={light:'#bfd7ef',brightness:100,fur:'#f4eee5',furTop:null,fluff:100,roundness:50,accessory:'none'};
let saved={};try{saved=JSON.parse(localStorage.getItem('lab-appearance-v2'))||{};}catch{}
const validColor=v=>/^#[0-9a-f]{6}$/i.test(v);
const appearance={...defaults,...saved};for(const key of ['light','fur'])if(!validColor(appearance[key]))appearance[key]=defaults[key];
for(const [key,min,max] of [['brightness',55,150],['fluff',50,100],['roundness',0,100]])appearance[key]=Number.isFinite(+appearance[key])?Math.min(max,Math.max(min,+appearance[key])):defaults[key];
appearance.furTop=validColor(appearance.furTop)?appearance.furTop:null;appearance.accessory=normalizeWardrobe(appearance.accessory);
delete appearance.sunglasses;
window.labAppearance=appearance;
let winterSnapshot=null;window.addEventListener('lab:return-winter',()=>{if(winterSnapshot===null)return;appearance.accessory=normalizeWardrobe(selectedItems(winterSnapshot).filter(v=>!['ski','board'].includes(v)).join(','));winterSnapshot=null;update(false);});
window.addEventListener('lab:equip-winter',()=>{if(winterSnapshot===null)winterSnapshot=appearance.accessory;let items=selectedItems(appearance.accessory);if(!items.some(v=>['ski','board'].includes(v)))items.push('ski');if(!items.some(v=>['sunglasses','goggles'].includes(v)))items.push('goggles');if(!items.includes('helmet')){items=items.filter(v=>!['santa','bunny-ears','cat-ears','bear-ears'].includes(v));items.push('helmet');}appearance.accessory=normalizeWardrobe(items.join(','));update(false);});
window.addEventListener('lab:unequip-winter',()=>{if(winterSnapshot!==null){appearance.accessory=winterSnapshot;winterSnapshot=null;update(false);return;}appearance.accessory=normalizeWardrobe(selectedItems(appearance.accessory).filter(v=>!['ski','board'].includes(v)).join(','));update();});
const studio=document.getElementById('studio'),tabs=[...studio.querySelectorAll('[data-studio]')];
function update(persist=true){
  document.documentElement.style.setProperty('--light',appearance.light);

  document.getElementById('light-color').value=appearance.light;document.getElementById('light-level').value=appearance.brightness;document.getElementById('light-value').textContent=appearance.brightness+'%';
  studio.querySelectorAll('[data-light]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.light===appearance.light));
  const chosen=studio.querySelector('[data-light][aria-pressed=true]'),custom=studio.querySelector('.custom-color');custom.classList.toggle('selected',!chosen);custom.style.setProperty('--swatch',appearance.light);document.querySelector('#light-choice').textContent=chosen?chosen.getAttribute('aria-label'):'사용자 지정 · '+appearance.light.toUpperCase();
  window.dispatchEvent(new CustomEvent('lab:appearance',{detail:{...appearance}}));
  try{if(persist)localStorage.setItem('lab-appearance-v2',JSON.stringify(appearance));}catch{document.querySelector('.studio-saved').textContent='설정을 저장할 수 없습니다. 이 화면에서는 계속 적용됩니다.';}
}
const customization=createCustomizationUI(appearance,look=>{Object.assign(appearance,look);if(winterSnapshot!==null)winterSnapshot=look.accessory;update();});
function selectTab(id){if(id==='social'&&!window.labAdmin&&!document.body.classList.contains('invite-gate'))id='map';const names={map:['MAP','지도'],activities:['ACTIVITIES','활동'],light:['WEATHER & LIGHT','시간·날씨'],fluff:['CUSTOMIZE','커스터마이징'],audio:['SOUND','소리'],social:['INVITE','초대']};document.querySelector('#studio-section-en').textContent=names[id][0];document.querySelector('#studio-section-name').textContent=names[id][1];for(const b of tabs){const active=b.dataset.studio===id;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1;document.getElementById('pane-'+b.dataset.studio).hidden=!active;}tabs.find(button=>button.dataset.studio===id)?.scrollIntoView?.({block:'nearest',inline:'nearest'});if(id==='fluff')customization.open();else customization.close();window.labPreviewVisible=studio.open&&id==='fluff';window.dispatchEvent(new Event('lab:preview'));}
function openStudio(tab){preparePanelOpen(studio);if(!studio.open)studio.showModal();syncPanelState();selectTab(tab);window.labSound?.('open');}
function closeStudio(){if(document.body.classList.contains('invite-gate'))return;closeDialog(studio);}
window.openWinterSettings=openStudio;document.getElementById('hud-map').onclick=()=>openStudio('map');document.getElementById('open-settings').onclick=()=>openStudio('light');document.getElementById('close-studio').onclick=closeStudio;
studio.addEventListener('close',()=>{if(studio.open)return;syncPanelState();customization.close();window.labPreviewVisible=false;window.dispatchEvent(new Event('lab:preview'));if(!document.querySelector('dialog[open]'))document.querySelector('#open-settings').focus({preventScroll:true});window.dispatchEvent(new Event('lab:close'));window.labSound?.('close');});
studio.addEventListener('click',e=>{if(e.target===studio){const r=studio.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeStudio();}const b=e.target.closest('button');if(!b)return;if(b.dataset.studio){selectTab(b.dataset.studio);window.labSound?.('select');}if(b.dataset.light){appearance.light=b.dataset.light;update();window.labSound?.('select');}});
studio.querySelector('[role=tablist]').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const available=tabs.filter(b=>!b.hidden),current=available.indexOf(document.activeElement),index=e.key==='Home'?0:e.key==='End'?available.length-1:(current+(e.key==='ArrowRight'?1:-1)+available.length)%available.length;selectTab(available[index].dataset.studio);available[index].focus();});
for(const [id,key] of [['light-color','light'],['light-level','brightness']])document.getElementById(id).addEventListener('input',e=>{appearance[key]=key==='light'?e.target.value:Number(e.target.value);update();});

createWorldMap(document.getElementById('island-map'),id=>{closeStudio();const place=mapFacilities.find(p=>p.id===id);if(place?.travelId){window.travelToPlace?.(place.travelId,false);return;}const region=place?.region;window.travelToIsland?.({park:'park',ski:'alpine',spa:'spa',tree:'wish',museum:'philosophy'}[region]);});
update();

window.addEventListener('keydown',e=>{if(document.body.classList.contains('invite-gate')||e.code!=='KeyM'||e.repeat||e.metaKey||e.ctrlKey||e.altKey||e.target.closest?.('input,textarea,select,[contenteditable=true]')||document.querySelector('#learning').open)return;e.preventDefault();if(studio.open&&!document.querySelector('#pane-map').hidden)closeStudio();else openStudio('map');});

studio.addEventListener('cancel',e=>{e.preventDefault();closeStudio();});
// Escape closes the topmost interaction first; only an unobstructed game opens settings.
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape'||e.defaultPrevented||e.repeat||e.isComposing||document.body.classList.contains('invite-gate'))return;
 if(document.querySelector('dialog[open], [popover]:popover-open')||document.body.matches('.chat-typing,.emote-open')||document.querySelector('#tree-tools:not([hidden])'))return;
 if(e.target.closest?.('input,textarea,select,[contenteditable=true]'))return;
 e.preventDefault();openStudio('light');
});

window.addEventListener('lab:restore-appearance',e=>{const value=e.detail;if(!value)return;for(const key of ['fur','furTop','accessory','fluff','roundness'])if(value[key]!==undefined)appearance[key]=value[key];appearance.furTop=validColor(appearance.furTop)?appearance.furTop:null;appearance.accessory=normalizeWardrobe(appearance.accessory);update();customization.restore(appearance);});
