# 競合比較と改善判断

確認日：2026-09-11T09:59:55.137Z

## 調査の範囲
Appleの公式ストア検索APIから、同一地域（US）の開発元掲載情報を取得しました。実機で競合作品を最後までプレイした評価ではありません。レビュー数はダウンロード数や継続率ではなく、本作との優劣を証明しません。掲載文で確認できない項目を「機能がない」とは扱いません。

| 比較対象 | 掲載元の開発者名 | 装飾・着せ替え | ミニゲーム | 収集 |
|---|---|---|---|---|
| My Talking Tom 2 | Outfit7 Limited | 掲載説明で確認 | 掲載説明で確認 | 掲載説明で確認 |
| Tamagotchi Adventure Kingdom | Bandai Namco Entertainment Inc. | 掲載説明で確認 | この取得では未確認 | この取得では未確認 |
| Animal Crossing Pocket Camp Complete | 取得未完了 | — | — | — |
| Finch: Self-Care Pet | Finch Care Public Benefit Corporation | この取得では未確認 | この取得では未確認 | この取得では未確認 |

## 本作への設計判断
1. ホームはキャラクターと4つのお世話操作を中心にし、能力・性格・仕事は必要なときだけ開きます。
2. 制限時間のない短い遊び、8種類の日常イベント、12項目の思い出アルバムで、お世話以外の訪問理由を作ります。
3. 庭の飾りは一度買えば保持し、切り替えるたびに金貨を消費させません。
4. 無料のお世話と低コストな声かけ判定という既存のコンセプトは維持します。

これは設計判断であり、競合より面白いという実証結果ではありません。各作品の文章・キャラクター・画像・画面構成は複製していません。

## 未達の比較基準
キャラクターごとの行動の豊かさ、長期的な村の成長、親密度・世代交代、十分な物量は継続課題です。さらに、実際の利用者による初回操作・再訪意向の検証、iPhone/Android実機の入力・発熱・復帰テストが必要です。自動テストの成功だけで人気作品と同等とは判定しません。

## 一次情報
- My Talking Tom 2: https://apps.apple.com/us/app/my-talking-tom-2/id1337578317?uo=4
- Tamagotchi Adventure Kingdom: https://apps.apple.com/us/app/tamagotchi-adventure-kingdom/id1614952689?uo=4
- Animal Crossing Pocket Camp Complete: https://itunes.apple.com/search?term=Animal+Crossing+Pocket+Camp+Complete&entity=software&country=us&limit=10（取得未完了）
- Finch: Self-Care Pet: https://apps.apple.com/us/app/finch-self-care-pet/id1528595748?uo=4

取得条件・バージョン・レビュー件数は research/competitors-20260911.json に記録しています。
