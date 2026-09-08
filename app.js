/* UI for the local-first Forest & You MVP. No external requests or libraries. */
(() => {
  'use strict';
  const G = window.ForestGame, $ = id => document.getElementById(id);
  const KEY = mode => `forest-child-mvp-v2-${mode}`, LAST_MODE = 'forest-child-mvp-mode';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icons = {
    leaf: '<path d="M5 19C3 8 9 3 21 3c0 12-5 18-16 16Z"/><path d="m3 21 12-12m-7 7-1-5m5 1h5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
    moon: '<path d="M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z"/>',
    bowl: '<path d="M3 12h18c0 5-4 8-9 8s-9-3-9-8Zm4 9h10M8 8c-3-2 2-3 0-5m5 5c-3-2 2-3 0-5m5 5c-3-2 2-3 0-5"/>',
    bath: '<path d="M3 13h18v3c0 3-3 4-9 4s-9-1-9-4ZM5 13V6a3 3 0 0 1 6 0M6 20v2m12-2v2"/><circle cx="16" cy="7" r="2"/><circle cx="21" cy="3" r="1"/>',
    heart: '<path d="M12 21 3.5 12.4A5.5 5.5 0 0 1 12 5.5a5.5 5.5 0 0 1 8.5 6.9Z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/>',
    chat: '<path d="M21 11a8 8 0 0 1-8 8H8l-5 3V11a9 9 0 0 1 18 0Z"/><path d="M7 10h10M7 14h6"/>',
    send: '<path d="m21 3-7 18-4-7-7-4 18-7ZM10 14 21 3"/>',
    settings: '<path d="m10 3 4 0 .6 2.2 2.3 1.3 2.2-.6 2 3.5-1.6 1.6v2.7l1.6 1.6-2 3.5-2.2-.6-2.3 1.3L14 22h-4l-.6-2.2-2.3-1.3-2.2.6-2-3.5 1.6-1.6v-2.7L2.9 9.7l2-3.5 2.2.6 2.3-1.3Z"/><circle cx="12" cy="12.5" r="3"/>',
    gift: '<path d="M3 9h18v4H3zM5 13v8h14v-8M12 9v12"/><path d="M12 9C2 9 5 0 9 4l3 5Zm0 0c10 0 7-9 3-5l-3 5Z"/>',
    book: '<path d="M12 5C8 2 4 3 2 4v16c3-2 7-2 10 0 3-2 7-2 10 0V4c-3-1-6-2-10 1Zm0 0v15"/>',
    sprout: '<path d="M12 22V11M12 15C3 16 2 10 2 6c8-1 10 3 10 9Zm0-5c1-7 5-8 10-8 0 6-4 9-10 8Z"/>',
    home: '<path d="m2 11 10-9 10 9M5 9v12h14V9M9 21v-8h6v8"/>',
    briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12c6 4 12 4 18 0M10 14h4"/>',
    edit: '<path d="m4 16-1 5 5-1L21 7l-4-4ZM14 6l4 4"/>',
    water: '<path d="M3 8c3-3 6 3 9 0s6 3 9 0M3 14c3-3 6 3 9 0s6 3 9 0M3 20c3-3 6 3 9 0s6 3 9 0"/>',
    lock: '<rect x="5" y="10" width="14" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>'
  };
  function icon(name) { return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.leaf}</svg>`; }
  function petSVG(c, isAdult = false) {
    const species = G.SPECIES[c.species] ? c.species : 'fox', p = G.SPECIES[species];
    const ears = {
      fox: `<path d="m48 85-9-59q28 4 41 35m40 0q13-31 41-35l-9 59" fill="${p.color}"/><path d="m49 64-4-25 24 24m62 0 24-24-4 25" fill="#f5d7b6"/>`,
      rabbit: `<ellipse cx="66" cy="46" rx="17" ry="43" transform="rotate(-10 66 46)" fill="${p.color}"/><ellipse cx="133" cy="43" rx="17" ry="43" transform="rotate(12 133 43)" fill="${p.color}"/><ellipse cx="66" cy="42" rx="8" ry="29" transform="rotate(-10 66 42)" fill="#eabfb1"/><ellipse cx="134" cy="40" rx="8" ry="29" transform="rotate(12 134 40)" fill="#eabfb1"/>`,
      bear: `<circle cx="51" cy="65" r="25" fill="${p.color}"/><circle cx="149" cy="65" r="25" fill="${p.color}"/><circle cx="51" cy="65" r="13" fill="${p.pale}"/><circle cx="149" cy="65" r="13" fill="${p.pale}"/>`,
      cat: `<path d="m43 89 4-60 36 32m34 0 36-32 4 60" fill="${p.color}"/><path d="m52 66 0-24 21 22m54 0 21-22v24" fill="#d7c6b5"/>`
    };
    const tail = species === 'fox' ? `<path d="M135 186c38 9 60-25 49-57-3 21-30 11-45 27" fill="${p.color}"/><path d="M182 152c5-8 5-16 2-23-2 10-10 13-19 16l4 16Z" fill="${p.pale}"/>` : species === 'cat' ? `<path d="M139 179q53 10 37-28" stroke="${p.color}" stroke-width="17" stroke-linecap="round" fill="none"/>` : `<circle cx="146" cy="177" r="15" fill="${p.pale}"/>`;
    return `<svg class="pet-art" viewBox="0 0 200 220" fill="none" aria-hidden="true"><ellipse cx="102" cy="206" rx="58" ry="8" fill="#526d3e" opacity=".12"/>${tail}<ellipse cx="100" cy="162" rx="${isAdult ? 49 : 44}" ry="43" fill="${p.color}"/><ellipse cx="100" cy="167" rx="29" ry="32" fill="${p.pale}"/><ellipse cx="66" cy="199" rx="20" ry="11" fill="${p.color}"/><ellipse cx="134" cy="199" rx="20" ry="11" fill="${p.color}"/><ellipse cx="56" cy="165" rx="12" ry="24" transform="rotate(15 56 165)" fill="${p.color}"/><ellipse cx="144" cy="165" rx="12" ry="24" transform="rotate(-15 144 165)" fill="${p.color}"/>${ears[species]}<path d="M100 57c43 0 65 24 65 58 0 34-30 46-65 46s-65-12-65-46c0-34 22-58 65-58Z" fill="${p.color}"/>${species === 'fox' ? `<path d="M36 112q31-9 64 23 33-32 64-23c0 36-33 46-64 46s-64-10-64-46Z" fill="${p.pale}"/>` : `<ellipse cx="100" cy="132" rx="33" ry="22" fill="${p.pale}"/>`}${species === 'cat' ? '<path d="m89 59 3 12m8-13v12m11-11-3 12" stroke="#85947e" stroke-width="4" stroke-linecap="round"/>' : ''}<g class="pet-eyes">${c.dead ? '<path d="m68 106 10 10m-10 0 10-10m44 0 10 10m-10 0 10-10" stroke="#544b3e" stroke-width="3" stroke-linecap="round"/>' : c.sick ? '<path d="m68 114 10-3m44 0 10 3" stroke="#544b3e" stroke-width="3" stroke-linecap="round"/>' : '<ellipse cx="74" cy="111" rx="4.5" ry="6" fill="#50473b"/><ellipse cx="126" cy="111" rx="4.5" ry="6" fill="#50473b"/><circle cx="75" cy="109" r="1.4" fill="#fffbea"/><circle cx="127" cy="109" r="1.4" fill="#fffbea"/>'}</g><ellipse cx="60" cy="128" rx="10" ry="5" fill="#d3937c" opacity=".45"/><ellipse cx="140" cy="128" rx="10" ry="5" fill="#d3937c" opacity=".45"/><path d="M95 127q5-4 10 0-1 7-5 7t-5-7Z" fill="#77604a"/><path d="M100 133v4m-7 0q3 7 7 0 4 7 7 0" stroke="#8a6c50" stroke-width="1.8" stroke-linecap="round"/>${c.scarf ? '<path d="M65 149q35 15 70 0v13q-35 13-70 0Z" fill="#bb7562"/><path d="m113 160 12 31 13-7-14-27" fill="#bd7965"/><path d="m124 182 10-4" stroke="#e3b29a" stroke-width="3"/>' : isAdult ? '<path d="M89 152q10 6 22 0l-7 14-5-8-8 8Z" fill="#91a16e"/>' : ''}</svg>`;
  }
  let state = null, view = 'home', mode = 'demo', selectedSpecies = 'fox', dialogKind = '', toastTimer, draft = '', saveOK = true, corruptModes = new Set();
  function read(modeName) {
    let raw;
    try { raw = localStorage.getItem(KEY(modeName)); }
    catch { saveOK = false; return null; }
    try {
      if (raw) { const parsed = JSON.parse(raw); if (G.validate(parsed) && parsed.mode === modeName) return parsed; corruptModes.add(modeName); }
    } catch { corruptModes.add(modeName); }
    return null;
  }
  function save() {
    if (!state) return;
    try { localStorage.setItem(KEY(state.mode), JSON.stringify(state)); localStorage.setItem(LAST_MODE, state.mode); saveOK = true; }
    catch { saveOK = false; }
    $('save-state').textContent = saveOK ? '自動保存しました' : '保存できません・設定で書き出し';
    $('save-state').classList.toggle('warning', !saveOK);
  }
  function toast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').classList.add('visible'); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3800); }
  function outcome(result, mood) {
    save(); render(); if (result.message) toast(result.message);
    if (mood && result.ok) { const actor = document.querySelector('.pet-actor'); if (actor) actor.classList.add(`mood-${mood}`); }
  }
  function status(c) { return c.dead ? '村の思い出' : c.sick ? 'お世話が必要' : G.age(state, c) >= 8 ? '大人・自立' : 'すくすく成長中'; }
  function bar(label, value, type, symbol) { return `<div><div class="stat-label"><span>${icon(symbol)}${label}</span><b>${Math.round(value)}<span class="sr-only"></span></b></div><div class="bar ${type} ${value < 25 ? 'low' : ''}" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(value)}"><i style="width:${value}%"></i></div></div>`; }
  function questCard() {
    const q = G.QUESTS.find(q => !state.quests.includes(q.id)), count = state.quests.length;
    return `<section class="card card-padding quest-card"><div class="quest-top"><div><p class="eyebrow">YOUR LITTLE JOURNEY</p><h2>はじまりの手帖</h2></div><span class="quest-progress">${count} / 6</span></div><div class="quest-current"><span class="quest-ring">${q ? String(count + 1).padStart(2, '0') : '✓'}</span><div><h3>${q ? q.name : 'はじめの一歩、ぜんぶできたね。'}</h3><p>${q ? q.detail : '別の仕事を試したり、新しい仲間を迎えたり。村の暮らしは、これからも続きます。'}</p>${q ? `<div class="quest-reward"><span class="coin-mark">G</span> ${q.reward} G のお祝い</div>` : ''}</div></div><div class="quest-dots">${G.QUESTS.map(q => `<i class="${state.quests.includes(q.id) ? 'done' : ''}"></i>`).join('')}</div></section>`;
  }
  function homeView() {
    const c = G.active(state), adult = G.age(state, c) >= 8, done = c.lastDungeonDay === G.dayKey(state), blocked = c.dead || !!state.adventure;
    const traitTop = Object.keys(G.LABELS).sort((a, b) => c.personality[b] - c.personality[a])[0];
    const personalityWords = { kindness: 'やさしい', courage: '勇敢な', curiosity: '好奇心いっぱいの', discipline: 'しっかり者の', sociability: '人なつっこい', emotionalStability: 'おだやかな' };
    const speech = c.dead ? 'ずっと、村の思い出に。' : c.sick ? 'そばにいてくれる？' : c.hunger < 30 ? 'おなかが、ぐぅって。' : c.hygiene < 30 ? 'お風呂に入りたいな。' : adult ? '今日は、何をしようかな。' : 'ねえ、今日は何して遊ぶ？';
    const job = G.JOBS[c.job], pals = G.alive(state).length;
    return `<div class="home-grid"><div class="main-column"><section class="card habitat-card" aria-label="${esc(c.name)}のおうち"><div class="habitat"><img class="forest-art" src="assets/forest.svg" alt="小さな家と木漏れ日のある森の村"><div class="scene-top"><span class="scene-label">${icon('home')} こもれびの庭</span><span class="weather">${icon('sun')} 穏やかな晴れ</span></div><div class="pet-speech">${speech}</div><button class="pet-actor ${c.sick ? 'sick' : ''} ${c.dead ? 'dead' : ''}" data-action="pet" aria-label="${esc(c.name)}にそっと触れる" ${c.dead ? 'disabled' : ''}>${petSVG(c, adult)}</button><i class="firefly one"></i><i class="firefly two"></i><i class="firefly three"></i><div class="scene-caption">あなたと過ごす、なんでもない日。</div></div><div class="pet-detail"><div class="pet-name-row"><div class="pet-name"><h2>${esc(c.name)}</h2><button class="name-edit" data-action="rename" aria-label="名前を変える">${icon('edit')}</button><span class="species-label">${G.SPECIES[c.species].name}</span></div><span class="status-pill ${c.sick ? 'warning' : ''}">${status(c)}</span></div><div class="pet-meta"><b>${G.age(state, c)}歳</b><span class="meta-dot">/</span><span>Lv. ${c.level}</span><span class="meta-dot">·</span><span>${personalityWords[traitTop]}${adult ? '大人' : '子'}</span></div><div class="care-stats">${bar('おなか', c.hunger, '', 'bowl')}${bar('きれい', c.hygiene, 'blue', 'bath')}${bar('元気', c.health, 'pink', 'heart')}</div><div class="care-buttons"><button class="care-button" data-action="feed" ${blocked || c.hunger >= 100 ? 'disabled' : ''}>${icon('bowl')} ごはん</button><button class="care-button" data-action="bath" ${blocked || c.hygiene >= 100 ? 'disabled' : ''}>${icon('bath')} お風呂</button><button class="care-button explore" data-action="adventure" ${c.dead || (!state.adventure && (done || c.sick || c.health < 40 || c.hunger < 20)) ? 'disabled' : ''}>${icon('compass')} ${state.adventure ? '探索のつづき' : done ? '探索ずみ' : '森を探索'}</button></div><p class="care-hint">${state.adventure ? '途中の冒険が待っています。探索のつづきへ。' : done ? '今日のお出かけはおしまい。また明日、出かけよう。' : 'ごはんとお風呂は無料。森の探索は、1日1回。'}</p>${c.dead ? `<div class="care-alert">${esc(c.deathReason)}<br>「村のなかま」から新しい子を迎えられます。</div>` : c.sick ? '<div class="care-alert">体調を崩しています。おなかときれいを56以上にしてあげてください。元気が足りないときは、お店の薬も役立ちます。</div>' : !adult && (c.hunger < 30 || c.hygiene < 30) ? '<div class="care-alert">少しお世話が必要です。ごはんとお風呂を済ませてから、次の日を迎えましょう。</div>' : ''}</div></section>
    <section class="card card-padding"><div class="section-heading"><h2 class="growth-top">${icon('sprout')} この子の育ち</h2><span class="tiny">経験が、少しずつ力になる</span></div><div class="ability-grid">${Object.entries(G.ABILITIES).map(([k, name]) => `<div><div class="ability-label">${name}</div><div class="ability-value">${c[k].toFixed(1)}</div><div class="bar"><i style="width:${c[k]}%"></i></div></div>`).join('')}</div><p class="ability-note">戦闘力 Lv. ${c.level} <span class="meta-dot">/</span> 次のレベルまで ${Math.ceil(c.level * 40 - c.xp)} XP</p><details class="personality-details" id="personality-details"><summary>生まれ持った性格と、言葉で育った心</summary><div class="traits-grid">${Object.entries(G.LABELS).map(([k, name]) => `<div><div class="trait-label"><span>${name}</span><b>${c.personality[k].toFixed(1)}</b></div><div class="trait-track"><i style="width:${c.personality[k]}%"></i><em style="left:${c.personalityBase[k]}%" title="生まれ持った値 ${c.personalityBase[k]}"></em></div></div>`).join('')}</div><p class="ability-note">細い目印は生まれ持った性格。声かけや経験で、ゆっくり変わります。</p></details></section>
    <section class="card card-padding"><div class="section-heading"><h2 class="growth-top">${icon('briefcase')} ${adult && !c.dead ? '村と町のおしごと' : '大人になったら'}</h2><span class="tiny">8歳から</span></div>${adult && !c.dead ? `<label class="tiny" for="job-select">${esc(c.name)}の仕事を選ぶ</label><select class="job-select" id="job-select" ${state.adventure ? 'disabled' : ''}>${Object.entries(G.JOBS).map(([key, job]) => `<option value="${key}" ${c.job === key ? 'selected' : ''}>${job.place ? job.place + ' / ' : ''}${job.name}</option>`).join('')}</select><p class="job-description">${c.job === 'none' ? '仕事を選ぶと、初回の勤務を始めます。その後は1日1回、自動で働きます。' : `${job.name}：1日 ${job.coins} G・${job.xp} XP<br>賢さ +${job.growth[0]} / 生命力 +${job.growth[1]} / 力 +${job.growth[2]}<br>今日の勤務は完了。${state.mode === 'demo' ? '「翌日へ」で' : '明日になったら'}、またお給料を受け取れます。`}</p>` : `<div class="job-locked"><span class="round-icon">${icon('briefcase')}</span><div><h3>いつか、この村を支える一員に。</h3><p>${c.dead ? '一緒に過ごした日々は、育ちの記録に。' : `あと${Math.max(0, 8 - G.age(state, c))}日で自立。農業、薬草師、お店の仕事……<br>どんな暮らしを選ぶか、今から楽しみ。`}</p></div></div>`}</section></div>
    <aside class="side-column"><section class="card card-padding talk-card"><div class="section-heading"><h2 class="talk-title">${icon('chat')} ことばの時間</h2><span class="tiny">心を、少しずつ</span></div><p class="tiny">何気ないひと言も、この子の宝物。</p><div class="speech-note" aria-live="polite">${esc(c.reply)}</div><form id="talk-form"><label class="tiny" for="talk-input">${esc(c.name)}に、声をかける</label><div class="talk-input-wrap" style="margin-top:8px"><input id="talk-input" name="message" maxlength="140" placeholder="今日はどんな言葉を届けよう？" value="${esc(draft)}" autocomplete="off" ${blocked ? 'disabled' : ''}><button aria-label="言葉を届ける" type="submit" ${blocked ? 'disabled' : ''}>${icon('send')}</button></div></form><div class="suggestions"><button data-say="よく頑張ったね" ${blocked ? 'disabled' : ''}>よく頑張ったね</button><button data-say="大好きだよ" ${blocked ? 'disabled' : ''}>大好きだよ</button><button data-say="調べてみよう" ${blocked ? 'disabled' : ''}>調べてみよう</button></div><p class="talk-note">言葉の成長は1日3回まで。同じ言葉は1日1回。<br>たくさん話しかけても大丈夫です。</p></section>${questCard()}<section class="card card-padding"><div class="village-peek"><span class="mini-avatar">${petSVG(c)}</span><div class="peek-copy"><p>森の村に、${pals}体の暮らし。</p><span class="tiny">小さな出会いが、待っています。</span></div></div><button class="peek-link" data-view="village" style="margin-top:15px">村のなかまに会う →</button></section></aside></div>`;
  }
  function resident(c) {
    return `<article class="card resident-card ${c.id === state.active ? 'selected' : ''}"><div class="resident-portrait">${petSVG(c, G.age(state, c) >= 8)}</div><h3>${esc(c.name)}</h3><p class="tiny">${G.SPECIES[c.species].name} <span class="meta-dot">·</span> ${G.age(state, c)}歳 <span class="meta-dot">·</span> Lv.${c.level}</p><p class="resident-status">${c.sick ? '体調を崩しています' : c.dead ? 'ずっと大切な思い出' : G.age(state, c) >= 8 ? (c.job === 'none' ? '村でのんびり暮らしています' : G.JOBS[c.job].name) : `おなか ${Math.round(c.hunger)} / きれい ${Math.round(c.hygiene)}`}</p><button class="button ${c.id === state.active ? 'primary' : ''}" data-select="${c.id}">${c.dead ? '思い出を見る' : c.id === state.active ? 'この子のおうちへ' : 'この子に会いにいく'}</button></article>`;
  }
  function villageView() {
    const living = G.alive(state), dead = state.creatures.filter(c => c.dead);
    return `<div class="page-heading"><div><p class="eyebrow">OUR LITTLE VILLAGE</p><h2>それぞれの、小さな暮らし。</h2><p class="subtle">村には ${living.length} / 8 体。子どものうちは、みんなにお世話を。</p></div><button class="button primary" data-action="rescue" ${living.length >= 8 || state.adventure ? 'disabled' : ''}>${icon('leaf')} 新しい子を迎える</button></div><div class="village-grid">${living.map(resident).join('')}</div>${!living.length ? '<div class="card empty-state"><h2>また、新しい出会いから。</h2><p>森のはずれで、小さな子があなたを待っています。</p><button class="button primary" data-action="rescue">新しい子を迎える</button></div>' : ''}<div class="discovery-strip"><div><h3>森で出会った子たち</h3><p>4種類のうち ${state.discovered.length} 種類に出会いました。</p></div><div class="discovery-icons">${Object.keys(G.SPECIES).map(species => `<div class="${state.discovered.includes(species) ? '' : 'locked'}" title="${G.SPECIES[species].name}">${petSVG({ species })}</div>`).join('')}</div></div>${dead.length ? `<section class="memorial"><div class="section-heading"><h2>村に残る思い出</h2><span class="tiny">旅立った子は、村の8体に含まれません。</span></div><div class="village-grid">${dead.map(resident).join('')}</div></section>` : ''}`;
  }
  function journalView() {
    const symbols = { life: 'leaf', milestone: 'sprout', care: 'heart', work: 'briefcase', talk: 'chat', adventure: 'compass' };
    return `<div class="page-heading"><div><p class="eyebrow">THE DAYS WE SHARED</p><h2>一緒に過ごした日々。</h2><p class="subtle">小さな出来事も、大きな一歩も。新しい順に150件を記録します。</p></div></div><div class="journal-layout"><section class="card log-list" aria-label="育成の記録">${state.logs.map(l => `<article class="log-entry ${esc(l.type)}"><span class="log-symbol">${icon(symbols[l.type])}</span><div><p>${esc(l.text)}</p><time>${state.mode === 'demo' ? `おためし ${Math.max(1, Math.floor((l.at - state.startedAt) / G.DAY) + 1)}日目` : new Date(l.at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></div></article>`).join('')}</section><aside><section class="card card-padding"><div class="section-heading"><h2>はじまりの手帖</h2><span class="tiny">${state.quests.length} / 6</span></div>${G.QUESTS.map(q => `<div class="achievement ${state.quests.includes(q.id) ? 'complete' : ''}"><span class="quest-ring">${state.quests.includes(q.id) ? '✓' : '·'}</span><div><h3>${q.name}</h3><p>${q.detail}</p></div></div>`).join('')}</section></aside></div>`;
  }
  function render() {
    if (!state) return;
    const focusId = document.activeElement?.id, selection = document.activeElement?.selectionStart;
    const detailsOpen = $('personality-details')?.open;
    $('coins').textContent = state.coins; $('nav-count').textContent = G.alive(state).length;
    const day = Math.floor((state.clockAt - state.startedAt) / G.DAY) + 1;
    $('village-clock').innerHTML = `<div class="day-display">${icon('sun')} ${day}日目 <span class="mode-tag">${state.mode === 'demo' ? 'おためし' : 'ゆっくり育成'}</span></div>${state.mode === 'demo' ? `<button class="next-day" data-action="next-day" ${state.adventure ? 'disabled' : ''}>${icon('moon')} 翌日へ進む →</button>` : '<span class="tiny">現実の1日で、1歳ずつ。</span>'}`;
    $('mode-footer').textContent = state.mode === 'demo' ? 'おためしモード · 翌日へ進むと1歳成長' : '通常モード · 現実1日で1歳成長';
    document.querySelectorAll('.nav-button').forEach(b => { const on = b.dataset.view === view; b.classList.toggle('active', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    $('main-content').innerHTML = view === 'home' ? homeView() : view === 'village' ? villageView() : journalView();
    if (detailsOpen && $('personality-details')) $('personality-details').open = true;
    if (focusId && $(focusId) && !$('modal').open) { $(focusId).focus({ preventScroll: true }); if (typeof selection === 'number' && $(focusId).setSelectionRange) $(focusId).setSelectionRange(selection, selection); }
  }
  function modal(title, body, kind, close = true) {
    dialogKind = kind;
    $('modal').innerHTML = `<div class="modal-header"><h2 id="modal-title">${title}</h2>${close ? '<button class="close-button" data-action="close" aria-label="閉じる">×</button>' : ''}</div>${body}`;
    if (!$('modal').open) $('modal').showModal();
  }
  function closeModal() { $('modal').close(); dialogKind = ''; }
  function speciesPicker() { return `<div class="species-picker" role="group" aria-label="迎える子の種類">${Object.entries(G.SPECIES).map(([key, species]) => `<button class="species-option ${selectedSpecies === key ? 'selected' : ''}" data-species="${key}" aria-pressed="${selectedSpecies === key}">${petSVG({ species: key })}${species.name}</button>`).join('')}</div>`; }
  function welcome(modeName = null) {
    mode = modeName || mode;
    const corrupt = corruptModes.has(mode);
    modal('森の子へ、ようこそ。', `<div class="welcome-illustration">${petSVG({ species: selectedSpecies })}</div><div class="welcome-heading"><p class="eyebrow">A NEW FRIEND IS WAITING.</p><h2>この子と、<br>小さな暮らしをはじめよう。</h2><p>森のはずれで出会った、小さな命。<br>あなたのお世話とことばで、少しずつ育ちます。</p></div>${speciesPicker()}<label class="field-label" for="pet-name">最初の子に、名前をつけてください</label><input class="text-field" id="pet-name" maxlength="16" value="ミオ" autocomplete="off"><div class="mode-options">${modeName ? `<button class="button primary wide" data-start="${modeName}">${modeName === 'demo' ? 'おためしモード' : '通常モード'}で はじめる ${icon('arrow')}</button>` : `<button class="button primary wide" data-start="demo">おためしで遊ぶ ${icon('arrow')}</button><p class="mode-explanation">おすすめ。「翌日へ」で時間を進めて、<br>10分ほどで成長や仕事まで体験できます。</p><button class="button wide" data-start="real">現実の時間で、ゆっくり育てる</button><p class="mode-explanation">現実1日で1歳。ブラウザを閉じている間も育ちます。</p>`}</div>${corrupt ? '<p class="modal-error">このモードの保存データを読み込めませんでした。新しく始めると、古いデータは同じブラウザ内に退避します。</p>' : ''}<p class="welcome-footnote">登録不要・無料。2つのモードは別々に保存します。<br>子どもは日々のお世話が必要。8歳で自立、50歳で寿命を迎えます。</p>`, 'welcome', !!state);
  }
  function settings() {
    modal('暮らしの設定', `<p class="modal-copy">このブラウザに、自動で保存しています。別の端末へ持っていくときは、セーブデータを書き出してください。</p>${!saveOK ? '<p class="modal-error">ブラウザへの保存に失敗しています。閉じる前にデータを書き出してください。</p>' : ''}<div class="settings-group"><h3>時間の流れ</h3><p>現在は${state.mode === 'demo' ? 'おためしモード。「翌日へ」で全員の時間が進みます。' : '通常モード。現実1日＝1歳。留守の時間も進みます。'}<br>モードごとに村を保存するので、切り替えても続きから遊べます。</p><button class="button" data-action="switch-mode">${state.mode === 'demo' ? '通常モード' : 'おためしモード'}に切り替える</button></div><div class="settings-group"><h3>セーブデータ</h3><button class="button" data-action="export">データを書き出す</button><button class="button" data-action="import">データを読み込む</button><input id="save-file" type="file" accept="application/json,.json" hidden></div><div class="settings-group"><h3>このモードを、はじめから</h3><p>もうひとつのモードの村には影響しません。</p><button class="button danger" data-action="reset">新しい村でやりなおす</button></div>`, 'settings');
  }
  function help() {
    modal('森の暮らし方', `<p class="modal-copy">お世話と言葉で、少しずつ「あなたが育てた子」に。決まった正解はありません。</p><div class="help-list">${[
      ['bowl', 'まずは、ごはんとお風呂', '無料でお世話できます。0〜7歳は毎日のお世話が必要。低い状態が続くと病気になり、そのままだと命を落とします。'],
      ['chat', '言葉で、心が育ちます', '声かけは性格6つの軸に、少しずつ影響します。成長は1日3回まで。自由な文章に短い反応を返す簡易会話です。'],
      ['compass', '1日1回、小さな冒険へ', '3つの出来事で道を選び、金貨と経験を持ち帰りましょう。能力で結果が変わります。途中で閉じても続きから遊べます。'],
      ['briefcase', '8歳になったら、仕事へ', '成人後は自分で食事と清潔を保ちます。12の仕事から1つ選ぶと、1日1回自動で働きます。仕事を変更しても同じ日に二重には働きません。'],
      ['moon', '2つの時間の流れ', 'おためしは「翌日へ」で全員が1歳成長。通常は現実1日＝1歳。50歳で寿命を迎えます。モードは設定から切り替えられます。'],
      ['home', '最大8体の、小さな村', '新しい子は「村のなかま」から迎えられます。子ども全員にお世話を。旅立った子は思い出として残り、8体の枠には含まれません。']
    ].map(([i, title, text]) => `<div>${icon(i)}<section><h3>${title}</h3><p>${text}</p></section></div>`).join('')}</div><div class="modal-actions"><button class="button primary" data-action="close">村へ戻る</button></div>`, 'help');
  }
  function shop() {
    const c = G.active(state);
    modal('森の小さなお店', `<p class="modal-copy">${esc(c.name)}への贈りもの。買ったものは、その場で使います。</p><p class="tiny" style="margin-top:8px">いまのお財布：${state.coins} G</p>${Object.entries(G.ITEMS).map(([key, item]) => `<article class="shop-item"><span class="round-icon">${icon(item.icon)}</span><div class="shop-item-copy"><h3>${item.name}</h3><p>${item.description}</p></div><button class="button" data-buy="${key}" ${c.dead || state.adventure || state.coins < item.price || (key === 'scarf' && c.scarf) || (key === 'medicine' && !c.sick && c.health >= 100) || (key === 'soup' && c.hunger >= 100 && c.health >= 100) ? 'disabled' : ''}>${key === 'scarf' && c.scarf ? '持っている' : `${item.price} G`}</button></article>`).join('')}`, 'shop');
  }
  function adventure() {
    const a = state.adventure;
    if (!a) { const result = G.beginAdventure(state); if (!result.ok) { toast(result.message); return; } save(); render(); }
    const run = state.adventure, c = state.creatures.find(c => c.id === run.petId), complete = run.step >= 3;
    const e = complete ? null : G.ENCOUNTERS[run.step];
    modal(complete ? '小さな冒険、大成功。' : e.title, `<p class="tiny">${esc(c.name)}の森の探索 <span class="meta-dot">·</span> ${complete ? '帰り道' : `${run.step + 1} / 3`}</p><div class="adventure-steps">${[0, 1, 2].map(n => `<span class="${n < run.step ? 'done' : ''}"></span>`).join('')}</div><div class="adventure-scene">${icon(complete ? 'gift' : e.icon)}${petSVG(c, G.age(state, c) >= 8)}</div>${run.lastText ? `<p class="adventure-message">${run.lastText}</p>` : ''}<p class="modal-copy">${complete ? '森の出口から、おうちが見えてきました。今日の宝物を、一緒に持って帰ろう。' : e.text}</p>${complete ? `<div class="loot"><span>${run.coins}<small>G</small></span><span>${run.xp}<small>XP</small></span></div><div class="modal-actions"><button class="button primary wide" data-action="finish-adventure">おうちに帰る ${icon('home')}</button></div>` : `${e.choices.map((o, i) => `<button class="choice-button" data-choice="${i}"><strong>${o.label} →</strong><small>${o.hint}</small></button>`).join('')}<div class="modal-actions"><button class="tiny" data-action="retreat">ここまでのおみやげで帰る</button><button class="tiny" data-action="close">あとでつづける</button></div>`}`, 'adventure');
  }
  function confirmNextDay() {
    const needy = G.alive(state).filter(c => G.age(state, c) < 8 && (c.hunger < 55 || c.hygiene < 55 || c.sick));
    if (!needy.length) { outcome(G.advance(state)); return; }
    modal('明日を迎える前に', `<p class="modal-copy">まだお世話が必要な子がいます。このまま進むと、体調を崩すことがあります。</p><div style="margin-top:15px">${needy.map(c => `<p class="modal-copy">${esc(c.name)}：おなか ${Math.round(c.hunger)} / きれい ${Math.round(c.hygiene)}${c.sick ? '・病気' : ''}</p>`).join('')}</div><div class="modal-actions"><button class="button" data-action="force-next-day">このまま翌日へ</button><button class="button primary" data-action="care-needy" data-id="${needy[0].id}">お世話してから</button></div>`, 'next-day');
  }
  function rescueDialog() {
    modal('森で、新しい出会い。', `<p class="modal-copy">小さな子を村へ迎えましょう。子どもはみんな、日々のお世話を待っています。</p>${speciesPicker()}<label class="field-label" for="new-name">名前をつける</label><input class="text-field" id="new-name" maxlength="16" value="${['ルゥ', 'ノア', 'ピピ', 'トワ', 'ネル', 'ソラ', 'ユラ'].find(name => !state.creatures.some(c => c.name === name)) || 'ココ'}"><div class="modal-actions"><button class="button" data-action="close">また今度</button><button class="button primary" data-action="confirm-rescue">この子を迎える</button></div>`, 'rescue');
  }
  function start(modeName) {
    const name = $('pet-name').value.trim(); if (!name) { $('pet-name').focus(); toast('この子の名前を入れてください。'); return; }
    if (corruptModes.has(modeName)) {
      try { const old = localStorage.getItem(KEY(modeName)); if (old) localStorage.setItem(`${KEY(modeName)}-unreadable-${Date.now()}`, old); }
      catch { toast('古いデータを退避できません。設定からデータを確認してください。'); return; }
      corruptModes.delete(modeName);
    }
    state = G.fresh(modeName, name, selectedSpecies); mode = modeName; draft = ''; view = 'home'; save(); closeModal(); render(); toast(`${name}との暮らしが、はじまりました。まずはごはんをどうぞ。`);
  }
  function exportSave() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url;
    a.download = `morinoko-${state.mode}-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('セーブデータを書き出しました。');
  }
  document.addEventListener('click', event => {
    const b = event.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.start) { start(b.dataset.start); return; }
    if (b.dataset.species) {
      selectedSpecies = b.dataset.species;
      document.querySelectorAll('[data-species]').forEach(o => { o.classList.toggle('selected', o.dataset.species === selectedSpecies); o.setAttribute('aria-pressed', String(o.dataset.species === selectedSpecies)); });
      const art = document.querySelector('.welcome-illustration'); if (art) art.innerHTML = petSVG({ species: selectedSpecies }); return;
    }
    if (!state) return;
    G.sync(state);
    if (b.dataset.view) { view = b.dataset.view; render(); return; }
    if (b.dataset.select) { state.active = b.dataset.select; draft = ''; view = 'home'; save(); render(); return; }
    if (b.dataset.say) { draft = ''; outcome(G.talk(state, b.dataset.say), 'talk'); return; }
    if (b.dataset.buy) { outcome(G.buy(state, b.dataset.buy)); shop(); return; }
    if (b.dataset.choice !== undefined) { const result = G.chooseAdventure(state, Number(b.dataset.choice)); save(); render(); if (!result.ok) toast(result.message); adventure(); return; }
    const action = b.dataset.action;
    if (action === 'feed' || action === 'bath') { outcome(G.care(state, action), action); return; }
    if (action === 'pet') { toast(G.active(state).dead ? '一緒に過ごした日々は、ここに。' : `${G.active(state).name}が、うれしそうにあなたを見ています。`); document.querySelector('.pet-actor')?.classList.add('mood-talk'); }
    if (action === 'close') closeModal();
    if (action === 'settings') settings();
    if (action === 'help') help();
    if (action === 'shop') shop();
    if (action === 'adventure') adventure();
    if (action === 'finish-adventure' || action === 'retreat') { const result = G.finishAdventure(state, action === 'retreat'); closeModal(); outcome(result); }
    if (action === 'next-day') confirmNextDay();
    if (action === 'force-next-day') { closeModal(); outcome(G.advance(state)); }
    if (action === 'care-needy') { state.active = b.dataset.id; view = 'home'; closeModal(); save(); render(); }
    if (action === 'rescue') rescueDialog();
    if (action === 'confirm-rescue') { const name = $('new-name').value.trim(); if (!name) { toast('名前を入れてください。'); return; } const result = G.rescue(state, selectedSpecies, name); closeModal(); view = 'home'; draft = ''; outcome(result); }
    if (action === 'rename') modal('この子の名前', `<label class="field-label" for="rename-input">新しい名前（16文字まで）</label><input class="text-field" id="rename-input" maxlength="16" value="${esc(G.active(state).name)}"><div class="modal-actions"><button class="button" data-action="close">やめる</button><button class="button primary" data-action="confirm-rename">名前を変える</button></div>`, 'rename');
    if (action === 'confirm-rename') { const name = $('rename-input').value.trim(); if (!name) { toast('名前を入れてください。'); return; } const c = G.active(state); G.log(state, `${c.name}の名前を「${name}」にしました。`); c.name = name; closeModal(); outcome({ ok: true, message: `これからは、${name}。` }); }
    if (action === 'switch-mode') {
      save(); const other = state.mode === 'demo' ? 'real' : 'demo', loaded = read(other);
      if (!loaded) { welcome(other); return; }
      state = loaded; mode = other; G.sync(state); save(); closeModal(); view = 'home'; draft = ''; render(); toast(`${mode === 'demo' ? 'おためし' : '通常'}モードの村に戻りました。`);
    }
    if (action === 'export') exportSave();
    if (action === 'import') $('save-file').click();
    if (action === 'reset') modal('新しい村で、やりなおす？', '<p class="modal-copy">現在のモードの仲間・所持金・育ちの記録を削除します。残しておきたい場合は、設定からセーブデータを書き出してください。</p><div class="modal-actions"><button class="button" data-action="settings">やめる</button><button class="button danger" data-action="confirm-reset">このモードを初期化する</button></div>', 'reset');
    if (action === 'confirm-reset') {
      const currentMode = state.mode;
      try { localStorage.removeItem(KEY(currentMode)); } catch { /* Session still resets; export remains available. */ }
      state = null; $('main-content').innerHTML = ''; $('coins').textContent = '30'; welcome(currentMode);
    }
    if (action === 'confirm-import') {
      const imported = pendingImport; if (!imported) return;
      pendingImport = null; state = imported; mode = state.mode; corruptModes.delete(mode); G.sync(state); save(); closeModal(); view = 'home'; draft = ''; render(); toast('セーブデータを読み込みました。おかえりなさい。');
    }
  });
  document.addEventListener('input', event => { if (event.target.id === 'talk-input') draft = event.target.value; });
  document.addEventListener('submit', event => { if (event.target.id !== 'talk-form') return; event.preventDefault(); G.sync(state); const text = $('talk-input').value; draft = ''; outcome(G.talk(state, text), 'talk'); $('talk-input')?.focus({ preventScroll: true }); });
  let pendingImport = null;
  document.addEventListener('change', async event => {
    if (event.target.id === 'job-select') { G.sync(state); outcome(G.setJob(state, event.target.value)); }
    if (event.target.id === 'save-file') {
      const file = event.target.files?.[0]; if (!file) return;
      try {
        if (file.size > 2e6) throw new Error('size');
        const candidate = JSON.parse(await file.text()); if (!G.validate(candidate)) throw new Error('schema');
        pendingImport = candidate;
        modal('この村を、読み込みますか？', `<p class="modal-copy">${candidate.mode === 'demo' ? 'おためし' : '通常'}モードの村を、読み込んだデータで置き換えます。<br>仲間 ${G.alive(candidate).length}体 / ${candidate.coins} G${candidate.mode === 'real' ? '<br>通常モードは保存後の経過時間も反映します。' : ''}</p><div class="modal-actions"><button class="button" data-action="settings">やめる</button><button class="button primary" data-action="confirm-import">読み込む</button></div>`, 'import');
      } catch { toast('読み込めませんでした。森の子の有効なセーブデータを選んでください。'); }
    }
  });
  $('modal').addEventListener('cancel', event => { if (dialogKind === 'welcome' && !state) event.preventDefault(); else dialogKind = ''; });
  $('brand-mark').innerHTML = icon('leaf'); $('brand-mark').firstChild.style.cssText = 'width:100%;height:100%;stroke-width:1.25';
  $('settings-button').innerHTML = icon('settings');
  document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); if (state) { view = 'home'; render(); } });
  try { mode = localStorage.getItem(LAST_MODE) === 'real' ? 'real' : 'demo'; } catch { saveOK = false; }
  state = read(mode);
  if (!state && !corruptModes.has('real')) {
    for (const key of ['pet-game-v1', 'forest-child-prototype-v1']) {
      try { const legacy = localStorage.getItem(key); if (!legacy) continue; const migrated = G.migrate(JSON.parse(legacy)); if (migrated && !localStorage.getItem(KEY('real'))) { state = migrated; mode = 'real'; save(); break; } } catch { /* Leave old save untouched. */ }
    }
  }
  if (state) { G.sync(state); save(); render(); if (state.adventure) toast('おかえりなさい。森の探索を、途中から続けられます。'); }
  else { welcome(); }
  setInterval(() => { if (!state || document.hidden || $('modal').open) return; G.sync(state); save(); if (state.mode === 'real') render(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (!state) return; G.sync(state); save(); if (!document.hidden && !$('modal').open) render(); });
  window.addEventListener('pagehide', save);
  // A second tab must not silently overwrite another tab's newer save.
  window.addEventListener('storage', event => {
    if (!state || event.key !== KEY(state.mode)) return;
    if (!event.newValue) { state = null; closeModal(); $('main-content').innerHTML = ''; welcome(mode); return; }
    try { const updated = JSON.parse(event.newValue); if (G.validate(updated)) { state = updated; G.sync(state); if ($('modal').open) closeModal(); render(); toast('別のタブで進めた暮らしを反映しました。'); } } catch { /* Invalid external writes are ignored. */ }
  });
})();
