export const preferenceKey='winter-preferences-v1';
export const musicStyles={waltz:'왈츠·발레',jazz:'재즈',piano:'피아노',cinematic:'시네마틱'};
export const musicPaces={gentle:'잔잔하게',bright:'조금 경쾌하게'};
export function normalizePreferences(value={}){
 return {ai:value?.ai===true,style:Object.hasOwn(musicStyles,value?.style)?value.style:'waltz',pace:Object.hasOwn(musicPaces,value?.pace)?value.pace:'gentle',reduceFlash:value?.reduceFlash===true};
}
export function readPreferences(storage=globalThis.localStorage){try{return normalizePreferences(JSON.parse(storage.getItem(preferenceKey)));}catch{return normalizePreferences();}}
export function savePreferences(value,storage=globalThis.localStorage){const prefs=normalizePreferences(value);try{storage.setItem(preferenceKey,JSON.stringify(prefs));return true;}catch{return false;}}
export const musicTags={
 'first-snow':['piano','gentle'],'moonlight':['piano','gentle'],
 'cinematic-christmas-piano-strings-bells':['cinematic','bright'],
 'christmas-cinematic-dream-piano':['cinematic','gentle'],
 'warm-winter':['piano','gentle'],'snow-fall-winter':['piano','gentle'],
 'winter-jazz':['jazz','gentle'],'winter-waltz':['waltz','bright'],
 'snow-globe':['cinematic','bright'],'wonderful-night':['cinematic','gentle'],
 'ethereal-winter-ballet-02':['waltz','gentle'],
};
export function rankMusic(tracks,prefs){return [...tracks].sort((a,b)=>score(b)-score(a));function score(t){const tags=musicTags[t.id]||[];return (tags[0]===prefs.style?3:0)+(tags[1]===prefs.pace?1:0);}}
