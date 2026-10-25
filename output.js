'use strict';
const canvas=document.getElementById('output'),context=canvas.getContext('2d');
function frame(){try{if(!window.opener||window.opener.closed||typeof window.opener.renderFrame!=='function')throw Error('Disconnected');window.opener.renderFrame();context.drawImage(window.opener.document.getElementById('stage'),0,0);document.getElementById('error').style.display='none';canvas.style.display='block'}catch{context.fillStyle='#14241e';context.fillRect(0,0,1280,720);canvas.style.display='none';document.getElementById('error').style.display='block'}requestAnimationFrame(frame)}frame();
