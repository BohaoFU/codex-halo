const ORB_SIZE=92;
function dockOrb(position,area){
  const x=Number.isFinite(position?.x)?position.x:area.x+area.width-ORB_SIZE;
  const y=Number.isFinite(position?.y)?position.y:area.y+area.height-ORB_SIZE-70;
  const right=Math.max(area.x,area.x+area.width-ORB_SIZE);
  const bottom=Math.max(area.y,area.y+area.height-ORB_SIZE);
  return {
    x:Math.round(x+ORB_SIZE/2<area.x+area.width/2?area.x:right),
    y:Math.round(Math.max(area.y,Math.min(y,bottom))),
    width:ORB_SIZE,height:ORB_SIZE
  };
}
module.exports={ORB_SIZE,dockOrb};
