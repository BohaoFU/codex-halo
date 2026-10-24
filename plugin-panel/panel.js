import {App} from '@modelcontextprotocol/ext-apps';
const app=new App({name:'Codex Halo',version:'0.1.1'},{});
const $=id=>document.getElementById(id);
let lang='auto',data=null,busy=false,failed=false,timer;
const copy={zh:{title:'额度，尽在眼前。',sub:'每 15 秒更新 · 本机 Codex 账户',primary:'5 小时剩余',secondary:'每周剩余',reset:'重置于',refresh:'刷新',loading:'正在连接 Codex…',ok:'已连接 Codex',error:'暂时无法读取，请检查 Codex 登录后刷新',missing:'暂无此周期额度',updated:'更新于',retry:'刷新重试'},en:{title:'Your quota, at a glance.',sub:'Updates every 15s · Local Codex account',primary:'5-hour remaining',secondary:'Weekly remaining',reset:'Resets',refresh:'Refresh',loading:'Connecting to Codex…',ok:'Connected to Codex',error:'Unable to read usage. Check Codex sign-in and refresh.',missing:'No quota for this window',updated:'Updated',retry:'Try again'}};
function locale(){return lang==='auto'?((app.getHostContext()?.locale||navigator.language).toLowerCase().startsWith('zh')?'zh':'en'):lang;}
function render(){
 const l=locale(),t=copy[l];document.documentElement.lang=l==='zh'?'zh-CN':'en';
 for(const id of ['title','sub','primary','secondary'])$(id).textContent=t[id];
 $('refresh').textContent=busy?'…':failed?t.retry:t.refresh;
 $('status').textContent=failed?t.error:data?t.ok:t.loading;$('status').classList.toggle('error',failed);
 for(const [key,id] of [['primary','p'],['secondary','s']]){
  const w=data?.[key],value=w?.remaining;
  $(id+'Value').textContent=typeof value==='number'?Math.round(value):'—';
  $(id+'Card').style.setProperty('--level',(value??0)+'%');
  $(id+'Reset').textContent=w?.resetsAt?t.reset+' '+new Date(w.resetsAt*1000).toLocaleString(l==='zh'?'zh-CN':'en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):t.missing;
 }
 $('updated').textContent=data?t.updated+' '+new Date(data.updatedAt).toLocaleTimeString(l==='zh'?'zh-CN':'en'):'';
}
function accept(r){if(r.isError){failed=true;render();return;}if(r.structuredContent?.updatedAt){data=r.structuredContent;failed=false;render();}}
async function refresh(){if(busy)return;busy=true;render();try{accept(await app.callServerTool({name:'read_usage',arguments:{}}));}catch{failed=true;}finally{busy=false;render();}}
function host(context){const c=context||app.getHostContext();if(c?.theme)document.documentElement.dataset.theme=c.theme;for(const [k,v] of Object.entries(c?.styles?.variables||{}))document.documentElement.style.setProperty(k,String(v));const i=c?.safeAreaInsets;if(i)document.body.style.padding=`${16+i.top}px ${16+i.right}px ${16+i.bottom}px ${16+i.left}px`;render();}
app.ontoolresult=accept;app.onhostcontextchanged=host;
$('language').onchange=e=>{lang=e.target.value;render();};$('refresh').onclick=refresh;
document.addEventListener('visibilitychange',()=>{clearInterval(timer);if(!document.hidden){refresh();timer=setInterval(refresh,15000);}});
render();
try{await app.connect();host();await refresh();timer=setInterval(()=>{if(!document.hidden)refresh();},15000);}catch{failed=true;render();}
