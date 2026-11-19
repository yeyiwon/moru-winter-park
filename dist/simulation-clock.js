// Bound catch-up work after stalls. Physics keeps a stable 60 Hz step without
// trying to simulate seconds spent in another tab or an open settings panel.
export function shouldPauseSimulation({blocked,transitioning=false,mode='',exhibit=false,ready=true}){
 // A shared vehicle follows server time even while its passenger reads or types.
 // Input remains blocked separately; pausing its pose would expire the seat lease.
 return ready&&(transitioning||blocked&&!exhibit&&!['lift','ferris','carousel'].includes(mode));
}
export function createSimulationClock({step=1/60,maxSteps=4}={}){
 let remainder=0;
 return{reset(){remainder=0;},advance(delta,simulate){
  remainder=Math.min(step*maxSteps,remainder+Math.max(0,Number.isFinite(delta)?delta:0));
  let count=0;while(remainder+1e-9>=step&&count<maxSteps){simulate(step);remainder=Math.max(0,remainder-step);count++;}return count;
 }};
}
