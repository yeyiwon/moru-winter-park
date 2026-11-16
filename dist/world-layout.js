export const islands=[
  {id:'park',name:'별빛 놀이공원',subject:'도덕과 판단',x:0,z:0,r:20,color:'#c9adff',spawn:{x:2.6,z:8}},
  {id:'science',name:'유리별 관측소',subject:'과학 · 수학과 논리',x:0,z:-53,r:16,color:'#97d6f2',spawn:{x:0,z:-44}},
  {id:'law',name:'달빛 기록원',subject:'법과 사회 · 생명윤리',x:46,z:-27,r:16,color:'#eac795',spawn:{x:40,z:-22}},
  {id:'philosophy',name:'거울 숲',subject:'철학자',x:46,z:27,r:16,color:'#c3aff1',spawn:{x:39,z:23}},
  {id:'nature',name:'숨쉬는 정원',subject:'동물과 환경',x:0,z:53,r:17,color:'#a0dfbd',spawn:{x:0,z:44}},
  {id:'art',name:'울림 극장',subject:'예술과 음악',x:-46,z:27,r:16,color:'#e9afc8',spawn:{x:-39,z:23}},
  {id:'history',name:'시간의 항구',subject:'역사와 문화 · 세상과 언어',x:-46,z:-27,r:16,color:'#edc88d',spawn:{x:-39,z:-23}}
];
export const bridges=[[islands[0],islands[1]],[islands[0],islands[2]],[islands[2],islands[3]],[islands[0],islands[4]],[islands[4],islands[5]],[islands[5],islands[6]]];
export function bridgeHeight(x,z){for(const [a,b] of bridges){const length=Math.hypot(b.x-a.x,b.z-a.z),d=((x-a.x)*(b.x-a.x)+(z-a.z)*(b.z-a.z))/length,start=a.r-1,end=length-b.r+1;if(d>=start&&d<=end&&segmentDistance(x,z,a,b)<2.7)return .09+Math.sin((d-start)/(end-start)*Math.PI)*1.35;}return .09;}
export function segmentDistance(x,z,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a.x-t*dx,z-a.z-t*dz);}
export function terrainAt(x,z){return islands.some(i=>Math.hypot(x-i.x,z-i.z)<=i.r-1.3)||bridges.some(([a,b])=>segmentDistance(x,z,a,b)<1.65);}
export function islandAt(x,z){return islands.find(i=>Math.hypot(x-i.x,z-i.z)<i.r+1);}

// Learning functions remain independent of the seven visual island identities.
export const rooms=[
{id:'curiosity',name:'호기심 전시실',door:{x:-5,z:-46}},
{id:'perspective',name:'관점의 방',door:{x:40,z:-24}},
{id:'logic',name:'논리 공방',door:{x:44,z:24}},
{id:'probability',name:'확률 실험실',door:{x:2.6,z:5.1}},
{id:'garden',name:'관찰의 정원',door:{x:-6,z:49}},
{id:'memory',name:'기억 서재',door:{x:-40,z:-24}}
];
export const exhibits=[
{id:'park-choices',room:'probability',island:'park',name:'별빛 놀이공원',x:2.6,z:5.1,color:'#cfb9eb',fields:['확률','경제']},
{id:'observatory',room:'curiosity',island:'science',name:'유리별 관측소',x:-5,z:-46,color:'#a7cedd',fields:['과학','기술']},
{id:'logic-device',room:'logic',island:'science',name:'관측소 · 논리 공방',x:6,z:-49,color:'#b2bfd9',fields:['논리']},
{id:'archive-law',room:'perspective',island:'law',name:'달빛 기록원',x:40,z:-24,color:'#ddc69d',fields:['법','미디어']},
{id:'archive-ethics',room:'perspective',island:'law',name:'기록원 · 생명윤리',x:52,z:-22,color:'#d9bbb5',fields:['윤리','생명']},
{id:'mirror-ideas',room:'perspective',island:'philosophy',name:'거울 숲',x:44,z:24,color:'#c2b2db',fields:['철학','윤리']},
{id:'garden-watch',room:'garden',island:'nature',name:'숨쉬는 정원',x:-6,z:49,color:'#a7cbb6',fields:['생명','과학']},
{id:'lyre-listen',room:'garden',island:'art',name:'울림 극장',x:-39,z:26,color:'#d5b1c4',fields:['예술','언어']},
{id:'harbour-history',room:'memory',island:'history',name:'시간의 항구',x:-40,z:-24,color:'#ddc497',fields:['역사','경제']},
{id:'harbour-memory',room:'memory',island:'history',name:'항구 · 기억 서재',x:-52,z:-23,color:'#aac9d0',review:true}
];

export function surfaceHeight(x,z){let h=bridgeHeight(x,z);for(const [cx,cz,r]of [[47,-30,5.5],[0,53,4.7],[-46,25,6],[-45,-29,4]]){const d=Math.hypot(x-cx,z-cz),t=Math.max(0,Math.min(1,(r+.2-d)/.6));h=Math.max(h,.09+.13*t);}return h;}
