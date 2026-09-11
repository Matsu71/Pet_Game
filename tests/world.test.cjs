'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const G=require('../game.js'),W=require('../world.js'),J=require('../journey.js'),V=require('../village.js');
const fresh=()=>G.fresh('demo','ミオ','fox',Date.UTC(2026,8,11,3),()=>.5);
const valid=s=>G.validate(s)&&J.validate(s)&&V.validate(s);
const clone=s=>JSON.parse(JSON.stringify(s));
function raise(s){for(let i=0;i<8;i++){G.care(s,'feed');G.care(s,'bath');G.advance(s);}}
function complete(s,route,choice=1){assert(G.beginAdventure(s,route).ok);for(let i=0;i<3;i++)assert(G.chooseAdventure(s,choice).ok);assert(G.finishAdventure(s).ok);}

test('four stable route IDs provide twelve original encounters and two valid choices each',()=>{
 assert.equal(Object.keys(G.ROUTES).length,4);const titles=new Set();
 for(const [id,r]of Object.entries(G.ROUTES)){
  const s=fresh();G.beginAdventure(s,id);assert(Object.isFrozen(r));
  for(let i=0;i<3;i++){
   const e=G.currentEncounter(s);assert(e.title&&e.text&&e.icon);assert.equal(e.choices.length,2);titles.add(e.title);
   for(const o of e.choices){assert(Object.hasOwn(G.ABILITIES,o.ability));assert(Object.hasOwn(G.LABELS,o.trait));assert(o.threshold>=0&&o.threshold<=100);assert(o.coins>0&&o.coins<=45);assert(o.xp>0&&o.xp<=22);assert(o.success);if(o.threshold>0)assert(o.fail);}
   G.chooseAdventure(s,1);
  }
  assert.equal(G.currentEncounter(s),null);
 }
 assert.equal(titles.size,12);
});
for(const route of Object.keys(G.ROUTES))for(const ability of [0,100])test(`${route}: preview equals actual rewards with ability ${ability}, resume preserves scene`,()=>{
 let s=fresh();const c=G.active(s);for(const k of Object.keys(G.ABILITIES))c[k]=ability;
 assert(G.beginAdventure(s,route).ok);let total=0;
 for(let i=0;i<3;i++){
  const title=G.currentEncounter(s).title,p=G.previewChoice(s,0),before=s.adventure.coins;
  s=clone(s);assert(valid(s));assert.equal(G.currentEncounter(s).title,title);assert.equal(G.adventureRoute(s),route);
  const r=G.chooseAdventure(s,0);assert.equal(r.coins,p.coins);assert.equal(r.xp,p.xp);assert.equal(s.adventure.coins,before+p.coins);total+=p.coins;assert(valid(s));
 }
 assert(G.finishAdventure(s).ok);assert.deepEqual(G.visitedRoutes(G.active(s)),[route]);assert.equal(s.coins,30+25+total);assert(valid(s));
 const earned=s.coins;assert(!G.finishAdventure(s).ok);assert.equal(s.coins,earned);
});
test('all four route stamps accumulate without duplicate rewards or cross-route extra turns',()=>{
 const s=fresh();raise(s);
 for(const route of Object.keys(G.ROUTES)){
  complete(s,route);const before=JSON.stringify(s);
  for(const other of Object.keys(G.ROUTES))assert(!G.beginAdventure(s,other).ok);
  assert.equal(JSON.stringify(s),before);G.advance(s);
 }
 assert.equal(G.visitedRoutes(G.active(s)).length,4);complete(s,'meadow');assert.equal(G.visitedRoutes(G.active(s)).length,4);assert(valid(s));
});
test('historic v0.8 adventures resume in the forest without a route property',()=>{
 const s=fresh();G.beginAdventure(s);G.chooseAdventure(s,1);delete s.adventure.route;
 assert(valid(s));assert.equal(G.adventureRoute(s),'forest');assert.equal(G.currentEncounter(s).title,'道に迷った旅人');
 G.chooseAdventure(s,1);G.chooseAdventure(s,1);G.finishAdventure(s);assert.deepEqual(G.visitedRoutes(G.active(s)),['forest']);assert(valid(s));
});
test('legacy completion counts imply forest visits without mutating a save during rendering',()=>{
 const s=fresh();G.active(s).memory.adventure=3;const before=JSON.stringify(s);
 const seen=G.visitedRoutes(G.active(s));assert.deepEqual(seen,['forest']);seen.push('meadow');assert.equal(JSON.stringify(s),before);
 complete(s,'brook');assert.deepEqual(G.visitedRoutes(G.active(s)),['forest','brook']);
});
test('retreat preserves currency but never stamps an incomplete route',()=>{
 const s=fresh();G.beginAdventure(s,'ridge');G.chooseAdventure(s,0);const reward=s.adventure.coins;
 assert(G.finishAdventure(s,true).ok);assert.equal(s.coins,30+reward);assert.deepEqual(G.visitedRoutes(G.active(s)),[]);assert(!G.beginAdventure(s,'meadow').ok);
});
test('route allowance and collected stamps belong to the traveler rather than selected resident',()=>{
 const s=fresh(),first=G.active(s);G.rescue(s,'cat','ルゥ');const second=G.active(s);s.active=first.id;
 G.beginAdventure(s,'meadow');s.active=second.id;for(let i=0;i<3;i++)G.chooseAdventure(s,1);G.finishAdventure(s);
 assert.deepEqual(G.visitedRoutes(first),['meadow']);assert.deepEqual(G.visitedRoutes(second),[]);assert(G.beginAdventure(s,'brook').ok);assert(valid(s));
});
test('invalid route IDs and malformed discovery collections are rejected',()=>{
 for(const bad of ['__proto__','constructor','toString','new-route',null,3,['forest']]){
  const s=fresh(),before=JSON.stringify(s);assert(!G.beginAdventure(s,bad).ok);assert.equal(JSON.stringify(s),before);
  G.beginAdventure(s);s.adventure.route=bad;assert(!G.validate(s));
 }
 for(const bad of [null,'forest',['forest','forest'],['constructor'],[12],['forest','meadow','brook','ridge','extra']]){const s=fresh();G.active(s).trails=bad;assert(!G.validate(s));}
 const s=fresh();assert.equal(G.previewChoice(s,0),null);G.beginAdventure(s);assert.equal(G.previewChoice(s,5),null);
});
test('six personalities respond differently without changing care or trait rewards',()=>{
 const replies=new Set(),gestures=new Set();
 for(const key of Object.keys(W.TEMPERAMENTS)){
  const s=fresh(),c=G.active(s);for(const k of Object.keys(G.LABELS))c.personality[k]=c.personalityBase[k]=k===key?70:40;
  assert.equal(W.key(c),key);const before=c.personality.courage;assert(G.talk(s,'よく頑張ったね').ok);
  assert(c.reply.includes('がんばろう'));replies.add(c.reply);gestures.add(W.personality(c).gesture);assert(Math.abs(c.personality.courage-before-.45)<1e-8);
  const traits=clone(c.personality);G.talk(s,'よく頑張ったね');assert.deepEqual(c.personality,traits);
  G.care(s,'feed');assert.equal(c.reply,W.response(c,'feed'));assert.equal(c.hunger,100);assert(valid(s));
 }
 assert.equal(replies.size,6);assert.equal(gestures.size,6);
});
test('hostility, unrecognized words and ill residents keep non-misleading responses',()=>{
 for(const species of Object.keys(G.SPECIES)){
  const s=G.fresh('demo','ココ',species),c=G.active(s);G.talk(s,'嫌い');assert.match(c.reply,/びっくり/);
  G.talk(s,'123456');assert.match(c.reply,/まだ難しい/);c.dead=true;const before=JSON.stringify(s);assert(!G.talk(s,'大好きだよ').ok);assert.equal(JSON.stringify(s),before);
 }
});
test('personality helpers and archived route views are immutable pure reads',()=>{
 const s=fresh(),before=JSON.stringify(s);for(const key of Object.keys(W.TEMPERAMENTS))assert(Object.isFrozen(W.TEMPERAMENTS[key]));
 W.key(G.active(s));W.personality(G.active(s));W.response(G.active(s),'__proto__');G.visitedRoutes(G.active(s));assert.equal(JSON.stringify(s),before);
});
