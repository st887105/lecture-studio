'use strict';
// One generated local texture, animated by on-device Face Landmarker jaw data.
const teacherImage=new Image(),teacherTexture=document.createElement('canvas');teacherTexture.width=562;teacherTexture.height=701;
const teacherTextureCtx=teacherTexture.getContext('2d');let teacherReady=false,teacherFailed=false,teacherJaw=0,teacherDemoUntil=0,lastTeacherFrame=-Infinity;
teacherImage.onload=()=>{teacherReady=true;$('avatarAssetStatus').textContent='已載入最新版似顏繪。開啟攝影機即可追蹤嘴型。'};
teacherImage.onerror=()=>{teacherFailed=true;$('avatarAssetStatus').textContent='角色圖片載入失敗，請重新整理；不會用通用人物代替。'};
teacherImage.src='teacher-avatar-caricature.png?v=20261025-8';
function trackedTeacherJaw(now){
 if(now<teacherDemoUntil)return Math.max(0,Math.sin(now/115)*.7+Math.sin(now/67)*.25);
 if(!state.camera||!state.workerReady||now-state.faceTime>650)return 0;
 const blend=state.face?.blends||{};const signal=Math.max(0,Math.min(1,((blend.jawOpen||0)-.018)*3.8));return Math.pow(signal,.72);
}
function drawTeacherTexture(now){
 if(now-lastTeacherFrame<32)return;lastTeacherFrame=now;
 const W=562,H=701,g=teacherTextureCtx;const target=trackedTeacherJaw(now);teacherJaw+=(target-teacherJaw)*.48;if(teacherJaw<.008)teacherJaw=0;
 g.clearRect(0,0,W,H);g.drawImage(teacherImage,0,0,W,H);

 const mx=W*Number($('mouthX').value)/100,my=H*Number($('mouthY').value)/100,half=W*Number($('mouthWidth').value)/200,gap=teacherJaw*H*.045*Math.max(.5,Math.min(1.8,Number($('mouthStrength').value)/100||1.2));
 if(gap<.4)return;
 // The lip seam is calibrated to the current caricature, without stretching its face.
 const seam=x=>{const n=Math.max(-1,Math.min(1,(x-mx)/half));return my-H*.0024*n*n+H*.00086*n};
 const opening=x=>Math.max(0,1-((x-mx)/half)**2);
 g.save();g.beginPath();for(let x=mx-half;x<=mx+half;x+=1){const y=seam(x)-gap*.20*opening(x);if(x===mx-half)g.moveTo(x,y);else g.lineTo(x,y)}for(let x=mx+half;x>=mx-half;x-=1)g.lineTo(x,seam(x)+gap*.80*opening(x));g.closePath();g.fillStyle='#432320';g.fill();g.clip();
 if(teacherJaw>.18){g.fillStyle='#f1e4d4';for(let x=mx-half*.78;x<mx+half*.78;x+=1)g.fillRect(x,seam(x)-gap*.08,1,gap*.23*opening(x));}
 if(teacherJaw>.32){g.fillStyle='#b96f76';g.beginPath();g.ellipse(mx,my+gap*.59,half*.46,gap*.18,0,0,Math.PI*2);g.fill();}g.restore();
 const patchHalf=half*1.38,top=my-H*.045,bottom=my+H*.085;
 // Stretch two texture columns about the curved seam, preserving both original lips.
 for(let x=mx-patchHalf;x<mx+patchHalf;x+=1){const width=Math.min(1,mx+patchHalf-x),line=seam(x),env=opening(x),upper=line-top,lower=bottom-line;
  const sx=x/W*teacherImage.naturalWidth,sw=width/W*teacherImage.naturalWidth;
  g.drawImage(teacherImage,sx,top/H*teacherImage.naturalHeight,sw,upper/H*teacherImage.naturalHeight,x,top,width,upper-gap*.20*env);
  g.drawImage(teacherImage,sx,line/H*teacherImage.naturalHeight,sw,lower/H*teacherImage.naturalHeight,x,line+gap*.80*env,width,lower-gap*.80*env);
 }

}
const previousTalkingPresenter=presenter;
presenter=function(c,r){
 if(state.mode!=='avatar'){previousTalkingPresenter(c,r);return}
 const [x,y,w,h]=r;c.save();rounded(c,x,y,w,h,18,'#e8e9dd');c.clip();
 if(teacherReady){drawTeacherTexture(performance.now());fit(c,teacherTexture,x,y,w,h,false,false)}else text(c,teacherFailed?'角色圖片未載入':'角色圖片載入中…',x+16,y+h/2,Math.min(18,w/14),'#526657');
 if($('showName').checked&&$('name').value.trim()){const size=Math.min(20,w/13),label=$('name').value.trim();c.font=`500 ${size}px sans-serif`;rounded(c,x+10,y+h-42,Math.min(w-20,c.measureText(label).width+28),31,7,'#233b34e8');text(c,label,x+23,y+h-20,size,'#fff',500)}c.restore();
};
$('testMouth').onclick=()=>{if(!teacherReady){toast('請等待角色圖片載入完成。');return}if(state.camera&&!state.workerReady)initAI();teacherDemoUntil=performance.now()+4000;state.paused=false;state.stopped=false;state.mode='avatar';document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode==='avatar'));$('pauseBtn').textContent='暫停畫面';$('avatarAssetStatus').textContent='示範嘴型動畫 4 秒（不是實際收音或嘴型追蹤）。';setTimeout(()=>{$('avatarAssetStatus').textContent=state.camera?'示範結束；正式嘴型由攝影機 AI 追蹤驅動。':'示範結束。開啟攝影機後可跟隨您的張嘴／閉嘴。'},4100);status()};
for(const id of ['mouthX','mouthY','mouthWidth','mouthStrength'])$(id).oninput=()=>{lastTeacherFrame=-Infinity;$(id+'Value').textContent=$(id).value+'%'};
// Losing tracking closes the mouth; it never invents ongoing speech.
setInterval(()=>{if(state.mode!=='avatar')return;const demo=performance.now()<teacherDemoUntil;if(demo)return;if(!state.camera){$('avatarAssetStatus').textContent=teacherFailed?'角色圖片載入失敗。':'似顏繪已就緒；目前嘴型未追蹤，請開啟攝影機。'}else if(state.workerReady&&performance.now()-state.faceTime<650){$('avatarAssetStatus').textContent='● 攝影機嘴型同步中：張嘴／閉嘴追蹤，聲音由 Meet 傳送。'}else if(state.workerReady){$('avatarAssetStatus').textContent='未偵測到臉，嘴巴保持閉合；請面向鏡頭。'}else{$('avatarAssetStatus').textContent='等待 AI 嘴型模型；若無法載入，請按「重新載入 AI 模型」。'}},500);
