'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../content/lab-star-events-pilot/model'),F=require('./block-flow');
const lv={id:'score-step',cols:3,rows:3,start:[0,2],walls:[[1,1]],stars:[[1,2],[2,2],[2,1]]};
const A=op=>({kind:'action',op}),I=(condition,body)=>({kind:'if',condition,body});
const handler=[I('clear',[A('move')]),I('star',[A('collect'),{kind:'change',variable:'score',value:1}]),I('won',[A('win')])];
function press(w,v,event,program=handler){if(w.ended)return;w.events++;const r=F.runner(program,{event,vars:v,act:(a,v,e)=>M.act(lv,w,a,v,e),test:(a,v,e)=>M.test(lv,w,a,v,e)});while(r.next());}
test('unique score, revisiting, blocked input and terminal behavior use real scene state',()=>{
 const w=M.fresh(lv),v={score:0};for(const e of ['up','right','left','right','right','up'])press(w,v,e);
 // up from the origin is valid but changes the route: start a fresh reference run.
 const x=M.fresh(lv),n={score:0};for(const e of ['right','left','right','right','up'])press(x,n,e);
 assert.equal(n.score,3);assert.equal(x.got.length,3);assert.equal(x.revisits,1);assert.equal(x.ended,true);assert.equal(M.judge(lv,x,n),true);
 const before=JSON.stringify([x,n]);press(x,n,'left');assert.equal(JSON.stringify([x,n]),before);
});
test('a wall guard prevents movement without hiding an unconditional move error',()=>{
 const wall={...lv,id:'condition-step',walls:[[1,2],[1,1]],stars:[[0,1]]},w=M.fresh(wall),v={score:0};
 assert.equal(M.test(wall,w,'clear',v,'right'),false);assert.equal(w.faults,0);
 M.act(wall,w,'move',v,'right');assert.equal(w.faults,1);assert.equal(w.x,0);
 assert.equal(M.judge(wall,w,v),false);
});
test('JSON/PHP-compatible resume preserves position, collected stars and wrong educational score',()=>{
 const w=M.fresh(lv),v={score:0};press(w,v,'right');const restored=M.restore(lv,JSON.parse(JSON.stringify(w)));assert.deepEqual(restored,w);
 press(restored,v,'left');press(restored,v,'right');assert.equal(v.score,1);assert.equal(restored.revisits,1);
 assert.equal(M.restore(lv,{...w,got:['1,2','1,2']}),null);assert.equal(M.restore(lv,{...w,x:99}),null);
 const badScore={score:0},a=M.fresh(lv);press(a,badScore,'right',[I('clear',[A('move')]),I('star',[A('collect')])]);assert.equal(a.got.length,1);assert.equal(badScore.score,0);assert.equal(M.judge(lv,a,badScore),false);
});
test('independent worlds and variable maps never share a mutable collected-star list',()=>{
 const a=M.fresh(lv),b=M.fresh(lv),v={score:0};press(a,v,'right');assert.deepEqual(b,M.fresh(lv));assert.equal(v.score,1);
});
