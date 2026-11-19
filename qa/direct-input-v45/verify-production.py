from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import hashlib,json,sys,datetime
base=sys.argv[1].rstrip('/')
root=Path('/workspace/scratch/4bce338b713b/winter-world/.sites-checkout')
files=['index.html','sw.js','game-input.js','park.js','studio.js','social.js','customization-ui.js','customization.css','resort-ui-v43.css','winter-music.js','fireworks-request.js','camera-policy.js']
def get(path):
 try:
  with urlopen(Request(base+'/'+path,headers={'Cache-Control':'no-cache'}),timeout=30) as r:return r.status,r.read()
 except HTTPError as e:return e.code,e.read()
def asset(file):
 status,body=get(file)
 expected=hashlib.sha256((root/'web-dist'/file).read_bytes()).hexdigest();actual=hashlib.sha256(body).hexdigest()
 return {'path':file,'status':status,'bytes':len(body),'sha256':actual,'expectedSha256':expected,'match':status==200 and expected==actual}
with ThreadPoolExecutor(max_workers=4) as pool: assets=list(pool.map(asset,files))
api=[]
for path,expected in [('api/health',200),('api/access',200),('api/quiz-journal',401)]:
 status,body=get(path);item={'path':path,'status':status,'expectedStatus':expected,'ok':status==expected}
 if status==200:
  d=json.loads(body)
  if path.endswith('health'):item['health']={k:d.get(k) for k in ['ok','multiplayer']}
  if path.endswith('access'):item['access']={k:d.get(k) for k in ['worldId','inviteRequired','admin']}
 api.append(item)
result={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'origin':base,'sourceCommit':'4b4d12014f5edc0cbeee98035cfbda8673f49831','authentication':'anonymous public HTTP','passed':all(x['match'] for x in assets) and all(x['ok'] for x in api),'assets':assets,'api':api}
Path(sys.argv[2]).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'origin':base,'passed':result['passed'],'assetsMatched':sum(x['match'] for x in assets),'assetsTotal':len(assets),'api':api},ensure_ascii=False))
if not result['passed']:sys.exit(1)
