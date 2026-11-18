import test from 'node:test';
import assert from 'node:assert/strict';
import {experienceAPI,validSelection} from '../server/experience-api.js';
import {assistAPI} from '../server/assist-api.js';
import {winterTracks} from '../dist/music-catalog.js';
import {normalizePreferences,rankMusic} from '../dist/experience-preferences.js';
import {voiceCommand,createVoiceInput} from '../dist/voice-controls.js';
import {renderExperienceCards} from '../dist/experience-cards.js';
import {JSDOM} from 'jsdom';

const self={id:'private-test-guest',room:'private-test-room'};
function database(edits=[],limited=false){return {prepare(sql){let args;return {bind(...value){args=value;return this;},run:async()=>({}),first:async()=>({attempts:limited&&args?.[0]?.startsWith('ai-')?101:1}),all:async()=>({results:sql.includes('quiz_overrides')?edits:[]})};}};}
const request=body=>new Request('https://winter.test/api/experience',{method:'POST',body:JSON.stringify(body)});
const body={kind:'music',consent:true,style:'waltz',pace:'gentle'};
const model=(name,DB=database())=>({DB,OPENAI_API_KEY:'fake-test-credential',OPENAI_MODEL:name});
const output=(ids,component='RecommendationCard')=>Response.json({output:[{content:[{type:'output_text',text:JSON.stringify({ids,component})}]}],usage:{input_tokens:100,output_tokens:20}});

test('AI preference defaults are opt-out and explicit choices alone rank existing music',()=>{
 assert.equal(normalizePreferences().ai,false);assert.equal(normalizePreferences({ai:'yes',style:'invented'}).ai,false);
 const ranked=rankMusic(winterTracks,{style:'waltz',pace:'gentle'});assert.equal(ranked[0].id,'ethereal-winter-ballet-02');assert.equal(new Set(ranked.map(t=>t.id)).size,winterTracks.length);
});
test('absent consent and unexpected personal fields never reach the model',async()=>{
 let calls=0;const fake=async()=>{calls++;throw Error();};
 assert.equal((await experienceAPI(request({...body,consent:false}),model('consent'),self,fake)).status,403);
 assert.equal((await experienceAPI(request({...body,chat:'private text'}),model('consent'),self,fake)).status,400);
 assert.equal((await experienceAPI(request({...body,style:'injected'}),model('consent'),self,fake)).status,400);
 const old=new Request('https://winter.test/api/assist',{method:'POST',body:JSON.stringify({kind:'wish',text:'소원'})});
 assert.equal((await assistAPI(old,model('consent'),self,fake)).status,403);assert.equal(calls,0);
});
test('structured music selection contains only catalogue facts and caches without identity',async()=>{
 let sent,calls=0;const fake=async(url,init)=>{calls++;sent=JSON.parse(init.body);return output(['winter-waltz','ethereal-winter-ballet-02']);};
 const env=model('music-success');const result=await (await experienceAPI(request(body),env,self,fake)).json();
 assert.equal(result.mode,'ai');assert.equal(result.cards[0].item.title,'Winter Waltz');assert.equal(sent.store,false);assert.equal(sent.max_output_tokens,512);assert.equal(sent.text.format.strict,true);
 assert.ok(!JSON.stringify(sent).includes(self.id));assert.ok(!JSON.stringify(sent).includes(self.room));
 assert.equal((await (await experienceAPI(request(body),env,{id:'another-user'},fake)).json()).cached,true);assert.equal(calls,1);
});
test('malformed output, duplicate IDs, refusal, timeout and daily limits retain authored content',async()=>{
 for(const [i,fake]of [async()=>output(['fabricated']),async()=>output(['winter-waltz','winter-waltz']),async()=>output(['winter-waltz'],'AdminPanel'),async()=>Response.json({output:[{content:[{type:'refusal'}]}]}),async()=>{throw Error('timeout');}].entries()){
  const data=await (await experienceAPI(request(body),model('invalid-'+i),self,fake)).json();assert.equal(data.mode,'fallback');assert.equal(data.cards.length,3);assert.ok(data.cards.every(c=>winterTracks.some(t=>t.id===c.item.id)));
 }
 let calls=0;const data=await (await experienceAPI(request(body),model('budget',database([],true)),self,async()=>{calls++;})).json();assert.equal(data.reason,'daily-limit');assert.equal(calls,0);
 assert.equal(validSelection({ids:['winter-waltz'],component:'RecommendationCard',html:'<script/>'},['winter-waltz']),false);
});
test('concurrent identical recommendations share one provider request',async()=>{
 let calls=0;const env=model('concurrent');let release;const gate=new Promise(r=>release=r);const fake=async()=>{calls++;await gate;return output(['winter-waltz']);};
 const a=experienceAPI(request(body),env,self,fake),b=experienceAPI(request(body),env,self,fake);await new Promise(r=>setTimeout(r,15));release();await Promise.all([a,b]);assert.equal(calls,1);
});
test('exhibit generation selects reviewed content and rejects disabled or unrelated exhibits',async()=>{
 const edits=[{id:'daily-sci-01',payload:JSON.stringify({id:'daily-sci-01',category:'과학',question:'수정된 문제',options:['1','2','3','4'],answer:0,explanation:'관리자가 확인한 해설',source:{title:'검토 출처',url:'https://science.nasa.gov/moon/'},disabled:true})}];
 let sent;const data=await (await experienceAPI(request({kind:'exhibit',consent:true,gallery:'science'}),model('exhibit',database(edits)),self,async(_,init)=>{sent=JSON.parse(init.body);return output(['daily-sci-02'],'ExplanationPanel');})).json();
 assert.equal(data.mode,'ai');assert.equal(data.cards[0].item.id,'daily-sci-02');assert.match(data.cards[0].item.explanation,/밀도/);assert.ok(data.cards[0].item.source.url.startsWith('https://'));
 assert.ok(!JSON.parse(sent.input).catalogue.some(q=>q.id==='daily-sci-01'));
 assert.equal((await experienceAPI(request({kind:'exhibit',consent:true,gallery:'conservatory'}),model('removed'),self)).status,400);
});
test('component rendering cannot inject HTML, arbitrary actions or invented music',()=>{
 const dom=new JSDOM('<div></div>'),container=dom.window.document.querySelector('div');let selected;
 renderExperienceCards(container,{cards:[{component:'RecommendationCard',item:{id:'winter-waltz',title:'<script>bad()</script>'}},{component:'AdminPanel',item:{}},{component:'RecommendationCard',item:{id:'invented'}}]},{onPlay:id=>selected=id});
 assert.equal(container.children.length,1);assert.equal(container.querySelector('h3').textContent,'Winter Waltz');assert.equal(container.querySelector('script'),null);container.querySelector('button').click();assert.equal(selected,'winter-waltz');dom.window.close();
});
test('retired voice compatibility module never constructs recognition or accepts commands',()=>{
 let starts=0;class FakeRecognition{constructor(){starts++;}}
 const voice=createVoiceInput(FakeRecognition);assert.equal(voice.start(),false);assert.equal(starts,0);assert.equal(voiceCommand('지도 열기'),null);assert.equal(voice.listening,false);voice.stop();voice.dispose();
});
