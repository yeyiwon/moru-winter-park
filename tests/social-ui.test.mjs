import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';import {JSDOM} from 'jsdom';
const root=path.resolve('dist');
test('guest chat keeps its layout on blur, shares one join, preserves recent messages and never deletes identity on unload',async t=>{
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://winter.test/',runScripts:'outside-only',pretendToBeVisual:true});t.after(()=>dom.window.close());const w=dom.window,d=w.document;w.matchMedia=()=>({matches:true});let joins=0,releaseJoin,leaves=0,inviteOpened=0;d.querySelector('#open-social').onclick=()=>inviteOpened++;w.labPlayerState={x:0,y:.95,z:24,yaw:0};
 w.fetch=async(url,init={})=>{let data={};if(url==='/api/access')data={admin:false,session:null};else if(url==='/api/join'){joins++;await new Promise(resolve=>releaseJoin=resolve);data={id:'abc123',name:'검사 손님',room:'winter-plaza'};}else if(url==='/api/presence')data={people:[],count:1};else if(url==='/api/chat')data={name:'검사 손님',message:JSON.parse(init.body).message,at:Date.now()};else if(url==='/api/leave')leaves++;return{ok:true,json:async()=>data};};w.navigator.sendBeacon=()=>{leaves++;};
 const modules=new Map(),context=dom.getInternalVMContext();async function mod(file){if(modules.has(file))return modules.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});modules.set(file,m);await m.link(s=>mod(path.resolve(path.dirname(file),s)));return m;}await(await mod(path.join(root,'social.js'))).evaluate();await new Promise(r=>setTimeout(r,0));
 d.querySelector('#chat-toggle').click();const input=d.querySelector('#chat-input');input.value='테스트 메시지';input.blur();assert.ok(d.body.classList.contains('chat-typing'),'blur must not move the send button before pointerup');d.querySelector('#chat-form').dispatchEvent(new w.Event('submit',{cancelable:true}));assert.equal(joins,1);releaseJoin();await new Promise(r=>setTimeout(r,10));assert.equal(input.value,'');assert.equal(d.querySelector('#chat-form').hidden,true);assert.ok(!d.querySelector('#chat-log').closest('form'),'closed input must not hide floating messages');assert.match(d.querySelector('#chat-log').textContent,/검사 손님 테스트 메시지/);assert.equal(d.querySelector('#self-bubble').textContent,'테스트 메시지');d.querySelector('#chat-toggle').click();assert.match(d.querySelector('#chat-log').textContent,/테스트 메시지/);assert.equal(inviteOpened,0);w.dispatchEvent(new w.Event('pagehide'));assert.equal(leaves,0);assert.equal(d.querySelector('#open-map').hidden,false);assert.equal(d.querySelector('#open-wardrobe').hidden,false);
});
test('creating an invitation joins its host before sharing and retries the same room after failure',async t=>{
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://winter.test/',runScripts:'outside-only',pretendToBeVisual:true});t.after(()=>dom.window.close());
 const w=dom.window,d=w.document;w.matchMedia=()=>({matches:true});w.labPlayerState={x:0,y:.86,z:30,yaw:0};let invitations=0,inviteJoins=0,releaseJoin;const room='invitation-12345';
 w.fetch=async(url,init={})=>{
  let data={},ok=true;
  if(url==='/api/access')data={admin:true,session:{id:'host-old',name:'관리자',room:'winter-plaza'}};
  else if(url==='/api/invite'){invitations++;data={room,url:'https://backend.test/?room='+room};}
  else if(url==='/api/join'){const body=JSON.parse(init.body);assert.equal(body.room,room);inviteJoins++;await new Promise(resolve=>releaseJoin=resolve);if(inviteJoins===1){ok=false;data={error:'연결 실패'};}else data={id:'host-new',name:'관리자',room};}
  else if(url==='/api/presence')data={people:[],serverTime:Date.now(),count:1};
  return{ok,status:ok?200:503,json:async()=>data};
 };
 const modules=new Map(),context=dom.getInternalVMContext();async function mod(file){if(modules.has(file))return modules.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});modules.set(file,m);await m.link(s=>mod(path.resolve(path.dirname(file),s)));return m;}await(await mod(path.join(root,'social.js'))).evaluate();await new Promise(r=>setTimeout(r,0));
 const submit=()=>d.querySelector('#invite-form').dispatchEvent(new w.Event('submit',{cancelable:true}));
 d.querySelector('#invite-password').value='shared-pass';submit();await new Promise(r=>setTimeout(r,0));assert.equal(d.querySelector('#room-share').hidden,true);assert.equal(w.sharedRoom(),'winter-plaza');
 releaseJoin();await new Promise(r=>setTimeout(r,0));assert.equal(d.querySelector('#room-share').hidden,true);assert.match(d.querySelector('#invite-result').textContent,/재시도/);
 submit();await new Promise(r=>setTimeout(r,0));releaseJoin();await new Promise(r=>setTimeout(r,0));
 assert.equal(invitations,1);assert.equal(inviteJoins,2);assert.equal(w.sharedRoom(),room);assert.equal(w.labGuestId,'host-new');assert.equal(new URL(w.location.href).searchParams.get('room'),room);
 assert.equal(d.querySelector('#room-share').hidden,false);assert.equal(d.querySelector('#invite-url').value,'https://moru-winter-park.vercel.app/?room='+room);assert.match(d.querySelector('#invite-result').textContent,/입장했습니다/);
 assert.equal(d.querySelector('#enter-owned-room'),null);assert.equal(new URL(d.querySelector('#owner-signin').href).searchParams.get('return_to'),'/?room='+room);
});
test('restoring a private session retains its room in the URL, and owner login preserves an unopened invitation',async t=>{
 for(const invited of [false,true]){
  const room='restored-invitation',dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://winter.test/'+(invited?'?room='+room:''),runScripts:'outside-only',pretendToBeVisual:true});t.after(()=>dom.window.close());const w=dom.window,d=w.document;w.matchMedia=()=>({matches:true});let opened=0;d.querySelector('#open-social').onclick=()=>opened++;
  w.fetch=async()=>({ok:true,json:async()=>({admin:false,session:invited?null:{id:'guest',room,name:'손님'}})});
  const modules=new Map(),context=dom.getInternalVMContext();async function mod(file){if(modules.has(file))return modules.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});modules.set(file,m);await m.link(s=>mod(path.resolve(path.dirname(file),s)));return m;}await(await mod(path.join(root,'social.js'))).evaluate();await new Promise(r=>setTimeout(r,0));
  assert.equal(new URL(w.location.href).searchParams.get('room'),room);assert.equal(new URL(d.querySelector('#owner-signin').href).searchParams.get('return_to'),'/?room='+room);assert.equal(opened,invited?1:0);
  if(!invited)assert.equal(d.querySelector('#invite-url').value,'https://moru-winter-park.vercel.app/?room='+room);
 }
});
