/* MP3 playback lives in the parent page so changing to the river view
   preserves the departure gesture and the long swimming track. */
(() => {
  const names=['unlock','delivery','correct','departure','mailbox','paper','page','back','setSwim','setMasterVolume','setBgmVolume','startBgm','setBgmEnabled','setBgmDucked','setVideoDucked','requestBgmState'];
  if(parent!==window&&new URLSearchParams(location.search).has('embedded')){
    window.H5Audio=Object.fromEntries(names.map(name=>[name,(...args)=>parent.postMessage({type:'porpoise-audio',name,args},'*')]));
    ['pointerdown','touchend','keydown'].forEach(type=>addEventListener(type,()=>window.H5Audio.unlock(),{passive:true}));
    return;
  }
  const audioBase=new URL('audio/',document.currentScript.src);
  let ctx,master,sfx,bgm,noise,deliveryTrack,correctTrack,departureTrack,mailboxTrack,swimTrack,bgmTrack;
  let masterVolume=.85,bgmVolume=.09,speed=0,active=false,underwater=false,lastUpdate=0;
  let swimLevel=0,lastTick=performance.now(),priming=false,primed=false,departing=false;
  let bgmEnabled=true,bgmIntent=false,bgmDucked=false,videoDucked=false,bgmLevel=0,bgmPulseUntil=0;
  try { bgmEnabled=localStorage.getItem('porpoise-bgm-enabled')!=='false'; } catch {}
  const cooldown=new Map();
  function track(filename,loop,initialLevel,bus=sfx){
    const media=new Audio(new URL(filename,audioBase).href);
    media.preload='auto';media.loop=loop;media.setAttribute('playsinline','');
    // Local file origins cannot safely be read through MediaElementAudioSource.
    // HTTP(S) gain nodes also provide reliable fades on iOS.
    let gain=null,source=null;
    if(location.protocol!=='file:'){
      source=ctx.createMediaElementSource(media);gain=ctx.createGain();gain.gain.value=initialLevel;
      source.connect(gain).connect(bus);
    } else media.volume=initialLevel*masterVolume*(bus===bgm?bgmVolume:1);
    return {media,gain,source,level:initialLevel,pending:false,retryAfter:0,error:null,bus};
  }
  function level(item,value){
    item.level=value;
    if(item.gain)item.gain.gain.setTargetAtTime(value,ctx.currentTime,.02);
    else item.media.volume=Math.max(0,Math.min(1,value*masterVolume*(item.bus===bgm?bgmVolume:1)));
  }
  function ensure(){
    if(ctx)return ctx;
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)return null;
    ctx=new Context();master=ctx.createGain();master.gain.value=masterVolume;
    sfx=ctx.createGain();bgm=ctx.createGain();bgm.gain.value=bgmVolume;
    const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-12;limiter.ratio.value=6;
    sfx.connect(master);bgm.connect(master);master.connect(limiter).connect(ctx.destination);
    noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
    const data=noise.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.3;
    deliveryTrack=track('delivery.mp3',false,.46);
    correctTrack=track('correct.mp3',false,.52);
    departureTrack=track('departure.mp3',false,.58);
    mailboxTrack=track('mailbox.mp3',false,.48);
    swimTrack=track('swim.mp3',true,0);
    bgmTrack=track('bgm.mp3',false,0,bgm);
    bgmTrack.media.addEventListener('playing',publishBgmState);
    bgmTrack.media.addEventListener('pause',publishBgmState);
    bgmTrack.media.addEventListener('ended',()=>{
      if(bgmIntent&&bgmEnabled&&!document.hidden){bgmLevel=0;level(bgmTrack,0);bgmTrack.media.currentTime=0;start(bgmTrack);}
    });
    return ctx;
  }
  function publishBgmState(){
    const state={type:'porpoise-bgm-state',enabled:bgmEnabled,playing:!!bgmTrack&&!bgmTrack.media.paused&&bgmEnabled&&!document.hidden};
    dispatchEvent(new CustomEvent('porpoise-bgm-state',{detail:state}));
    const frame=document.getElementById('riverFrame');
    if(frame?.contentWindow)frame.contentWindow.postMessage(state,'*');
  }
  function startBgm(){
    bgmIntent=true;
    unlock();
    if(bgmEnabled&&bgmTrack&&!document.hidden)start(bgmTrack);
    publishBgmState();
  }
  function setBgmEnabled(value){
    bgmEnabled=Boolean(value);
    try {localStorage.setItem('porpoise-bgm-enabled',String(bgmEnabled));} catch {}
    if(bgmEnabled)startBgm();
    else if(!bgmEnabled&&bgmTrack)setTimeout(()=>{
      if(!bgmEnabled){bgmLevel=0;level(bgmTrack,0);bgmTrack.media.pause();}
    },260);
    publishBgmState();
  }
  function setBgmDucked(value){bgmDucked=Boolean(value);}
  function setVideoDucked(value){videoDucked=Boolean(value);}
  function start(item){
    if(item.pending||!item.media.paused||performance.now()<item.retryAfter)return;
    item.pending=true;
    item.media.play().then(()=>{item.error=null;}).catch(error=>{
      item.error=error.name;item.retryAfter=performance.now()+1000;
    }).finally(()=>{item.pending=false;});
  }
  function unlock(){
    const c=ensure();if(!c||document.hidden)return Promise.resolve(false);
    const resumed=c.resume().then(()=>true).catch(()=>false);
    // Prime the long track silently in the actual click handler. Do not reload
    // it on subsequent clicks: that would reset its playhead.
    if(!primed&&!priming){
      priming=true;
      swimTrack.media.play().then(()=>{
        primed=true;
        if(!active)swimTrack.media.pause();
      }).catch(()=>{}).finally(()=>{priming=false;});
    }
    return resumed;
  }
  function tone(freq,delay,duration,amount){
    const t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();
    o.type='sine';o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.78,t+duration);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(amount,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    o.connect(g).connect(sfx);o.start(t);o.stop(t+duration+.01);
    o.onended=()=>{o.disconnect();g.disconnect();};
  }
  function rustle(duration,amount){
    const t=ctx.currentTime,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();
    source.buffer=noise;filter.type='highpass';filter.frequency.value=1400;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(amount,t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    source.connect(filter).connect(g).connect(sfx);source.start(t);source.stop(t+duration);
    source.onended=()=>{source.disconnect();filter.disconnect();g.disconnect();};
  }
  function play(name){
    const now=performance.now();if(now-(cooldown.get(name)||-1000)<180)return;
    cooldown.set(name,now);
    const ready=unlock();if(!ctx||document.hidden)return;
    if(name==='delivery'&&deliveryTrack){deliveryTrack.media.currentTime=0;start(deliveryTrack);return;}
    if(name==='correct'&&correctTrack){correctTrack.media.currentTime=0;start(correctTrack);return;}
    if(name==='departure'){
      // Start synchronously with the departure click, not after an awaited load.
      if(departing)return;departing=true;
      departureTrack.media.currentTime=0;start(departureTrack);
      departureTrack.media.onended=()=>{departing=false;};
      return;
    }
    ready.then(ok=>{
      if(!ok||document.hidden)return;
      if(name==='mailbox'){
        mailboxTrack.media.currentTime=0;
        start(mailboxTrack);
        bgmPulseUntil=performance.now()+1000;
      }
      if(name==='back')tone(480,0,.18,.04);
      if(name==='paper'||name==='page')rustle(name==='paper'?.3:.2,name==='paper'?.12:.09);
    });
  }
  function setSwim(value,moving=true,diving=false){
    speed=Math.max(0,Math.min(Number(value)||0,40));
    active=Boolean(moving)&&speed>.15;underwater=Boolean(diving);lastUpdate=performance.now();
  }
  setInterval(()=>{
    const now=performance.now(),dt=Math.min(100,now-lastTick);lastTick=now;
    if(!ctx||ctx.state!=='running'||document.hidden)return;
    const moving=active&&now-lastUpdate<300;
    const target=moving?1.5*Math.min(.38,.146+speed*.0092)*(underwater?.35:1):0;
    swimLevel+=(target-swimLevel)*(1-Math.exp(-dt/(moving?65:130)));
    if(!moving&&swimLevel<.002)swimLevel=0;
    level(swimTrack,swimLevel);
    if(moving&&!priming)start(swimTrack);
    else if(!moving&&swimLevel===0&&!priming)swimTrack.media.pause();
    const musicWanted=bgmIntent&&bgmEnabled;
    const duration=bgmTrack.media.duration;
    const remaining=Number.isFinite(duration)?duration-bgmTrack.media.currentTime:Infinity;
    const loopFade=Math.max(0,Math.min(1,remaining/.8));
    const bgmTarget=musicWanted?(bgmDucked?.4:1)*(videoDucked?.24:1)*(moving?.7:1)*(now<bgmPulseUntil?.65:1)*loopFade:0;
    bgmLevel+=(bgmTarget-bgmLevel)*(1-Math.exp(-dt/(bgmTarget>bgmLevel?450:180)));
    if(bgmLevel<.002&&bgmTarget===0)bgmLevel=0;
    level(bgmTrack,bgmLevel);
    if(musicWanted&&bgmTrack.media.paused&&!bgmTrack.pending)start(bgmTrack);
    else if(!musicWanted&&bgmLevel===0&&!bgmTrack.media.paused)bgmTrack.media.pause();
    // Pause preserves currentTime; the next swim continues the same recording.
  },40);
  function stopAll(){
    active=false;swimLevel=0;
    if(!ctx)return;
    level(swimTrack,0);swimTrack.media.pause();bgmLevel=0;level(bgmTrack,0);bgmTrack.media.pause();deliveryTrack.media.pause();correctTrack.media.pause();departureTrack.media.pause();mailboxTrack.media.pause();departing=false;
    ctx.suspend().catch(()=>{});
  }
  const api={
    unlock,setSwim,startBgm,setBgmEnabled,setBgmDucked,setVideoDucked,requestBgmState:publishBgmState,
    setMasterVolume(value){masterVolume=Math.max(0,Math.min(1,value));if(master){master.gain.setTargetAtTime(masterVolume,ctx.currentTime,.1);level(swimTrack,swimLevel);level(bgmTrack,bgmLevel);level(deliveryTrack,.46);level(correctTrack,.52);level(departureTrack,.58);level(mailboxTrack,.48);}},
    setBgmVolume(value){bgmVolume=Math.max(0,Math.min(1,value));if(bgm){bgm.gain.setTargetAtTime(bgmVolume,ctx.currentTime,.1);level(bgmTrack,bgmLevel);}},
    getBgmInput(){ensure();return {context:ctx,input:bgm};},
    getState(){return {state:ctx?.state||'uninitialized',active,speed,underwater,swimPlaying:!!swimTrack&&!swimTrack.media.paused,swimVolume:swimLevel,swimTime:swimTrack?.media.currentTime||0,swimDuration:swimTrack?.media.duration||0,bgmEnabled,bgmDucked,videoDucked,bgmPlaying:!!bgmTrack&&!bgmTrack.media.paused,bgmTime:bgmTrack?.media.currentTime||0,bgmDuration:bgmTrack?.media.duration||0,bgmLevel,bgmUrl:bgmTrack?.media.src,bgmError:bgmTrack?.error,deliveryUrl:deliveryTrack?.media.src,correctUrl:correctTrack?.media.src,departurePlaying:!!departureTrack&&!departureTrack.media.paused,departureDuration:departureTrack?.media.duration||0,departureUrl:departureTrack?.media.src,swimUrl:swimTrack?.media.src,swimError:swimTrack?.error};}
  };
  ['delivery','correct','departure','mailbox','paper','page','back'].forEach(name=>api[name]=()=>play(name));
  window.H5Audio=api;
  ['pointerdown','touchend','keydown'].forEach(type=>addEventListener(type,()=>unlock(),{passive:true}));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll();else{ctx?.resume().catch(()=>{});if(bgmIntent&&bgmEnabled&&bgmTrack)start(bgmTrack);}});
  addEventListener('pagehide',stopAll);
  addEventListener('pageshow',()=>{if(ctx&&!document.hidden){ctx.resume().catch(()=>{});if(bgmIntent&&bgmEnabled)start(bgmTrack);}});
  addEventListener('message',event=>{
    const frame=document.getElementById('riverFrame'),data=event.data;
    if(!frame||event.source!==frame.contentWindow||data?.type!=='porpoise-audio'||!names.includes(data.name)||!Array.isArray(data.args))return;
    api[data.name](...data.args);
  });
})();
