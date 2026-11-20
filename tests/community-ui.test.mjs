import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';

test('report form remains usable independently of an empty decoration list',async t=>{
 const root=path.resolve('dist'),dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://winter.test',runScripts:'outside-only'});
 t.after(()=>dom.window.close());const w=dom.window,context=dom.getInternalVMContext(),modules=new Map();
 w.matchMedia=()=>({matches:true});let fail=false;
 w.fetch=async()=>({ok:!fail,json:async()=>fail?{error:'재시도'}:{ok:true,notice:'',disabled:[]}});
 async function mod(file){if(modules.has(file))return modules.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});modules.set(file,m);await m.link(s=>mod(path.resolve(path.dirname(file),s)));return m;}
 await(await mod(path.join(root,'community-ui.js'))).evaluate();
 for(const selector of ['#report-panel form']){
  const form=w.document.querySelector(selector),button=form.querySelector('button');
  for(fail of [false,true]){await form.onsubmit({preventDefault(){},target:form});assert.equal(button.disabled,false,selector+' must allow another action/retry');}
 }
 assert.ok(w.document.querySelector('[data-world-settings]'));assert.equal(w.document.querySelector('[name=notice]'),null);
 assert.equal(w.document.querySelector('[data-event-form]'),null);
});

test('admin loads retained tools without notices or events and keeps fireworks status separate',async t=>{
 const root=path.resolve('dist'),dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://winter.test',runScripts:'outside-only'});
 t.after(()=>dom.window.close());const w=dom.window,context=dom.getInternalVMContext(),modules=new Map(),requests=[];
 w.matchMedia=()=>({matches:true});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.show=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){if(!this.open)return;this.open=false;this.dispatchEvent(new w.Event('close'));};
 let failAdmin=false,failShow=false;
 const data={reports:[],people:[{id:'guest',name:'겨울 손님',chat:'안녕하세요'}],decorations:[],decorationRevision:0,quizzes:[],candidates:[],generation:[],events:[{id:'legacy',title:'보존된 일정'}]};
 w.fetch=async(url,options={})=>{
  requests.push([url,options.method||'GET']);
  const failed=(url==='/api/admin'&&failAdmin)||(url==='/api/fireworks'&&options.method==='POST'&&failShow);
  return {ok:!failed,json:async()=>failed?{error:'연결을 확인해 주세요.'}:url==='/api/operations'?{settings:{disabled:[]},counts:[],errors:[]}:url==='/api/admin'?data:url==='/api/fireworks'?{show:null,serverTime:Date.now()}:[]};
 };
 async function mod(file){if(modules.has(file))return modules.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});modules.set(file,m);await m.link(s=>mod(path.resolve(path.dirname(file),s)));return m;}
 await(await mod(path.join(root,'community-ui.js'))).evaluate();
 w.dispatchEvent(new w.CustomEvent('lab:access',{detail:{admin:true}}));
 w.labAdmin=true;w.document.querySelector('#studio').open=true;w.document.querySelector('#pane-social').hidden=false;w.dispatchEvent(new w.CustomEvent('lab:access',{detail:{admin:true}}));w.dispatchEvent(new w.CustomEvent('lab:settings-tab',{detail:'social'}));await new Promise(resolve=>setTimeout(resolve,15));
 const panel=w.document.querySelector('#admin-panel'),status=panel.querySelector('[data-admin-status]'),show=panel.querySelector('[data-show-status]');
 assert.equal(panel.parentElement.id,'pane-social');assert.equal(panel.tagName,'SECTION');assert.equal(w.document.querySelector('#open-admin'),null);assert.equal(panel.hidden,false);assert.equal(show.closest('summary')?.parentElement.classList.contains('admin-section'),true);
 assert.equal(show.textContent,'시작 가능');assert.equal(status.textContent,'');
 assert.equal(panel.querySelector('[data-people] .admin-row-title').textContent,'겨울 손님');
 assert.equal(panel.querySelector('[data-people] .admin-row-detail').textContent,'안녕하세요');
 assert.equal(panel.querySelector('[data-events]'),null);assert.ok(panel.querySelector('[data-world-settings]'));
 assert.ok(requests.every(([url])=>!url.includes('events')));
 failShow=true;await panel.querySelector('[data-show-start]').onclick();
 assert.equal(show.textContent,'시작 가능');assert.match(panel.querySelector('[data-show-error]').textContent,/연결/);
 assert.equal(panel.querySelector('[data-show-start]').disabled,false);assert.equal(panel.querySelector('[data-show-stop]').disabled,true);
 failAdmin=true;await panel.querySelector('[data-refresh]').onclick();
 assert.match(status.textContent,/연결/);assert.equal(show.textContent,'시작 가능');assert.equal(panel.querySelector('[data-refresh]').disabled,false);
 const sections=[...panel.querySelectorAll('.panel-scroll > details')];sections[2].open=true;sections[2].dispatchEvent(new w.Event('toggle'));
 assert.equal(sections.filter(section=>section.open).length,1);
});

test('a replacement panel owns input, closes chat without losing its draft and retains the active ride',async t=>{
 const dom=new JSDOM('<body><dialog id="studio"></dialog><form id="chat-form"><input id="chat-input" value="작성 중인 메시지"></form><button id="chat-toggle" aria-expanded="true"></button><div id="ride-hud">탑승 중</div></body>',{url:'https://winter.test',runScripts:'outside-only'});
 t.after(()=>dom.window.close());const w=dom.window,context=dom.getInternalVMContext(),modules=new Map();w.matchMedia=()=>({matches:true});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.show=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){if(!this.open)return;this.open=false;w.queueMicrotask(()=>this.dispatchEvent(new w.Event('close')));};
 async function mod(file){if(modules.has(file))return modules.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});modules.set(file,m);await m.link(s=>mod(path.resolve(path.dirname(file),s)));return m;}
 const module=await mod(path.resolve('dist/panels.js'));await module.evaluate();
 const {makePanel}=module.namespace,first=makePanel('first-panel','첫 패널',''),next=makePanel('next-panel','다음 패널',''),quiz=makePanel('quiz-journal','내 지식집','');
 const input=w.document.querySelector('#chat-input');input.focus();w.document.body.classList.add('chat-typing');w.document.body.dataset.controls='ride';
 first.open();assert.notEqual(w.document.activeElement,input);assert.equal(w.document.querySelector('#chat-form').hidden,true);assert.equal(input.value,'작성 중인 메시지');assert.equal(w.document.body.classList.contains('chat-typing'),false);
 next.open();await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(first.dialog.open,false);assert.equal(next.dialog.open,true);assert.equal(w.document.querySelectorAll('dialog[open]').length,1);assert.equal(w.document.body.classList.contains('studio-open'),true);
 assert.equal(w.document.body.dataset.controls,'ride');assert.equal(w.document.querySelector('#ride-hud').hidden,false);
 quiz.open();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(next.dialog.open,false);assert.equal(w.document.body.classList.contains('quiz-open'),true);assert.equal(w.document.body.classList.contains('studio-open'),false);
 quiz.close();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(w.document.body.classList.contains('quiz-open'),false);assert.equal(w.document.body.classList.contains('studio-open'),false);
});

test('customization boots without the removed front button and reflects confirmed names above the preview',async t=>{
 const dom=new JSDOM(fs.readFileSync(path.resolve('dist/index.html'),'utf8'),{url:'https://winter.test',runScripts:'outside-only'});
 t.after(()=>dom.window.close());const w=dom.window,context=dom.getInternalVMContext(),modules=new Map();
 const appearance={fur:'#f4eee5',furTop:null,accessory:'none',fluff:100,roundness:50};w.labAppearance=appearance;
 async function mod(file){if(modules.has(file))return modules.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});modules.set(file,m);await m.link(s=>mod(path.resolve(path.dirname(file),s)));return m;}
 const module=await mod(path.resolve('dist/customization-ui.js'));await module.evaluate();const ui=module.namespace.createCustomizationUI(appearance,()=>{});ui.open();
 const root=w.document.querySelector('#pane-fluff'),profile=root.querySelector('.wardrobe-profile'),name=root.querySelector('#preview-name'),form=root.querySelector('#profile-form'),input=root.querySelector('#profile-name'),edit=root.querySelector('#profile-edit');
 assert.equal(root.querySelector('#preview-front'),null);assert.equal(root.querySelector('.wardrobe-actions').parentElement,root);assert.equal(profile.parentElement,root.querySelector('.fluff-stage'));
 w.document.querySelector('#self-name').textContent='겨울 친구';await new Promise(resolve=>setTimeout(resolve,0));assert.equal(name.textContent,'겨울 친구');
 assert.equal(profile.tagName,'DIV');assert.equal(form.hidden,true);edit.click();assert.equal(form.hidden,false);assert.equal(edit.hidden,true);assert.equal(w.document.activeElement,input);
 form.dataset.state='saved';await new Promise(resolve=>setTimeout(resolve,0));assert.equal(form.hidden,true);assert.equal(edit.hidden,false);assert.notEqual(w.document.activeElement,input);
 edit.click();input.value='작성 중인 이름';w.document.querySelector('#self-name').textContent='겨울 친구';await new Promise(resolve=>setTimeout(resolve,0));assert.equal(form.hidden,false,'a later name refresh must not collapse a reopened editor');assert.equal(input.value,'작성 중인 이름');
 root.querySelector('[data-category="head"]').click();root.querySelector('[data-accessory="cat-ears"]').click();assert.match(w.labDraftAppearance.accessory,/cat-ears/);root.querySelector('#wardrobe-cancel').click();assert.equal(w.labDraftAppearance.accessory,'none');ui.close();
});

test('reopening during close animation keeps the current modal, focus and input ownership',async t=>{
 const dom=new JSDOM('<body></body>',{url:'https://winter.test',runScripts:'outside-only'});t.after(()=>dom.window.close());
 const w=dom.window,context=dom.getInternalVMContext(),modules=new Map(),animations=[];w.matchMedia=()=>({matches:false});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.show=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){if(!this.open)return;this.open=false;w.queueMicrotask(()=>this.dispatchEvent(new w.Event('close')));};
 w.HTMLDialogElement.prototype.animate=function(){let finish,reject;const animation={cancelled:false,finished:new w.Promise((resolve,fail)=>{finish=resolve;reject=fail;}),finish(){finish();},cancel(){this.cancelled=true;reject(new Error('cancelled'));}};animations.push(animation);return animation;};
 async function mod(file){if(modules.has(file))return modules.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});modules.set(file,m);await m.link(s=>mod(path.resolve(path.dirname(file),s)));return m;}
 const module=await mod(path.resolve('dist/panels.js'));await module.evaluate();const first=module.namespace.makePanel('first','첫 패널','<input aria-label="편집">'),second=module.namespace.makePanel('second','다음 패널','<button>유지할 동작</button>');
 let closes=0;first.dialog.addEventListener('close',()=>closes++);
 first.open();first.dialog.querySelector('input').focus();first.close();assert.equal(animations.length,1);first.open();
 await new Promise(resolve=>setTimeout(resolve,0));assert.equal(animations[0].cancelled,true);assert.equal(first.dialog.open,true);assert.equal(closes,0);assert.equal(w.document.activeElement,first.dialog.querySelector('input'));assert.equal(w.document.body.classList.contains('studio-open'),true);
 first.close();second.open();second.dialog.querySelector('button:last-child').focus();await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(animations[1].cancelled,true);assert.equal(first.dialog.open,false);assert.equal(second.dialog.open,true);assert.equal(w.document.activeElement,second.dialog.querySelector('button:last-child'));assert.equal(w.document.body.classList.contains('studio-open'),true);
 second.close();animations[2].finish();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(second.dialog.open,false);assert.equal(w.document.body.classList.contains('studio-open'),false);
});

test('admin fireworks honor corrected server-time cooldown boundaries and clear the local timer on close',async t=>{
 const dom=new JSDOM(fs.readFileSync(path.resolve('dist/index.html'),'utf8'),{url:'https://winter.test',runScripts:'outside-only',pretendToBeVisual:true});t.after(()=>dom.window.close());
 const w=dom.window,context=dom.getInternalVMContext(),modules=new Map(),timers=new Map(),base=1800000000000;let elapsed=0,sequence=0,requests=0,failStart=false,failStop=false;
 // The device clock is 45 seconds slow. Only the observed server offset may
 // release Start at the server's boundary, without another HTTP request.
 w.Date.now=()=>base-45000+elapsed;Object.defineProperty(w.performance,'now',{value:()=>elapsed});
 w.setTimeout=(callback,delay)=>{const id=++sequence;timers.set(id,{callback,due:elapsed+delay});return id;};w.clearTimeout=id=>timers.delete(id);
 // HTTP is answered synchronously below; exclude its unrelated 8-second abort
 // alarms so this clock tracks only the visible panel's countdown lifecycle.
 w.AbortSignal.timeout=()=>new w.AbortController().signal;
 w.matchMedia=()=>({matches:true});w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.show=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){if(!this.open)return;this.open=false;this.dispatchEvent(new w.Event('close'));};
 let show={id:'cooling',startsAt:base-75000,endsAt:base-1000,nextRequestAt:base+179000,state:'finished',revision:1};
 const data={reports:[],people:[],decorations:[],decorationRevision:0,quizzes:[],candidates:[],generation:[]};
 w.fetch=async(url,options={})=>{
  requests++;if(url==='/api/operations')return{ok:true,json:async()=>({settings:{disabled:[]},counts:[],errors:[]})};if(url==='/api/admin')return{ok:true,json:async()=>data};if(url!=='/api/fireworks')return{ok:true,json:async()=>[]};
  const action=options.body?JSON.parse(options.body).action:null;
  if(action==='stop'&&failStop)show={...show,state:'stopped',revision:show.revision+1};
  const failed=action==='start'&&failStart||action==='stop'&&failStop;
  return{ok:!failed,json:async()=>({show,serverTime:base+elapsed,...(failed?{error:'공연 상태를 다시 확인해 주세요.'}:{})})};
 };
 async function mod(file){if(modules.has(file))return modules.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});modules.set(file,m);await m.link(s=>mod(path.resolve(path.dirname(file),s)));return m;}
 await(await mod(path.resolve('dist/community-ui.js'))).evaluate();
 const flush=()=>new Promise(resolve=>setImmediate(resolve));
 const tick=value=>{elapsed=value;for(const [id,timer]of [...timers])if(timer.due<=elapsed){timers.delete(id);timer.callback();}};
 w.labAdmin=true;w.document.querySelector('#studio').open=true;w.document.querySelector('#pane-social').hidden=false;w.dispatchEvent(new w.CustomEvent('lab:access',{detail:{admin:true}}));w.dispatchEvent(new w.CustomEvent('lab:settings-tab',{detail:'social'}));await flush();
 const panel=w.document.querySelector('#admin-panel'),badge=panel.querySelector('[data-show-status]'),start=panel.querySelector('[data-show-start]'),stop=panel.querySelector('[data-show-stop]');
 assert.equal(w.labServerOffset,45000);assert.equal(badge.textContent,'다음 신청 2:59');assert.equal(badge.dataset.state,'cooldown');assert.equal(start.disabled,false);assert.equal(stop.disabled,true);assert.equal(timers.size,1);
 const initialRequests=requests;tick(178999);assert.equal(badge.textContent,'다음 신청 0:01');assert.equal(start.disabled,false);tick(179000);assert.equal(badge.textContent,'시작 가능');assert.equal(start.disabled,false);assert.equal(timers.size,0);assert.equal(requests,initialRequests,'the countdown never polls HTTP');
 failStart=true;await start.onclick();assert.equal(start.disabled,false);assert.equal(stop.disabled,true);assert.equal(badge.dataset.state,'idle');assert.match(panel.querySelector('[data-show-error]').textContent,/다시 확인/);
 show={id:'next-show',startsAt:base+elapsed+10000,endsAt:base+elapsed+84000,nextRequestAt:base+elapsed+264000,state:'scheduled',revision:1};
 w.dispatchEvent(new w.CustomEvent('lab:fireworks',{detail:show}));assert.equal(badge.dataset.state,'scheduled');assert.equal(start.disabled,true);assert.equal(stop.disabled,false);
 tick(show.startsAt-base);assert.equal(badge.dataset.state,'playing');assert.equal(stop.disabled,false);
 failStop=true;await stop.onclick();assert.equal(badge.dataset.state,'cooldown');assert.equal(start.disabled,false);assert.equal(stop.disabled,true);assert.match(panel.querySelector('[data-show-error]').textContent,/다시 확인/);
 w.dispatchEvent(new w.CustomEvent('lab:fireworks',{detail:{...show,state:'playing',revision:1}}));assert.equal(badge.dataset.state,'cooldown','a stale reply cannot undo the stopped revision');
 assert.equal(timers.size,1);w.document.querySelector('#studio').close();assert.equal(timers.size,0);const afterClose=requests;tick(show.nextRequestAt-base+1000);assert.equal(timers.size,0);assert.equal(requests,afterClose);
});
