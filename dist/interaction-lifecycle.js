// A completed prompt stays dismissed until the player actually leaves its area.
// Positions, not frame counters, make re-entry work at any frame rate or device size.
export function createInteractionLifecycle(){
 let state='Idle',current=null;const dismissed=new Map();
 function finish(){if(current){state='Exiting';dismiss(current);}current=null;state='Idle';}
 function dismiss(area){if(area?.id&&Number.isFinite(area.x+area.z))dismissed.set(area.id,{...area,r:(area.r||4.2)+1});}
 return{
  get state(){return state;},get current(){return current;},
  enter(area){finish();current=area?{...area}:null;state='Entering';},
  activate(){if(state==='Entering')state='Active';},
  finish,dismiss,
  allow(area,x,z){const previous=dismissed.get(area.id);if(!previous)return true;if(Math.hypot(x-previous.x,z-previous.z)<=previous.r)return false;dismissed.delete(area.id);return true;},
  update(x,z){for(const [id,p]of dismissed)if(Math.hypot(x-p.x,z-p.z)>p.r)dismissed.delete(id);},
  reset(){finish();dismissed.clear();}
 };
}
