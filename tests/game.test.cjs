const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../game.js');
const START = new Date('2026-09-08T10:00:00+09:00').getTime();
const fresh = (mode = 'demo') => G.fresh(mode, 'ミオ', 'fox', START, () => .5);
function raise(s, days = 8) { for (let i = 0; i < days; i++) { for (const c of G.alive(s)) { s.active = c.id; G.care(s, 'feed'); G.care(s, 'bath'); } assert.equal(G.advance(s).ok, true); } }
test('complete tutorial: care, words, adventure, adult, first job, usable currency', () => {
  const s = fresh(), c = G.active(s);
  assert(G.validate(s)); G.care(s, 'feed'); G.care(s, 'bath');
  G.talk(s, 'よく頑張ったね'); G.beginAdventure(s);
  for (let i = 0; i < 3; i++) assert(G.chooseAdventure(s, 1).ok);
  assert(G.finishAdventure(s).ok); raise(s);
  assert.equal(G.age(s, c), 8); assert.equal(c.dead, false);
  assert(G.setJob(s, 'herbalist').ok); assert.equal(s.quests.length, 6);
  assert(G.buy(s, 'scarf').ok); assert(c.scarf); assert(G.validate(s));
});
test('fixed-hour catch-up equals many small refreshes', () => {
  const a = fresh('real'), b = structuredClone(a);
  G.sync(a, START + 5 * G.DAY);
  for (let time = START; time <= START + 5 * G.DAY; time += G.HOUR / 4) G.sync(b, time);
  for (const key of ['hunger', 'hygiene', 'health', 'neglectHours', 'sick', 'dead', 'lastAt']) assert.equal(a.creatures[0][key], b.creatures[0][key], key);
});
test('a long absence cannot bypass childhood neglect by becoming adult first', () => {
  const s = fresh('real'); G.sync(s, START + 10 * G.DAY);
  assert.equal(G.active(s).dead, true); assert.match(G.active(s).deathReason, /お世話不足/);
  assert(!s.quests.includes('adult'));
});
test('child sickness recovers with care and medicine is purchasable only when useful', () => {
  const s = fresh(); G.advance(s); G.advance(s); const c = G.active(s);
  assert(c.sick); G.care(s, 'feed'); G.care(s, 'feed'); G.care(s, 'bath'); assert(!c.sick);
  c.health = 40; s.coins = 40; assert(G.buy(s, 'medicine').ok); assert.equal(s.coins, 0); assert.equal(c.health, 85);
  assert(!G.buy(s, 'medicine').ok);
});
test('adults survive neglect, work daily offline, then stop work at age 50', () => {
  const s = fresh(); raise(s); G.setJob(s, 'forestry'); const c = G.active(s);
  const before = s.coins; s.mode = 'real'; G.sync(s, s.clockAt + 100 * G.DAY);
  assert(c.dead); assert.match(c.deathReason, /50歳/);
  assert.equal(c.memory.work, 42); // ages 8 through 49, inclusive
  assert.equal(s.coins - before, 41 * G.JOBS.forestry.coins);
  assert(G.validate(s));
});
test('changing jobs and reloading cannot collect an extra wage today', () => {
  const s = fresh(); assert(!G.setJob(s, 'merchant').ok); raise(s);
  G.setJob(s, 'farming'); const coins = s.coins;
  G.setJob(s, 'merchant'); G.setJob(s, 'none'); G.setJob(s, 'farming'); G.sync(s);
  assert.equal(s.coins, coins); G.advance(s); assert.equal(s.coins, coins + 30);
});
test('a newly assigned job pays no backdated wages for unemployed days', () => {
  const s = fresh(); raise(s, 14); const before = s.coins;
  G.setJob(s, 'clerk'); assert.equal(s.coins - before, 45 + 40); // first wage + one-time goal
  assert.equal(G.active(s).memory.work, 1);
});
test('exploration survives serialization, forbids early completion and duplicates', () => {
  let s = fresh(); assert(G.beginAdventure(s).ok); assert(!G.beginAdventure(s).ok);
  assert(!G.finishAdventure(s).ok); assert(!G.advance(s).ok);
  G.chooseAdventure(s, 0); s = JSON.parse(JSON.stringify(s)); assert(G.validate(s));
  G.chooseAdventure(s, 1); G.chooseAdventure(s, 0); assert(!G.chooseAdventure(s, 0).ok);
  assert(G.finishAdventure(s).ok); const coins = s.coins;
  assert(!G.finishAdventure(s).ok); assert.equal(s.coins, coins); assert(!G.beginAdventure(s).ok);
  G.advance(s); assert(G.beginAdventure(s).ok);
});
test('retreat keeps earned rewards and uses today’s exploration', () => {
  const s = fresh(); G.beginAdventure(s); G.chooseAdventure(s, 1);
  const earned = s.adventure.coins, before = s.coins;
  G.finishAdventure(s, true); assert.equal(s.coins, before + earned);
  assert(!s.quests.includes('adventure')); assert(!G.beginAdventure(s).ok);
});
test('words produce bounded gentle changes, repeated words and fourth talk do not farm traits', () => {
  const s = fresh(), c = G.active(s); const base = c.personality.courage;
  G.talk(s, 'よく頑張ったね'); assert(c.personality.courage > base);
  const first = structuredClone(c.personality); G.talk(s, 'よく頑張ったね'); assert.deepEqual(c.personality, first);
  G.talk(s, '大好きだよ'); G.talk(s, '調べてみよう'); const third = structuredClone(c.personality);
  G.talk(s, '挑戦してみよう'); assert.deepEqual(c.personality, third);
  for (let i = 0; i < 500; i++) G.trait(c, 'kindness', 1);
  assert.equal(c.personality.kindness, c.personalityBase.kindness + 20);
  for (let i = 0; i < 500; i++) G.trait(c, 'kindness', -1);
  assert.equal(c.personality.kindness, c.personalityBase.kindness - 20);
});
test('negated hostile words are not classified as hostile', () => {
  assert.equal(G.classify('よく頑張ったね').key, 'praise');
  assert.notEqual(G.classify('嫌いじゃないよ。大好きだよ')?.key, 'harsh');
  assert.notEqual(G.classify('だめじゃないよ。大丈夫だよ')?.key, 'harsh');
  assert.equal(G.classify('うるさい！嫌い！').key, 'harsh');
  assert.equal(G.classify('1234567890'), null);
});
test('village caps living residents at eight, all age together, memorial frees a place', () => {
  const s = fresh(); for (let i = 0; i < 7; i++) assert(G.rescue(s, 'rabbit', `子${i}`).ok);
  assert(!G.rescue(s, 'cat', '九人目').ok); G.advance(s);
  assert(s.creatures.every(c => G.age(s, c) === 1));
  s.creatures[0].dead = true; s.creatures[0].health = 0;
  assert(G.rescue(s, 'cat', '新しい子').ok); assert.equal(G.alive(s).length, 8);
  assert.equal(G.age(s, G.active(s)), 0); assert(G.validate(s));
});
test('save validation rejects damaged schemas and invalid adventure data', () => {
  const s = fresh();
  for (const mutate of [x => x.coins = -1, x => x.creatures[0].hunger = NaN, x => x.creatures[0].memory = null, x => x.creatures[0].personality = {}, x => x.active = 'missing', x => x.adventure = {}, x => x.creatures[0].species = 'dragon', x => x.creatures[0].lastAt = x.clockAt + 1]) {
    const bad = structuredClone(s); mutate(bad); assert.equal(G.validate(bad), false);
  }
  assert.equal(G.validate(null), false);
});
test('real mode cannot be fast-forwarded and a clock rollback cannot rewind state', () => {
  const s = fresh('real'); assert(!G.advance(s).ok); G.sync(s, START + G.DAY);
  const hunger = G.active(s).hunger; G.sync(s, START); assert.equal(s.clockAt, START + G.DAY); assert.equal(G.active(s).hunger, hunger);
});
test('legacy v0.4 saves migrate with abilities, old virtual age, money and personalities', () => {
  const old = { coins: 230, creatures: [{ name: 'ルゥ', bornAt: START, lastAt: START + 9 * G.DAY, offset: 9 * G.DAY, hunger: 81, hygiene: 83, health: 100, intelligence: 57, strength: 64, vitality: 61, level: 3, xp: 12, job: 'teacher', lastWorkAge: 9, personality: { kindness: 55 } }] };
  const s = G.migrate(old, START); assert(s); assert(G.validate(s)); assert.equal(G.age(s, G.active(s)), 9); assert.equal(s.coins, 230); assert.equal(G.active(s).strength, 64); assert.equal(G.active(s).personality.kindness, 55);
});
test('a memorial keeps the age at death when more days pass', () => {
  const s = fresh('real'); G.sync(s, START + 10 * G.DAY); const c = G.active(s), ageAtDeath = G.age(s, c);
  assert(c.dead); assert(ageAtDeath < 8); G.sync(s, START + 30 * G.DAY); assert.equal(G.age(s, c), ageAtDeath); assert(G.validate(s));
});
test('damaged null residents and prototype-name species are rejected without throwing', () => {
  for (const value of [null, false, 3]) { const s = fresh(); s.creatures[0] = value; assert.equal(G.validate(s), false); }
  const s = fresh(); s.creatures[0].species = '__proto__'; assert.equal(G.validate(s), false);
});
test('care and exploration cannot act on deceased residents', () => {
  const s = fresh('real'); G.sync(s, START + 10 * G.DAY); const coins = s.coins;
  assert(!G.care(s, 'feed').ok); assert(!G.talk(s, '大好きだよ').ok); assert(!G.buy(s, 'soup').ok); assert(!G.beginAdventure(s).ok); assert.equal(s.coins, coins);
});
test('daily exploration allowance belongs to each individual', () => {
  const s = fresh(); G.beginAdventure(s); G.finishAdventure(s, true);
  G.rescue(s, 'cat', 'ココ'); assert(G.beginAdventure(s).ok); G.finishAdventure(s, true);
  s.active = s.creatures[0].id; assert(!G.beginAdventure(s).ok);
});
test('one-time milestones remain one-time when a second child is cared for', () => {
  const s = fresh(); G.care(s, 'feed'); G.care(s, 'bath'); const coins = s.coins;
  G.rescue(s, 'bear', 'ネル'); G.care(s, 'feed'); G.care(s, 'bath'); assert.equal(s.coins, coins);
});
