'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const G=require('../game.js'),J=require('../journey.js'),V=require('../village.js');
const now=Date.UTC(2026,8,11,8),fresh=()=>G.fresh('demo','ミオ','fox',now,()=>.5);
const valid=s=>G.validate(s)&&J.validate(s)&&V.validate(s);
function pair(){const s=fresh();G.rescue(s,'rabbit','ルゥ');return s;}
function adult(s){for(const c of s.creatures){c.bornAt=s.clockAt-8*G.DAY;c.lastWorkAge=-1;}return s;}
function day(s){for(const c of G.alive(s)){s.active=c.id;G.care(s,'feed');G.care(s,'bath');}G.advance(s);}
test('legacy v2 saves remain valid and read-only village views do not change them',()=>{
 const s=fresh(),before=JSON.stringify(s);assert(valid(s));V.data(s);V.status(s,'well');V.next(s);assert.equal(JSON.stringify(s),before);
});
test('construction is atomic, keeps existing pets and charges exactly once',()=>{
 const s=fresh();s.coins=100;const pets=JSON.stringify(s.creatures);assert(V.build(s,'well').ok);assert.equal(s.coins,40);assert(!V.build(s,'well').ok);assert.equal(s.coins,40);assert.equal(JSON.stringify(s.creatures),pets);assert(valid(s));
});
test('unaffordable, unknown, prototype and locked builds have no side effects',()=>{
 const s=fresh();for(const id of ['well','school','workshop','toString','__proto__','unknown']){const before=JSON.stringify(s);assert(!V.build(s,id).ok);assert.equal(JSON.stringify(s),before);}
});
test('adult, community and job milestones unlock buildings with explicit reasons',()=>{
 const s=adult(pair());s.coins=2000;assert(V.status(s,'school').unlocked);assert(!V.status(s,'market').unlocked);G.setJob(s,'merchant');assert(V.status(s,'market').unlocked);
 for(const id of ['well','orchard','workshop'])assert(V.build(s,id).ok);assert(!V.status(s,'lookout').unlocked);G.active(s).level=2;assert(V.status(s,'lookout').unlocked);assert(valid(s));
});
test('facilities benefit every living resident once per village day',()=>{
 const s=pair();s.coins=1000;V.build(s,'well');V.build(s,'orchard');const before=s.creatures.map(c=>c.hygiene);assert.equal(V.visitAll(s).count,2);
 s.creatures.forEach((c,i)=>assert.equal(c.hygiene,before[i]+15));const snapshot=JSON.stringify(s);assert(!V.visitAll(s).ok);assert(!V.visit(s,'well').ok);assert.equal(JSON.stringify(s),snapshot);assert(valid(s));
});
test('facility limits survive reload and allow a new day without a streak penalty',()=>{
 let s=pair();s.coins=100;V.build(s,'well');V.visit(s,'well');s=JSON.parse(JSON.stringify(s));assert(!V.visit(s,'well').ok);day(s);assert(V.visit(s,'well').ok);assert(valid(s));
});
test('market payout is once daily and never overflows the currency ceiling',()=>{
 const s=adult(pair());G.setJob(s,'merchant');s.coins=1000;V.build(s,'market');s.coins=1e9-5;assert(V.visit(s,'market').ok);assert.equal(s.coins,1e9);assert(!V.visit(s,'market').ok);assert(valid(s));
});
test('meeting is symmetric and cannot be duplicated by changing the selected pet',()=>{
 const s=pair(),[a,b]=s.creatures;s.active=a.id;assert(V.meet(s,b.id,'walk').ok);const value=V.friendship(s,a.id,b.id).value;s.active=b.id;assert(!V.meet(s,a.id,'listen').ok);assert.equal(V.friendship(s,b.id,a.id).value,value);assert.equal(s.community.bonds.length,1);assert(valid(s));
});
test('each meeting records a choice and small growth for both pets',()=>{
 const s=pair(),[a,b]=s.creatures;s.active=a.id;const before=[a.intelligence,b.intelligence];assert(V.meet(s,b.id,'listen').ok);assert.equal(a.intelligence,before[0]+.2);assert.equal(b.intelligence,before[1]+.2);assert.match(a.reply,/ルゥ/);assert.equal(s.community.bonds[0].lastActivity,'listen');assert(valid(s));
});
test('invalid partners or activities do not create a relationship or spend currency',()=>{
 const s=pair(),a=G.active(s);for(const other of [a.id,'missing']){const before=JSON.stringify(s);assert(!V.meet(s,other,'walk').ok);assert.equal(JSON.stringify(s),before);}
 const before=JSON.stringify(s);assert(!V.meet(s,s.creatures[0].id,'__proto__').ok);assert.equal(JSON.stringify(s),before);
});
test('adventures lock construction, facility visits and social encounters',()=>{
 const s=pair();s.coins=200;V.build(s,'well');G.beginAdventure(s);const before=JSON.stringify(s);assert(!V.build(s,'orchard').ok);assert(!V.visitAll(s).ok);assert(!V.meet(s,s.creatures[0].id,'walk').ok);assert.equal(JSON.stringify(s),before);
});
test('friendships and buildings survive JSON roundtrip and affinity stays bounded',()=>{
 let s=adult(pair()),[a,b]=s.creatures;s.active=a.id;s.coins=100;V.build(s,'well');
 for(let n=0;n<22;n++){V.meet(s,b.id,'walk');day(s);s.active=a.id;}assert.equal(V.friendship(s,a.id,b.id).value,100);s=JSON.parse(JSON.stringify(s));assert.equal(s.community.sites[0].id,'well');assert.equal(V.bondLabel(s.community.bonds[0].value),'大切な友だち');assert(valid(s));
});
test('malformed community saves are rejected before import',()=>{
 const s=pair();s.coins=100;V.build(s,'well');V.meet(s,s.creatures[0].id,'walk');
 for(const mutate of [x=>x.community.sites.push({...x.community.sites[0]}),x=>x.community.sites[0].id='__proto__',x=>x.community.sites[0].at=Infinity,x=>x.community.visits.market='2026-09-11',x=>x.community.bonds[0].value=101,x=>x.community.bonds[0].a=x.community.bonds[0].b,x=>x.community.bonds.push({...x.community.bonds[0]}),x=>x.community.bonds[0].meetings=-1,x=>x.community.bonds[0].lastActivity='unknown']){const bad=structuredClone(s);mutate(bad);assert(!V.validate(bad));}
});
test('mixed multi-resident play preserves save invariants across 1200 deterministic actions',()=>{
 for(let seed=1;seed<=4;seed++){
  let n=seed;const random=()=>((n=(n*1664525+1013904223)>>>0)/4294967296);
  const s=pair();s.coins=1000;
  for(let step=0;step<300;step++){
   const live=G.alive(s);if(live.length)s.active=live[Math.floor(random()*live.length)].id;
   const action=Math.floor(random()*10),ids=Object.keys(V.SITES);
   if(action===0)G.care(s,'feed');if(action===1)G.care(s,'bath');if(action===2)G.talk(s,'今日もよく頑張ったね');
   if(action===3)V.build(s,ids[Math.floor(random()*ids.length)]);if(action===4)V.visitAll(s);
   if(action===5&&live.length>1)V.meet(s,live.find(c=>c.id!==s.active).id,'walk');
   if(action===6)G.advance(s);if(action===7)G.setJob(s,'merchant');
   if(action===8&&G.alive(s).length<8)G.rescue(s,'cat','ココ');if(action===9)J.collect(s);
   assert(valid(s),`invalid save seed=${seed} step=${step} action=${action}`);
  }
 }
});
