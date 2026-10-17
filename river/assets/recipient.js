/* Same-document final scene keeps the parent's BGM and the river scroll intact. */
(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const assets='assets/recipient/';
  const entry=document.createElement('button');
  entry.type='button';entry.className='receive-letter';entry.setAttribute('aria-label','收下这封信');
  entry.innerHTML=`<img src="${assets}receive-letter.webp" alt="" draggable="false">`;
  stage.appendChild(entry);
  const screen=document.createElement('section');
  screen.className='recipient-screen';screen.hidden=true;screen.setAttribute('aria-label','确认收信人');
  screen.innerHTML=`<div class="recipient-scene"><img class="recipient-background" src="${assets}recipient-bg.webp" width="940" height="1672" alt="这封信，想寄给你。一路走过长江，我收集了沿途的故事。现在，想把这一路的记忆，寄到你手中。"><button class="recipient-return" type="button">← 返回江面</button><form class="recipient-form" novalidate><label class="recipient-field"><img src="${assets}recipient-field.webp" alt=""><input aria-label="收信人姓名" placeholder="写下你的名字……" maxlength="20" autocomplete="off" enterkeyhint="done" spellcheck="false" aria-describedby="recipientFeedback"></label><p id="recipientFeedback" class="recipient-feedback" role="status" aria-live="polite"></p><button class="recipient-confirm" type="submit"><img src="${assets}confirm-recipient.webp" alt="确认收信人"></button></form></div>`;
  document.body.appendChild(screen);
  const scene=screen.querySelector('.recipient-scene'),field=screen.querySelector('.recipient-field');
  const input=screen.querySelector('input'),confirm=screen.querySelector('.recipient-confirm');
  const feedback=screen.querySelector('.recipient-feedback'),back=screen.querySelector('.recipient-return');
  const overlay=document.createElement('div');overlay.className='receive-transition';overlay.hidden=true;overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML='<div class="water-ring"></div><div class="water-ring"></div><div class="receive-tail"></div><div class="flying-envelope"><div class="envelope-body"></div><div class="envelope-flap"></div></div><div class="water-light"></div>';
  document.body.appendChild(overlay);
  const status=document.createElement('div');status.className='receive-status';status.setAttribute('role','status');document.body.appendChild(status);
  let phase='river',visited=false,preloadPromise,savedY=0,savedBody,savedMotion;
  const running=new Set();
  function animate(el,frames,options){
    const animation=el.animate(frames,{fill:'both',...options});running.add(animation);
    return animation.finished.catch(()=>{});
  }
  function preload(){
    if(!preloadPromise)preloadPromise=Promise.all([...screen.querySelectorAll('img'),entry.querySelector('img'),characterImage].map(image=>{
      if(image.complete&&image.naturalWidth)return Promise.resolve();
      return new Promise((resolve,reject)=>{
        const finish=error=>{clearTimeout(timer);image.removeEventListener('load',loaded);image.removeEventListener('error',failed);error?reject(error):resolve();};
        const loaded=()=>finish(),failed=()=>finish(new Error('素材加载失败'));
        const timer=setTimeout(()=>finish(new Error('素材加载超时')),12000);
        image.addEventListener('load',loaded,{once:true});image.addEventListener('error',failed,{once:true});
        if(image.complete&&!image.naturalWidth)image.src=image.src.split('?')[0]+'?retry='+Date.now();
      });
    })).catch(error=>{preloadPromise=null;throw error;});
    return preloadPromise;
  }
  // Decode without changing the current river view, retry on a later click if needed.
  setTimeout(()=>preload().catch(()=>{}),500);
  function sizeScene(){
    if(phase==='river')return;
    const keyboard=document.activeElement===input;
    if(!keyboard)screen.style.setProperty('--recipient-height',innerHeight+'px');
    screen.style.setProperty('--recipient-visible-height',(visualViewport?.height||innerHeight)+'px');
    dispatchEvent(new Event('recipient-layout'));
  }
  addEventListener('resize',sizeScene,{passive:true});
  visualViewport?.addEventListener('resize',()=>{sizeScene();if(document.activeElement===input)input.scrollIntoView({block:'center',behavior:'smooth'});},{passive:true});
  input.addEventListener('focus',()=>setTimeout(()=>{sizeScene();input.scrollIntoView({block:'center',behavior:'smooth'});},250));
  input.addEventListener('blur',()=>setTimeout(sizeScene,300));
  function lock(){
    savedY=scrollY;savedBody={position:document.body.style.position,top:document.body.style.top,width:document.body.style.width,overflow:document.body.style.overflow};
    savedMotion={current:{...current},target:{...target},delayed:{...delayedTarget},previous:{...previous}};
    deliveryLock=true;letterReading=true;deliveryTarget=null;
    stage.inert=true;Object.assign(document.body.style,{position:'fixed',top:-savedY+'px',width:'100%',overflow:'hidden'});
    window.H5Audio?.setSwim(0,false);
  }
  function unlock(){
    Object.assign(document.body.style,savedBody);window.scrollTo(0,savedY);
    current={...savedMotion.current};target={...savedMotion.target};delayedTarget={...savedMotion.delayed};previous={...savedMotion.previous};
    deliveryLock=false;letterReading=false;deliveryTarget=null;stage.inert=false;
  }
  function cleanup(){
    for(const a of running)a.cancel();running.clear();
    overlay.querySelectorAll('.receive-spark').forEach(el=>el.remove());overlay.hidden=true;
    window.H5Audio?.setTransitionDucked(false);
  }
  async function open(){
    if(phase!=='river'||deliveryLock||letterReading)return;
    phase='loading';entry.setAttribute('aria-busy','true');
    // Unlock audio inside the user gesture, before awaiting image loading.
    window.H5Audio?.unlock();
    const timer=setTimeout(()=>{status.textContent='正在准备这封信……';},250);
    try{await preload();}catch{
      phase='river';status.textContent='信件还未准备好，请再点一次';setTimeout(()=>status.textContent='',3000);return;
    }finally{clearTimeout(timer);entry.removeAttribute('aria-busy');}
    status.textContent='';if(deliveryLock||letterReading){phase='river';return;}phase='opening';lock();
    window.H5Audio?.setTransitionDucked(true);window.H5Audio?.receive();
    screen.style.setProperty('--recipient-height',innerHeight+'px');
    screen.style.setProperty('--recipient-visible-height',(visualViewport?.height||innerHeight)+'px');
    screen.hidden=false;screen.inert=true;screen.scrollTop=0;scene.style.opacity='0';screen.classList.add('is-arriving');
    document.body.classList.add('recipient-active','recipient-opening');
    const simple=visited||reduced.matches;
    if(simple){
      await animate(scene,[{opacity:0},{opacity:1}],{duration:350});
    }else{
      overlay.hidden=false;
      const r=entry.getBoundingClientRect(),bounds=stage.getBoundingClientRect();
      const x=r.left+r.width*.5,y=r.top+r.height*.47;
      const endX=innerWidth/2-29,endY=innerHeight*.45-20;
      overlay.style.setProperty('--receive-x',x+'px');overlay.style.setProperty('--receive-y',y+'px');
      const midX=x+(endX+29-x)*.45-45,midY=Math.min(y,innerHeight*.45)-80;
      const tasks=[];
      tasks.push(animate(entry,[{transform:'translate(-50%,-50%) scale(1)'},{transform:'translate(-50%,-50%) scale(.94)'},{transform:'translate(-50%,-50%) scale(1)'}],{duration:480}));
      // The real character approaches the receiving point; map state is restored on return.
      const d=dolphin.getBoundingClientRect();
      tasks.push(animate(dolphin,[{transform:'translate(-50%,-50%)'},{transform:`translate(calc(-50% + ${x-d.left-d.width/2}px),calc(-50% + ${y-38-d.top-d.height/2}px))`}],{duration:650,easing:'cubic-bezier(.2,.6,.3,1)'}));
      [...overlay.querySelectorAll('.water-ring')].forEach((el,i)=>tasks.push(animate(el,[{opacity:0,transform:'scale(.5)'},{opacity:.8,offset:.22},{opacity:0,transform:'scale(3.4)'}],{duration:1100,delay:i*180,easing:'ease-out'})));
      const envelope=overlay.querySelector('.flying-envelope');
      tasks.push(animate(envelope,[{opacity:0,transform:`translate(${x-29}px,${y-20}px) scale(.4) rotate(-12deg)`},{opacity:1,transform:`translate(${midX}px,${midY}px) scale(.9) rotate(9deg)`,offset:.48},{opacity:1,transform:`translate(${endX}px,${endY}px) scale(1.7) rotate(-3deg)`,offset:.8},{opacity:0,transform:`translate(${endX}px,${endY-12}px) scale(2.5) rotate(0deg)`}],{duration:1400,delay:400,easing:'cubic-bezier(.25,.5,.3,1)'}));
      tasks.push(animate(overlay.querySelector('.envelope-flap'),[{transform:'rotateX(0deg)'},{transform:'rotateX(165deg)'}],{duration:400,delay:1200}));
      tasks.push(animate(overlay.querySelector('.receive-tail'),[{opacity:0,transform:`translate(${x-70}px,${y}px) rotate(-35deg)`},{opacity:.65,transform:`translate(${midX-30}px,${midY+30}px) rotate(-25deg)`},{opacity:0,transform:`translate(${endX-50}px,${endY+20}px) rotate(-10deg)`}],{duration:1000,delay:480}));
      for(let i=0;i<16;i++){
        const spark=document.createElement('i');spark.className='receive-spark';overlay.appendChild(spark);
        const angle=i*2.39996,rad=35+(i%5)*22;
        tasks.push(animate(spark,[{opacity:0,transform:`translate(${x}px,${y}px) scale(.5)`},{opacity:.8,transform:`translate(${endX+29+Math.cos(angle)*rad*.3}px,${endY+20+Math.sin(angle)*rad*.3}px) scale(1)`,offset:.6},{opacity:0,transform:`translate(${endX+29+Math.cos(angle)*rad}px,${endY+20+Math.sin(angle)*rad}px) scale(.2)`}],{duration:1500,delay:400+i*27,easing:'ease-out'}));
      }
      tasks.push(animate(overlay.querySelector('.water-light'),[{opacity:0,transform:'scale(.15)'},{opacity:1,transform:'scale(1)',offset:.5},{opacity:0,transform:'scale(1.2)'}],{duration:1500,delay:1000,easing:'ease-in-out'}));
      tasks.push(animate(scene,[{opacity:0,transform:'translateY(12px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:650,delay:1600,easing:'ease-out'}));
      tasks.push(animate(field,[{opacity:0},{opacity:1}],{duration:350,delay:2100}));
      tasks.push(animate(confirm,[{opacity:0,filter:'brightness(1)'},{opacity:1,filter:'brightness(1.14)',offset:.65},{opacity:1,filter:'brightness(1)'}],{duration:350,delay:2150}));
      await Promise.all(tasks);
    }
    scene.style.opacity='1';cleanup();screen.classList.remove('is-arriving');document.body.classList.remove('recipient-opening');screen.inert=false;visited=true;phase='recipient';back.focus({preventScroll:true});dispatchEvent(new Event('recipient-layout'));
    window.H5FinalLetter?.preload().catch(()=>{});
  }
  async function close(){
    if(phase!=='recipient')return;
    phase='closing';input.blur();window.H5Audio?.back();
    await animate(scene,[{opacity:1},{opacity:0}],{duration:reduced.matches?1:220});
    screen.hidden=true;screen.inert=true;document.body.classList.remove('recipient-active');cleanup();unlock();phase='river';entry.focus({preventScroll:true});
  }
  screen.querySelector('form').addEventListener('submit',async event=>{
    event.preventDefault();if(phase!=='recipient')return;
    feedback.classList.remove('is-error');input.removeAttribute('aria-invalid');
    const name=input.value.trim();
    if(!name){feedback.textContent='请先写下你的名字';feedback.classList.add('is-error');input.setAttribute('aria-invalid','true');input.focus();return;}
    input.value=name;input.blur();phase='final-preparing';confirm.disabled=true;screen.inert=true;
    const timer=setTimeout(()=>feedback.textContent='正在为你写好这封信……',400);
    try{
      await Promise.all([
        animate(confirm,[{transform:'scale(1)'},{transform:'scale(.96)'},{transform:'scale(1)'}],{duration:220}),
        animate(field,[{filter:'brightness(1)'},{filter:'brightness(1.08)'},{filter:'brightness(1)'}],{duration:220})
      ]);
      await window.H5FinalLetter.show(name);phase='final';feedback.textContent='';
    }catch{
      phase='recipient';screen.inert=false;feedback.classList.add('is-error');feedback.textContent='信件生成暂未完成，请再试一次';confirm.focus({preventScroll:true});
    }finally{clearTimeout(timer);confirm.disabled=false;cleanup();}
  });
  addEventListener('final-letter-back',()=>{
    phase='recipient';screen.inert=false;feedback.textContent='';feedback.classList.remove('is-error');confirm.disabled=false;
    sizeScene();confirm.focus({preventScroll:true});
  });
  input.addEventListener('input',()=>{input.removeAttribute('aria-invalid');feedback.textContent='';feedback.classList.remove('is-error');});
  entry.addEventListener('click',open);back.addEventListener('click',close);
  screen.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
})();
