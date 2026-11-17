// Dispose only an exclusively owned subtree. Materials explicitly marked as
// shared (e.g. character fur) belong to the application cache, not this owner.
export function disposeOwnedScene(root){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 root.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])if(!m.userData.shared)materials.add(m);});
 for(const m of materials){for(const v of Object.values(m))if(v?.isTexture&&!v.userData.shared)textures.add(v);for(const u of Object.values(m.uniforms||{}))if(u.value?.isTexture&&!u.value.userData.shared)textures.add(u.value);}
 root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
 return{geometries:geometries.size,materials:materials.size,textures:textures.size};
}
