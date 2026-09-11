/* Original encounter writing and personality-aware responses. No network, timers or paid AI.
 * Data is immutable; saved adventures reference stable route IDs, never translated labels. */
(function(root){
  'use strict';
  const TEMPERAMENTS={
    kindness:{name:'やさしい',gesture:'そっと寄り添う',detail:'相手の気持ちに目を向ける子。小さな手助けを、一緒に喜びます。',pet:'手にほっぺを寄せて、きみもあったかい？と見上げています。',feed:'ひとくち、きみにも分けてあげたいな。',bath:'きみの手も、いっしょに洗おう。',praise:'きみも、よくがんばったね。次もいっしょにがんばろう。',love:'わたしも。きみがほっとできる場所でいたいな。',encourage:'ありがとう。誰かが困っていたら、同じ言葉をかけたいな。',curious:'あの小さな芽、踏まないで近くで見てみよう。',discipline:'みんなが使いやすいように、ひとつずつ片付けるね。',quiet:'今日、だれかがうれしくなることを一緒に探したいな。'},
    courage:{name:'勇敢な',gesture:'胸を張って見わたす',detail:'一歩先へ進んでみたい子。小さな挑戦を、自分の自信にしていきます。',pet:'ぴょん、と背伸び。得意そうに胸を張っています。',feed:'これで元気いっぱい。少し遠くまで歩けそう！',bath:'水しぶきもへっちゃら。ほら、ぴかぴか！',praise:'見てくれた？ 次はもう一歩、がんばろうかな！',love:'きみと一緒だと、新しい道もこわくないよ。',encourage:'うん。まずは小さな一歩から、もう一度！',curious:'あの曲がり角まで行ってみたい。きみも一緒に来る？',discipline:'わかった。準備をしてから出発しよう。',quiet:'今日は、いつもより一歩先の景色を見てみたい。'},
    curiosity:{name:'好奇心いっぱい',gesture:'首をかしげて観察',detail:'気になるものを見つけるのが得意な子。「どうして？」から育つ発見を楽しみます。',pet:'首をかしげて、指先をじっと観察しています。',feed:'この木の実、どこで実るんだろう。おいしいね！',bath:'泡の中に、ちいさな虹を見つけたよ。',praise:'えへへ。今度は違うやり方でも、がんばろうかな。',love:'きみの好きなもの、もっと教えてほしいな。',encourage:'次は何が変わるかな。試して、確かめてみたい。',curious:'気になる！形をよく見て、手帖に描いておこう。',discipline:'片付けたら、何がどこにあるか見つけやすいね。',quiet:'葉っぱの裏に、細い道みたいな線があるんだ。'},
    discipline:{name:'しっかり者',gesture:'小さくうなずく',detail:'順番や準備を大切にする子。積み重ねたことを、ひとつずつ確かめます。',pet:'姿勢を正してから、こくんとうなずいてくれました。',feed:'いただきます。食べ終わったら、お皿も片付けるね。',bath:'耳のうしろも、足先も。順番にきれいにしよう。',praise:'続けてきてよかった。明日もひとつずつ、がんばろう。',love:'ありがとう。きみとの約束も、大切にするね。',encourage:'うん。できるところから、順番にやってみるね。',curious:'見つけたものを、忘れないように記録しよう。',discipline:'最初のひとつ、終わったよ。次はこれだね。',quiet:'道具の置き場所をそろえたら、庭がすっきりしたよ。'},
    sociability:{name:'人なつっこい',gesture:'手を振っておむかえ',detail:'誰かと時間を分け合うのが好きな子。言葉や出会いを、うれしい出来事にします。',pet:'両手を振って、もう少しここにいて、と笑っています。',feed:'いっしょに食べると、もっとおいしいね！',bath:'見て見て、泡のおひげ！ふふ、似合う？',praise:'やった！きみと一緒に、次もがんばろう！',love:'会えてうれしい！今日のお話も聞かせて。',encourage:'手を振っていてね。きみが見ているならやってみる！',curious:'村の仲間にも聞いてみよう。誰か知っているかな？',discipline:'みんなで順番にやれば、早く終わりそうだね。',quiet:'今日のちいさな発見、誰かに聞いてほしいな。'},
    emotionalStability:{name:'おだやか',gesture:'のんびり深呼吸',detail:'自分のペースを大切にする子。落ち着いた時間から、少しずつ力を育てます。',pet:'目を細めて、ゆっくりと気持ちよさそうにしています。',feed:'あったかいね。ゆっくり味わって食べたいな。',bath:'ふわぁ。お湯の音を聞いていると、ほっとするね。',praise:'うれしいな。急がずに、またがんばろうね。',love:'きみが隣にいると、いつもの庭も心地いいね。',encourage:'そうだね。ひと息ついてから、また始めよう。',curious:'しばらく静かに見ていよう。何か動くかもしれない。',discipline:'うん。ひとつずつなら、きっとできるよ。',quiet:'風で木漏れ日がゆれているね。一緒に眺めよう。'}
  };
  function key(c){
    const keys=Object.keys(TEMPERAMENTS);let best=keys[0];
    for(const k of keys)if((c?.personality?.[k]??0)>(c?.personality?.[best]??0))best=k;
    return best;
  }
  function personality(c){return TEMPERAMENTS[key(c)];}
  function response(c,intent){
    // Do not turn a hurt reaction into an upbeat quip. Health/safety messages remain in game.js.
    if(intent==='harsh')return '……少しびっくりした。今は、静かにしていたいな。';
    const p=personality(c);return Object.hasOwn(p,intent)?p[intent]:p.quiet;
  }
  const choice=(label,ability,threshold,coins,xp,trait,success,fail)=>({label,ability,threshold,coins,xp,trait,success,fail:fail||success});
  const ROUTES={
    forest:{name:'はじまりの森',icon:'leaf',summary:'小川、旅人、木の根の宝箱。いつもの道にも小さな発見。',focus:'賢さ・力',scene:'forest',encounters:null},
    meadow:{name:'花風の草原',icon:'sprout',summary:'風の歌をたどって、草原の小さな住人を手伝う道。',focus:'生命力・やさしさ',scene:'meadow',encounters:[
      {title:'風にほどけた種',text:'草原の向こうに、綿毛がふわり。小さな畑を作る住人が、飛んでいく種を追いかけています。',icon:'sprout',choices:[
        choice('風上へ走って集める','vitality',42,28,17,'courage','草の上を軽やかに駆けて、たくさんの種を集めました。','少し休みながらでも、両手に種を集められました。'),
        choice('草かげにたまった種を探す','intelligence',0,18,13,'curiosity','草かげに、綿毛の小さなたまり場を見つけました。')
      ]},
      {title:'落ちた巣箱',text:'低い枝から落ちた巣箱。中は空っぽですが、近くの小鳥が心配そうに見ています。',icon:'home',choices:[
        choice('丈夫な枝にかけ直す','strength',44,30,18,'kindness','ぐっと持ち上げて、巣箱を丈夫な枝に戻しました。','運ぶのを手伝ってもらい、低い枝に巣箱を戻しました。'),
        choice('雨よけになる場所を整える','vitality',0,19,14,'kindness','雨の当たらない木かげに、小鳥の休める場所を作りました。')
      ]},
      {title:'丘いっぱいの花びら',text:'帰り道は花びらのじゅうたん。草原の住人が、花色のしおりを作っています。',icon:'book',choices:[
        choice('花の色を組み合わせる','intelligence',46,39,21,'curiosity','花の色を重ねて、夕焼けのようなしおりができました。','試しながら並べると、素朴でやさしいしおりになりました。'),
        choice('きれいな落ち葉を届ける','vitality',0,24,16,'kindness','形のよい落ち葉を集めて届けました。お礼の金貨と、花の香り。')
      ]}
    ]},
    brook:{name:'せせらぎの道',icon:'water',summary:'水車の音を聞きながら、水辺の暮らしに出会う道。',focus:'賢さ・規律性',scene:'brook',encounters:[
      {title:'止まった小さな水車',text:'水車が、こつんと止まっています。粉をひく住人が、困って首をかしげています。',icon:'settings',choices:[
        choice('歯車の仕組みを調べる','intelligence',43,29,17,'curiosity','歯車に挟まった小枝を発見。水車がまた回りはじめました。','仕組みを教わりながら、小枝を取り除きました。'),
        choice('水路の落ち葉をすくう','strength',0,18,13,'discipline','水の通り道が広がって、水車がゆっくり動きました。')
      ]},
      {title:'渡し場のお届けもの',text:'向こう岸の工房に届けたい布の包み。渡し守は、舟を結ぶひもを直しているところです。',icon:'gift',choices:[
        choice('岸沿いの道を歩いて届ける','vitality',45,31,18,'kindness','遠回りも元気に歩いて、包みを工房へ届けました。','少し休みながら、包みをぬらさず届けられました。'),
        choice('舟の準備を手伝って待つ','strength',0,20,14,'discipline','準備を整えてから、ゆっくり川を渡りました。')
      ]},
      {title:'水面の星をさがして',text:'水面にきらきら光るもの。水辺の店主が、川底の石で小さな飾りを作るそうです。',icon:'sun',choices:[
        choice('浅い場所で光る石を見分ける','intelligence',47,41,22,'curiosity','光の向きを確かめて、模様の美しい石を見つけました。','よく見て探すと、手になじむ丸い石を見つけました。'),
        choice('岸辺の石を磨いてみる','strength',0,25,16,'discipline','ころんとした石を磨くと、やわらかな光沢が出ました。')
      ]}
    ]},
    ridge:{name:'星待ちの丘',icon:'sun',summary:'坂道を登って、遠い山並みと夜の支度を眺める道。',focus:'力・勇気',scene:'ridge',encounters:[
      {title:'風にゆれる道しるべ',text:'坂の入口で、道しるべが傾いています。誰かが迷う前に、少し直せるでしょうか。',icon:'compass',choices:[
        choice('支柱を起こして支える','strength',44,30,18,'courage','ぐっと支えて、道しるべをまっすぐ立て直しました。','近くの石を支えに使い、道しるべを見やすくしました。'),
        choice('矢印の向きを確かめて書く','intelligence',0,19,13,'discipline','曲がり角を確かめて、わかりやすい矢印を添えました。')
      ]},
      {title:'岩かげの休憩所',text:'岩かげに小さなベンチ。山道の案内人が、休憩する人に木の実のお茶を配っています。',icon:'bowl',choices:[
        choice('水の入ったつぼを運ぶ','strength',46,32,19,'kindness','両手でしっかり抱えて、つぼを休憩所へ運びました。','案内人と一緒に持って、つぼを運びました。'),
        choice('木の実を分けて準備する','vitality',0,21,14,'kindness','木の実を少しずつ分けると、いい香りのお茶ができました。')
      ]},
      {title:'いちばん星の見える場所',text:'頂上までもう少し。空が夕方の色に変わり、丘の住人が灯りをともす準備をしています。',icon:'moon',choices:[
        choice('丘の灯りを順番に届ける','vitality',48,42,22,'courage','丘の灯りをともして回り、遠くの村を見渡しました。','途中でひと息つきながら、近くの灯りをともしました。'),
        choice('風を防ぐ囲いを整える','intelligence',0,26,16,'discipline','灯りが消えないよう囲いを整えると、空に一番星が見えました。')
      ]}
    ]}
  };
  function freeze(o){Object.values(o).forEach(v=>{if(v&&typeof v==='object')freeze(v);});return Object.freeze(o);}
  const api=freeze({TEMPERAMENTS,ROUTES,key,personality,response});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;root.ForestWorld=api;
})(typeof globalThis!=='undefined'?globalThis:this);
