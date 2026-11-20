// Raster animation is decoded off the main thread, so world preparation cannot
// freeze the drawing. Pixels also avoid browser auto-dark rewriting SVG strokes.
export function loadingTreePath(){return 'M70 449 C210 407 509 421 532 454 C571 509 8 493 70 449 C182 362 526 307 480 334 C406 379 89 365 126 320 C232 248 452 188 411 207 C345 227 161 212 195 184 C235 149 398 138 360 112 C330 90 307 67 300 32';}
export function createLuminousLoading(root){
 const doc=root.ownerDocument,win=doc.defaultView||window,frame=doc.createElement('div');frame.className='luminous-loading';
 frame.innerHTML='<img class="luminous-tree" width="360" height="324" alt="" aria-hidden="true" draggable="false"><div class="luminous-caption"><p>Loading ...</p></div>';
 const image=frame.querySelector('img'),media=win.matchMedia('(prefers-reduced-motion:reduce)');let running=false;
 function reduced(){let preference;try{preference=win.localStorage.getItem('lab-motion');}catch{}return preference==='full'?false:preference==='reduce'?true:media.matches||doc.body.classList.contains('still');}
 function paint(){const src=running&&!reduced()?'/brand/loading-tree-v59.webp':'/brand/loading-tree-still-v59.webp';if(image.getAttribute('src')!==src)image.src=src;}
 const observer=new win.MutationObserver(paint);observer.observe(doc.body,{attributes:true,attributeFilter:['class']});media.addEventListener?.('change',paint);root.prepend(frame);paint();
 return{start(){running=true;paint();},stop(){running=false;paint();},dispose(){running=false;observer.disconnect();media.removeEventListener?.('change',paint);frame.remove();}};
}
