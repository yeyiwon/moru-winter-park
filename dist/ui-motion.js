const closing=new WeakMap();
// Reopening invalidates the old animation before cancelling its promise. A
// settled callback can therefore never close the newly reopened interaction.
export function cancelDialogClose(dialog){
 const pending=closing.get(dialog);if(!pending)return;
 closing.delete(dialog);pending.motion.cancel();
}
export function closeDialog(dialog){
 if(!dialog.open||closing.has(dialog))return;
 if(!dialog.animate||matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('still')){dialog.close();return;}
 const motion=dialog.animate(dialog.id==='studio'?[{opacity:1},{opacity:0}]:[{opacity:1,translate:'0 0'},{opacity:0,translate:'0 8px'}],{duration:170,easing:'cubic-bezier(.4,0,1,1)'}),pending={motion};
 closing.set(dialog,pending);
 motion.finished.catch(()=>{}).then(()=>{if(closing.get(dialog)!==pending)return;closing.delete(dialog);if(dialog.open)dialog.close();});
}
