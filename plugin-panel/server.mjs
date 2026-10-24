import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'node:fs';
import path from 'node:path';
import usageModule from '../usage.cjs';
const {UsageClient}=usageModule;
const uri='ui://codex-halo/usage-v1.html';
const icon='data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><g fill="none" stroke="#748ca8" stroke-width="1.5" stroke-linecap="round"><path d="M3 7c4-6 6 6 10 0 1-2 3-2 4-1M3 13c4-6 6 6 10 0 1-2 3-2 4-1"/></g></svg>').toString('base64');
const server=new McpServer({name:'codex-halo-panel',version:'0.1.1',icons:[{src:icon,mimeType:'image/svg+xml',sizes:['20x20']}]});
const client=new UsageClient();
let cache=null,inflight=null;
async function read(){
  if(cache&&Date.now()-cache.updatedAt<12000)return cache;
  if(inflight)return inflight;
  inflight=client.read().then(data=>{cache=data;return data;}).finally(()=>{inflight=null;});
  return inflight;
}
async function result(){
  try{const data=await read();return {content:[{type:'text',text:JSON.stringify(data)}],structuredContent:data};}
  catch{return {isError:true,content:[{type:'text',text:'Cannot read Codex usage. Check the local Codex sign-in and CLI, then refresh. / 无法读取额度，请检查本机 Codex 登录状态后刷新。'}]};}
}
const annotations={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false};
for(const [name,title,type] of [['open_usage','Codex Halo','global'],['open_panel','Halo · Usage / 用量','thread']]){
  server.registerTool(name,{title,description:'Open the read-only Codex remaining quota dashboard. 查看 Codex 5 小时和每周剩余额度。',inputSchema:{},annotations,_meta:{ui:{resourceUri:uri},'openai/ui':{entrypoints:[{type}]}}},result);
}
server.registerTool('read_usage',{title:'Refresh Codex quota',description:'Read current Codex 5-hour and weekly remaining percentages and reset times. No inference or account changes.',inputSchema:{},annotations,_meta:{ui:{visibility:['app','model']}}},result);
server.registerResource('usage-panel',uri,{mimeType:'text/html;profile=mcp-app'},async()=>({contents:[{uri,mimeType:'text/html;profile=mcp-app',text:fs.readFileSync(path.join(__dirname,'assets','panel.html'),'utf8'),_meta:{ui:{csp:{connectDomains:[],resourceDomains:[]}},'openai/ui':{preferredDisplayMode:'fullscreen',availableDisplayModes:['inline','fullscreen']}}}]}));
let closed=false;
function close(){if(closed)return;closed=true;client.close();server.close().finally(()=>process.exit(0));}
process.stdin.on('end',close);
process.on('SIGTERM',close);process.on('SIGINT',close);
server.connect(new StdioServerTransport()).catch(()=>{client.close();process.exit(1);});
