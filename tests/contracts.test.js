'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const core=require('../core.js');
const root=path.resolve(__dirname,'..');
test('browser code has no upload, tracking or persistence APIs',()=>{
 const js=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert.doesNotMatch(js,/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB)\b/);
 assert.doesNotMatch(js,/innerHTML|outerHTML|insertAdjacentHTML|\beval\s*\(/);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/connect-src 'none'/);assert.doesNotMatch(html,/<script[^>]+src=["']https?:/i);
});
test('display-rounded sample retains uncertainty and cautions in exports',()=>{
 const a=core.parseSnapshot('System prompt: 1.0k'),b=core.parseSnapshot('System prompt: 0.9k');
 const r=core.compareSnapshots(a,b,{mode:'setup',conditionsMatched:true});
 assert.equal(r.delta,-100);assert.ok(r.deltaRange.max>=0);
 const doc=core.makeMarkdown(r,{demo:true});
 assert.match(doc,/round/i);assert.match(doc,/Synthetic/);assert.match(doc,/not.*(?:billing|quota)|not independently/i);
 const json=core.makeExport(r,{demo:true});assert.deepEqual(json.deltaRange,r.deltaRange);
});
test('README local links and referenced local assets resolve',()=>{
 const readme=path.join(root,'README.md');assert.ok(fs.existsSync(readme),'README has not been created');
 for(const target of fs.readFileSync(readme,'utf8').matchAll(/\]\(([^)\s]+)\)/g)){
  const link=target[1];if(/^[a-z]+:|^#/i.test(link))continue;
  assert.ok(fs.existsSync(path.resolve(root,decodeURIComponent(link.split('#')[0]))),link);
 }
});
