'use strict';
// V2: local likeness, operable slides, monitoring, honest audio diagnostics.
const STUDIO_HANDLE='checheng-lecture-studio-v2';
function tagStudioCapture(){try{navigator.mediaDevices?.setCaptureHandleConfig?.({handle:STUDIO_HANDLE,exposeOrigin:true,permittedOrigins:[location.origin]})}catch{}}
tagStudioCapture();
const portrait=document.createElement('canvas');portrait.width=256;portrait.height=320;
const portraitCtx=portrait.getContext('2d',{willReadFrequently:true});let portraitTime=-Infinity;
function drawLikeness(c,x,y,w,h){
 if(cam.readyState<2)return;
 const now=performance.now();
 if(now-portraitTime>75){
  portraitTime=now;const t=portraitCtx,W=portrait.width,H=portrait.height,vw=cam.videoWidth,vh=cam.videoHeight;
  let sx=0,sy=0,sw=vw,sh=vh;const lm=state.face?.landmarks;
  if($('faceFollow').checked&&lm&&now-state.faceTime<900){
   const fw=Math.abs(lm[454].x-lm[234].x)*vw,fh=Math.abs(lm[152].y-lm[10].y)*vh;
   sw=Math.min(vw,Math.max(vw*.48,fw*2.25));sh=sw/(W/H);if(sh>vh){sh=vh;sw=sh*W/H}
   const cx=(lm[234].x+lm[454].x)*vw/2,cy=(lm[10].y+lm[152].y)*vh/2+fh*.28;
   sx=Math.max(0,Math.min(vw-sw,cx-sw/2));sy=Math.max(0,Math.min(vh-sh,cy-sh/2));
  }else{if(sw/sh>W/H){sw=sh*W/H;sx=(vw-sw)/2}else{sh=sw*H/W;sy=(vh-sh)/2}}
  t.save();t.filter='blur(0.55px) saturate(1.08)';t.drawImage(cam,sx,sy,sw,sh,0,0,W,H);t.restore();
  const im=t.getImageData(0,0,W,H),pixels=im.data,lum=new Float32Array(W*H),strength=Number($('cartoonStrength').value)/100;
  for(let i=0,j=0;i<pixels.length;i+=4,j++)lum[j]=pixels[i]*.299+pixels[i+1]*.587+pixels[i+2]*.114;
  const step=10+strength*34,blend=.35+strength*.45;
  for(let py=1;py<H-1;py++)for(let px=1;px<W-1;px++){
   const p=py*W+px,i=p*4,edge=Math.abs(lum[p+1]-lum[p-1])+Math.abs(lum[p+W]-lum[p-W]);
   const ink=edge>27?(Math.min(.45,(edge-27)/170)*strength):0;
   for(let k=0;k<3;k++){const raw=pixels[i+k],flat=Math.round(raw/step)*step;pixels[i+k]=Math.max(0,Math.min(255,(raw*(1-blend)+flat*blend)*(1-ink)))}
  }
  t.putImageData(im,0,0);
 }
 fit(c,portrait,x,y,w,h,true,$('mirror').checked);
}
const originalPresenter=presenter;
presenter=function(c,r){if(state.mode!=='avatar'||!state.camera){originalPresenter(c,r);return}const [x,y,w,h]=r;c.save();rounded(c,x,y,w,h,18,'#e8e9dd');c.clip();drawLikeness(c,x,y,w,h);if($('showName').checked&&$('name').value.trim()){const size=Math.min(20,w/13),label=$('name').value.trim();c.font=`500 ${size}px sans-serif`;rounded(c,x+10,y+h-42,Math.min(w-20,c.measureText(label).width+28),31,7,'#233b34e8');text(c,label,x+23,y+h-20,size,'#fff',500)}c.restore()};
$('cartoonStrength').oninput=()=>{portraitTime=-Infinity;$('cartoonValue').textContent=$('cartoonStrength').value+'%'};
let pdfDoc=null,pdfPage=1,pdfCanvas=null,pdfGeneration=0,pdfRenderTask=null,pdfLoadingTask=null;
const baseRender=window.renderFrame;
window.renderFrame=function(){if(state.source!=='pdf'||!pdfCanvas){baseRender();return}const source=state.source,images=state.images,page=state.page;try{state.source='images';state.images=[pdfCanvas];state.page=0;baseRender()}finally{state.source=source;state.images=images;state.page=page}};
const baseUpdatePages=updatePages;
updatePages=function(){if(state.source!=='pdf'){baseUpdatePages();return}$('sourceState').textContent='PDF 教材';$('pageNumber').textContent=`PDF ${pdfPage} / ${pdfDoc?.numPages||1}`;$('slideNav').hidden=false;status()};
const baseNavigate=navigate;
navigate=function(d){if(state.source==='pdf'){if(!pdfDoc)return;const target=Math.max(1,Math.min(pdfDoc.numPages,pdfPage+d));if(target!==pdfPage){pdfPage=target;renderPDFPage()}return}if(state.source==='screen'){toast('擷取的是影像，請在原教材分頁／視窗操作；開啟浮動監看即可看見合成畫面。');return}baseNavigate(d)};
async function renderPDFPage(){
 const doc=pdfDoc,pageNumber=pdfPage,generation=pdfGeneration;if(!doc)return;
 pdfRenderTask?.cancel();$('pdfStatus').textContent=`正在準備第 ${pageNumber} 頁…`;
 try{const page=await doc.getPage(pageNumber);if(generation!==pdfGeneration||pdfPage!==pageNumber)return;
  const v=page.getViewport({scale:1}),scale=Math.min(1600/v.width,1000/v.height),viewport=page.getViewport({scale});
  const target=document.createElement('canvas');target.width=Math.ceil(viewport.width);target.height=Math.ceil(viewport.height);
  const task=page.render({canvasContext:target.getContext('2d'),viewport});pdfRenderTask=task;await task.promise;
  if(generation!==pdfGeneration||pdfPage!==pageNumber)return;pdfCanvas=target;state.source='pdf';state.stopped=false;state.paused=false;$('pauseBtn').textContent='暫停畫面';updatePages();$('pdfStatus').textContent=`共 ${doc.numPages} 頁。點合成畫面或用左右鍵換頁。`;
 }catch(e){if(e.name!=='RenderingCancelledException'){$('pdfStatus').textContent='PDF 頁面讀取失敗，請重新匯入。';toast('PDF 頁面無法顯示：'+e.message)}}
}
$('pdfFile').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(file.size>100*1024*1024){toast('PDF 請小於 100 MB。');return}const generation=++pdfGeneration;$('pdfStatus').textContent='載入 PDF 閱讀器與教材中…';$('pdfFile').disabled=true;try{
 const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs');if(generation!==pdfGeneration)return;
 pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
 pdfLoadingTask?.destroy();const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,cMapUrl:'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',cMapPacked:true,standardFontDataUrl:'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/'});pdfLoadingTask=task;
 const doc=await task.promise;if(generation!==pdfGeneration){doc.destroy();return}releaseScreen();pdfDoc?.destroy();pdfDoc=doc;pdfPage=1;await renderPDFPage();
 }catch(err){$('pdfStatus').textContent='PDF 無法開啟，請確認檔案未加密，並檢查網路。';toast('PDF 載入失敗：'+err.message)}finally{$('pdfFile').disabled=false}};
canvas.style.cursor='pointer';canvas.title='PDF／圖片：左半邊上一頁、右半邊下一頁；外部教材請操作原分頁';
canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect();navigate(e.clientX-r.left<r.width/2?-1:1)});
window.studioAction=action=>{if(action==='prev')navigate(-1);if(action==='next')navigate(1);if(action==='pause')$('pauseBtn').onclick()};
window.studioInfo=()=>({source:state.source,page:state.source==='pdf'?pdfPage:state.page+1,total:state.source==='pdf'?pdfDoc?.numPages:state.source==='images'?state.images.length:3,paused:state.paused,stopped:state.stopped,mode:state.mode,size:Number($('size').value),position:$('position').value});
// A captured browser tab can identify itself without reading another website.
function unsafeCapture(track){const surface=track.getSettings().displaySurface;if(!surface||surface==='monitor')return '整個螢幕可能包含工作室與輸出，已阻擋以避免無限鏡射。請選教材分頁，或匯入 PDF。';if(surface==='window'&&!$('allowWindow').checked)return '預設只接受瀏覽器分頁。PowerPoint 請先匯出 PDF，或勾選「允許獨立 PowerPoint 視窗」。';const handle=track.getCaptureHandle?.();if(handle?.handle===STUDIO_HANDLE)return '選到了本站工作室／輸出分頁，已停止擷取以避免鏡射。請改選原教材分頁。';return null}
$('screenBtn').onclick=async()=>{
 if(!navigator.mediaDevices?.getDisplayMedia){toast('請使用桌面版 Chrome／Edge 擷取教材。');return}
 try{const stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:24,displaySurface:'browser'},audio:false,monitorTypeSurfaces:'exclude',selfBrowserSurface:'exclude',surfaceSwitching:'exclude'}),track=stream.getVideoTracks()[0];
  const problem=unsafeCapture(track);if(problem){stream.getTracks().forEach(t=>t.stop());toast(problem);return}
  releaseScreen();state.screen=stream;screen.srcObject=stream;await screen.play();state.source='screen';state.stopped=false;state.paused=false;$('pauseBtn').textContent='暫停畫面';$('stopScreen').hidden=false;updatePages();
  const guard=()=>{const message=unsafeCapture(track);if(message&&state.screen===stream){releaseScreen();toast(message)}};
  track.addEventListener('capturehandlechange',guard);track.addEventListener('ended',()=>{if(state.screen===stream){releaseScreen();toast('教材擷取已結束。')}});
  toast('已擷取教材。操作原網站時請開啟「浮動監看」；在 Meet 只分享「車城國小｜分享輸出」。');
 }catch(err){toast(errorMessage(err,'教材擷取'))}
};
let monitorWindow=null,monitorFrame=0;
$('floatBtn').onclick=async()=>{
 if(monitorWindow&&!monitorWindow.closed){monitorWindow.focus();return}
 if(!window.documentPictureInPicture?.requestWindow){toast('此瀏覽器不支援置頂監看。已開啟一般監看視窗，請與原教材並排。');window.open('output.html?monitor=1&v=20261025-10','_blank','popup,width=660,height=450');return}
 try{const pip=await window.documentPictureInPicture.requestWindow({width:720,height:560});monitorWindow=pip;
  const doc=pip.document;doc.title='車城國小｜浮動工具箱';const style=doc.createElement('style');style.textContent='body{margin:0;background:#172d25;color:#fff;font:12px sans-serif}canvas{width:100%;aspect-ratio:16/9;display:block;cursor:pointer}nav{display:flex;align-items:center;gap:8px;padding:10px}button{padding:7px 12px;border:0;border-radius:6px;cursor:pointer}span{flex:1;font-size:11px;color:#c3d2c7}';doc.head.append(style);
  const view=doc.createElement('canvas');view.width=1280;view.height=720;view.setAttribute('aria-label','置頂合成監看畫面');const viewBox=doc.createElement('div');viewBox.style.cssText='display:flex;align-items:center;justify-content:center;flex:1;min-height:0;overflow:hidden';doc.body.append(viewBox);viewBox.append(view);doc.body.style.cssText='display:flex;flex-direction:column;height:100dvh;overflow:hidden';const fitView=()=>{const r=viewBox.getBoundingClientRect(),w=Math.min(r.width,r.height*16/9);view.style.width=w+'px';view.style.height=w*9/16+'px'};const viewObserver=new pip.ResizeObserver(fitView);viewObserver.observe(viewBox);const nav=doc.createElement('nav');
  const prev=doc.createElement('button');prev.textContent='← 上一頁';prev.onclick=()=>navigate(-1);const next=doc.createElement('button');next.textContent='下一頁 →';next.onclick=()=>navigate(1);const label=doc.createElement('span');label.textContent='操作原教材時，這個視窗會保持置頂。';nav.append(prev,label,next);doc.body.append(nav);
  const hint=doc.createElement('p');hint.style.cssText='padding:0 10px;font-size:10px;color:#c3d2c7';hint.textContent='本機合成監看；不是 Meet 學員端回傳。請在 Meet 分享乾淨輸出分頁。';doc.body.append(hint);let syncPipTools=()=>{};if(window.LectureTools&&window.annotationAPI){const css=doc.createElement('link');css.rel='stylesheet';css.href=new URL('teaching-tools.css?v=20261030-11',location.href).href;doc.head.append(css);const tools=doc.createElement('div');doc.body.insertBefore(tools,nav);syncPipTools=LectureTools.mount(tools,window.annotationAPI);LectureTools.bind(view,window.annotationAPI,e=>{const r=view.getBoundingClientRect();return{x:(e.clientX-r.left)*1280/r.width,y:(e.clientY-r.top)*720/r.height}},syncPipTools);hint.textContent='直接在上方畫面標註或放大；Esc 取消工具。Meet 請分享乾淨輸出。'}
  view.onclick=e=>{const r=view.getBoundingClientRect();navigate(e.clientX-r.left<r.width/2?-1:1)};doc.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();navigate(-1)}if(e.key==='ArrowRight'){e.preventDefault();navigate(1)}});
  const g=view.getContext('2d');function tick(){if(pip.closed)return;window.renderFrame();syncPipTools();g.drawImage(canvas,0,0);monitorFrame=pip.requestAnimationFrame(tick)}tick();pip.addEventListener('pagehide',()=>{pip.cancelAnimationFrame(monitorFrame);viewObserver.disconnect();monitorWindow=null});
 }catch(err){toast('浮動監看未能開啟：'+err.message)}
};
$('lectureBtn').onclick=()=>{$('outputBtn').onclick();toast('在輸出頁按「全螢幕」或 F。PDF／圖片可直接點擊或用左右鍵換頁。')};
// Audio is a local diagnostic only; the Meet microphone remains the sender.
let micStream=null,micContext=null,micAnalyser=null,micFrame=0,micRecorder=null,micTimer=null,micURL=null,micEpoch=0,recordChunks=[],micHadSignal=false,micRecordReady=false;
function resetReceiver(){$('receivedAudio').checked=false;$('receiverStatus').textContent='遠端接收：尚未人工確認'}
function stopMic(){micEpoch++;clearTimeout(micTimer);if(micRecorder?.state==='recording'){micRecorder.onstop=null;micRecorder.stop()}micRecorder=null;recordChunks=[];cancelAnimationFrame(micFrame);micStream?.getTracks().forEach(t=>t.stop());micStream=null;micContext?.close().catch(()=>{});micContext=null;micAnalyser=null;$('micMeter').value=0;$('recordBtn').disabled=true;$('micStop').disabled=true;$('micBtn').disabled=false;$('micBadge').textContent='已停止';$('micStatus').textContent='本機收音測試已停止；Meet 收音由 Meet 控制。'}
$('micBtn').onclick=async()=>{stopMic();resetReceiver();$('micPlayback').pause();$('micPlayback').hidden=true;$('micBtn').disabled=true;const epoch=micEpoch;try{const device=$('micSelect').value,stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,...(device?{deviceId:{exact:device}}:{})},video:false});if(epoch!==micEpoch){stream.getTracks().forEach(t=>t.stop());return}micStream=stream;micHadSignal=false;micRecordReady=false;const AC=window.AudioContext||window.webkitAudioContext;micContext=new AC();await micContext.resume();micAnalyser=micContext.createAnalyser();micAnalyser.fftSize=2048;micContext.createMediaStreamSource(stream).connect(micAnalyser);const samples=new Float32Array(micAnalyser.fftSize);$('micBadge').textContent='本機測試中';$('recordBtn').disabled=!window.MediaRecorder;$('micStop').disabled=false;
  const selected=stream.getAudioTracks()[0].getSettings().deviceId,devices=await navigator.mediaDevices.enumerateDevices();$('micSelect').replaceChildren(new Option('系統預設麥克風',''));for(const d of devices.filter(d=>d.kind==='audioinput'))$('micSelect').add(new Option(d.label||'麥克風',d.deviceId));if(selected)$('micSelect').value=selected;
  function meter(){if(!micAnalyser)return;micAnalyser.getFloatTimeDomainData(samples);let sum=0;for(const value of samples)sum+=value*value;const rms=Math.sqrt(sum/samples.length);$('micMeter').value=Math.min(1,rms*5);if(rms>.012)micHadSignal=true;if(micRecorder?.state!=='recording'&&!micRecordReady)$('micStatus').textContent=micHadSignal?'本機已偵測到聲音。可試錄回放；Meet 是否送達仍需第二裝置確認。':'請對麥克風說話；目前尚未偵測到明顯聲音。';micFrame=requestAnimationFrame(meter)}meter();stream.getAudioTracks()[0].addEventListener('ended',()=>{if(micStream===stream)stopMic()});
 }catch(err){stopMic();$('micStatus').textContent=errorMessage(err,'麥克風');toast($('micStatus').textContent)}};
$('recordBtn').onclick=()=>{if(!micStream||!window.MediaRecorder)return;$('micPlayback').pause();$('micPlayback').hidden=true;recordChunks=[];micRecordReady=false;const epoch=micEpoch;try{const recorder=new MediaRecorder(micStream);micRecorder=recorder;$('recordBtn').disabled=true;recorder.ondataavailable=e=>{if(e.data.size)recordChunks.push(e.data)};recorder.onstop=()=>{if(epoch!==micEpoch)return;if(micURL)URL.revokeObjectURL(micURL);micURL=URL.createObjectURL(new Blob(recordChunks,{type:recorder.mimeType}));$('micPlayback').src=micURL;$('micPlayback').hidden=false;$('recordBtn').disabled=false;$('micStatus').textContent='3 秒試錄完成。請按播放，確認能聽到自己的聲音；這是本機回放。';micRecordReady=true;micRecorder=null};recorder.onerror=()=>{toast('試錄失敗，請停止後重試。');$('recordBtn').disabled=false};recorder.start();$('micStatus').textContent='錄製 3 秒中，請說話…';micTimer=setTimeout(()=>{if(recorder.state==='recording')recorder.stop()},3000)}catch(e){$('recordBtn').disabled=false;toast('此瀏覽器無法試錄：'+e.message)}};
$('micStop').onclick=stopMic;$('micSelect').onchange=()=>{stopMic();resetReceiver();$('micStatus').textContent='裝置已變更，請重新開啟收音測試，並在 Meet 選同一支麥克風。'};
$('receivedAudio').onchange=()=>$('receiverStatus').textContent=$('receivedAudio').checked?'遠端接收：您已人工確認聽到（非本站自動偵測）':'遠端接收：尚未人工確認';
const baseStopAll=$('stopAll').onclick;$('stopAll').onclick=()=>{stopMic();$('micPlayback').pause();monitorWindow?.close();baseStopAll()};
window.addEventListener('beforeunload',()=>{micStream?.getTracks().forEach(t=>t.stop());if(micURL)URL.revokeObjectURL(micURL);monitorWindow?.close()});

window.renderPresenterForBrowser=(c,w,h)=>presenter(c,[0,0,w,h]);
$('interactiveBtn').onclick=()=>{const raw=$('interactiveURL').value.trim();try{const url=new URL(raw);if(url.protocol!=='https:')throw Error('請貼上 https:// 開頭的教材網址。');const dir=new URL('./',location.href);if(url.origin===dir.origin&&[dir.pathname,dir.pathname+'index.html',dir.pathname+'output.html',dir.pathname+'browser.html'].includes(url.pathname))throw Error('請輸入原教材網址，不可嵌入本站。');const win=window.open('browser.html?v=20261025-10#'+encodeURIComponent(url.href),'_blank');if(!win)toast('請允許此網站開啟彈出式視窗。');else toast('在互動網站分頁操作並分享該分頁；若原網站拒絕嵌入，請改用原分頁擷取＋浮動監看。')}catch(e){toast(e.message)}};
