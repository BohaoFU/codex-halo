const {spawn}=require('node:child_process');
const {EventEmitter}=require('node:events');
const path=require('node:path');

function isCodexDesktop(processInfo,override=process.env.CODEX_HALO_DESKTOP_EXE){
  const executable=String(processInfo.path||'').replaceAll('/','\\').toLowerCase();
  if(!executable)return false;
  const name=path.win32.basename(executable);
  if(override && executable===String(override).replaceAll('/','\\').toLowerCase())return true;
  if(!['codex.exe','chatgpt.exe'].includes(name))return false;
  // Desktop and CLI can share the name codex.exe; never count an app-server as the UI.
  if(/\\(?:bin|vendor|node_modules)\\/.test(executable))return false;
  if(/\\windowsapps\\openai\.codex_[^\\]+\\app\\(?:chatgpt|codex)\.exe$/.test(executable))return true;
  // Also support a non-Store desktop install, when its binary identifies itself as Codex.
  return /\\(?:codex|openai\\codex)\\(?:app\\)?(?:codex|chatgpt)\.exe$/.test(executable)
    && /^codex(?:\s+desktop)?$/i.test(String(processInfo.product||''));
}

class VisibilityPolicy{
  constructor(follow=true){this.follow=follow;this.running=null;this.manuallyHidden=false;}
  setPresence(running){if(typeof running!=='boolean')return;if(running&&this.running!==true)this.manuallyHidden=false;this.running=running;}
  setFollow(follow){if(this.follow!==follow){this.follow=follow;this.manuallyHidden=false;}}
  show(){this.manuallyHidden=false;}
  hide(){this.manuallyHidden=true;}
  get visible(){return !this.manuallyHidden&&(!this.follow||this.running===true);}
}

function loginOptions(executable,packaged,appPath,enabled){
  return {openAtLogin:enabled,path:executable,args:packaged?['--background']:[appPath,'--background']};
}

// A single hidden PowerShell helper avoids repeatedly launching a shell every few seconds.
// Only process names, executable paths and product names are read; never command lines.
const watcherScript=String.raw`
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$productCache = @{}
$processNames = @('Codex','ChatGPT')
if ($env:CODEX_HALO_DESKTOP_EXE) { $processNames += [IO.Path]::GetFileNameWithoutExtension($env:CODEX_HALO_DESKTOP_EXE) }
while ($true) {
  try {
    $script:unreadable = $false
    $items = @(Get-Process -Name $processNames -ErrorAction SilentlyContinue | ForEach-Object {
      $desktopPath = $_.Path
      if ($desktopPath) {
        if (-not $productCache.ContainsKey($desktopPath)) {
          try { $productCache[$desktopPath] = [Diagnostics.FileVersionInfo]::GetVersionInfo($desktopPath).ProductName } catch { $productCache[$desktopPath] = '' }
        }
        @{ path = $desktopPath; product = $productCache[$desktopPath] }
      } else { $script:unreadable = $true }
    })
    if ($script:unreadable) { throw 'Process snapshot incomplete' }
    [Console]::Out.WriteLine((ConvertTo-Json -InputObject $items -Compress -Depth 3))
    [Console]::Out.Flush()
  } catch {
    [Console]::Out.WriteLine('{"error":true}')
    [Console]::Out.Flush()
  }
  [Threading.Thread]::Sleep(3000)
}
`;

class DesktopMonitor extends EventEmitter{
  constructor(){super();this.child=null;this.stopped=false;this.retry=null;}
  start(){
    if(this.stopped||this.child)return;
    const powershell=path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
    const child=spawn(powershell,['-NoLogo','-NoProfile','-NonInteractive','-Command',watcherScript],{windowsHide:true,stdio:['ignore','pipe','pipe']});
    this.child=child;let buffer='';let failed=false;
    const fail=()=>{if(failed||this.stopped)return;failed=true;if(this.child===child)this.child=null;this.emit('status',{error:true});this.retry=setTimeout(()=>this.start(),5000);};
    child.on('error',fail);child.on('exit',fail);child.stderr.on('data',()=>{});
    child.stdout.setEncoding('utf8');child.stdout.on('data',chunk=>{
      buffer+=chunk;let newline;
      while((newline=buffer.indexOf('\n'))>=0){
        const line=buffer.slice(0,newline).trim();buffer=buffer.slice(newline+1);
        try{const items=JSON.parse(line);if(!Array.isArray(items))throw new Error('No snapshot');this.emit('status',{running:items.some(item=>isCodexDesktop(item))});}
        catch{this.emit('status',{error:true});}
      }
    });
  }
  stop(){this.stopped=true;clearTimeout(this.retry);this.child?.kill();this.child=null;}
}
module.exports={isCodexDesktop,VisibilityPolicy,DesktopMonitor,loginOptions};
