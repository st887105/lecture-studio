'use strict';
// Reparent the live canvas and its existing controls, preserving capture, notes
// and camera state. Entering the workspace never opens another tab or window.
const singleView=document.createElement('section');singleView.id='singleView';singleView.hidden=true;singleView.setAttribute('aria-label','單頁講課工作區');
singleView.innerHTML='<header class="single-header"><strong>車城國小｜單頁講課</strong><div class="single-pages"><button id="singlePrev" aria-label="講課上一頁">← 上一頁</button><output id="singlePage">1 / 3</output><button id="singleNext" aria-label="講課下一頁">下一頁 →</button><button id="singlePause">暫停畫面</button></div><div class="single-actions"><button id="singleSettings" aria-expanded="false">教材／人物設定</button><button id="singleOutput">準備 Meet 輸出 ↗</button><button id="singleExit">返回準備</button></div></header><div class="single-body"><div class="single-main"><div id="singleCanvasSlot"></div><div id="singleToolsSlot"></div></div><aside id="singleDrawer" aria-label="講課教材與人物設定" hidden><h2>教材與人物設定</h2><p>設定會立即套用到同一張畫面。</p><div class="single-tabs"><button id="singleSourceTab" aria-pressed="true">教材</button><button id="singlePersonTab" aria-pressed="false">人物</button></div><div id="singleSourceSlot"></div><div id="singlePersonSlot" hidden></div></aside></div><footer class="single-footer"><span id="singleStatus" role="status"></span><span>在此畫記與看見人物；Meet 分享「乾淨輸出」分頁。</span></footer>';
singleView.setAttribute('role','dialog');singleView.setAttribute('aria-modal','true');document.body.append(singleView);
const singlePanel=canvas.closest('.preview-panel'),singleSources=document.querySelector('.workspace > .left'),singlePerson=document.querySelector('.workspace > .right');
const singleCamera=singleSources.querySelectorAll(':scope > .card')[1];
const singleMoves=[[singlePanel,$('singleCanvasSlot')],[noteHost,$('singleToolsSlot')],[singleSources,$('singleSourceSlot')],[singleCamera,$('singlePersonSlot')],[singlePerson,$('singlePersonSlot')]].map(([node,slot])=>({node,slot,marker:document.createComment('single-view return position')}));
let singleActive=false,singleScroll=0,singleReturnFocus=null;
function fitSingleCanvas(){if(!singleActive)return;const box=singlePanel.querySelector('.canvas-wrap').getBoundingClientRect(),width=Math.max(1,Math.min(box.width,box.height*1280/720));canvas.style.width=width+'px';canvas.style.height=width*720/1280+'px'}
const singleObserver=new ResizeObserver(fitSingleCanvas);singleObserver.observe($('singleCanvasSlot'));
function singleSettings(open){$('singleDrawer').hidden=!open;singleView.classList.toggle('settings-open',open);$('singleSettings').setAttribute('aria-expanded',String(open));requestAnimationFrame(fitSingleCanvas)}
function enterSingleView(){
 if(singleActive)return;singleReturnFocus=document.activeElement;singleScroll=scrollY;singleActive=true;
 for(const item of singleMoves){item.node.before(item.marker);item.slot.append(item.node)}
 singleView.hidden=false;document.body.classList.add('single-view-active');document.querySelector('body > header').inert=true;document.querySelector('body > main').inert=true;singleSettings(false);noteAPI.setTool('navigate');syncNotes();
 // Remove the optional monitor duplicate; all its tools are now beside the canvas.
 if(monitorWindow&&!monitorWindow.closed)monitorWindow.close();
 requestAnimationFrame(fitSingleCanvas);$('singlePrev').focus();updateSingleStatus();
}
function exitSingleView(){
 if(!singleActive)return;noteAPI.end();noteAPI.leave();singleActive=false;
 for(const item of singleMoves){item.marker.replaceWith(item.node)}
 canvas.style.removeProperty('width');canvas.style.removeProperty('height');singleView.hidden=true;document.body.classList.remove('single-view-active');document.querySelector('body > header').inert=false;document.querySelector('body > main').inert=false;window.scrollTo(0,singleScroll);singleReturnFocus?.focus();
}
function updateSingleStatus(){
 if(!singleActive)return;const info=window.studioInfo(),external=info.source==='screen';$('singlePage').textContent=external?'外部教材':info.page+' / '+(info.total||1);$('singlePrev').disabled=external||info.stopped;$('singleNext').disabled=external||info.stopped;$('singlePause').textContent=info.paused?'繼續畫面':'暫停畫面';
 const tool={navigate:'操作／換頁',pen:'畫筆：直接在畫面拖曳',eraser:'橡皮擦：拖曳擦除筆跡',lens:'放大鏡：移動游標放大'}[noteAPI.state.tool];
 $('singleStatus').textContent=external?tool+' ｜ 擷取是影像；操作原網站時可選用浮動工具箱。':tool+' ｜ PDF／圖片可直接換頁；Esc 取消工具。';
}
$('lectureBtn').onclick=enterSingleView;
const singleEntry=document.createElement('button');singleEntry.id='singleStart';singleEntry.className='primary';singleEntry.textContent='開始單頁講課';document.querySelector('.header-actions').prepend(singleEntry);singleEntry.onclick=enterSingleView;
$('singleExit').onclick=exitSingleView;$('singleSettings').onclick=()=>singleSettings($('singleDrawer').hidden);
$('singlePrev').onclick=()=>window.studioAction('prev');$('singleNext').onclick=()=>window.studioAction('next');$('singlePause').onclick=()=>window.studioAction('pause');$('singleOutput').onclick=()=>$('outputBtn').onclick();
function singleTab(person){$('singleSourceSlot').hidden=person;$('singlePersonSlot').hidden=!person;$('singleSourceTab').setAttribute('aria-pressed',String(!person));$('singlePersonTab').setAttribute('aria-pressed',String(person));$('singleDrawer').scrollTop=0}
$('singleSourceTab').onclick=()=>singleTab(false);$('singlePersonTab').onclick=()=>singleTab(true);
setInterval(updateSingleStatus,250);
window.singleLecture={enter:enterSingleView,exit:exitSingleView};
