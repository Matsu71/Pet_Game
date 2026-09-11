/* One-time integration of the previously authored source, with conflict checks.
 * Run only on the improvement branch. No force pushes and no main-branch writes.
 * The generated application files remain plain, independently reviewable source.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');process.chdir(ROOT);
const REPO='Matsu71/Pet_Game';
const out=path.join(ROOT,'quality-artifacts');fs.mkdirSync(out,{recursive:true});
const write=(name,text)=>{fs.mkdirSync(path.dirname(name),{recursive:true});fs.writeFileSync(name,text);};
const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
const gitHash=data=>execFileSync('git',['hash-object','--stdin'],{input:data,encoding:'utf8'}).trim();
const recovered={
 'game.js':{sha:'d7201fc35eecc56c1ae65065c32ed842414f9bbe',before:['44365a844148b4af93670f94ee9e8447b0686533']},
 'journey.js':{sha:'26518ae63f95e1d17b3714ebd7c87f711d33c96c',before:['d973c56a414d94c134d53a97c99321a5bd4fbc97']},
 'persistence.js':{sha:'e7adfcb3e5e67b661efd90665a7b3c2c67f4aab6',before:[]},
 'app.js':{sha:'59b17fe6726569fc348fbf065bf64ee2a6948f21',before:['cbc3dd7223a2a9b8cac19f7e48c04126fd3fe2ce']}
};
async function json(url,authenticated=false){
 const headers={'User-Agent':'Pet-Game-Quality-Review','Accept':'application/json'};
 if(authenticated&&process.env.GITHUB_TOKEN)headers.Authorization=`Bearer ${process.env.GITHUB_TOKEN}`;
 const response=await fetch(url,{headers,signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(`${response.status}: ${url}`);
 return response.json();
}
function edit(file,needle,replacement){
 const source=fs.readFileSync(file,'utf8');
 assert.equal(source.split(needle).length,2,`Expected one reviewed location in ${file}: ${needle.slice(0,80)}`);
 write(file,source.replace(needle,replacement));
}
async function recover(){
 for(const [file,record] of Object.entries(recovered)){
  if(fs.existsSync(file))assert([record.sha,...record.before].includes(gitHash(fs.readFileSync(file))),`Concurrent/unreviewed changes in ${file}; refusing to overwrite.`);
  const blob=await json(`https://api.github.com/repos/${REPO}/git/blobs/${record.sha}`,true);
  assert.equal(blob.encoding,'base64');const bytes=Buffer.from(blob.content,'base64');assert.equal(gitHash(bytes),record.sha);
  write(file,bytes);
 }
}
function sourceFixes(){
 edit('app.js',"    if (result.reason === 'conflict') {","    if (result.reason === 'invalid-state') {\n      saveOK=false; $('save-state').textContent='保存前の整合性を確認できません';\n      $('save-state').classList.add('warning');\n      toast('データを保存していません。設定から書き出して保管してください。');\n      return false;\n    }\n    if (result.reason === 'conflict') {");
 edit('app.js',"    state=G.fresh(targetMode,name,selectedSpecies); mode=targetMode; draft=''; save();closeModal();navigate('home');toast(`${name}との暮らしが、はじまりました。ごはんをどうぞ。`);","    const existing=read(targetMode);\n    if(existing){state=existing;mode=targetMode;G.sync(state);closeModal();navigate('home');toast('保存済みの村に戻りました。仲間と記録はそのままです。');return;}\n    state=G.fresh(targetMode,name,selectedSpecies); mode=targetMode; draft=''; if(!save())return;closeModal();navigate('home');toast(`${name}との暮らしが、はじまりました。ごはんをどうぞ。`);");
 edit('app.js',"const c=state.creatures.find(c=>c.id===m.petId), symbols=['leaf','sprout','sun'];","const c=state.creatures.find(c=>c.id===m.petId), symbols=['leaf','acorn','flower'];");
 edit('journey.js',"  function replay(s, random) {\n    const m", "  function replay(s, random) {\n    if (!available(s)) return {ok: false, message: 'おうちに戻ってから遊ぼう。'};\n    const m");
 edit('art.js','  const icons = {',`  const icons = {
    acorn: '<path d="M5 10h14v3c0 5-4 8-7 9-3-1-7-4-7-9Z"/><path d="M3 10c0-5 18-5 18 0M12 6V2m0 2 4-2"/>',
    flower: '<circle cx="12" cy="12" r="3"/><path d="M9 8C3-1 18-1 15 8c9-6 13 7 3 7 6 8-7 12-9 3-8 6-12-7-3-9"/>',`);
 const css=`\n/* Mobile quality increment: details remain optional and controls stay reachable. */
.story-shortcut{display:flex;align-items:center;gap:12px;padding:18px 16px;text-align:left;width:100%;min-height:96px}.story-shortcut>span{display:grid;gap:4px;flex:1}.story-shortcut small{font-size:12px;font-weight:400;color:var(--muted)}.story-shortcut strong{font-size:16px}.story-shortcut:disabled{opacity:.78}
.album-section{margin-bottom:20px}.album-section>p{font-size:13px;margin:8px 0 18px}.album-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.album-card{padding:16px 12px;text-align:center;border:1px dashed #bac9b0;border-radius:16px;background:#f3f3e9}.album-card.earned{border:1px solid #c9d9b6;background:#e9efdb}.album-card>span{display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:50%;background:#ffffffaa;color:#49673c}.album-card h3{font-size:13px;margin:9px 0 5px}.album-card p{font-size:12px;line-height:1.65}
.care-hint,.scene-caption{font-size:12px}.stat-label{font-size:12px}.pet-meta{font-size:13px}.profile-link{font-size:12px}.bond-note{font-size:12px}
@media(min-width:760px){.album-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-height:700px) and (max-width:759px){.care-hint{font-size:11px}.scene-caption{font-size:10px}.pet-meta{font-size:11px}}
.sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.scene-top{z-index:5}.pet-speech{pointer-events:none}
@media(max-height:700px) and (max-width:759px){.scene-top{justify-content:flex-end}}
`;
 assert.equal(gitHash(fs.readFileSync('style.css')),'2e4c5c0234cdd701573d5a6f34b9c178c5d1e345','Unexpected stylesheet; integrate manually instead of overwriting.');
 fs.appendFileSync('style.css',css);
 edit('index.html','  <script src="app.js" defer></script>','  <script src="persistence.js" defer></script>\n  <script src="app.js" defer></script>\n  <script src="offline.js" defer></script>');
 edit('index.html','  <link rel="stylesheet" href="style.css">','  <link rel="manifest" href="manifest.webmanifest">\n  <link rel="apple-touch-icon" href="assets/icon-192.png">\n  <link rel="stylesheet" href="style.css">');
 const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));pkg.version='0.7.0';pkg.scripts.test='node --test tests/*.test.cjs';pkg.scripts['test:browser']='node tests/mobile-quality.cjs';write('package.json',JSON.stringify(pkg,null,2)+'\n');
 // The old acceptance-test entry point now executes the maintained mobile suite.
 write('tests/browser-smoke.cjs',"// Compatibility entry point; see mobile-quality.cjs for current acceptance tests.\nrequire('./mobile-quality.cjs');\n");
}
function iconPNG(size){
 // Original leaf mark, drawn into PNG scanlines. No external images or fonts.
 const raw=Buffer.alloc((1+size*3)*size);const bg=[54,94,69],leaf=[242,236,200];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=(x-size*.5)/(size*.3),v=(y-size*.5)/(size*.3);
  const a=(u+v)/Math.SQRT2,b=(v-u)/Math.SQRT2;
  const inside=(a*a/.5+b*b)<1;
  const vein=Math.abs(a)<.025&&Math.abs(b)<.86;
  const rgb=inside&&!vein?leaf:bg,at=y*(size*3+1)+1+x*3;
  raw[at]=rgb[0];raw[at+1]=rgb[1];raw[at+2]=rgb[2];
 }
 function crc(bytes){let value=0xffffffff;for(const byte of bytes){value^=byte;for(let i=0;i<8;i++)value=(value>>>1)^((value&1)?0xedb88320:0);}return(value^0xffffffff)>>>0;}
 function chunk(type,data){const name=Buffer.from(type),length=Buffer.alloc(4),sum=Buffer.alloc(4);length.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([name,data])));return Buffer.concat([length,name,data,sum]);}
 const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=2;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
async function research(){
 const queries=[{name:'My Talking Tom 2',match:/^My Talking Tom 2$/i,kind:'育成・ミニゲーム'}, {name:'Tamagotchi Adventure Kingdom',match:/Tamagotchi Adventure Kingdom/i,kind:'育成・探索・冒険'}, {name:'Animal Crossing Pocket Camp Complete',match:/Pocket Camp.*Complete/i,kind:'収集・装飾・村づくり'}, {name:'Finch self care pet',match:/Finch.*Self.?Care|Finch.*Self.?care/i,kind:'隣接分野：日々の訪問と愛着'}];
 const records=[];
 for(const q of queries){
  const url='https://itunes.apple.com/search?'+new URLSearchParams({term:q.name,entity:'software',country:'us',limit:'10'});
  try{
   const data=await json(url);const app=data.results.find(a=>q.match.test(a.trackName||''));if(!app)throw new Error('Exact title not returned by official search');
   const text=String(app.description||'');
   records.push({name:app.trackName,developer:app.sellerName||app.artistName,category:q.kind,source:app.trackViewUrl,metadataSource:url,checkedAt:new Date().toISOString(),region:'US',version:app.version,ratings:app.userRatingCount??null,rating:app.averageUserRating??null,descriptionHash:digest(text),featuresMentionedInDescription:{care:/feed|bath|care|nurtur|pet/i.test(text),decoration:/decorat|customi[sz]|outfit/i.test(text),minigames:/mini.?game/i.test(text),exploration:/explor|adventur|quest/i.test(text),collection:/collect/i.test(text),dailyVisit:/daily|every day|each day/i.test(text)}});
  }catch(error){records.push({name:q.name,category:q.kind,metadataSource:url,checkedAt:new Date().toISOString(),unavailable:error.message});}
 }
 write('docs/research/competitors-20260911.json',JSON.stringify(records,null,2)+'\n');
 const yes=v=>v?'掲載説明で確認':'この取得では未確認';
 const lines=records.map(a=>a.unavailable?`| ${a.name} | 取得未完了 | — | — | — |`:`| ${a.name} | ${a.developer} | ${yes(a.featuresMentionedInDescription.decoration)} | ${yes(a.featuresMentionedInDescription.minigames)} | ${yes(a.featuresMentionedInDescription.collection)} |`);
 write('docs/COMPETITIVE_REVIEW.md',`# 競合比較と改善判断\n\n確認日：${new Date().toISOString()}\n\n## 調査の範囲\nAppleの公式ストア検索APIから、同一地域（US）の開発元掲載情報を取得しました。実機で競合作品を最後までプレイした評価ではありません。レビュー数はダウンロード数や継続率ではなく、本作との優劣を証明しません。掲載文で確認できない項目を「機能がない」とは扱いません。\n\n| 比較対象 | 掲載元の開発者名 | 装飾・着せ替え | ミニゲーム | 収集 |\n|---|---|---|---|---|\n${lines.join('\n')}\n\n## 本作への設計判断\n1. ホームはキャラクターと4つのお世話操作を中心にし、能力・性格・仕事は必要なときだけ開きます。\n2. 制限時間のない短い遊び、8種類の日常イベント、12項目の思い出アルバムで、お世話以外の訪問理由を作ります。\n3. 庭の飾りは一度買えば保持し、切り替えるたびに金貨を消費させません。\n4. 無料のお世話と低コストな声かけ判定という既存のコンセプトは維持します。\n\nこれは設計判断であり、競合より面白いという実証結果ではありません。各作品の文章・キャラクター・画像・画面構成は複製していません。\n\n## 未達の比較基準\nキャラクターごとの行動の豊かさ、長期的な村の成長、親密度・世代交代、十分な物量は継続課題です。さらに、実際の利用者による初回操作・再訪意向の検証、iPhone/Android実機の入力・発熱・復帰テストが必要です。自動テストの成功だけで人気作品と同等とは判定しません。\n\n## 一次情報\n${records.map(a=>`- ${a.name}: ${a.source||a.metadataSource}${a.unavailable?'（取得未完了）':''}`).join('\n')}\n\n取得条件・バージョン・レビュー件数は research/competitors-20260911.json に記録しています。\n`);
}
function readme(){write('README.md',`# 森の子 — Forest & You\n\nお世話と言葉で個性が育つ、森の小さな村のブラウザ育成ゲームです。スマートフォンの短い訪問で遊べることを中心にしています。\n\n## 遊び方\nフォルダ一式の index.html を開くか、Node.js 18以上で npm start を実行して http://localhost:4173 を開きます。ゲーム本体にビルド・アカウント・APIキーは不要です。\n\n最初の子を選び、ごはん・お風呂・ことば・あそぶの4操作からお世話します。キャラクターをタップしてなでることもできます。下部の「おうち／あそぶ／なかま／手帖」から移動します。\n\n## 今回の版で遊べること\n- 4種類の森の子、能力3つ、緩やかに育つ性格6軸、個体ごとの名前とスカーフ。\n- 無料のお世話、自然文の簡易声かけ判定、成長・病気・回復・寿命。\n- 途中で閉じても再開できる「木の実あわせ」と、3場面の森の探索。\n- 8種類の「今日のできごと」、12項目の思い出アルバム、日次のお祝い。\n- 買ったあと何度でも付け替えられる3種類の庭の飾り。\n- 8歳から12種類の仕事、最大8体の仲間、旅立った子を含む履歴。\n\n基本の自然文判定は文字の類似度とルールです。LLMとの自由会話ではありません。広告・課金・分析ツール・外部AI送信はありません。将来の構想を実装済みの機能として表示しません。\n\n## 2つの時間モード\n「おためし」は翌日ボタンで1歳成長し、閉じている間は進みません。「通常」は現実1日で1歳、留守中も時間が進みます。2つの村は別々に保存します。0〜7歳はお世話が必要で、放置すると病気や死亡に至ることがあります。8歳で自立し、50歳が寿命です。日次のお祝いに連続訪問ペナルティはありませんが、通常の育成ルールは別に適用されます。\n\n## 保存とオフライン\n同じブラウザ・同じアドレスのLocalStorageに保存します。直前の正常な保存をバックアップし、破損した主データからの復元を試みます。ブラウザのサイトデータを削除した場合や端末故障へのバックアップにはならないため、設定からJSONを書き出して保管してください。端末間の自動同期はありません。\n\n保存を許可しない設定でも、その回の育成と書き出しは使えます。読み込みは検証と置換確認を行います。別タブによる更新の検出を行いますが、LocalStorageの比較と書き込みはデータベースの原子的トランザクションではありません。同じ村の同時操作は避けてください。\n\nHTTPS/localhostの対応環境では、初回の準備後にオフライン起動できます。オフラインデータとセーブは別です。更新は保存後にゲームのタブをすべて閉じ、開き直すと適用されます。GitHub Pagesのサブディレクトリに対応し、他のゲームのキャッシュは削除しません。file://ではフォルダ一式を直接使用します。\n\n## 開発・検証\nゲームルールは game.js、日々の遊びは journey.js、保存は persistence.js、画面は app.js、ベクター描画は art.js、見た目は style.css に分離しています。\n\n開発用依存を npm ci で導入後、npm test でルールと保存を検証します。ブラウザ検証は npx playwright install chromium webkit、npm start、別ターミナルで npm run test:browser の順です。ブラウザを限定する場合は BROWSERS=chromium を指定します。検証出力先は QA_OUTPUT で変更できます。\n\n検証結果は docs/QUALITY_REPORT.md、競合比較は docs/COMPETITIVE_REVIEW.md、最終構想は GAME_DIRECTION.md を参照してください。初期MVPの記録は MVP_STATUS.md に残しています。\n\n## 継続開発\n20種への拡張、親密度・結婚・出生・外見遺伝、村の長期成長、戦闘ミニゲーム、高度な言語理解は未実装です。詳細は docs/NEXT_ITERATION.md に整理しています。\n`);
 write('docs/NEXT_ITERATION.md',`# 次の改善と完了判定\n\n## 変更しない核\n森の村、お世話と言葉による個性、低コストで動く育成、スマホで1日数回の短い接触を維持します。\n\n## 次の優先順位\n1. 実機と初回ユーザーテスト。説明なしでお世話・遊び・保存へ到達できるか、入力で困らないかを確認します。\n2. 個体差が見える行動。性格の数値だけでなく、しぐさ・選択への反応・村での役割に違いを出します。\n3. 村の継続目標と関係性。装飾だけでなく仕事と住民の暮らしがつながる成長ループを設計し、既存セーブを壊さず段階導入します。\n4. 関係性と世代交代。GAME_DIRECTION.mdとRELATIONSHIP_GENETICS.mdに沿い、ルール・表示・説明を同時に検証します。\n\n## 品質の判定を分ける\n自動テスト：構文、状態整合性、報酬の重複、保存、画面のはみ出し、主要操作の大きさ、操作による到達、オフラインを評価します。\n実機：iOS SafariとAndroid Chromeで、入力、ホーム画面起動、画面回転、バックグラウンド復帰、低速回線を評価します。\n利用者：初回操作の迷い、キャラクターへの愛着、翌日も遊びたい理由を比較します。数値目標と被験者条件を事前に決め、同意を得て記録します。\n\n「人気ゲームを上回った」という結論は、自動テストや機能数だけでは出しません。競合調査の取得失敗や未検証事項も消さず、次の作業へ引き継ぎます。\n`);
}
function report(){
 const browser=JSON.parse(fs.readFileSync(path.join(out,'browser','result.json'),'utf8'));
 const tap=fs.readFileSync(path.join(out,'unit.tap'),'utf8');
 const tests=Number(tap.match(/# tests (\d+)/)?.[1]);const failed=Number(tap.match(/# fail (\d+)/)?.[1]);
 assert.equal(browser.status,'passed');assert(browser.engines.length>=2);assert(tests>=40&&failed===0,'Rule test output must demonstrate a complete pass.');
 const sourceFiles=['game.js','journey.js','persistence.js','art.js','app.js','style.css','index.html','offline.js','sw.js'];
 const sourceHashes=Object.fromEntries(sourceFiles.map(f=>[f,digest(fs.readFileSync(f))]));
 const audit={testedAt:new Date().toISOString(),inputCommit:process.env.GITHUB_SHA||null,tests,failures:failed,browser,sourceHashes,scope:'Automated local-server/browser emulation; no claim of physical-device or competitive superiority.'};
 write('docs/research/quality-evidence.json',JSON.stringify(audit,null,2)+'\n');
 write('docs/QUALITY_REPORT.md',`# モバイル品質検証の結果\n\n検証日時：${audit.testedAt}\n入力コミット：${audit.inputCommit}\n\n## 実行結果\n- ルール・保存テスト：${tests}件、失敗${failed}件。\n- ブラウザ：${browser.engines.map(e=>e.engine+': '+e.checks.length+'項目完了').join('、')}。\n- 画面条件：320×568、360×640、375×667、390×844、412×915、768×1024、1280×900。\n- 各条件で横方向のはみ出し、44 CSS px以上の主要操作、下部ナビとの重なり、庭ボタン到達を検査しました。\n- お世話から成人・就職まで、探索・カード遊びの途中再開、ストーリー、お祝いの重複防止、装飾の保持、アルバムを操作しました。\n- エクスポート、不正インポート拒否、置換確認、別タブ更新、破損データからの復元、保存拒否環境、file://起動を検査しました。\n- Chromiumでオフライン再読み込み後の操作を検査しました。WebKitの検証は実際のiPhoneを使用したものではありません。\n\n## 記録\nファイル単位のSHA-256と詳細結果は research/quality-evidence.json、画面は screenshots/mobile-home.png と screenshots/mobile-memory.png に保存しています。全画像・アクセシビリティ出力・TAPログは対応するGitHub Actionsの成果物に含まれます。入力コミットにテスト済みの生成ファイルを追加したため、上記ファイルハッシュで公開ファイルとの一致を確認できます。\n\n## 限界と残課題\n実機のキーボード・発熱・長時間プレイ・クラウド同期は検証していません。自動アクセシビリティ検査はホーム画面の重大・深刻な検出事項を品質ゲートとし、スクリーンリーダーの手動評価は未実施です。楽しいと感じるか、愛着が育つか、競合より継続したくなるかは利用者テストが必要です。競合を上回ったとの判定はしていません。\n`);
 for(const name of ['mobile-home.png','mobile-memory.png']){fs.mkdirSync('docs/screenshots',{recursive:true});fs.copyFileSync(path.join(out,'browser','chromium',name),path.join('docs/screenshots',name));}
 console.log(`VERIFIED: ${tests} rule tests and ${browser.engines.length} browser engines. Exact hashes recorded.`);
}
(async()=>{
 if(process.argv.includes('--report'))return report();
 await recover();sourceFixes();
 for(const size of [192,512])write(`assets/icon-${size}.png`,iconPNG(size));
 await research();readme();
 const files=['game.js','journey.js','persistence.js','art.js','app.js','offline.js','sw.js'];for(const f of files)execFileSync(process.execPath,['--check',f],{stdio:'inherit'});
 write(path.join(out,'integration.json'),JSON.stringify({recovered,assembledAt:new Date().toISOString()},null,2));
 console.log('Source recovered and assembled. Publication is gated by the complete test workflow.');
})().catch(error=>{console.error(error);process.exitCode=1;});
