'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const playwright=require('playwright');
const BASE=process.env.GAME_URL||'http://127.0.0.1:4173/';
const OUTPUT=process.env.QA_OUTPUT||path.join(__dirname,'..','quality-artifacts','browser');
const KEY='forest-child-mvp-v2-demo';
const results={sourceCommit:process.env.GITHUB_SHA||null,startedAt:new Date().toISOString(),engines:[],scope:'Browser emulation, not physical-device or user-retention testing.'};
async function runEngine(name){
  const browser=await playwright[name].launch({headless:true,...(name==='chromium' && process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
  const output=path.join(OUTPUT,name);await fs.mkdir(output,{recursive:true});
  const checks=[],errors=[],httpErrors=[]; let page;
  const check=(label)=>checks.push(label);
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',acceptDownloads:true});
    page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
    const click=action=>page.locator(`[data-action="${action}"]`).first().click();
    const read=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
    const nav=view=>page.locator(`.nav-button[data-view="${view}"]`).click();
    const close=()=>page.getByRole('button',{name:'閉じる',exact:true}).click();
    page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()});});
    await page.goto(BASE);
    await page.locator('#pet-name').waitFor({timeout:10000});
    assert.deepEqual(errors,[], 'Runtime startup errors'); assert.deepEqual(httpErrors,[], 'Missing runtime assets');
    await page.locator('#pet-name').fill('<b>ミオ</b>');await page.locator('[data-start="demo"]').click();
    assert.equal(await page.locator('.pet-name h2').innerText(),'<b>ミオ</b>');assert.equal(await page.locator('.pet-name h2 b').count(),0);
    await click('rename');await page.locator('#rename-input').fill('ミオ');await click('confirm-rename');check('safe text and naming');
    await click('feed');await click('bath');assert.equal((await read()).creatures[0].hunger,100);
    await click('talk-open');await page.locator('#talk-input').fill('今日もよく頑張ったね');await page.locator('#talk-input').press('Enter');
    assert.match(await page.locator('.speech-note').innerText(),/がんばろう/);await close();check('care and natural-language encouragement');
    const viewportChecks=[];
    for(const size of [{width:320,height:568},{width:360,height:640},{width:375,height:667},{width:390,height:844},{width:412,height:915},{width:768,height:1024},{width:1280,height:900}]){
      await page.setViewportSize(size);await nav('home');
      const layout=await page.evaluate(()=>{
        const nav=document.querySelector('.bottom-nav').getBoundingClientRect();
        return{overflow:document.documentElement.scrollWidth>innerWidth,controls:[...document.querySelectorAll('.care-button')].map(button=>{const r=button.getBoundingClientRect();return{action:button.dataset.action,width:r.width,height:r.height,bottom:r.bottom,aboveNavigation:r.bottom<=nav.top+1};})};
      });
      assert(!layout.overflow,`horizontal overflow ${JSON.stringify(size)}`);
      for(const c of layout.controls){assert(c.width>=44&&c.height>=44,`target too small ${size.width}: ${c.action}`);assert(c.aboveNavigation,`primary control under navigation ${size.width}: ${c.action}`);}
      await click('decorate');assert.match(await page.locator('#modal-title').innerText(),/こもれび/);await close();
      viewportChecks.push({...size,...layout});
    }
    check('seven viewport sizes; primary touch targets; unobscured garden control');
    await page.setViewportSize({width:390,height:844});await nav('home');
    await page.locator('#toast.visible').waitFor({state:'hidden',timeout:6000});await page.screenshot({path:path.join(output,'mobile-home.png'),fullPage:true});
    await nav('explore');await click('memory');let state=await read();const deck=state.journey.memory.deck;
    await page.locator('[data-memory="0"]').click();await close();await page.reload();await nav('explore');await click('memory');
    assert.deepEqual((await read()).journey.memory.open,[0]);
    const pair=deck.findIndex((v,i)=>i!==0&&v===deck[0]);await page.locator(`[data-memory="${pair}"]`).click();
    for(let symbol=0;symbol<3;symbol++){
      state=await read();if(state.journey.memory.matched.some(i=>deck[i]===symbol))continue;
      for(let i=0;i<6;i++)if(deck[i]===symbol)await page.locator(`[data-memory="${i}"]`).click();
    }
    assert((await read()).journey.memory.complete);await page.screenshot({path:path.join(output,'mobile-memory.png'),fullPage:false});
    await click('memory-home');assert(await page.locator('.habitat').isVisible());check('memory game and interrupted-session recovery');
    await click('story');await page.locator('[data-story-choice="0"]').click();assert((await read()).journey.residents[(await read()).active].storyDay);
    const beforeClaim=(await read()).coins;await click('claim');assert.equal((await read()).coins,beforeClaim+15);assert(await page.locator('[data-action="claim"]').isDisabled());check('daily story and one-time celebration');
    await click('decorate');const coins=(await read()).coins;await page.locator('[data-decor="meadow"]').click();assert.equal((await read()).coins,coins-35);
    await page.locator('[data-decor="none"]').click();await page.locator('[data-decor="meadow"]').click();assert.equal((await read()).coins,coins-35);await close();assert(await page.locator('.garden-meadow').isVisible());check('persistent decorations without repeated charges');
    await nav('explore');await click('adventure');await page.locator('[data-choice="1"]').click();await close();await page.reload();await nav('explore');await click('adventure');
    assert.equal((await read()).adventure.step,1);await page.locator('[data-choice="1"]').click();await page.locator('[data-choice="1"]').click();await click('finish-adventure');assert.equal((await read()).adventure,null);check('adventure resume and finish');
    for(let i=0;i<8;i++){for(const action of ['feed','bath'])if(await page.locator(`[data-action="${action}"]`).isEnabled())await click(action);await click('next-day');}
    assert.match(await page.locator('.pet-meta').innerText(),/8歳/);await click('profile');await page.locator('#job-select').selectOption('herbalist');assert.equal((await read()).quests.length,6);
    const wage=(await read()).coins;await page.locator('#job-select').selectOption('merchant');assert.equal((await read()).coins,wage);await close();await click('next-day');assert.equal((await read()).coins,wage+55);check('tutorial through adulthood and non-duplicated wages');
    await nav('journal');assert.equal(await page.locator('.album-card').count(),12);assert(await page.locator('.album-card.earned').count()>=4);await page.screenshot({path:path.join(output,'mobile-album.png'),fullPage:true});
    await nav('village');await click('rescue');await page.locator('[data-species="rabbit"]').click();await page.locator('#new-name').fill('ルゥ');await click('confirm-rescue');assert.equal((await read()).creatures.length,2);check('resident collection and memory album');
    await click('settings');await click('switch-mode');await page.locator('#pet-name').fill('ソラ');await page.locator('[data-start="real"]').click();assert.equal(await page.locator('[data-action="next-day"]').count(),0);
    await click('settings');await click('switch-mode');assert.equal((await read()).creatures.length,2);assert.equal(await page.locator('.pet-name h2').innerText(),'ルゥ');check('independent demo and real villages');
    await click('settings');const promise=page.waitForEvent('download');await click('export');const download=await promise;
    const exported=JSON.parse(await fs.readFile(await download.path(),'utf8'));assert.equal(exported.creatures.length,2);
    const beforeInvalid=JSON.stringify(await read());await page.locator('#save-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":2}')});
    await page.getByText('読み込めませんでした。森の子の有効なセーブデータを選んでください。').waitFor();assert.equal(JSON.stringify(await read()),beforeInvalid);
    exported.coins=777;await page.locator('#save-file').setInputFiles({name:'good.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});assert.notEqual((await read()).coins,777);await click('confirm-import');assert.equal((await read()).coins,777);check('export, invalid import rejection and explicit replacement confirmation');
    const second=await context.newPage();await second.goto(BASE);await second.locator('[data-action="rename"]').click();await second.locator('#rename-input').fill('ルゥ２');await second.locator('[data-action="confirm-rename"]').click();
    await page.waitForFunction(()=>document.querySelector('.pet-name h2')?.textContent==='ルゥ２');await second.close();check('cross-tab save notification');
    await click('rename');await page.locator('#rename-input').fill('ルゥ３');await click('confirm-rename');
    const backup=await page.evaluate(key=>JSON.parse(localStorage.getItem(key+'-backup')),KEY);assert(backup);
    await page.evaluate(key=>localStorage.setItem(key,'{broken'),KEY);await page.reload();
    assert.equal((await read()).coins,backup.coins);assert(await page.evaluate(key=>localStorage.getItem(key+'-unreadable')==='{broken',KEY));check('recovery from a damaged primary save');
    await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
    const accessibility=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>n.target)}));});
    await fs.writeFile(path.join(output,'accessibility.json'),JSON.stringify(accessibility,null,2));assert.equal(accessibility.filter(v=>['critical','serious'].includes(v.impact)).length,0,JSON.stringify(accessibility));check('no critical or serious automated accessibility violations on home');
    if(name==='chromium'){
      await page.waitForFunction(()=>!!navigator.serviceWorker.controller,{timeout:30000});await context.setOffline(true);await page.reload();assert(await page.locator('.habitat').isVisible());await click('pet');await context.setOffline(false);check('offline reload and interaction');
    }
    const deniedContext=await browser.newContext({viewport:{width:375,height:667},reducedMotion:'reduce'});
    await deniedContext.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('Denied','SecurityError');};Storage.prototype.setItem=()=>{throw new DOMException('Denied','SecurityError');};});
    const denied=await deniedContext.newPage();denied.on('pageerror',e=>errors.push(e.message));await denied.goto(BASE);await denied.locator('[data-start="demo"]').click();await denied.locator('[data-action="feed"]').click();assert.match(await denied.locator('#save-state').innerText(),/保存できません/);await deniedContext.close();check('play remains available when storage is denied');
    const fileContext=await browser.newContext({reducedMotion:'reduce'});const local=await fileContext.newPage();local.on('pageerror',e=>errors.push(e.message));await local.goto(pathToFileURL(path.join(__dirname,'..','index.html')).href);await local.locator('[data-start="demo"]').click();await local.locator('[data-action="feed"]').click();assert(await local.locator('.forest-art').evaluate(img=>img.complete&&img.naturalWidth>0));await fileContext.close();check('direct file launch without a server');
    assert.deepEqual(errors,[]);
    const summary={engine:name,status:'passed',checks,viewportChecks,accessibility,errors};results.engines.push(summary);await fs.writeFile(path.join(output,'result.json'),JSON.stringify(summary,null,2));await context.close();
  }catch(error){
    const failure={engine:name,status:'failed',checks,errors,httpErrors,error:error.stack};
    if(page){try{await page.screenshot({path:path.join(output,'failure.png'),fullPage:true});await fs.writeFile(path.join(output,'failure.html'),await page.content());failure.visibleText=await page.locator('body').innerText();}catch(e){failure.captureError=e.message;}}
    results.engines.push(failure); await fs.writeFile(path.join(output,'result.json'),JSON.stringify(failure,null,2)); throw error;
  }finally{await browser.close();}
}
(async()=>{
  await fs.mkdir(OUTPUT,{recursive:true});
  try{for(const engine of (process.env.BROWSERS||'chromium,webkit').split(','))await runEngine(engine);results.status='passed';console.log(JSON.stringify(results,null,2));}
  catch(error){results.status='failed';results.error=error.stack;throw error;}
  finally{results.finishedAt=new Date().toISOString();await fs.writeFile(path.join(OUTPUT,'result.json'),JSON.stringify(results,null,2));}
})().catch(error=>{console.error(error);process.exitCode=1;});
