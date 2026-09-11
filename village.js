/* Persistent village goals and resident friendships. Pure transitions, no timers/network/UI.
 * Optional extension of v2 saves; previously earned gardens and pets are never replaced. */
(function(root){
  'use strict';
  const G=typeof module!=='undefined'&&module.exports?require('./game.js'):root.ForestGame;
  const SITES=Object.freeze({
    well:Object.freeze({name:'こもれびの井戸',price:60,icon:'water',description:'冷たい水をくんで、みんなで身じたく。',benefit:'みんなのきれい +15',stat:'hygiene',amount:15}),
    orchard:Object.freeze({name:'木の実の果樹園',price:100,icon:'sprout',description:'小さな苗が、村のおやつを実らせます。',benefit:'みんなのおなか +15',stat:'hunger',amount:15}),
    workshop:Object.freeze({name:'森の工房',price:160,icon:'briefcase',description:'木を削ったり、道具を直したり。手を動かす場所。',benefit:'みんなの力 +0.3',stat:'strength',amount:.3}),
    school:Object.freeze({name:'木かげの学び舎',price:180,icon:'book',description:'大人も子どもも、知らないことを持ち寄ろう。',benefit:'みんなの賢さ +0.3',stat:'intelligence',amount:.3}),
    market:Object.freeze({name:'小さな朝市',price:240,icon:'gift',description:'村の仕事が、近くの町とつながる小さなお店。',benefit:'村のおこづかい +20 G',coins:20}),
    lookout:Object.freeze({name:'星見の丘',price:300,icon:'sun',description:'森の向こうを見渡して、みんなで深呼吸。',benefit:'みんなの生命力 +0.3',stat:'vitality',amount:.3})
  });
  const ACTIVITIES=Object.freeze({
    walk:Object.freeze({name:'いっしょに散歩',ability:'vitality',trait:'courage',text:'歩幅を合わせると、いつもの道にも発見がありました。'}),
    make:Object.freeze({name:'小さなものづくり',ability:'strength',trait:'curiosity',text:'得意なところを持ち寄って、ふたりだけの作品ができました。'}),
    listen:Object.freeze({name:'お話を聞きあう',ability:'intelligence',trait:'kindness',text:'急がず聞いてみたら、少しだけ相手の気持ちがわかりました。'})
  });
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const blank=()=>({version:1,sites:[],visits:{},bonds:[]});
  const data=s=>s.community||blank();
  const ensure=s=>s.community||(s.community=blank());
  const living=s=>G.alive(s);
  function conditions(s,id){
    const residents=living(s),d=data(s),items=[];
    if(['workshop','school','market'].includes(id))items.push({label:'8歳以上の大人がいる',met:residents.some(c=>G.age(s,c)>=8)});
    if(id==='school')items.push({label:'仲間が2体以上いる',met:residents.length>=2});
    if(id==='market')items.push({label:'仕事についている大人がいる',met:residents.some(c=>G.age(s,c)>=8&&c.job!=='none')});
    if(id==='lookout'){
      items.push({label:'村の施設を3つ建てた',met:d.sites.length>=3});
      items.push({label:'Lv.2以上の仲間がいる',met:residents.some(c=>c.level>=2)});
    }
    return items;
  }
  function status(s,id){
    if(!own(SITES,id))return null;
    const d=data(s),site=SITES[id],built=d.sites.some(x=>x.id===id),needs=conditions(s,id);
    const available=living(s).length>0&&!s.adventure;
    return {id,...site,built,needs,unlocked:needs.every(x=>x.met),affordable:s.coins>=site.price,
      canBuild:available&&!built&&s.coins>=site.price&&needs.every(x=>x.met),
      canVisit:available&&built&&d.visits[id]!==G.dayKey(s),visited:d.visits[id]===G.dayKey(s)};
  }
  function build(s,id){
    const item=status(s,id);
    if(!item)return {ok:false,message:'その施設は見つかりません。'};
    if(!item.canBuild)return {ok:false,message:item.built?'もう建っています。':s.adventure?'探索から戻ってから、村づくりを。':!item.unlocked?'建てる条件を、ひとつずつかなえていこう。':s.coins<item.price?'金貨が足りません。お世話や探索、仕事で集められます。':'まず新しい仲間を迎えよう。'};
    s.coins-=item.price;ensure(s).sites.push({id,at:s.clockAt});
    G.log(s,`村に「${item.name}」ができました。仲間と使える場所がひとつ増えました。`,'village');
    return {ok:true,message:`「${item.name}」が完成しました！ 今日から使えます。`};
  }
  function visit(s,id,{quiet=false}={}){
    const item=status(s,id);
    if(!item?.canVisit)return {ok:false,message:item?.visited?'今日はみんなで過ごしました。また次の日に。':'建てた施設は、探索から戻ると使えます。'};
    const d=ensure(s);d.visits[id]=G.dayKey(s);
    for(const c of living(s))if(item.stat)c[item.stat]=G.clamp(c[item.stat]+item.amount);
    if(item.coins)s.coins=Math.min(1e9,s.coins+item.coins);
    if(!quiet)G.log(s,`「${item.name}」で村の時間。${item.benefit}。`,'village');
    return {ok:true,message:`${item.name}：${item.benefit}。`,id};
  }
  function visitAll(s){
    const ready=Object.keys(SITES).filter(id=>status(s,id).canVisit);
    if(!ready.length)return {ok:false,message:'今日使える施設はありません。また次の日に。'};
    for(const id of ready)visit(s,id,{quiet:true});
    const benefits=ready.map(id=>SITES[id].benefit).join(' / ');
    G.log(s,`みんなで村の時間（${ready.length}か所）。${benefits}。`,'village');
    return {ok:true,message:`${ready.length}か所で村の時間。${benefits}。`,count:ready.length};
  }
  function pair(a,b){return [a,b].sort();}
  function friendship(s,a,b){
    const [first,second]=pair(a,b);
    const r=data(s).bonds.find(x=>x.a===first&&x.b===second);
    return r||{a:first,b:second,value:0,meetings:0,lastDay:null,lastActivity:null};
  }
  const bondLabel=value=>value>=70?'大切な友だち':value>=40?'仲のよい友だち':value>0?'顔なじみ':'これからのふたり';
  function meet(s,other,activity){
    const a=G.active(s),b=s.creatures.find(c=>c.id===other);
    if(!a||a.dead||!b||b.dead||a.id===b.id||s.adventure||!own(ACTIVITIES,activity))return {ok:false,message:'元気に暮らす仲間と、探索から戻ってから会おう。'};
    const r=friendship(s,a.id,b.id),day=G.dayKey(s);
    if(r.lastDay===day)return {ok:false,message:'今日はふたりで過ごしました。つづきはまた次の日に。'};
    const d=ensure(s);
    if(!d.bonds.includes(r)){
      // Bound historical pairs while preserving all relationships between living residents.
      if(d.bonds.length>=128){const aliveIds=new Set(living(s).map(c=>c.id));const old=d.bonds.findIndex(x=>!aliveIds.has(x.a)||!aliveIds.has(x.b));if(old>=0)d.bonds.splice(old,1);else return {ok:false,message:'関係の記録を整理してから、もう一度。'};}
      d.bonds.push(r);
    }
    const delta=4+Math.round((a.personality.sociability+b.personality.sociability)/100)+(a.job!=='none'&&a.job===b.job?1:0);
    const before=r.value;r.value=Math.min(100,r.value+delta);r.meetings=Math.min(1000000,r.meetings+1);r.lastDay=day;r.lastActivity=activity;
    const choice=ACTIVITIES[activity];
    for(const c of [a,b]){c[choice.ability]=G.clamp(c[choice.ability]+.2);G.trait(c,choice.trait,.05);c.reply=`${c.id===a.id?b.name:a.name}と、${choice.name}。また一緒に過ごしたいな。`;}
    G.log(s,`${a.name}と${b.name}は${choice.name}。${choice.text} 親密度 ${before} → ${r.value}。`,'friendship');
    return {ok:true,message:`${choice.text} 親密度 +${r.value-before}・ふたりの${G.ABILITIES[choice.ability]} +0.2。`,before,after:r.value};
  }
  function next(s){
    const candidates=Object.keys(SITES).map(id=>status(s,id)).filter(x=>!x.built);
    return candidates.find(x=>x.canBuild)||candidates.find(x=>x.unlocked)||candidates[0]||null;
  }
  function validate(s){
    if(s.community===undefined)return true;
    const d=s.community,obj=x=>x&&typeof x==='object'&&!Array.isArray(x),int=(x,max)=>Number.isInteger(x)&&x>=0&&x<=max;
    const day=x=>typeof x==='string'&&/^\d{4,6}-\d{2}-\d{2}$/.test(x),ids=new Set(s.creatures.map(c=>c.id));
    if(!obj(d)||d.version!==1||!Array.isArray(d.sites)||d.sites.length>6||!obj(d.visits)||!Array.isArray(d.bonds)||d.bonds.length>128)return false;
    if(new Set(d.sites.map(x=>x?.id)).size!==d.sites.length||d.sites.some(x=>!obj(x)||!own(SITES,x.id)||!Number.isFinite(x.at)||x.at<0||x.at>s.clockAt))return false;
    if(Object.entries(d.visits).some(([id,date])=>!d.sites.some(x=>x.id===id)||!day(date)))return false;
    const keys=new Set();
    for(const r of d.bonds){
      if(!obj(r)||typeof r.a!=='string'||typeof r.b!=='string'||r.a>=r.b||!ids.has(r.a)||!ids.has(r.b)||!int(r.value,100)||!int(r.meetings,1000000)||r.meetings<1||!day(r.lastDay)||!own(ACTIVITIES,r.lastActivity))return false;
      const key=JSON.stringify([r.a,r.b]);if(keys.has(key))return false;keys.add(key);
    }
    return true;
  }
  const api=Object.freeze({SITES,ACTIVITIES,data,status,build,visit,visitAll,friendship,bondLabel,meet,next,validate});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;root.ForestVillage=api;
})(typeof globalThis!=='undefined'?globalThis:this);
