const riding={ski:'Skiing',lift:'RidingLift',ferris:'RidingFerrisWheel',carousel:'RidingCarousel',skate:'Skating',sled:'Sledding'};
const seated=new Set(['bath','sauna','lie','tea','dining','rest','view']);
export function createPlayerState(onTransition=()=>{}){
 let state='Idle',indoor=false;
 return{
  get current(){return state;},get indoor(){return indoor;},
  update({mode='',jump=0,moving=false,running=false,gesture='',room=null}={}){
   indoor=!!room;
   const next=riding[mode]||(seated.has(mode)?'Interacting':jump>0?'Jumping':moving?(running?'Running':'Walking'):gesture?'Interacting':indoor?'Indoor':'Idle');
   if(next!==state){const previous=state;state=next;onTransition({from:previous,to:next});}return state;
  },
  canJump(){return ['Idle','Walking','Running','Indoor'].includes(state);},
  reset(){const previous=state;state='Idle';indoor=false;if(previous!==state)onTransition({from:previous,to:state});}
 };
}
