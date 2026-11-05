'use strict';
const http=require('node:http');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const allowed=new Set(['index.html','core.js','app.js','styles.css']);
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname==='/'?'index.html':new URL(req.url,'http://localhost').pathname.slice(1);
 if(!allowed.has(name)){res.writeHead(404);return res.end('Not found');}
 res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8');
 const stream=fs.createReadStream(path.join(root,name));stream.on('error',()=>{res.writeHead(404);res.end('Not found');});stream.pipe(res);
});
server.listen(4173,'127.0.0.1',()=>console.log('Context Compare: http://127.0.0.1:4173 (Ctrl+C to stop)'));
server.on('error',()=>{console.error('Could not start local server. Check port 4173.');process.exitCode=1;});
