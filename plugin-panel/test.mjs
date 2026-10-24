import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(path.join(process.env.HALO_PLUGIN_NODE_MODULES||path.join(root,'node_modules'),'..','package.json'));
const {Client}=require('@modelcontextprotocol/sdk/client/index.js');
const {StdioClientTransport}=require('@modelcontextprotocol/sdk/client/stdio.js');
const marketplace=path.resolve(process.env.HALO_PLUGIN_MARKETPLACE_OUTPUT||path.join(root,'..','native-plugin'));
const transport=new StdioClientTransport({command:process.execPath,args:[process.env.HALO_PLUGIN_TEST_SERVER||path.join(marketplace,'plugins/codex-halo-panel/server.cjs')],stderr:'pipe'});
const client=new Client({name:'halo-protocol-test',version:'1.0.0'});
try{
 await client.connect(transport);
 const {tools}=await client.listTools();
 assert.equal(tools.length,3);
 for(const [name,type] of [['open_usage','global'],['open_panel','thread']]){
  const t=tools.find(t=>t.name===name);assert.equal(t._meta['openai/ui'].entrypoints[0].type,type);assert.equal(t.annotations.readOnlyHint,true);
 }
 const info=client.getServerVersion();assert.match(info.icons[0].src,/^data:image\/svg\+xml;base64,/);
 const resource=await client.readResource({uri:'ui://codex-halo/usage-v1.html'});
 assert.match(resource.contents[0].text,/Codex Halo/);assert.equal(resource.contents[0].mimeType,'text/html;profile=mcp-app');
 const result=await client.callTool({name:'open_usage',arguments:{}});
 assert.equal(result.isError,undefined,JSON.stringify(result.content));
 for(const w of [result.structuredContent.primary,result.structuredContent.secondary])if(w){assert(w.remaining>=0&&w.remaining<=100);}
 const refreshed=await client.callTool({name:'read_usage',arguments:{}});assert.equal(refreshed.structuredContent.updatedAt,result.structuredContent.updatedAt);
 console.log('PASS: native entrypoint metadata, icon, HTML resource, real quota read, refresh cache.');
}finally{await client.close();}
