/* Export the paper and name together; no server or personal-data upload. */
(() => {
  const assets='assets/final-letter/';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const screen=document.createElement('section');
  screen.className='final-letter-screen';screen.hidden=true;screen.inert=true;screen.setAttribute('aria-label','你的专属来信');
  screen.innerHTML=`<div class="final-letter-scene"><img class="final-letter-background" src="${assets}background.jpg" alt="长江江景"><div class="final-letter-shade"></div><div class="final-letter-paper" role="img"><img class="final-letter-art" alt="天使来信，长江大保护十周年纪念"><img class="final-letter-name" alt=""><i class="final-letter-shimmer" aria-hidden="true"></i></div><button class="final-letter-save" type="button" aria-label="保存专属明信片"><img src="${assets}save-postcard.lossless.webp" alt="点击保存明信片"></button><button class="final-letter-return" type="button">← 返回上一步</button></div>`;
  document.body.appendChild(screen);
  const scene=screen.querySelector('.final-letter-scene'),paper=screen.querySelector('.final-letter-paper');
  const background=screen.querySelector('.final-letter-background'),shade=screen.querySelector('.final-letter-shade');
  const art=screen.querySelector('.final-letter-art'),nameImage=screen.querySelector('.final-letter-name');
  const save=screen.querySelector('.final-letter-save'),back=screen.querySelector('.final-letter-return');
  const preview=document.createElement('section');preview.className='postcard-preview';preview.hidden=true;preview.inert=true;
  preview.setAttribute('role','dialog');preview.setAttribute('aria-modal','true');preview.setAttribute('aria-label','保存专属明信片');
  preview.innerHTML='<div class="postcard-preview-bar"><button type="button">← 返回来信</button><a class="postcard-download">下载明信片 PNG</a></div><img class="postcard-image" alt=""><p class="postcard-instructions"><span class="mobile-instruction">长按图片保存</span><span class="desktop-instruction">点击上方按钮下载，或右键保存图片</span></p>';
  document.body.appendChild(preview);
  const poster=preview.querySelector('.postcard-image'),previewBack=preview.querySelector('button'),download=preview.querySelector('a');
  let phase='closed',templatePromise,assetsPromise,blobURL=null,lastName='',lastNameLayer='',currentName='';
  const animations=new Set();
  function animate(el,frames,options){
    const a=el.animate(frames,{fill:'both',...options});animations.add(a);return a.finished.catch(()=>{});
  }
  function cleanAnimations(){for(const a of animations)a.cancel();animations.clear();scene.querySelectorAll('.letter-edge-spark').forEach(el=>el.remove());}
  function imageReady(image){
    if(image.complete&&image.naturalWidth)return Promise.resolve(image);
    return new Promise((resolve,reject)=>{
      const finish=error=>{clearTimeout(timer);image.removeEventListener('load',loaded);image.removeEventListener('error',failed);error?reject(error):resolve(image);};
      const loaded=()=>finish(),failed=()=>finish(new Error('信件素材加载失败'));
      const timer=setTimeout(()=>finish(new Error('信件素材加载超时')),15000);
      image.addEventListener('load',loaded);image.addEventListener('error',failed);
      if(image.complete&&!image.naturalWidth&&image.src)image.src=image.src.split('?')[0]+'?retry='+Date.now();
    });
  }
  function getTemplate(){
    if(templatePromise)return templatePromise;
    templatePromise=(async()=>{
      let src=assets+'postcard.lossless.webp';
      if(location.protocol==='file:'){
        if(!window.H5PostcardSource)await new Promise((resolve,reject)=>{
          const script=document.createElement('script');script.src=assets+'postcard-local.js';
          const timer=setTimeout(()=>{script.remove();reject(new Error('信纸加载超时'));},15000);
          script.onload=()=>{clearTimeout(timer);script.remove();window.H5PostcardSource?resolve():reject(new Error('信纸未能加载'));};
          script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('信纸未能加载'));};document.head.appendChild(script);
        });
        src=window.H5PostcardSource;
      }
      const image=new Image();image.src=src;return imageReady(image);
    })().catch(error=>{templatePromise=null;throw error;});
    return templatePromise;
  }
  function preload(){
    if(!assetsPromise)assetsPromise=Promise.all([getTemplate(),imageReady(background),imageReady(save.querySelector('img'))]).catch(error=>{assetsPromise=null;throw error;});
    return assetsPromise;
  }
  async function generate(name){
    const image=await getTemplate();
    if(blobURL&&lastName===name)return {url:blobURL,nameLayer:lastNameLayer,template:image.src};
    await document.fonts.ready;
    const textCanvas=document.createElement('canvas');textCanvas.width=640;textCanvas.height=150;
    const text=textCanvas.getContext('2d');let size=92;
    const font=value=>`${value}px KaiTi, STKaiti, "Noto Serif CJK SC", serif`;
    text.font=font(size);
    while(text.measureText(name).width>620&&size>18){size--;text.font=font(size);}
    text.fillStyle='#126e9d';text.textBaseline='alphabetic';text.fillText(name,0,110,620);
    const nameLayer=textCanvas.toDataURL('image/png');
    const canvas=document.createElement('canvas');canvas.width=2347;canvas.height=3340;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,2347,3340);ctx.drawImage(textCanvas,800,2350);
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('图片生成失败')),'image/png'));
    canvas.width=canvas.height=1;textCanvas.width=textCanvas.height=1;
    const url=URL.createObjectURL(blob);if(blobURL)URL.revokeObjectURL(blobURL);
    blobURL=url;lastName=name;lastNameLayer=nameLayer;
    return {url,nameLayer,template:image.src};
  }
  function resize(){
    if(phase==='closed')return;
    const viewportHeight=window.visualViewport?.height||innerHeight;
    screen.style.setProperty('--final-height',innerHeight+'px');
    screen.style.setProperty('--final-visible-height',viewportHeight+'px');
    preview.style.setProperty('--final-visible-height',viewportHeight+'px');
    dispatchEvent(new Event('recipient-layout'));
  }
  addEventListener('resize',resize,{passive:true});window.visualViewport?.addEventListener('resize',resize,{passive:true});
  async function show(name){
    if(phase!=='closed')return;
    phase='preparing';
    try{
      const [,result]=await Promise.all([preload(),generate(name)]);
      currentName=name;art.src=result.template;nameImage.src=result.nameLayer;poster.src=result.url;download.href=result.url;
      download.download=`长江来信-${name.replace(/[\\/:*?"<>|\u0000-\u001f]/g,'').slice(0,20)||'收信人'}.png`;
      paper.setAttribute('aria-label',`天使来信，收信人：${name}。从宜昌到武汉，我把一路的故事寄给你。`);
      poster.alt=`寄给${name}的专属长江来信`;
      await Promise.all([imageReady(art),imageReady(nameImage),imageReady(poster)]);
      phase='opening';screen.hidden=false;screen.inert=true;screen.scrollTop=0;screen.classList.add('is-arriving');resize();
      document.body.classList.add('final-letter-active','final-letter-opening');window.H5Audio?.setTransitionDucked(true);window.H5Audio?.paper();
      if(reduced.matches){await animate(scene,[{opacity:0},{opacity:1}],{duration:250});}
      else{
        const tasks=[
          animate(background,[{opacity:0},{opacity:1}],{duration:600,delay:150}),
          animate(shade,[{opacity:0},{opacity:1}],{duration:650,delay:150}),
          animate(paper,[{opacity:0,transform:'translateY(24px) scale(.96) rotate(-.7deg)',filter:'drop-shadow(0 1px 2px rgba(0,0,0,.1))'},{opacity:1,transform:'translateY(0) scale(1) rotate(0deg)',filter:'drop-shadow(0 6px 12px rgba(0,0,0,.25))'}],{duration:800,delay:350,easing:'cubic-bezier(.2,.7,.25,1)'}),
          animate(nameImage,[{opacity:0},{opacity:1}],{duration:450,delay:900}),
          animate(screen.querySelector('.final-letter-shimmer'),[{opacity:0,transform:'translateX(-25%)'},{opacity:.8,offset:.45},{opacity:0,transform:'translateX(40%)'}],{duration:450,delay:900}),
          animate(save,[{opacity:0,transform:'translateY(7px) scale(.96)'},{opacity:1,transform:'translateY(-1px) scale(1.025)',offset:.7},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:400,delay:1200}),
          animate(back,[{opacity:0},{opacity:1}],{duration:300,delay:1200})
        ];
        for(let i=0;i<6;i++){
          const spark=document.createElement('i');spark.className='letter-edge-spark';spark.setAttribute('aria-hidden','true');
          spark.style.left=(i%2?91:10)+'%';spark.style.top=(31+Math.floor(i/2)*20)+'%';scene.appendChild(spark);
          tasks.push(animate(spark,[{opacity:0,transform:'translate(0,0) scale(.4)'},{opacity:.85,offset:.4},{opacity:0,transform:`translate(${i%2?10:-10}px,-14px) scale(.3)`}],{duration:550,delay:850+i*35}));
        }
        await Promise.all(tasks);
      }
      cleanAnimations();screen.classList.remove('is-arriving');document.body.classList.remove('final-letter-opening');
      window.H5Audio?.setTransitionDucked(false);screen.inert=false;phase='letter';save.classList.add('is-ready');back.focus({preventScroll:true});resize();
    }catch(error){
      cleanAnimations();screen.hidden=true;screen.inert=true;phase='closed';document.body.classList.remove('final-letter-active','final-letter-opening');window.H5Audio?.setTransitionDucked(false);throw error;
    }
  }
  async function returnToInput(){
    if(phase!=='letter')return;
    phase='closing';save.classList.remove('is-ready');window.H5Audio?.back();
    await animate(scene,[{opacity:1},{opacity:0}],{duration:reduced.matches?1:220});
    screen.hidden=true;screen.inert=true;cleanAnimations();document.body.classList.remove('final-letter-active');phase='closed';
    dispatchEvent(new Event('final-letter-back'));dispatchEvent(new Event('recipient-layout'));
  }
  async function openPreview(){
    if(phase!=='letter')return;
    phase='preview-opening';screen.inert=true;save.classList.remove('is-ready');
    const from=paper.getBoundingClientRect();preview.hidden=false;preview.inert=true;preview.scrollTop=0;resize();document.body.classList.add('poster-preview-active');
    const to=poster.getBoundingClientRect();
    await Promise.all([
      animate(preview,[{opacity:0},{opacity:1}],{duration:reduced.matches?1:400}),
      animate(poster,[{transform:`translate(${from.x+from.width/2-to.x-to.width/2}px,${from.y+from.height/2-to.y-to.height/2}px) scale(${from.width/to.width})`},{transform:'translate(0,0) scale(1)'}],{duration:reduced.matches?1:400,easing:'cubic-bezier(.2,.65,.3,1)'})
    ]);
    cleanAnimations();preview.inert=false;phase='preview';previewBack.focus({preventScroll:true});
  }
  async function closePreview(){
    if(phase!=='preview')return;
    phase='preview-closing';await animate(preview,[{opacity:1},{opacity:0}],{duration:reduced.matches?1:180});
    preview.hidden=true;preview.inert=true;cleanAnimations();screen.inert=false;document.body.classList.remove('poster-preview-active');phase='letter';save.classList.add('is-ready');save.focus({preventScroll:true});
  }
  save.addEventListener('click',openPreview);back.addEventListener('click',returnToInput);previewBack.addEventListener('click',closePreview);
  screen.addEventListener('keydown',event=>{if(event.key==='Escape'&&phase==='letter')returnToInput();});
  preview.addEventListener('keydown',event=>{if(event.key==='Escape')closePreview();});
  window.H5FinalLetter={show,preload};
})();
