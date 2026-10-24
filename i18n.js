(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HaloI18n=api;})(globalThis,function(){
  const messages={
    zh:{
      show:'显示 Codex Halo',orb:'水波悬浮球',panel:'右下角面板',refresh:'立即刷新',settings:'外观与设置',hide:'隐藏到托盘',quit:'退出 Halo',
      followCodex:'跟随 Codex 显示',followCodexHint:'Codex 退出时隐藏，重新打开时自动显示',desktopChecking:'正在检测 Codex…',desktopRunning:'Codex 桌面客户端正在运行',desktopStopped:'等待 Codex 启动 · 悬浮窗已隐藏',desktopUnknown:'暂时无法检测 Codex · 稍后重试',
      switchPanel:'切换到右下角面板',switchOrb:'切换为悬浮球',closeSettings:'关闭设置',settingsTitle:'让用量，轻轻浮现。',
      tagline:'让用量，轻轻浮现',primaryTitle:'5 小时额度',primaryLabel:'5 小时剩余',secondaryLabel:'每周',overallLabel:'整体',weeklyTitle:'每周额度',overallTitle:'整体额度',daysTitle:'{n} 天额度',hoursTitle:'{n} 小时额度',shortTerm:'SHORT TERM',weekly:'WEEKLY',longTerm:'LONG TERM',remaining:'剩余可用',
      connected:'已连接 Codex',connecting:'正在连接 Codex',offline:'连接异常 · 保留上次数据',stale:'数据已过期',unknownReset:'重置时间暂不可用',waitingReset:'等待服务更新额度',resetIn:'{time}后重置',day:'{n} 天',hour:'{n} 时',minute:'{n} 分',
      firstSync:'首次同步中…',justSynced:'刚刚同步',secondsAgo:'{n} 秒前同步',minutesAgo:'{n} 分前同步',syncing:'同步中…',autoRefresh:'{n}s 自动刷新',hint:'拖动移动 · 双击切换 · 右键更多',
      displaySection:'DISPLAY / 显示形态',appearanceSection:'APPEARANCE / 外观',connectionSection:'CONNECTION / 连接',opacity:'玻璃不透明度',animation:'流动水波',animationHint:'关闭后显示静态水位，降低动画开销',alwaysOnTop:'始终置顶',alwaysOnTopHint:'在其他窗口上方显示',refreshSetting:'自动刷新',refreshHint:'读取当前 Codex 账户的真实额度',everySeconds:'每 {n} 秒',startup:'开机启动',language:'界面语言',systemLanguage:'自动 · 跟随系统',
      noteMapping:'球内水位 = 5 小时剩余，外环与底部数字 = 每周剩余。',noteControls:'拖动移动，双击切换；右键可隐藏或退出。',noteWeekly:'每周额度是周期限制，不代表全账户总额度。',settingsConnected:'已连接 · {plan} · {time} 同步',
      HALO_CLI_NOT_FOUND:'找不到 Codex CLI。请先打开 Codex，或将 CODEX_HALO_CLI 设为 codex.exe 的路径。',HALO_NO_LIMITS:'暂未返回额度，请确认已使用 ChatGPT 账户登录 Codex。',HALO_CLOSED:'连接已关闭',HALO_DISCONNECTED:'Codex 连接已断开，将自动重连。',HALO_REQUEST_FAILED:'额度请求失败',HALO_TIMEOUT:'读取超时，请检查网络；将自动重试。',HALO_UNAVAILABLE:'Codex 连接暂不可用。'
    },
    en:{
      show:'Show Codex Halo',orb:'Water orb',panel:'Corner panel',refresh:'Refresh now',settings:'Appearance & settings',hide:'Hide to tray',quit:'Quit Halo',
      followCodex:'Follow Codex',followCodexHint:'Hide when Codex exits; show when it returns',desktopChecking:'Checking for Codex…',desktopRunning:'Codex desktop is running',desktopStopped:'Waiting for Codex · widget hidden',desktopUnknown:'Unable to check Codex · retrying',
      switchPanel:'Switch to corner panel',switchOrb:'Switch to orb',closeSettings:'Close settings',settingsTitle:'Your usage, in flow.',
      tagline:'YOUR USAGE, IN FLOW',primaryTitle:'5-hour limit',primaryLabel:'5h remaining',secondaryLabel:'Weekly',overallLabel:'Overall',weeklyTitle:'Weekly limit',overallTitle:'Overall limit',daysTitle:'{n}-day limit',hoursTitle:'{n}-hour limit',shortTerm:'SHORT TERM',weekly:'WEEKLY',longTerm:'LONG TERM',remaining:'remaining',
      connected:'Connected to Codex',connecting:'Connecting to Codex',offline:'Offline · last known usage',stale:'Usage is out of date',unknownReset:'Reset time unavailable',waitingReset:'Waiting for updated limits',resetIn:'Resets in {time}',day:'{n}d',hour:'{n}h',minute:'{n}m',
      firstSync:'Waiting for first sync…',justSynced:'Synced just now',secondsAgo:'Synced {n}s ago',minutesAgo:'Synced {n}m ago',syncing:'Syncing…',autoRefresh:'Auto-refresh {n}s',hint:'Drag to move · Double-click to switch · Right-click for more',
      displaySection:'DISPLAY',appearanceSection:'APPEARANCE',connectionSection:'CONNECTION',opacity:'Glass opacity',animation:'Flowing waves',animationHint:'Turn off for a still water level and less motion',alwaysOnTop:'Always on top',alwaysOnTopHint:'Keep Halo above other windows',refreshSetting:'Auto-refresh',refreshHint:'Read limits from your signed-in Codex account',everySeconds:'Every {n}s',startup:'Launch at sign-in',language:'Language',systemLanguage:'Auto · System language',
      noteMapping:'Water = 5h remaining. Ring and lower number = weekly.',noteControls:'Drag to move; double-click to switch; right-click for more.',noteWeekly:'Weekly limits are periodic, not a lifetime allowance.',settingsConnected:'Connected · {plan} · Synced {time}',
      HALO_CLI_NOT_FOUND:'Codex CLI not found. Open Codex, or set CODEX_HALO_CLI to the path of codex.exe.',HALO_NO_LIMITS:'No limits returned. Sign in to Codex with a ChatGPT account.',HALO_CLOSED:'Connection closed',HALO_DISCONNECTED:'Disconnected from Codex. Reconnecting automatically.',HALO_REQUEST_FAILED:'Unable to read usage limits',HALO_TIMEOUT:'Request timed out. Check your network; retrying automatically.',HALO_UNAVAILABLE:'Codex is temporarily unavailable.'
    }
  };
  function resolveLanguage(choice,system){const value=choice&&choice!=='auto'?choice:system;return /^zh(?:[-_]|$)/i.test(value||'')?'zh':'en';}
  function translate(lang,key,params={}){return (messages[lang]?.[key]??messages.en[key]??key).replace(/\{(\w+)\}/g,(_,k)=>params[k]??'');}
  let language='en';
  function t(key,params){return translate(language,key,params);}
  function apply(doc){doc.documentElement.lang=language==='zh'?'zh-CN':'en';doc.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));doc.querySelectorAll('[data-i18n-title]').forEach(el=>{el.title=t(el.dataset.i18nTitle);el.setAttribute('aria-label',el.title);});}
  return {messages,resolveLanguage,translate,t,apply,setLanguage:lang=>{language=resolveLanguage(lang);},errorText:message=>t(message)};
});
