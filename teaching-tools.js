'use strict';
// Coordinates are in the 1280 × 720 composition, so notes follow every output.
window.LectureTools={
 create(){
  const s={tool:'navigate',color:'#e44536',width:5,zoom:2,lens:null,pages:new Map(),key:'',active:null};
  const page=()=>{if(!s.pages.has(s.key))s.pages.set(s.key,[]);return s.pages.get(s.key)};
  return {state:s,page,
   setKey(key){if(key!==s.key){s.key=key;s.active=null;s.lens=null}},
   setTool(tool){s.tool=tool;s.active=null;s.lens=null},
   begin(p){if(s.tool==='lens'){s.lens=p;return}if(!['pen','eraser'].includes(s.tool))return;const strokes=page();if(strokes.length>=150)strokes.shift();s.active={tool:s.tool,color:s.color,width:s.tool==='eraser'?s.width*6:s.width,points:[p]};strokes.push(s.active)},
   move(p){if(s.tool==='lens')s.lens=p;if(s.active&&s.active.points.length<4000)s.active.points.push(p)},
   end(){s.active=null},leave(){s.lens=null},undo(){s.active=null;page().pop()},clear(){s.active=null;s.pages.set(s.key,[])},
   draw(g,w=1280,h=720){g.clearRect(0,0,w,h);g.save();g.scale(w/1280,h/720);g.lineCap='round';g.lineJoin='round';for(const stroke of page()){g.globalCompositeOperation=stroke.tool==='eraser'?'destination-out':'source-over';g.strokeStyle=stroke.color;g.fillStyle=stroke.color;g.lineWidth=stroke.width;const pts=stroke.points;if(pts.length===1){g.beginPath();g.arc(pts[0].x,pts[0].y,stroke.width/2,0,Math.PI*2);g.fill()}else{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke()}}g.restore();g.globalCompositeOperation='source-over'},
   magnify(g,source){if(s.tool!=='lens'||!s.lens)return;const p=s.lens,r=110,z=s.zoom;const x=Math.max(r+5,Math.min(1275-r,p.x)),y=Math.max(r+5,Math.min(715-r,p.y));g.save();g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.clip();g.fillStyle='#fff';g.fill();const scaleX=source.width/1280,scaleY=source.height/720;g.drawImage(source,(p.x-r/z)*scaleX,(p.y-r/z)*scaleY,r*2/z*scaleX,r*2/z*scaleY,x-r,y-r,r*2,r*2);g.restore();g.save();g.strokeStyle='#cc7255';g.lineWidth=5;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.stroke();g.restore()}
  };
 },
 mount(host,api,{lens=true}={}){
  host.classList.add('annotation-tools');host.setAttribute('aria-label','講義標註工具');
  const btn=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;host.append(b);return b};
  const buttons=[];for(const [tool,label] of [['navigate','↖ 操作／取消'],['pen','✎ 畫筆'],['eraser','▱ 橡皮擦'],...(lens?[['lens','⌕ 放大鏡']]:[])]){const b=btn(label,()=>{api.setTool(tool);sync()});buttons.push([tool,b])}
  const color=document.createElement('input');color.type='color';color.value='#e44536';color.setAttribute('aria-label','畫筆顏色');color.oninput=()=>api.state.color=color.value;host.append(color);
  const width=document.createElement('select');width.setAttribute('aria-label','畫筆粗細');for(const n of [3,5,9])width.add(new Option(n+' px',n));width.value='5';width.onchange=()=>api.state.width=Number(width.value);host.append(width);
  btn('↶ 復原',()=>api.undo());btn('清除本頁',()=>api.clear());
  if(lens){const zoom=document.createElement('select');zoom.setAttribute('aria-label','放大倍率');for(const z of [1.5,2,3])zoom.add(new Option(z+'×',z));zoom.value='2';zoom.onchange=()=>api.state.zoom=Number(zoom.value);host.append(zoom)}
  const hint=document.createElement('small');hint.textContent=lens?'畫筆拖曳標註；橡皮擦擦除；放大鏡跟隨游標；Esc 取消工具。':'畫筆模式會暫停點擊網頁；按「操作／取消」可繼續操作。放大鏡請使用分頁擷取輸出。';host.append(hint);
  function sync(){for(const [tool,b] of buttons){const active=api.state.tool===tool;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))}}
  sync();return sync;
 },
 bind(surface,api,map,onCancel=()=>{}){
  surface.style.touchAction='none';
  const handled=e=>{if(api.state.tool==='navigate')return false;e.preventDefault();e.stopImmediatePropagation();return true};
  surface.addEventListener('pointerdown',e=>{if(!handled(e))return;const p=map(e);if(!p)return;surface.setPointerCapture?.(e.pointerId);api.begin(p)},true);
  surface.addEventListener('pointermove',e=>{if(!handled(e))return;const p=map(e);if(p)api.move(p)},true);
  const end=e=>{if(!handled(e))return;api.end();if(surface.hasPointerCapture?.(e.pointerId))surface.releasePointerCapture(e.pointerId)};
  surface.addEventListener('pointerup',end,true);surface.addEventListener('pointercancel',()=>api.end(),true);surface.addEventListener('pointerleave',()=>api.leave(),true);
  surface.addEventListener('click',e=>handled(e),true);
  (surface.ownerDocument||document).addEventListener('keydown',e=>{if(e.key==='Escape'){api.setTool('navigate');api.leave();onCancel()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!/INPUT|TEXTAREA/.test(e.target.tagName)){e.preventDefault();api.undo()}});
 }
};
