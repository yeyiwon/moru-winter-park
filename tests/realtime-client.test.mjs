import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';import path from 'node:path';
test('slow transport bounds pending poses and resumes with the newest position, including rejection recovery',async()=>{
 let now=10000,tick,position=0,ws;const eventTarget={addEventListener(){},removeEventListener(){}};
 class Socket{constructor(){ws=this;this.readyState=1;this.bufferedAmount=0;this.messages=[];}send(raw){this.messages.push(JSON.parse(raw));}close(){}receive(value){this.onmessage({data:JSON.stringify(value)});}}
 const context=vm.createContext({window:eventTarget,document:{...eventTarget,hidden:false},performance:{now:()=>now},Date,Math,Map,JSON,Number,setInterval:fn=>(tick=fn,1),setTimeout:()=>2,clearInterval(){},clearTimeout(){}}),modules=new Map();
 async function load(file){if(modules.has(file))return modules.get(file);const mod=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});modules.set(file,mod);await mod.link(s=>load(path.resolve(path.dirname(file),s)));return mod;}
 const mod=await load(path.resolve('dist/realtime-client.js'));await mod.evaluate();const client=mod.namespace.createRealtimeClient({request:async()=>({enabled:true,url:'ws://local',ticket:'test'}),pose:()=>({x:position,speed:1}),onSnapshot(){},Socket,clock:()=>now});
 await client.connect();ws.onopen();ws.receive({type:'ready',people:[]});for(let i=0;i<20;i++){now+=100;position++;tick();}assert.equal(ws.messages.length,2,'no stale queue accumulates while acknowledgements are delayed');
 ws.receive({type:'snapshot',ack:1,people:[]});now+=100;position=88;tick();assert.equal(ws.messages.at(-1).pose.x,88);assert.equal(ws.messages.length,3);
 ws.receive({type:'rejected',code:'rate'});now+=100;tick();assert.equal(ws.messages.length,3);now+=100;tick();assert.equal(ws.messages.length,4,'rejection releases pending slots after a short pause');client.dispose();
});
