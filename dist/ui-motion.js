const closing=new WeakSet();
export function closeDialog(dialog){
 if(!dialog.open||closing.has(dialog))return;
 if(!dialog.animate||matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('still')){dialog.close();return;}
 closing.add(dialog);const motion=dialog.animate([{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(12px) scale(.965)'}],{duration:170,easing:'cubic-bezier(.4,0,1,1)'});
 motion.finished.catch(()=>{}).then(()=>{dialog.close();closing.delete(dialog);});
}
