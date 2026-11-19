import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldPauseSimulation,createSimulationClock} from '../dist/simulation-clock.js';

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
