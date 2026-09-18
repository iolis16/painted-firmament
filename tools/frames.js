const {STARS,CONSTELLATIONS}=require('../src/catalog.js');
const D=Math.PI/180;
function local(ra,dec,ra0,dec0){ // gnomonic, north up, east left, 10 units/deg
  const a=ra*15*D, d=dec*D, a0=ra0*15*D, d0=dec0*D;
  const cosc=Math.sin(d0)*Math.sin(d)+Math.cos(d0)*Math.cos(d)*Math.cos(a-a0);
  const x=Math.cos(d)*Math.sin(a-a0)/cosc, y=(Math.cos(d0)*Math.sin(d)-Math.sin(d0)*Math.cos(d)*Math.cos(a-a0))/cosc;
  return [-x/D*10, -y/D*10];
}
const out={};
for(const c of CONSTELLATIONS){
  const keys=[...new Set(c.lines.flat())].filter(k=>k.endsWith(c.id));
  const all=[...new Set([...Object.keys(STARS).filter(k=>k.endsWith(c.id)),...c.lines.flat()])];
  // center: mean of unit vectors
  let sx=0,sy=0,sz=0;for(const k of all.filter(k=>k.endsWith(c.id))){const [,ra,dec]=STARS[k];const a=ra*15*D,d=dec*D;sx+=Math.cos(d)*Math.cos(a);sy+=Math.cos(d)*Math.sin(a);sz+=Math.sin(d)}
  const ra0=Math.atan2(sy,sx)/D/15, dec0=Math.atan2(sz,Math.hypot(sx,sy))/D;
  const f={ra0:+((ra0+24)%24).toFixed(4),dec0:+dec0.toFixed(3),stars:{}};
  for(const k of all){const [n,ra,dec,m]=STARS[k];const [x,y]=local(ra,dec,f.ra0,f.dec0);f.stars[k]=[Math.round(x),Math.round(y),m]}
  out[c.id]=f;
}
require('fs').writeFileSync('frames.json',JSON.stringify(out));
for(const id of process.argv.slice(2)){const f=out[id];console.log(id,f.ra0,f.dec0);for(const k in f.stars)console.log('  ',k.padEnd(7),f.stars[k].join('\t'))}
