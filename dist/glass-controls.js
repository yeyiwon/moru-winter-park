// Keep native form values and change events; render one keyboard/touch-friendly picker.
export function enhanceSelects(root=document){
 let openPicker=null,serial=0;
 const enhanced=new WeakMap();
 function enhance(select){
  if(enhanced.has(select)||select.multiple||select.size>1)return;
  const wrap=document.createElement('span'),trigger=document.createElement('button');
  wrap.className='glass-select';select.before(wrap);wrap.append(select,trigger);
  select.classList.add('native-select');select.tabIndex=-1;
  trigger.type='button';trigger.className='select-trigger';trigger.setAttribute('role','combobox');trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
  const list=document.createElement('div');list.className='select-options';list.id='glass-options-'+(++serial);list.setAttribute('role','listbox');list.hidden=true;
  trigger.setAttribute('aria-controls',list.id);
  let active=0,search='',searchAt=0;
  const label=()=>select.getAttribute('aria-label')||[...(select.labels||[])].map(l=>[...l.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim()).filter(Boolean).join(' ')||'선택';
  function sync(){trigger.replaceChildren();const value=document.createElement('span');value.textContent=select.options[select.selectedIndex]?.textContent||'선택';trigger.append(value);trigger.insertAdjacentHTML('beforeend','<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4"/></svg>');trigger.disabled=select.disabled;trigger.setAttribute('aria-label',label()+': '+value.textContent);}
  function close(focus=false){if(typeof list.hidePopover==='function'){try{list.hidePopover();}catch{}}list.hidden=true;list.remove();trigger.setAttribute('aria-expanded','false');trigger.removeAttribute('aria-activedescendant');if(openPicker?.trigger===trigger)openPicker=null;if(focus)trigger.focus({preventScroll:true});}
  function highlight(index){const options=[...list.children],n=options.length;if(!n)return;active=(index+n)%n;for(let i=0;i<n&&options[active].disabled;i++)active=(active+1)%n;options.forEach((o,i)=>o.classList.toggle('active',i===active));trigger.setAttribute('aria-activedescendant',options[active].id);options[active].scrollIntoView?.({block:'nearest'});}
  function choose(index){const option=select.options[index];if(!option||option.disabled)return;select.selectedIndex=index;select.dispatchEvent(new select.ownerDocument.defaultView.Event('input',{bubbles:true}));select.dispatchEvent(new select.ownerDocument.defaultView.Event('change',{bubbles:true}));close(true);}
  function position(){
   const r=trigger.getBoundingClientRect(),h=Math.min(280,list.scrollHeight||280),below=innerHeight-r.bottom-12,above=r.top-12,down=below>=Math.min(h,160)||below>=above;
   const width=Math.max(160,Math.min(r.width,innerWidth-24)),left=Math.max(12,Math.min(r.left,innerWidth-width-12)),top=down?r.bottom+7:Math.max(12,r.top-h-7);
   const fallback=typeof list.showPopover!=='function'?select.closest('dialog'):null,origin=fallback?.getBoundingClientRect();
   list.style.width=width+'px';list.style.left=(left-(origin?.left||0)+(fallback?.scrollLeft||0)-(fallback?.clientLeft||0))+'px';list.style.top=(top-(origin?.top||0)+(fallback?.scrollTop||0)-(fallback?.clientTop||0))+'px';list.style.maxHeight=Math.max(44,Math.min(280,(down?below:above)-7))+'px';
  }
  function open(){if(trigger.disabled)return;sync();openPicker?.close();list.replaceChildren();[...select.options].forEach((option,index)=>{const button=document.createElement('button');button.type='button';button.id=list.id+'-'+index;button.setAttribute('role','option');button.setAttribute('aria-selected',String(option.selected));button.tabIndex=-1;button.disabled=option.disabled;button.textContent=option.textContent;button.onclick=()=>choose(index);list.append(button);});list.hidden=false;
   // A top-layer popover is not clipped by dialog scrolling or backdrop filters.
   (select.closest('dialog')||document.body).append(list);if(typeof list.showPopover==='function'){list.setAttribute('popover','manual');list.showPopover();}
   trigger.setAttribute('aria-expanded','true');openPicker={trigger,list,close,position};position();highlight(select.selectedIndex);}
  trigger.onclick=()=>openPicker?.trigger===trigger?close():open();
  trigger.onkeydown=e=>{const opened=openPicker?.trigger===trigger;if(['ArrowDown','ArrowUp','Home','End','Enter',' ','Escape'].includes(e.key)){e.preventDefault();e.stopPropagation();if(e.key==='Escape'){close(true);return;}if(!opened){open();return;}if(e.key==='Enter'||e.key===' '){choose(active);return;}highlight(e.key==='Home'?0:e.key==='End'?list.children.length-1:active+(e.key==='ArrowUp'?-1:1));}else if(e.key==='Tab')close();else if(e.key.length===1){const now=Date.now();search=now-searchAt<700?search+e.key:e.key;searchAt=now;if(!opened)open();const i=[...select.options].findIndex(o=>!o.disabled&&o.textContent.toLowerCase().startsWith(search.toLowerCase()));if(i>=0)highlight(i);}};
  select.addEventListener('change',sync);select.addEventListener('lab:select-sync',sync);select.addEventListener('focus',()=>trigger.focus());select.closest('form')?.addEventListener('reset',()=>queueMicrotask(sync));new MutationObserver(sync).observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected','label']});
  enhanced.set(select,{sync});sync();
 }
 function scan(){root.querySelectorAll('select').forEach(select=>{enhance(select);enhanced.get(select)?.sync();});}
 scan();const observer=new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('select')||n.querySelector?.('select')))))scan();});observer.observe(root.body||root,{childList:true,subtree:true});
 root.addEventListener('pointerdown',e=>{if(openPicker&&!openPicker.trigger.contains(e.target)&&!openPicker.list.contains(e.target))openPicker.close();},true);
 root.addEventListener('close',()=>openPicker?.close(),true);root.addEventListener('scroll',()=>openPicker?.position(),true);window.addEventListener('resize',()=>openPicker?.position());
 window.addEventListener('lab:pause',scan);
 root.addEventListener('toggle',e=>{if(e.target.tagName!=='DETAILS'||!e.target.open||matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(const child of e.target.children)if(child.tagName!=='SUMMARY')child.animate?.([{opacity:0,transform:'translateY(-5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'});},true);
 return{refresh:scan,close:()=>openPicker?.close()};
}
if(typeof document!=='undefined')enhanceSelects();
