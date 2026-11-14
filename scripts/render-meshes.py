"""CPU asset review from the application's exact meshes, not a browser screenshot.
Requires mitsuba==3.9.1, numpy, Pillow; procedural WebGL shaders are not reproduced.
"""
import os
os.environ['DRJIT_CACHE_DIR']='/tmp/knowledge-drjit'
import mitsuba as mi, numpy as np, json,sys,pathlib,time
mi.set_variant('scalar_rgb')
kind=sys.argv[1] if len(sys.argv)>1 else 'front';folder=pathlib.Path(__file__).resolve().parent.parent/'qa'/'asset-review'
world=kind in ['world','garden','castle-back'];name='world' if world else 'character-walk' if kind=='walk' else 'character-land' if kind=='land' else 'character-front'
data=json.loads((folder/(name+'.json')).read_text());rgb=lambda a:{'type':'rgb','value':a};t=mi.ScalarTransform4f
angle=np.pi/2 if kind=='side' else np.pi if kind=='back' else 0
rotate=np.array([[np.cos(angle),0,np.sin(angle)],[0,1,0],[-np.sin(angle),0,np.cos(angle)]])
width,height=(1200,750) if world else (640,640)
origin=([3.3,16,32] if kind=='world' else [9,9,69] if kind=='garden' else [8,8,-30]) if world else [0,.1,4.2];target=([0,3,0] if kind=='world' else [0,2.5,53] if kind=='garden' else [0,3,-14]) if world else [0,-.01,0]
scene={'type':'scene','integrator':{'type':'path','max_depth':4},'sensor':{'type':'perspective','fov':44 if world else 31,'fov_axis':'y','to_world':t().look_at(origin=origin,target=target,up=[0,1,0]),'sampler':{'type':'independent','sample_count':24},'film':{'type':'hdrfilm','width':width,'height':height,'rfilter':{'type':'tent'}}},'ambient':{'type':'constant','radiance':rgb([.012,.018,.032] if world else [.3,.32,.4])}}
materials={}
for key,m in data['materials'].items():
 bs={'type':'principled','base_color':rgb(m['color']),'roughness':m['roughness'],'metallic':m['metalness'],'sheen':m['sheen'],'clearcoat':m['clearcoat']}
 if m['opacity']<1:bs={'type':'mask','opacity':m['opacity'],'nested_bsdf':bs}
 materials[key]=mi.load_dict(bs)
for idx,o in enumerate(data['objects']):
 g=data['geometries'][o['geometry']];m=data['materials'][o['material']];v=np.array(g['positions'],dtype=np.float32).reshape(-1,3);a=np.array(o['matrix'],dtype=np.float32).reshape(4,4).T;v=(v@a[:3,:3].T+a[:3,3])@rotate.T
 faces=np.array(g['indices'] if g['indices'] is not None else np.arange(len(v)),dtype=np.uint32)
 props=mi.Properties();props['bsdf']=materials[o['material']]
 emission=np.array(m['emissive'])*m['emissiveIntensity']
 if emission.max()>.01:props['emitter']=mi.load_dict({'type':'area','radiance':rgb((emission*1.5).tolist()),'sampling_weight':0})
 normals=None
 if g['normals']:
  normals=np.array(g['normals'],dtype=np.float32).reshape(-1,3)@np.linalg.inv(a[:3,:3])@rotate.T;normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-8)
 mesh=mi.Mesh('mesh'+str(idx),len(v),len(faces)//3,props,has_vertex_normals=normals is not None);params=mi.traverse(mesh);params['vertex_positions']=v.ravel();params['faces']=faces
 if normals is not None:params['vertex_normals']=normals.ravel()
 params.update();scene['asset'+str(idx)]=mesh
if world:
 scene['moon']={'type':'directional','direction':[.3,-1,-.25],'irradiance':rgb([1.65,1.8,2.3])}
 scene['warm']={'type':'directional','direction':[-.6,-.4,-1],'irradiance':rgb([.55,.38,.3])}
else:
 scene['floor']={'type':'rectangle','to_world':t().translate([0,-.862,0]).rotate([1,0,0],-90).scale(100),'bsdf':{'type':'diffuse','reflectance':rgb([.65,.62,.58] if kind=='bright' else [.025,.035,.06])}}
 for label,pos,radius,color in [('key',[-3,4,4],2,[4,3.6,3.3]),('rim',[4,3,-3],1.2,[4,4.8,7]),('face',[0,3,6],1.2,[.4,.38,.36])]:scene[label]={'type':'sphere','center':pos,'radius':radius,'emitter':{'type':'area','radiance':rgb(color)}}
print('Loading',len(data['objects']),'actual meshes',flush=True);start=time.perf_counter();s=mi.load_dict(scene);img=mi.render(s,spp=96 if world else 160);mi.util.write_bitmap(str(folder/(kind+'.png')),img);print(kind,'rendered in',round(time.perf_counter()-start,2),'s',flush=True)
