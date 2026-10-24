const fs=require('node:fs');const path=require('node:path');
const modules=process.env.HALO_PLUGIN_NODE_MODULES||path.join(__dirname,'node_modules');
const esbuild=require(path.join(modules,'esbuild'));
const marketplace=path.resolve(process.env.HALO_PLUGIN_MARKETPLACE_OUTPUT||path.join(__dirname,'..','native-plugin'));
const plugin=path.join(marketplace,'plugins','codex-halo-panel');
function json(file,data){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');}
(async()=>{
 fs.mkdirSync(path.join(plugin,'assets'),{recursive:true});
 const common={bundle:true,nodePaths:[modules],legalComments:'eof',logLevel:'warning',metafile:true};
 const backend=await esbuild.build({...common,entryPoints:[path.join(__dirname,'server.mjs')],platform:'node',target:'node20',format:'cjs',outfile:path.join(plugin,'server.cjs'),banner:{js:'// Codex Halo local plugin. MIT. See THIRD-PARTY-NOTICES.txt.'}});
 const ui=await esbuild.build({...common,entryPoints:[path.join(__dirname,'panel.js')],platform:'browser',target:'es2022',format:'esm',minify:true,write:false});
 fs.writeFileSync(path.join(plugin,'assets','panel.html'),fs.readFileSync(path.join(__dirname,'panel.html'),'utf8').replace('/*APP_SCRIPT*/',()=>ui.outputFiles[0].text.replaceAll('</script','<\\/script')));
 fs.copyFileSync(path.join(__dirname,'..','icon.png'),path.join(plugin,'assets','icon.png'));
 fs.copyFileSync(path.join(__dirname,'..','LICENSE'),path.join(plugin,'LICENSE'));
 const licenses=new Map();
 for(const file of [...Object.keys(backend.metafile.inputs),...Object.keys(ui.metafile.inputs)]){
  let dir=path.dirname(path.resolve(file));
  while(dir!==path.dirname(dir)){
   if(dir.includes('node_modules')&&fs.existsSync(path.join(dir,'package.json'))){
    const pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));
    if(!pkg.name){dir=path.dirname(dir);continue;}
    if(!licenses.has(pkg.name)){
     const texts=fs.readdirSync(dir).filter(n=>/^(?:licen[sc]e|copying|notice)(?:\.|$)/i.test(n)).filter(n=>fs.statSync(path.join(dir,n)).isFile()).map(n=>fs.readFileSync(path.join(dir,n),'utf8'));
     licenses.set(pkg.name,`${pkg.name} ${pkg.version} (${pkg.license||'See upstream'})\n${texts.join('\n')}`);
    }break;
   }dir=path.dirname(dir);
  }
 }
 fs.writeFileSync(path.join(plugin,'THIRD-PARTY-NOTICES.txt'),[...licenses.values()].join('\n\n--------------------\n\n').replace(/[\t ]+$/gm,''));
 const manifest={$schema:'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',name:'codex-halo-panel',version:'0.1.1',description:'Local Codex quota dashboard. 本机 Codex 5 小时与每周剩余额度面板。',author:{name:'BohaoFU'},homepage:'https://github.com/BohaoFU/codex-halo',repository:'https://github.com/BohaoFU/codex-halo',license:'MIT',extensions:{'com.openai':{requires_local_executor:true,interface:{displayName:'Codex Halo',shortDescription:'Codex quota / 剩余额度',longDescription:'Read-only local usage dashboard with 15-second refresh, Chinese and English, global navigation and conversation panel entrypoints. 实验性本地用量面板，支持中英文。入口位置由客户端决定。',developerName:'BohaoFU',category:'Productivity',capabilities:['Read','Interactive'],brandColor:'#5C96E8',composerIcon:'./assets/icon.png',logo:'./assets/icon.png',defaultPrompt:'Open Codex Halo to view my remaining Codex quota. 打开用量面板。'}}}};
 json(path.join(plugin,'plugin.json'),manifest);
 json(path.join(plugin,'mcp.json'),{$schema:'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',mcpServers:{'codex-halo-panel':{type:'stdio',command:'node',args:['${PLUGIN_ROOT}/server.cjs'],cwd:'${PLUGIN_ROOT}'}}});
 json(path.join(marketplace,'.agents','plugins','marketplace.json'),{name:'codex-halo-lab',interface:{displayName:'Codex Halo Lab'},plugins:[{name:'codex-halo-panel',source:{source:'local',path:'./plugins/codex-halo-panel'},policy:{installation:'AVAILABLE',authentication:'ON_INSTALL'},category:'Productivity'}]});
 console.log('Built '+marketplace);
})();
