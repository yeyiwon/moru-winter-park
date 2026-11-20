import {createFluffyGuide} from './fluffy-guide.js';
import {serverNow} from './server-clock.js';
import {observatoryLayout} from './observatory-layout.js';
export function buildObservatoryGuide(parent,{now=serverNow}={}){
 const guide=createFluffyGuide(parent,{role:'scientist',...observatoryLayout.guide,y:.99,yaw:Math.PI/2});
 guide.root.name='observatory-guide';
 const hint=globalThis.document?.createElement('div');if(hint){hint.id='observatory-guide-hint';hint.hidden=true;hint.setAttribute('role','status');hint.textContent='어서 오세요! 하늘을 둘러보며 별을 골라 보세요. 가운데 안내대에서는 별자리 퀴즈도 풀 수 있어요.';document.body.append(hint);}
 let armed=true,until=0,active=false;
 return{...guide,setActive(value){active=value;if(hint)hint.hidden=true;armed=true;},update(time,still,player){guide.update((now()%86400000)/1000,still,player);if(!hint)return;const distance=player?Math.hypot(player.x-600-observatoryLayout.guide.x,player.z-observatoryLayout.guide.z):Infinity;if(distance>7)armed=true;if(active&&distance<5&&armed){armed=false;until=time+8;}hint.hidden=!active||distance>6||time>until;},dispose(){hint?.remove();guide.dispose();}};
}
