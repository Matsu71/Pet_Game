'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createServer,ASSETS}=require('../server.cjs'),ROOT=path.join(__dirname,'..');
async function preview(t,basePath='/'){
 const server=createServer({basePath});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));return `http://127.0.0.1:${server.address().port}`;
}
for(const basePath of ['/','/Pet_Game/'])test(`all scripts and offline assets are actually served at ${basePath}`,async t=>{
 const origin=await preview(t,basePath),home=await fetch(origin+basePath);assert.equal(home.status,200);const html=await home.text();
 const sources=[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m=>m[1]);
 for(const file of new Set([...ASSETS,...sources])){
  const r=await fetch(origin+basePath+file+'?test=delivery');assert.equal(r.status,200,`Missing runtime asset: ${file}`);assert.equal(r.headers.get('x-content-type-options'),'nosniff');
  if(file.endsWith('.js'))assert.match(r.headers.get('content-type'),/javascript/);
  assert.deepEqual(Buffer.from(await r.arrayBuffer()),fs.readFileSync(path.join(ROOT,file)),`Wrong content: ${file}`);
 }
});
test('HEAD returns GET metadata without body',async t=>{
 const origin=await preview(t),r=await fetch(origin+'/game.js',{method:'HEAD'});assert.equal(r.status,200);assert.equal(Number(r.headers.get('content-length')),fs.statSync(path.join(ROOT,'game.js')).size);assert.equal(await r.text(),'');
});
test('repository internals, malformed URLs and writes are rejected',async t=>{
 const origin=await preview(t);
 for(const target of ['/.git/config','/package.json','/scripts/integrate-mobile-quality.cjs','/tests/game.test.cjs','/%2e%2e/package.json','/assets%2f..%2f..%2fpackage.json'])assert.equal((await fetch(origin+target)).status,404,target);
 assert.equal((await fetch(origin+'/%XX')).status,400);assert.equal((await fetch(origin+'/',{method:'POST',body:'change'})).status,405);
});
test('subpath redirect and adjacent-app isolation',async t=>{
 const origin=await preview(t,'/Pet_Game/'),r=await fetch(origin+'/Pet_Game',{redirect:'manual'});assert.equal(r.status,308);assert.equal(r.headers.get('location'),'/Pet_Game/');
 for(const target of ['/','/Another_Game/','/Pet_Game_other/game.js'])assert.equal((await fetch(origin+target)).status,404);
 assert.throws(()=>createServer({basePath:'//external/'}));
});
