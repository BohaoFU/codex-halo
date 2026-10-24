const {app,BrowserWindow,ipcMain,Tray,Menu,nativeImage,screen,powerMonitor}=require('electron');
const fs=require('node:fs');const path=require('node:path');const {UsageClient}=require('./usage.cjs');
const {resolveLanguage,translate}=require('./i18n.js');
const {DesktopMonitor,VisibilityPolicy,loginOptions}=require('./presence.cjs');
const {ORB_SIZE,dockOrb}=require('./geometry.cjs');
const smoke=process.argv.includes('--smoke-test');
let win,settingsWin,tray,client,timer,monitor,dragStart,snapTimer,busy=false,quitting=false,widgetReady=false;
const visibility=new VisibilityPolicy();
let config={mode:'orb',interval:15,opacity:68,alwaysOnTop:true,animation:true,startup:true,followCodex:true,language:'auto'};
let state={usage:null,error:null,refreshing:false,config,systemLanguage:'en',language:'en',codexRunning:null,desktopError:false};
const sizes={orb:[ORB_SIZE,ORB_SIZE],panel:[368,330]};
const t=(key,params)=>translate(state.language,key,params);
function configFile(){return path.join(app.getPath('userData'),'settings.json');}
function save(){if(smoke)return;try{fs.writeFileSync(configFile(),JSON.stringify(config));}catch{}}
function broadcast(){state.config=config;state.language=resolveLanguage(config.language,state.systemLanguage);for(const w of [win,settingsWin])if(w&&!w.isDestroyed())w.webContents.send('state',state);updateTray();}
function applyVisibility(){if(!win||!widgetReady)return;if(visibility.visible){if(!win.isVisible())win.showInactive();}else if(win.isVisible())win.hide();}
function requestShow(){visibility.show();applyVisibility();}
function requestHide(){visibility.hide();applyVisibility();}
function shouldRefresh(){return !config.followCodex||state.codexRunning===true;}
function stopPolling(){clearTimeout(timer);timer=null;}
function updatePresence(status){
  if(quitting)return;
  state.desktopError=!!status.error;
  if(typeof status.running==='boolean'){
    const previous=state.codexRunning;state.codexRunning=status.running;visibility.setPresence(status.running);applyVisibility();
    if(!shouldRefresh())stopPolling();
    else if(previous!==status.running)refresh();
  }
  broadcast();
}
function applyStartup(){if(!smoke)app.setLoginItemSettings(loginOptions(process.execPath,app.isPackaged,app.getAppPath(),config.startup));}
function bounds(mode,position){
  const [width,height]=sizes[mode];const area=position&&Number.isFinite(position.x)&&Number.isFinite(position.y)?screen.getDisplayMatching({x:position.x,y:position.y,width:position.width||ORB_SIZE,height:position.height||ORB_SIZE}).workArea:screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
  if(mode==='orb')return dockOrb(position,area);
  let x=mode==='panel'?area.x+area.width-width-14:(position?.x??area.x+area.width-width-24);
  let y=mode==='panel'?area.y+area.height-height-14:(position?.y??area.y+area.height-height-70);
  return {x:Math.round(Math.max(area.x,Math.min(x,area.x+area.width-width))),y:Math.round(Math.max(area.y,Math.min(y,area.y+area.height-height))),width,height};
}
function cancelSnap(){clearInterval(snapTimer);snapTimer=null;}
function snapOrb(animate=true,area){
  cancelSnap();if(!win||config.mode!=='orb')return;
  const start=win.getBounds();const target=dockOrb(start,area||screen.getDisplayMatching(start).workArea);
  const finish=()=>{win.setBounds(target);config.position={x:target.x,y:target.y};save();};
  if(!animate||!config.animation||(start.x===target.x&&start.y===target.y)){finish();return;}
  const began=Date.now();
  snapTimer=setInterval(()=>{
    const progress=Math.min(1,(Date.now()-began)/180),ease=1-(1-progress)**3;
    win.setPosition(Math.round(start.x+(target.x-start.x)*ease),Math.round(start.y+(target.y-start.y)*ease));
    if(progress===1){cancelSnap();finish();}
  },16);
}
function mode(value){if(!sizes[value])return;cancelSnap();const position=value==='panel'&&config.mode==='orb'?win.getBounds():config.position;config.mode=value;win.setBounds(bounds(value,position));if(value==='orb'){const b=win.getBounds();config.position={x:b.x,y:b.y};}save();broadcast();}
function createWindow(){
  win=new BrowserWindow({...bounds(config.mode,config.position),frame:false,transparent:true,hasShadow:false,resizable:false,maximizable:false,minimizable:false,skipTaskbar:true,alwaysOnTop:config.alwaysOnTop,show:false,backgroundColor:'#00000000',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.setMenu(null);win.loadFile('index.html');win.once('ready-to-show',()=>{widgetReady=true;applyVisibility();});
  if(config.mode==='orb'){const b=win.getBounds();config.position={x:b.x,y:b.y};}
  win.on('close',e=>{if(!quitting){e.preventDefault();requestHide();}});
  win.webContents.on('context-menu',()=>trayMenu().popup({window:win}));
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
}
function settings(){
  if(settingsWin&&!settingsWin.isDestroyed()){settingsWin.show();settingsWin.focus();return;}
  settingsWin=new BrowserWindow({width:400,height:770,frame:false,transparent:true,resizable:false,alwaysOnTop:true,show:false,backgroundColor:'#00000000',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  settingsWin.loadFile('settings.html');settingsWin.once('ready-to-show',()=>settingsWin.show());settingsWin.on('closed',()=>settingsWin=null);
}
async function refresh(){
  if(busy||quitting||!shouldRefresh())return;busy=true;state.refreshing=true;broadcast();
  try{state.usage=await client.read();state.error=null;}catch(e){state.error=e.message;}
  finally{busy=false;state.refreshing=false;broadcast();schedule();}
}
function schedule(){stopPolling();if(!quitting&&shouldRefresh())timer=setTimeout(refresh,config.interval*1000);}
function trayMenu(){return Menu.buildFromTemplate([
  {label:t('show'),enabled:!config.followCodex||state.codexRunning===true,click:requestShow},
  {label:t('orb'),type:'radio',checked:config.mode==='orb',click:()=>{mode('orb');requestShow();}},
  {label:t('panel'),type:'radio',checked:config.mode==='panel',click:()=>{mode('panel');requestShow();}},
  {type:'separator'},{label:t('refresh'),click:refresh},{label:t('settings'),click:settings},
  {label:t('hide'),click:requestHide},{type:'separator'},{label:t('quit'),click:()=>app.quit()}
]);}
function updateTray(){if(!tray)return;const u=state.usage;tray.setToolTip(config.followCodex&&state.codexRunning!==true?`Codex Halo · ${t(state.desktopError?'desktopUnknown':state.codexRunning===false?'desktopStopped':'desktopChecking')}`:`Codex Halo · 5h ${u?.primary?.remaining??'--'}% · ${t('secondaryLabel')} ${u?.secondary?.remaining??'--'}%${state.error?' · '+t('offline'):''}`);tray.setContextMenu(trayMenu());}
function createTray(){
  tray=new Tray(nativeImage.createFromPath(path.join(__dirname,'icon.png')).resize({width:32,height:32}));tray.on('double-click',requestShow);updateTray();
}
if(!app.requestSingleInstanceLock()&&!smoke){app.quit();}else{
app.on('second-instance',()=>{requestShow();});
app.whenReady().then(async()=>{
  app.setPath('userData',path.join(app.getPath('appData'),'CodexHalo'));
  fs.mkdirSync(app.getPath('userData'),{recursive:true});
  if(!smoke){try{const c=JSON.parse(fs.readFileSync(configFile(),'utf8'));config={...config,...c};}catch{}}
  config.followCodex=config.followCodex!==false;visibility.setFollow(config.followCodex);
  config.startup=config.startup!==false;
  if(smoke){state.codexRunning=true;visibility.setPresence(true);}
  const testLanguage=smoke&&process.argv.find(x=>x.startsWith('--test-language='))?.split('=')[1];
  state.systemLanguage=testLanguage||app.getPreferredSystemLanguages()[0]||app.getLocale();
  if(!['auto','zh','en'].includes(config.language))config.language='auto';
  state.language=resolveLanguage(config.language,state.systemLanguage);
  if(!sizes[config.mode])config.mode='orb';if(![10,15,30,60].includes(config.interval))config.interval=15;config.opacity=Math.max(35,Math.min(100,Number(config.opacity)||78));
  client=new UsageClient();client.on('usage',u=>{state.usage=u;state.error=null;broadcast();});
  ipcMain.handle('state',()=>({...state,config}));
  ipcMain.handle('action',(_,name,value)=>{
    if(name==='mode')mode(value);
    if(name==='refresh')refresh();
    if(name==='settings')settings();
    if(name==='closeSettings')settingsWin?.close();
    if(name==='hide')requestHide();
    if(name==='quit')app.quit();
    if(name==='config'){
      if(['auto','zh','en'].includes(value.language))config.language=value.language;
      if([10,15,30,60].includes(value.interval)){config.interval=value.interval;schedule();}
      if(Number.isFinite(value.opacity))config.opacity=Math.max(35,Math.min(100,value.opacity));
      for(const key of ['alwaysOnTop','animation','startup','followCodex'])if(typeof value[key]==='boolean')config[key]=value[key];
      visibility.setFollow(config.followCodex);applyVisibility();
      win.setAlwaysOnTop(config.alwaysOnTop);
      if(typeof value.startup==='boolean')applyStartup();
      if(!shouldRefresh())stopPolling();else if(typeof value.followCodex==='boolean')refresh();
      save();broadcast();
    }
    return {...state,config};
  });
  ipcMain.on('drag',(_,phase)=>{
    if(config.mode!=='orb')return;
    const cursor=screen.getCursorScreenPoint();
    if(phase==='start'){cancelSnap();const b=win.getBounds();dragStart={x:cursor.x-b.x,y:cursor.y-b.y,cursorX:cursor.x,cursorY:cursor.y,moved:false};}
    if(phase==='move'&&dragStart){
      if(Math.abs(cursor.x-dragStart.cursorX)+Math.abs(cursor.y-dragStart.cursorY)>3)dragStart.moved=true;
      if(dragStart.moved)win.setPosition(cursor.x-dragStart.x,cursor.y-dragStart.y);
    }
    if(phase==='end'&&dragStart){const moved=dragStart.moved;dragStart=null;if(moved)snapOrb(true,screen.getDisplayNearestPoint(cursor).workArea);}
  });
  createWindow();createTray();powerMonitor.on('resume',refresh);screen.on('display-removed',()=>mode(config.mode));screen.on('display-metrics-changed',()=>mode(config.mode));
  applyStartup();save();
  if(smoke){await refresh();await smokeTest();}
  else{monitor=new DesktopMonitor();monitor.on('status',updatePresence);monitor.start();if(!config.followCodex)refresh();}
});
app.on('before-quit',()=>{quitting=true;stopPolling();cancelSnap();monitor?.stop();client?.close();});
app.on('window-all-closed',()=>{});
}
async function smokeTest(){
  const out=process.env.CODEX_HALO_TEST_OUTPUT||path.resolve(__dirname,'..','..','work');fs.mkdirSync(out,{recursive:true});
  try{
    for(let i=0;i<50 && win.webContents.isLoading();i++)await new Promise(r=>setTimeout(r,100));
    await new Promise(r=>setTimeout(r,1200));
    const check=async(label,expr)=>{if(!await win.webContents.executeJavaScript(expr))throw new Error(label);};
    await check('orb data missing',`document.querySelector('#orbPrimary').textContent.includes('%')`);
    await check('system language not applied',`document.documentElement.lang===${JSON.stringify(state.language==='zh'?'zh-CN':'en')}`);
    await check('orb size mismatch',`innerWidth===116 && innerHeight===116 && document.querySelector('#sphere').offsetWidth===104`);
    await check('toolbar still exists',`document.querySelector('.orb-tools')===null`);
    await check('weekly outside circle',`(()=>{const a=document.querySelector('.orb-week').getBoundingClientRect(),b=document.querySelector('#sphere').getBoundingClientRect();return a.left>b.left&&a.right<b.right&&a.top>b.top&&a.bottom<b.bottom})()`);
    if(trayMenu().items[0].label!==t('show'))throw new Error('tray locale mismatch');
    const area=screen.getDisplayMatching(win.getBounds()).workArea;
    for(const side of ['left','right']){
      const y=area.y+Math.round((area.height-ORB_SIZE)/2);
      win.setPosition(side==='left'?area.x+30:area.x+area.width-ORB_SIZE-30,y);
      snapOrb(true,area);await new Promise(r=>setTimeout(r,240));
      const b=win.getBounds(),expected=side==='left'?area.x:area.x+area.width-ORB_SIZE;
      if(b.x!==expected||b.y!==y||config.position.x!==expected)throw new Error('edge snap failed: '+side);
    }
    fs.writeFileSync(path.join(out,'halo-orb.png'),(await win.webContents.capturePage()).toPNG());
    mode('panel');await new Promise(r=>setTimeout(r,700));
    await check('panel switch failed',`document.body.dataset.mode==='panel'`);
    fs.writeFileSync(path.join(out,'halo-panel.png'),(await win.webContents.capturePage()).toPNG());
    settings();await new Promise(r=>setTimeout(r,1000));
    fs.writeFileSync(path.join(out,'halo-settings.png'),(await settingsWin.webContents.capturePage()).toPNG());
    const fits=await settingsWin.webContents.executeJavaScript(`document.querySelector('.settings-foot').getBoundingClientRect().bottom < innerHeight-12`);
    if(!fits)throw new Error('settings overflow');
    for(const language of ['en','zh','auto']){
      await win.webContents.executeJavaScript(`window.halo.action('config',{language:'${language}'})`);
      await check('language control failed',`document.documentElement.lang===${JSON.stringify((language==='auto'?resolveLanguage('auto',state.systemLanguage):language)==='zh'?'zh-CN':'en')}`);
    }
    await win.webContents.executeJavaScript(`window.halo.action('config',{opacity:60,animation:false,interval:10})`);
    await check('opacity/animation settings failed',`document.documentElement.style.getPropertyValue('--alpha')==='0.6' && document.body.classList.contains('no-motion')`);
    await win.webContents.executeJavaScript(`window.halo.action('config',{opacity:78,animation:true,interval:15})`);
    updatePresence({running:false});
    if(win.isVisible()||timer!==null)throw new Error('widget or polling remained active without Codex');
    requestShow();if(win.isVisible())throw new Error('manual show bypassed Codex presence');
    mode('orb');requestShow();if(win.isVisible())throw new Error('orb bypassed Codex presence');
    // Avoid a second asynchronous refresh here; resume it below after visibility checks.
    state.codexRunning=true;visibility.setPresence(true);applyVisibility();
    if(!win.isVisible())throw new Error('widget did not return when Codex restarted');
    requestHide();updatePresence({running:true});if(win.isVisible())throw new Error('poll overrode manual hide');
    requestShow();if(!win.isVisible())throw new Error('explicit show failed');
    updatePresence({error:true});if(!win.isVisible())throw new Error('unknown presence hid a known-running desktop');
    state.desktopError=false;
    const before=state.usage?.updatedAt;await refresh();if(state.usage?.updatedAt<=before)throw new Error('second live refresh failed');
    const result={ok:!state.error,error:state.error,systemLanguage:state.systemLanguage,language:state.language,usage:state.usage,checks:['live RPC','104px orb + weekly inside circle','no toolbar','animated left + right snap and saved position','auto system language','localized tray','manual language override + return to auto','panel switch','settings fit','opacity + animation + interval controls','Codex exit hides both modes + pauses polling','restart restores widget','manual hide survives polling','unknown presence preserves known state','second live refresh']};
    fs.writeFileSync(path.join(out,'smoke-result.json'),JSON.stringify(result,null,2));
  }catch(e){fs.writeFileSync(path.join(out,'smoke-result.json'),JSON.stringify({ok:false,error:e.message}));}
  app.quit();
}
