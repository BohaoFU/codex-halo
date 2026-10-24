const {spawn,execFileSync}=require('node:child_process');
const {EventEmitter}=require('node:events');
const fs=require('node:fs');
const path=require('node:path');
function findCodex(){
  if(process.env.CODEX_HALO_CLI && fs.existsSync(process.env.CODEX_HALO_CLI)) return process.env.CODEX_HALO_CLI;
  try {const x=execFileSync('where.exe',['codex.exe'],{encoding:'utf8',windowsHide:true,timeout:4000}).trim().split(/\r?\n/)[0];if(fs.existsSync(x))return x;}catch{}
  const dir=path.join(process.env.LOCALAPPDATA||'','OpenAI','Codex','bin');
  try {const found=fs.readdirSync(dir).map(x=>path.join(dir,x,'codex.exe')).filter(x=>fs.existsSync(x)).sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs);if(found[0])return found[0];}catch{}
  throw new Error('HALO_CLI_NOT_FOUND');
}
function windowValue(w){
  if(!w || typeof w.usedPercent!=='number' || !Number.isFinite(w.usedPercent)) return null;
  return {remaining:Math.max(0,Math.min(100,100-w.usedPercent)),minutes:w.windowDurationMins??null,resetsAt:typeof w.resetsAt==='number'?w.resetsAt:null};
}
function normalize(data){
  const buckets=data.rateLimitsByLimitId;
  const r=buckets?.codex || data.rateLimits || (buckets?Object.values(buckets)[0]:null);
  if(!r) throw new Error('HALO_NO_LIMITS');
  return {primary:windowValue(r.primary),secondary:windowValue(r.secondary),plan:r.planType||'',bucket:r.limitName||r.limitId||'Codex',updatedAt:Date.now()};
}
class UsageClient extends EventEmitter {
  constructor(){super();this.nextId=0;this.pending=new Map();this.child=null;this.connecting=null;this.closed=false;}
  async connect(){
    if(this.closed)throw new Error('HALO_CLOSED');
    if(this.connecting)return this.connecting;
    if(this.child)return;
    this.connecting=this.start();
    try{await this.connecting;}finally{this.connecting=null;}
  }
  async start(){
    const child=spawn(findCodex(),['app-server','--listen','stdio://'],{windowsHide:true,stdio:['pipe','pipe','pipe']});
    this.child=child;let buffer='';
    const fail=()=>{if(this.child===child)this.child=null;for(const [id,p] of this.pending){clearTimeout(p.timer);p.reject(new Error('HALO_DISCONNECTED'));}this.pending.clear();};
    child.on('error',fail);child.on('exit',fail);child.stdin.on('error',()=>{});
    child.stderr.on('data',()=>{}); // Never persist Codex logs or credentials.
    child.stdout.on('data',chunk=>{buffer+=chunk;let i;while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+1);try{this.receive(JSON.parse(line));}catch{}}});
    try {await this.request('initialize',{clientInfo:{name:'codex_halo',title:'Codex Halo',version:'1.2.0'}});child.stdin.write(JSON.stringify({method:'initialized'})+'\n');}
    catch(e){child.kill();if(this.child===child)this.child=null;throw e;}
  }
  receive(m){
    if(m.id!==undefined && this.pending.has(m.id)){
      const p=this.pending.get(m.id);this.pending.delete(m.id);clearTimeout(p.timer);
      m.error?p.reject(new Error(m.error.message||'HALO_REQUEST_FAILED')):p.resolve(m.result);return;
    }
    if(m.method==='account/rateLimits/updated') {try{this.emit('usage',normalize(m.params));}catch{}}
    // This read-only client never runs threads, tools or login mutations.
    if(m.method && m.id!==undefined && this.child) this.child.stdin.write(JSON.stringify({id:m.id,error:{code:-32601,message:'Read-only usage client'}})+'\n');
  }
  request(method,params){
    return new Promise((resolve,reject)=>{
      const id=++this.nextId;
      const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('HALO_TIMEOUT'));this.child?.kill();this.child=null;},20000);
      this.pending.set(id,{resolve,reject,timer});
      this.child.stdin.write(JSON.stringify({id,method,...(params?{params}:{})})+'\n',e=>{if(e){clearTimeout(timer);this.pending.delete(id);reject(new Error('HALO_UNAVAILABLE'));}});
    });
  }
  async read(){await this.connect();return normalize(await this.request('account/rateLimits/read'));}
  close(){this.closed=true;this.child?.kill();this.child=null;for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(new Error('HALO_CLOSED'));}this.pending.clear();}
}
module.exports={UsageClient,normalize,windowValue,findCodex};
