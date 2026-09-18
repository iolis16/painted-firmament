// usage: node preview.js Ori  -> renders preview_Ori.png of stars + ART[Ori]
const fs=require('fs'),{execSync}=require('child_process');
const frames=JSON.parse(fs.readFileSync('frames.json'));
const ART=require('../src/art.js');
const id=process.argv[2]; const f=frames[id]; const art={svg:ART[id]||""};
let xs=[],ys=[];for(const k in f.stars){xs.push(f.stars[k][0]);ys.push(f.stars[k][1])}
const pad=60,minx=Math.min(...xs)-pad,maxx=Math.max(...xs)+pad,miny=Math.min(...ys)-pad,maxy=Math.max(...ys)+pad;
const W=maxx-minx,H=maxy-miny;
let dots='';for(const k in f.stars){const [x,y,m]=f.stars[k];const r=Math.max(1.5,6-m);dots+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#ffe9b0"/><text x="${x+6}" y="${y-4}" font-size="9" fill="#8fd">${k}</text>`}
const html=`<html><body style="margin:0;background:#101a33"><svg xmlns="http://www.w3.org/2000/svg" width="${W*2}" height="${H*2}" viewBox="${minx} ${miny} ${W} ${H}">
<style>${fs.readFileSync('artstyle.css')}</style>${fs.readFileSync('artdefs.svg')}
<g class="art">${art.svg}</g><g>${dots}</g></svg></body></html>`;
fs.writeFileSync(`pv_${id}.html`,html);
execSync(`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --window-size=${Math.round(W*2)},${Math.round(H*2)} --screenshot=pv_${id}.png file://${process.cwd()}/pv_${id}.html 2>/dev/null`);
console.log('ok',W,H);
