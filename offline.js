/* Progressive enhancement: the game remains usable without Service Workers. */
(() => {
  'use strict';
  let message='オフライン用のデータを準備しています。';
  const notify = text => {
    message=text;
    const label=document.getElementById('offline-state');
    if(label)label.textContent=message;
  };
  window.ForestOffline=Object.freeze({status:()=>message});
  if(location.protocol==='file:'){
    notify('ファイルから起動しています。フォルダ一式があれば、通信なしで遊べます。');
    return;
  }
  if(!window.isSecureContext || !('serviceWorker' in navigator)){
    notify('この環境ではオフライン保存を利用できません。通常のブラウザゲームとして遊べます。');
    return;
  }
  window.addEventListener('load',async()=>{
    try{
      const registration=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
      await navigator.serviceWorker.ready;
      notify('オフラインの準備ができました。この端末で通信なしでも起動できます。');
      const updateNotice=()=>{
        if(registration.waiting)notify('新しい版があります。保存後に、このゲームのタブをすべて閉じて開き直すと更新されます。');
      };
      updateNotice();
      registration.addEventListener('updatefound',()=>{
        const installing=registration.installing;
        installing?.addEventListener('statechange',updateNotice);
      });
    }catch{
      notify(navigator.serviceWorker.controller ? '保存済みの版で遊べます。新しい版の確認は通信できるときに行います。' : 'オフライン用データを保存できませんでした。通信がある状態では通常どおり遊べます。');
    }
  },{once:true});
})();
