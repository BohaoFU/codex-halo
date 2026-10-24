const $=s=>document.querySelector(s);
const {t,errorText}=window.HaloI18n;
function render(s){
  window.HaloI18n.setLanguage(s.language);window.HaloI18n.apply(document);document.title='Codex Halo · '+t('settings');
  document.documentElement.style.setProperty('--alpha',Math.max(.80,s.config.opacity/100));
  for(const key of ['animation','alwaysOnTop','startup'])$('#'+key).checked=s.config[key];
  $('#opacity').value=s.config.opacity;$('#opacityValue').textContent=s.config.opacity+'%';$('#interval').value=s.config.interval;
  $('#orbMode').classList.toggle('selected',s.config.mode==='orb');$('#panelMode').classList.toggle('selected',s.config.mode==='panel');
  $('#language').value=s.config.language||'auto';
  for(const option of $('#interval').options)option.textContent=t('everySeconds',{n:option.value});
  $('#connectionState').textContent=s.error?errorText(s.error):(s.usage?t('settingsConnected',{plan:s.usage.plan||'ChatGPT',time:new Date(s.usage.updatedAt).toLocaleTimeString(s.language==='zh'?'zh-CN':'en-US')}):t('connecting'));
  $('#connectionState').classList.toggle('error',!!s.error);
}
for(const key of ['animation','alwaysOnTop','startup'])$('#'+key).addEventListener('change',e=>window.halo.action('config',{[key]:e.target.checked}));
$('#opacity').addEventListener('input',e=>{ $('#opacityValue').textContent=e.target.value+'%';window.halo.action('config',{opacity:Number(e.target.value)});});
$('#interval').addEventListener('change',e=>window.halo.action('config',{interval:Number(e.target.value)}));
$('#language').addEventListener('change',e=>window.halo.action('config',{language:e.target.value}));
$('#orbMode').onclick=()=>window.halo.action('mode','orb');$('#panelMode').onclick=()=>window.halo.action('mode','panel');$('#close').onclick=()=>window.halo.action('closeSettings');$('#quit').onclick=()=>window.halo.action('quit');
window.halo.onState(render);window.halo.state().then(render);
