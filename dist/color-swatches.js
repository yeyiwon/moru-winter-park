// Paint colour content separately from CSS surfaces. Forced-dark browsers can
// recolour both flat CSS and small PNG icons, but must preserve canvas pixels.
export function paintSwatches(root=document){
 if(typeof CanvasRenderingContext2D==='undefined')return;
 for(const element of root.querySelectorAll('[style*="--swatch:"]')){
  const color=element.style.getPropertyValue('--swatch').trim();
  if(!/^#[0-9a-f]{6}$/i.test(color))continue;
  const target=element.matches('[data-fur]')?element.querySelector('span'):element.matches('[data-colors]')?element.querySelector('i'):element;
  if(!target)continue;
  let canvas=target.querySelector(':scope > canvas.color-swatch-paint');
  if(element.dataset.paintColor===color&&canvas)continue;
  if(!canvas){canvas=Object.assign(document.createElement('canvas'),{width:64,height:64,className:'color-swatch-paint'});canvas.setAttribute('aria-hidden','true');target.append(canvas);}
  const ctx=canvas.getContext('2d');if(!ctx)continue;
  ctx.clearRect(0,0,64,64);ctx.fillStyle=color;ctx.beginPath();ctx.arc(32,32,32,0,Math.PI*2);ctx.fill();
  target.classList.add('swatch-paint-host');element.classList.add('has-swatch-paint');element.dataset.paintColor=color;
 }
}
