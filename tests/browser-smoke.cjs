/* Optional browser acceptance test. Requires Playwright and Google Chrome.
   Start `npm start`, then run `npm run test:browser` in a second terminal. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const BASE = process.env.GAME_URL || 'http://localhost:4173';
const OUTPUT = process.env.QA_OUTPUT || '/tmp/morinoko-qa';
const KEY = 'forest-child-mvp-v2-demo';
(async () => {
  await fs.mkdir(OUTPUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, reducedMotion: 'reduce' });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const read = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
    const click = action => page.locator(`[data-action="${action}"]`).click();
    await page.goto(BASE); await page.locator('#modal[open]').waitFor();
    await page.locator('#pet-name').fill('こはる');
    await page.locator('[data-start="demo"]').click();
    assert.equal((await read()).creatures[0].name, 'こはる');
    await click('feed'); await click('bath');
    assert.equal((await read()).creatures[0].hunger, 100);
    await page.locator('#talk-input').fill('今日もよく頑張ったね');
    await page.locator('#talk-input').press('Enter');
    assert((await page.locator('.speech-note').innerText()).includes('がんばろう'));
    await click('adventure'); await page.locator('[data-choice="1"]').click();
    assert.equal((await read()).adventure.step, 1);
    await page.reload(); await click('adventure');
    assert((await page.locator('#modal-title').innerText()).includes('旅人'));
    await page.locator('[data-choice="1"]').click(); await page.locator('[data-choice="1"]').click();
    await click('finish-adventure'); assert.equal((await read()).adventure, null);
    assert.equal(await page.locator('[data-action="adventure"]').isDisabled(), true);
    for (let day = 0; day < 8; day++) {
      for (const action of ['feed', 'bath']) if (await page.locator(`[data-action="${action}"]`).isEnabled()) await click(action);
      await click('next-day');
    }
    assert.match(await page.locator('.pet-meta').innerText(), /8歳/);
    await page.locator('#job-select').selectOption('herbalist');
    const wage = (await read()).coins;
    assert.equal((await read()).quests.length, 6);
    await page.locator('#job-select').selectOption('merchant'); assert.equal((await read()).coins, wage);
    await click('next-day'); assert.equal((await read()).coins, wage + 55);
    await click('shop'); await page.locator('[data-buy="scarf"]').click();
    assert((await read()).creatures[0].scarf); await click('close');
    await page.locator('.nav-button[data-view="village"]').click(); await click('rescue');
    await page.locator('[data-species="rabbit"]').click(); await page.locator('#new-name').fill('ルゥ');
    await click('confirm-rescue'); assert.equal((await read()).creatures.length, 2);
    assert.equal((await read()).creatures[1].species, 'rabbit');
    assert.match(await page.locator('.pet-meta').innerText(), /0歳/);
    await page.reload(); assert.match(await page.locator('.pet-name').innerText(), /ルゥ/);
    await click('settings'); await click('switch-mode');
    await page.locator('#pet-name').fill('ソラ'); await page.locator('[data-start="real"]').click();
    assert.equal(await page.locator('[data-action="next-day"]').count(), 0);
    await click('settings'); await click('switch-mode'); assert.equal((await read()).creatures.length, 2);
    assert.match(await page.locator('.pet-name').innerText(), /ルゥ/);
    await click('settings'); const downloadPromise = page.waitForEvent('download'); await click('export');
    const download = await downloadPromise; const downloaded = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
    assert.equal(downloaded.creatures.length, 2);
    const beforeInvalid = JSON.stringify(await read());
    await page.locator('#save-file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":2}') });
    await page.getByText('読み込めませんでした。森の子の有効なセーブデータを選んでください。').waitFor();
    assert.equal(JSON.stringify(await read()), beforeInvalid);
    downloaded.coins = 777;
    await page.locator('#save-file').setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(downloaded)) });
    await page.getByText('この村を、読み込みますか？').waitFor();
    assert.notEqual((await read()).coins, 777);
    await click('confirm-import'); assert.equal((await read()).coins, 777);
    await page.locator('.nav-button[data-view="village"]').click();
    await page.locator('[data-select]').first().click();
    // Save a finished-game desktop screenshot after the transient notification clears.
    await page.locator('#toast.visible').waitFor({ state: 'hidden', timeout: 7000 });
    await page.screenshot({ path: path.join(OUTPUT, 'desktop.png'), fullPage: true });
    await page.locator('.nav-button[data-view="village"]').click();
    await page.screenshot({ path: path.join(OUTPUT, 'village.png'), fullPage: true });
    await page.locator('.nav-button[data-view="journal"]').click();
    assert(await page.locator('.achievement.complete').count() === 6);
    const p2 = await context.newPage(); await p2.goto(BASE);
    await p2.locator('[data-action="rename"]').click(); await p2.locator('#rename-input').fill('こはる２'); await p2.locator('[data-action="confirm-rename"]').click();
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).creatures[0].name === 'こはる２', KEY);
    // Small-screen controls, safe text rendering and no horizontal overflow.
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const mobile = await mobileContext.newPage(); mobile.on('pageerror', e => errors.push(e.message));
    await mobile.goto(BASE);
    await mobile.locator('#pet-name').fill('<b>ミオ</b>'); await mobile.locator('[data-start="demo"]').click();
    assert.equal(await mobile.locator('.pet-name h2').innerText(), '<b>ミオ</b>'); assert.equal(await mobile.locator('.pet-name h2 b').count(), 0);
    await mobile.locator('[data-action="rename"]').click(); await mobile.locator('#rename-input').fill('ミオ'); await mobile.locator('[data-action="confirm-rename"]').click();
    await mobile.locator('[data-action="feed"]').click(); await mobile.locator('[data-action="bath"]').click();
    await mobile.locator('#talk-input').fill('大好きだよ'); await mobile.locator('#talk-input').press('Enter');
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await mobile.locator('#toast.visible').waitFor({ state: 'hidden', timeout: 7000 });
    await mobile.screenshot({ path: path.join(OUTPUT, 'mobile.png'), fullPage: true });
    await mobile.locator('[data-action="adventure"]').click();
    assert.equal(await mobile.evaluate(() => { const d = document.querySelector('dialog'); return d.scrollWidth <= d.clientWidth; }), true);
    await mobile.screenshot({ path: path.join(OUTPUT, 'mobile-adventure.png'), fullPage: false });
    await mobile.getByRole('button', { name: '閉じる', exact: true }).click();
    for (const width of [320, 375, 768, 1024]) {
      await mobile.setViewportSize({ width, height: 844 });
      assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overflow at ${width}`);
    }
    // Storage refusal should still allow an in-memory session with a clear warning.
    const unavailable = await browser.newContext();
    await unavailable.addInitScript(() => {
      Storage.prototype.getItem = () => { throw new DOMException('Denied', 'SecurityError'); };
      Storage.prototype.setItem = () => { throw new DOMException('Denied', 'SecurityError'); };
    });
    const denied = await unavailable.newPage(); await denied.goto(BASE); await denied.locator('[data-start="demo"]').click();
    assert.match(await denied.locator('#save-state').innerText(), /保存できません/);
    await denied.locator('[data-action="feed"]').click(); assert.equal(await denied.locator('.pet-name h2').innerText(), 'ミオ');
    // Direct file opening requires neither a server nor a build step.
    const filePage = await context.newPage();
    const { pathToFileURL } = require('node:url');
    await filePage.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href);
    await filePage.locator('[data-start="demo"]').click(); await filePage.locator('[data-action="feed"]').click();
    assert.equal(await filePage.locator('.forest-art').evaluate(img => img.complete && img.naturalWidth > 0), true);
    assert.deepEqual(errors, []);
    console.log('PASS: tutorial through adulthood and work; adventure resume; daily rewards; shop; rescue; reload; separate modes; export/import; multiple tabs; mobile; safe text; unavailable storage; file:// launch.');
    console.log(`Screenshots: ${OUTPUT}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
