import {treeLayout} from './tree-layout.js';
// One placement feeds the model, walking collision and nearby-only hints.
export const parkGuideLayout=Object.freeze({
 plaza:Object.freeze({x:-6.5,z:3,r:1.02,yaw:.2,message:'여기서 불꽃놀이를 신청할 수 있어요. 함께 밤하늘을 밝혀 보세요.'}),
 tree:Object.freeze({x:treeLayout.x-7,z:treeLayout.z-12,r:.85,yaw:Math.PI,message:'소원을 빌고, 마음에 드는 장식으로 트리를 꾸며 보세요.'}),
});
