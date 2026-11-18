import {balloonColors,balloonStyles} from './balloon-design.js';
const gestures=['','wave','bubble','warm','eat','roast','drink','heart','joy','sad','surprise','dance'];
export const activityGestures=[...gestures,...balloonStyles.flatMap(style=>balloonColors.map((_,tone)=>`balloon-${style}-${tone}`)),'odeng-eat','marshmallow-carry','marshmallow-roast','marshmallow-toasted','marshmallow-eat','coffee-carry','coffee-drink','cocoa-carry','cocoa-drink','balloon-carry','icecream-carry','icecream-eat','candyfloss-carry','candyfloss-eat','popcorn-carry','popcorn-eat','bubble-carry','sparkler-carry'];
export function encodeActivity({gesture='',heldItem='',roast=0,balloonStyle='classic',balloonTone=0}={}){
 if(['heart','joy','sad','surprise','dance'].includes(gesture))return gesture;
 if(['coffee','cocoa'].includes(heldItem))return heldItem+(gesture==='drink'?'-drink':'-carry');
 if(heldItem==='sparkler')return'sparkler-carry';
 if(heldItem==='bubble-wand')return gesture==='bubble'?'bubble':'bubble-carry';
 if(heldItem==='balloon')return `balloon-${balloonStyles.includes(balloonStyle)?balloonStyle:'classic'}-${Number.isInteger(balloonTone)&&balloonTone>=0&&balloonTone<balloonColors.length?balloonTone:0}`;
 if(['icecream','candyfloss','popcorn'].includes(heldItem))return heldItem+(heldItem!=='balloon'&&gesture==='eat'?'-eat':'-carry');
 if(heldItem==='odeng')return'odeng-eat';
 if(heldItem==='marshmallow')return gesture==='eat'?'marshmallow-eat':gesture==='roast'?'marshmallow-roast':roast>=1?'marshmallow-toasted':'marshmallow-carry';
 return gestures.includes(gesture)?gesture:'';
}
export function decodeActivity(value){
 if(value.startsWith('balloon-')&&value!=='balloon-carry'&&activityGestures.includes(value)){const [,balloonStyle,tone]=value.split('-');return{heldItem:'balloon',gesture:'',balloonStyle,balloonTone:Number(tone)};}
 if(value==='sparkler-carry')return{heldItem:'sparkler',gesture:''};
 if(value==='bubble-carry')return{heldItem:'bubble-wand',gesture:''};
 if(value.startsWith('coffee-')||value.startsWith('cocoa-'))return{heldItem:value.split('-')[0],gesture:value.endsWith('drink')?'drink':''};
 if(value.startsWith('balloon-')||value.startsWith('icecream-')||value.startsWith('candyfloss-')||value.startsWith('popcorn-'))return{heldItem:value.split('-')[0],gesture:value.endsWith('eat')?'eat':''};
 if(value==='odeng-eat')return{heldItem:'odeng',gesture:'eat'};
 if(value.startsWith('marshmallow-'))return{heldItem:'marshmallow',gesture:value==='marshmallow-eat'?'eat':value==='marshmallow-roast'?'roast':'',roast:value==='marshmallow-toasted'||value==='marshmallow-eat'?1:value==='marshmallow-roast'?.5:0};
 return{gesture:gestures.includes(value)?value:''};
}
