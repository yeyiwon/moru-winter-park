import {createFluffyGuide} from './fluffy-guide.js';
import {parkGuideLayout} from './park-guide-layout.js';
export function createPlazaSnowman(scene,options={}){
 const p={...parkGuideLayout.plaza,...options},guide=createFluffyGuide(scene,{role:'plaza',...p,y:(options.y??.09)+.87});
 return{...guide,collision:{x:p.x,z:p.z,r:p.r}};
}
