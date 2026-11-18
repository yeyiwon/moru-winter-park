import * as T from './vendor/three.module.js';
import {makeBuilder,mergeFinish,materials} from './architecture-kit.js';
const sharedMaterials=materials();for(const material of Object.values(sharedMaterials))material.userData.shared=true;
// Two adult-sized sockets fit inside the curved arms; shared finish keeps batching cheap.
export function buildWinterBench(spec,m=sharedMaterials){
 const root=new T.Group();root.name=spec.id||'winter-bench';root.position.set(spec.x,0,spec.z);root.rotation.y=spec.yaw||0;const b=makeBuilder(root),width=3.9;
 for(let i=0;i<6;i++)b.box(width,.10,.145,m.cedar,0,.59,-.39+i*.16);
 for(let i=0;i<4;i++)b.box(width,.13,.12,m.cedar,0,.88+i*.17,-.49-i*.045);
 for(const side of [-1,1]){const x=side*1.78;b.tube([[x,.1,-.48],[x,.58,-.48],[x,1.52,-.65]],.055,m.navy);b.tube([[x,.1,.4],[x,.64,.4],[x,.99,.22],[x,1.02,-.29],[x,.95,-.54]],.05,m.navy);b.tube([[x,.95,.25],[x,1.01,-.1],[x,.96,-.51]],.058,m.brass);b.oval(m.brass,x,1.54,-.65,.075,.075,.075);b.box(.22,.055,.4,m.navy,x,.08,.31);}
 b.box(width-.12,.04,.15,m.snow,0,1.48,-.63);b.box(width,.025,.035,m.brass,0,.7,-.5);
 for(const x of [-1.7,0,1.7])for(const y of [.89,1.23])b.oval(m.brass,x,y,-.39,.024,.024,.018);
 mergeFinish(root);return root;
}
