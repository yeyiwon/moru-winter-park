"""CPU geometry inspection only: authored solids, approximate point/line shapes,
inspection lights. WebGL shaders, postprocessing, and runtime motion are omitted.
Run after export-museum-review.mjs; only the final PNG belongs in qa/."""
import bpy,json,math,pathlib,sys
from mathutils import Matrix,Vector

args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
folder=pathlib.Path(args[0] if args else '.winter-build/museum-review')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
materials={}
for record in json.loads((folder/'museum.json').read_text())['records']:
    source=record['material'];key=json.dumps(source,sort_keys=True)
    if key not in materials:
        material=bpy.data.materials.new('museum-finish-'+str(len(materials)));material.use_nodes=True
        bsdf=material.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value=(*source['color'],1)
        bsdf.inputs['Roughness'].default_value=source['roughness'];bsdf.inputs['Metallic'].default_value=source['metalness']
        bsdf.inputs['Emission Color' if 'Emission Color' in bsdf.inputs else 'Emission'].default_value=(*source['emissive'],1)
        if 'Emission Strength' in bsdf.inputs:bsdf.inputs['Emission Strength'].default_value=source['strength']
        bsdf.inputs['Alpha'].default_value=source['opacity']
        materials[key]=material
    a=record['matrix'];matrix=Matrix([[a[c*4+r] for c in range(4)] for r in range(4)])
    vertices=[]
    for i in range(0,len(record['positions']),3):
        p=matrix@Vector(record['positions'][i:i+3]);vertices.append((p.x,-p.z,p.y))
    if record['type']=='lines':
        curve=bpy.data.curves.new(record['name'],'CURVE');curve.dimensions='3D';curve.bevel_depth=.014;curve.bevel_resolution=1
        for i in range(0,len(vertices),2):
            spline=curve.splines.new('POLY');spline.points.add(1)
            for point,v in zip(spline.points,vertices[i:i+2]):point.co=(*v,1)
        obj=bpy.data.objects.new(record['name'],curve);bpy.context.collection.objects.link(obj);curve.materials.append(materials[key]);continue
    if record['type']=='points':
        points=vertices;vertices=[];faces=[]
        for x,y,z in points:
            start=len(vertices);r=.047
            vertices.extend([(x+r,y,z),(x-r,y,z),(x,y+r,z),(x,y-r,z),(x,y,z+r),(x,y,z-r)])
            faces.extend([tuple(start+j for j in f) for f in [(0,2,4),(2,1,4),(1,3,4),(3,0,4),(2,0,5),(1,2,5),(3,1,5),(0,3,5)]])
    else:
        indices=record['indices'] or list(range(len(vertices)));faces=[indices[i:i+3] for i in range(0,len(indices),3)]
    mesh=bpy.data.meshes.new(record['name']);mesh.from_pydata(vertices,[],faces);mesh.update()
    obj=bpy.data.objects.new(record['name'],mesh);bpy.context.collection.objects.link(obj);mesh.materials.append(materials[key])
    for polygon in mesh.polygons:polygon.use_smooth=True

scene=bpy.context.scene;world=scene.world or bpy.data.worlds.new('museum-inspection');scene.world=world;world.use_nodes=True
world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.18,.23,.31,1)
world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.35
for name,position,power,size,color in [('key',(0,0,12),2600,13,(1,.85,.65)),('fill',(-9,-5,8),1900,12,(.63,.82,1)),('back',(9,11,9),2100,10,(1,.94,.83))]:
    light=bpy.data.lights.new(name,'AREA');light.energy=power;light.shape='DISK';light.size=size;light.color=color
    obj=bpy.data.objects.new(name,light);bpy.context.collection.objects.link(obj);obj.location=position;obj.rotation_euler=(Vector((0,0,2))-obj.location).to_track_quat('-Z','Y').to_euler()
camera_data=bpy.data.cameras.new('interior-inspection');camera=bpy.data.objects.new('interior-inspection',camera_data);bpy.context.collection.objects.link(camera)
camera.location=(-17,-11,10.8);target=Vector((3,4,4.2));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera_data.lens=22;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=24;scene.cycles.use_denoising=False
scene.render.resolution_x=960;scene.render.resolution_y=720;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(folder/'museum-geometry-review.png')
bpy.ops.render.render(write_still=True)
