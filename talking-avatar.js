'use strict';
// Per-pose measured seams are immutable to prevent accidental calibration drift.
const characterAssets={teacher:{src:'teacher-gestures-v2.png',w:760,h:884,mouths:[[.49845,.35279,.0566],[.51182,.35271,.0571],[.51385,.35269,.0572]]},onion:{src:'onion-gestures.png',w:724,h:724,mouths:[[413/724,421/724,18/724],[368/724,421/724,18/724],[324/724,421/724,18/724]]}};
let teacherReady=false,teacherJaw=0,teacherDemoUntil=0,lastTeacherFrame=-Infinity,lastSpeaking=-Infinity;
const teacherTexture=document.createElement('canvas'),teacherTextureCtx=teacherTexture.getContext('2d');
for(const a of Object.values(characterAssets)){a.image=new Image();a.ready=false;a.image.onload=()=>{a.ready=true;teacherReady=true;lastTeacherFrame=-Infinity};a.image.onerror=()=>{a.failed=true};a.image.src=a.src+'?v=20261025-10'}
function currentCharacter(){return $('characterSelect').value==='onion'?'onion':'teacher'}
function trackedTeacherJaw(now){if(now<teacherDemoUntil)return Math.max(0,Math.sin((now-teacherDemoUntil)/190)*.65+.35);if(!state.camera||!state.workerReady||now-state.faceTime>650)return 0;const signal=Math.max(0,Math.min(1,((state.face?.blends?.jawOpen||0)-.018)*3.8));return Math.pow(signal,.72)}
function chosenGesture(now,jaw){const mode=$('gestureMode').value;if(mode!=='auto')return{neutral:0,explain:1,point:2}[mode]||0;if(jaw>.08)lastSpeaking=now;return now-lastSpeaking<850?1+Math.floor(now/1800)%2:0}
function drawTeacherTexture(now){
 if(now-lastTeacherFrame<30)return;lastTeacherFrame=now;const a=characterAssets[currentCharacter()],W=a.w,H=a.h,g=teacherTextureCtx;if(!a.ready)return;
 const target=trackedTeacherJaw(now);teacherJaw+=(target-teacherJaw)*.5;if(teacherJaw<.008)teacherJaw=0;
 const pose=chosenGesture(now,teacherJaw),m=a.mouths[pose],isTeacher=currentCharacter()==='teacher',sw=a.image.naturalWidth/3,sourceScale=isTeacher?H/a.image.naturalHeight:W/sw;
 const offset=isTeacher?W/2-(pose+m[0])*sw*sourceScale:(a.mouths[0][0]-m[0])*W;
 if(teacherTexture.width!==W||teacherTexture.height!==H){teacherTexture.width=W;teacherTexture.height=H}
 g.clearRect(0,0,W,H);g.save();
 if(isTeacher){
  g.translate(offset,0);g.scale(sourceScale,sourceScale);g.beginPath();
  const polygons=[[[0,0],[580,0],[580,410],[532,410],[532,515],[568,600],[568,884],[0,884]],[[593,0],[1174,0],[1174,300],[1168,884],[720,884],[720,750],[620,735],[598,680],[590,570],[538,480],[538,420],[593,400]],[[1174,0],[1780,0],[1780,884],[1174,884]]];
  polygons[pose].forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.clip();g.drawImage(a.image,0,0);
 }else g.drawImage(a.image,pose*sw,0,sw,a.image.naturalHeight,offset,0,W,H);
 g.restore();
 const mx=isTeacher?W/2:a.mouths[0][0]*W,my=m[1]*H,half=m[2]*(isTeacher?sw*sourceScale:W),strength=Math.max(.5,Math.min(1.8,Number($('mouthStrength').value)/100||1.2));
 if(currentCharacter()==='onion'){
  if(teacherJaw<.01)return;
  const gradient=g.createRadialGradient(mx,my,14,mx,my,29);gradient.addColorStop(0,'#ffe8ba');gradient.addColorStop(.72,'#ffe8ba');gradient.addColorStop(1,'#ffe8ba00');g.fillStyle=gradient;g.fillRect(mx-30,my-24,60,50);
  const gap=teacherJaw*26*strength;g.fillStyle='#4b2c24';g.beginPath();g.ellipse(mx,my+3,half,gap/2+2,0,0,Math.PI*2);g.fill();if(gap>7){g.fillStyle='#fff2d6';g.fillRect(mx-half*.65,my-gap*.23,half*1.3,Math.max(2,gap*.16));g.fillStyle='#d58a7d';g.beginPath();g.ellipse(mx,my+gap*.32,half*.55,gap*.16,0,0,Math.PI*2);g.fill()}return;
 }
 const gap=teacherJaw*H*.024*strength;if(gap<.4)return;
 const seam=x=>{const n=Math.max(-1,Math.min(1,(x-mx)/half));return my-1.2*n*n+.35*n},opening=x=>Math.max(0,1-((x-mx)/half)**2);
 g.save();g.beginPath();for(let x=mx-half;x<=mx+half;x+=.5){const y=seam(x)-gap*.2*opening(x);if(x===mx-half)g.moveTo(x,y);else g.lineTo(x,y)}for(let x=mx+half;x>=mx-half;x-=.5)g.lineTo(x,seam(x)+gap*.8*opening(x));g.closePath();g.fillStyle='#432320';g.fill();g.clip();
 if(teacherJaw>.18){g.fillStyle='#f1e4d4';for(let x=mx-half*.78;x<mx+half*.78;x++)g.fillRect(x,seam(x)-gap*.08,1,gap*.23*opening(x))}
 if(teacherJaw>.32){g.fillStyle='#b96f76';g.beginPath();g.ellipse(mx,my+gap*.59,half*.46,gap*.18,0,0,Math.PI*2);g.fill()}g.restore();
 const top=my-H*.026,bottom=my+H*.069;
 for(let x=mx-half*1.38;x<mx+half*1.38;x++){const line=seam(x),env=opening(x),upper=line-top,lower=bottom-line,sx=(x-offset)/sourceScale;g.drawImage(a.image,sx,top/H*a.image.naturalHeight,1/sourceScale,upper/H*a.image.naturalHeight,x,top,1,upper-gap*.2*env);g.drawImage(a.image,sx,line/H*a.image.naturalHeight,1/sourceScale,lower/H*a.image.naturalHeight,x,line+gap*.8*env,1,lower-gap*.8*env)}
}
const previousTalkingPresenter=presenter;
presenter=function(c,r){if(state.mode!=='avatar'){previousTalkingPresenter(c,r);return}const [x,y,w,h]=r,a=characterAssets[currentCharacter()];c.save();rounded(c,x,y,w,h,18,'#e8e9dd');c.clip();if(a.ready){drawTeacherTexture(performance.now());fit(c,teacherTexture,x,y,w,h,false,false)}else text(c,a.failed?'角色圖片未載入':'角色圖片載入中…',x+16,y+h/2,Math.min(18,w/14),'#526657');if($('showName').checked&&$('name').value.trim()){const size=Math.min(20,w/13),label=currentCharacter()==='onion'?'洋蔥寶寶':$('name').value.trim();c.font='500 '+size+'px sans-serif';rounded(c,x+10,y+h-42,Math.min(w-20,c.measureText(label).width+28),31,7,'#233b34e8');text(c,label,x+23,y+h-20,size,'#fff',500)}c.restore()};
$('testMouth').onclick=()=>{if(!characterAssets[currentCharacter()].ready){toast('請等待角色圖片載入完成。');return}if(state.camera&&!state.workerReady)initAI();teacherDemoUntil=performance.now()+8000;state.paused=false;state.stopped=false;state.mode='avatar';document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode==='avatar'));$('pauseBtn').textContent='暫停畫面';status()};
$('mouthStrength').oninput=()=>{lastTeacherFrame=-Infinity;$('mouthStrengthValue').textContent=$('mouthStrength').value+'%'};
$('characterSelect').onchange=()=>{lastTeacherFrame=-Infinity;teacherJaw=0;lastSpeaking=-Infinity;const a=characterAssets[currentCharacter()];$('characterThumbnail').src=a.src;$('characterThumbnail').alt=currentCharacter()==='onion'?'洋蔥寶寶三種講課手勢':'眼下已修飾的講師三種手勢';state.mode='avatar';document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode==='avatar'))};
$('gestureMode').onchange=()=>{lastTeacherFrame=-Infinity};
setInterval(()=>{if(state.mode!=='avatar')return;const now=performance.now(),a=characterAssets[currentCharacter()];$('avatarAssetStatus').textContent=!a.ready?(a.failed?'角色載入失敗，請重新整理。':'角色載入中…'):now<teacherDemoUntil?'示範嘴型與手勢 8 秒（非實際追蹤）。':!state.camera?'角色已就緒；開啟攝影機追蹤嘴型，或先測試動畫。':state.workerReady&&now-state.faceTime<650?'● 嘴型追蹤中；手勢為自動動畫，聲音由 Meet 傳送。':state.workerReady?'未偵測到臉，嘴型將閉合；請面向鏡頭。':'等待嘴型模型，必要時請重新載入 AI 模型。'},500);
