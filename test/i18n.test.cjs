const {test}=require('node:test');const assert=require('node:assert/strict');
const {messages,resolveLanguage,translate}=require('../i18n.js');
test('system language selection follows Chinese locales and falls back to English',()=>{
  for(const locale of ['zh-CN','zh-TW','zh-Hans','zh-Hant-HK','ZH_cn'])assert.equal(resolveLanguage('auto',locale),'zh');
  for(const locale of ['en-US','en-GB','fr-FR','ja-JP',undefined])assert.equal(resolveLanguage('auto',locale),'en');
  assert.equal(resolveLanguage('en','zh-CN'),'en');assert.equal(resolveLanguage('zh','en-US'),'zh');
});
test('translations match keys and substitution variables',()=>{
  assert.deepEqual(Object.keys(messages.zh).sort(),Object.keys(messages.en).sort());
  for(const key of Object.keys(messages.zh)){
    const tokens=s=>(s.match(/\{\w+\}/g)||[]).sort();assert.deepEqual(tokens(messages.zh[key]),tokens(messages.en[key]),key);
  }
  assert.equal(translate('en','autoRefresh',{n:15}),'Auto-refresh 15s');assert.equal(translate('zh','everySeconds',{n:10}),'每 10 秒');
});
test('local error messages are localized, server diagnostics remain intact',()=>{
  assert.match(translate('en','HALO_TIMEOUT'),/timed out/);assert.match(translate('zh','HALO_TIMEOUT'),/读取超时/);assert.equal(translate('en','Server: invalid token'),'Server: invalid token');
});
