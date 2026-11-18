import * as T from './vendor/three.module.js';
// Shared by the park and tree court: low hexagonal stone, snow between joints.
export const pavingColors=['#bfc3c4','#d4d0c6','#c6c9cc'];
export function createStonePaving(capacity){const mesh=new T.InstancedMesh(new T.CylinderGeometry(.42,.46,.028,6),new T.MeshStandardMaterial({color:'#ffffff',roughness:.98,metalness:0}),capacity);mesh.receiveShadow=true;return mesh;}
