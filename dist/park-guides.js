import {createFluffyGuide} from './fluffy-guide.js';
import {parkGuideLayout} from './park-guide-layout.js';
import {createPlazaSnowman} from './plaza-snowman.js';
export function createParkGuides(scene,{document=globalThis.document}={}){
 const guides={plaza:createPlazaSnowman(scene),tree:createFluffyGuide(scene,{role:'tree',...parkGuideLayout.tree})};
 const hint=document?.createElement('div');if(hint){hint.id='park-guide-hint';hint.hidden=true;hint.setAttribute('role','status');document.body.append(hint);}
 const armed=new Set(Object.keys(guides));let showing='',until=0,last=-Infinity;
 return{guides,setQuality(q){Object.values(guides).forEach(g=>g.setQuality(q));},update(time,still,player,{interior=false,blocked=false}={}){
  for(const [id,guide]of Object.entries(guides)){const p=parkGuideLayout[id],distance=Math.hypot(player.x-p.x,player.z-p.z);guide.root.visible=!interior&&distance<90;guide.update(time,still,player);}
  if(!hint||time-last<.1)return;last=time;
  let nearby='';for(const [id,p]of Object.entries(parkGuideLayout)){const d=Math.hypot(player.x-p.x,player.z-p.z);if(d>6)armed.add(id);else if(id==='tree'&&d<4.3)nearby=id;}
  if(interior||blocked||!nearby){hint.hidden=true;showing='';return;}
  if(armed.has(nearby)){armed.delete(nearby);showing=nearby;until=time+6;hint.textContent=parkGuideLayout[nearby].message;}
  hint.hidden=showing!==nearby||time>until;
 },dispose(){Object.values(guides).forEach(g=>g.dispose());hint?.remove();}};
}
