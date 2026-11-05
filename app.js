/* Browser-only controller. Pasted content is never inserted as HTML or stored. */
(()=>{
'use strict';
const core=globalThis.ContextCompare;
const $=id=>document.getElementById(id);
const fmt=value=>Number(value).toLocaleString('en-US',{maximumFractionDigits:2});
const before=`Total: 125k / 200k tokens (62.5%)
System prompt: 12k tokens
System tools: 28k tokens
MCP tools: 23k tokens
Custom agents: 2k tokens
Memory files: 10k tokens
Skills: 10k tokens
Messages: 40k tokens
Free space: 70k tokens
Autocompact buffer: 5k tokens`;
const after=`Total: 101k / 200k tokens (50.5%)
System prompt: 12k tokens
System tools: 28k tokens
MCP tools: 9k tokens
Custom agents: 2k tokens
Memory files: 4k tokens
Skills: 6k tokens
Messages: 40k tokens
Free space: 94k tokens
Autocompact buffer: 5k tokens`;
const samples={leaner:[before,after],unchanged:[before,before],partial:[before,'System prompt: 12k tokens\nSystem tools: 28k tokens\nMCP tools: 9k tokens']};
let result=null;let demo=true;let revision=0;
const exportIds=['copy-report','download-json','download-png'];
function enableExports(enabled){for(const id of exportIds)$(id).disabled=!enabled;}
function invalidate(){revision++;result=null;$('results').hidden=true;enableExports(false);$('error').hidden=true;$('status').textContent='';}
function clearInputs(){invalidate();$('before').value='';$('after').value='';demo=false;$('matched').checked=false;$('sample-badge').textContent='Your inputs';}
function signed(n){return n===null?'Not reported':n===0?'0':`${n<0?'−':'+'}${fmt(Math.abs(n))}`;}
function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function render(){
 $('report-delta').textContent=result.delta===0?'No reported change':`${fmt(Math.abs(result.delta))} ${result.delta<0?'fewer':'more'} reported tokens`;
 $('report-scope').textContent=`Across ${result.commonCount} shared ${result.mode==='setup'?'setup':'selected used'} categories. ${demo?'Synthetic example, not measured savings.':'User-supplied counts; check the cautions below.'}`;
 $('before-total').textContent=fmt(result.beforeSubtotal);$('after-total').textContent=fmt(result.afterSubtotal);
 $('percent').textContent=result.percentChange===null?'Unavailable':`${result.percentChange>0?'+':result.percentChange<0?'−':''}${Math.abs(result.percentChange).toFixed(1)}%`;
 const rows=[];const max=Math.max(1,...result.rows.flatMap(r=>[r.before||0,r.after||0]));
 for(const row of result.rows){
  const tr=node('tr');if(!row.included)tr.className='excluded';
  tr.append(node('td',row.label),node('td',row.before===null?'Not reported':fmt(row.before)),node('td',row.after===null?'Not reported':fmt(row.after)),node('td',signed(row.delta),row.included?(row.delta<0?'down':row.delta>0?'up':''):''));
  const td=node('td',undefined,'bar-cell');const stack=node('div',undefined,'bar-stack');stack.setAttribute('aria-hidden','true');
  for(const side of ['before','after']){const bar=node('span',undefined,'bar '+side);bar.style.width=`${Math.max(0,Math.min(100,(row[side]||0)/max*100))}%`;stack.append(bar);}
  td.append(stack);tr.append(td);rows.push(tr);
 }
 $('rows').replaceChildren(...rows);
 $('warnings').replaceChildren(...result.warnings.map(w=>node('li',w)));
 $('next-action').textContent=result.warnings.length?'Check the cautions first. Repeat a fresh-session comparison under the same conditions before attributing a change to your setup.':'Repeat the comparison under the same conditions, and check the workflow still works before keeping the setup change.';
 $('results').hidden=false;enableExports(true);
}
function compare(){
 invalidate();
 try{
  const a=core.parseSnapshot($('before').value),b=core.parseSnapshot($('after').value);
  result=core.compareSnapshots(a,b,{mode:$('mode').value,conditionsMatched:$('matched').checked});render();
 }catch(error){$('error').textContent=error.message||'Could not compare these snapshots. Check the supported formats.';$('error').hidden=false;}
}
function loadSample(name){const values=samples[name];clearInputs();demo=true;$('sample-badge').textContent='Sample data';$('before').value=values[0];$('after').value=values[1];$('matched').checked=true;compare();}
function download(blob,name){const url=URL.createObjectURL(blob);const a=node('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function wrap(ctx,text,maxWidth){const lines=[];let line='';for(const word of text.split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>maxWidth&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;}
function shareCard(){
 if(!result)return;
 const exportRevision=revision;
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 ctx.font='18px sans-serif';
 const caveats=[...(demo?['Synthetic example — not measurements from a real session.']:['User-supplied reported counts.']),...result.warnings,...core.makeExport(result,{demo}).limitations,'Reported counts are not billing, quota savings or proven performance improvement.'];
 const warningLines=caveats.flatMap(t=>wrap(ctx,'• '+t,1040));
 canvas.width=1200;canvas.height=Math.max(700,490+warningLines.length*27);
 ctx.fillStyle='#f7f6f2';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle='#606b64';ctx.font='18px monospace';ctx.fillText('CONTEXT COMPARE  /  REPORTED BEFORE & AFTER',70,65);
 ctx.fillStyle='#192420';ctx.font='bold 46px sans-serif';
 const headline=result.delta===0?'No reported change':`${fmt(Math.abs(result.delta))} ${result.delta<0?'fewer':'more'} reported tokens`;
 ctx.fillText(headline,70,145);ctx.font='20px sans-serif';ctx.fillStyle='#606b64';ctx.fillText(`${result.commonCount} shared ${result.mode==='setup'?'setup':'selected used'} categories · ${demo?'Sample data':'User-supplied counts'}`,70,190);
 const max=Math.max(1,result.beforeSubtotal,result.afterSubtotal);
 for(const [index,label,value,color] of [[0,'Before',result.beforeSubtotal,'#b6c0cc'],[1,'After',result.afterSubtotal,'#245bd4']]){
  const y=245+index*85;ctx.fillStyle='#192420';ctx.font='22px sans-serif';ctx.fillText(label,70,y);ctx.fillText(fmt(value),960,y);
  ctx.fillStyle=color;ctx.fillRect(70,y+17,1040*value/max,18);
 }
 ctx.fillStyle='#192420';ctx.font='bold 19px sans-serif';ctx.fillText('READ WITH THE RESULT',70,440);
 ctx.font='18px sans-serif';ctx.fillStyle='#606b64';warningLines.forEach((line,i)=>ctx.fillText(line,70,477+i*27));
 ctx.font='14px monospace';ctx.fillStyle='#245bd4';ctx.fillText('github.com/gauravsinghbitmesra-design/context-compare',70,canvas.height-22);
 canvas.toBlob(blob=>{if(blob&&exportRevision===revision){download(blob,'context-compare.png');$('status').textContent='Share card downloaded. Review its counts and cautions before posting.';}},'image/png');
}
$('compare').addEventListener('click',compare);$('clear').addEventListener('click',clearInputs);
for(const id of ['before','after'])$(id).addEventListener('input',()=>{invalidate();demo=false;$('sample-badge').textContent='Your inputs';$('matched').checked=false;});
for(const id of ['mode','matched'])$(id).addEventListener('change',invalidate);
for(const button of document.querySelectorAll('[data-sample]'))button.addEventListener('click',()=>loadSample(button.dataset.sample));
$('copy-report').addEventListener('click',async()=>{if(!result)return;try{await navigator.clipboard.writeText(core.makeMarkdown(result,{demo}));$('status').textContent='Aggregate report copied, including cautions.';}catch{$('status').textContent='Clipboard is unavailable here. Use Export JSON or run on localhost.';}});
$('download-json').addEventListener('click',()=>{if(result)download(new Blob([JSON.stringify(core.makeExport(result,{demo}),null,2)],{type:'application/json'}),'context-compare.json');});
$('download-png').addEventListener('click',shareCard);
loadSample('leaner');
})();
