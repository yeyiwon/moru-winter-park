// One catalog is used by the picker, session validation and all character renderers.
export const wardrobeSlots={
 head:[['cat-ears','고양이 귀'],['bunny-ears','토끼 귀'],['bear-ears','곰 귀'],['little-horns','뿔'],['crown','실버 왕관'],['winter-flower','눈꽃 장식'],['santa','산타 모자'],['earmuffs','귀마개'],['helmet','스키 헬멧'],['tree-star','트리 요정 별'],['pine-cap','작은 크리스마스 트리'],['witch-hat','꼬마 마녀 모자'],['pumpkin-cap','호박 베레모'],['ghost-cap','꼬마 유령'],['antlers','루돌프 뿔'],['moon-cap','별밤 마법사'],['dino-hood','공룡 후드']],
 nose:[['glow-nose','반짝 루돌프 코']],
 audio:[['earbuds','무선 이어폰'],['headphones','실버 헤드셋'],['cat-headphones','고양이 헤드셋']],
 glasses:[['googly-glasses','눈알 안경'],['silver-glasses','동그란 실버 안경'],['sunglasses','클래식 선글라스'],['oval-sunglasses','작은 오벌 선글라스'],['cat-eye-sunglasses','캣아이 선글라스'],['heart-glasses','하트 안경'],['star-glasses','별 장식 안경'],['goggles','겨울 고글']],
 eyes:[['eyes-oval','작은 타원 눈'],['eyes-round','큰 동그란 눈'],['eyes-sparkle','초롱초롱 눈'],['eyes-star','클레이 별눈'],['eyes-heart','클레이 하트눈'],['eyes-happy','반달 눈'],['eyes-gentle','순한 동그란 눈'],['eyes-droopy','부드러운 처진 눈'],['eyes-goofy','멍한 눈'],['eyes-serious','엄근진 눈'],['eyes-flat','일자 눈']],
 tail:[['tail-cat','복슬 고양이 꼬리'],['tail-round','동그란 꼬리']],
 gear:[['ski','스키와 부츠'],['board','보드와 부츠']],
 earTone:[['ear-tone-cream','크림'],['ear-tone-lilac','라일락']],
};
export const wardrobeItems=Object.values(wardrobeSlots).flat().map(([id])=>id);
export const wardrobeCategories=[['color','색상'],['eyes','눈'],['head','머리 장식'],['audio','이어폰 · 헤드셋'],['glasses','안경'],['nose','코 장식'],['tail','꼬리'],['gear','장비']];
export const furPalettes=[
 ['기본',[['#f4eee5','우유'],['#dfc79f','크림'],['#b89c82','코코아'],['#8996a6','실버']]],
 ['파스텔',[['#c7b4e7','라벤더'],['#eeb7cb','로즈'],['#acdacb','민트'],['#93a9ce','하늘']]],
 ['선명한 색',[['#d98468','살구'],['#b94e68','크랜베리'],['#477fa7','블루'],['#428578','포레스트']]],
 ['어두운 색',[['#17191e','블랙'],['#303d52','네이비'],['#55413d','초콜릿'],['#534560','플럼']]],
 ['겨울 색',[['#e3eff4','아이스'],['#c8d9dc','프로스트'],['#dcd1e4','진주'],['#a5bbc9','겨울 안개']]],
];
// Retired choices are accepted on old sessions, then removed at the boundary.
const retiredItems=['bangs-soft','bangs-side','bangs-curl','mushroom-cap','star','ribbon','fur-hat','winter-cap','ear-fit-close','ear-fit-wide','eyes-sleepy','eyes-playful','beanie','beret','soft-scarf','neck-ribbon','bow-tie','bell','winter-cape','snow-pendant'];
const slots=Object.values(wardrobeSlots).map(options=>options.map(([id])=>id));
export function selectedItems(value){return [...new Set(String(value||'').split(','))].filter(v=>wardrobeItems.includes(v));}
export function normalizeWardrobe(value){
 const items=selectedItems(value),winners=slots.map(slot=>{const chosen=items.filter(v=>slot.includes(v));if(chosen.includes('helmet'))return 'helmet';if(chosen.includes('goggles'))return 'goggles';if(chosen.includes('board'))return 'board';return chosen.at(-1);});
 const chosen=items.filter(v=>winners.includes(v));
 // A headpiece and over-ear headset compete for the same space; last choice wins.
 const head=wardrobeSlots.head.map(([id])=>id),overEar=['headphones','cat-headphones'];
 const conflict=chosen.filter(id=>head.includes(id)||overEar.includes(id));
 return chosen.filter(id=>!conflict.includes(id)||id===conflict.at(-1)).join(',')||'none';
}
export function clearSlot(value,slot){const ids=wardrobeSlots[slot]?.map(([id])=>id)||[];return normalizeWardrobe(selectedItems(value).filter(id=>!ids.includes(id)).join(','));}
export function toggleItem(value,item){if(item==='none')return 'none';if(!wardrobeItems.includes(item))return normalizeWardrobe(value);let items=selectedItems(value);if(items.includes(item))items=items.filter(v=>v!==item);else{const slot=slots.find(group=>group.includes(item));items=items.filter(v=>!slot?.includes(v));items.push(item);}return normalizeWardrobe(items.join(','));}
export function characterAppearance(value){return {fur:value.fur,furTop:/^#[0-9a-f]{6}$/i.test(value.furTop)?value.furTop:null,accessory:normalizeWardrobe(value.accessory),fluff:value.fluff,roundness:value.roundness};}
// Only first admission uses this look. Returning visitors retain their saved choices.
export function randomAppearance(random=Math.random){
 const pick=items=>items[Math.min(items.length-1,Math.floor(random()*items.length))];
 const colors=furPalettes.flatMap(([,items])=>items.map(([color])=>color));
 const head=pick(['none',...wardrobeSlots.head.map(([id])=>id).filter(id=>id!=='helmet'&&id!=='dino-hood'),'headphones','cat-headphones']);
 return {fur:pick(colors),furTop:null,accessory:normalizeWardrobe([head,pick(wardrobeSlots.eyes)[0],pick(['none','tail-cat','tail-round'])].join(',')),fluff:85+Math.round(random()*15),roundness:35+Math.round(random()*45)};
}
export function validateAppearance(value){
 if(!value||typeof value!=='object'||!/^#[0-9a-f]{6}$/i.test(value.fur)||typeof value.accessory!=='string'||value.accessory.length>512)throw Error('외형 정보를 확인해 주세요.');
 if(value.accessory!=='none'&&value.accessory.split(',').some(id=>!wardrobeItems.includes(id)&&!retiredItems.includes(id)))throw Error('지원하지 않는 장식이 포함되어 있어요.');
 if(value.furTop!=null&&!/^#[0-9a-f]{6}$/i.test(value.furTop))throw Error('머리 색상을 확인해 주세요.');
 if(!Number.isFinite(value.fluff)||value.fluff<50||value.fluff>100||!Number.isFinite(value.roundness)||value.roundness<0||value.roundness>100)throw Error('외형 값을 확인해 주세요.');
 return characterAppearance(value);
}
