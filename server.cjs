/* Preview only the public runtime. BASE_PATH=/Pet_Game/ exercises GitHub Pages. */
'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const ASSETS = Object.freeze(['index.html', 'style.css', 'app.js', 'game.js', 'world.js', 'journey.js', 'art.js', 'village.js', 'village-ui.js', 'village.css', 'persistence.js', 'offline.js', 'sw.js', 'manifest.webmanifest', 'favicon.svg', 'assets/forest.svg', 'assets/icon-192.png', 'assets/icon-512.png']);
const TYPES = Object.freeze({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json; charset=utf-8'});
function createServer({basePath='/'}={}) {
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(basePath)) throw new TypeError('BASE_PATH must be a path such as /Pet_Game/');
  const allowed=new Set(ASSETS);
  return http.createServer((req,res)=>{
    if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405,{Allow:'GET, HEAD'}).end();return;}
    let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end('Bad request');return;}
    if(basePath!=='/' && pathname===basePath.slice(0,-1)){res.writeHead(308,{Location:basePath}).end();return;}
    const name=pathname.startsWith(basePath)?pathname.slice(basePath.length)||'index.html':'';
    if(!allowed.has(name)){res.writeHead(404).end('Not found');return;}
    fs.readFile(path.join(__dirname,name),(error,data)=>{
      if(error){res.writeHead(404).end('Not found');return;}
      res.writeHead(200,{'Content-Type':TYPES[path.extname(name)],'Content-Length':data.length,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'});
      res.end(req.method==='HEAD'?undefined:data);
    });
  });
}
module.exports={createServer,ASSETS};
if(require.main===module){
  const port=Number(process.env.PORT??4173);if(!Number.isInteger(port)||port<0||port>65535)throw new TypeError('Invalid PORT');
  const basePath=process.env.BASE_PATH||'/',server=createServer({basePath});
  server.on('error',error=>{console.error(`Preview: ${error.message}`);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`森の子: http://127.0.0.1:${server.address().port}${basePath}`));
}
