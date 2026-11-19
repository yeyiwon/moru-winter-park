import {paintSwatches} from './color-swatches.js';
import {wardrobeSlots,wardrobeCategories,furPalettes,selectedItems,toggleItem,clearSlot} from './wardrobe.js';
import {wardrobeIcon} from './wardrobe-icons.js';
import {createAppearanceDraft} from './appearance-draft.js';
export function createCustomizationUI(initial,commit){
 const root=document.getElementById('pane-fluff'),tabs=root.querySelector('.wardrobe-tabs'),options=root.querySelector('#wardrobe-options'),status=root.querySelector('#wardrobe-status'),save=root.querySelector('#wardrobe-save'),cancel=root.querySelector('#wardrobe-cancel');
 let category='color',palette=0,dyeTarget='fur',active=false,success=false;
 const editor=createAppearanceDraft(initial,{save:look=>window.saveWinterAppearance?window.saveWinterAppearance(look):Promise.reject(Error('공간에 연결한 뒤 다시 저장해 주세요.')),commit,changed:renderState});
 for(const [id,label] of wardrobeCategories){const b=document.createElement('button');b.type='button';b.id='wardrobe-tab-'+id;b.dataset.category=id;b.setAttribute('role','tab');b.setAttribute('aria-controls','wardrobe-options');b.textContent=label;tabs.append(b);}
 const card=(id,label,slot)=>`<button type="button" ${id?`data-accessory="${id}"`:`data-clear-slot="${slot}"`} aria-pressed="false"><span class="wardrobe-symbol">${wardrobeIcon(id||(slot==='eyes'?'basic-eyes':'none'))}</span><span>${label}</span><i aria-hidden="true">✓</i></button>`;
 function renderOptions(){
  for(const b of tabs.children){const chosen=b.dataset.category===category;b.setAttribute('aria-selected',chosen);b.tabIndex=chosen?0:-1;}
  options.setAttribute('aria-labelledby','wardrobe-tab-'+category);options.scrollTop=0;
  if(category==='color'){
   const look=editor.state().draft,gradient=!!look.furTop;if(!gradient)dyeTarget='fur';
   options.innerHTML=`<div class="dye-mode" role="group" aria-label="털 색 표현"><button data-dye-mode="solid" aria-pressed="${!gradient}">단색</button><button data-dye-mode="gradient" aria-pressed="${gradient}">그라데이션</button></div>${gradient?`<div class="dye-targets" role="group" aria-label="그라데이션 색 선택"><button data-dye-target="furTop" aria-pressed="${dyeTarget==='furTop'}"><span style="--swatch:${look.furTop}"></span>머리</button><button data-dye-target="fur" aria-pressed="${dyeTarget==='fur'}"><span style="--swatch:${look.fur}"></span>몸통</button></div>`:''}<div class="palette-families" role="group" aria-label="색상 계열">${furPalettes.map(([name],i)=>`<button data-palette="${i}" aria-pressed="${i===palette}">${name}</button>`).join('')}</div><div class="wardrobe-swatches" aria-label="털 색상">${furPalettes[palette][1].map(([color,name])=>`<button data-fur="${color}" style="--swatch:${color}" aria-label="${name}" aria-pressed="false"><span></span><small>${name}</small></button>`).join('')}</div><div class="wardrobe-sliders"><label for="roundness">동글함 <output id="round-output"></output></label><input id="roundness" type="range" min="0" max="100"></div>`;
  }else{
   options.innerHTML=`<div class="wardrobe-cards">${card('',category==='eyes'?'기본 콩눈':'착용 안 함',category)}${wardrobeSlots[category].map(([id,label])=>card(id,label)).join('')}</div>`;
   if(category==='head')options.insertAdjacentHTML('beforeend',`<fieldset class="ear-options"><legend>귀 안쪽 색</legend><div role="group" aria-label="귀 안쪽 색"><button data-ear-tone="">로즈</button><button data-ear-tone="ear-tone-cream">크림</button><button data-ear-tone="ear-tone-lilac">라일락</button></div></fieldset>`);
  }
  renderState(editor.state());
 }
 function renderState(state){
  const items=selectedItems(state.draft.accessory);root.setAttribute('aria-busy',state.saving);
  root.querySelectorAll('[data-accessory]').forEach(b=>b.setAttribute('aria-pressed',items.includes(b.dataset.accessory)));
  root.querySelectorAll('[data-dye-target]').forEach(b=>b.querySelector('span').style.setProperty('--swatch',state.draft[b.dataset.dyeTarget]));
  root.querySelectorAll('[data-clear-slot]').forEach(b=>b.setAttribute('aria-pressed',!wardrobeSlots[b.dataset.clearSlot].some(([id])=>items.includes(id))));
  root.querySelectorAll('[data-fur]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.fur===state.draft[dyeTarget]));
  root.querySelectorAll('[data-ear-tone]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.earTone?items.includes(b.dataset.earTone):!wardrobeSlots.earTone.some(([id])=>items.includes(id))));
  for(const [id,key,out] of [['fur-length','fluff','fur-output'],['roundness','roundness','round-output']]){const input=root.querySelector('#'+id);if(input){input.value=state.draft[key];root.querySelector('#'+out).textContent=state.draft[key]+'%';}}
  root.querySelectorAll('#wardrobe-options button,#wardrobe-options input').forEach(b=>b.disabled=state.saving);
  const labels=Object.entries(wardrobeSlots).filter(([slot])=>slot!=='earTone').flatMap(([,list])=>list).filter(([id])=>items.includes(id)).map(([,name])=>name);
  root.querySelector('.ear-options')?.toggleAttribute('hidden',!items.some(id=>['cat-ears','bunny-ears','bear-ears'].includes(id)));
  root.querySelector('#wardrobe-equipped').textContent=labels.join(' · ')||'가볍고 포근한 기본 모습';
  root.querySelector('#wardrobe-reset').disabled=state.saving;save.disabled=state.saving||!state.dirty;cancel.disabled=state.saving||!state.dirty;save.textContent=state.saving?'저장 중…':state.error?'다시 저장':'저장';
  status.textContent=state.error?state.error+' 다시 저장해 주세요.':state.saving?'외형을 저장하고 있어요.':state.dirty?'미리보기 · 저장하면 월드에 적용돼요.':success?'저장했어요.':'현재 적용 중';
  paintSwatches(root);
  if(active){window.labDraftAppearance=state.draft;window.dispatchEvent(new CustomEvent('lab:preview-appearance',{detail:state.draft}));}
 }
 tabs.addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;category=b.dataset.category;renderOptions();});
 tabs.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();const all=[...tabs.children],i=all.indexOf(document.activeElement),next=e.key==='Home'?0:e.key==='End'?all.length-1:(i+(e.key==='ArrowRight'?1:-1)+all.length)%all.length;all[next].click();all[next].focus();});
 options.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=editor.state().draft;success=false;
  if(b.dataset.dyeMode){editor.edit({furTop:b.dataset.dyeMode==='gradient'?(a.furTop||'#c7b4e7'):null});dyeTarget=b.dataset.dyeMode==='gradient'?'furTop':'fur';renderOptions();return;}
  if(b.dataset.dyeTarget){dyeTarget=b.dataset.dyeTarget;renderOptions();return;}
  if(b.dataset.palette!==undefined){palette=Number(b.dataset.palette);renderOptions();return;}
  if(b.dataset.fur)editor.edit({[dyeTarget]:b.dataset.fur});
  if(b.dataset.accessory)editor.edit({accessory:toggleItem(a.accessory,b.dataset.accessory)});
  if(b.dataset.clearSlot)editor.edit({accessory:clearSlot(a.accessory,b.dataset.clearSlot)});
  if(b.dataset.earTone!==undefined){const cleared=clearSlot(a.accessory,'earTone');editor.edit({accessory:b.dataset.earTone?toggleItem(cleared,b.dataset.earTone):cleared});}
  window.labSound?.('select');
 });
 options.addEventListener('input',e=>{if(e.target.id==='fur-length'||e.target.id==='roundness'){success=false;editor.edit({[e.target.id==='fur-length'?'fluff':'roundness']:Number(e.target.value)});}});
 save.onclick=async()=>{success=await editor.save();renderState(editor.state());};cancel.onclick=()=>{success=false;editor.cancel();renderOptions();};
 root.querySelector('#wardrobe-reset').onclick=()=>{success=false;editor.edit({fur:'#f4eee5',furTop:null,accessory:'none',fluff:100,roundness:50});renderOptions();};
 // Name editing replaces its own row, never the preview or a floating panel.
 // social.js owns validation and persistence; only its confirmed result ends a save.
 const previewName=root.querySelector('#preview-name'),profile=root.querySelector('.wardrobe-profile'),profileForm=root.querySelector('#profile-form'),profileInput=root.querySelector('#profile-name'),profileEdit=root.querySelector('#profile-edit'),profileCancel=root.querySelector('#profile-cancel'),profileStatus=root.querySelector('#profile-status'),selfName=document.querySelector('#self-name');
 let profileEditing=false,profileComposing=false;
 const confirmedName=()=>selfName?.textContent||'게스트';
 const syncName=()=>{previewName.textContent=confirmedName();if(!profileEditing)profileInput.value=confirmedName();};
 function renderProfile(){
  const state=profileForm.dataset.state||'',saving=state==='saving';
  profile.dataset.editing=String(profileEditing);profile.dataset.state=state;profile.setAttribute('aria-busy',String(saving));
  profileEdit.hidden=profileEditing;profileEdit.setAttribute('aria-expanded',String(profileEditing));profileForm.hidden=!profileEditing;
  profileCancel.disabled=saving;profileInput.setAttribute('aria-invalid',String(state==='error'));
 }
 function finishProfile({saved=false,focus=true}={}){
  if(!saved&&profileForm.dataset.state==='saving')return;
  const heldFocus=profile.contains(document.activeElement);
  profileEditing=false;profileComposing=false;profileInput.value=confirmedName();profileInput.setCustomValidity('');
  if(!saved){profileForm.removeAttribute('data-state');profileStatus.textContent='';profileInput.dispatchEvent(new Event('input',{bubbles:true}));}
  renderProfile();
  if(heldFocus){document.activeElement.blur();if(focus&&active)profileEdit.focus({preventScroll:true});}
 }
 profileEdit.addEventListener('click',()=>{
  if(profileEditing||profileForm.dataset.state==='saving')return;
  profileEditing=true;profileInput.value=confirmedName();profileForm.removeAttribute('data-state');profileStatus.textContent='';renderProfile();
  profileInput.dispatchEvent(new Event('input',{bubbles:true}));profileInput.focus({preventScroll:true});profileInput.select();
 });
 profileCancel.addEventListener('click',()=>finishProfile());
 profileInput.addEventListener('compositionstart',()=>{profileComposing=true;});
 profileInput.addEventListener('compositionend',()=>{profileComposing=false;});
 profileForm.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&(profileComposing||e.isComposing||e.keyCode===229)){e.preventDefault();e.stopPropagation();return;}
  if(e.key!=='Escape')return;
  e.stopPropagation();if(profileComposing||e.isComposing||e.keyCode===229)return;
  e.preventDefault();finishProfile();
 });
 profileForm.addEventListener('submit',e=>{if(profileComposing){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
 root.closest('dialog')?.addEventListener('cancel',e=>{
  if(!active||!profileEditing)return;e.preventDefault();e.stopImmediatePropagation();if(!profileComposing)finishProfile();
 },{capture:true});
 syncName();renderProfile();
 const nameObserver=new MutationObserver(changes=>{
  syncName();
  if(changes.some(change=>change.target===profileForm&&change.attributeName==='data-state')&&profileForm.dataset.state==='saved'&&profileEditing)finishProfile({saved:true});
  else renderProfile();
 });
 if(selfName)nameObserver.observe(selfName,{childList:true,characterData:true,subtree:true});
 nameObserver.observe(profileForm,{attributes:true,attributeFilter:['data-state']});
 renderOptions();
 return {open(){if(active)return;active=true;success=false;editor.restore(window.labAppearance);renderOptions();},close(){active=false;if(profileEditing)finishProfile({focus:false});window.labDraftAppearance=null;editor.cancel();window.dispatchEvent(new CustomEvent('lab:preview-appearance',{detail:window.labAppearance}));},restore(look){editor.restore(look);renderOptions();}};
}
