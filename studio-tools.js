'use strict';
const noteAPI=LectureTools.create(),noteLayer=document.createElement('canvas'),noteBase=document.createElement('canvas'),noteLens=document.createElement('canvas');
for(const layer of [noteLayer,noteBase,noteLens]){layer.width=1280;layer.height=720}
const noteCtx=noteLayer.getContext('2d'),baseNoteCtx=noteBase.getContext('2d'),lensNoteCtx=noteLens.getContext('2d');
window.annotationAPI=noteAPI;
const noteHost=document.createElement('nav');canvas.closest('.preview-panel').after(noteHost);const syncNotes=LectureTools.mount(noteHost,noteAPI);
LectureTools.bind(canvas,noteAPI,e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*1280/r.width,y:(e.clientY-r.top)*720/r.height}},syncNotes);
const beforeNotes=window.renderFrame;let noteHasBase=false,lastNoteSource=null;
window.renderFrame=function(){
 const i=window.studioInfo(),content=state.source==='pdf'?pdfDoc:state.source==='screen'?state.screen:state.images;if(lastNoteSource!==content){noteAPI.state.pages.clear();lastNoteSource=content}
 noteAPI.setKey(i.source+':'+i.page);
 if(!state.paused||!noteHasBase){beforeNotes();baseNoteCtx.clearRect(0,0,1280,720);baseNoteCtx.drawImage(canvas,0,0);noteHasBase=true}
 ctx.drawImage(noteBase,0,0);if(state.stopped)return;noteAPI.draw(noteCtx);ctx.drawImage(noteLayer,0,0);
 if(noteAPI.state.tool==='lens'&&noteAPI.state.lens){lensNoteCtx.drawImage(canvas,0,0);noteAPI.magnify(ctx,noteLens)}
 syncNotes();canvas.style.cursor=noteAPI.state.tool==='navigate'?'pointer':noteAPI.state.tool==='lens'?'zoom-in':'crosshair';
};
