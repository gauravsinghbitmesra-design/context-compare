'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
let core;
try { core = require('../core.js'); } catch {}
function api() { assert.ok(core, 'core.js not implemented'); return core; }
const BEFORE = `Total: 125k / 200k tokens (62.5%)
System prompt: 12k tokens (6%)
System tools: 28k tokens (14%)
MCP tools: 23k tokens (11.5%)
Custom agents: 2k tokens (1%)
Memory files: 10k tokens (5%)
Skills: 10k tokens (5%)
Messages: 40k tokens (20%)
Free space: 70k tokens (35%)
Autocompact buffer: 5k tokens (2.5%)`;
const AFTER = BEFORE.replace('125k /', '101k /').replace('23k tokens', '9k tokens').replace('10k tokens (5%)', '4k tokens (2%)').replace('Skills: 10k', 'Skills: 6k').replace('70k tokens','94k tokens');

test('parses supported summary and keeps totals distinct from categories', () => {
 const s=api().parseSnapshot(BEFORE);
 assert.equal(s.categories.length,9);assert.equal(s.usedTokens,125000);assert.equal(s.capacityTokens,200000);
 assert.equal(s.categories.find(r=>r.id==='mcp_tools').tokens,23000);assert.equal(s.approximate,true);
});
test('comparison uses shared setup only and negative means fewer',()=>{
 const c=api(),r=c.compareSnapshots(c.parseSnapshot(BEFORE),c.parseSnapshot(AFTER),{conditionsMatched:true});
 assert.equal(r.beforeSubtotal,85000);assert.equal(r.afterSubtotal,61000);assert.equal(r.delta,-24000);assert.equal(r.commonCount,6);
 assert.equal(r.rows.find(r=>r.id==='messages').included,false);assert.equal(r.rows.find(r=>r.id==='free_space').included,false);
 assert.ok(r.percentChange<0);
});
test('all mode includes messages but excludes reserve counts',()=>{
 const c=api(),r=c.compareSnapshots(c.parseSnapshot(BEFORE),c.parseSnapshot(AFTER),{mode:'all'});
 assert.equal(r.beforeSubtotal,125000);assert.equal(r.afterSubtotal,101000);assert.equal(r.commonCount,7);
});
test('missing category is null and never invented zero',()=>{
 const c=api(),a=c.parseSnapshot('System prompt: 100\nSkills: 20'),b=c.parseSnapshot('System prompt: 80');
 const r=c.compareSnapshots(a,b);assert.equal(r.beforeSubtotal,100);assert.equal(r.afterSubtotal,80);
 const row=r.rows.find(x=>x.id==='skills');assert.equal(row.after,null);assert.equal(row.delta,null);assert.equal(row.included,false);assert.ok(r.warnings.some(x=>/missing|shared/i.test(x)));
});
test('zero baseline has no invented percent',()=>{
 const c=api(),r=c.compareSnapshots(c.parseSnapshot('Skills: 0'),c.parseSnapshot('Skills: 10'));
 assert.equal(r.percentChange,null);assert.equal(r.delta,10);
});
test('no overlap refuses comparison',()=>{
 const c=api();assert.throws(()=>c.compareSnapshots(c.parseSnapshot('Skills: 10'),c.parseSnapshot('Messages: 30')),/shared/i);
});
test('accepts Markdown table, commas, tabs and Unicode box table',()=>{
 const c=api();
 const md=c.parseSnapshot('| Category | Tokens | Percent |\n|---|---:|---:|\n| System prompt | 1,234 | 1% |\n| Skills | 1.25k | 1% |');
 assert.equal(md.categories[0].tokens,1234);assert.equal(md.categories[1].tokens,1250);
 const box=c.parseSnapshot('│ Category │ Tokens │\n├─────┼─────┤\n│ System tools │ 2k │');assert.equal(box.categories[0].tokens,2000);
 assert.equal(c.parseSnapshot('Skills\t200').categories[0].tokens,200);
});
test('subtables never become additional top-level categories',()=>{
 const s=api().parseSnapshot('System prompt: 100\nSkills: 20\n\nMemory files\n| File | Tokens |\n| Skills | 9999 |');
 assert.equal(s.categories.find(x=>x.id==='skills').tokens,20);
});
test('known malformed counts are errors without echoing input',()=>{
 const c=api();
 for(const value of ['-1','NaN','Infinity','1e3','2.5','12k SECRET-TOKEN','1,23','999999999999999999','0.0001k','12k;alert(1)']) {
  assert.throws(()=>c.parseSnapshot('Skills: '+value),error=>!error.message.includes('SECRET') && /token|count|value/i.test(error.message),value);
 }
});
test('duplicates and alias collisions fail',()=>{
 const c=api();assert.throws(()=>c.parseSnapshot('Memory files: 10\nCLAUDE.md: 20'),/duplicate/i);
 assert.throws(()=>c.parseSnapshot('{"categories":{"skills":10,"Skills":20}}'),/duplicate/i);
});
test('JSON accepts canonical categories and rejects unsafe numerics/schema',()=>{
 const c=api();const s=c.parseSnapshot(JSON.stringify({schemaVersion:1,categories:{system_prompt:10,skills:'2k'},usedTokens:2010,capacityTokens:200000}));
 assert.equal(s.categories[1].tokens,2000);assert.equal(s.usedTokens,2010);
 for(const data of [{schemaVersion:2,categories:{skills:1}},{categories:{skills:-1}},{categories:{skills:2.3}},{categories:[]},{categories:{skills:null}}])assert.throws(()=>c.parseSnapshot(JSON.stringify(data)));
});
test('unknown names and prototype keys never leave normalized snapshot',()=>{
 const c=api();const s=c.parseSnapshot('{"categories":{"__proto__":10,"skills":20,"PRIVATE-PROJECT":40},"SECRET-TOKEN":"hidden"}');
 const text=JSON.stringify(s);assert.equal(s.categories.length,1);assert.ok(s.ignoredLines>=2);assert.ok(!text.includes('PRIVATE'));assert.ok(!text.includes('SECRET'));assert.equal({}.polluted,undefined);
});
test('unknown text yields count-only warnings and empty input fails',()=>{
 const c=api(),s=c.parseSnapshot('PRIVATE-PROJECT secret\nSkills: 2');assert.ok(s.ignoredLines);assert.ok(!JSON.stringify(s).includes('PRIVATE'));
 for(const value of ['', 'PRIVATE-PROJECT only','{"categories":{}}'])assert.throws(()=>c.parseSnapshot(value));
});
test('limits reject oversized/too-many-line input',()=>{
 const c=api();assert.throws(()=>c.parseSnapshot('a'.repeat(65537)),/limit|large/i);assert.throws(()=>c.parseSnapshot(('\n').repeat(1001)+'Skills: 1'),/limit|lines/i);
});
test('consistency warnings catch category sum and used/capacity mismatch',()=>{
 const c=api();let s=c.parseSnapshot('Total: 100 / 200 tokens\nSkills: 120');assert.ok(s.warnings.some(x=>/exceed/i.test(x)));
 s=c.parseSnapshot('Total: 300 / 200 tokens\nSkills: 1');assert.ok(s.warnings.some(x=>/capacity/i.test(x)));
 s=c.parseSnapshot('Total: 100 / 200 tokens\nSkills: 100\nFree space: 150');assert.ok(s.warnings.some(x=>/capacity|remaining|reconcile/i.test(x)));
});
test('rounded counts receive uncertainty tolerance and a visible approximation caveat',()=>{
 const c=api(),s=c.parseSnapshot('Total: 3k / 200k tokens\nSkills: 1.5k\nSystem tools: 1.6k');
 assert.equal(s.categories[0].roundingHalf,50);assert.ok(!s.warnings.some(x=>/exceeds the reported total/i.test(x)));
 assert.ok(s.warnings.some(x=>/round/i.test(x)));
});
test('different capacities and unconfirmed conditions produce warnings',()=>{
 const c=api(),r=c.compareSnapshots(c.parseSnapshot('Total: 10 / 200k tokens\nSkills: 10'),c.parseSnapshot('Total: 10 / 1m tokens\nSkills: 10'));
 assert.ok(r.warnings.some(x=>/capacit/i.test(x)));assert.ok(r.warnings.some(x=>/confirm/i.test(x)));
});
test('exports are aggregate only, explicit sample and do not accept arbitrary labels',()=>{
 const c=api(),r=c.compareSnapshots(c.parseSnapshot(BEFORE),c.parseSnapshot(AFTER));
 r.rows[0].label='PRIVATE-NAME';r.warnings.push('SECRET-TOKEN');r.raw='PRIVATE-RAW';
 const out=c.makeExport(r,{demo:true}),md=c.makeMarkdown(r,{demo:true});
 assert.equal(out.demo,true);assert.equal(out.schemaVersion,1);
 for(const text of [JSON.stringify(out),md])for(const secret of ['PRIVATE','SECRET'])assert.ok(!text.includes(secret));
 assert.match(md,/synthetic|sample/i);assert.match(md,/reported/i);assert.match(md,/bill|quota/i);
});
test('browser global and CommonJS expose same API',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),sandbox={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../core.js'),'utf8'),sandbox);
 assert.equal(typeof sandbox.ContextCompare.parseSnapshot,'function');
});

test('duplicate exact JSON keys and excessive nesting are refused',()=>{
 const c=api();
 assert.throws(()=>c.parseSnapshot('{"categories":{"skills":10,"skills":20}}'),/duplicate/i);
 assert.throws(()=>c.parseSnapshot('{"categories":{"skills":1},"extra":'+ '['.repeat(80)+'0'+']'.repeat(80)+'}'),/nest|limit/i);
});
test('delta uncertainty is preserved through aggregate export',()=>{
 const c=api(),r=c.compareSnapshots(c.parseSnapshot('Skills: 12k'),c.parseSnapshot('Skills: 11k'));
 assert.deepEqual(r.deltaRange,{min:-2000,max:0});
 assert.deepEqual(c.makeExport(r).deltaRange,r.deltaRange);
 assert.match(c.makeMarkdown(r),/Display-rounding delta range/);
});

test('adjacent detail-table headers cannot create top-level counts',()=>{
 const c=api();
 for(const [name,count] of [['File','Token count'],['Name','Context tokens']]) {
  const s=c.parseSnapshot(`| Category | Tokens |\n| System prompt | 100 |\n\n| ${name} | ${count} |\n| Skills | 9000 |`);
  assert.equal(s.categories.length,1);assert.equal(s.categories[0].tokens,100);
 }
 const noBlank=c.parseSnapshot('| Category | Tokens |\n| System prompt | 100 |\n| File | Token count |\n| Skills | 9000 |');
 assert.equal(noBlank.categories.length,1);
});
test('unquantified approximate counts are rejected rather than precise ranges',()=>{
 const c=api();
 for(const value of ['~100','≈90','~12k','≈1.2k']) {
  assert.throws(()=>c.parseSnapshot(`Skills: ${value}`),/unquantified|approximate/i);
  assert.throws(()=>c.parseSnapshot(JSON.stringify({categories:{skills:value}})),/unquantified|approximate/i);
 }
 assert.throws(()=>c.parseSnapshot('Total: ~100 / 200 tokens\nSkills: 20'),/unquantified|approximate/i);
});
test('unknown slash lines are excluded while explicit malformed totals fail',()=>{
 const c=api();
 for(const line of ['PRIVATE / 200 tokens','claude-sonnet-4-5 · 21k/200k tokens (10.5%)']) {
  const s=c.parseSnapshot(line+'\nSkills: 20');assert.equal(s.usedTokens,null);assert.equal(s.categories[0].tokens,20);
  assert.ok(!JSON.stringify(s).includes('PRIVATE'));assert.ok(s.ignoredLines>0);
 }
 assert.equal(c.parseSnapshot('21k/200k tokens (10.5%)\nSkills: 20').usedTokens,21000);
 assert.throws(()=>c.parseSnapshot('Total: PRIVATE / 200 tokens\nSkills: 20'),/token|count|value/i);
});
