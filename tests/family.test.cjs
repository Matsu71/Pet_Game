'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const G=require('../game.js'),V=require('../village.js'),F=require('../family.js');
function adultPair(){
  const now=Date.UTC(2026,8,11,0,0,0),s=G.fresh('demo','ミオ','fox',now,()=>.5);
  G.rescue(s,'rabbit','ルゥ');
  for(const c of s.creatures){c.bornAt=now-10*G.DAY;c.lastAt=now;}
  const [a,b]=s.creatures.map(c=>c.id).sort();
  s.community={version:1,sites:[],visits:{},bonds:[{a,b,value:80,meetings:4,lastDay:G.dayKey(s),lastActivity:'walk'}]};
  return {s,a,b};
}
test('old v2 saves remain valid when family data is absent',()=>{const s=G.fresh();assert.equal(F.validate(s),true);assert.equal(s.family,undefined);});
test('partnership requires adulthood and a strong existing bond',()=>{
  const s=G.fresh('demo','ミオ','fox',Date.UTC(2026,8,11),()=>.5);G.rescue(s,'rabbit','ルゥ');
  const [a,b]=s.creatures.map(c=>c.id).sort();
  assert.equal(F.marry(s,a,b).ok,false);
  for(const c of s.creatures){c.bornAt=s.clockAt-9*G.DAY;c.lastAt=s.clockAt;}
  s.community={version:1,sites:[],visits:{},bonds:[{a,b,value:69,meetings:1,lastDay:G.dayKey(s),lastActivity:'listen'}]};
  assert.equal(F.marry(s,a,b).ok,false);s.community.bonds[0].value=70;
  assert.equal(F.marry(s,a,b).ok,true);assert.equal(F.partner(s,a).id,b);assert(F.validate(s));
});
test('a resident cannot hold two active partnerships',()=>{
  const {s,a,b}=adultPair();assert(F.marry(s,a,b).ok);G.rescue(s,'cat','トワ');const c=s.creatures.at(-1);c.bornAt=s.clockAt-10*G.DAY;c.lastAt=s.clockAt;
  const [x,y]=[a,c.id].sort();s.community.bonds.push({a:x,b:y,value:90,meetings:3,lastDay:G.dayKey(s),lastActivity:'make'});
  assert.equal(F.marry(s,a,c.id).ok,false);assert(F.validate(s));
});
test('birth creates a valid child, records parents and updates discovery',()=>{
  const {s,a,b}=adultPair();assert(F.marry(s,a,b).ok);const seq=[.9,.2,.7,.4,.6,.3,.8,.1,.55,.45,.65,.35,.75,.25,.85,.15];let i=0;
  const r=F.birth(s,a,b,'ココ',()=>seq[i++%seq.length]);assert(r.ok);assert.equal(G.alive(s).length,3);assert.equal(F.parents(s,r.child.id).length,2);assert(F.children(s,a).some(c=>c.id===r.child.id));assert(G.validate(s));assert(V.validate(s));assert(F.validate(s));
  assert.equal(r.child.level,1);assert(r.child.personality.kindness>=0&&r.child.personality.kindness<=100);
});
test('same pair cannot create two births on the same village day',()=>{const {s,a,b}=adultPair();F.marry(s,a,b);assert(F.birth(s,a,b,'ココ',()=>.5).ok);assert.equal(F.birth(s,a,b,'ソラ',()=>.5).ok,false);assert(F.validate(s));});
test('full village blocks birth without mutating the family record',()=>{
  const {s,a,b}=adultPair();F.marry(s,a,b);while(G.alive(s).length<G.MAX)G.rescue(s,'cat',`子${G.alive(s).length}`);
  const before=JSON.stringify(F.data(s));assert.equal(F.birth(s,a,b,'満員',()=>.5).ok,false);assert.equal(JSON.stringify(F.data(s)),before);assert(F.validate(s));
});
test('separation preserves history and permits a later partnership',()=>{
  const {s,a,b}=adultPair();F.marry(s,a,b);assert(F.separate(s,a,b).ok);assert.equal(F.partner(s,a),null);assert.equal(F.data(s).partnerships.length,1);assert.notEqual(F.data(s).partnerships[0].endedDay,null);assert(F.validate(s));
});
test('family validation rejects duplicate active partners and malformed parentage',()=>{
  const {s,a,b}=adultPair();F.marry(s,a,b);const d=F.ensure(s);d.partnerships.push({a,b,sinceDay:G.dayKey(s),endedDay:null});assert.equal(F.validate(s),false);
  d.partnerships.pop();const child=G.fresh('demo','子','fox',s.clockAt,()=>.5).creatures[0];s.creatures.push(child);d.births.push({child:child.id,parents:[a,a],bornDay:G.dayKey(s),mutation:false});assert.equal(F.validate(s),false);
});
