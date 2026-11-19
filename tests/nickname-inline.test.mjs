import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';

const root=path.resolve('dist'),tick=()=>new Promise(resolve=>setTimeout(resolve,0));

async function fixture(t,{name='겨울 손님',saveName}={}){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://winter.test/',runScripts:'outside-only',pretendToBeVisual:true});
 t.after(()=>dom.window.close());
 const w=dom.window,d=w.document,context=dom.getInternalVMContext(),modules=new Map(),requests=[];
 let confirmed=name;
 w.matchMedia=()=>({matches:true});w.setInterval=()=>0;w.clearInterval=()=>{};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.openWinterSettings=()=>{d.querySelector('#studio').open=true;};
 w.labAppearance={fur:'#f4eee5',furTop:null,accessory:'none',fluff:100,roundness:50};
 w.labPlayerState={x:0,y:.95,z:30,yaw:0};
 w.fetch=async(url,init={})=>{
  const body=init.body?JSON.parse(init.body):null;requests.push({url,body});
  let reply;
  if(url==='/api/access')reply={admin:false,session:{id:'guest',room:'winter-plaza',name:confirmed}};
  else if(url==='/api/name'){
   reply=await saveName?.(body.name)||{name:body.name};
   if(!reply.status||reply.status<400)confirmed=(reply.data||reply).name;
  }else if(url==='/api/chat')reply={name:confirmed,message:body.message,at:Date.now()};
  else reply={people:[],count:1};
  return {ok:(reply.status||200)<400,status:reply.status||200,json:async()=>reply.data||reply};
 };
 function source(file){if(!modules.has(file))modules.set(file,new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file}));return modules.get(file);}
 async function mod(file){const m=source(file);if(m.status==='unlinked')await m.link((specifier,reference)=>source(path.resolve(path.dirname(reference.identifier),specifier)));return m;}
 const customization=await mod(path.join(root,'customization-ui.js'));await customization.evaluate();
 const ui=customization.namespace.createCustomizationUI(w.labAppearance,()=>{});
 await(await mod(path.join(root,'social.js'))).evaluate();await tick();
 d.body.classList.add('studio-open');d.querySelector('#studio').open=true;d.querySelector('#pane-fluff').hidden=false;ui.open();
 const el=Object.fromEntries(['profile-edit','profile-form','profile-name','profile-save','profile-cancel','profile-status','profile-count','preview-name','self-name'].map(id=>[id,d.getElementById(id)]));
 const type=value=>{el['profile-name'].value=value;el['profile-name'].dispatchEvent(new w.Event('input',{bubbles:true}));};
 const submit=()=>el['profile-form'].dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));
 return {w,d,ui,el,requests,type,submit,setConfirmed(value){confirmed=value;}};
}

test('inline nickname waits for server confirmation, preserves a failed draft and retries in the same row',async t=>{
 const pending=[];
 const f=await fixture(t,{saveName:name=>new Promise(resolve=>pending.push({name,resolve}))}),{w,d,el,type,submit,requests}=f;
 const form=el['profile-form'],input=el['profile-name'],profile=form.closest('.wardrobe-profile');
 assert.equal(form.hidden,true,'session admission must leave the inline editor closed');
 assert.equal(el['preview-name'].textContent,'겨울 손님');assert.equal(profile.tagName,'DIV');
 el['profile-edit'].click();type('겨울별');submit();await tick();
 assert.equal(pending.length,1);assert.equal(pending[0].name,'겨울별');assert.equal(form.dataset.state,'saving');
 assert.equal(form.hidden,false);assert.equal(el['profile-edit'].hidden,true);assert.equal(el['profile-cancel'].disabled,true);assert.equal(input.readOnly,true);
 assert.equal(el['preview-name'].textContent,'겨울 손님');assert.equal(el['self-name'].textContent,'겨울 손님');assert.equal(w.localStorage.getItem('winter-visitor-name'),'겨울 손님');
 el['profile-cancel'].click();input.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));submit();await tick();
 assert.equal(form.hidden,false);assert.equal(pending.length,1,'pending saves cannot be duplicated or presented as cancelled');
 pending[0].resolve({status:409,data:{error:'이미 사용 중인 닉네임이에요.'}});await tick();
 assert.equal(form.dataset.state,'error');assert.equal(profile.dataset.state,'error');assert.equal(form.hidden,false);assert.equal(input.value,'겨울별');
 assert.equal(input.getAttribute('aria-invalid'),'true');assert.match(el['profile-status'].textContent,/이미 사용/);assert.equal(el['profile-cancel'].disabled,false);
 assert.equal(el['self-name'].textContent,'겨울 손님');assert.equal(w.localStorage.getItem('winter-visitor-name'),'겨울 손님');
 type(' 새 겨울별 ');await tick();assert.equal(input.getAttribute('aria-invalid'),'false');submit();await tick();
 assert.equal(pending[1].name,'새 겨울별');pending[1].resolve({name:'새 겨울별'});await tick();
 assert.equal(form.hidden,true);assert.equal(el['profile-edit'].hidden,false);assert.equal(profile.dataset.editing,'false');
 assert.equal(el['preview-name'].textContent,'새 겨울별');assert.equal(el['self-name'].textContent,'새 겨울별');assert.equal(input.value,'새 겨울별');
 assert.equal(el['profile-status'].textContent,'저장됨');assert.equal(w.localStorage.getItem('winter-visitor-name'),'새 겨울별');assert.notEqual(d.activeElement,input);
 assert.equal(requests.filter(r=>r.url==='/api/name').length,2);
 const reconnected=await fixture(t,{name:'새 겨울별'});
 assert.equal(reconnected.el['preview-name'].textContent,'새 겨울별');assert.equal(reconnected.el['profile-form'].hidden,true);
});

test('confirmed-name refreshes leave the editing draft intact and cancel restores the latest server name',async t=>{
 const {w,d,el,requests,type,setConfirmed}=await fixture(t);
 el['profile-edit'].click();type('작성 중 이름');setConfirmed('확정된 이름');
 const chat=d.querySelector('#chat-form');d.querySelector('#chat-input').value='이름을 수정하는 중';
 chat.dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));await tick();
 assert.equal(el['profile-name'].value,'작성 중 이름');assert.equal(el['profile-form'].hidden,false);
 assert.equal(el['self-name'].textContent,'확정된 이름');assert.equal(el['preview-name'].textContent,'확정된 이름');
 el['profile-cancel'].click();await tick();
 assert.equal(el['profile-form'].hidden,true);assert.equal(el['profile-name'].value,'확정된 이름');assert.equal(el['profile-status'].textContent,'');
 assert.equal(requests.filter(r=>r.url==='/api/name').length,0,'cancel does not write a discarded draft');
 el['profile-edit'].click();assert.equal(el['profile-name'].value,'확정된 이름');
 type('');assert.equal(el['profile-save'].disabled,true);type('하나둘셋넷다섯여섯일곱여덟');assert.equal(el['profile-count'].textContent,'10 / 10');
});

test('composition Enter never saves and Escape closes only the nickname editor before the settings dialog',async t=>{
 const {w,d,el,type,submit,requests}=await fixture(t),input=el['profile-name'],studio=d.querySelector('#studio');
 let dialogCancels=0;studio.addEventListener('cancel',()=>{dialogCancels++;studio.close();});
 el['profile-edit'].click();type('눈');input.dispatchEvent(new w.CompositionEvent('compositionstart',{bubbles:true}));
 const enter=new w.KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true,cancelable:true});input.dispatchEvent(enter);submit();await tick();
 assert.equal(enter.defaultPrevented,true);assert.equal(requests.filter(r=>r.url==='/api/name').length,0);assert.equal(el['profile-form'].hidden,false);
 input.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',isComposing:true,bubbles:true,cancelable:true}));studio.dispatchEvent(new w.Event('cancel',{cancelable:true}));
 assert.equal(el['profile-form'].hidden,false);assert.equal(studio.open,true);assert.equal(dialogCancels,0);
 input.dispatchEvent(new w.CompositionEvent('compositionend',{bubbles:true}));
 const escape=new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true});input.dispatchEvent(escape);await tick();
 assert.equal(escape.defaultPrevented,true);assert.equal(el['profile-form'].hidden,true);assert.equal(studio.open,true);assert.equal(d.activeElement,el['profile-edit']);
 studio.dispatchEvent(new w.Event('cancel',{cancelable:true}));assert.equal(dialogCancels,1);assert.equal(studio.open,false);
});

test('a save finishing after leaving customization updates the name without stealing another panel focus',async t=>{
 let finish;
 const {w,d,ui,el,type,submit}=await fixture(t,{saveName:()=>new Promise(resolve=>{finish=resolve;})});
 el['profile-edit'].click();type('새로운 겨울');submit();await tick();ui.close();
 const otherControl=d.querySelector('#open-settings');otherControl.focus();
 let passedCancel=false;d.querySelector('#studio').addEventListener('cancel',()=>{passedCancel=true;});
 d.querySelector('#studio').dispatchEvent(new w.Event('cancel',{cancelable:true}));assert.equal(passedCancel,true,'an inactive nickname editor must not trap the settings dialog');
 finish({name:'새로운 겨울'});await tick();
 assert.equal(el['preview-name'].textContent,'새로운 겨울');assert.equal(el['profile-form'].hidden,true);assert.equal(d.activeElement,otherControl);
 ui.open();assert.equal(el['profile-form'].hidden,true);assert.equal(el['profile-status'].textContent,'저장됨');
});
