'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../game.js'),J=require('../journey.js');
const fresh=()=>G.fresh('demo','ミオ','fox',Date.UTC(2026,8,11,3),()=>.5);
function adult(s){for(let i=0;i<8;i++){G.care(s,'feed');G.care(s,'bath');G.advance(s);}}
test('dictionary prototype names cannot become jobs, purchases or species',()=>{const s=fresh();adult(s);for(const key of ['__proto__','constructor','toString']){const before=JSON.stringify(s);assert(!G.setJob(s,key).ok);assert(!G.buy(s,key).ok);assert(!G.rescue(s,key,'x').ok);assert.equal(JSON.stringify(s),before);assert.equal(G.active(G.fresh('demo','test',key)).species,'fox');}});
test('the historic resident limit is explicit rather than creating an unsaveable village',()=>{const s=fresh(),first=structuredClone(G.active(s));for(let i=1;i<200;i++){const c=structuredClone(first);c.id=`historic_${i}`;c.dead=true;c.health=0;s.creatures.push(c);}assert(G.validate(s));assert(!G.rescue(s,'cat','ソラ').ok);assert(G.validate(s));});
test('imported boundary currency stays valid after quests; fractional daily counters are rejected',()=>{const s=fresh();s.coins=1e9;G.care(s,'feed');assert.equal(s.coins,1e9);assert(G.validate(s));G.active(s).talkToday=2.5;assert(!G.validate(s));G.active(s).talkToday=0;G.active(s).species=['fox'];assert(!G.validate(s));});
test('trying to replay during an adventure preserves the completed memory game',()=>{const s=fresh();J.startMemory(s,()=>.5);const deck=s.journey.memory.deck;for(let n=0;n<3;n++)for(let i=0;i<6;i++)if(deck[i]===n)J.flip(s,i);G.beginAdventure(s);const before=JSON.stringify(s.journey.memory);assert(!J.replay(s).ok);assert.equal(JSON.stringify(s.journey.memory),before);});
