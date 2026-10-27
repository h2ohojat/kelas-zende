import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const html=fs.readFileSync(new URL('../content/lab-star-events-pilot.html',import.meta.url),'utf8');
const csp="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; frame-src 'none'; worker-src blob:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'; sandbox allow-scripts";
const host=`<!doctype html><meta charset="utf-8"><button id="init">init</button><iframe sandbox="allow-scripts" src="/lesson" style="width:100%;height:760px;border:0"></iframe><script>
let f=document.querySelector('iframe'); window.latest=null; window.hello=null;
function start(){f.contentWindow.postMessage({ns:'kelas',v:1,kind:'init',persist:true,state:JSON.parse(localStorage.getItem('saved')||'null')},'*');history.replaceState(null,'','?auto=1')}
document.querySelector('#init').onclick=start;
addEventListener('message',e=>{if(e.source!==f.contentWindow||e.data?.ns!=='kelas')return;const m=e.data;
if(m.kind==='hello'){window.hello=m;if(location.search==='?auto=1')start()}
if(m.kind==='state'){window.latest=m.state;const state=structuredClone(m.state);for(const k of ['res','dwell','tags','self','stDone']){const x=state[k];if(x&&Object.keys(x).length&&Object.keys(x).every((v,i)=>v===String(i)))state[k]=Object.values(x)}localStorage.setItem('saved',JSON.stringify(state))}});
</script>`;
const server=http.createServer((req,res)=>{if(req.url==='/lesson'){res.setHeader('Content-Security-Policy',csp);res.end(html)}else{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(host)}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try {
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1280,height:900}});page.setDefaultTimeout(10000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const f=page.frameLocator('iframe'),ws=f.getByRole('region',{name:'Blocks workspace.',exact:true}),palette=f.getByRole('listbox',{name:'blocks',exact:true});
 const click=async name=>f.getByRole('button',{name,exact:true}).click();
 const ready=()=>f.locator('.bk:not(.bk-running)').waitFor({state:'visible'});
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.waitForFunction(()=>window.hello);assert.equal(await f.locator('[data-lab="run"]').count(),0,'wait for init');
 await page.locator('#init').click();await f.locator('[data-lab="run"]').waitFor({state:'visible'});
 await click('سرعت: عادی');await palette.getByText('یک خانه در جهت دکمه برو',{exact:false}).click();await click('شروع بازی');await ready();
 assert.equal(await f.locator('[data-flow-score]').innerText(),'امتیاز بازی: ۰ · ستاره‌های جمع‌شده: ۰');
 await click('حرکت راست');await page.waitForFunction(()=>window.latest?.stars===3);
 await f.locator('[data-bk="win-next"]').click();await palette.getByText('اگر راه باز است',{exact:false}).click();await palette.getByText('یک خانه در جهت دکمه برو',{exact:false}).click();
 await click('شروع بازی');await ready();await click('حرکت راست');await ready();await click('حرکت بالا');await page.waitForFunction(()=>window.latest?.stars===6);
 await f.locator('[data-bk="win-next"]').click();await ws.getByText('ستاره را جمع کن',{exact:false}).click();await palette.getByText('به امتیاز',{exact:false}).click();
 await click('شروع بازی');await ready();await click('سرعت: تند');await click('حرکت راست');await click('توقف');
 assert.match(await f.locator('[data-flow-score]').innerText(),/۰.*۰/,'stop restores pre-event score');
 await click('سرعت: آهسته');await click('سرعت: عادی');await click('حرکت راست');await ready();
 await page.waitForFunction(()=>window.latest?.res?.[0]?.state?.flow?.['score-step']?.vars?.score===1);
 await f.locator('[data-event-edit="up"]').click();await page.reload();await f.locator('[data-lab="run"]').waitFor({state:'visible'});
 assert.match(await f.locator('[data-flow-score]').innerText(),/۱.*۱/);assert.equal(await f.locator('[data-event-edit="up"]').getAttribute('aria-pressed'),'true');
 await click('حرکت چپ');await ready();await click('حرکت راست');await ready();
 assert.match(await f.locator('[data-flow-score]').innerText(),/۱.*۱/,'star revisited without another point');
 await click('حرکت راست');await ready();await click('حرکت بالا');await page.waitForFunction(()=>window.latest?.stars===9);
 await click('همین‌جا بمان');await page.setViewportSize({width:390,height:844});await click('📋 نتایج');await click('پایان آزمایش و گزارش نهایی');
 await f.getByRole('heading',{name:/به مقصد رسیدی/}).waitFor({state:'visible'});
 await page.waitForFunction(()=>window.latest?.completed===true);await page.reload();
 await f.getByRole('heading',{name:/به مقصد رسیدی/}).waitFor({state:'visible'});assert.equal((await page.evaluate(()=>window.latest)).stars,9);
 assert.deepEqual(errors,[]);console.log('PASS: delayed init, event/conditional/score, handler switch, resume, unique stars, final report.');
} finally {await browser?.close();await new Promise(resolve=>server.close(resolve))}
