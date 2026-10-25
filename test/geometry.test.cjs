const {test}=require('node:test');const assert=require('node:assert/strict');
const {dockOrb,ORB_SIZE}=require('../geometry.cjs');
const area={x:0,y:0,width:1920,height:1040};
test('release snaps to nearest horizontal edge, preserving height',()=>{
  assert.deepEqual(dockOrb({x:250,y:360},area),{x:0,y:360,width:92,height:92});
  assert.equal(dockOrb({x:1300,y:360},area).x,1828);
});
test('clamps vertically to the display work area, including taskbar insets',()=>{
  const inset={x:0,y:40,width:1920,height:1000};
  assert.equal(dockOrb({x:10,y:-20},inset).y,40);
  assert.equal(dockOrb({x:1800,y:1200},inset).y,948);
});
test('handles displays with negative coordinates and keeps the entire orb visible',()=>{
  const left={x:-2560,y:-200,width:2560,height:1400};
  const b=dockOrb({x:-140,y:1000},left);assert.equal(b.x,-ORB_SIZE);assert.equal(b.y,1000);
  assert.equal(dockOrb({x:-2400,y:-600},left).x,-2560);
  assert.equal(dockOrb({x:-2400,y:-600},left).y,-200);
});
test('new and invalid positions default to right edge; old free positions migrate safely',()=>{
  assert.equal(dockOrb(undefined,area).x,1828);assert.equal(dockOrb({x:NaN,y:Infinity},area).x,1828);
  assert.equal(dockOrb({x:800,y:500},area).x,0);
});
