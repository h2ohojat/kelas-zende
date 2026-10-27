/* Pure scene state for the event/condition/score pilot. */
var StarEvents = (function () {
  'use strict';
  var DIR = {right:[1,0],left:[-1,0],up:[0,-1],down:[0,1]};
  function key(x,y) { return x+','+y; }
  function has(list,x,y) { return list.some(function(p){return p[0]===x&&p[1]===y;}); }
  function fresh(lv) { return {x:lv.start[0],y:lv.start[1],got:[],faults:0,checksYes:0,checksNo:0,events:0,revisits:0,ended:false}; }
  function clear(lv,w,event) { var d=DIR[event];return !!d&&w.x+d[0]>=0&&w.y+d[1]>=0&&w.x+d[0]<lv.cols&&w.y+d[1]<lv.rows&&!has(lv.walls,w.x+d[0],w.y+d[1]); }
  function test(lv,w,name,vars,event) {
    if(name==='clear'){var ok=clear(lv,w,event);var k=ok?'checksYes':'checksNo';w[k]=Math.min(1000,w[k]+1);return ok;}
    if(name==='star')return has(lv.stars,w.x,w.y)&&w.got.indexOf(key(w.x,w.y))<0;
    if(name==='won')return vars.score===lv.stars.length;
    throw Error('شرط ناشناخته است.');
  }
  function act(lv,w,name,vars,event) {
    if(w.ended)return;
    if(name==='move'){
      if(!clear(lv,w,event)){w.faults=Math.min(1000,w.faults+1);return;}
      var d=DIR[event];w.x+=d[0];w.y+=d[1];if(w.got.indexOf(key(w.x,w.y))>=0)w.revisits=Math.min(1000,w.revisits+1);
    }else if(name==='collect'){
      if(test(lv,w,'star',vars,event))w.got.push(key(w.x,w.y));else w.faults=Math.min(1000,w.faults+1);
    }else if(name==='win'){
      if(w.got.length===lv.stars.length&&vars.score===lv.stars.length)w.ended=true;else w.faults=Math.min(1000,w.faults+1);
    }else throw Error('عمل ناشناخته است.');
  }
  function restore(lv,raw) {
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
    var out=fresh(lv);
    for(var k of ['x','y','faults','checksYes','checksNo','events','revisits']){
      if(!Number.isInteger(raw[k])||raw[k]<0||raw[k]>1000)return null;out[k]=raw[k];
    }
    if(out.x>=lv.cols||out.y>=lv.rows||has(lv.walls,out.x,out.y)||typeof raw.ended!=='boolean'||!Array.isArray(raw.got)||raw.got.length>lv.stars.length)return null;
    var allowed=lv.stars.map(function(p){return key(p[0],p[1]);});
    if(raw.got.some(function(v,i){return typeof v!=='string'||allowed.indexOf(v)<0||raw.got.indexOf(v)!==i;}))return null;
    out.got=raw.got.slice();out.ended=raw.ended;
    if(out.ended&&out.got.length!==lv.stars.length)return null;
    return out;
  }
  function judge(lv,w,vars) {
    if(lv.id==='event-step')return w.events>0&&w.x===1&&w.y===1&&w.faults===0;
    if(lv.id==='condition-step')return w.x===0&&w.y===1&&w.checksYes>0&&w.checksNo>0&&w.faults===0;
    return w.ended&&w.got.length===3&&vars.score===3&&w.revisits>0&&w.faults===0;
  }
  return {fresh:fresh,clear:clear,test:test,act:act,restore:restore,judge:judge};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=StarEvents;
