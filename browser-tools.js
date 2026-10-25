'use strict';
// Cross-origin iframe pixels are unavailable to a web page. Drawing works above
// the iframe; magnification is offered on the captured output instead.
const webNotes=LectureTools.create(),webInk=document.createElement('canvas');webInk.width=1280;webInk.height=720;webInk.id='webInk';webInk.setAttribute('aria-label','網站講義標註層');document.body.append(webInk);
const webInkCtx=webInk.getContext('2d'),webNoteHost=document.createElement('div');webControls.append(webNoteHost);
const syncWebNotes=LectureTools.mount(webNoteHost,webNotes,{lens:false});
LectureTools.bind(webInk,webNotes,e=>({x:e.clientX*1280/innerWidth,y:e.clientY*720/innerHeight}),syncWebNotes);
function webNoteFrame(){webInk.style.pointerEvents=webNotes.state.tool==='navigate'?'none':'auto';webInk.style.cursor='crosshair';webNotes.setKey(webFrame.src);webNotes.draw(webInkCtx);syncWebNotes();requestAnimationFrame(webNoteFrame)}webNoteFrame();
