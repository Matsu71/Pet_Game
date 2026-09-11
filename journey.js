/* Optional v2-save extension: gentle goals, non-consumable gardens and a resumable game.
   Pure state transitions; shared by the browser and Node tests. No clock/network/UI. */
(function (root) {
  'use strict';
  const G = typeof module !== 'undefined' && module.exports ? require('./game.js') : root.ForestGame;
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const WISHES = Object.freeze({care: 'ふれあう', talk: 'ことばを届ける', play: '一緒に遊ぶ'});
  const GARDENS = Object.freeze({
    meadow: {name: '花のこもれび', price: 35, description: '足もとに、小さな花畑。', icon: 'sprout'},
    picnic: {name: '木の実のピクニック', price: 70, description: 'お気に入りの敷物とバスケット。', icon: 'bowl'},
    lantern: {name: 'ほたるの灯り', price: 110, description: '木の枝に、やさしいランタン。', icon: 'sun'}
  });
  const SYMBOLS = ['葉っぱ', 'どんぐり', 'お花'];
  const STORIES = Object.freeze([
    {id:'rain',title:'雨あがりの小道',text:'水たまりに、小さな空が映っています。あの向こうには何があるのかな？',choices:[
      {label:'一緒に飛び越える',ability:'strength',trait:'courage',reply:'せーの、ぴょん！ 少しぬれた足も、今日の思い出。'},
      {label:'映った雲を観察する',ability:'intelligence',trait:'curiosity',reply:'水の中にも雲があるね。ふたりで、しばらく眺めました。'}]},
    {id:'seed',title:'名も知らない種',text:'散歩の途中、小さな種を拾いました。どんな花が咲くんだろう。',choices:[
      {label:'庭に植えてみる',ability:'vitality',trait:'discipline',reply:'土をかけて、水を少し。明日も見に来よう、と約束しました。'},
      {label:'図鑑で調べる',ability:'intelligence',trait:'curiosity',reply:'似ている種を見つけたよ。気になることが、またひとつ増えました。'}]},
    {id:'visitor',title:'おとなりからのおすそ分け',text:'村の人が、焼きたてのパンを持ってきてくれました。いい匂い！',choices:[
      {label:'お礼の言葉を考える',ability:'intelligence',trait:'sociability',reply:'「またお話ししたいな」。その言葉で、相手もにっこり。'},
      {label:'一緒にお皿を運ぶ',ability:'strength',trait:'kindness',reply:'みんなの席までそっと運びました。分けると、もっとおいしいね。'}]},
    {id:'wind',title:'風に飛ばされた帽子',text:'木の枝に、だれかの帽子が引っかかっています。手が届きそうで、届きません。',choices:[
      {label:'長い枝を探す',ability:'intelligence',trait:'discipline',reply:'急がず、工夫して。帽子は無事に持ち主のもとへ戻りました。'},
      {label:'村の人に手伝ってもらう',ability:'vitality',trait:'sociability',reply:'ひとりで難しいときは、声をかけていいんだね。'}]},
    {id:'night',title:'夜のこもれび',text:'家の窓から、森の暗がりを見つめています。「あの光、何だろう？」',choices:[
      {label:'窓辺で一緒に眺める',ability:'vitality',trait:'emotionalStability',reply:'ほたるがひとつ、またひとつ。静かな時間を分け合いました。'},
      {label:'光の数を数える',ability:'intelligence',trait:'curiosity',reply:'数えている間に、あっちにも光が。知らないことがいっぱいだね。'}]},
    {id:'soup',title:'はじめての台所',text:'今日は木の実のスープ作り。小さな手で、できるお手伝いはあるかな？',choices:[
      {label:'木の実を数えて分ける',ability:'intelligence',trait:'discipline',reply:'ひとつずつ丁寧に。最後まで、自分の役目をやりきりました。'},
      {label:'お皿をそろえる',ability:'strength',trait:'kindness',reply:'みんなが使うお皿を並べて、ちょっぴり誇らしい気持ち。'}]},
    {id:'sound',title:'森の向こうの音',text:'こん、こん。遠くから不思議な音。こわいような、気になるような。',choices:[
      {label:'安全な道から見にいく',ability:'strength',trait:'courage',reply:'木工屋さんの作業の音でした。知らない音の正体がわかったね。'},
      {label:'近くの人に聞いてみる',ability:'intelligence',trait:'sociability',reply:'聞いてみたら、森の仕事の話も教えてもらえました。'}]},
    {id:'rest',title:'今日は、ひとやすみ',text:'いつもより静かな顔。「今日はのんびりしてもいい？」',choices:[
      {label:'そばで本を読む',ability:'intelligence',trait:'kindness',reply:'同じページを眺めるだけで、なんだか安心する時間でした。'},
      {label:'木陰で深呼吸する',ability:'vitality',trait:'emotionalStability',reply:'急がない日もあっていいね。風が、やさしく通り抜けました。'}]}
  ]);
  const ALBUM = Object.freeze([
    {id:'first-words',name:'ことばの贈りもの',hint:'はじめて声をかける',icon:'chat'},
    {id:'together',name:'小さな一日',hint:'今日の小さな時間のお祝いを受け取る',icon:'heart'},
    {id:'first-game',name:'見つけた、同じかたち',hint:'木の実あわせを完成させる',icon:'leaf'},
    {id:'five-games',name:'遊びの約束',hint:'同じ子と5日分の木の実あわせを完成',icon:'sprout'},
    {id:'story',name:'ふたりの寄り道',hint:'今日のできごとを体験する',icon:'sun'},
    {id:'explorer',name:'森の道しるべ',hint:'同じ子と3回の探索を最後まで終える',icon:'compass'},
    {id:'adult',name:'大きくなったね',hint:'8歳まで育てる',icon:'sprout'},
    {id:'worker',name:'村を支える手',hint:'同じ子が3日働く',icon:'briefcase'},
    {id:'family',name:'にぎやかな森',hint:'4種類の子と出会う',icon:'home'},
    {id:'garden',name:'あなたらしい庭',hint:'3種類の庭の飾りを迎える',icon:'gift'},
    {id:'bond',name:'心の距離',hint:'同じ子とのふれあいを50にする',icon:'heart'},
    {id:'twenty',name:'積み重ねた季節',hint:'同じ子が20歳を迎える',icon:'book'}
  ]);
  function ensure(s) {
    if (!s.journey) s.journey = {version: 1, owned: [], equipped: 'none', residents: {}, memory: null};
    return s.journey;
  }
  function record(s, id = s.active) {
    const j = ensure(s), day = G.dayKey(s);
    if (!own(j.residents, id)) Object.defineProperty(j.residents, id, {value: {bond: 0, days: 0, day, wishes: [], claimed: false, memoryRewardDay: null}, writable: true, enumerable: true, configurable: true});
    const r = j.residents[id];
    r.gamesWon ??= 0; r.storyDay ??= null;
    if (r.day !== day) { r.day = day; r.wishes = []; r.claimed = false; }
    return r;
  }
  function available(s, id = s.active) {
    const c = s.creatures.find(c => c.id === id);
    return c && !c.dead && !s.adventure;
  }
  function mark(s, wish, id = s.active) {
    if (!own(WISHES, wish) || !available(s, id)) return false;
    const r = record(s, id);
    if (r.wishes.includes(wish)) return false;
    r.wishes.push(wish); r.bond = Math.min(100, r.bond + 3);
    return true;
  }
  function claim(s) {
    if (!available(s)) return {ok: false, message: 'おうちに戻ってから、受け取ろう。'};
    const r = record(s);
    if (r.claimed || r.wishes.length !== 3) return {ok: false, message: '今日の小さな時間を、一緒に過ごそう。'};
    r.claimed = true; r.days = Math.min(1000000, r.days + 1); s.coins = Math.min(1e9, s.coins + 15);
    G.log(s, `${G.active(s).name}と3つの時間を過ごしました。思い出のお祝い 15 G。`, 'milestone');
    return {ok: true, message: '今日もありがとう。思い出のお祝い +15 G！'};
  }
  function decorate(s, key) {
    if (!available(s) || (key !== 'none' && !own(GARDENS, key))) return {ok: false, message: 'おうちに戻ってから、飾ろう。'};
    const j = ensure(s);
    if (key !== 'none' && !j.owned.includes(key)) {
      const item = GARDENS[key];
      if (s.coins < item.price) return {ok: false, message: '金貨が足りません。'};
      s.coins -= item.price; j.owned.push(key);
      G.log(s, `庭に「${item.name}」を迎えました。`, 'life');
    }
    j.equipped = key;
    return {ok: true, message: key === 'none' ? 'いつもの庭に戻しました。飾りは大切に保管しています。' : `「${GARDENS[key].name}」を飾りました。何度でも着せ替えられます。`};
  }
  function startMemory(s, random = Math.random) {
    if (!available(s)) return {ok: false, message: 'おうちで遊べるときに、また来よう。'};
    const j = ensure(s);
    if (j.memory) {
      if (s.creatures.some(c => c.id === j.memory.petId && !c.dead)) return {ok: true, resumed: true};
      j.memory = null;
    }
    const deck = [0, 0, 1, 1, 2, 2];
    for (let i = deck.length - 1; i > 0; i--) {
      const value = random();
      const n = Math.floor(Math.min(.999999999, Math.max(0, Number.isFinite(value) ? value : 0)) * (i + 1));
      [deck[i], deck[n]] = [deck[n], deck[i]];
    }
    j.memory = {petId: s.active, deck, matched: [], open: [], moves: 0, complete: false, rewarded: false};
    return {ok: true};
  }
  function flip(s, index) {
    const m = ensure(s).memory;
    if (!m || !available(s, m.petId) || m.complete || !Number.isInteger(index) || index < 0 || index > 5 || m.open.length >= 2 || m.open.includes(index) || m.matched.includes(index)) return {ok: false};
    m.open.push(index);
    if (m.open.length < 2) return {ok: true};
    m.moves = Math.min(1000000, m.moves + 1);
    if (m.deck[m.open[0]] !== m.deck[m.open[1]]) return {ok: true, mismatch: true};
    m.matched.push(...m.open); m.open = [];
    if (m.matched.length === 6) {
      m.complete = true;
      const r = record(s, m.petId), c = s.creatures.find(c => c.id === m.petId);
      if (r.memoryRewardDay !== G.dayKey(s)) {
        r.memoryRewardDay = G.dayKey(s); r.gamesWon = Math.min(1000000, r.gamesWon + 1); m.rewarded = true;
        s.coins = Math.min(1e9, s.coins + 12); c.intelligence = Math.min(100, c.intelligence + .5);
        G.log(s, `${c.name}と木の実あわせ。+12 G、賢さ +0.5。`, 'milestone');
      }
      mark(s, 'play', m.petId);
      return {ok: true, complete: true, message: m.rewarded ? 'ぜんぶ見つけたね！ +12 G・賢さ +0.5' : 'ぜんぶそろったね！何度でも一緒に遊べます。'};
    }
    return {ok: true, matched: true};
  }
  function hideCards(s) {
    const m = ensure(s).memory;
    if (!m || m.open.length !== 2 || m.deck[m.open[0]] === m.deck[m.open[1]]) return {ok: false};
    m.open = []; return {ok: true};
  }
  function replay(s, random) {
    if (!available(s)) return {ok: false, message: 'おうちに戻ってから遊ぼう。'};
    const m = ensure(s).memory;
    if (m && !m.complete) return {ok: false};
    ensure(s).memory = null; return startMemory(s, random);
  }
  function story(s) {
    const c = G.active(s), key = G.dayKey(s) + c.id;
    let hash = 0;
    for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return STORIES[hash % STORIES.length];
  }
  function chooseStory(s, id, index) {
    if (!available(s)) return {ok: false, message: 'おうちに戻ってから、一緒に過ごそう。'};
    const r = record(s), event = story(s);
    if (r.storyDay === G.dayKey(s) || id !== event.id || !Number.isInteger(index) || index < 0 || index > 1) return {ok: false, message: '今日のできごとは思い出に残りました。また次の日に。'};
    const choice = event.choices[index], c = G.active(s);
    r.storyDay = G.dayKey(s);
    c[choice.ability] = G.clamp(c[choice.ability] + .6);
    G.trait(c, choice.trait, .12);
    c.reply = choice.reply;
    s.coins = Math.min(1e9, s.coins + 6);
    mark(s, 'play');
    G.log(s, `${c.name}と「${event.title}」。${choice.reply}`, 'story');
    return {ok: true, message: `${choice.reply} ${G.ABILITIES[choice.ability]} +0.6 / 6 G`};
  }
  function collect(s) {
    const j = ensure(s); j.album ??= [];
    const records = Object.values(j.residents);
    const has = id => j.album.some(x => x.id === id);
    const residents = s.creatures;
    const checks = {
      'first-words': () => residents.find(c => c.memory.talk > 0),
      together: () => records.some(r => r.days > 0),
      'first-game': () => records.some(r => r.gamesWon > 0 || r.memoryRewardDay !== null),
      'five-games': () => records.some(r => r.gamesWon >= 5),
      story: () => records.some(r => r.storyDay != null),
      explorer: () => residents.find(c => c.memory.adventure >= 3),
      adult: () => residents.find(c => G.age(s, c) >= 8),
      worker: () => residents.find(c => c.memory.work >= 3),
      family: () => s.discovered.length >= 4,
      garden: () => j.owned.length === Object.keys(GARDENS).length,
      bond: () => records.some(r => r.bond >= 50),
      twenty: () => residents.find(c => G.age(s, c) >= 20)
    };
    const earned = [];
    for (const card of ALBUM) {
      if (has(card.id) || !checks[card.id]()) continue;
      j.album.push({id: card.id, at: s.clockAt}); earned.push(card);
      G.log(s, `思い出アルバムに「${card.name}」が加わりました。`, 'album');
    }
    return earned;
  }
  function validate(s) {
    if (s.journey === undefined) return true; // Original v2 saves remain valid and unchanged until next save.
    const j = s.journey, obj = o => o && typeof o === 'object' && !Array.isArray(o);
    const int = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
    const day = d => typeof d === 'string' && /^\d{4,6}-\d{2}-\d{2}$/.test(d);
    if (!obj(j) || j.version !== 1 || !Array.isArray(j.owned) || new Set(j.owned).size !== j.owned.length || j.owned.some(k => !own(GARDENS, k)) || !(j.equipped === 'none' || j.owned.includes(j.equipped)) || !obj(j.residents) || Object.keys(j.residents).length > 200) return false;
    for (const [id, r] of Object.entries(j.residents)) {
      if (!s.creatures.some(c => c.id === id) || !obj(r) || (r.gamesWon !== undefined && !int(r.gamesWon, 1000000)) || (r.storyDay !== undefined && r.storyDay !== null && !day(r.storyDay)) || !int(r.bond, 100) || !int(r.days, 1000000) || !day(r.day) || !Array.isArray(r.wishes) || r.wishes.length > 3 || new Set(r.wishes).size !== r.wishes.length || r.wishes.some(k => !own(WISHES, k)) || typeof r.claimed !== 'boolean' || (r.claimed && r.wishes.length !== 3) || !(r.memoryRewardDay === null || day(r.memoryRewardDay))) return false;
    }
    if (j.album !== undefined && (!Array.isArray(j.album) || j.album.length > ALBUM.length || new Set(j.album.map(a => a?.id)).size !== j.album.length || j.album.some(a => !obj(a) || !ALBUM.some(c => c.id === a.id) || !Number.isFinite(a.at) || a.at < 0 || a.at > s.clockAt))) return false;
    if (j.memory === null) return true;
    const m = j.memory;
    if (!obj(m) || !s.creatures.some(c => c.id === m.petId) || !Array.isArray(m.deck) || m.deck.length !== 6 || [0, 1, 2].some(n => m.deck.filter(v => v === n).length !== 2) || !Array.isArray(m.matched) || m.matched.length % 2 || !Array.isArray(m.open) || m.open.length > 2 || !int(m.moves, 1000000) || typeof m.complete !== 'boolean' || typeof m.rewarded !== 'boolean') return false;
    const used = [...m.matched, ...m.open];
    if (used.some(v => !int(v, 5)) || new Set(used).size !== used.length || m.complete !== (m.matched.length === 6) || (m.rewarded && !m.complete)) return false;
    for (let i = 0; i < m.matched.length; i += 2) if (m.deck[m.matched[i]] !== m.deck[m.matched[i + 1]]) return false;
    return true;
  }
  const api = Object.freeze({WISHES, GARDENS, SYMBOLS, STORIES, ALBUM, story, chooseStory, collect, ensure, record, mark, claim, decorate, startMemory, flip, hideCards, replay, validate});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ForestJourney = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
