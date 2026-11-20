import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldPauseSimulation,createSimulationClock} from '../dist/simulation-clock.js';
import {JSDOM} from 'jsdom';
import {worldInputBlocked} from '../dist/game-input.js';

test('chat and keyboard restore retain input ownership',()=>{
 const dom=new JSDOM('<input id="chat-input"><input id="nickname"><dialog></dialog>',{pretendToBeVisual:true}),d=dom.window.document;
 try{
  for(const restoring of [false,true]){
   d.body.className=restoring?'chat-typing chat-restoring':'chat-typing';
   if(restoring)d.activeElement.blur();else d.querySelector('#chat-input').focus();
   assert.equal(worldInputBlocked(d),true);

  }
  for(const cls of ['invite-gate','quiz-open','studio-open','menu-open']){
   d.body.className='chat-typing '+cls;assert.equal(worldInputBlocked(d),true,'chat never bypasses '+cls);
  }
  d.body.className='';d.querySelector('#nickname').focus();assert.equal(worldInputBlocked(d),true);
  d.querySelector('#chat-input').focus();d.querySelector('dialog').setAttribute('open','');assert.equal(worldInputBlocked(d),true);
 }finally{dom.window.close();}
});

test('typing stops walking and skiing but never freezes a shared moving vehicle',()=>{
 for(const mode of ['','ski','summit','bath'])assert.equal(shouldPauseSimulation({blocked:true,mode}),true,mode);
 for(const mode of ['lift','carousel','ferris']){
  let elapsed=0;const clock=createSimulationClock();
  for(let i=0;i<1800;i++)if(!shouldPauseSimulation({blocked:true,mode}))clock.advance(1/60,dt=>elapsed+=dt);
  assert.ok(Math.abs(elapsed-30)<1e-8,mode+' continues throughout a long message');
  assert.equal(shouldPauseSimulation({blocked:true,transitioning:true,mode}),true,'room changes still suspend rendering');
 }
 assert.equal(shouldPauseSimulation({blocked:true,exhibit:true,mode:''}),false);
 assert.equal(shouldPauseSimulation({blocked:true,ready:false}),false,'initial frame must render');
});
