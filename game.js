/* Shared, dependency-free simulation. Also loaded by the Node test runner. */
(function (root) {
  'use strict';
  const W = typeof module !== 'undefined' && module.exports ? require('./world.js') : root.ForestWorld;
  const DAY = 86400000, HOUR = 3600000, MAX = 8;
  const LABELS = { kindness: 'やさしさ', courage: '勇気', curiosity: '好奇心', discipline: '規律性', sociability: '社交性', emotionalStability: '情緒安定性' };
  const ABILITIES = { intelligence: '賢さ', vitality: '生命力', strength: '力' };
  const SPECIES = {
    fox: { name: 'キツネ', color: '#d99b61', pale: '#ffedcd', trait: 'curiosity', about: '知らないものに、わくわく。' },
    rabbit: { name: 'ウサギ', color: '#dcc7b7', pale: '#fff0df', trait: 'kindness', about: 'だれかのそばにいるのが好き。' },
    bear: { name: 'クマ', color: '#a28364', pale: '#eddbc2', trait: 'emotionalStability', about: 'のんびり、マイペース。' },
    cat: { name: 'ネコ', color: '#a8b4a0', pale: '#edf0d9', trait: 'courage', about: '小さなからだに、冒険心。' }
  };
  const JOBS = {
    none: { name: 'まだ決めていない', place: '', coins: 0, xp: 0, growth: [0, 0, 0], traits: {} },
    farming: { name: '農業', place: '森の村', coins: 30, xp: 8, growth: [.2, .35, .45], traits: { discipline: .08 } },
    forestry: { name: '林業', place: '森の村', coins: 35, xp: 12, growth: [.1, .45, .75], traits: { courage: .08 } },
    construction: { name: '建築', place: '森の村', coins: 45, xp: 10, growth: [.5, .3, .65], traits: { discipline: .1 } },
    woodworking: { name: '木工職人', place: '森の村', coins: 40, xp: 5, growth: [.8, .12, .3], traits: { discipline: .1, curiosity: .05 } },
    herbalist: { name: '薬草師', place: '森の村', coins: 35, xp: 2, growth: [1, .18, .08], traits: { curiosity: .12, kindness: .05 } },
    guide: { name: '森の案内人', place: '森の村', coins: 35, xp: 7, growth: [.3, .3, .35], traits: { sociability: .1, curiosity: .12, courage: .08 } },
    shop: { name: '店員', place: '近くの町', coins: 40, xp: 1, growth: [.4, .08, .05], traits: { sociability: .16 } },
    clerk: { name: '町役場の記録係', place: '近くの町', coins: 45, xp: 0, growth: [.9, .04, 0], traits: { discipline: .12 } },
    bookkeeper: { name: '商会の帳簿係', place: '近くの町', coins: 50, xp: 0, growth: [1, .04, 0], traits: { discipline: .1 } },
    merchant: { name: '商人', place: '近くの町', coins: 55, xp: 1, growth: [.6, .08, .05], traits: { sociability: .16, curiosity: .05 } },
    inn: { name: '宿屋の仕事', place: '近くの町', coins: 40, xp: 2, growth: [.3, .12, .12], traits: { sociability: .16, kindness: .1 } },
    teacher: { name: '学び舎の先生', place: '近くの町', coins: 45, xp: 0, growth: [1, .04, 0], traits: { kindness: .1, sociability: .08 } }
  };
  const ITEMS = {
    soup: { name: '木の実のスープ', price: 25, icon: 'bowl', description: 'おなか +60、元気 +15。その場でいただきます。' },
    medicine: { name: '森のくすり', price: 40, icon: 'leaf', description: '病気を治し、元気 +45。食事とお風呂も忘れずに。' },
    scarf: { name: '赤いスカーフ', price: 80, icon: 'gift', description: 'この子だけの、お気に入り。ずっと身につけられます。' }
  };
  const QUESTS = [
    { id: 'feed', name: 'はじめてのごはん', detail: 'ごはんをあげて、おなかを満たそう。', reward: 10 },
    { id: 'bath', name: 'ぴかぴかになろう', detail: 'お風呂できれいにしてあげよう。', reward: 10 },
    { id: 'talk', name: 'あなたの声を届けよう', detail: '好きな言葉で、声をかけよう。', reward: 15 },
    { id: 'adventure', name: '小さな大冒険', detail: '森の探索を最後まで終えよう。', reward: 25 },
    { id: 'adult', name: '大きくなったね', detail: '毎日お世話をして、8歳まで育てよう。', reward: 40 },
    { id: 'work', name: 'はじめてのおしごと', detail: '大人になったら、仕事を選ぼう。', reward: 40 }
  ];
  const ENCOUNTERS = [
    { title: '小川の向こうに', text: 'さらさら流れる小川。向こう岸に、光る木の実を見つけました。', icon: 'water', choices: [
      { label: '飛び石を渡ってみる', hint: '力があると、上手に渡れる', ability: 'strength', threshold: 40, coins: 28, xp: 17, trait: 'courage', success: 'ぴょん、とひと跳び。木の実をたくさん集めました。', fail: '少し足がぬれたけれど、最後まで渡れました。' },
      { label: '橋を探して歩く', hint: '安全に進む。賢さが育つ', ability: 'intelligence', threshold: 0, coins: 17, xp: 12, trait: 'discipline', success: '苔むした橋を発見。いい道を覚えました。' }
    ] },
    { title: '道に迷った旅人', text: '大きな荷物を抱えた旅人が、地図を見つめています。「村はどっちだったかな？」', icon: 'compass', choices: [
      { label: '村までの道を教える', hint: '賢さがあると、よく伝わる', ability: 'intelligence', threshold: 40, coins: 30, xp: 18, trait: 'kindness', success: '「ありがとう！」お礼に、小さな金貨をもらいました。', fail: '一緒に地図を眺めて、なんとか道を見つけました。' },
      { label: '荷物を運ぶのを手伝う', hint: '力が育つ。やさしい寄り道', ability: 'strength', threshold: 0, coins: 20, xp: 14, trait: 'kindness', success: '村の入り口までお手伝い。旅人と仲良くなりました。' }
    ] },
    { title: '木の根もとの宝箱', text: '森の奥に、古い小さな宝箱。ふたには葉っぱの形の仕掛けがついています。', icon: 'gift', choices: [
      { label: '仕掛けを解いてみる', hint: '賢さがあると、お宝が増える', ability: 'intelligence', threshold: 45, coins: 45, xp: 22, trait: 'curiosity', success: 'かちり！ふたが開いて、金貨がきらきら輝きました。', fail: '考えた末に、ふたが少し開きました。小さなお宝を発見！' },
      { label: '周りの薬草を集める', hint: '生命力が育つ。確実なおみやげ', ability: 'vitality', threshold: 0, coins: 25, xp: 16, trait: 'curiosity', success: 'いい香りの薬草を発見。村のお店が買い取ってくれそうです。' }
    ] }
  ];
  const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
  const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  const age = (s, c) => Math.max(0, Math.min(50, Math.floor(((c.dead && c.deathAt ? c.deathAt : s.clockAt) - c.bornAt) / DAY)));
  const active = s => s.creatures.find(c => c.id === s.active) || s.creatures[0];
  const dayKey = s => new Date(s.clockAt).toLocaleDateString('sv-SE');
  const alive = s => s.creatures.filter(c => !c.dead);
  function log(s, text, type = 'life') { s.logs.unshift({ at: s.clockAt, text, type }); s.logs = s.logs.slice(0, 150); }
  function make(name, species, at, random = Math.random) {
    const base = Object.fromEntries(Object.keys(LABELS).map(k => [k, Math.round(38 + random() * 24 + (SPECIES[species].trait === k ? 12 : 0))]));
    return { id: uid(), name: name.trim().slice(0, 16) || 'ミオ', species, bornAt: at, lastAt: at,
      hunger: 72, hygiene: 68, health: 100, neglectHours: 0, sick: false, dead: false, deathReason: '', deathAt: null,
      level: 1, xp: 0, intelligence: Math.round(32 + random() * 18), vitality: Math.round(36 + random() * 18), strength: Math.round(30 + random() * 20),
      personalityBase: base, personality: { ...base }, job: 'none', lastWorkAge: -1, lastDungeonDay: null,
      scarf: false, talkDay: null, talkToday: 0, saidToday: [], reply: 'ここ、あったかいね。きみの名前、覚えたいな。',
      memory: { feed: 0, bath: 0, talk: 0, adventure: 0, work: 0 }
    };
  }
  function fresh(mode = 'demo', name = 'ミオ', species = 'fox', now = Date.now(), random = Math.random) {
    const c = make(name, Object.hasOwn(SPECIES, species) ? species : 'fox', now, random);
    const s = { version: 2, mode, startedAt: now, clockAt: now, coins: 30, active: c.id, creatures: [c], logs: [], quests: [], adventure: null, discovered: [c.species] };
    log(s, `森のはずれで、${c.name}と出会いました。今日から一緒の暮らしが始まります。`, 'milestone');
    return s;
  }
  function trait(c, k, delta) { c.personality[k] = clamp(c.personality[k] + delta, Math.max(0, c.personalityBase[k] - 20), Math.min(100, c.personalityBase[k] + 20)); }
  function quest(s, id) {
    if (s.quests.includes(id)) return;
    s.quests.push(id);
    const q = QUESTS.find(q => q.id === id); s.coins = Math.min(1e9, s.coins + q.reward);
    log(s, `「${q.name}」を達成。お祝いに ${q.reward} G が届きました。`, 'milestone');
  }
  function xp(s, c, amount) {
    c.xp += amount;
    while (c.xp >= c.level * 40) { c.xp -= c.level * 40; c.level++; log(s, `${c.name}が Lv.${c.level} になりました。`, 'milestone'); }
  }
  function work(s, c, workAge) {
    if (c.dead || workAge < 8 || workAge >= 50 || c.job === 'none' || c.lastWorkAge >= workAge) return;
    const j = JOBS[c.job]; c.lastWorkAge = workAge; s.coins = Math.min(1e9, s.coins + j.coins); xp(s, c, j.xp);
    Object.keys(ABILITIES).forEach((k, i) => { c[k] = clamp(c[k] + j.growth[i]); });
    Object.entries(j.traits).forEach(([k, v]) => trait(c, k, v)); c.memory.work++;
    log(s, `${c.name}は${j.name}の仕事をして、${j.coins} G を受け取りました。`, 'work'); quest(s, 'work');
  }
  function die(s, c, reason) { c.dead = true; c.health = 0; c.deathReason = reason; c.deathAt = c.lastAt; log(s, `${c.name}は${reason}`, 'milestone'); }
  function sync(s, now = Date.now()) {
    const target = s.mode === 'real' ? Math.max(s.clockAt, now) : s.clockAt;
    s.clockAt = target;
    for (const c of s.creatures) {
      // Fixed hourly ticks make offline catch-up independent of refresh frequency.
      // Childhood is simulated before the adult boundary, even after a long absence.
      while (!c.dead && c.lastAt + HOUR <= target) {
        const startAge = Math.floor((c.lastAt - c.bornAt) / DAY);
        c.lastAt += HOUR;
        if (startAge < 8) {
          c.hunger = clamp(c.hunger - 1.6); c.hygiene = clamp(c.hygiene - 1.05);
          const neglected = c.hunger < 22 || c.hygiene < 22;
          c.neglectHours = Math.max(0, c.neglectHours + (neglected ? 1 : -1.3));
          if (!c.sick && c.neglectHours >= 6) { c.sick = true; log(s, `${c.name}は体調を崩しました。ごはんとお風呂でお世話をしてあげましょう。`, 'care'); }
          if (c.sick) c.health = clamp(c.health - (.5 + (c.hunger < 10 ? .35 : 0) + (c.hygiene < 10 ? .35 : 0)) * (1.15 - c.vitality / 200));
          if (!c.sick && c.hunger > 55 && c.hygiene > 55) c.health = clamp(c.health + .3);
          if (c.health <= 0) { die(s, c, '幼い時期のお世話不足で、静かに息を引き取りました。'); break; }
        } else {
          // Adults feed and wash themselves; neglect alone cannot kill them.
          c.hunger = Math.max(55, c.hunger - .35); c.hygiene = Math.max(55, c.hygiene - .22);
          c.neglectHours = 0; c.health = clamp(c.health + .5);
          if (c.health >= 70) c.sick = false;
        }
        const endAge = Math.floor((c.lastAt - c.bornAt) / DAY);
        if (endAge >= 50) { die(s, c, '50歳の寿命を迎えました。一緒に過ごした日々は、村の思い出に残ります。'); break; }
        if (startAge < 8 && endAge >= 8) { log(s, `${c.name}が8歳に。ひとりで暮らせる大人になりました。仕事を選んであげましょう。`, 'milestone'); quest(s, 'adult'); }
        work(s, c, endAge);
      }
    }
    if (s.adventure) {
      const traveler = s.creatures.find(c => c.id === s.adventure.petId);
      if (!traveler || traveler.dead) s.adventure = null;
    }
    return s;
  }
  function advance(s) {
    if (s.mode !== 'demo') return { ok: false, message: '通常モードは現実の時間で育ちます。' };
    if (s.adventure) return { ok: false, message: '探索を終えてから、次の日に進みましょう。' };
    s.clockAt += DAY; sync(s); return { ok: true, message: '村に、新しい朝が来ました。' };
  }
  function recover(s, c) {
    if (c.sick && c.hunger > 55 && c.hygiene > 55 && c.health >= 35) {
      c.sick = false; c.neglectHours = 0; c.vitality = clamp(c.vitality + .8);
      log(s, `${c.name}が元気を取り戻しました。`, 'care');
    }
  }
  function care(s, kind) {
    const c = active(s);
    if (!c || c.dead || s.adventure) return { ok: false, message: '今はお世話できません。' };
    if (!['feed', 'bath'].includes(kind)) return { ok: false, message: 'そのお世話はありません。' };
    const key = kind === 'feed' ? 'hunger' : 'hygiene', before = c[key];
    if (before >= 100) return { ok: false, message: kind === 'feed' ? 'もうおなかいっぱい。またあとでね。' : '今はぴかぴか。またあとでね。' };
    c[key] = clamp(c[key] + (kind === 'feed' ? 42 : 48)); c.health = clamp(c.health + (c.sick ? 5 : 1));
    c.memory[kind]++; recover(s, c); quest(s, kind);
    c.reply = W.response(c, kind);
    const message = `${kind === 'feed' ? 'おなか' : 'きれい'} ${Math.round(before)} → ${Math.round(c[key])}`;
    log(s, `${c.name}に${kind === 'feed' ? 'ごはんをあげました' : 'お風呂に入ってもらいました'}。${message}`, 'care');
    return { ok: true, message };
  }
  const ANCHORS = [
    { key: 'praise', phrases: ['よく頑張ったね', 'えらいね', 'すごいね', 'できたね', '上手だね'], delta: { kindness: .35, courage: .45 }, reply: '見ていてくれたんだね。えへへ、次もがんばろうかな。' },
    { key: 'love', phrases: ['大好きだよ', 'かわいいね', '大切だよ', 'ありがとう', '一緒にいよう'], delta: { kindness: .4, sociability: .35, emotionalStability: .3 }, reply: 'きみが来てくれると、ぽかぽかする。また会いにきてね。' },
    { key: 'encourage', phrases: ['大丈夫だよ', '失敗してもいいよ', '挑戦してみよう', '怖くないよ', '無理しなくていいよ'], delta: { courage: .45, emotionalStability: .4 }, reply: 'うん。きみがそばにいるなら、もう一度やってみたい。' },
    { key: 'curious', phrases: ['調べてみよう', '見に行こう', '面白そうだね', 'どうしてだと思う', '何を見つけたの'], delta: { curiosity: .55 }, reply: 'あの木の向こうには、何があるんだろう。一緒に見つけたいな。' },
    { key: 'discipline', phrases: ['約束を守ろう', '片付けよう', '順番を守ろう', '今日はここまで'], delta: { discipline: .5 }, reply: 'わかった。ひとつずつ、ちゃんとやってみるね。' },
    { key: 'harsh', phrases: ['嫌い', 'ばか', '弱い', 'だめ', 'うるさい'], delta: { courage: -.35, sociability: -.25, emotionalStability: -.4 }, reply: '……少しびっくりした。今は、静かにしていたいな。' }
  ];
  function normalize(t) { return t.normalize('NFKC').toLowerCase().replace(/[！!？?。、,.「」『』（）()\s]/g, ''); }
  function vec(text) {
    const t = normalize(text), v = {};
    for (let i = 0; i < t.length; i++) { v['u:' + t[i]] = (v['u:' + t[i]] || 0) + .3; if (i + 1 < t.length) { const k = 'b:' + t.slice(i, i + 2); v[k] = (v[k] || 0) + 1; } }
    return v;
  }
  function cosine(a, b) { let dot = 0, aa = 0, bb = 0; for (const k in a) { aa += a[k] ** 2; dot += a[k] * (b[k] || 0); } for (const k in b) bb += b[k] ** 2; return aa && bb ? dot / Math.sqrt(aa * bb) : 0; }
  function classify(text) {
    let t = normalize(text);
    // Remove explicit negated hostile phrases before applying hostile keyword boosts.
    t = t.replace(/(嫌い|弱い|だめ|ダメ|ばか|バカ)(じゃない|ではない|なんかじゃない)/g, '大丈夫');
    const v = vec(t);
    const scores = ANCHORS.map(a => ({ ...a, score: Math.max(...a.phrases.map(p => cosine(v, vec(p)))) + (a.key === 'harsh' && /(嫌い|ばか|バカ|だめ|ダメ|うるさい)/.test(t) ? .3 : 0) }));
    scores.sort((a, b) => b.score - a.score);
    return scores[0].score >= .26 ? scores[0] : null;
  }
  function talk(s, text) {
    const c = active(s); text = String(text || '').trim().slice(0, 140);
    if (!c || c.dead || s.adventure || !text) return { ok: false, message: '届けたい言葉を入れてください。' };
    const today = dayKey(s);
    if (c.talkDay !== today) { c.talkDay = today; c.talkToday = 0; c.saidToday = []; }
    const a = classify(text), normalized = normalize(text), changes = [];
    const growing = c.talkToday < 3 && !c.saidToday.includes(normalized);
    if (a && growing) for (const [k, delta] of Object.entries(a.delta)) { const before = c.personality[k]; trait(c, k, delta); if (Math.abs(c.personality[k] - before) > .001) changes.push(`${LABELS[k]} ${delta > 0 ? '+' : ''}${(c.personality[k] - before).toFixed(1)}`); }
    if (growing) { c.talkToday++; c.saidToday.push(normalized); }
    c.memory.talk++; c.reply = a ? W.response(c, a.key) : age(s, c) < 3 ? '……うん。まだ難しいけど、きみの声、好きだな。' : W.response(c, 'quiet');
    quest(s, 'talk'); log(s, `${c.name}に「${text}」と声をかけました。`, 'talk');
    return { ok: true, message: changes.length ? changes.join(' / ') : growing ? '声を聞いて、うれしそうです。' : '今日の言葉は、もう十分に届いています。お話は何度でも。' };
  }
  function setJob(s, key) {
    const c = active(s);
    if (!c || c.dead || age(s, c) < 8 || s.adventure || !Object.hasOwn(JOBS, key)) return { ok: false, message: '仕事は8歳から選べます。' };
    c.job = key; log(s, `${c.name}の仕事を「${JOBS[key].name}」にしました。`, 'work');
    work(s, c, age(s, c));
    return { ok: true, message: key === 'none' ? '少しゆっくり過ごすことにしました。' : `${JOBS[key].name}としての暮らしが始まります。` };
  }
  function rescue(s, species, name) {
    if (s.creatures.length >= 200) return {ok: false, message: 'この村の記録は200体に達しました。設定から記録を書き出して保管してください。'};
    if (alive(s).length >= MAX || s.adventure || !Object.hasOwn(SPECIES, species)) return { ok: false, message: '村で暮らせるのは8体までです。' };
    const c = make(name, species, s.clockAt); s.creatures.push(c); s.active = c.id;
    if (!s.discovered.includes(species)) s.discovered.push(species);
    log(s, `${c.name}を森で保護しました。村の新しい仲間です。`, 'milestone');
    return { ok: true, message: `${c.name}、これからよろしくね。` };
  }
  function buy(s, item) {
    const c = active(s), i = Object.hasOwn(ITEMS, item) ? ITEMS[item] : null;
    if (!c || c.dead || s.adventure || !i) return { ok: false, message: '今は買い物できません。' };
    if (s.coins < i.price) return { ok: false, message: 'お金が足りません。探索や仕事で集めましょう。' };
    if (item === 'scarf' && c.scarf) return { ok: false, message: 'この子はもう持っています。' };
    if (item === 'soup' && c.hunger >= 100 && c.health >= 100) return { ok: false, message: '今はおなかも元気もいっぱいです。' };
    if (item === 'medicine' && !c.sick && c.health >= 100) return { ok: false, message: '元気いっぱい。おくすりは必要ありません。' };
    s.coins -= i.price;
    if (item === 'soup') { c.hunger = clamp(c.hunger + 60); c.health = clamp(c.health + 15); recover(s, c); }
    if (item === 'medicine') { c.sick = false; c.neglectHours = 0; c.health = clamp(c.health + 45); }
    if (item === 'scarf') c.scarf = true;
    log(s, `${c.name}に${i.name}を買いました。−${i.price} G`, 'care');
    return { ok: true, message: `${i.name}、気に入ってくれたみたい。` };
  }
  const ROUTES = W.ROUTES;
  function adventureRoute(s) { return s.adventure?.route || 'forest'; }
  function encounters(s) { return ROUTES[adventureRoute(s)]?.encounters || ENCOUNTERS; }
  function currentEncounter(s) { return s.adventure ? encounters(s)[s.adventure.step] || null : null; }
  function previewChoice(s, choice) {
    const c = s.creatures.find(c => c.id === s.adventure?.petId), e = currentEncounter(s);
    if (!c || !e || ![0, 1].includes(choice)) return null;
    const option = e.choices[choice], success = c[option.ability] >= option.threshold;
    return {ability: option.ability, value: c[option.ability], threshold: option.threshold,
      success, coins: success ? option.coins : Math.round(option.coins * .55), xp: option.xp};
  }
  function visitedRoutes(c) {
    // Before v0.9 all completed journeys were in the original forest. Preserve that progress.
    return c.trails ? [...c.trails] : c.memory.adventure > 0 ? ['forest'] : [];
  }
  function beginAdventure(s, route = 'forest') {
    if (typeof route !== 'string' || !Object.hasOwn(ROUTES, route)) return {ok: false, message: 'その行き先は選べません。'};
    const c = active(s);
    if (!c || c.dead || c.sick || c.health < 40 || c.hunger < 20) return { ok: false, message: 'ごはんとお世話で元気になってから出かけましょう。' };
    if (s.adventure || c.lastDungeonDay === dayKey(s)) return { ok: false, message: '今日の探索はおしまい。また明日。' };
    c.lastDungeonDay = dayKey(s);
    s.adventure = { petId: c.id, route, step: 0, coins: 0, xp: 0, lastText: '' };
    log(s, `${c.name}が「${ROUTES[route].name}」の探索に出かけました。`, 'adventure'); return { ok: true, message: '小さな冒険へ、出発。' };
  }
  function chooseAdventure(s, choice) {
    const a = s.adventure;
    if (!a || a.step >= ENCOUNTERS.length || ![0, 1].includes(choice)) return { ok: false, message: 'その道は選べません。' };
    const c = s.creatures.find(c => c.id === a.petId); if (!c || c.dead) return { ok: false, message: '探索できません。' };
    const option = encounters(s)[a.step].choices[choice], success = c[option.ability] >= option.threshold;
    const coins = success ? option.coins : Math.round(option.coins * .55);
    a.coins += coins; a.xp += option.xp; a.lastText = success ? option.success : option.fail;
    c[option.ability] = clamp(c[option.ability] + 1.2); trait(c, option.trait, .18); c.hunger = clamp(c.hunger - 3);
    a.step++; return { ok: true, message: a.lastText, coins, xp: option.xp, finished: a.step === ENCOUNTERS.length };
  }
  function finishAdventure(s, retreat = false) {
    const a = s.adventure;
    if (!a || (!retreat && a.step < ENCOUNTERS.length)) return { ok: false, message: 'まだ探索の途中です。' };
    const c = s.creatures.find(c => c.id === a.petId);
    if (!c || c.dead) { s.adventure = null; return { ok: false, message: '探索を終了しました。' }; }
    const coins = a.coins, amount = a.xp; s.coins = Math.min(1e9, s.coins + coins); xp(s, c, amount);
    if (a.step === ENCOUNTERS.length) { c.trails = [...new Set([...visitedRoutes(c), adventureRoute(s)])]; c.memory.adventure++; quest(s, 'adventure'); }
    c.reply = `ただいま！${ROUTES[adventureRoute(s)].name}で、小さな発見があったよ。`;
    log(s, `${c.name}が「${ROUTES[adventureRoute(s)].name}」から帰宅。${coins} G と ${amount} XP を持ち帰りました。`, 'adventure');
    s.adventure = null; return { ok: true, message: `おかえり！ ${coins} G・${amount} XP を獲得。` };
  }
  function validate(s) {
    const finite = (n, lo, hi) => Number.isFinite(n) && n >= lo && n <= hi;
    const boundedString = (v, max = 500) => typeof v === 'string' && v.length <= max;
    if (!s || s.version !== 2 || !['demo', 'real'].includes(s.mode) || !finite(s.clockAt, 0, 8e15) || !finite(s.startedAt, 0, s.clockAt) || !finite(s.coins, 0, 1e9)) return false;
    if (!Array.isArray(s.creatures) || !s.creatures.length || s.creatures.length > 200 || s.creatures.some(c => !c || typeof c !== 'object') || alive(s).length > MAX) return false;
    const ids = new Set();
    for (const c of s.creatures) {
      if (!c || !boundedString(c.id, 100) || !/^[a-zA-Z0-9_-]+$/.test(c.id) || ids.has(c.id) || !boundedString(c.name, 16) || !c.name.trim() || typeof c.species !== 'string' || !Object.hasOwn(SPECIES, c.species) || typeof c.job !== 'string' || !Object.hasOwn(JOBS, c.job)) return false;
      ids.add(c.id);
      if (!finite(c.bornAt, 0, s.clockAt) || !finite(c.lastAt, c.bornAt, s.clockAt) || !finite(c.level, 1, 1000) || !Number.isInteger(c.level) || !finite(c.xp, 0, c.level * 40 - .00001) || !finite(c.neglectHours, 0, 1e6)) return false;
      if (![c.dead, c.sick, c.scarf].every(x => typeof x === 'boolean')) return false;
      if (c.deathAt != null && !finite(c.deathAt, c.bornAt, s.clockAt)) return false;
      if (!['hunger', 'hygiene', 'health', ...Object.keys(ABILITIES)].every(k => finite(c[k], 0, 100))) return false;
      if (!c.personality || !c.personalityBase || !Object.keys(LABELS).every(k => finite(c.personality[k], 0, 100) && finite(c.personalityBase[k], 0, 100) && Math.abs(c.personality[k] - c.personalityBase[k]) <= 20.00001)) return false;
      if (!c.memory || !Object.keys(makeMemory()).every(k => finite(c.memory[k], 0, 1e9))) return false;
      if (c.trails !== undefined && (!Array.isArray(c.trails) || c.trails.length > 4 || new Set(c.trails).size !== c.trails.length || c.trails.some(k => typeof k !== 'string' || !Object.hasOwn(ROUTES, k)))) return false;
      if (!boundedString(c.reply) || !boundedString(c.deathReason) || !Array.isArray(c.saidToday) || c.saidToday.length > 3 || !c.saidToday.every(t => boundedString(t, 140))) return false;
      if (!Number.isInteger(c.talkToday) || !Number.isInteger(c.lastWorkAge) || !finite(c.talkToday, 0, 3) || !finite(c.lastWorkAge, -1, 50) || ![c.talkDay, c.lastDungeonDay].every(v => v === null || boundedString(v, 20))) return false;
    }
    if (!ids.has(s.active) || !Array.isArray(s.quests) || !s.quests.every(id => QUESTS.some(q => q.id === id)) || new Set(s.quests).size !== s.quests.length) return false;
    if (!Array.isArray(s.discovered) || s.discovered.length > Object.keys(SPECIES).length || new Set(s.discovered).size !== s.discovered.length || !s.discovered.every(k => typeof k === 'string' && Object.hasOwn(SPECIES, k))) return false;
    if (!Array.isArray(s.logs) || s.logs.length > 150 || !s.logs.every(l => l && finite(l.at, 0, 8e15) && boundedString(l.text, 600) && boundedString(l.type, 40))) return false;
    if (s.adventure !== null) {
      const a = s.adventure;
      if (a?.route !== undefined && (typeof a.route !== 'string' || !Object.hasOwn(ROUTES, a.route))) return false;
      if (!a || !ids.has(a.petId) || !Number.isInteger(a.step) || !finite(a.step, 0, 3) || !finite(a.coins, 0, 200) || !finite(a.xp, 0, 100) || !boundedString(a.lastText)) return false;
    }
    return true;
  }
  function makeMemory() { return { feed: 0, bath: 0, talk: 0, adventure: 0, work: 0 }; }
  function migrate(old, now = Date.now()) {
    if (!old || !Array.isArray(old.creatures) || !old.creatures.length || old.creatures.length > MAX) return null;
    const s = fresh('real', 'ミオ', 'fox', now); s.creatures = [];
    for (const [i, previous] of old.creatures.entries()) {
      if (!previous || !Number.isFinite(previous.bornAt)) return null;
      const offset = previous.offset || previous.simulatedOffsetMs || 0;
      const born = clamp(previous.bornAt - offset, 0, now);
      const c = make(String(previous.name || 'ミオ'), Object.keys(SPECIES)[i % 4], born);
      c.lastAt = clamp((previous.lastAt || previous.lastSimulatedAt || now) - offset, born, now);
      for (const key of ['hunger', 'hygiene', 'health', 'intelligence', 'vitality', 'strength']) if (Number.isFinite(previous[key])) c[key] = clamp(previous[key]);
      c.level = Math.max(1, Math.floor(previous.level || 1)); c.xp = clamp(previous.xp || 0, 0, c.level * 40 - 1);
      c.sick = !!previous.sick; c.dead = !!previous.dead; c.deathReason = String(previous.deathReason || '村の思い出になりました。');
      c.job = Object.hasOwn(JOBS, previous.job) ? previous.job : 'none'; c.lastWorkAge = Number.isFinite(previous.lastWorkAge) ? previous.lastWorkAge : Math.floor((now - born) / DAY);
      c.lastWorkAge = clamp(c.lastWorkAge, -1, 50); c.lastDungeonDay = previous.lastDungeonDay || null;
      for (const k of Object.keys(LABELS)) {
        c.personalityBase[k] = clamp(previous.personalityBase?.[k] ?? previous.personality?.[k] ?? 50);
        c.personality[k] = clamp(previous.personality?.[k] ?? c.personalityBase[k], Math.max(0, c.personalityBase[k] - 20), Math.min(100, c.personalityBase[k] + 20));
      }
      s.creatures.push(c);
    }
    s.active = s.creatures[0].id; s.coins = clamp(old.coins || 0, 0, 1e9); s.discovered = [...new Set(s.creatures.map(c => c.species))];
    s.logs = []; log(s, 'これまでの試作版の仲間と所持金を引き継ぎました。', 'milestone');
    return validate(s) ? s : null;
  }
  const api = { DAY, HOUR, MAX, LABELS, ABILITIES, SPECIES, JOBS, ITEMS, QUESTS, ENCOUNTERS, ROUTES, adventureRoute, currentEncounter, previewChoice, visitedRoutes, clamp, age, active, alive, dayKey, fresh, sync, advance, care, talk, classify, trait, setJob, rescue, buy, beginAdventure, chooseAdventure, finishAdventure, validate, migrate, log };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ForestGame = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
