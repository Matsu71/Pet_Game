const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const allowed = new Set(['index.html', 'style.css', 'app.js', 'game.js', 'favicon.svg', 'assets/forest.svg']);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const port = Number(process.env.PORT || 4173);
http.createServer((req, res) => {
  let name;
  try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\//, '') || 'index.html'; }
  catch { res.writeHead(400).end('Bad request'); return; }
  if (!['GET', 'HEAD'].includes(req.method) || !allowed.has(name)) { res.writeHead(404).end('Not found'); return; }
  fs.readFile(path.join(__dirname, name), (error, data) => {
    if (error) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(name)], 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}).listen(port, '127.0.0.1', () => console.log(`森の子: http://localhost:${port} （終了: Ctrl+C）`));
