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
