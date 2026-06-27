import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const root = new URL('../..', import.meta.url).pathname;
const types = {'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json'};
createServer(async (req,res)=>{ try { const url = new URL(req.url,'http://localhost'); const safe = normalize(url.pathname === '/' ? '/apps/web/index.html' : url.pathname); const file = join(root, safe); res.setHeader('content-type', types[extname(file)] || 'text/plain'); res.end(await readFile(file)); } catch { res.statusCode=404; res.end('Not found'); } }).listen(4173,()=>console.log('Henkanki web: http://localhost:4173'));
