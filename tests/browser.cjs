const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const allowed=new Map([['/','index.html'],['/index.html','index.html'],['/core.js','core.js'],['/app.js','app.js'],['/styles.css','styles.css']]);
(async()=>{
 const server=http.createServer(async(req,res)=>{
  const name=allowed.get(new URL(req.url,'http://localhost').pathname);
  if(!name){res.writeHead(404);return res.end();}
  try{const data=await fs.readFile(path.join(root,name));res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(data);}catch{res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const context=await browser.newContext({viewport:{width:1440,height:1100},permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();let errors=[];page.on('pageerror',e=>errors.push(e.message));
 let requestCount=0;page.on('request',()=>requestCount++);
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.locator('#report-delta').waitFor();
  assert.match(await page.locator('#report-delta').innerText(),/24,000/);
  assert.match(await page.locator('#sample-badge').innerText(),/Sample/);
  const afterLoad=requestCount;
  await page.locator('[data-sample="unchanged"]').click();
  assert.match(await page.locator('#report-delta').innerText(),/No reported change/);
  await page.locator('[data-sample="partial"]').click();
  assert.match(await page.locator('#warnings').innerText(),/missing|shared|partial/i);
  await page.locator('[data-sample="leaner"]').click();
  await page.locator('#before').fill('System prompt: 100\nSECRET_KEY=private-test-secret\n<img src="https://evil.invalid/pixel" onerror="window.XSS=1">');
  assert.equal(await page.locator('#download-png').isDisabled(),true);
  await page.locator('#after').fill('System prompt: 50');
  await page.locator('#compare').click();
  assert.match(await page.locator('#report-delta').innerText(),/50/);
  assert.match(await page.locator('#warnings').innerText(),/condition|model|confirm/i);
  assert.equal(await page.evaluate(()=>window.XSS),undefined);
  await page.locator('#copy-report').click();
  const copied=await page.evaluate(()=>navigator.clipboard.readText());
  assert.ok(!copied.includes('private-test-secret')&&!copied.includes('evil.invalid'));
  assert.match(copied,/reported/i);
  const pending=page.waitForEvent('download');await page.locator('#download-json').click();const downloaded=await pending;
  const text=await fs.readFile(await downloaded.path(),'utf8');assert.ok(!text.includes('private-test-secret'));JSON.parse(text);
  const pngPending=page.waitForEvent('download');await page.locator('#download-png').click();const png=await pngPending;
  const bytes=await fs.readFile(await png.path());assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  await page.evaluate(()=>{
   window.originalBlob=HTMLCanvasElement.prototype.toBlob;window.originalAnchor=HTMLAnchorElement.prototype.click;
   window.exportClicks=0;
   HTMLAnchorElement.prototype.click=function(){window.exportClicks++;};
   HTMLCanvasElement.prototype.toBlob=function(callback,...args){window.originalBlob.call(this,blob=>{window.finishPendingExport=()=>callback(blob);},...args);};
  });
  await page.locator('#download-png').click();
  await page.waitForFunction(()=>typeof window.finishPendingExport==='function');
  await page.locator('#clear').click();
  await page.evaluate(()=>window.finishPendingExport());
  assert.equal(await page.evaluate(()=>window.exportClicks),0,'Clearing input must cancel an in-flight PNG export');
  await page.evaluate(()=>{HTMLCanvasElement.prototype.toBlob=window.originalBlob;HTMLAnchorElement.prototype.click=window.originalAnchor;});
  await page.locator('[data-sample="leaner"]').click();
  await page.locator('#before').fill('System prompt: -10');await page.locator('#compare').click();
  assert.ok((await page.locator('#error').innerText()).length>0);
  assert.equal(await page.locator('#download-json').isDisabled(),true);
  await page.locator('#clear').click();assert.equal(await page.locator('#before').inputValue(),'');
  await page.locator('[data-sample="leaner"]').click();
  assert.equal(requestCount,afterLoad,'App actions must make no network requests');
  assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:path.join(root,'assets/demo-desktop.png')});
  await page.locator('#results').screenshot({path:path.join(root,'assets/demo-result.png')});
  const sampleCardPending=page.waitForEvent('download');await page.locator('#download-png').click();const sampleCard=await sampleCardPending;await sampleCard.saveAs(path.join(root,'assets/share-card.png'));
  await page.setViewportSize({width:390,height:1000});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');
  await page.screenshot({path:path.join(root,'assets/demo-mobile.png')});
  assert.deepEqual(errors,[]);
  const filePage=await context.newPage();await filePage.goto('file://'+path.join(root,'index.html'));
  await filePage.locator('#report-delta').waitFor();assert.match(await filePage.locator('#report-delta').innerText(),/24,000/);
  await filePage.close();
  console.log('Browser checks passed: scenarios, stale exports, malformed input, aggregate-only exports, clipboard, PNG, no requests/storage, mobile, direct-file use.');
 } finally {await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
