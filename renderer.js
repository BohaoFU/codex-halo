let current=null,target=0,level=0,phase=0,previous=0,dragging=false,moved=false,start=null;
const $=s=>document.querySelector(s);
const {t,errorText}=window.HaloI18n;
function percentage(w){return w?`${Math.round(w.remaining)}<small>%</small>`:'--<small>%</small>';}
function duration(minutes){if(!minutes)return t('overallTitle');if(minutes===10080)return t('weeklyTitle');return minutes>=1440?t('daysTitle',{n:Math.round(minutes/1440)}):t('hoursTitle',{n:Math.round(minutes/60)});}
function countdown(w){
  if(!w?.resetsAt)return t('unknownReset');
  let sec=Math.max(0,w.resetsAt-Math.floor(Date.now()/1000));
  if(!sec)return t('waitingReset');
  let d=Math.floor(sec/86400),h=Math.floor(sec%86400/3600),m=Math.floor(sec%3600/60);
  return t('resetIn',{time:[d?t('day',{n:d}):'',h?t('hour',{n:h}):'',t('minute',{n:m})].filter(Boolean).join(' ')});
}
function render(s){
  window.HaloI18n.setLanguage(s.language);window.HaloI18n.apply(document);
  current=s;document.body.dataset.mode=s.config.mode;document.documentElement.style.setProperty('--alpha',s.config.opacity/100);
  document.body.classList.toggle('no-motion',!s.config.animation);document.body.classList.toggle('refreshing',s.refreshing);
  const u=s.usage;const stale=!!s.error || !!u&&Date.now()-u.updatedAt>Math.max(90,s.config.interval*3)*1000;
  document.body.classList.toggle('stale',stale);
  $('#orbPrimary').innerHTML=percentage(u?.primary);$('#panelPrimary').innerHTML=percentage(u?.primary);$('#panelSecondary').innerHTML=percentage(u?.secondary);
  $('#orbSecondary').innerHTML=percentage(u?.secondary);
  $('#orbWeeklyLabel').textContent=u?.secondary?.minutes===10080?(s.language==='zh'?'周':'W'):t('overallLabel');
  const reset=u?.primary?.resetsAt?new Date(u.primary.resetsAt*1000):null;
  $('#orbReset').textContent=reset?reset.toLocaleTimeString(s.language==='zh'?'zh-CN':'en',{hour:'2-digit',minute:'2-digit',hour12:false}):'--:--';
  $('#orbReset').dateTime=reset?reset.toISOString():'';
  $('#orbReset').title=reset?`${t('primaryTitle')} · ${reset.toLocaleString(s.language==='zh'?'zh-CN':'en')}`:t('unknownReset');
  $('#secondaryTitle').textContent=duration(u?.secondary?.minutes);
  $('#secondarySubtitle').textContent=t(u?.secondary?.minutes===10080?'weekly':'longTerm');
  $('#barPrimary').style.width=(u?.primary?.remaining??0)+'%';$('#barSecondary').style.width=(u?.secondary?.remaining??0)+'%';
  $('#resetPrimary').textContent=countdown(u?.primary);$('#resetSecondary').textContent=countdown(u?.secondary);
  $('#plan').textContent=(u?.plan||'CODEX').toUpperCase();
  $('#connection').textContent=t(s.error?'offline':stale?'stale':u?'connected':'connecting');
  for(const id of ['#orbDot','#panelDot'])$(id).className='dot'+(stale?' warning':!u?' loading':'');
  $('#panel').classList.toggle('has-error',!!s.error);$('#statusMessage').textContent=s.error?errorText(s.error):'';
  const age=u?Math.max(0,Math.floor((Date.now()-u.updatedAt)/1000)):0;
  $('#updated').textContent=u?(age<3?t('justSynced'):age<60?t('secondsAgo',{n:age}):t('minutesAgo',{n:Math.floor(age/60)})):t('firstSync');
  $('#intervalLabel').textContent=s.refreshing?t('syncing'):t('autoRefresh',{n:s.config.interval});
  $('#sphere').title=(s.error?errorText(s.error)+'\n':'')+`${t('primaryTitle')}: ${u?.primary?.remaining??'--'}% · ${countdown(u?.primary)}\n${duration(u?.secondary?.minutes)}: ${u?.secondary?.remaining??'--'}% · ${countdown(u?.secondary)}\n${t('hint')}`;
  target=u?.primary?u.primary.remaining/100:0;
}
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>window.halo.action(b.dataset.action,b.dataset.value)));
const sphere=$('#sphere');
sphere.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;moved=false;start={x:e.screenX,y:e.screenY};sphere.setPointerCapture(e.pointerId);window.halo.drag('start');});
sphere.addEventListener('pointermove',e=>{if(dragging){if(Math.abs(e.screenX-start.x)+Math.abs(e.screenY-start.y)>3)moved=true;window.halo.drag('move');}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])sphere.addEventListener(event,()=>{if(dragging){dragging=false;window.halo.drag('end');}});
sphere.addEventListener('dblclick',()=>{if(!moved)window.halo.action('mode','panel');});
window.halo.onState(render);window.halo.state().then(render);setInterval(()=>{if(current)render(current);},1000);
const canvas=$('#water'),ctx=canvas.getContext('2d');
let drawingScale=0;
function draw(time){
  requestAnimationFrame(draw);
  if(document.body.dataset.mode!=='orb'||document.hidden)return;
  if(time-previous<1000/30)return;const dt=Math.min((time-previous)/1000,.06);previous=time;
  const animate=current?.config.animation!==false;phase+=animate?dt*.95:0;level+=animate?(target-level)*Math.min(1,dt*3.5):target-level;
  // Match the actual Windows pixel scale: no downsampled, subpixel progress orbit.
  const size=104,dpr=window.devicePixelRatio||1,pixels=Math.round(canvas.clientWidth*dpr),c=size/2,r=size/2;
  if(drawingScale!==dpr){
    drawingScale=dpr;const root=document.documentElement;
    root.style.setProperty('--pixel-x','0px');root.style.setProperty('--pixel-y','0px');
    const rect=sphere.getBoundingClientRect();
    root.style.setProperty('--pixel-x',`${(Math.round(rect.x*dpr)-rect.x*dpr)/dpr}px`);
    root.style.setProperty('--pixel-y',`${(Math.round(rect.y*dpr)-rect.y*dpr)/dpr}px`);
    root.style.setProperty('--edge-width',`${1/dpr}px`);
  }
  if(canvas.width!==pixels||canvas.height!==pixels){canvas.width=pixels;canvas.height=pixels;}
  ctx.setTransform(pixels/size,0,0,pixels/size,0,0);ctx.clearRect(0,0,size,size);
  // The sphere clips once in CSS. Avoid overlapping canvas circle antialiasing.
  const alpha=(current?.config.opacity??78)/100;
  const bg=ctx.createLinearGradient(14,5,89,101);
  bg.addColorStop(0,`rgba(80,125,145,${alpha*.7})`);
  bg.addColorStop(.38,`rgba(29,55,73,${alpha*.82})`);
  bg.addColorStop(1,`rgba(40,36,73,${alpha*.88})`);
  ctx.fillStyle=bg;ctx.fillRect(0,0,size,size);
  const y=c+r-level*r*2;
  for(let layer=0;level>.002&&layer<2;layer++){
    ctx.beginPath();ctx.moveTo(0,size);
    for(let x=0;x<=size;x++){
      const amplitude=(4.8+layer*1.5)*(level>.98?.45:1);
      const wave=Math.sin(x/23+phase*(layer?-1:1)+layer*1.9)*amplitude+Math.sin(x/39+phase*.65)*1.3;
      ctx.lineTo(x,y+wave+layer*.8);
    }
    ctx.lineTo(size,size);ctx.closePath();
    const water=ctx.createLinearGradient(7,Math.max(0,y-8),99,100);
    water.addColorStop(0,`rgba(112,238,223,${alpha*(layer?.3:.15)})`);
    water.addColorStop(.5,`rgba(82,184,218,${alpha*(layer?.29:.17)})`);
    water.addColorStop(1,`rgba(156,132,239,${alpha*(layer?.39:.19)})`);
    ctx.fillStyle=water;ctx.fill();
  }
  // Broad reflections and an inset shadow give the material depth without particles.
  const shade=ctx.createRadialGradient(47,43,30,c,c,r);
  shade.addColorStop(0,'#14284200');shade.addColorStop(.78,'#14284200');shade.addColorStop(1,'#10263d35');
  ctx.fillStyle=shade;ctx.fillRect(0,0,size,size);
  const light=ctx.createRadialGradient(26,12,0,33,22,70);
  light.addColorStop(0,'#edffff75');light.addColorStop(.35,'#e5ffff23');light.addColorStop(1,'#ecffff00');
  ctx.fillStyle=light;ctx.fillRect(0,0,size,size);
  const gloss=ctx.createLinearGradient(19,6,42,42);
  gloss.addColorStop(0,'#ffffff38');gloss.addColorStop(1,'#ffffff00');
  ctx.beginPath();ctx.ellipse(36,19,33,10,-.45,0,Math.PI*2);ctx.fillStyle=gloss;ctx.fill();
  const refract=ctx.createRadialGradient(76,90,0,72,86,35);
  refract.addColorStop(0,'#e0deff38');refract.addColorStop(1,'#d1dbff00');
  ctx.fillStyle=refract;ctx.fillRect(0,0,size,size);
}
requestAnimationFrame(draw);
