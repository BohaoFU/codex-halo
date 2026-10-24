const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('halo',{
  state:()=>ipcRenderer.invoke('state'),
  action:(name,value)=>ipcRenderer.invoke('action',name,value),
  onState:fn=>{const listener=(_,s)=>fn(s);ipcRenderer.on('state',listener);return()=>ipcRenderer.removeListener('state',listener);},
  drag:(phase)=>ipcRenderer.send('drag',phase)
});
