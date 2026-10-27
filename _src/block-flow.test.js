'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('./block-flow');
const def = {hat:'start', flow:{variables:{score:0},rules:{move:{key:'move',kind:'action',op:'move'},clear:{key:'clear',kind:'if',condition:'clear',input:'DO'},set:{key:'set',kind:'set',variable:'score',field:'N'},add:{key:'add',kind:'change',variable:'score',field:'N',initial:1},repeat:{key:'repeat',kind:'repeat',field:'N',input:'DO',initial:2}}}};
function block(type,id,next=null,body=null,value='1'){return {type,id,getNextBlock:()=>next,getInputTargetBlock:()=>body,getFieldValue:()=>value};}
function compile(b){return F.compile(def,{getBlocksByType:()=>[{getNextBlock:()=>b}]});}
function run(nodes,ctx,budget){const r=F.runner(nodes,ctx,budget);while(r.next());return ctx;}
test('dynamic conditions use current variables and event, not a flattened pre-run list',()=>{
 const compiled=compile(block('set','a',block('clear','b',block('add','d'),block('move','c')),null,'0'));
 const ctx={vars:{score:9},event:'right',act(op,v,e){assert.equal(e,'right');assert.equal(v.score,0);},test(c,v){return c==='clear'&&v.score===0;}};
 run(compiled.nodes,ctx);assert.equal(ctx.vars.score,1);assert.equal(compiled.blocks,4);
});
test('false condition skips its body; zero repeat does no work',()=>{
 let called=0;const n=compile(block('clear','a',block('repeat','b',null,block('move','d'),'0'),block('move','c'))).nodes;
 run(n,{vars:{score:0},event:'up',act(){called++;},test(){return false;}});assert.equal(called,0);
});
test('nested repetition is bounded even for an explosive empty/control-heavy program',()=>{
 let node={kind:'repeat',times:8,body:[]};for(let i=0;i<7;i++)node={kind:'repeat',times:8,body:[node]};
 assert.throws(()=>run([node],{vars:{},act(){},test(){return true;}}),/طولانی/);
});
test('compiler rejects cycles, unknown blocks, excessive depth and malformed integers',()=>{
 const b=block('move','a');b.getNextBlock=()=>b;assert.throws(()=>compile(b),/چرخه/);
 assert.throws(()=>compile(block('unknown','a')),/ناشناخته/);
 assert.throws(()=>compile(block('repeat','a',null,null,'2x')),/عدد/);
 let deep=block('move','last');for(let i=0;i<10;i++)deep=block('clear','n'+i,null,deep);assert.throws(()=>compile(deep),/تودرتو/);
});
test('stopping an interpreter prevents all subsequent effects',()=>{
 let calls=0;const r=F.runner([{kind:'action',op:'move'},{kind:'action',op:'move'}],{vars:{},act(){calls++;}});r.next();r.stop();assert.equal(r.next(),null);assert.equal(calls,1);
});
test('variable values are bounded integers and never write arbitrary object properties',()=>{
 assert.deepEqual(F.variables(def,{score:2}),{score:2});assert.equal(F.variables(def,{score:'2'}),null);
 assert.equal(F.variables(def,{score:1000}),null);assert.deepEqual(F.variables(def),{score:0});
 assert.throws(()=>run([{kind:'change',variable:'score',value:1}],{vars:{score:999}}),/عدد/);
 assert.throws(()=>run([{kind:'set',variable:'__proto__',value:1}],{vars:{score:0}}),/ناشناخته/);
});
test('workspace guard rejects unknown/oversize/prototype-shaped input and preserves valid detached blocks',()=>{
 const p=F.program(def,[{key:'clear',body:['move']},{key:'add',value:1}]);assert.equal(F.workspace(def,p),true);
 const php=JSON.parse(JSON.stringify(p));assert.equal(F.workspace(def,php),true);
 assert.equal(F.workspace(def,{blocks:{blocks:[{type:'start'},{type:'alien'}]}}),false);
 assert.equal(F.workspace(def,JSON.parse('{"blocks":{"blocks":[{"type":"start"}]},"__proto__":{}}')),false);
 assert.equal(F.workspace(def,{blocks:{blocks:[{type:'start',data:'x'.repeat(21000)}]}}),false);
});
