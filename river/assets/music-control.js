(() => {
  const button=document.createElement('button');
  button.className='music-toggle';
  button.type='button';
  const assetBase=new URL('./',document.currentScript.src);
  button.innerHTML='<img alt=""><i class="music-spark spark-a" aria-hidden="true"></i><i class="music-spark spark-b" aria-hidden="true"></i>';
  const icon=button.querySelector('img');
  const grayIcon=new URL('music-icon.png',assetBase).href;
  const greenIcon=new URL('music-icon-playing.png',assetBase).href;
  const introIcon=new URL('music-note-white.png',assetBase).href;
  const introPlayingIcon=new URL('music-note-blue.png',assetBase).href;
  document.body.appendChild(button);

  const style=document.createElement('style');
  style.textContent=`
    .music-toggle{position:fixed;z-index:60;top:12px;left:auto;right:12px;width:52px;height:52px;border:0;padding:0;background:rgba(255,255,255,.18);border-radius:50%;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:top .25s ease,left .25s ease,background .25s ease,opacity .25s ease}
    .music-toggle img{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,.28));pointer-events:none}
    .music-toggle.is-playing img{filter:drop-shadow(0 0 7px rgba(52,174,112,.65))}
    .music-toggle[data-page="river"].is-playing img{animation:musicBreath 2.8s ease-in-out infinite}
    .music-toggle[hidden]{display:none!important}
    .music-toggle:not([data-page="river"]){width:44px;height:44px;display:grid;place-items:center;background:transparent;border-radius:50%}
    .music-toggle:not([data-page="river"])::before{content:"";position:absolute;inset:3px;border-radius:50%;background:rgba(155,163,166,.55);pointer-events:none}
    .music-toggle:not([data-page="river"]) img{width:38px;height:38px;filter:drop-shadow(0 1px 2px rgba(63,91,103,.16))}
    .music-toggle:not([data-page="river"]).is-playing::before{box-shadow:0 0 7px rgba(137,202,170,.24)}
    .music-toggle:not([data-page="river"]).is-playing img{animation:musicIntroHop 2.8s ease-in-out infinite;filter:drop-shadow(0 0 3px rgba(137,202,170,.42))}
    .music-spark{position:absolute;width:3px;height:3px;background:#9bd9b5;clip-path:polygon(50% 0,65% 35%,100% 50%,65% 65%,50% 100%,35% 65%,0 50%,35% 35%);opacity:0;pointer-events:none}
    .spark-a{top:3px;right:5px}.spark-b{bottom:6px;left:4px}
    .music-toggle:not([data-page="river"]).is-playing .spark-a{animation:sparkTwinkle 1.8s ease-in-out infinite}
    .music-toggle:not([data-page="river"]).is-playing .spark-b{animation:sparkTwinkle 1.8s .7s ease-in-out infinite}
    .music-toggle[data-page="loading"]{background:rgba(255,255,255,.28)}
    .music-toggle[data-page="cover"]{background:rgba(255,255,255,.22)}
    .music-toggle[data-page="quiz"]{background:rgba(255,255,255,.3)}
    .music-toggle[data-page="video"]{background:rgba(33,64,68,.38)}
    .music-toggle[data-page="river"]{background:rgba(255,255,255,.16)}
    .music-toggle:not([data-page="river"]){background:transparent}
    @keyframes musicBreath{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}
    @keyframes musicIntroHop{0%,22%,75%,100%{transform:translate(0,0) rotate(0deg)}35%{transform:translate(-1px,-2px) rotate(-3deg)}48%{transform:translate(1px,1px) rotate(3deg)}62%{transform:translate(0,-1px) rotate(-1deg)}}
    @keyframes sparkTwinkle{0%,100%{opacity:0;transform:scale(.5)}45%{opacity:.8;transform:scale(1)}60%{opacity:.15;transform:scale(.7)}}
    @media(prefers-reduced-motion:reduce){.music-toggle.is-playing img,.music-toggle.is-playing .music-spark{animation:none!important}}
    .music-toggle:focus-visible{outline:2px solid #fff;outline-offset:2px;border-radius:50%}
  `;
  document.head.appendChild(style);

  let enabled=true,playing=false;
  function show(value,isPlaying=false){
    enabled=Boolean(value);
    playing=Boolean(isPlaying);
    icon.src=button.dataset.page==='river'?(playing&&enabled?greenIcon:grayIcon):(playing&&enabled?introPlayingIcon:introIcon);
    button.classList.toggle('is-playing',playing&&enabled);
    button.setAttribute('aria-pressed',String(enabled));
    button.setAttribute('aria-label',enabled?'关闭背景音乐':'开启背景音乐');
    button.title=button.getAttribute('aria-label');
  }
  show(true);
  function updatePage(){
    const riverPage=document.querySelector('.stage');
    if(document.body.classList.contains('final-letter-active')){button.dataset.page='final-letter';}
    else if(document.body.classList.contains('recipient-active')){button.dataset.page='recipient';}
    else if(riverPage){button.dataset.page='river';}
    else if(document.getElementById('letterVideo')){button.dataset.page=document.getElementById('videoWrapper')?.classList.contains('active')?'video':'envelope';}
    else {
      const visible=id=>{const el=document.getElementById(id);return el&&!el.classList.contains('hidden')&&getComputedStyle(el).pointerEvents!=='none';};
      button.dataset.page=visible('quizPage')?'quiz':visible('coverPage')?'cover':'loading';
    }
    show(enabled,playing);
    button.hidden=button.dataset.page==='loading';
  }
  function layoutButton(){
    const finalLetter=button.dataset.page==='final-letter';
    const recipient=button.dataset.page==='recipient'||finalLetter;
    const stage=finalLetter?document.querySelector('.final-letter-scene'):recipient?document.querySelector('.recipient-scene'):document.querySelector('.stage-container:not([hidden]),.stage');
    button.hidden=!stage||button.dataset.page==='loading';
    if(!stage)return;
    const rect=stage.getBoundingClientRect();
    const isRiver=button.dataset.page==='river';
    button.style.left=isRiver?`${Math.round(rect.right-52-12)}px`:recipient?`${Math.round(rect.right-44-12)}px`:`max(${Math.round(rect.left+14)}px,calc(env(safe-area-inset-left,0px) + 14px))`;
    button.style.right='auto';
    const topInset=(isRiver||recipient)?12:button.dataset.page==='loading'?68:button.dataset.page==='quiz'?42:button.dataset.page==='cover'?34:button.dataset.page==='video'?26:30;
    button.style.top=`max(${Math.round(Math.max(rect.top+topInset,topInset))}px,calc(env(safe-area-inset-top,0px) + ${topInset}px))`;
  }
  updatePage();
  layoutButton();
  addEventListener('resize',layoutButton,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(layoutButton,80),{passive:true});
  addEventListener('recipient-layout',()=>{updatePage();layoutButton();});
  new ResizeObserver(layoutButton).observe(document.querySelector('.stage-container,.stage'));
  new MutationObserver(records=>{
    if(records.every(record=>record.target===button||button.contains(record.target)))return;
    updatePage();layoutButton();
  }).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','style','hidden']});
  button.addEventListener('click',()=>{
    if(enabled&&!playing){window.H5Audio?.startBgm();return;}
    show(!enabled);
    window.H5Audio?.setBgmEnabled(enabled);
  });

  if(parent!==window&&new URLSearchParams(location.search).has('embedded')){
    addEventListener('message',event=>{
      if(event.source===parent&&event.data?.type==='porpoise-bgm-state')show(event.data.enabled,event.data.playing);
    });
    window.H5Audio?.requestBgmState();
  } else {
    const state=window.H5Audio?.getState();
    show(state?.bgmEnabled ?? true,state?.bgmPlaying ?? false);
    addEventListener('porpoise-bgm-state',event=>show(event.detail.enabled,event.detail.playing));
    const begin=event=>{
      if(button.dataset.page==='loading')return;
      if(event.target.closest?.('.music-toggle'))return;
      window.H5Audio?.startBgm();
      removeEventListener('pointerdown',begin,true);
      removeEventListener('keydown',begin,true);
    };
    addEventListener('pointerdown',begin,true);
    addEventListener('keydown',begin,true);
  }
})();
