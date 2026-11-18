const key='winter-last-scene';
export function createLoadingBackdrop(root){
 try{const image=sessionStorage.getItem(key);if(image?.startsWith('data:image/jpeg;base64,')&&image.length<150000)root.style.setProperty('--loading-scene',`url("${image}")`);}catch{}
 return {capture(source){
  // Called directly after the first real render, before WebGL clears its buffer.
  // One small JPEG per visit; never capture DOM, chat, or nickname labels.
  try{const image=document.createElement('canvas'),scale=Math.min(1,480/Math.max(source.width,source.height));image.width=Math.round(source.width*scale);image.height=Math.round(source.height*scale);image.getContext('2d').drawImage(source,0,0,image.width,image.height);const data=image.toDataURL('image/jpeg',.65);if(data.length<150000)sessionStorage.setItem(key,data);}catch{}
 }};
}
