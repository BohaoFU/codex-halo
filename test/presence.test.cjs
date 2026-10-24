const {test}=require('node:test');const assert=require('node:assert/strict');
const {isCodexDesktop,VisibilityPolicy,loginOptions}=require('../presence.cjs');
test('recognizes Codex Store desktop even when named ChatGPT.exe',()=>{
  assert.ok(isCodexDesktop({path:'C:\\Program Files\\WindowsApps\\OpenAI.Codex_1.2_x64__abc\\app\\ChatGPT.exe'}));
  assert.ok(isCodexDesktop({path:'C:/Program Files/WindowsApps/OpenAI.Codex_2_x64__abc/app/Codex.exe'}));
});
test('excludes Halo own app-server, npm CLI, and unrelated ChatGPT',()=>{
  for(const executable of ['C:\\Users\\Example\\AppData\\Local\\OpenAI\\Codex\\bin\\abc\\codex.exe','C:\\Tools\\codex.exe','C:\\npm\\node_modules\\@openai\\codex\\vendor\\codex.exe','C:\\Program Files\\WindowsApps\\OpenAI.ChatGPT_1_x64__abc\\app\\ChatGPT.exe'])assert.equal(isCodexDesktop({path:executable},null),false,executable);
  assert.equal(isCodexDesktop({path:null}),false);
});
test('legacy desktop requires matching product metadata; explicit desktop path supports custom installs',()=>{
  assert.equal(isCodexDesktop({path:'C:\\Apps\\Codex\\Codex.exe',product:'Codex'}),true);
  assert.equal(isCodexDesktop({path:'C:\\Apps\\Codex\\Codex.exe',product:''}),false);
  assert.equal(isCodexDesktop({path:'D:/Portable/Desktop.exe'},'d:\\portable\\desktop.exe'),true);
});
test('startup hidden, exit hides, restart restores; manual hiding survives unchanged checks',()=>{
  const policy=new VisibilityPolicy();assert.equal(policy.visible,false);
  policy.setPresence(false);policy.show();assert.equal(policy.visible,false);
  policy.setPresence(true);assert.equal(policy.visible,true);
  policy.hide();policy.setPresence(true);assert.equal(policy.visible,false);
  policy.setPresence(null);assert.equal(policy.visible,false);
  policy.setPresence(false);assert.equal(policy.visible,false);
  policy.setPresence(true);assert.equal(policy.visible,true);
  policy.setPresence(undefined);assert.equal(policy.visible,true);
});
test('disabling follow allows a widget without desktop; re-enabling gates it again',()=>{
  const policy=new VisibilityPolicy();policy.setPresence(false);policy.setFollow(false);assert.equal(policy.visible,true);
  policy.setFollow(true);assert.equal(policy.visible,false);
});
test('startup command quotes via structured Electron arguments and includes background marker',()=>{
  assert.deepEqual(loginOptions('C:\\Apps With Spaces\\Halo.exe',true,'unused',true),{openAtLogin:true,path:'C:\\Apps With Spaces\\Halo.exe',args:['--background']});
  assert.deepEqual(loginOptions('electron.exe',false,'C:\\Source Folder',false).args,['C:\\Source Folder','--background']);
});
