const {test}=require('node:test');const assert=require('node:assert/strict');const {normalize,windowValue,UsageClient}=require('../usage.cjs');
test('remaining is inverse of used, clamped and unknown stays null',()=>{
  assert.equal(windowValue({usedPercent:29}).remaining,71);assert.equal(windowValue({usedPercent:120}).remaining,0);assert.equal(windowValue({usedPercent:-5}).remaining,100);assert.equal(windowValue({}),null);assert.equal(windowValue(null),null);
});
test('select Codex bucket ahead of legacy and retain real window/reset',()=>{
  const r=normalize({rateLimits:{primary:{usedPercent:99}},rateLimitsByLimitId:{codex:{primary:{usedPercent:32,windowDurationMins:300,resetsAt:1893456000},secondary:{usedPercent:17,windowDurationMins:10080},planType:'plus'}}});
  assert.equal(r.primary.remaining,68);assert.equal(r.primary.minutes,300);assert.equal(r.primary.resetsAt,1893456000);assert.equal(r.secondary.remaining,83);assert.equal(r.plan,'plus');
});
test('null buckets do not invent zero usage',()=>{assert.equal(normalize({rateLimits:{secondary:null}}).secondary,null);assert.throws(()=>normalize({}));});
test('RPC correlation and server errors',async()=>{
  const c=new UsageClient();const replies=[];c.child={stdin:{write:line=>replies.push(JSON.parse(line))},kill(){}};
  const a=c.request('account/rateLimits/read'),b=c.request('account/read');
  c.receive({id:replies[1].id,error:{message:'not signed in'}});c.receive({id:replies[0].id,result:{ok:true}});
  await assert.rejects(b,/not signed in/);assert.deepEqual(await a,{ok:true});assert.equal(c.pending.size,0);c.close();
});
test('update notification maps usage and read-only client refuses server requests',()=>{
  const c=new UsageClient();let usage;const messages=[];c.child={stdin:{write:l=>messages.push(JSON.parse(l))},kill(){}};c.on('usage',u=>usage=u);
  c.receive({method:'account/rateLimits/updated',params:{rateLimits:{primary:{usedPercent:50}}}});assert.equal(usage.primary.remaining,50);
  c.receive({method:'item/commandExecution/requestApproval',id:7});assert.equal(messages[0].error.code,-32601);c.close();
});
