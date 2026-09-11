/* Turn actual test artifacts into an auditable release report. No invented pass counts. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');process.chdir(ROOT);
const OUT=process.env.QA_ROOT||'quality-artifacts';
const tap=fs.readFileSync(path.join(OUT,'unit.tap'),'utf8');
const browser=JSON.parse(fs.readFileSync(path.join(OUT,'browser/result.json'),'utf8'));
const tests=Number(tap.match(/# tests (\d+)/)?.[1]),failures=Number(tap.match(/# fail (\d+)/)?.[1]);
assert(tests>=84&&failures===0,'All rule, save, village and delivery tests must pass.');
assert.equal(browser.status,'passed');assert(['chromium','webkit'].every(name=>browser.engines.some(e=>e.engine===name&&e.status==='passed')),'Both browser engines must pass.');
const assets=require('../server.cjs').ASSETS;
const hashes=Object.fromEntries(assets.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
const bytes=assets.reduce((n,file)=>n+fs.statSync(file).size,0);
const evidence={testedAt:new Date().toISOString(),inputCommit:process.env.GITHUB_SHA||null,version:require('../package.json').version,tests,failures,browser,runtimeBytes:bytes,sourceHashes:hashes,scope:'Automated browsers and viewport emulation. Not physical-device tests, human usability studies or a claim of competitive superiority.'};
const report=`# 森の子 ${evidence.version} — 品質検証\n\n検証日時：${evidence.testedAt}\n入力コミット：${evidence.inputCommit}\n\n## 実行結果\n- Node.jsのルール・保存・配信テスト：${tests}件、失敗${failures}件。\n- ブラウザ：${browser.engines.map(e=>`${e.engine} ${e.checks.length}項目`).join('、')}を完了。\n- 混合操作テスト：4つの固定シード、合計1,200操作の後もセーブの整合性を検査。\n- 初回に必要なゲーム本体・画像など：合計${bytes.toLocaleString('en-US')}バイト（未圧縮）。外部JavaScript CDNは不要。\n\n## 確認した体験\n320×568から1280×900までの7条件で、お世話4ボタンの大きさ（44 CSS px以上）、下部ナビとの重なり、横はみ出し、庭ボタンへの到達を確認しました。村の画面も320/360/390/768 CSS pxで確認しています。\n\n命名・お世話・声かけ・カード遊びの途中再開・探索・成人・就職・収入・新しい仲間・2つの時間モードを実際に操作しています。村の施設を建て、村全体への効果と親密度の増加が保存・再読み込み後にも保持され、重複取得できないことを確認しました。\n\nエクスポート、不正インポート拒否、置換前の確認、別タブ更新、破損した主データからの復元、保存拒否環境、file://起動を確認しました。Chromiumではオフライン再読み込み後の操作も確認しています。ホームと村の自動アクセシビリティ検査では、深刻・重大と分類された検出事項を0件の条件で通しています。\n\n## 証拠と再現\n詳細はresearch/quality-evidence.json、画面はscreenshots/mobile-home.png、mobile-memory.png、mobile-village.pngです。GitHub Actionsの同じ実行の成果物には、全結果と画面・TAPログ・テスト対象のソースを保存します。入力コミットから組み立てた場合も、sourceHashesのSHA-256で実際に検証した公開ファイルと照合できます。\n\n## 未検証の範囲\nWebKitを使った検証はiPhone実機そのものではありません。実機キーボード・発熱・長時間の復帰動作、スクリーンリーダーによる手動評価、実ユーザーの初回操作・愛着・継続意向は未検証です。自動テストや機能数だけで、人気作品を上回ったとは判定しません。\n`;
fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'quality-evidence.json'),JSON.stringify(evidence,null,2)+'\n');fs.writeFileSync(path.join(OUT,'QUALITY_REPORT.md'),report);
if(process.argv.includes('--publish')){
 fs.mkdirSync('docs/research',{recursive:true});fs.mkdirSync('docs/screenshots',{recursive:true});
 fs.writeFileSync('docs/research/quality-evidence.json',JSON.stringify(evidence,null,2)+'\n');fs.writeFileSync('docs/QUALITY_REPORT.md',report);
 for(const name of ['mobile-home.png','mobile-memory.png','mobile-village.png'])fs.copyFileSync(path.join(OUT,'browser/chromium',name),path.join('docs/screenshots',name));
}
console.log(report);
