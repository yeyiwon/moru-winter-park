"""Build portable GLBs and render authored room meshes with Blender.
WebGL procedural water/aurora are approximated by their fallback material only.
"""
import bpy,json,sys,math,pathlib
from mathutils import Matrix,Vector
args=sys.argv[sys.argv.index('--')+1:];folder=pathlib.Path(args[0]);kind=args[1]
data=json.loads((folder/(kind+'-interior.json')).read_text())
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
material_cache={};objects=[]
for i,r in enumerate(data['records']):
 key=json.dumps(r['material'],sort_keys=True)
 if key not in material_cache:
  m=r['material'];mat=bpy.data.materials.new('finish-'+str(len(material_cache)));mat.diffuse_color=(*m['color'],m['opacity']);mat.use_nodes=True;p=mat.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*m['color'],1);p.inputs['Roughness'].default_value=m['roughness'];p.inputs['Metallic'].default_value=m['metalness'];p.inputs['Emission Color'].default_value=(*m['emissive'],1);p.inputs['Emission Strength'].default_value=m['emissiveIntensity'];p.inputs['Alpha'].default_value=m['opacity'];
  if m['opacity']<1:mat.surface_render_method='DITHERED'
  material_cache[key]=mat
 arr=r['matrix'];a=Matrix([[arr[c*4+row] for c in range(4)] for row in range(4)]);v=[]
 for j in range(0,len(r['positions']),3):
  p=a@Vector(r['positions'][j:j+3]);v.append((p.x,-p.z,p.y))
 ids=r['indices'] if r['indices'] is not None else list(range(len(v)));faces=[ids[j:j+3] for j in range(0,len(ids),3)]
 mesh=bpy.data.meshes.new(r['name']);mesh.from_pydata(v,[],faces);mesh.update();o=bpy.data.objects.new(r['name'],mesh);bpy.context.collection.objects.link(o);o.data.materials.append(material_cache[key]);objects.append((o,r['visible']))
 for poly in mesh.polygons:poly.use_smooth=True
# GLB carries the complete room, including cutaway walls used by the application.
bpy.ops.export_scene.gltf(filepath=str(folder/(kind+'-interior.glb')),export_format='GLB',export_yup=True,export_cameras=False,export_lights=False)
for o,visible in objects:o.hide_render=not visible
world=bpy.context.scene.world or bpy.data.worlds.new('winter-room');bpy.context.scene.world=world;world.use_nodes=True;world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.18,.23,.29,1);world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.5
# Broad lighting makes authored silhouettes inspectable; no claim of browser parity.
for name,pos,energy,size,color in [('key',(0,0,18),3500,18,(1,.78,.55)),('fill',(-20,-8,16),2300,16,(.6,.85,1)),('front',(12,-20,12),1600,12,(1,.93,.8))]:
 if kind=='winter-costumes':pos=tuple(v*.18 for v in pos);energy*=.0324;size*=.18
 d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='DISK';d.size=size;d.color=color;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,2))-o.location).to_track_quat('-Z','Y').to_euler()
d=bpy.data.cameras.new('inspection-camera');cam=bpy.data.objects.new('inspection-camera',d);bpy.context.collection.objects.link(cam);cam.location=(30,-36,28) if kind=='ryokan' else (32,-40,32);target=Vector((0,0,2 if kind=='ryokan' else 7));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();d.type='PERSP';d.lens=37 if kind=='ryokan' else 33
if kind=='winter-costumes':
 cam.location=(3.4,-7.2,3.3);target=Vector((0,0,1.2));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();d.lens=48
 bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.02));floor=bpy.context.object;mat=bpy.data.materials.new('display-floor');mat.diffuse_color=(.13,.19,.23,1);floor.data.materials.append(mat)
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(folder/(kind+'-interior.png'));scene.world.color=(.2,.24,.3);bpy.ops.render.render(write_still=True)
