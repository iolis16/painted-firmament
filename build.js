// Assembles src/ into dist/firmament.html (single self-contained page).
const fs=require('fs'),path=require('path');
const root=__dirname, src=p=>path.join(root,'src',p);
let cat=fs.readFileSync(src('catalog.js'),'utf8').replace(/if \(typeof module[^\n]*\n/,'');
let art=fs.readFileSync(src('art.js'),'utf8').replace(/module\.exports = ART;\n?/,'');
const frames=JSON.parse(fs.readFileSync(path.join(root,'tools','frames.json')));
const F={}; for(const id in frames) F[id]=[frames[id].ra0,frames[id].dec0];
const app=fs.readFileSync(src('app.js'),'utf8');
let html=fs.readFileSync(src('template.html'),'utf8');
html=html.replace('__CATALOG__',()=>cat).replace('__ART__',()=>art).replace('__FRAMES__',()=>JSON.stringify(F)).replace('__APP__',()=>app);
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.writeFileSync(path.join(root,'dist','firmament.html'),html);
console.log('built dist/firmament.html',(html.length/1024).toFixed(0),'KB');
