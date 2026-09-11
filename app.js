/* Forest & You: mobile-first interface. Simulation, journey rules and vector art are separate. */
(() => {
  'use strict';
  const G = window.ForestGame, J = window.ForestJourney, V = window.ForestVillage, VV = window.ForestVillageView, {icon, petSVG} = window.ForestArt;
  const $ = id => document.getElementById(id), KEY = mode => `forest-child-mvp-v2-${mode}`;
  const LAST_MODE = 'forest-child-mvp-mode', PREFS = 'forest-child-preferences-v1';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const valid = s => G.validate(s) && J.validate(s) && V.validate(s);
  let store;
  try { store = window.ForestPersistence.create(localStorage, valid); }
  catch { store = window.ForestPersistence.create(null, valid); }
  const tokens = {}, recovered = new Set();
  let state = null, mode = 'demo', view = 'home', selectedSpecies = 'fox', draft = '', saveOK = true;
  let kind = '', opener = null, pendingImport = null, pendingImportToken = null, toastTimer, audio;
  const corrupt = new Set(), preferences = {sound: false};
  function read(name) {
    const result = store.read(name); tokens[name] = result.token;
    if (result.unavailable) saveOK = false;
    if (result.unreadable) corrupt.add(name);
    if (result.recovered) recovered.add(name);
    return result.state;
  }
  function save() {
    if (!state) return true;
    J.ensure(state); J.collect(state);
    const result = store.commit(state, tokens[state.mode] ?? null);
    if (result.reason === 'invalid-state') {
      saveOK=false; $('save-state').textContent='保存前の整合性を確認できません';
      $('save-state').classList.add('warning');
      toast('データを保存していません。設定から書き出して保管してください。');
      return false;
    }
    if (result.reason === 'conflict') {
      if (result.state) { state = result.state; tokens[state.mode] = result.token; render(); }
      saveOK = false;
      $('save-state').textContent = '別タブの変更を確認';
      $('save-state').classList.add('warning');
      toast('別のタブで村が更新されました。最新の状態を確認し、もう一度操作してください。');
      return false;
    }
    saveOK = result.ok;
    if (result.ok) tokens[state.mode] = result.token;
    $('save-state').textContent = saveOK ? '保存しました' : '保存できません・設定へ';
    $('save-state').classList.toggle('warning', !saveOK);
    return true; // Storage refusal still permits an in-memory session and export.
  }
  function toast(text) {
    clearTimeout(toastTimer);
    const notice = $('dialog-notice'), inDialog = $('modal').open && notice;
    $('toast').textContent = inDialog ? '' : text;
    $('toast').classList.toggle('visible', !inDialog);
    if (inDialog) { notice.textContent = text; notice.classList.add('visible'); }
    toastTimer = setTimeout(() => { $('toast').classList.remove('visible'); $('dialog-notice')?.classList.remove('visible'); }, 3300);
  }
  function sound() {
    if (!preferences.sound) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) return;
      audio ||= new Audio(); if (audio.state === 'suspended') audio.resume().catch(() => {});
      const gain = audio.createGain(); gain.connect(audio.destination);
      gain.gain.setValueAtTime(.0001, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.06, audio.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + .3);
      const tone = audio.createOscillator(); tone.frequency.setValueAtTime(660, audio.currentTime); tone.frequency.setValueAtTime(880, audio.currentTime + .12);
      tone.connect(gain); tone.start(); tone.stop(audio.currentTime + .32); tone.onended = () => {tone.disconnect(); gain.disconnect();};
    } catch { /* Sound is optional; never interrupt play. */ }
  }
  function effect(mood) {
    const actor = document.querySelector('.pet-actor'); if (!actor) return;
    actor.classList.remove('mood-feed', 'mood-bath', 'mood-talk');
    void actor.offsetWidth; actor.classList.add(`mood-${mood}`); // Restart on repeated taps.
    const burst = document.querySelector('.care-burst'); if (burst) { burst.textContent = mood === 'bath' ? '◌  ◯  ◌' : mood === 'feed' ? 'おいしい！' : '♥  ♥  ♥'; burst.classList.remove('show'); void burst.offsetWidth; burst.classList.add('show'); }
  }
  function outcome(result, mood, wish) {
    if (result.ok && wish) J.mark(state, wish);
    if (!save()) return false; render(); if (result.message) toast(result.message);
    if (result.ok) { if (mood) effect(mood); sound(); }
    return true;
  }
  function bar(label, value, cls, symbol) {
    const v = Math.round(value);
    return `<div class="need"><div class="stat-label"><span>${icon(symbol)}${label}</span><b>${v}</b></div><div class="bar ${cls} ${v < 25 ? 'low' : ''}" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${v}"><i style="width:${v}%"></i></div></div>`;
  }
  const traits = {kindness:'やさしい',courage:'勇敢な',curiosity:'好奇心いっぱい',discipline:'しっかり者',sociability:'人なつっこい',emotionalStability:'おだやか'};
  function character(c) { return traits[Object.keys(G.LABELS).sort((a,b) => c.personality[b] - c.personality[a])[0]]; }
  function speech(c) {
    if (c.dead) return 'ずっと、村の思い出に。';
    if (state.adventure) return '森でのつづき、待ってるね。';
    if (c.sick) return '今日は、そばにいてほしいな。';
    if (c.hunger < 30) return 'おなかが、ぐぅって。';
    if (c.hygiene < 30) return 'お風呂に入りたいな。';
    return c.reply || '今日は何して遊ぼう？';
  }
  function goalCard() {
    const q = G.QUESTS.find(q => !state.quests.includes(q.id));
    return q ? `<button class="goal-card" data-goal="${q.id}"><span class="goal-number">${state.quests.length + 1}<small>/6</small></span><span><small>はじまりの手帖</small><strong>${q.name}</strong><span>${q.detail}</span></span><b aria-hidden="true">→</b></button>` : `<button class="goal-card" data-view="village"><span class="goal-number">✓</span><span><small>はじまりの手帖、完了</small><strong>次は、どんな家族に出会う？</strong><span>新しい仲間や庭の飾りで、自分らしい暮らしを。</span></span><b aria-hidden="true">→</b></button>`;
  }
  function wishesCard() {
    const c = G.active(state), r = J.record(state), ready = r.wishes.length === 3;
    return `<section class="card wishes-card"><div class="section-heading"><h2>${icon('heart')} 今日の小さな時間</h2><span>${r.wishes.length}/3</span></div><p>できる日に、できるだけ。連続で来なくても大丈夫。</p><div class="wish-list">${Object.entries(J.WISHES).map(([key,label]) => `<button data-wish="${key}" class="wish ${r.wishes.includes(key) ? 'complete' : ''}" ${c.dead || state.adventure ? 'disabled' : ''}><span aria-hidden="true">${r.wishes.includes(key) ? '✓' : '○'}</span>${label}</button>`).join('')}</div>${ready ? `<button class="button primary wide" data-action="claim" ${r.claimed || c.dead || state.adventure ? 'disabled' : ''}>${r.claimed ? '今日のお祝いは受け取りました' : '思い出のお祝いを受け取る · 15 G'}</button>` : ''}<span class="bond-note">ふれあい ${r.bond} / 100 · お祝いを受け取った日 ${r.days}日</span></section>`;
  }
  function storyCard() {
    const c=G.active(state), r=J.record(state), done=r.storyDay===G.dayKey(state), event=J.story(state);
    return `<button class="card story-shortcut" data-action="story" ${c.dead || state.adventure || done ? 'disabled' : ''}>${icon('sun')}<span><small>今日のできごと · 1体につき1日1回</small><strong>${done ? '今日の寄り道は、手帖の中に' : event.title}</strong><small>${done ? 'また次の日に、どんな出会いがあるかな。' : 'あなたの選択で、少しずつ育つ心。'}</small></span>${icon('arrow')}</button>`;
  }
  function storyDialog() {
    const event=J.story(state), r=J.record(state), c=G.active(state);
    modal(event.title,`<div class="talk-friend">${petSVG(c)}<p>${event.text}</p></div><p>今日は、どうしてみよう？</p>${event.choices.map((o,i)=>`<button class="choice-button" data-story="${event.id}" data-story-choice="${i}" ${r.storyDay===G.dayKey(state)||c.dead||state.adventure?'disabled':''}><strong>${o.label}</strong><span>${G.ABILITIES[o.ability]}が育つ、小さな体験</span></button>`).join('')}<p class="talk-note">正解・不正解はありません。日々の選択で、能力と性格が少しずつ育ちます。</p>`,'story');
  }
  function albumCard() {
    const album=J.ensure(state).album||[];
    return `<section class="card journal-card album-section"><div class="section-heading"><h2>思い出アルバム</h2><span>${album.length} / ${J.ALBUM.length}</span></div><p>一緒に過ごして見つけた、12の小さな宝物。集める順番は自由です。</p><div class="album-grid">${J.ALBUM.map(card=>{const found=album.find(a=>a.id===card.id);return `<article class="album-card ${found?'earned':''}"><span>${icon(found?card.icon:'lock')}</span><h3>${card.name}</h3><p>${found?`見つけた日：${new Date(found.at).toLocaleDateString('ja-JP')}`:card.hint}</p></article>`;}).join('')}</div></section>`;
  }
  function homeView() {
    const c = G.active(state), blocked = c.dead || !!state.adventure, adult = G.age(state,c) >= 8;
    const garden = J.ensure(state).equipped;
    const alert = c.dead ? `${c.deathReason} 仲間の画面から、新しい子を迎えられます。` : c.sick ? 'ごはんとお風呂で回復を。元気が足りないときは、お店の薬も役立ちます。' : '';
    return `<h1 class="sr-only">森の子のおうち</h1><div class="home-grid"><section class="card habitat-card" aria-label="${esc(c.name)}のおうち"><div class="pet-heading"><div><div class="pet-name"><h2>${esc(c.name)}</h2><button class="name-edit" data-action="rename" aria-label="名前を変える">${icon('edit')}</button></div><div class="pet-meta">${G.age(state,c)}歳 <span>· Lv.${c.level} · ${character(c)}</span></div></div><button class="profile-link" data-action="profile">${icon('sprout')}<span>育ちを見る</span></button></div><div class="habitat garden-${garden}"><img class="forest-art" src="assets/forest.svg" alt="木漏れ日のある森と、小さな家"><div class="scene-top"><span>${icon('home')} こもれびの庭</span><button class="scene-tool" data-action="decorate" aria-label="庭を飾る">${icon('gift')}</button></div><div class="pet-speech">${esc(speech(c))}</div><div class="garden-props" aria-hidden="true"><span class="flowers">✿　✾　✿</span><span class="picnic-mat"></span><span class="picnic-basket">◒</span><span class="lantern-light one"></span><span class="lantern-light two"></span></div><button class="pet-actor ${c.sick ? 'sick' : ''} ${c.dead ? 'dead' : ''}" data-action="pet" aria-label="${esc(c.name)}にそっと触れる" ${blocked ? 'disabled' : ''}>${petSVG(c,adult)}</button><span class="care-burst" aria-hidden="true"></span><span class="scene-caption">${c.dead ? '一緒に過ごした日を、忘れない。' : 'タッチして、なでてみよう'}</span></div><div class="care-panel"><div class="care-stats">${bar('おなか',c.hunger,'','bowl')}${bar('きれい',c.hygiene,'blue','bath')}${bar('元気',c.health,'pink','heart')}</div><div class="care-buttons"><button class="care-button" data-action="feed" ${blocked || c.hunger >= 100 ? 'disabled' : ''}>${icon('bowl')}<span>${c.hunger >= 100 ? 'まんぷく' : 'ごはん'}</span></button><button class="care-button" data-action="bath" ${blocked || c.hygiene >= 100 ? 'disabled' : ''}>${icon('bath')}<span>${c.hygiene >= 100 ? 'ぴかぴか' : 'お風呂'}</span></button><button class="care-button" data-action="talk-open" ${blocked ? 'disabled' : ''}>${icon('chat')}<span>ことば</span></button><button class="care-button play" data-action="play-open" ${c.dead ? 'disabled' : ''}>${icon('compass')}<span>あそぶ</span></button></div>${alert ? `<p class="care-alert">${esc(alert)}</p>` : '<p class="care-hint">ごはん・お風呂・声かけは、ずっと無料。</p>'}</div></section><aside class="home-side">${goalCard()}${wishesCard()}${storyCard()}${adult && !c.dead ? `<button class="card job-shortcut" data-action="profile">${icon('briefcase')}<span><strong>${G.JOBS[c.job].name}</strong><small>8歳から、村と町でおしごと</small></span>${icon('arrow')}</button>` : ''}</aside></div>`;
  }
  function exploreView() {
    const c = G.active(state), done = c.lastDungeonDay === G.dayKey(state);
    const locked = c.dead || (!state.adventure && (done || c.sick || c.health < 40 || c.hunger < 20));
    return `<div class="page-heading"><p class="eyebrow">LITTLE ADVENTURES</p><h1>今日は、何して遊ぶ？</h1><p>競わなくても、失敗しても大丈夫。一緒の時間が宝物。</p></div><div class="activity-grid"><section class="card activity-card"><div class="activity-art memory-art">${icon('leaf')}${icon('sprout')}${icon('leaf')}</div><span class="eyebrow">のんびり · 制限時間なし</span><h2>木の実あわせ</h2><p>6枚のカードをめくって、同じ絵を見つけよう。途中で閉じても、つづきから。</p><p class="reward-hint">1日最初の完成で 12 G・賢さ +0.5</p><button class="button primary wide" data-action="memory" ${c.dead || state.adventure ? 'disabled' : ''}>${J.ensure(state).memory ? '木の実あわせのつづき' : '一緒にあそぶ'}</button></section><section class="card activity-card"><div class="activity-art adventure-art">${icon('compass')}</div><span class="eyebrow">3つの場面 · 1体につき1日1回</span><h2>森の小さな冒険</h2><p>小川の向こう、森の奥。どの道を選ぶ？育った能力で、見つかるお宝も変わります。</p><p class="reward-hint">金貨・XP・能力の成長</p><button class="button primary wide" data-action="adventure" ${locked ? 'disabled' : ''}>${state.adventure ? '探索のつづき' : done ? '今日は探索ずみ' : '森を探索'}</button>${locked && !done && !c.dead ? '<p class="care-alert">元気40・おなか20以上が目安です。病気を治してから出かけよう。</p>' : ''}</section></div>`;
  }
  function resident(c) {
    return `<article class="card resident-card ${c.id === state.active ? 'selected' : ''}"><div class="resident-portrait">${petSVG(c,G.age(state,c)>=8)}</div><h2>${esc(c.name)}</h2><p>${G.SPECIES[c.species].name} · ${G.age(state,c)}歳 · Lv.${c.level}</p><span class="personality-chip">${character(c)}</span><p class="resident-status">${c.dead ? 'ずっと大切な思い出' : c.sick ? 'お世話が必要です' : G.age(state,c)>=8 ? G.JOBS[c.job].name : `おなか ${Math.round(c.hunger)} / きれい ${Math.round(c.hygiene)}`}</p><button class="button ${c.id === state.active ? 'primary' : ''} wide" data-select="${esc(c.id)}">${c.dead ? '思い出を見る' : 'この子に会う'}</button></article>`;
  }
  function villageView() {
    const living = G.alive(state), dead = state.creatures.filter(c=>c.dead), needy = living.filter(c=>c.sick || (G.age(state,c)<8 && (c.hunger<55 || c.hygiene<55)));
    return `<div class="page-heading"><p class="eyebrow">OUR LITTLE VILLAGE</p><h1>森のなかまたち</h1><p>${living.length} / 8体の暮らし。子どもには、みんなにお世話を。</p><button class="button primary" data-action="rescue" ${living.length>=8 || state.adventure ? 'disabled' : ''}>${icon('leaf')} 新しい子を迎える</button></div>${needy.length ? `<button class="care-alert needy-link" data-select="${esc(needy[0].id)}">${needy.length}体がお世話を待っています · ${esc(needy[0].name)}に会う →</button>` : ''}${VV.scene(state)}${VV.friendships(state)}<div class="section-heading"><h2>村に暮らす仲間</h2></div><div class="village-grid">${living.map(resident).join('')}</div><section class="card discovery-strip"><h2>森での出会い ${state.discovered.length}/4</h2><div class="discovery-icons">${Object.keys(G.SPECIES).map(species=>`<div class="${state.discovered.includes(species)?'':'locked'}">${petSVG({species})}<span>${G.SPECIES[species].name}</span></div>`).join('')}</div></section>${dead.length ? `<section class="memorial"><h2>村に残る思い出</h2><p>旅立った子は、8体の枠には含まれません。</p><div class="village-grid">${dead.map(resident).join('')}</div></section>` : ''}`;
  }
  function journalView() {
    return `<div class="page-heading"><p class="eyebrow">THE DAYS WE SHARED</p><h1>一緒に過ごした日々</h1><p>できたことも、何気ないひと言も。新しい順に150件を記録します。</p></div>${albumCard()}<div class="journal-layout"><section class="card journal-card"><h2>はじまりの手帖</h2>${G.QUESTS.map(q=>`<div class="achievement ${state.quests.includes(q.id)?'complete':''}"><span aria-hidden="true">${state.quests.includes(q.id)?'✓':'○'}</span><div><h3>${q.name}</h3><p>${q.detail}</p></div><b>${q.reward} G</b></div>`).join('')}</section><section class="card journal-card"><h2>思い出の記録</h2><ol class="timeline">${state.logs.map(l=>`<li><time>${new Date(l.at).toLocaleDateString('ja-JP',{month:'short',day:'numeric'})}</time><p>${esc(l.text)}</p></li>`).join('')}</ol></section></div>`;
  }
  function render() {
    if (!state) return;
    const focus = document.activeElement, id = focus?.id, selection = focus?.selectionStart;
    const action = focus?.dataset?.action;
    J.ensure(state); $('coins').textContent=state.coins; $('nav-count').textContent=G.alive(state).length;
    const day=Math.floor((state.clockAt-state.startedAt)/G.DAY)+1;
    $('village-clock').innerHTML=`<span class="day-display">${icon('sun')} ${day}日目</span>${state.mode==='demo'?`<button class="next-day" data-action="next-day" ${state.adventure?'disabled':''}>翌日へ ${icon('arrow')}</button>`:'<span class="mode-tag">ゆっくり育成</span>'}`;
    $('mode-footer').textContent=state.mode==='demo'?'おためし · 翌日へ進むと1歳成長':'通常 · 現実1日で1歳成長';
    document.querySelectorAll('.nav-button').forEach(b=>{const on=b.dataset.view===view;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    $('main-content').innerHTML=({home:homeView,explore:exploreView,village:villageView,journal:journalView}[view]||homeView)();
    if (!$('modal').open) {
      const replacement=id?$(id):action?document.querySelector(`main [data-action="${action}"]`):null;
      if(replacement && !replacement.disabled){replacement.focus({preventScroll:true});if(typeof selection==='number' && replacement.setSelectionRange)replacement.setSelectionRange(selection,selection);}
    }
  }
  function navigate(next) { view=next; render(); window.scrollTo({top:0,behavior:'instant'}); }
  function modal(title,body,type,close=true) {
    if(!$('modal').open){ const b=document.activeElement;opener={id:b?.id,action:b?.dataset?.action,view:b?.dataset?.view}; }
    kind=type; $('modal').dataset.kind=type;
    $('modal').innerHTML=`<div class="modal-header"><h2 id="modal-title" tabindex="-1">${title}</h2>${close?'<button class="close-button" data-action="close" aria-label="閉じる">×</button>':''}</div><div class="modal-body">${body}<p class="dialog-notice" id="dialog-notice" role="status" aria-live="polite" aria-atomic="true"></p></div>`;
    if(!$('modal').open)$('modal').showModal();
    $('modal-title').focus({preventScroll:true}); $('modal').scrollTop=0;
  }
  function closeModal() {
    $('modal').close(); kind=''; pendingImport=null;
    const target=opener?.id?$(opener.id):opener?.action?document.querySelector(`[data-action="${opener.action}"]`):opener?.view?document.querySelector(`.nav-button[data-view="${opener.view}"]`):null;
    (target && !target.disabled?target:document.querySelector('.nav-button.active'))?.focus({preventScroll:true});
  }
  function speciesPicker() {return `<div class="species-picker" role="group" aria-label="迎える子の種類">${Object.entries(G.SPECIES).map(([key,c])=>`<button class="species-option ${key===selectedSpecies?'selected':''}" data-species="${key}" aria-pressed="${key===selectedSpecies}">${petSVG({species:key})}<span>${c.name}</span></button>`).join('')}</div>`;}
  function welcome(targetMode=null) {
    if(targetMode)mode=targetMode;
    modal('小さな家族に、はじめまして。',`<p class="welcome-copy">お世話と言葉で育つ、あなただけの森の子。<br>最初の子を選んで、名前をつけましょう。</p>${speciesPicker()}<label class="field-label" for="pet-name">この子の名前</label><input class="text-field" id="pet-name" maxlength="16" value="ミオ" autocomplete="off"><div class="mode-options">${targetMode?`<button class="button primary wide" data-start="${targetMode}">${targetMode==='demo'?'おためし':'通常'}モードで、はじめる</button>`:'<button class="button primary wide" data-start="demo">おためしで遊ぶ →</button><p>「翌日へ」で成長。閉じている間は時間が進みません。</p><button class="button wide" data-start="real">現実の時間で、ゆっくり育てる</button><p>現実1日で1歳。留守中も育ち、お世話が必要です。</p>'}</div>${corrupt.has(mode)?'<p class="care-alert">読み込めないデータがあります。新しく始める前に、同じブラウザ内へ退避します。</p>':''}<p class="welcome-footnote">登録不要・無料。2つの村は別々に保存します。<br>8歳で自立。50歳で寿命を迎える、小さな命です。</p>`,'welcome',!!state);
  }
  function start(targetMode) {
    const name=$('pet-name').value.trim();if(!name){toast('この子の名前を入れてください。');$('pet-name').focus();return;}
    if(corrupt.has(targetMode)){try{const old=localStorage.getItem(KEY(targetMode));if(old)localStorage.setItem(`${KEY(targetMode)}-unreadable-${Date.now()}`,old);}catch{toast('古いデータを退避できませんでした。保存設定を確認してください。');return;}corrupt.delete(targetMode);}
    const existing=read(targetMode);
    if(existing){state=existing;mode=targetMode;G.sync(state);closeModal();navigate('home');toast('保存済みの村に戻りました。仲間と記録はそのままです。');return;}
    state=G.fresh(targetMode,name,selectedSpecies); mode=targetMode; draft=''; if(!save())return;closeModal();navigate('home');toast(`${name}との暮らしが、はじまりました。ごはんをどうぞ。`);
  }
  function talkDialog() {
    const c=G.active(state), blocked=c.dead || !!state.adventure;
    modal(`${esc(c.name)}と、ことばの時間`,`<div class="talk-friend">${petSVG(c)}<div class="speech-note" aria-live="polite">${esc(c.reply)}</div></div><form id="talk-form"><label class="field-label" for="talk-input">どんな言葉を届けよう？</label><div class="talk-input-wrap"><input id="talk-input" maxlength="140" placeholder="例：今日もよく頑張ったね" value="${esc(draft)}" autocomplete="off" enterkeyhint="send" ${blocked?'disabled':''}><button type="submit" aria-label="言葉を届ける" ${blocked?'disabled':''}>${icon('send')}</button></div></form><div class="suggestions">${['よく頑張ったね','大好きだよ','調べてみよう'].map(t=>`<button data-say="${t}" ${blocked?'disabled':''}>${t}</button>`).join('')}</div><p class="talk-note">性格の成長は1日3回まで。同じ言葉は1日1回。<br>その後も、何度でも声をかけられます。<br>言葉の特徴を使う簡易会話です。生成AIとの自由会話ではありません。</p>`,'talk');
  }
  function sendWords(text) {
    draft='';outcome(G.talk(state,text),'talk','talk');
    const note=document.querySelector('.speech-note');if(note)note.textContent=G.active(state).reply;
    if($('talk-input'))$('talk-input').value='';
  }
  function profile() {
    const c=G.active(state),adult=G.age(state,c)>=8,job=G.JOBS[c.job];
    modal(`${esc(c.name)}の育ち`,`<p class="profile-meta">${G.SPECIES[c.species].name} · ${G.age(state,c)}歳 · ${character(c)}</p><div class="ability-grid">${Object.entries(G.ABILITIES).map(([key,label])=>`<div><span>${label}</span><strong>${c[key].toFixed(1)}</strong>${bar(label,c[key],'','sprout')}</div>`).join('')}</div><p>戦闘力 Lv.${c.level} · 次のレベルまで ${Math.ceil(c.level*40-c.xp)} XP</p><details class="personality-details" id="personality-details"><summary>生まれ持った性格と、言葉で育った心</summary><div class="traits-grid">${Object.entries(G.LABELS).map(([key,label])=>`<div><span>${label} <b>${c.personality[key].toFixed(1)}</b></span><div class="trait-track"><i style="width:${c.personality[key]}%"></i><em style="left:${c.personalityBase[key]}%"></em></div></div>`).join('')}</div><p>細い目印は、生まれ持った性格。声かけや経験でゆっくり変わります。</p></details><section class="settings-group"><h3>${icon('briefcase')} 村と町のおしごと</h3>${adult && !c.dead?`<label class="field-label" for="job-select">仕事を選ぶ</label><select class="job-select" id="job-select" ${state.adventure?'disabled':''}>${Object.entries(G.JOBS).map(([key,j])=>`<option value="${key}" ${key===c.job?'selected':''}>${j.place?j.place+' / ':''}${j.name}</option>`).join('')}</select><p>${c.job==='none'?'仕事を選ぶと初回の勤務。その後は1日1回、自動で働きます。':`${job.name} · 1日 ${job.coins} G / ${job.xp} XP<br>賢さ +${job.growth[0]} / 生命力 +${job.growth[1]} / 力 +${job.growth[2]}<br>次の日には、またお給料を受け取れます。`}</p>`:`<p>${c.dead?'一緒に過ごした日々は、ずっと手帖に。':`8歳から仕事ができます。あと${Math.max(0,8-G.age(state,c))}日、今はお世話と言葉の時間を。`}</p>`}</section>`,'profile');
  }
  function shop() {
    const c=G.active(state);
    modal('森の小さなお店',`<p>${esc(c.name)}への贈りもの。所持金 <b>${state.coins} G</b></p>${Object.entries(G.ITEMS).map(([key,item])=>`<article class="shop-item"><span class="round-icon">${icon(item.icon)}</span><div><h3>${item.name}</h3><p>${item.description}</p></div><button class="button" data-buy="${key}" ${c.dead || state.adventure || state.coins<item.price || (key==='scarf'&&c.scarf) || (key==='medicine'&&!c.sick&&c.health>=100) || (key==='soup'&&c.hunger>=100&&c.health>=100)?'disabled':''}>${key==='scarf'&&c.scarf?'持っている':`${item.price} G`}</button></article>`).join('')}<button class="button wide" data-action="decorate">${icon('home')} 庭の飾りを見にいく</button>`,'shop');
  }
  function decorations() {
    const j=J.ensure(state), blocked=G.active(state).dead||!!state.adventure;
    modal('あなたらしい、こもれびの庭',`<p>買った飾りはずっとあなたのもの。何度でも無料で切り替えられます。所持金 <b>${state.coins} G</b></p><div class="decor-grid">${Object.entries(J.GARDENS).map(([key,d])=>`<article class="decor-card decor-${key}"><span class="decor-preview">${icon(d.icon)}</span><h3>${d.name}</h3><p>${d.description}</p><button class="button wide ${j.equipped===key?'primary':''}" data-decor="${key}" ${blocked || j.equipped===key || (!j.owned.includes(key)&&state.coins<d.price)?'disabled':''}>${j.equipped===key?'飾っています':j.owned.includes(key)?'飾る · 無料':`${d.price} Gで迎える`}</button></article>`).join('')}</div><button class="button wide" data-decor="none" ${blocked||j.equipped==='none'?'disabled':''}>いつもの庭に戻す · 無料</button>`,'decorate');
  }
  function memoryDialog() {
    const m=J.ensure(state).memory;if(!m)return;
    const c=state.creatures.find(c=>c.id===m.petId), symbols=['leaf','acorn','flower'];
    modal('木の実あわせ',`<p>${esc(c.name)}と、同じ絵を見つけよう。<br>制限時間なし。途中で閉じても、つづきから。</p><div class="memory-summary" role="status">${m.complete?'ぜんぶそろったね！':`${m.matched.length/2} / 3組 · ${m.moves}回めくったよ`}</div><div class="memory-grid">${m.deck.map((symbol,index)=>{const shown=m.open.includes(index)||m.matched.includes(index);return `<button class="memory-card ${shown?'revealed':''} ${m.matched.includes(index)?'matched':''}" data-memory="${index}" aria-label="${index+1}枚目：${shown?J.SYMBOLS[symbol]:'裏向き'}" aria-pressed="${shown}" ${m.complete||shown||m.open.length===2?'disabled':''}>${icon(shown?symbols[symbol]:'leaf')}<span>${shown?J.SYMBOLS[symbol]:'？'}</span></button>`;}).join('')}</div>${m.open.length===2?'<p class="memory-message">違う絵だったね。場所を覚えて、もう一度。</p><button class="button primary wide" data-action="memory-hide">カードを伏せて、つづける</button>':''}${m.complete?`<div class="reward-banner">${m.rewarded?'お祝い +12 G · 賢さ +0.5':'今日はお祝いを受け取り済み。練習は何度でも。'}</div><div class="modal-actions"><button class="button" data-action="memory-replay">もう一度あそぶ</button><button class="button primary" data-action="memory-home">おうちに戻る</button></div>`:''}`,'memory');
  }
  function adventure() {
    if(!state.adventure){const result=G.beginAdventure(state);if(!result.ok){toast(result.message);return;}save();render();}
    const run=state.adventure,c=state.creatures.find(c=>c.id===run.petId),complete=run.step>=3,e=complete?null:G.ENCOUNTERS[run.step];
    modal(complete?'小さな冒険、大成功。':e.title,`<p>${esc(c.name)}の森の探索 · ${complete?'帰り道':`${run.step+1}/3`}</p><div class="adventure-steps">${[0,1,2].map(n=>`<span class="${n<run.step?'done':''}"></span>`).join('')}</div><div class="adventure-scene">${icon(complete?'gift':e.icon)}${petSVG(c)}</div>${run.lastText?`<p class="adventure-message">${esc(run.lastText)}</p>`:''}<p>${complete?'森の出口から、おうちが見えてきました。今日の宝物を持って帰ろう。':e.text}</p>${complete?`<div class="loot"><strong>${run.coins} G</strong><strong>${run.xp} XP</strong></div><button class="button primary wide" data-action="finish-adventure">おうちに帰る ${icon('home')}</button>`:`${e.choices.map((o,i)=>`<button class="choice-button" data-choice="${i}"><strong>${o.label} →</strong><span>${o.hint}</span></button>`).join('')}<div class="modal-actions"><button class="button" data-action="retreat">ここまでで帰る</button><button class="button" data-action="close">あとでつづける</button></div>`}`,'adventure');
  }
  function nextDay() {
    const needy=G.alive(state).filter(c=>G.age(state,c)<8&&(c.hunger<55||c.hygiene<55||c.sick));
    if(!needy.length){outcome(G.advance(state));return;}
    modal('明日を迎える前に',`<p>まだお世話が必要な子がいます。このまま進むと、体調を崩すことがあります。</p>${needy.map(c=>`<p>${esc(c.name)}：おなか ${Math.round(c.hunger)} / きれい ${Math.round(c.hygiene)}${c.sick?'・病気':''}</p>`).join('')}<div class="modal-actions"><button class="button" data-action="force-next-day">このまま翌日へ</button><button class="button primary" data-action="care-needy" data-id="${esc(needy[0].id)}">お世話してから</button></div>`,'next-day');
  }
  function settings() {
    modal('暮らしの設定',`<p>このブラウザに自動保存します。直前の正常な保存をバックアップし、破損時に復元します。端末間の自動同期はありません。</p>${!saveOK?'<p class="care-alert">保存できません。閉じる前にデータを書き出してください。</p>':''}<section class="settings-group"><h3>ホーム画面とオフライン</h3><p id="offline-state">${esc(window.ForestOffline?.status() || "対応環境では通信なしでも遊べるよう準備します。")}</p><p>Safariは共有メニューから「ホーム画面に追加」。対応するChromeはブラウザメニューからインストールできます。端末の設定によって表示は異なります。</p></section><section class="settings-group"><h3>音と動き</h3><button class="button wide" data-action="sound" aria-pressed="${preferences.sound}">効果音 ${preferences.sound?'オン':'オフ'}</button><p>音は初期状態でオフ。動きは端末の「視差効果を減らす」などの設定に合わせます。</p></section><section class="settings-group"><h3>時間の流れ</h3><p>${state.mode==='demo'?'おためし：「翌日へ」で全員が1歳成長。閉じている間は進みません。':'通常：現実1日で1歳。留守の間も時間が進みます。'}</p><button class="button wide" data-action="switch-mode">${state.mode==='demo'?'通常':'おためし'}モードに切り替える</button><p>2つの村は別々に保存されます。</p></section><section class="settings-group"><h3>セーブデータ</h3><div class="modal-actions"><button class="button" data-action="export">データを書き出す</button><button class="button" data-action="import">データを読み込む</button></div><input id="save-file" type="file" accept="application/json,.json" hidden></section><section class="settings-group"><h3>このモードを、はじめから</h3><button class="button danger wide" data-action="reset">新しい村でやりなおす</button></section>`,'settings');
  }
  function help() {
    modal('森の暮らし方',`<div class="help-list"><h3>ごはん、お風呂、ことば</h3><p>おうちの4つのボタンからお世話できます。キャラクターに触れると、なでられます。0〜7歳は毎日のお世話が必要。低い状態が続くと病気になり、放置すると命を落とします。</p><h3>一緒に遊んで、庭を飾る</h3><p>木の実あわせは何度でも。1日最初の完成でお祝いがあります。森の探索は1体につき1日1回。庭の飾りはゲーム内の金貨で迎え、無料で切り替えられます。</p><h3>言葉と育ち</h3><p>能力3つと性格6つは「育ちを見る」から。言葉による成長は1日3回まで。同じ言葉は1日1回。自然文の特徴を使う簡易判定で、生成AIとの自由会話ではありません。</p><h3>家族の時間</h3><p>8歳で自立し、12種類の仕事を選べます。村は最大8体、50歳で寿命を迎えます。2つの時間モードは設定から切り替えられます。</p><h3>今日の小さな時間</h3><p>ふれあい・声かけ・遊び（木の実あわせ、探索、今日のできごと）をそろえると、1体につき1日1回15 G。連続日数による罰則はありません。育成のお世話は別に必要です。</p><h3>保存について</h3><p>同じブラウザ、同じアドレスの中に保存します。履歴やサイトデータを消す前に、設定から書き出してください。登録・広告・課金・外部AIへの送信はありません。</p></div>`,'help');
  }
  function rescueDialog() {modal('森で、新しい出会い。',`<p>子どもには、みんなに日々のお世話が必要です。</p>${speciesPicker()}<label class="field-label" for="new-name">この子の名前</label><input class="text-field" id="new-name" maxlength="16" value="${['ルゥ','ノア','ピピ','トワ','ネル','ソラ','ユラ'].find(n=>!state.creatures.some(c=>c.name===n))||'ココ'}"><div class="modal-actions"><button class="button" data-action="close">また今度</button><button class="button primary" data-action="confirm-rescue">この子を迎える</button></div>`,'rescue');}
  function exportSave() {const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`morinoko-${state.mode}-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('セーブデータを書き出しました。');}
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.start){start(b.dataset.start);return;}
    if(b.dataset.species){selectedSpecies=b.dataset.species;document.querySelectorAll('[data-species]').forEach(o=>{o.classList.toggle('selected',o.dataset.species===selectedSpecies);o.setAttribute('aria-pressed',String(o.dataset.species===selectedSpecies));});return;}
    if(!state)return;G.sync(state);
    if(b.dataset.view){navigate(b.dataset.view);return;}
    if(b.dataset.site){const panel=VV.siteDialog(state,b.dataset.site);if(panel)modal(panel.title,panel.body,'village-site');return;}
    if(b.dataset.buildSite || b.dataset.visitSite){const id=b.dataset.buildSite || b.dataset.visitSite;const r=b.dataset.buildSite?V.build(state,id):V.visit(state,id);if(outcome(r)){const panel=VV.siteDialog(state,id);if(panel)modal(panel.title,panel.body,'village-site');toast(r.message);}return;}
    if(b.dataset.social){const panel=VV.meetingDialog(state,b.dataset.social);if(panel)modal(panel.title,panel.body,'meeting');return;}
    if(b.dataset.meet){const r=V.meet(state,b.dataset.partner,b.dataset.meet);closeModal();outcome(r,'talk',r.ok?'play':null);return;}
    if(b.dataset.select){if(!state.creatures.some(c=>c.id===b.dataset.select))return;state.active=b.dataset.select;draft='';save();navigate('home');return;}
    if(b.dataset.say){sendWords(b.dataset.say);return;}
    if(b.dataset.buy){const r=G.buy(state,b.dataset.buy);if(outcome(r)){shop();toast(r.message);}return;}
    if(b.dataset.decor){const r=J.decorate(state,b.dataset.decor);if(outcome(r)){decorations();toast(r.message);}return;}
    if(b.dataset.memory!==undefined){const result=J.flip(state,Number(b.dataset.memory));if(!save())return;render();memoryDialog();document.querySelector('.memory-card:not(:disabled), [data-action="memory-hide"], [data-action="memory-replay"]')?.focus({preventScroll:true});if(result.message)toast(result.message);if(result.matched||result.complete)sound();return;}
    if(b.dataset.story!==undefined){const r=J.chooseStory(state,b.dataset.story,Number(b.dataset.storyChoice));closeModal();outcome(r,'talk');return;}
    if(b.dataset.choice!==undefined){const result=G.chooseAdventure(state,Number(b.dataset.choice));save();render();if(!result.ok)toast(result.message);adventure();return;}
    let action=b.dataset.action;
    if(b.dataset.wish)action=({care:'pet',talk:'talk-open',play:'play-open'})[b.dataset.wish];
    if(b.dataset.goal)action=({feed:'feed',bath:'bath',talk:'talk-open',adventure:'adventure',adult:'next-day',work:'profile'})[b.dataset.goal];
    if(action==='feed'||action==='bath'){outcome(G.care(state,action),action,'care');return;}
    if(action==='pet'){if(G.active(state).dead||state.adventure)return;J.mark(state,'care');outcome({ok:true,message:`${G.active(state).name}が、うれしそうに寄り添ってくれました。`},'talk');}
    if(action==='close')closeModal();
    if(action==='talk-open')talkDialog();
    if(action==='profile')profile();
    if(action==='play-open')navigate('explore');
    if(action==='claim')outcome(J.claim(state),'talk');
    if(action==='village-visit-all')outcome(V.visitAll(state));
    if(action==='shop')shop();
    if(action==='decorate')decorations();
    if(action==='memory'){const r=J.startMemory(state);if(r.ok){save();memoryDialog();}else toast(r.message);}
    if(action==='memory-home'){closeModal();navigate('home');}
    if(action==='memory-hide'){J.hideCards(state);if(!save())return;memoryDialog();document.querySelector('.memory-card:not(:disabled)')?.focus({preventScroll:true});}
    if(action==='memory-replay'){J.replay(state);save();memoryDialog();}
    if(action==='adventure')adventure();
    if(action==='finish-adventure'||action==='retreat'){const id=state.adventure?.petId;const r=G.finishAdventure(state,action==='retreat');if(r.ok&&action==='finish-adventure')J.mark(state,'play',id);closeModal();navigate('home');outcome(r);}
    if(action==='next-day'){if(state.mode==='demo')nextDay();else toast('通常モードは現実の時間で育ちます。毎日少しずつ会いに来てね。');}
    if(action==='force-next-day'){closeModal();outcome(G.advance(state));}
    if(action==='care-needy'){state.active=b.dataset.id;closeModal();save();navigate('home');}
    if(action==='rescue')rescueDialog();
    if(action==='confirm-rescue'){const name=$('new-name').value.trim();if(!name){toast('名前を入れてください。');return;}const r=G.rescue(state,selectedSpecies,name);closeModal();view='home';draft='';outcome(r);window.scrollTo(0,0);}
    if(action==='rename')modal('この子の名前',`<label class="field-label" for="rename-input">新しい名前（16文字まで）</label><input class="text-field" id="rename-input" maxlength="16" value="${esc(G.active(state).name)}"><div class="modal-actions"><button class="button" data-action="close">やめる</button><button class="button primary" data-action="confirm-rename">名前を変える</button></div>`,'rename');
    if(action==='confirm-rename'){const name=$('rename-input').value.trim();if(!name){toast('名前を入れてください。');return;}const c=G.active(state);G.log(state,`${c.name}の名前を「${name}」にしました。`);c.name=name;closeModal();outcome({ok:true,message:`これからは、${name}。`});}
    if(action==='settings')settings();
    if(action==='help')help();
    if(action==='story')storyDialog();
    if(action==='sound'){preferences.sound=!preferences.sound;try{localStorage.setItem(PREFS,JSON.stringify(preferences));}catch{toast('音の設定は、この回だけ有効です。');}settings();sound();}
    if(action==='switch-mode'){save();const next=state.mode==='demo'?'real':'demo',loaded=read(next);if(!loaded){welcome(next);return;}state=loaded;mode=next;G.sync(state);save();closeModal();draft='';navigate('home');toast(`${mode==='demo'?'おためし':'通常'}モードの村に戻りました。`);}
    if(action==='export')exportSave();
    if(action==='import')$('save-file').click();
    if(action==='reset')modal('新しい村で、やりなおす？','<p>現在のモードの仲間・所持金・記録を削除します。残したい場合は、先にセーブデータを書き出してください。</p><div class="modal-actions"><button class="button" data-action="settings">やめる</button><button class="button danger" data-action="confirm-reset">このモードを初期化する</button></div>','reset');
    if(action==='confirm-reset'){const oldMode=state.mode;if(!store.clear(oldMode)){toast('保存領域を消せませんでした。現在の村はそのままです。');return;}tokens[oldMode]=null;state=null;$('main-content').innerHTML='';welcome(oldMode);}
    if(action==='confirm-import'){const imported=pendingImport;if(!imported)return;const result=store.commit(imported,pendingImportToken);if(!result.ok){toast(result.reason==='conflict'?'別タブで村が更新されています。読み込みをやり直してください。':'保存できないため、元の村は置き換えていません。');return;}pendingImport=null;state=imported;mode=state.mode;tokens[mode]=result.token;corrupt.delete(mode);G.sync(state);save();closeModal();draft='';navigate('home');toast('セーブデータを読み込みました。おかえりなさい。');}
  });
  document.addEventListener('input',event=>{if(event.target.id==='talk-input')draft=event.target.value;});
  document.addEventListener('submit',event=>{if(event.target.id!=='talk-form')return;event.preventDefault();G.sync(state);sendWords($('talk-input').value);$('talk-input')?.focus({preventScroll:true});});
  document.addEventListener('change',async event=>{
    if(event.target.id==='job-select'){G.sync(state);const r=G.setJob(state,event.target.value);if(outcome(r)){profile();toast(r.message);$('job-select')?.focus({preventScroll:true});}}
    if(event.target.id!=='save-file')return;
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    try{if(file.size>2e6)throw new Error('size');const candidate=JSON.parse(await file.text());if(!valid(candidate))throw new Error('schema');pendingImport=candidate;pendingImportToken=store.read(candidate.mode).token;modal('この村を、読み込みますか？',`<p>${candidate.mode==='demo'?'おためし':'通常'}モードの村を置き換えます。<br>仲間 ${G.alive(candidate).length}体 / ${candidate.coins} G${candidate.mode==='real'?'<br>通常モードは保存後の時間も反映します。':''}</p><div class="modal-actions"><button class="button" data-action="settings">やめる</button><button class="button primary" data-action="confirm-import">読み込む</button></div>`,'import');}catch{pendingImport=null;toast('読み込めませんでした。森の子の有効なセーブデータを選んでください。');}
  });
  $('modal').addEventListener('cancel',event=>{if(kind==='welcome'&&!state){event.preventDefault();return;}event.preventDefault();closeModal();});
  $('modal').addEventListener('click',event=>{if(event.target!==$('modal')||(!state&&kind==='welcome'))return;const r=$('modal').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal();});
  $('brand-mark').innerHTML=icon('leaf');$('settings-button').innerHTML=icon('settings');
  document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
  document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();if(state)navigate('home');});
  try{mode=localStorage.getItem(LAST_MODE)==='real'?'real':'demo';const pref=JSON.parse(localStorage.getItem(PREFS)||'{}');preferences.sound=pref?.sound===true;}catch{ /* Optional preferences do not invalidate the village. */ }
  state=read(mode);
  if(!state && !read('real') && !corrupt.has('real')){
    try{for(const key of ['pet-game-v1','forest-child-prototype-v1']){const raw=localStorage.getItem(key);if(raw){const migrated=G.migrate(JSON.parse(raw));if(migrated){state=migrated;mode='real';break;}}}}catch{ /* Preserve unreadable legacy source data. */ }
  }
  if(state){G.sync(state);render();save();if(recovered.has(mode))toast('前回正常に保存できたデータから村を復元しました。読み込めないデータも退避しています。');}else welcome();
  setInterval(()=>{if(!state||document.hidden||$('modal').open)return;G.sync(state);if(state.mode==='real')render();save();},30000);
  document.addEventListener('visibilitychange',()=>{if(!state||document.hidden)return;G.sync(state);if(!$('modal').open)render();save();});
  window.addEventListener('pagehide',()=>{if(state){G.sync(state);save();}});
  window.addEventListener('storage',event=>{
    if(!state||event.key!==KEY(state.mode))return;
    const latest=store.read(state.mode);
    if(latest.unavailable)return;
    if(!latest.state){if(latest.token===null){state=null;tokens[mode]=null;$('main-content').innerHTML='';welcome(mode);}return;}
    state=latest.state;tokens[state.mode]=latest.token;G.sync(state);closeModal();render();
    toast('別のタブの変更を反映しました。');
  });
})();
