'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
function worker(scope){
 const handlers={},added=[],deleted=[],matches=[],network=[];
 const prefix='forest-you-'+encodeURIComponent(new URL(scope).pathname)+'-';
 const cache={addAll:async urls=>added.push(...urls),match:async url=>{matches.push(String(url));return{cached:String(url)};}};
 const keys=[prefix+'old-release',prefix+'20260911-village-3','forest-you-'+encodeURIComponent('/Another_Game/')+'-old','unrelated-cache'];
 const context={URL,self:{registration:{scope},addEventListener:(key,fn)=>handlers[key]=fn,clients:{claim:async()=>{}}},caches:{open:async()=>cache,keys:async()=>keys,delete:async key=>{deleted.push(key);return true;}},fetch:async request=>{network.push(request.url);return{network:true};}};
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,'sw.js'),'utf8'),context);
 return{handlers,added,deleted,matches,network,prefix};
}
test('offline installation resolves every asset under a GitHub Pages subdirectory',async()=>{
 const w=worker('https://example.github.io/Pet_Game/');let task;
 w.handlers.install({waitUntil:p=>task=p});await task;
 assert(w.added.includes('https://example.github.io/Pet_Game/index.html'));
 assert(w.added.includes('https://example.github.io/Pet_Game/persistence.js'));
 assert(w.added.every(url=>url.startsWith('https://example.github.io/Pet_Game/')));
 for(const url of w.added){const relative=new URL(url).pathname.replace('/Pet_Game/','')||'index.html';assert(fs.existsSync(path.join(ROOT,relative)),`missing offline asset ${relative}`);}
});
test('updating one game never deletes another game’s caches',async()=>{
 const w=worker('https://example.github.io/Pet_Game/');let task;
 w.handlers.activate({waitUntil:p=>task=p});await task;
 assert.deepEqual(w.deleted,[w.prefix+'old-release']);
});
test('cross-origin requests, adjacent apps, and writes are outside the worker handler',()=>{
 const w=worker('https://example.github.io/Pet_Game/');
 for(const request of [{url:'https://other.example/game.js',method:'GET'},{url:'https://example.github.io/Another_Game/game.js',method:'GET'},{url:'https://example.github.io/Pet_Game_other/game.js',method:'GET'},{url:'https://example.github.io/Pet_Game/game.js',method:'POST'}]){
  let intercepted=false;w.handlers.fetch({request,respondWith(){intercepted=true;}});assert(!intercepted);
 }
});
test('offline navigation returns the same cached application entry point',async()=>{
 const w=worker('https://example.github.io/Pet_Game/');let task;
 w.handlers.fetch({request:{url:'https://example.github.io/Pet_Game/?view=home',method:'GET',mode:'navigate'},respondWith:p=>task=p});
 const response=await task;assert.equal(response.cached,'https://example.github.io/Pet_Game/index.html');assert.deepEqual(w.network,[]);
});
test('runtime code and local art remain within a 300 KB uncompressed budget',()=>{
 const files=['index.html','game.js','journey.js','village.js','village-ui.js','village.css','persistence.js','art.js','app.js','style.css','offline.js','sw.js','manifest.webmanifest','favicon.svg','assets/forest.svg','assets/icon-192.png','assets/icon-512.png'];
 const bytes=files.reduce((total,file)=>total+fs.statSync(path.join(ROOT,file)).size,0);
 assert(bytes<=300000,`Runtime payload is ${bytes} bytes; inspect before expanding it.`);
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 assert(!/<script[^>]+src=["']https?:/i.test(html),'Core play must not require a remote JavaScript CDN.');
});
test('home-screen metadata and actual icon dimensions agree',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'manifest.webmanifest'),'utf8'));
 assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');
 for(const item of manifest.icons){const bytes=fs.readFileSync(path.join(ROOT,item.src));assert.equal(bytes.toString('ascii',1,4),'PNG');const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);assert.equal(item.sizes,`${width}x${height}`);assert(width>=192);}
});
