'use strict';
// Keep the 1280 × 720 logical layout, render at native 1080p without stretching.
canvas.width=1920;canvas.height=1080;ctx.setTransform(1.5,0,0,1.5,0,0);
document.querySelector('.resolution').textContent='1920 × 1080 · Full HD';
