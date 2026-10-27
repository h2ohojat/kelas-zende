/* A representative chain, not the complete child course or final project. */
var STAR_PILOT = (function () {
  var K=LabKit,M=StarEvents;
  function iff(key,body){return {key:key,body:body};}
  function handler(score){return [iff('if-clear',['move']),iff('if-star',score?['collect','add-score']:['collect']),iff('if-won',['win'])];}
  var def={id:'star-events',title:'کارگاه فرمان و ستاره',icon:'🤖',hat:'star_start',maxBlocks:45,
    ops:{},loop:{type:'star_repeat',input:'DO',field:'N',initial:2},
    flow:{variables:{score:0},events:[{id:'start',label:'شروع'},{id:'right',label:'راست',icon:'→'},{id:'up',label:'بالا',icon:'↑'},{id:'left',label:'چپ',icon:'←'}],rules:{
      star_move:{key:'move',kind:'action',op:'move'},star_collect:{key:'collect',kind:'action',op:'collect'},star_win:{key:'win',kind:'action',op:'win'},
      star_clear:{key:'if-clear',kind:'if',condition:'clear',input:'DO'},star_star:{key:'if-star',kind:'if',condition:'star',input:'DO'},star_won:{key:'if-won',kind:'if',condition:'won',input:'DO'},
      star_set:{key:'set-score',kind:'set',variable:'score',field:'N',initial:0},star_add:{key:'add-score',kind:'change',variable:'score',field:'N',initial:1},
      star_repeat:{key:'repeat',kind:'repeat',field:'N',input:'DO',initial:2}}},
    blocks:[
      {type:'star_start',message0:'وقتی %1 زده شد',args0:[{type:'field_label_serializable',name:'EVENT',text:'شروع'}],nextStatement:null,colour:'#FFBF00',hat:'cap'},
      {type:'star_move',message0:'یک خانه در جهت دکمه برو',previousStatement:null,nextStatement:null,colour:'#4C97FF'},
      {type:'star_collect',message0:'ستاره را جمع کن',previousStatement:null,nextStatement:null,colour:'#4C97FF'},
      {type:'star_win',message0:'پیروزی را نشان بده',previousStatement:null,nextStatement:null,colour:'#4C97FF'},
      {type:'star_clear',message0:'اگر راه باز است',message1:'%1',args1:[{type:'input_statement',name:'DO'}],previousStatement:null,nextStatement:null,colour:'#59A869'},
      {type:'star_star',message0:'اگر اینجا ستاره هست',message1:'%1',args1:[{type:'input_statement',name:'DO'}],previousStatement:null,nextStatement:null,colour:'#59A869'},
      {type:'star_won',message0:'اگر امتیاز برابر ۳ است',message1:'%1',args1:[{type:'input_statement',name:'DO'}],previousStatement:null,nextStatement:null,colour:'#59A869'},
      {type:'star_set',message0:'امتیاز را برابر %1 کن',args0:[{type:'field_dropdown',name:'N',options:[['۰','0'],['۱','1'],['۲','2'],['۳','3']]}],previousStatement:null,nextStatement:null,colour:'#EF9019'},
      {type:'star_add',message0:'به امتیاز %1 اضافه کن',args0:[{type:'field_dropdown',name:'N',options:[['۱','1'],['۲','2'],['۰','0']]}],previousStatement:null,nextStatement:null,colour:'#EF9019'},
      {type:'star_repeat',message0:'%1 بار تکرار کن',args0:[{type:'field_dropdown',name:'N',options:[['۲','2'],['۳','3'],['۱','1'],['۰','0']]}],message1:'%1',args1:[{type:'input_statement',name:'DO'}],previousStatement:null,nextStatement:null,colour:'#FFAB19'}
    ],
    levels:[
      {id:'event-step',title:'یک ضربه، یک حرکت',cols:3,rows:3,start:[0,1],walls:[],stars:[[1,1]],inputs:['right'],editEvent:'right',palette:['move'],program:{start:[],right:[]},
        text:'بلوک حرکت را زیر رویداد <b>راست</b> بگذار؛ «شروع بازی» و سپس پیکان راست را بزن.',hints:['رویداد راست منتظر همان پیکان می‌ماند.','بلوک آبی را زیر شروعِ راست بچسبان.','یک بلوک حرکت کافی است؛ شروع، به‌تنهایی نباید ربات را حرکت دهد.']},
      {id:'condition-step',title:'راه باز یا بسته؟',cols:3,rows:3,start:[0,2],walls:[[1,2],[1,1]],stars:[[0,1]],inputs:['right','up'],editEvent:'right',palette:['move','if-clear'],program:{start:[],right:[],up:[iff('if-clear',['move'])]},
        text:'برای راست، حرکت را <b>داخل شرط راه باز</b> بگذار. شروع کن؛ اول راستِ بسته و بعد بالا را امتحان کن.',hints:['دکمهٔ راست باید بررسی شود، ولی حرکت نکند.','روی شرط خالی بزن و حرکت را به داخلش اضافه کن.','اگر راه باز است ← یک خانه در جهت دکمه برو.']},
      {id:'score-step',title:'هر ستاره، فقط یک امتیاز',cols:3,rows:3,start:[0,2],walls:[[1,1]],stars:[[1,2],[2,2],[2,1]],inputs:['right','left','up'],editEvent:'right',palette:['move','if-clear','if-star','collect','add-score','if-won','win','set-score','repeat'],
        program:{start:[{key:'set-score',value:0}],right:handler(false),left:handler(true),up:handler(true)},
        text:'بعد از «جمع کن»، <b>امتیاز را ۱ زیاد کن</b>. بازی: راست، چپ، راست، راست، بالا.',hints:['ستاره جمع می‌شود، اما کدام بلوک مقدار امتیاز را عوض می‌کند؟','بلوک نارنجی بعد از جمع‌کردن و داخل شرط ستاره قرار می‌گیرد.','هر ستاره فقط یک‌بار: جمع کن ← به امتیاز ۱ اضافه کن.']}
    ],
    scene:function(lab){
      var svg=lab.svgRoot(320,320,'صحنهٔ کارگاه فرمان و ستاره'),score=lab.h('div',{class:'se-score','data-flow-score':'',role:'status'}),lv,w,vars={score:0};
      lab.stage.insertBefore(score,svg);
      function draw(){
        while(svg.firstChild)svg.removeChild(svg.firstChild);
        for(var y=0;y<3;y++)for(var x=0;x<3;x++){
          svg.appendChild(K.svg('rect',{x:8+x*102,y:8+y*102,width:96,height:96,rx:15,fill:M.clear? (lv.walls.some(function(p){return p[0]===x&&p[1]===y;})?'#687b98':'#e7f0fb'):'#e7f0fb',stroke:'#bccde3'}));
        }
        lv.stars.forEach(function(p){if(w.got.indexOf(p[0]+','+p[1])<0)svg.appendChild(K.svg('text',{x:56+p[0]*102,y:72+p[1]*102,'text-anchor':'middle','font-size':42,text:'⭐'}));});
        var g=K.svg('g',{transform:'translate('+(56+w.x*102)+','+(56+w.y*102)+')','data-flow-robot':'',role:'img','aria-label':'ربات، ستون '+K.fa(w.x+1)+' ردیف '+K.fa(w.y+1)});
        g.appendChild(K.svg('rect',{x:-26,y:-23,width:52,height:48,rx:13,fill:'#4c97ff',stroke:'#19528d','stroke-width':3}));
        [-10,10].forEach(function(x){g.appendChild(K.svg('circle',{cx:x,cy:-4,r:6,fill:'#fff'}));});
        g.appendChild(K.svg('path',{d:'M-10 12h20',stroke:'#fff','stroke-width':4}));svg.appendChild(g);
        svg.setAttribute('aria-label','ربات در ستون '+K.fa(w.x+1)+' و ردیف '+K.fa(w.y+1));
        score.textContent='امتیاز بازی: '+K.fa(vars.score)+' · ستاره‌های جمع‌شده: '+K.fa(w.got.length);
      }
      return {level:function(l){lv=l;},home:function(){w=M.fresh(lv);vars={score:0};draw();},snapshot:function(){return JSON.parse(JSON.stringify(w));},
        restore:function(raw){var v=M.restore(lv,raw);if(!v)return false;w=v;draw();return true;},
        refresh:function(v){vars=v;draw();},terminal:function(){return w.ended;},
        beforeEvent:function(e){if(e!=='start')w.events=Math.min(1000,w.events+1);},
        test:function(c,v,e){return M.test(lv,w,c,v,e);},act:function(a,v,e){M.act(lv,w,a,v,e);},
        finish:function(){var ok=M.judge(lv,w,vars);return {ok:ok,text:ok?'آفرین! رفتار برنامه درست بود.':w.faults?'حرکت نامعتبر اجرا شد؛ شرط راه باز را بررسی کن و دوباره شروع کن.':w.got.length!==vars.score?'ستاره جمع شد، اما مقدار امتیاز درست نیست؛ بلوک افزایش را بررسی کن و دوباره شروع کن.':'دکمه‌های بازی را امتحان کن؛ هر حرکت کامل ذخیره می‌شود.'};}}
    }
  };
  return {def:def,app:BlockKit.app(def)};
})();
var LESSON={id:'lab-star-events-pilot',version:6,contentMode:'syllabus',layout:'worksheet',durationMinutes:20,
  title:'کارگاه فرمان و ستاره',subtitle:'نمونهٔ رویداد، شرط و امتیاز',grade:'۱۰ تا ۱۲ سال',subject:'برنامه‌نویسی',duration:'در چند نوبت کوتاه',mascot:'🤖',
  theme:{p:'#4C97FF',pSoft:'#e6f0ff',pInk:'#1b3f7a',a:'#FFAB19',aSoft:'#fff3dd',bg:'#f2f7fd'},
  concepts:['رویداد','شرط','متغیر','اشکال‌یابی'],objectives:['برنامه را با رویداد اجرا کنم.','دو حالت شرط را آزمایش کنم.','امتیاز ستارهٔ قبلی را دوباره نشمارم.'],
  stages:[{id:'lab',title:'کارگاه',icon:'🤖'},{id:'e',title:'گزارش',icon:'📋'}],
  slides:[{id:'lab',stage:'lab',type:'custom',gate:false,q:'کارگاه فرمان و ستاره',noType:true,render:STAR_PILOT.app}].concat(BlockKit.slides(STAR_PILOT.def)).concat([
    {id:'end',stage:'e',type:'end',prompt:'از کجا فهمیدم ستارهٔ قبلی نباید دوباره امتیاز بدهد؟',html:'<div class="callout">هر رویداد، برنامهٔ خودش را اجرا می‌کند. شرط را در دو حالت امتحان کن و امتیاز قبل و بعد را ببین.</div>'}])};
