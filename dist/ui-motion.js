const closing=new WeakSet();
export function closeDialog(dialog){
 if(!dialog.open||closing.has(dialog))return;
 if(!dialog.animate||matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('still')){dialog.close();return;}
 closing.add(dialog);const motion=dialog.animate(dialog.id==='studio'?[{opacity:1},{opacity:0}]:[{opacity:1,translate:'0 0'},{opacity:0,translate:'0 8px'}],{duration:170,easing:'cubic-bezier(.4,0,1,1)'});
 motion.finished.catch(()=>{}).then(()=>{dialog.close();closing.delete(dialog);});
}
