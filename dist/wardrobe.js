export const wardrobeItems=['star','ribbon','sunglasses','santa','goggles','ski','board'];
export function selectedItems(value){return [...new Set(String(value||'').split(','))].filter(v=>wardrobeItems.includes(v));}
export function normalizeWardrobe(value){const items=selectedItems(value);return items.filter(v=>!(v==='sunglasses'&&items.includes('goggles'))&&!(v==='ski'&&items.includes('board'))).join(',')||'none';}
export function toggleItem(value,item){if(item==='none')return 'none';let items=selectedItems(value);if(items.includes(item))items=items.filter(v=>v!==item);else{const opposite={sunglasses:'goggles',goggles:'sunglasses',ski:'board',board:'ski'};items=items.filter(v=>v!==opposite[item]);items.push(item);}return normalizeWardrobe(items.join(','));}
