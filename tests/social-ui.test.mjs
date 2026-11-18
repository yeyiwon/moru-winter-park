import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';import {JSDOM} from 'jsdom';
const root=path.resolve('dist'),tick=()=>new Promise(r=>setTimeout(r,10)),token='a'.repeat(64);
async function fixture(t,{url='https://winter.test/',fetch}={}){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url,runScripts:'outside-only',pretendToBeVisual:true});t.after(()=>dom.window.close());const w=dom.window,d=w.document;w.matchMedia=()=>({matches:true});w.labPlayerState={x:0,y:.95,z:30,yaw:0};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.openWinterSettings=()=>{d.querySelector('#studio').open=true;};
 w.fetch=async(url,init={})=>{const reply=await fetch(url,init);return{ok:(reply.status||200)<400,status:reply.status||200,json:async()=>reply.data||reply};};
 const modules=new Map(),context=dom.getInternalVMContext();async function mod(file){if(modules.has(file))return modules.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});modules.set(file,m);await m.link(s=>mod(path.resolve(path.dirname(file),s)));return m;}await(await mod(path.join(root,'social.js'))).evaluate();await tick();return{w,d};
}
test('public, old invite and old room URLs autojoin the same world without token or forced profile',async t=>{
 for(const suffix of ['', '#invite=bad','?room=legacy-private']){
 let joins=0;const {w,d}=await fixture(t,{url:'https://winter.test/'+suffix,fetch:async(url,init)=>{if(url==='/api/access')return{admin:false,session:null};if(url==='/api/join'){joins++;const b=JSON.parse(init.body);assert.equal(b.token,undefined);assert.ok(b.name);return{id:'guest',name:b.name,room:'winter-plaza'};}return{people:[],count:1};}});
 assert.equal(joins,1);assert.equal(w.labSocialJoined,true);assert.ok(!d.body.classList.contains('invite-gate'));assert.equal(d.querySelector('#join-form').hidden,true);assert.equal(d.querySelector('#profile-form').hidden,true);assert.equal(d.querySelector('#owner-signin').hidden,true);assert.equal(w.location.hash,'');assert.equal(w.location.search,'');
 }
});
test('admin path requires server owner identity and never joins an unauthenticated owner route',async t=>{
 let joins=0;const {w,d}=await fixture(t,{url:'https://winter.test/admin',fetch:async url=>{if(url==='/api/join')joins++;return{admin:false,signedIn:false,session:null};}});
 assert.equal(joins,0);assert.equal(w.labAdmin,false);assert.equal(d.querySelector('#owner-signin').hidden,false);assert.ok(d.querySelector('#owner-signin').href.endsWith('return_to=%2Fadmin'));assert.ok(d.body.classList.contains('invite-gate'));
});
test('public chat and explicit nickname editing preserve one session; owner leaving does not gate guests',async t=>{
 let joins=0,name='눈꽃';const {w,d}=await fixture(t,{fetch:async(url,init)=>{const b=init.body?JSON.parse(init.body):{};if(url==='/api/access')return{admin:false,session:{id:'guest',name,room:'winter-plaza'}};if(url==='/api/join'){joins++;return{id:'guest',name,room:'winter-plaza'};}if(url==='/api/name'){name=b.name;return{name};}if(url==='/api/chat')return{name,message:b.message,at:Date.now()};return{people:[],count:1};}});
 assert.equal(joins,1);assert.equal(w.labSocialJoined,true);d.querySelector('#edit-profile').click();assert.equal(d.querySelector('#profile-form').hidden,false);d.querySelector('#profile-name').value='모루';d.querySelector('#profile-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(d.querySelector('#profile-display-name').textContent,'모루');assert.equal(d.querySelector('#profile-form').hidden,true);
 d.querySelector('#chat-toggle').click();d.querySelector('#chat-input').value='함께 겨울';d.querySelector('#chat-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.match(d.querySelector('#chat-log').textContent,/함께 겨울/);assert.equal(d.body.classList.contains('chat-typing'),false);assert.equal(w.labSocialJoined,true);
});
test('failed public bootstrap exposes retry and a blocked session never silently rejoins',async t=>{
 let deny=false;const {w,d}=await fixture(t,{fetch:async url=>{if(url==='/api/access')return{admin:false};if(url==='/api/join')return{id:'guest',name:'눈꽃',room:'winter-plaza'};return deny?{status:403,data:{error:'이용 제한'}}:{people:[],count:1};}});
 deny=true;d.dispatchEvent(new w.Event('visibilitychange'));await tick();assert.equal(w.labSocialJoined,false);assert.ok(d.body.classList.contains('invite-gate'));assert.equal(d.querySelector('#join-form').hidden,true);
});

test('personal chat hiding does not remove the other player from the world',async t=>{
 const {w,d}=await fixture(t,{fetch:async url=>url==='/api/access'?{admin:false}:url==='/api/join'?{id:'guest',name:'눈꽃',room:'winter-plaza'}:{people:[],count:1}});
 w.dispatchEvent(new w.CustomEvent('lab:visitors',{detail:[{id:'peer',name:'모루',chat:'안녕',chatAt:Date.now()}]}));d.querySelector('#chat-toggle').click();assert.equal(d.querySelectorAll('.chat-hide').length,1);d.querySelector('.chat-hide').click();assert.equal(d.querySelector('#chat-log').textContent,'');assert.equal(w.isVisitorBlocked('peer'),false);assert.equal(w.isChatHidden('peer'),true);
});
