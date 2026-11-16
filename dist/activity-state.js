const gestures=['','wave','bubble','warm','eat','roast','drink'];
export const activityGestures=[...gestures,'odeng-eat','marshmallow-carry','marshmallow-roast','marshmallow-toasted','marshmallow-eat','coffee-carry','coffee-drink','cocoa-carry','cocoa-drink','balloon-carry','icecream-carry','icecream-eat'];
export function encodeActivity({gesture='',heldItem='',roast=0}={}){
 if(['coffee','cocoa'].includes(heldItem))return heldItem+(gesture==='drink'?'-drink':'-carry');
 if(heldItem==='bubble-wand')return'bubble';
 if(['balloon','icecream'].includes(heldItem))return heldItem+(heldItem==='icecream'&&gesture==='eat'?'-eat':'-carry');
 if(heldItem==='odeng')return'odeng-eat';
 if(heldItem==='marshmallow')return gesture==='eat'?'marshmallow-eat':gesture==='roast'?'marshmallow-roast':roast>=1?'marshmallow-toasted':'marshmallow-carry';
 return gestures.includes(gesture)?gesture:'';
}
export function decodeActivity(value){
 if(value.startsWith('coffee-')||value.startsWith('cocoa-'))return{heldItem:value.split('-')[0],gesture:value.endsWith('drink')?'drink':''};
 if(value.startsWith('balloon-')||value.startsWith('icecream-'))return{heldItem:value.split('-')[0],gesture:value.endsWith('eat')?'eat':''};
 if(value==='odeng-eat')return{heldItem:'odeng',gesture:'eat'};
 if(value.startsWith('marshmallow-'))return{heldItem:'marshmallow',gesture:value==='marshmallow-eat'?'eat':value==='marshmallow-roast'?'roast':'',roast:value==='marshmallow-toasted'||value==='marshmallow-eat'?1:value==='marshmallow-roast'?.5:0};
 return{gesture:gestures.includes(value)?value:''};
}
