import {characterAppearance,validateAppearance} from './wardrobe.js';
// The committed look is never mutated while editing or while a save is in flight.
export function createAppearanceDraft(initial,{save,commit,changed=()=>{}}){
 let saved=characterAppearance(initial),draft={...saved},saving=false,error='';
 const state=()=>({saved:{...saved},draft:{...draft},saving,error,dirty:JSON.stringify(saved)!==JSON.stringify(draft)});
 const emit=()=>changed(state());
 return {state,edit(patch){if(saving)return;draft={...draft,...patch};error='';emit();},cancel(){if(saving)return;draft={...saved};error='';emit();},restore(value){if(saving)return;saved=characterAppearance(value);draft={...saved};error='';emit();},async save(){if(saving)return false;saving=true;error='';emit();try{const result=validateAppearance(await save(validateAppearance(draft)));commit(result);saved={...result};draft={...result};return true;}catch(e){error=e.message||'저장하지 못했어요. 다시 시도해 주세요.';return false;}finally{saving=false;emit();}}};
}
