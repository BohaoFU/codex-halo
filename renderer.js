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
  $('#orbWeeklyLabel').textContent=t(u?.secondary?.minutes===10080?'secondaryLabel':'overallLabel');
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
function draw(time){
  requestAnimationFrame(draw);
  if(document.body.dataset.mode!=='orb'||document.hidden)return;
  if(time-previous<1000/30)return;const dt=Math.min((time-previous)/1000,.06);previous=time;
  const animate=current?.config.animation!==false;phase+=animate?dt*.8:0;level+=animate?(target-level)*.045:target-level;
  const ratio=2,c=180,r=148;ctx.clearRect(0,0,360,360);ctx.save();ctx.beginPath();ctx.arc(c,c,r,0,Math.PI*2);ctx.clip();
  const alpha=(current?.config.opacity??78)/100;
  let bg=ctx.createLinearGradient(30,20,310,330);bg.addColorStop(0,`rgba(26,55,78,${alpha*.77})`);bg.addColorStop(1,`rgba(25,20,56,${alpha*.84})`);ctx.fillStyle=bg;ctx.fillRect(0,0,360,360);
  const y=c+r-level*r*2;
  for(let layer=0;layer<3;layer++){
    ctx.beginPath();ctx.moveTo(0,360);
    for(let x=0;x<=360;x+=3){const wave=Math.sin(x/64+phase*(layer===1?-1:1)+layer*1.8)*(7+layer*2)+Math.sin(x/39+phase*.65)*3;ctx.lineTo(x,y+wave+layer*5);}
    ctx.lineTo(360,360);ctx.closePath();const g=ctx.createLinearGradient(25,y-30,320,350);g.addColorStop(0,`rgba(80,244,213,${alpha*(layer===2?.45:.17)})`);g.addColorStop(.48,`rgba(65,180,230,${alpha*.3})`);g.addColorStop(1,`rgba(157,91,250,${alpha*.52})`);ctx.fillStyle=g;ctx.fill();
    if(layer===2){ctx.strokeStyle='#a9fff23c';ctx.lineWidth=1;ctx.stroke();}
  }
  const shine=ctx.createRadialGradient(116,66,3,130,85,220);shine.addColorStop(0,'#b9f9ff18');shine.addColorStop(1,'#70a9ff00');ctx.fillStyle=shine;ctx.fillRect(0,0,360,360);
  if(animate)for(let i=0;i<8;i++){const x=80+(i*37)%210,by=310-((phase*13+i*41)%240);if(by>y+15){ctx.beginPath();ctx.arc(x,by,1.2+(i%3)*.6,0,7);ctx.fillStyle='#c7ffff38';ctx.fill();}}
  ctx.restore();
  const ring=ctx.createLinearGradient(30,30,320,320);ring.addColorStop(0,'#91ffe6');ring.addColorStop(.5,'#70bcf4');ring.addColorStop(1,'#b18aff');
  ctx.beginPath();ctx.arc(c,c,r+6,-Math.PI/2,Math.PI*1.5);ctx.strokeStyle='#a8c8ff10';ctx.lineWidth=2;ctx.stroke();
  const weekly=current?.usage?.secondary?.remaining;
  if(weekly!==undefined){ctx.beginPath();ctx.arc(c,c,r+6,-Math.PI/2,-Math.PI/2+Math.PI*2*weekly/100);ctx.strokeStyle=ring;ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();}
  ctx.beginPath();ctx.arc(c,c,r-1,Math.PI*1.05,Math.PI*1.67);ctx.strokeStyle='#b5f4ff44';ctx.lineWidth=1.5;ctx.stroke();
}
requestAnimationFrame(draw);
