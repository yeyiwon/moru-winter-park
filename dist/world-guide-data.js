import {conservatoryEntry} from './conservatory-layout.js';
// Shared allowlist: generated guidance can only name places the live world actually has.
export const guidePlaces=[
 {id:'ski',name:'스키장',x:-36,z:-185,aliases:['스키','리프트','설산']},
 {id:'onsen',name:'온천',x:-10,z:116,aliases:['온천','탕','쉬기']},
 {id:'sauna',name:'찜질방',x:12,z:113.6,aliases:['찜질','실내','차']},
 {id:'tree',name:'소원 트리',x:108,z:53,aliases:['트리','장식','나무']},
 {id:'post-office',name:'소원 우체국',x:90,z:46,aliases:['우체국','편지','소원']},
 {id:'skating',name:'아이스링크',x:-32,z:105.3,aliases:['스케이트','아이스','얼음']},
 {id:'quiz',name:'지식 연구소',x:44,z:24,aliases:['퀴즈','문제','지식']},
 {id:'festival-photo',name:'겨울 포토존',x:-65,z:8,aliases:['사진','포토존','정원']},
 {id:'greenhouse',name:'오로라 온실',...conservatoryEntry,aliases:['온실','폭포','식물','오로라']}
];
export {decorationKinds,decorationColors} from './decorations.js';
export const gardenPresets={forest:{name:'숲',color:'#91dbc3',text:'식물은 빛을 에너지로 바꾸어 광합성을 합니다.'},moon:{name:'달빛',color:'#b8cfd1',text:'달빛은 달에서 생긴 빛이 아니라 반사된 태양빛입니다.'},aurora:{name:'오로라',color:'#d7b5f0',text:'오로라는 대기 속 입자가 에너지를 받아 빛을 낼 때 나타납니다.'}};
