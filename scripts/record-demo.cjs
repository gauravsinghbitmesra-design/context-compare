'use strict';
// Synthetic scenarios only. This script never opens a real agent session.
const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'context-compare-demo-'));
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const context=await browser.newContext({viewport:{width:1280,height:900},recordVideo:{dir:temp,size:{width:1280,height:900}}});
 const page=await context.newPage();const video=page.video();
 try{
  await page.goto(pathToFileURL(path.join(root,'index.html')).href);
  await page.waitForTimeout(1000);
  await page.locator('#results').scrollIntoViewIfNeeded();await page.waitForTimeout(1400);
  await page.locator('[data-sample="unchanged"]').click();await page.locator('#results').scrollIntoViewIfNeeded();await page.waitForTimeout(1400);
  await page.locator('[data-sample="partial"]').click();await page.locator('#warnings').scrollIntoViewIfNeeded();await page.waitForTimeout(1400);
  await page.locator('[data-sample="leaner"]').click();await page.locator('#results').scrollIntoViewIfNeeded();await page.waitForTimeout(1400);
 }finally{await context.close();}
 try{await video.saveAs(path.join(root,'launch/demo.webm'));}finally{await browser.close();}
 console.log('Saved launch/demo.webm — synthetic scenario recording.');
})().catch(e=>{console.error(e);process.exitCode=1;});
