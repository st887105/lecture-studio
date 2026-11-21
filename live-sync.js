'use strict';
// 20261120: 影片同步（背景分頁也持續取幀）、教材聲音轉送、免回主介面切換教材分頁。
// 1) 以 MediaStreamTrackProcessor 直接讀取擷取影格，不依賴隱藏 <video> 的背景繪製。
let liveStream=null,liveClone=null,liveReader=null,liveFrame=null,liveFrameTime=0;
window.screenSource=()=>state.source==='screen'&&liveStream===state.screen&&liveFrame?liveFrame:null;
function stopLiveFrames(){try{liveReader?.cancel()}catch{}liveReader=null;liveClone?.stop();liveClone=null;try{liveFrame?.close()}catch{}liveFrame=null;liveStream=null}
async function startLiveFrames(stream){
 stopLiveFrames();liveStream=stream;const track=stream?.getVideoTracks()[0];
 if(!track||typeof MediaStreamTrackProcessor!=='function')return;
 try{const clone=track.clone();liveClone=clone;const reader=new MediaStreamTrackProcessor({track:clone}).readable.getReader();liveReader=reader;
  while(liveReader===reader){const {value,done}=await reader.read();if(done)break;if(liveReader!==reader){value.close();break}const old=liveFrame;liveFrame=value;liveFrameTime=performance.now();try{old?.close()}catch{}}
 }catch{if(liveStream===stream){try{liveFrame?.close()}catch{}liveFrame=null}}
}
// 2) 工作室分頁在背景時 rAF 會停止；用不受節流的 Worker 計時器補畫，浮動視窗與輸出分頁都拿得到最新畫面。
try{const tickWorker=new Worker(URL.createObjectURL(new Blob(['setInterval(()=>postMessage(0),33)'],{type:'text/javascript'})));tickWorker.onmessage=()=>{if(document.hidden)window.renderFrame()}}catch{}
setInterval(()=>{if(state.screen!==liveStream){if(state.screen)startLiveFrames(state.screen);else stopLiveFrames()}},200);
// 3) 教材聲音：交給分享輸出分頁播放，Meet 分享該分頁時一併送出。
window.studioAudioStream=()=>{const tracks=state.screen?.getAudioTracks().filter(t=>t.readyState==='live')||[];return tracks.length?state.screen:null};
// 4) 切換教材分頁：浮動工具箱與單頁講課都可直接重選，不必回主介面。
window.switchCaptureTab=()=>{try{$('screenBtn').onclick()}catch(e){toast('無法開啟分頁選擇：'+e.message)}};
if(document.getElementById('singleOutput')){const swap=document.createElement('button');swap.id='singleSwap';swap.textContent='⇄ 換教材分頁';swap.title='重新選擇要擷取的教材分頁';swap.onclick=window.switchCaptureTab;$('singleOutput').before(swap)}
window.addEventListener('beforeunload',stopLiveFrames);

// ===== 20261121：滿版輸出、置中姓名牌、真人去背美化 =====
// 5) 教材實際區域：輸出與浮動視窗只裁切這一塊，去掉上下／左右留白。
function sourceSize(){let s=null;if(state.source==='screen')s=window.screenSource?.()||(screen.readyState>=2?screen:null);else if(state.source==='images')s=state.images[state.page];else if(state.source==='pdf')s=typeof pdfCanvas!=='undefined'?pdfCanvas:null;if(!s)return null;const w=s.videoWidth||s.naturalWidth||s.displayWidth||s.width,h=s.videoHeight||s.naturalHeight||s.displayHeight||s.height;return w&&h?[w,h]:null}
window.contentRect=()=>{if(state.layout!=='pip'||state.stopped||state.source==='demo')return[0,0,1280,720];const d=sourceSize();if(!d)return[0,0,1280,720];const k=Math.min(1280/d[0],720/d[1]),w=d[0]*k,h=d[1]*k;if(w<320||h<180)return[0,0,1280,720];return[(1280-w)/2,(720-h)/2,w,h]};
// 2) 姓名牌：置中在人物下方，第二行顯示網站名稱。
const NAME_SUB='分享網站操作@車城國小講稿工作室';
function drawNameTag(c,[x,y,w,h],label){const size=Math.max(11,Math.min(22,w/11)),sub=Math.max(8,size*.55);c.save();c.font=`700 ${size}px "Noto Sans TC",sans-serif`;const t1=c.measureText(label).width;c.font=`500 ${sub}px "Noto Sans TC",sans-serif`;const t2=c.measureText(NAME_SUB).width;const bw=Math.min(w-6,Math.max(t1,t2)+size*1.2),bh=size*1.25+sub*1.35+size*.5,bx=x+(w-bw)/2,by=y+h-bh-4;rounded(c,bx,by,bw,bh,8,'#1d342ee6');c.textAlign='center';c.textBaseline='top';c.fillStyle='#fff';c.font=`700 ${size}px "Noto Sans TC",sans-serif`;c.fillText(label,x+w/2,by+size*.3,bw-8);c.fillStyle='#cfe3d3';c.font=`500 ${sub}px "Noto Sans TC",sans-serif`;c.fillText(NAME_SUB,x+w/2,by+size*.3+size*1.25,bw-8);c.restore()}
// 3) 真人模式：MediaPipe 人像分割去背＋柔膚提亮。
let segmenter=null,segLoading=false,segFailed=false,segTime=0;const personCanvas=document.createElement('canvas'),personCtx=personCanvas.getContext('2d'),maskCanvas=document.createElement('canvas'),maskCtx=maskCanvas.getContext('2d'),softCanvas=document.createElement('canvas'),softCtx=softCanvas.getContext('2d');
async function loadSegmenter(){if(segmenter||segLoading||segFailed)return;segLoading=true;try{const {ImageSegmenter,FilesetResolver}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs');const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');segmenter=await ImageSegmenter.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',delegate:'CPU'},runningMode:'VIDEO',outputConfidenceMasks:true,outputCategoryMask:false});toast('真人去背已啟用。')}catch(e){segFailed=true;toast('真人去背模型載入失敗，改用一般真人畫面。')}finally{segLoading=false}}
function updatePerson(){const now=performance.now();if(now-segTime<66)return true;if(!segmenter||cam.readyState<2)return false;segTime=now;const vw=cam.videoWidth,vh=cam.videoHeight;if(!vw)return false;for(const cv of [personCanvas,maskCanvas,softCanvas])if(cv.width!==vw||cv.height!==vh){cv.width=vw;cv.height=vh}
 try{const res=segmenter.segmentForVideo(cam,now),m=res.confidenceMasks?.[0];if(!m)return false;const data=m.getAsFloat32Array(),img=maskCtx.createImageData(vw,vh);for(let i=0,j=3;i<data.length;i++,j+=4)img.data[j]=Math.max(0,Math.min(255,(data[i]-.25)*400));maskCtx.putImageData(img,0,0);res.close?.()}catch{return false}
 // 美化：提亮、暖色、輕度柔膚（模糊層 35% 疊加），再用遮罩去背並柔化邊緣。
 personCtx.clearRect(0,0,vw,vh);personCtx.filter='brightness(1.07) contrast(1.04) saturate(1.1)';personCtx.drawImage(cam,0,0);softCtx.filter='blur(3px) brightness(1.08)';softCtx.clearRect(0,0,vw,vh);softCtx.drawImage(cam,0,0);personCtx.filter='none';personCtx.globalAlpha=.35;personCtx.drawImage(softCanvas,0,0);personCtx.globalAlpha=1;personCtx.globalCompositeOperation='destination-in';personCtx.filter='blur(2px)';personCtx.drawImage(maskCanvas,0,0);personCtx.filter='none';personCtx.globalCompositeOperation='source-over';return true}
const beforeNamePresenter=presenter;
presenter=function(c,r){const show=$('showName').checked,label=state.mode==='avatar'&&typeof currentCharacter==='function'&&currentCharacter()==='onion'?'洋蔥寶寶':$('name').value.trim();
 if(state.mode==='camera'&&state.camera){loadSegmenter();if(updatePerson()){const [x,y,w,h]=r;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();const vw=personCanvas.width,vh=personCanvas.height,k=Math.max(w/vw,h/vh)*1.05,dw=vw*k,dh=vh*k;if($('mirror').checked){c.translate(x+w,0);c.scale(-1,1);c.drawImage(personCanvas,(w-dw)/2,y+h-dh,dw,dh)}else c.drawImage(personCanvas,x+(w-dw)/2,y+h-dh,dw,dh);c.restore();if(show&&label)drawNameTag(c,r,label);return}}
 $('showName').checked=false;try{beforeNamePresenter(c,r)}finally{$('showName').checked=show}if(show&&label&&state.mode!=='none')drawNameTag(c,r,label)};
// 1) 建議流程：首頁卡片＋首次跳出提醒。
(()=>{const steps='<ol class="flow-steps"><li>在工作室<b>擷取教材分頁</b>，選學習吧或 Canva。</li><li>按「<b>開啟分享輸出</b>」，分頁列會多出「車城國小｜分享輸出」。</li><li>到 Meet 按「分享螢幕」→「<b>Chrome 分頁</b>」（不要選「視窗」）→「<b>車城國小｜分享輸出</b>」→ 打開分享音訊 →「分享」。</li><li><b>最後</b>回工作室按「浮動工具箱」，再到教材分頁講課。</li></ol>';
 const css=document.createElement('style');css.textContent='.flow-card{background:#fff5ec;border:2px solid #e9b49f;border-radius:12px;padding:16px 20px;margin:0 0 22px}.flow-card h2{color:#b4513a;font-size:15px;margin:0 0 6px}.flow-steps{margin:6px 0 4px;padding-left:22px;font-size:13px;line-height:1.9;color:#3a4a44}.flow-steps b{color:#b4513a}.flow-card .hint{margin:4px 0 0}#flowDialog .flow-steps{font-size:14px}#flowDialog label{display:flex;gap:6px;align-items:center;font-size:12px;color:#6d776b;margin-top:12px}@media(max-width:720px){.flow-card{padding:12px}.flow-steps{font-size:12px}}';document.head.append(css);
 const card=document.createElement('section');card.className='flow-card';card.innerHTML='<h2>★ Meet 講課建議流程</h2>'+steps+'<p class="hint">確認方法：Meet 主畫面看得到人物，就代表分享正確。浮動工具箱若被關閉，請在 Meet 開始分享後再開一次。</p>';document.querySelector('.intro').after(card);
 const dlg=document.createElement('dialog');dlg.id='flowDialog';dlg.innerHTML='<button class="dialog-close" aria-label="關閉">×</button><div class="eyebrow">MEET 建議流程</div><h2>開始講課前，照這 4 步。</h2>'+steps+'<label><input type="checkbox" id="flowNoShow">下次不再自動顯示</label><button class="primary full" id="flowOk">我知道了</button>';document.body.append(dlg);
 const close=()=>{try{if($('flowNoShow').checked)localStorage.setItem('lsFlowHide','1')}catch{}dlg.close()};dlg.querySelector('.dialog-close').onclick=close;$('flowOk').onclick=close;
 const btn=document.createElement('button');btn.className='quiet';btn.textContent='建議流程';btn.onclick=()=>dlg.showModal();document.querySelector('.header-actions').prepend(btn);
 let hide=false;try{hide=localStorage.getItem('lsFlowHide')==='1'}catch{}if(!hide)setTimeout(()=>{if(!$('help').open)dlg.showModal()},400)})();
