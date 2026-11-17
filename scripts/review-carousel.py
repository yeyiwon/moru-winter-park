"""Blender review/export of the exact runtime-authored carousel geometry."""
import bpy, json, pathlib, math, sys, os
from mathutils import Matrix, Vector
ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=pathlib.Path(os.environ.get('MORU_ASSET_OUTPUT', str(ROOT/'qa/asset-review')))
OUT.mkdir(parents=True, exist_ok=True)
data=json.loads((ROOT/'qa/asset-review/carousel-v3.json').read_text())
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
conversion=Matrix.Rotation(math.pi/2,4,'X')
materials={}
for key,m in data['materials'].items():
 material=bpy.data.materials.new('carousel-'+m['name']);material.use_nodes=True
 principled=material.node_tree.nodes.get('Principled BSDF');principled.inputs['Base Color'].default_value=(*m['color'],1);principled.inputs['Roughness'].default_value=m['roughness'];principled.inputs['Metallic'].default_value=m['metalness']
 if m['vertexColors']:
  colors=material.node_tree.nodes.new('ShaderNodeVertexColor');colors.layer_name='Color';material.node_tree.links.new(colors.outputs['Color'],principled.inputs['Base Color'])
 principled.inputs['Emission Color'].default_value=(*m['emission'],1);principled.inputs['Emission Strength'].default_value=.9 if max(m['emission'])>0 else 0
 materials[key]=material
geometries={}
for key,g in data['geometries'].items():
 mesh=bpy.data.meshes.new('carousel-geometry');positions=[g['positions'][i:i+3] for i in range(0,len(g['positions']),3)];indices=g['indices'] or list(range(len(positions)));faces=[indices[i:i+3] for i in range(0,len(indices),3)]
 mesh.from_pydata(positions,[],faces);mesh.update()
 for polygon in mesh.polygons:polygon.use_smooth=True
 if g['colors']:
  color=mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
  for i,v in enumerate(color.data):v.color=(*g['colors'][i*3:i*3+3],1)
 if g['uv']:
  uv=mesh.uv_layers.new(name='UVMap')
  for polygon in mesh.polygons:
   for loop in polygon.loop_indices:
    vi=mesh.loops[loop].vertex_index;uv.data[loop].uv=g['uv'][vi*2:vi*2+2]
 try:mesh.normals_split_custom_set_from_vertices([g['normals'][i:i+3] for i in range(0,len(g['normals']),3)])
 except Exception:pass
 geometries[key]=mesh
original=[]
nodes={}
for item in data.get('nodes',[]):
 obj=bpy.data.objects.new(item['name'] or 'Carousel group',None);bpy.context.collection.objects.link(obj);nodes[item['id']]=obj;original.append(obj)
for item in data.get('nodes',[]):
 obj=nodes[item['id']];matrix=Matrix([item['matrix'][i:i+4] for i in range(0,16,4)]).transposed();obj.parent=nodes.get(item['parent']);obj.matrix_local=matrix if obj.parent else conversion@matrix
 if obj.name.startswith('carousel-saddle-'):obj['seatSurface']=True;obj['avatarOriginOffset']=.82
for item in data['objects']:
 mesh=geometries[item['geometry']].copy();obj=bpy.data.objects.new(item['name'],mesh);bpy.context.collection.objects.link(obj);mesh.materials.append(materials[item['material']]);matrix=Matrix([item['matrix'][i:i+4] for i in range(0,16,4)]).transposed();obj.parent=nodes.get(item.get('parent'));obj.matrix_local=matrix if obj.parent else conversion@matrix;original.append(obj)
# GLB retains actual metallic/roughness finishes, normals, painted vertex colours and sockets.
bpy.ops.object.select_all(action='DESELECT')
for obj in original:obj.select_set(True)
bpy.context.view_layer.objects.active=original[0]
bpy.ops.export_scene.gltf(filepath=str(OUT/'moru-carousel-v3.glb'),export_format='GLB',use_selection=True,export_extras=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
# Inspection stage is not part of the exported model.
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.015));ground=bpy.context.object;ground.name='review-stage'
groundMat=bpy.data.materials.new('snow-stage');groundMat.diffuse_color=(.31,.37,.42,1);ground.data.materials.append(groundMat)
def area(name,location,power,size,color):
 lamp=bpy.data.lights.new(name,'AREA');lamp.energy=power;lamp.shape='DISK';lamp.size=size;lamp.color=color;obj=bpy.data.objects.new(name,lamp);bpy.context.collection.objects.link(obj);obj.location=conversion@Vector(location);obj.rotation_euler=(conversion@Vector((0,2.5,0))-obj.location).to_track_quat('-Z','Y').to_euler()
area('warm-key',(3,13,12),2400,10,(1,.86,.66));area('blue-rim',(-10,9,-5),2900,8,(.55,.72,1));area('front-fill',(9,5,12),900,7,(.86,.92,1))
scene=bpy.context.scene;scene.world.color=(.09,.12,.19);scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=4;scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.render.resolution_percentage=100
cameraData=bpy.data.cameras.new('Review Camera');camera=bpy.data.objects.new('Review Camera',cameraData);bpy.context.collection.objects.link(camera);scene.camera=camera;cameraData.lens=48
camera.location=conversion@Vector((15,8.2,18));target=conversion@Vector((0,4.3,0));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
scene.view_settings.view_transform='AgX';scene.render.filepath=str(OUT/'moru-carousel-v3.jpg');scene.render.image_settings.file_format='JPEG';bpy.ops.render.render(write_still=True)
for obj in original:
 if obj.type=='MESH':obj.hide_render=not obj.name.startswith('sculpted-horse-0')
camera.location=conversion@Vector((9.5,4.5,6.0));target=conversion@Vector((4.6,2.1,.1));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();cameraData.lens=60;scene.render.filepath=str(OUT/'moru-carousel-horse-v3.jpg');bpy.ops.render.render(write_still=True)
print('CAROUSEL REVIEW COMPLETE',flush=True)
