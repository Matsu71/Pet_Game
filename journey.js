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
  function ensure(s) {
    if (!s.journey) s.journey = {version: 1, owned: [], equipped: 'none', residents: {}, memory: null};
    return s.journey;
  }
  function record(s, id = s.active) {
    const j = ensure(s), day = G.dayKey(s);
    if (!own(j.residents, id)) Object.defineProperty(j.residents, id, {value: {bond: 0, days: 0, day, wishes: [], claimed: false, memoryRewardDay: null}, writable: true, enumerable: true, configurable: true});
    const r = j.residents[id];
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
        r.memoryRewardDay = G.dayKey(s); m.rewarded = true;
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
    const m = ensure(s).memory;
    if (m && !m.complete) return {ok: false};
    ensure(s).memory = null; return startMemory(s, random);
  }
  function validate(s) {
    if (s.journey === undefined) return true; // Original v2 saves remain valid and unchanged until next save.
    const j = s.journey, obj = o => o && typeof o === 'object' && !Array.isArray(o);
    const int = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
    const day = d => typeof d === 'string' && /^\d{4,6}-\d{2}-\d{2}$/.test(d);
    if (!obj(j) || j.version !== 1 || !Array.isArray(j.owned) || new Set(j.owned).size !== j.owned.length || j.owned.some(k => !own(GARDENS, k)) || !(j.equipped === 'none' || j.owned.includes(j.equipped)) || !obj(j.residents) || Object.keys(j.residents).length > 200) return false;
    for (const [id, r] of Object.entries(j.residents)) {
      if (!s.creatures.some(c => c.id === id) || !obj(r) || !int(r.bond, 100) || !int(r.days, 1000000) || !day(r.day) || !Array.isArray(r.wishes) || r.wishes.length > 3 || new Set(r.wishes).size !== r.wishes.length || r.wishes.some(k => !own(WISHES, k)) || typeof r.claimed !== 'boolean' || (r.claimed && r.wishes.length !== 3) || !(r.memoryRewardDay === null || day(r.memoryRewardDay))) return false;
    }
    if (j.memory === null) return true;
    const m = j.memory;
    if (!obj(m) || !s.creatures.some(c => c.id === m.petId) || !Array.isArray(m.deck) || m.deck.length !== 6 || [0, 1, 2].some(n => m.deck.filter(v => v === n).length !== 2) || !Array.isArray(m.matched) || m.matched.length % 2 || !Array.isArray(m.open) || m.open.length > 2 || !int(m.moves, 1000000) || typeof m.complete !== 'boolean' || typeof m.rewarded !== 'boolean') return false;
    const used = [...m.matched, ...m.open];
    if (used.some(v => !int(v, 5)) || new Set(used).size !== used.length || m.complete !== (m.matched.length === 6) || (m.rewarded && !m.complete)) return false;
    for (let i = 0; i < m.matched.length; i += 2) if (m.deck[m.matched[i]] !== m.deck[m.matched[i + 1]]) return false;
    return true;
  }
  const api = Object.freeze({WISHES, GARDENS, SYMBOLS, ensure, record, mark, claim, decorate, startMemory, flip, hideCards, replay, validate});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ForestJourney = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
