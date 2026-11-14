export const islands=[
  {id:'park',name:'별빛 놀이공원',subject:'도덕과 판단',x:0,z:0,r:20,color:'#c9adff',spawn:{x:2.6,z:8}},
  {id:'science',name:'유리별 관측소',subject:'과학 · 수학과 논리',x:0,z:-53,r:16,color:'#97d6f2',spawn:{x:0,z:-44}},
  {id:'law',name:'달빛 기록원',subject:'법과 사회 · 생명윤리',x:46,z:-27,r:16,color:'#eac795',spawn:{x:40,z:-22}},
  {id:'philosophy',name:'거울 숲',subject:'철학자',x:46,z:27,r:16,color:'#c3aff1',spawn:{x:39,z:23}},
  {id:'nature',name:'숨쉬는 정원',subject:'동물과 환경',x:0,z:53,r:17,color:'#a0dfbd',spawn:{x:0,z:44}},
  {id:'art',name:'울림 극장',subject:'예술과 음악',x:-46,z:27,r:16,color:'#e9afc8',spawn:{x:-39,z:23}},
  {id:'history',name:'시간의 항구',subject:'역사와 문화 · 세상과 언어',x:-46,z:-27,r:16,color:'#edc88d',spawn:{x:-39,z:-23}}
];
export const bridges=[...islands.slice(1).map(i=>[islands[0],i]),...islands.slice(1).map((i,n)=>[i,islands[1+(n+1)%6]])];
export function segmentDistance(x,z,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a.x-t*dx,z-a.z-t*dz);}
export function terrainAt(x,z){return islands.some(i=>Math.hypot(x-i.x,z-i.z)<=i.r-1.3)||bridges.some(([a,b])=>segmentDistance(x,z,a,b)<1.8);}
export function islandAt(x,z){return islands.find(i=>Math.hypot(x-i.x,z-i.z)<i.r+1);}
