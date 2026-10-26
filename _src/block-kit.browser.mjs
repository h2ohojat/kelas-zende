import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const html=fs.readFileSync(new URL('../content/lab-robot-blocks.html',import.meta.url),'utf8');
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
 const f=page.frameLocator('iframe'),ws=f.getByRole('region',{name:'Blocks workspace.',exact:true});
 const palette=f.getByRole('listbox',{name:'blocks',exact:true});
 const move=()=>palette.getByText('یک خانه جلو برو',{exact:false}).click();
 const run=async()=>{await f.locator('[data-lab="run"]').click();await f.locator('[data-bk="win-next"]').waitFor({state:'visible'})};
 const pick=async(id)=>{const stay=f.locator('[data-bk="win-stay"]');if(await stay.isVisible())await stay.click();await f.locator('[data-bk="levels"]').click();await f.locator('[data-bk-pick="'+id+'"]').click()};
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.waitForFunction(()=>window.hello);assert.equal(await f.locator('[data-lab="run"]').count(),0,'not started before init');
 await page.locator('#init').click();await f.locator('[data-lab="run"]').waitFor({state:'visible'});await f.locator('[data-lab="speed"]').click();
 await move();await move();await run();await page.waitForFunction(()=>window.latest?.stars===3&&window.latest.res[1]?.done);
 await page.reload();await f.locator('[data-lab="run"]').waitFor({state:'visible'});assert.match(await f.locator('[data-bk="levels"]').innerText(),/✅/);assert.match(await f.locator('[data-lab="count"]').innerText(),/۲/);
 await run();await page.waitForFunction(()=>window.latest?.stars===3);assert.equal((await page.evaluate(()=>window.latest)).stars,3,'no duplicate stars after resume');
 await f.locator('[data-bk="win-next"]').click();await move();await move();await move();await ws.getByText('یک خانه جلو برو',{exact:false}).first().click();await palette.getByText('به راست بچرخ',{exact:false}).click();await run();
 await page.waitForFunction(()=>window.latest?.stars===6);assert.match(await f.locator('[data-lab="count"]').innerText(),/۴/);
 await pick('loop-line');await f.getByRole('listbox',{name:'blocks',exact:true}).getByText('بار تکرار کن',{exact:false}).click();await ws.getByRole('button',{name:'dropdown: ۴',exact:true}).click();await f.getByRole('option',{name:'۶',exact:true}).click();
 await page.setViewportSize({width:360,height:800});await f.locator('.bk-port').waitFor({state:'visible'});await ws.getByText('بار تکرار کن',{exact:false}).click();await move();await run();await page.waitForFunction(()=>window.latest?.stars===9);
 const saved=await page.evaluate(()=>window.latest);assert.equal(saved.res[0].state.solved.length,3);
 await page.reload();await f.locator('[data-lab="run"]').waitFor({state:'visible'});assert.match(await f.locator('[data-lab="count"]').innerText(),/۲/);assert.match(await f.locator('[data-bk="levels"]').innerText(),/✅.*۹/);
 assert.deepEqual(errors,[],'no console or CSP errors');console.log('PASS: delayed init, list restore, no repeated award, middle insertion, empty repeat, orientation and resume.');
} finally {await browser?.close();await new Promise(resolve=>server.close(resolve))}
