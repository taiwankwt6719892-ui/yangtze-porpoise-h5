(() => {
  const button=document.createElement('button');
  button.className='music-toggle';
  button.type='button';
  const assetBase=new URL('./',document.currentScript.src);
  button.innerHTML='<img alt="">';
  const icon=button.querySelector('img');
  const grayIcon=new URL('music-icon.png',assetBase).href;
  const greenIcon=new URL('music-icon-playing.png',assetBase).href;
  document.body.appendChild(button);

  const style=document.createElement('style');
  style.textContent=`
    .music-toggle{position:fixed;z-index:60;top:12px;left:auto;right:12px;width:52px;height:52px;border:0;padding:0;background:rgba(255,255,255,.18);border-radius:50%;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:top .25s ease,left .25s ease,background .25s ease,opacity .25s ease}
    .music-toggle img{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,.28));pointer-events:none}
    .music-toggle.is-playing img{filter:drop-shadow(0 0 7px rgba(52,174,112,.65))}
    .music-toggle.is-playing{animation:musicBreath 2.8s ease-in-out infinite}
    .music-toggle[data-page="loading"]{background:rgba(255,255,255,.28)}
    .music-toggle[data-page="cover"]{background:rgba(255,255,255,.22)}
    .music-toggle[data-page="quiz"]{background:rgba(255,255,255,.3)}
    .music-toggle[data-page="video"]{background:rgba(33,64,68,.38)}
    .music-toggle[data-page="river"]{background:rgba(255,255,255,.16)}
    @keyframes musicBreath{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}
    .music-toggle:focus-visible{outline:2px solid #fff;outline-offset:2px;border-radius:50%}
  `;
  document.head.appendChild(style);

  let enabled=true,playing=false;
  function show(value,isPlaying=false){
    enabled=Boolean(value);
    playing=Boolean(isPlaying);
    icon.src=playing&&enabled?greenIcon:grayIcon;
    button.classList.toggle('is-playing',playing&&enabled);
    button.setAttribute('aria-pressed',String(enabled));
    button.setAttribute('aria-label',enabled?'关闭背景音乐':'开启背景音乐');
    button.title=button.getAttribute('aria-label');
  }
  show(true);
  function updatePage(){
    const riverPage=document.querySelector('.stage');
    if(riverPage){button.dataset.page='river';return;}
    if(document.getElementById('letterVideo')){button.dataset.page='video';return;}
    const visible=id=>{const el=document.getElementById(id);return el&&!el.classList.contains('hidden')&&getComputedStyle(el).opacity!=='0';};
    button.dataset.page=visible('quizPage')?'quiz':visible('coverPage')?'cover':'loading';
  }
  function layoutButton(){
    const stage=document.querySelector('.stage-container:not([hidden]),.stage');
    if(!stage)return;
    const rect=stage.getBoundingClientRect();
    const inset=12;
    button.style.left=`${Math.round(rect.right-52-inset)}px`;
    button.style.right='auto';
    const topInset=button.dataset.page==='loading'?20:button.dataset.page==='quiz'?18:14;
    button.style.top=`${Math.round(Math.max(rect.top+topInset,12))}px`;
  }
  updatePage();
  layoutButton();
  addEventListener('resize',layoutButton,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(layoutButton,80),{passive:true});
  new MutationObserver(()=>{updatePage();layoutButton();}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','style','hidden']});
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
      if(event.target.closest?.('.music-toggle'))return;
      window.H5Audio?.startBgm();
      removeEventListener('pointerdown',begin,true);
      removeEventListener('keydown',begin,true);
    };
    addEventListener('pointerdown',begin,true);
    addEventListener('keydown',begin,true);
  }
})();
