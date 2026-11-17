"""Bake the authored loft anatomy into welded, smoothed, decimated equine surfaces."""
import bpy, json, pathlib
ROOT=pathlib.Path(__file__).resolve().parent.parent
data=json.loads((ROOT/'qa/asset-review/carousel-v3.json').read_text())
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
coats=[]
for variant in range(3):
 item=next(item for item in data['objects'] if item['name']=='sculpted-horse-'+str(variant)+'-painted');g=data['geometries'][item['geometry']];positions=[g['positions'][i:i+3] for i in range(0,len(g['positions']),3)];colors=[g['colors'][i:i+3] for i in range(0,len(g['colors']),3)];base=colors[0];indices=g['indices'] or list(range(len(positions)));faces=[]
 for at in range(0,len(indices),3):
  tri=indices[at:at+3]
  if all(max(abs(colors[v][k]-base[k]) for k in range(3))<.0001 for v in tri):faces.append(tri)
 used=sorted(set(v for face in faces for v in face));mapping={old:new for new,old in enumerate(used)};verts=[positions[v] for v in used];faces=[[mapping[v] for v in face] for face in faces]
 mesh=bpy.data.meshes.new('Equine anatomy '+str(variant));mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new('Equine anatomy '+str(variant),mesh);bpy.context.collection.objects.link(obj);bpy.context.view_layer.objects.active=obj;obj.select_set(True)
 remesh=obj.modifiers.new('Weld body neck head and limbs','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.032;remesh.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=remesh.name)
 smooth=obj.modifiers.new('Sculpted transitions','SMOOTH');smooth.factor=.7;smooth.iterations=4;bpy.ops.object.modifier_apply(modifier=smooth.name)
 decimate=obj.modifiers.new('Web geometry budget','DECIMATE');decimate.ratio=.28;bpy.ops.object.modifier_apply(modifier=decimate.name)
 tri=obj.modifiers.new('Export triangles','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=tri.name)
 for poly in obj.data.polygons:poly.use_smooth=True
 obj.data.update();coats.append({'position':[round(float(n),5) for v in obj.data.vertices for n in v.co],'normal':[round(float(n),5) for v in obj.data.vertices for n in v.normal],'index':[int(v) for p in obj.data.polygons for v in p.vertices]})
 print('SCULPTED_COAT',variant,len(obj.data.vertices),len(obj.data.polygons),flush=True);obj.select_set(False)
out=ROOT/'dist/carousel-horse-geometry.js';out.write_text('// Baked from authored carousel lofts with Blender voxel welding, smoothing and decimation.\n// Regenerate with scripts/export-carousel.mjs --source and scripts/sculpt-carousel-horses.py.\nexport const sculptedHorseCoats='+json.dumps(coats,separators=(',',':'))+';\n')
