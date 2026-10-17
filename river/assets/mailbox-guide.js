/* One quiet invitation at a time, attached to the existing mailbox hit areas. */
(() => {
  const stage=document.getElementById('stage');
  const buttons=[...document.querySelectorAll('.mailbox-hit')];
  const visited=new Set();
  let introduced=false,active=null,frame=0,introTimer=0,hideTimer=0;
  try{introduced=sessionStorage.getItem('porpoise-mailbox-intro')==='1';JSON.parse(sessionStorage.getItem('porpoise-mailbox-visited')||'[]').forEach(id=>visited.add(id));}catch{}
  const tip=document.createElement('div');tip.className='mailbox-guide-tip';tip.hidden=true;tip.setAttribute('role','status');tip.textContent='轻点邮箱，打开宜昌来信';document.body.appendChild(tip);
  for(const button of buttons){
    const beacon=document.createElement('span');beacon.className='mailbox-beacon';beacon.setAttribute('aria-hidden','true');beacon.innerHTML='<i class="mailbox-guide-envelope"></i>';button.appendChild(beacon);
  }
  function hideTip(){clearTimeout(introTimer);clearTimeout(hideTimer);tip.classList.remove('is-visible');tip.hidden=true;}
  function positionTip(){
    const r=active.getBoundingClientRect(),map=stage.getBoundingClientRect();
    const width=Math.min(190,map.width-24);tip.style.width=width+'px';
    const fitsBeside=r.left-map.left>width+20;
    const center=fitsBeside?r.left-10-width/2:r.left+r.width/2;
    tip.style.left=Math.max(map.left+width/2+12,Math.min(map.right-width/2-12,center))+'px';
    tip.style.top=Math.min(innerHeight-70,fitsBeside?r.top+r.height*.55-16:r.bottom+8)+'px';
  }
  function update(){
    frame=0;let next=null,distance=Infinity;
    if(!stage.inert&&!document.hidden){
      for(const button of buttons){
        if(visited.has(button.dataset.city))continue;
        const r=button.getBoundingClientRect(),center=r.top+r.height/2;
        if(center<innerHeight*.12||center>innerHeight*.88)continue;
        const delta=Math.abs(center-innerHeight*.52);if(delta<distance){next=button;distance=delta;}
      }
    }
    if(next!==active){
      active?.classList.remove('is-guided');hideTip();active=next;active?.classList.add('is-guided');
      if(active?.dataset.city==='yichang'&&!introduced){
        introTimer=setTimeout(()=>{
          if(active?.dataset.city!=='yichang'||stage.inert)return;
          introduced=true;try{sessionStorage.setItem('porpoise-mailbox-intro','1');}catch{}
          tip.hidden=false;positionTip();tip.classList.add('is-visible');hideTimer=setTimeout(()=>{
            tip.classList.remove('is-visible');hideTimer=setTimeout(()=>{tip.hidden=true;},650);
          },4200);
        },500);
      }
    }
    if(!tip.hidden&&active)positionTip();
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});document.addEventListener('visibilitychange',schedule);
  new MutationObserver(schedule).observe(stage,{attributes:true,attributeFilter:['inert']});
  addEventListener('city-letter-opened',event=>{
    visited.add(event.detail.city);try{sessionStorage.setItem('porpoise-mailbox-visited',JSON.stringify([...visited]));}catch{}schedule();
  });
  schedule();
})();
