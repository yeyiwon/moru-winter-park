import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';

// QA/development only. A persistent SQLite connection avoids starting Python for
// every statement, which otherwise makes local presence heartbeats expire.
export function createLocalDatabase(db){
 const source=`import sqlite3,json,sys
c=sqlite3.connect(sys.argv[1])
c.row_factory=sqlite3.Row
for line in sys.stdin:
 try:
  p=json.loads(line)
  if 'schema' in p: c.executescript(p['schema']); result={}
  else:
   before=c.total_changes
   cursor=c.execute(p['sql'],p['args'])
   result={'results':[dict(x) for x in cursor.fetchall()],'meta':{'changes':c.total_changes-before}}
  c.commit()
  print(json.dumps({'id':p['id'],'result':result}),flush=True)
 except Exception as error:
  c.rollback()
  print(json.dumps({'id':p.get('id'),'error':str(error)}),flush=True)
`;
 const child=spawn('python3',['-u','-c',source,db],{stdio:['pipe','pipe','inherit']}),pending=new Map();let serial=0,closed=false;
 const lines=createInterface({input:child.stdout});
 function fail(error){closed=true;for(const task of pending.values())task.reject(error);pending.clear();}
 child.on('error',fail);child.on('exit',()=>fail(new Error('Local SQLite bridge closed')));
 lines.on('line',line=>{const value=JSON.parse(line),task=pending.get(value.id);if(!task)return;pending.delete(value.id);value.error?task.reject(new Error(value.error)):task.resolve(value.result);});
 return{query(input){if(closed)return Promise.reject(new Error('Local SQLite bridge closed'));return new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});child.stdin.write(JSON.stringify({...input,id})+'\n',error=>{if(error){pending.delete(id);reject(error);}});});},close(){if(!closed)child.stdin.end();}};
}
