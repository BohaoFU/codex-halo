const fs=require('node:fs'),path=require('node:path');
// Electron downloads its runtime lazily; resolve it before copying a clean npm install.
const electronDist=path.dirname(require('electron'));
const dest=path.resolve(__dirname,'..','CodexHalo');
fs.mkdirSync(dest,{recursive:true});
fs.cpSync(electronDist,dest,{recursive:true});
fs.renameSync(path.join(dest,'electron.exe'),path.join(dest,'CodexHalo.exe'));
const target=path.join(dest,'resources','app');fs.mkdirSync(target,{recursive:true});
for(const file of ['package.json','main.cjs','usage.cjs','preload.cjs','i18n.js','index.html','style.css','renderer.js','settings.html','settings.js','icon.png','icon.ico'])fs.copyFileSync(path.join(__dirname,file),path.join(target,file));
for(const file of ['README.md','README.zh-CN.md','LICENSE'])fs.copyFileSync(path.join(__dirname,file),path.join(dest,file));
fs.copyFileSync(path.join(__dirname,'icon.png'),path.join(dest,'icon.png'));
fs.cpSync(path.join(__dirname,'docs'),path.join(dest,'docs'),{recursive:true});
import('rcedit').then(({rcedit})=>rcedit(path.join(dest,'CodexHalo.exe'),{
  icon:path.join(__dirname,'icon.ico'),
  'version-string':{ProductName:'Codex Halo',FileDescription:'Codex Halo - Usage Widget',CompanyName:'Codex Halo',OriginalFilename:'CodexHalo.exe'},
  'file-version':'1.1.0','product-version':'1.1.0'
})).then(()=>console.log('Portable app: '+path.join(dest,'CodexHalo.exe'))).catch(e=>{console.error(e);process.exitCode=1;});
