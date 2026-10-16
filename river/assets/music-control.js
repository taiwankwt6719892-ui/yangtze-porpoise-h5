(() => {
  const button=document.createElement('button');
  button.className='music-toggle';
  button.type='button';
  button.innerHTML='<img src="assets/music-icon.png" alt="">';
  const icon=button.querySelector('img');
  document.body.appendChild(button);

  const style=document.createElement('style');
  style.textContent=`
    .music-toggle{position:fixed;z-index:10;top:calc(env(safe-area-inset-top,0px) + 12px);right:max(12px,calc((100vw - 640px)/2 + 12px));width:52px;height:52px;border:0;padding:0;background:transparent;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    .music-toggle img{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,.28));pointer-events:none}
    .music-toggle:focus-visible{outline:2px solid #fff;outline-offset:2px;border-radius:50%}
  `;
  document.head.appendChild(style);

  let enabled=true,playing=false;
  function show(value,isPlaying=false){
    enabled=Boolean(value);
    playing=Boolean(isPlaying);
    icon.src=playing&&enabled?'assets/music-icon-playing.png':'assets/music-icon.png';
    button.setAttribute('aria-pressed',String(enabled));
    button.setAttribute('aria-label',enabled?'关闭背景音乐':'开启背景音乐');
    button.title=button.getAttribute('aria-label');
  }
  show(true);
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
