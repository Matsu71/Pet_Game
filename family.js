/* Family / generations foundation. Optional extension of v2 saves; old saves remain valid.
 * Pure state transitions. No network, timers or UI dependencies. */
(function(root){
  'use strict';
  const G=typeof module!=='undefined'&&module.exports?require('./game.js'):root.ForestGame;
  const V=typeof module!=='undefined'&&module.exports?require('./village.js'):root.ForestVillage;
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const pair=(a,b)=>[a,b].sort();
  const blank=()=>({version:1,partnerships:[],births:[]});
  const data=s=>s.family||blank();
  const ensure=s=>s.family||(s.family=blank());
  const living=s=>G.alive(s);
  function resident(s,id){return s.creatures.find(c=>c.id===id)||null;}
  function currentPartnership(s,id){return data(s).partnerships.find(p=>p.endedDay===null&&(p.a===id||p.b===id))||null;}
  function partner(s,id){const p=currentPartnership(s,id);return p?resident(s,p.a===id?p.b:p.a):null;}
  function parents(s,id){const b=data(s).births.find(x=>x.child===id);return b?b.parents.map(pid=>resident(s,pid)).filter(Boolean):[];}
  function children(s,id){return data(s).births.filter(x=>x.parents.includes(id)).map(x=>resident(s,x.child)).filter(Boolean);}
  function bond(s,a,b){return V.friendship(s,a,b).value;}
  function canPartner(s,a,b){
    const x=resident(s,a),y=resident(s,b);
    if(!x||!y||x.dead||y.dead||x.id===y.id)return {ok:false,reason:'元気に暮らす別の仲間を選ぼう。'};
    if(s.adventure)return {ok:false,reason:'探索から戻ってから、ふたりのことを考えよう。'};
    if(G.age(s,x)<8||G.age(s,y)<8)return {ok:false,reason:'ふたりとも8歳以上になると選べます。'};
    if(currentPartnership(s,x.id)||currentPartnership(s,y.id))return {ok:false,reason:'今の大切な関係を整理してから。'};
    if(bond(s,x.id,y.id)<70)return {ok:false,reason:'親密度70以上になると、家族になる話ができます。'};
    return {ok:true,reason:''};
  }
  function marry(s,a,b){
    const gate=canPartner(s,a,b);if(!gate.ok)return {ok:false,message:gate.reason};
    const [first,second]=pair(a,b),d=ensure(s),day=G.dayKey(s);
    d.partnerships.push({a:first,b:second,sinceDay:day,endedDay:null});
    const x=resident(s,a),y=resident(s,b);
    G.log(s,`${x.name}と${y.name}は、これからも同じ村で歩いていくことを決めました。`,'family');
    return {ok:true,message:`${x.name}と${y.name}が家族になりました。`,partnership:currentPartnership(s,a)};
  }
  function separate(s,a,b){
    const [first,second]=pair(a,b),p=data(s).partnerships.find(x=>x.endedDay===null&&x.a===first&&x.b===second);
    if(!p)return {ok:false,message:'そのふたりに、現在のパートナー記録はありません。'};
    p.endedDay=G.dayKey(s);
    const x=resident(s,a),y=resident(s,b);
    G.log(s,`${x?.name||'ふたり'}と${y?.name||''}は、それぞれの道を歩くことにしました。`,'family');
    return {ok:true,message:'家族の形を見直しました。これまでの記録は手帖に残ります。'};
  }
  function chooseSpecies(s,a,b,random){
    const keys=Object.keys(G.SPECIES),missing=keys.filter(k=>!s.discovered.includes(k));
    if(random()<.03){const pool=missing.length?missing:keys;return {species:pool[Math.min(pool.length-1,Math.floor(random()*pool.length))],mutation:true};}
    return {species:random()<.5?a.species:b.species,mutation:false};
  }
  function newChild(s,a,b,name,random=Math.random){
    const source=G.fresh(s.mode,name||'ココ',a.species,s.clockAt,random).creatures[0];
    const pick=chooseSpecies(s,a,b,random);source.species=pick.species;
    for(const key of Object.keys(G.ABILITIES)){
      const avg=(a[key]+b[key])/2,jitter=(random()-.5)*10;
      source[key]=G.clamp(avg*.55+45*.45+jitter);
    }
    for(const key of Object.keys(G.LABELS)){
      const avg=(a.personalityBase[key]+b.personalityBase[key])/2,jitter=(random()-.5)*12;
      source.personalityBase[key]=G.clamp(avg+jitter);
      source.personality[key]=source.personalityBase[key];
    }
    source.reply='ここが、ぼくたちの村なんだね。';
    return {child:source,mutation:pick.mutation};
  }
  function canBirth(s,a,b){
    const x=resident(s,a),y=resident(s,b),p=currentPartnership(s,a),day=G.dayKey(s);
    if(!x||!y||x.dead||y.dead||!p||partner(s,a)?.id!==b)return {ok:false,reason:'家族になったふたりを選びます。'};
    if(s.adventure)return {ok:false,reason:'探索から戻ってから、新しい家族を迎えよう。'};
    if(G.age(s,x)<8||G.age(s,y)<8)return {ok:false,reason:'ふたりとも大人になってから。'};
    if(living(s).length>=G.MAX)return {ok:false,reason:`村は${G.MAX}体までです。新しい家族を迎える場所を作ろう。`};
    if(p.lastBirthDay===day)return {ok:false,reason:'今日は新しい家族を迎えました。次の日にまた。'};
    return {ok:true,reason:''};
  }
  function birth(s,a,b,name='ココ',random=Math.random){
    const gate=canBirth(s,a,b);if(!gate.ok)return {ok:false,message:gate.reason};
    const x=resident(s,a),y=resident(s,b),made=newChild(s,x,y,name,random),child=made.child,d=ensure(s),day=G.dayKey(s);
    s.creatures.push(child);s.active=child.id;
    if(!s.discovered.includes(child.species))s.discovered.push(child.species);
    const p=currentPartnership(s,a);p.lastBirthDay=day;
    d.births.push({child:child.id,parents:pair(a,b),bornDay:day,mutation:made.mutation});
    G.log(s,`${x.name}と${y.name}の家族に、${child.name}が加わりました。${made.mutation?'森から思いがけない個性を受け継いだようです。':'ふたりの特徴を少しずつ受け継いでいます。'}`,'family');
    return {ok:true,message:`${child.name}を村に迎えました。`,child,mutation:made.mutation};
  }
  function familyLabel(s,id){
    const p=partner(s,id),ps=parents(s,id),cs=children(s,id);
    return {partner:p,parents:ps,children:cs,generation:ps.length?1+Math.max(0,...ps.map(x=>familyLabel(s,x.id).generation)):0};
  }
  function validate(s){
    if(s.family===undefined)return true;
    const d=s.family,obj=x=>x&&typeof x==='object'&&!Array.isArray(x),day=x=>typeof x==='string'&&/^\d{4,6}-\d{2}-\d{2}$/.test(x),ids=new Set(s.creatures.map(c=>c.id));
    if(!obj(d)||d.version!==1||!Array.isArray(d.partnerships)||d.partnerships.length>200||!Array.isArray(d.births)||d.births.length>200)return false;
    const active=new Set(),partnershipKeys=new Set();
    for(const p of d.partnerships){
      if(!obj(p)||typeof p.a!=='string'||typeof p.b!=='string'||p.a>=p.b||!ids.has(p.a)||!ids.has(p.b)||!day(p.sinceDay)||!(p.endedDay===null||day(p.endedDay))||!(p.lastBirthDay===undefined||day(p.lastBirthDay)))return false;
      const key=JSON.stringify([p.a,p.b,p.sinceDay]);if(partnershipKeys.has(key))return false;partnershipKeys.add(key);
      if(p.endedDay===null){if(active.has(p.a)||active.has(p.b))return false;active.add(p.a);active.add(p.b);}
    }
    const childIds=new Set();
    for(const b of d.births){
      if(!obj(b)||typeof b.child!=='string'||!ids.has(b.child)||childIds.has(b.child)||!Array.isArray(b.parents)||b.parents.length!==2||b.parents[0]>=b.parents[1]||!b.parents.every(id=>ids.has(id))||b.parents.includes(b.child)||!day(b.bornDay)||typeof b.mutation!=='boolean')return false;
      childIds.add(b.child);
    }
    return true;
  }
  const api=Object.freeze({data,ensure,partner,parents,children,bond,canPartner,marry,separate,canBirth,birth,familyLabel,validate});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;root.ForestFamily=api;
})(typeof globalThis!=='undefined'?globalThis:this);
