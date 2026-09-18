(function(){
'use strict';
const D=Math.PI/180, RD=180/Math.PI;
const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- catalog preparation ---------- */
const CONS=CONSTELLATIONS.map(c=>({...c,stars:[],lines:[],cx:0,cy:0,alt:0,az:0,visible:false,nProj:0}));
const conById={}; CONS.forEach(c=>conById[c.id]=c);
const stars=Object.keys(STARS).map(k=>{
  const s=STARS[k], ra=s[1]*15*D, dec=s[2]*D;
  const con=CONS.find(c=>k.endsWith(c.id));
  const st={key:k,name:s[0],raH:s[1],dec:s[2],mag:s[3],dist:s[4],tint:s[5],con,
    eq:[Math.cos(dec)*Math.cos(ra),Math.cos(dec)*Math.sin(ra),Math.sin(dec)],
    h:[0,0,0],p:null,phase:Math.random()*6.283};
  if(con) con.stars.push(st);
  return st;
});
const starByKey={}; stars.forEach(s=>starByKey[s.key]=s);
CONS.forEach(c=>{
  c.lines=CONSTELLATIONS.find(x=>x.id===c.id).lines.map(([a,b])=>[starByKey[a],starByKey[b]]);
  c.stars.sort((a,b)=>a.mag-b.mag);
  const f=FRAMES[c.id]; c.local={};
  if(f){ c.stars.forEach(s=>{c.local[s.key]=gnomonic(s.raH,s.dec,f[0],f[1]);}); }
});
const starsByMag=stars.slice().sort((a,b)=>b.mag-a.mag);
function gnomonic(ra,dec,ra0,dec0){
  const a=ra*15*D,d=dec*D,a0=ra0*15*D,d0=dec0*D;
  const cosc=Math.sin(d0)*Math.sin(d)+Math.cos(d0)*Math.cos(d)*Math.cos(a-a0);
  const x=Math.cos(d)*Math.sin(a-a0)/cosc, y=(Math.cos(d0)*Math.sin(d)-Math.sin(d0)*Math.cos(d)*Math.cos(a-a0))/cosc;
  return [-x*RD*10,-y*RD*10];
}
const GREEK={a:'α',b:'β',g:'γ',d:'δ',e:'ε',z:'ζ',h:'η',q:'θ',i:'ι',k:'κ',l:'λ',m:'μ',n:'ν',x:'ξ',o:'ο',p:'π',r:'ρ',s:'σ',t:'τ',u:'υ',f:'φ',c:'χ',y:'ψ',w:'ω'};
const SUP={1:'¹',2:'²',3:'³',4:'⁴',5:'⁵',6:'⁶'};
function bayer(st){
  const stem=st.key.slice(0,st.key.length-st.con.id.length);
  if(/^[0-9]+$/.test(stem)) return stem;
  if(stem==='qq') return 'q';
  if(/^[A-Z]$/.test(stem)) return stem;
  return (GREEK[stem[0]]||stem[0])+(stem[1]?SUP[stem[1]]||'':'');
}

/* ---------- Milky Way samples (galactic equator) ---------- */
const MW=(()=>{
  const P=radec(192.8595,27.1284), C0=radec(266.4050,-28.9362);
  const Q=cross(P,C0); const out=[];
  let seed=11; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let l=0;l<360;l+=3){
    const r=l*D; const v=[Math.cos(r)*C0[0]+Math.sin(r)*Q[0],Math.cos(r)*C0[1]+Math.sin(r)*Q[1],Math.cos(r)*C0[2]+Math.sin(r)*Q[2]];
    const bulge=Math.max(0,Math.cos(r));
    out.push({eq:v,w:(0.11+0.07*bulge)*(0.8+0.5*rnd()),a:(0.028+0.03*bulge)*(0.7+0.6*rnd()),j:[(rnd()-0.5)*0.05,(rnd()-0.5)*0.05],h:[0,0,0]});
  }
  return out;
})();
function radec(ra,dec){const a=ra*D,d=dec*D;return [Math.cos(d)*Math.cos(a),Math.cos(d)*Math.sin(a),Math.sin(d)];}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function norm(a){const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];}
function slerp(a,b,t){let d=Math.max(-1,Math.min(1,dot(a,b)));const th=Math.acos(d);if(th<1e-5)return b;const s=Math.sin(th);const wa=Math.sin((1-t)*th)/s,wb=Math.sin(t*th)/s;return [a[0]*wa+b[0]*wb,a[1]*wa+b[1]*wb,a[2]*wa+b[2]*wb];}
const ATMOS=(()=>{let seed=5;const rnd=()=>{seed=(seed*48271)%2147483647;return seed/2147483647;};const o=[];for(let i=0;i<16;i++){const az=rnd()*360,alt=rnd()*70+5;const r=alt*D,a=az*D;o.push({h:[Math.cos(r)*Math.sin(a),Math.cos(r)*Math.cos(a),Math.sin(r)],w:0.25+rnd()*0.4,c:rnd()<0.5?'86,110,200':'150,110,190',a:0.05+rnd()*0.05});}return o;})();

/* ---------- observer & time ---------- */
const CITIES=[["London",51.51,-0.13,"Europe/London"],["Paris",48.86,2.35,"Europe/Paris"],["Berlin",52.52,13.41,"Europe/Berlin"],["Rome",41.9,12.5,"Europe/Rome"],["Madrid",40.42,-3.7,"Europe/Madrid"],["Athens",37.98,23.73,"Europe/Athens"],["Istanbul",41.01,28.98,"Europe/Istanbul"],["Cairo",30.04,31.24,"Africa/Cairo"],["Nairobi",-1.29,36.82,"Africa/Nairobi"],["Cape Town",-33.93,18.42,"Africa/Johannesburg"],["Lagos",6.52,3.38,"Africa/Lagos"],["Moscow",55.76,37.62,"Europe/Moscow"],["Dubai",25.2,55.27,"Asia/Dubai"],["Mumbai",19.08,72.88,"Asia/Kolkata"],["Delhi",28.61,77.21,"Asia/Kolkata"],["Singapore",1.35,103.82,"Asia/Singapore"],["Hong Kong",22.32,114.17,"Asia/Hong_Kong"],["Beijing",39.9,116.4,"Asia/Shanghai"],["Tokyo",35.68,139.69,"Asia/Tokyo"],["Seoul",37.57,126.98,"Asia/Seoul"],["Sydney",-33.87,151.21,"Australia/Sydney"],["Melbourne",-37.81,144.96,"Australia/Melbourne"],["Auckland",-36.85,174.76,"Pacific/Auckland"],["Honolulu",21.31,-157.86,"Pacific/Honolulu"],["Anchorage",61.22,-149.9,"America/Anchorage"],["Vancouver",49.28,-123.12,"America/Vancouver"],["Seattle",47.61,-122.33,"America/Los_Angeles"],["San Francisco",37.77,-122.42,"America/Los_Angeles"],["Los Angeles",34.05,-118.24,"America/Los_Angeles"],["Denver",39.74,-104.99,"America/Denver"],["Chicago",41.88,-87.63,"America/Chicago"],["Toronto",43.65,-79.38,"America/Toronto"],["New York",40.71,-74.01,"America/New_York"],["Miami",25.76,-80.19,"America/New_York"],["Mexico City",19.43,-99.13,"America/Mexico_City"],["Bogotá",4.71,-74.07,"America/Bogota"],["Lima",-12.05,-77.04,"America/Lima"],["São Paulo",-23.55,-46.63,"America/Sao_Paulo"],["Buenos Aires",-34.6,-58.38,"America/Argentina/Buenos_Aires"],["Santiago",-33.45,-70.67,"America/Santiago"],["Reykjavík",64.15,-21.94,"Atlantic/Reykjavik"]];
const TZ_GUESS={"America/Los_Angeles":"Los Angeles","America/Denver":"Denver","America/Chicago":"Chicago","America/New_York":"New York","America/Toronto":"Toronto","America/Vancouver":"Vancouver","America/Anchorage":"Anchorage","Pacific/Honolulu":"Honolulu","America/Mexico_City":"Mexico City","America/Sao_Paulo":"São Paulo","America/Argentina/Buenos_Aires":"Buenos Aires","America/Santiago":"Santiago","America/Bogota":"Bogotá","America/Lima":"Lima","Europe/London":"London","Europe/Paris":"Paris","Europe/Berlin":"Berlin","Europe/Rome":"Rome","Europe/Madrid":"Madrid","Europe/Athens":"Athens","Europe/Istanbul":"Istanbul","Europe/Moscow":"Moscow","Africa/Cairo":"Cairo","Africa/Nairobi":"Nairobi","Africa/Johannesburg":"Cape Town","Africa/Lagos":"Lagos","Asia/Dubai":"Dubai","Asia/Kolkata":"Delhi","Asia/Singapore":"Singapore","Asia/Hong_Kong":"Hong Kong","Asia/Shanghai":"Beijing","Asia/Tokyo":"Tokyo","Asia/Seoul":"Seoul","Australia/Sydney":"Sydney","Australia/Melbourne":"Melbourne","Pacific/Auckland":"Auckland","Atlantic/Reykjavik":"Reykjavík"};
const obs={lat:51.51,lon:-0.13,label:"London",known:false,tz:null};
let tOffset=0;
const nowDate=()=>new Date(Date.now()+tOffset*3600e3);
function sunEq(date){const n=date.getTime()/86400000+2440587.5-2451545;const L=(280.46+0.9856474*n)*D,g=(357.528+0.9856003*n)*D;const lam=L+(1.915*Math.sin(g)+0.02*Math.sin(2*g))*D;const eps=(23.439-0.0000004*n)*D;return norm([Math.cos(lam),Math.cos(eps)*Math.sin(lam),Math.sin(eps)*Math.sin(lam)]);}
const sunH=[0,0,0];
function sunAlt(date){return Math.asin(Math.max(-1,Math.min(1,sunH[2])))*RD;}
function gmst(date){const jd=date.getTime()/86400000+2440587.5;const T=(jd-2451545)/36525;const g=280.46061837+360.98564736629*(jd-2451545)+0.000387933*T*T;return ((g%360)+360)%360;}

/* ---------- view state ---------- */
const canvas=$('sky'), ctx=canvas.getContext('2d');
const overlay=$('overlay'), artroot=$('artroot');
let W=0,H=0,DPR=1;
const view={c:[0,0,1],up:[0,1,0],right:[-1,0,0],scale:200,spin:0,mode:'dome'};
let scaleDome=200, cx=0, cy=0;
let anim=null, hovered=null, selected=null, mythic=false;
let lineFade=1; // 1 = scientific lines fully drawn for selection
const figs={}; // constellation id -> {g, inner}
const horizonPts=[];
const clipPath=document.createElementNS('http://www.w3.org/2000/svg','clipPath'); clipPath.id='skyclip';
const clipPathEl=document.createElementNS('http://www.w3.org/2000/svg','path'); clipPath.appendChild(clipPathEl);
overlay.querySelector('defs').appendChild(clipPath); artroot.setAttribute('clip-path','url(#skyclip)');

function resize(){
  DPR=Math.min(2,window.devicePixelRatio||1);
  W=canvas.clientWidth; H=canvas.clientHeight;
  canvas.width=Math.round(W*DPR); canvas.height=Math.round(H*DPR);
  overlay.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const small=Math.min(W,H);
  scaleDome=(W<760? small*0.46 : small*0.47)/2;
  cx=W/2; cy=W<760? H*0.42 : H/2;
  if(view.mode==='dome') view.scale=scaleDome;
}
window.addEventListener('resize',resize);

function setBasis(c,upHint){
  const z=[0,0,1]; let up=[z[0]-dot(z,c)*c[0],z[1]-dot(z,c)*c[1],z[2]-dot(z,c)*c[2]];
  if(Math.hypot(up[0],up[1],up[2])<1e-3) up=[0,1,0];
  up=norm(up);
  if(upHint){ // remove component along c and normalize
    let u=[upHint[0]-dot(upHint,c)*c[0],upHint[1]-dot(upHint,c)*c[1],upHint[2]-dot(upHint,c)*c[2]];
    if(Math.hypot(u[0],u[1],u[2])>1e-3) up=norm(u);
  }
  view.c=c; view.up=up; view.right=norm(cross(c,up));
}
function rotAbout(v,axis,ang){const c=Math.cos(ang),s=Math.sin(ang);const k=axis;const kv=cross(k,v);const kd=dot(k,v);return [v[0]*c+kv[0]*s+k[0]*kd*(1-c),v[1]*c+kv[1]*s+k[1]*kd*(1-c),v[2]*c+kv[2]*s+k[2]*kd*(1-c)];}
function domeUp(){return rotAbout([0,1,0],[0,0,1],view.spin);}

function project(v){
  const d=dot(v,view.c); if(d<-0.75) return null;
  const k=2/(1+d);
  return [cx+view.scale*k*dot(v,view.right), cy-view.scale*k*dot(v,view.up), d];
}
function unproject(X,Y){
  const x=(X-cx)/view.scale, y=(cy-Y)/view.scale; const rho=Math.hypot(x,y);
  const th=2*Math.atan(rho/2); if(rho<1e-9) return view.c.slice();
  const ct=Math.cos(th), st=Math.sin(th), ux=x/rho, uy=y/rho;
  return norm([ct*view.c[0]+st*(ux*view.right[0]+uy*view.up[0]),ct*view.c[1]+st*(ux*view.right[1]+uy*view.up[1]),ct*view.c[2]+st*(ux*view.right[2]+uy*view.up[2])]);
}

/* ---------- per-frame sky computation ---------- */
function computeSky(date){
  const lst=(gmst(date)+obs.lon)*D, sinL=Math.sin(lst), cosL=Math.cos(lst);
  const la=obs.lat*D, sinLat=Math.sin(la), cosLat=Math.cos(la);
  const toH=(eq,h)=>{const x1=eq[0]*cosL+eq[1]*sinL, y1=-eq[0]*sinL+eq[1]*cosL, z1=eq[2];h[0]=y1;h[1]=z1*cosLat-x1*sinLat;h[2]=z1*sinLat+x1*cosLat;};
  for(const s of stars){ toH(s.eq,s.h); s.p=s.h[2]>-0.02?project(s.h):null; }
  for(const m of MW) toH(m.eq,m.h);
  toH(sunEq(date),sunH);
  for(const c of CONS){
    let sx=0,sy=0,sz=0,n=0,up=0; let px=0,py=0,np=0;
    for(const s of c.stars){sx+=s.h[0];sy+=s.h[1];sz+=s.h[2];n++; if(s.h[2]>0)up++; if(s.p&&s.p[2]>0.1){px+=s.p[0];py+=s.p[1];np++;}}
    const v=norm([sx,sy,sz]); c.alt=Math.asin(Math.max(-1,Math.min(1,v[2])))*RD; c.az=((Math.atan2(v[0],v[1])*RD)+360)%360; c.h=v;
    c.visible=v[2]>0&&up>=Math.max(1,n/2);
    c.nProj=np; c.cx=np?px/np:0; c.cy=np?py/np:0;
  }
  horizonPts.length=0;
  for(let a=0;a<360;a+=2){const r=a*D;const p=project([Math.sin(r),Math.cos(r),0]);if(p)horizonPts.push(p);}
}

/* ---------- painting ---------- */
const TINT={r:'255,205,150',b:'200,220,255',y:'255,240,200',w:'255,252,245'};
function paint(t){
  const g=ctx; g.setTransform(DPR,0,0,DPR,0,0);
  g.fillStyle='#070a19'; g.fillRect(0,0,W,H);
  const zen=project([0,0,1]);
  // sky clip
  g.save();
  const hp=new Path2D(); horizonPts.forEach((p,i)=>i?hp.lineTo(p[0],p[1]):hp.moveTo(p[0],p[1])); hp.closePath();
  g.clip(hp);
  let gcx=cx,gcy=cy; if(zen){gcx=zen[0];gcy=zen[1];}
  let rad=0; for(const p of horizonPts) rad=Math.max(rad,Math.hypot(p[0]-gcx,p[1]-gcy)); rad=Math.min(rad,Math.max(W,H)*6)||scaleDome*2;
  const grad=g.createRadialGradient(gcx,gcy,0,gcx,gcy,rad);
  grad.addColorStop(0,'#0b1236');grad.addColorStop(0.5,'#141d4d');grad.addColorStop(0.82,'#2a2e62');grad.addColorStop(1,'#4b3f66');
  g.fillStyle=grad; g.fillRect(-W,-H,W*3,H*3);
  // twilight glow toward the Sun
  { const sa=sunAlt(); if(sa>-20){ const dir=norm([sunH[0],sunH[1],0]); const p=project([dir[0]*0.995,dir[1]*0.995,0.08]); if(p&&p[2]>-0.3){ const k=2/(1+p[2]); const r=view.scale*1.1*k; const a=Math.min(1,(sa+20)/22); const gr=g.createRadialGradient(p[0],p[1],0,p[0],p[1],r); gr.addColorStop(0,`rgba(230,150,110,${0.34*a})`); gr.addColorStop(0.45,`rgba(150,110,150,${0.16*a})`); gr.addColorStop(1,'rgba(120,90,140,0)'); g.fillStyle=gr; g.fillRect(p[0]-r,p[1]-r,2*r,2*r); } } }
  // atmosphere blobs
  for(const b of ATMOS){const p=project(b.h);if(!p)continue;const r=view.scale*b.w*(2/(1+p[2]));const gr=g.createRadialGradient(p[0],p[1],0,p[0],p[1],r);gr.addColorStop(0,`rgba(${b.c},${b.a})`);gr.addColorStop(1,`rgba(${b.c},0)`);g.fillStyle=gr;g.fillRect(p[0]-r,p[1]-r,2*r,2*r);}
  // Milky Way
  g.globalCompositeOperation='lighter';
  for(const m of MW){if(m.h[2]<-0.15)continue;const p=project(m.h);if(!p||p[2]<-0.2)continue;const k=2/(1+p[2]);const r=view.scale*m.w*k;const x=p[0]+m.j[0]*view.scale*k,y=p[1]+m.j[1]*view.scale*k;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(214,214,240,${m.a})`);gr.addColorStop(0.5,`rgba(200,196,230,${m.a*0.45})`);gr.addColorStop(1,'rgba(200,196,230,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,2*r,2*r);}
  g.globalCompositeOperation='source-over';
  // constellation lines
  const zf=Math.min(2.4,Math.max(1,Math.pow(view.scale/scaleDome,0.35)));
  g.lineCap='round'; g.lineJoin='round';
  for(const c of CONS){
    let a=0.2; let w=1;
    if(c===hovered&&c!==selected){a=0.55;w=1.3;}
    if(c===selected){a=0.2+0.7*lineFade;w=1.5;}
    else if(mythic&&view.mode!=='dome'){a*=0.5;}
    if(a<0.02)continue;
    g.strokeStyle=`rgba(233,214,168,${a})`; g.lineWidth=w*Math.min(zf,1.4);
    g.beginPath();
    for(const [s1,s2] of c.lines){ if(!s1.p||!s2.p||s1.p[2]<-0.3||s2.p[2]<-0.3) continue; g.moveTo(s1.p[0],s1.p[1]); g.lineTo(s2.p[0],s2.p[1]); }
    g.stroke();
  }
  // stars
  const tw=reduced?0:t/1000;
  for(const s of starsByMag){
    const p=s.p; if(!p||p[2]<-0.3) continue;
    const k=2/(1+p[2]); const sizeK=Math.min(1.6,Math.sqrt(k/2)+0.3);
    let r=Math.max(0.55,4.6-0.72*s.mag)*zf*0.85*sizeK;
    let alpha=1; if(s.mag<3.6&&tw){alpha=1-0.16*(0.5+0.5*Math.sin(tw*2.3+s.phase));}
    const col=TINT[s.tint]||TINT.w;
    const sel=selected&&s.con===selected;
    if(sel&&mythic){ const gr=view.scale/scaleDome; const R=r*(5.5+2*Math.min(1,gr/4))*(1-lineFade*0.5); const gg=g.createRadialGradient(p[0],p[1],0,p[0],p[1],R); gg.addColorStop(0,`rgba(255,218,140,${0.55*(1-lineFade*0.6)})`); gg.addColorStop(0.35,`rgba(240,196,110,${0.22*(1-lineFade*0.6)})`); gg.addColorStop(1,'rgba(240,196,110,0)'); g.fillStyle=gg; g.beginPath(); g.arc(p[0],p[1],R,0,6.2832); g.fill(); }
    if(s.mag<2.4||(sel&&s.mag<4.2)){ const R=r*(sel?4.5:3.6); const gg=g.createRadialGradient(p[0],p[1],0,p[0],p[1],R); gg.addColorStop(0,`rgba(${col},${0.32*alpha})`); gg.addColorStop(1,`rgba(${col},0)`); g.fillStyle=gg; g.beginPath(); g.arc(p[0],p[1],R,0,6.2832); g.fill(); }
    g.fillStyle=`rgba(${col},${alpha})`; g.beginPath(); g.arc(p[0],p[1],r,0,6.2832); g.fill();
  }
  // constellation labels
  g.textAlign='center'; g.textBaseline='middle';
  const placed=[];
  for(const c of CONS.slice().sort((a,b)=>b.stars.length-a.stars.length)){
    if(c.nProj<2||!c.visible) continue;
    let a=view.mode==='dome'?0.5:0.4; if(c===hovered)a=0.9; if(c===selected)a=view.mode==='con'?0.0:0.85;
    if(mythic&&c!==selected&&view.mode==='dome')a*=0.7;
    if(a<=0)continue;
    const fs=Math.min(19,12.5*zf);
    g.font=`italic 500 ${fs}px "Cormorant Garamond",Garamond,serif`;
    g.fillStyle=`rgba(233,214,168,${a})`; g.fillText(c.name.toUpperCase().split('').join(' '),c.cx,c.cy);
  }
  // star names for the selected constellation in scientific view
  if(selected&&lineFade>0.05&&view.mode!=='dome'){
    g.font=`500 ${Math.min(15,11*zf)}px "Cormorant Garamond",Garamond,serif`; g.textAlign='left';
    for(const s of selected.stars){ if(!s.p||s.p[2]<0||s.mag>4.6)continue; const nm=/ [A-Z]/.test(s.name)&&!/^[A-Z]/.test(s.name)? bayer(s):s.name; const x=s.p[0]+7,y=s.p[1]-7; g.lineWidth=3; g.strokeStyle=`rgba(7,10,25,${0.7*lineFade})`; g.strokeText(nm,x,y); g.fillStyle=`rgba(239,228,201,${0.85*lineFade})`; g.fillText(nm,x,y); }
  }
  g.restore();
  // horizon ring & cardinal points
  g.strokeStyle='rgba(240,196,110,.32)'; g.lineWidth=1.2; g.stroke(hp);
  g.font=`600 ${Math.max(11,Math.min(15,scaleDome*0.09))}px "Cormorant Garamond",Garamond,serif`; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='rgba(233,214,168,.7)';
  [['N',0],['E',90],['S',180],['W',270]].forEach(([l,az])=>{const r=az*D,a=-5*D;const p=project([Math.cos(a)*Math.sin(r),Math.cos(a)*Math.cos(r),Math.sin(a)]);if(p&&p[2]>-0.2)g.fillText(l,p[0],p[1]);});
  // SVG clip path
  clipPathEl.setAttribute('d',horizonPts.length?('M'+horizonPts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L')+'Z'):'');
}

/* ---------- mythic figures (SVG) ---------- */
function ensureFig(c){
  if(figs[c.id]) return figs[c.id]; if(!ART[c.id]) return null;
  const g=document.createElementNS('http://www.w3.org/2000/svg','g'); g.setAttribute('class','fig'); g.style.opacity='0';
  const inner=document.createElementNS('http://www.w3.org/2000/svg','g'); inner.innerHTML=ART[c.id]; g.appendChild(inner); artroot.appendChild(g);
  return figs[c.id]={g,inner,shown:0};
}
function fitFigure(c){ // similarity transform local -> screen, least squares over projected stars
  let n=0,ax=0,ay=0,bx=0,by=0; const pts=[];
  for(const s of c.stars){ const l=c.local[s.key]; if(!l||!s.p||s.p[2]<0.2) continue; pts.push([l[0],l[1],s.p[0],s.p[1]]); ax+=l[0];ay+=l[1];bx+=s.p[0];by+=s.p[1];n++; }
  if(n<2) return null;
  ax/=n;ay/=n;bx/=n;by/=n; let re=0,im=0,den=0;
  for(const [lx,ly,px,py] of pts){const x=lx-ax,y=ly-ay,u=px-bx,v=py-by; re+=x*u+y*v; im+=x*v-y*u; den+=x*x+y*y;}
  if(den<1e-9) return null; const a=re/den,b=im/den; // a = s cos, b = s sin
  return [a,b,-b,a,bx-(a*ax-b*ay),by-(b*ax+a*ay)];
}
function updateFigures(){
  for(const c of CONS){
    if(!ART[c.id]) continue;
    let target=0;
    if(mythic){ if(c===selected) target=1; else if(c.visible&&c.nProj>=3) target=(view.mode==='dome'?0.62:0.35); }
    const f=figs[c.id]||(target>0?ensureFig(c):null); if(!f) continue;
    if(target>0) f.shown=performance.now();
    if(target===0&&performance.now()-f.shown>1300){ if(f.g.style.opacity!=='0'){f.g.style.opacity='0';} continue; }
    const m=fitFigure(c);
    if(!m){ f.g.style.opacity='0'; continue; }
    f.inner.setAttribute('transform',`matrix(${m.map(v=>v.toFixed(4)).join(' ')})`);
    f.g.style.opacity=String(target);
  }
}

/* ---------- animation & interaction ---------- */
function ease(t){return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
function flyTo(c1,scale1,up1,dur){
  const c0=view.c.slice(),s0=view.scale,u0=view.up.slice();
  if(reduced){setBasis(c1,up1);view.scale=scale1;anim=null;return;}
  anim={t0:performance.now(),dur,c0,c1,s0,s1:scale1,u0,u1:up1};
}
function stepAnim(now){
  if(!anim)return; const t=Math.min(1,(now-anim.t0)/anim.dur), e=ease(t);
  const c=norm(slerp(anim.c0,anim.c1,e)); const up=norm([anim.u0[0]+(anim.u1[0]-anim.u0[0])*e,anim.u0[1]+(anim.u1[1]-anim.u0[1])*e,anim.u0[2]+(anim.u1[2]-anim.u0[2])*e]);
  setBasis(c,up); view.scale=Math.exp(Math.log(anim.s0)+(Math.log(anim.s1)-Math.log(anim.s0))*e);
  if(t>=1)anim=null;
}
function goDome(){
  view.mode='dome';
  flyTo([0,0,1],scaleDome,domeUp(),900);
}
function selectCon(c){
  selected=c; view.mode='con';
  // target center & scale: fit constellation into ~55% of the shorter side
  const ctr=norm(c.h); const zen=[0,0,1];
  let up=[zen[0]-dot(zen,ctr)*ctr[0],zen[1]-dot(zen,ctr)*ctr[1],zen[2]-dot(zen,ctr)*ctr[2]]; if(Math.hypot(up[0],up[1],up[2])<1e-3)up=domeUp(); up=norm(up);
  const right=norm(cross(ctr,up)); let ext=0;
  for(const s of c.stars){const d=dot(s.h,ctr);const k=2/(1+d);ext=Math.max(ext,Math.abs(k*dot(s.h,right)),Math.abs(k*dot(s.h,up)));}
  const small=Math.min(W,H); const target=(W<760?0.34:0.30)*small;
  const scale=Math.min(scaleDome*9,Math.max(scaleDome*1.15,target/Math.max(ext,0.02)));
  flyTo(ctr,scale,up,1000);
  showDetail(c); highlightVis();
}
function deselect(){ selected=null; $('detail').classList.remove('open'); highlightVis(); }

let drag=null;
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,moved:false,c:view.c.slice(),up:view.up.slice(),spin:view.spin,p0:unproject(e.clientX,e.clientY)};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{
  if(drag){
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y; if(Math.hypot(dx,dy)>4)drag.moved=true;
    if(!drag.moved)return; anim=null;
    if(view.mode==='dome'){ const ang=Math.atan2(drag.y-cy,drag.x-cx)-Math.atan2(e.clientY-cy,e.clientX-cx); view.spin=drag.spin-ang; setBasis([0,0,1],domeUp()); }
    else { // grab the sky
      const p1=unproject(e.clientX,e.clientY); const axis=cross(p1,drag.p0); const l=Math.hypot(axis[0],axis[1],axis[2]);
      if(l>1e-6){ const ang=Math.asin(Math.min(1,l)); const ax=norm(axis); const c=rotAbout(view.c,ax,ang); const up=rotAbout(view.up,ax,ang); setBasis(c,up); drag.p0=unproject(e.clientX,e.clientY); }
      if(view.mode==='con') view.mode='free';
    }
    return;
  }
  hovered=hitTest(e.clientX,e.clientY); canvas.style.cursor=hovered?'pointer':'crosshair';
});
canvas.addEventListener('pointerup',e=>{
  if(drag&&!drag.moved){ const c=hitTest(e.clientX,e.clientY); if(c){selectCon(c);} }
  drag=null;
});
canvas.addEventListener('pointercancel',()=>{drag=null;});
canvas.addEventListener('wheel',e=>{
  e.preventDefault(); anim=null;
  const f=Math.exp(-e.deltaY*0.0016); const ns=Math.max(scaleDome,Math.min(scaleDome*12,view.scale*f));
  if(ns<=scaleDome+0.5){ if(view.mode!=='dome'){view.mode='dome';setBasis([0,0,1],domeUp());} view.scale=scaleDome; return; }
  const p=unproject(e.clientX,e.clientY); const fr=1-view.scale/ns;
  const c=norm(slerp(view.c,p,Math.max(0,Math.min(1,fr))));
  const zen=[0,0,1]; let up=[zen[0]-dot(zen,c)*c[0],zen[1]-dot(zen,c)*c[1],zen[2]-dot(zen,c)*c[2]]; if(Math.hypot(up[0],up[1],up[2])<1e-3)up=domeUp();
  setBasis(c,norm(up)); view.scale=ns; if(view.mode==='dome'||view.mode==='con')view.mode='free';
},{passive:false});
function hitTest(x,y){
  let best=null,bd=22*22;
  for(const s of stars){ if(!s.p||s.p[2]<0||s.h[2]<0||!s.con)continue; const d=(s.p[0]-x)**2+(s.p[1]-y)**2; if(d<bd){bd=d;best=s.con;} }
  if(best)return best; bd=44*44;
  for(const c of CONS){ if(!c.visible||c.nProj<2)continue; const d=(c.cx-x)**2+(c.cy-y)**2; if(d<bd){bd=d;best=c;} }
  return best;
}
window.addEventListener('keydown',e=>{ if(e.key==='Escape'){ if($('loc').classList.contains('open')){closeLoc();} else {deselect(); goDome();} } });

/* ---------- UI: detail panel ---------- */
function dirWord(az){const names=['north','north-east','east','south-east','south','south-west','west','north-west'];return names[Math.round(az/45)%8];}
function placeText(c){ if(c.alt<0)return 'below the horizon'; if(c.alt>=68)return 'nearly overhead'; const pre=c.alt>=38?'high in the ':(c.alt>=15?'in the ':'low in the '); return pre+dirWord(c.az); }
function showDetail(c){
  $('dName').textContent=c.name; $('dTitle').textContent=c.title;
  const rows=c.stars.map(s=>`<tr><td>${s.name}<span class="by">${bayer(s)}</span></td><td class="n">${s.mag.toFixed(2)}</td><td class="n">${s.dist<20?s.dist.toFixed(1):Math.round(s.dist).toLocaleString()}</td></tr>`).join('');
  $('sci').innerHTML=`<table><thead><tr><th>Star</th><th class="n">Mag</th><th class="n">Light-years</th></tr></thead><tbody>${rows}</tbody></table><p class="note">Magnitude runs backwards: the smaller the number, the brighter the star. Positions are J2000, distances rounded.</p>`;
  $('myth').innerHTML=`<p class="drop">${c.blurb}</p><p class="plate">Figure after the celestial atlases · ${c.stars.length} stars · ${ART[c.id]?'engraved':'line figure'}</p>`;
  $('detail').classList.add('open');
  updateWhere();
}
function updateWhere(){ if(selected){$('dWhere').textContent=`${placeText(selected)} · altitude ${Math.round(selected.alt)}°`;} }
function setMythic(on){
  mythic=on;
  $('segSci').setAttribute('aria-pressed',String(!on)); $('segMyth').setAttribute('aria-pressed',String(on));
  $('modeBtn').setAttribute('aria-pressed',String(on)); $('modeBtn').textContent=on?'Scientific sky':'Mythic sky';
  $('sci').hidden=on; $('myth').hidden=!on;
}
$('segSci').onclick=()=>setMythic(false); $('segMyth').onclick=()=>setMythic(true); $('modeBtn').onclick=()=>setMythic(!mythic);
$('backBtn').onclick=()=>{deselect();goDome();};
$('nowBtn').onclick=()=>{tOffset=0;$('tslider').value='0';updateTimeLabel();};
$('tslider').oninput=e=>{tOffset=parseFloat(e.target.value);updateTimeLabel();};
function updateTimeLabel(){ const l=$('tlabel'); l.textContent=tOffset===0?'now':(tOffset>0?'+':'−')+Math.abs(tOffset).toFixed(2).replace(/\.?0+$/,'')+' h'; updateHeader(); }
function updateHeader(){
  const d=nowDate(); let opt={hour:'2-digit',minute:'2-digit'},dopt={day:'numeric',month:'short'};
  if(obs.tz){try{new Intl.DateTimeFormat([],{timeZone:obs.tz});opt.timeZone=obs.tz;dopt.timeZone=obs.tz;}catch(e){}}
  const tstr=d.toLocaleTimeString([],opt), dstr=d.toLocaleDateString([],dopt);
  const la=Math.abs(obs.lat).toFixed(2)+'°'+(obs.lat>=0?'N':'S'), lo=Math.abs(obs.lon).toFixed(2)+'°'+(obs.lon>=0?'E':'W');
  const sa=sunAlt(d); const sun=sa>0?'daylight, stars hidden':(sa>-6?'civil twilight':(sa>-18?'twilight':'night'));
  $('where').textContent=`${obs.label?obs.label+' · ':''}${la} ${lo} · ${tstr}, ${dstr} · ${sun}`;
}
/* ---------- UI: visible list ---------- */
let visKey='';
function updateVisList(){
  const vis=CONS.filter(c=>c.visible).sort((a,b)=>b.alt-a.alt);
  const key=vis.map(c=>c.id+Math.round(c.alt/5)).join(); if(key===visKey)return; visKey=key;
  $('visCount').textContent=vis.length+' of '+CONS.length;
  $('visList').innerHTML=vis.map(c=>`<li data-id="${c.id}"><b>${c.name}</b><i>${placeText(c)}</i></li>`).join('');
  highlightVis();
}
$('visList').addEventListener('click',e=>{const li=e.target.closest('li');if(!li)return;selectCon(conById[li.dataset.id]);});
$('visHead').onclick=()=>$('vis').classList.toggle('collapsed');
function highlightVis(){ $('visList').querySelectorAll('li').forEach(li=>li.classList.toggle('active',!!selected&&li.dataset.id===selected.id)); }
if(window.innerWidth<760) $('vis').classList.add('collapsed');

/* ---------- UI: location ---------- */
const citySel=$('city');
citySel.innerHTML='<option value="">— choose a city —</option>'+CITIES.map((c,i)=>`<option value="${i}">${c[0]}</option>`).join('');
citySel.onchange=()=>{const c=CITIES[citySel.value];if(c){$('lat').value=c[1];$('lon').value=c[2];}};
function openLoc(msg){ $('locErr').textContent=msg||''; $('lat').value=obs.lat.toFixed(2); $('lon').value=obs.lon.toFixed(2); const i=CITIES.findIndex(c=>c[0]===obs.label); citySel.value=i>=0?String(i):''; $('loc').classList.add('open'); citySel.focus(); }
function closeLoc(){ $('loc').classList.remove('open'); }
$('locBtn').onclick=()=>openLoc();
$('loc').addEventListener('click',e=>{if(e.target===$('loc'))closeLoc();});
$('applyBtn').onclick=()=>{
  const la=parseFloat($('lat').value),lo=parseFloat($('lon').value);
  if(!(la>=-90&&la<=90&&lo>=-180&&lo<=180)){$('locErr').textContent='Latitude must be between −90 and 90, longitude between −180 and 180.';return;}
  const c=CITIES[citySel.value]; const isCity=c&&Math.abs(c[1]-la)<0.05&&Math.abs(c[2]-lo)<0.05; setObserver(la,lo,isCity?c[0]:nearestCity(la,lo),isCity?c[3]:null); closeLoc(); toast('Sky redrawn for '+obs.label);
};
$('geoBtn').onclick=()=>requestGeo(true);
function nearestCity(la,lo){let best='',bd=1e9;for(const c of CITIES){const d=Math.hypot(c[1]-la,(c[2]-lo)*Math.cos(la*D));if(d<bd){bd=d;best=c[0];}}return bd<1.6?('near '+best):'';}
function setObserver(la,lo,label,tz){ obs.lat=la;obs.lon=lo;obs.label=label||'';obs.known=true;obs.tz=tz||null; try{localStorage.setItem('firmament.obs',JSON.stringify({lat:la,lon:lo,label:obs.label,tz:obs.tz}));}catch(e){} visKey=''; updateHeader(); }
function requestGeo(fromButton){
  if(!navigator.geolocation){ openLoc('This browser has no location service. Choose a city instead.'); return; }
  $('locErr').textContent='Asking the browser for your position…';
  navigator.geolocation.getCurrentPosition(pos=>{ setObserver(+pos.coords.latitude.toFixed(3),+pos.coords.longitude.toFixed(3),nearestCity(pos.coords.latitude,pos.coords.longitude)); closeLoc(); toast('Sky drawn for your location'); },
    err=>{ const why=err.code===1?'Location permission was declined.':'Your position could not be found.'; if(fromButton)$('locErr').textContent=why+' Choose a city or enter coordinates.'; else openLoc(why+' Choose a city or enter coordinates.'); },
    {timeout:9000,maximumAge:600000});
}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2600);}

/* ---------- boot ---------- */
resize(); setBasis([0,0,1],[0,1,0]);
(function initObserver(){
  let saved=null; try{saved=JSON.parse(localStorage.getItem('firmament.obs'));}catch(e){}
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone; const guess=CITIES.find(c=>c[0]===TZ_GUESS[tz]);
  if(saved&&isFinite(saved.lat)){ obs.lat=saved.lat;obs.lon=saved.lon;obs.label=saved.label||'';obs.tz=saved.tz||null;obs.known=true; }
  else if(guess){ obs.lat=guess[1];obs.lon=guess[2];obs.label=guess[0];obs.tz=guess[3]; }
  updateHeader();
  if(!saved&&!/lat=/.test(location.hash)) requestGeo(false);
})();
let lastHeader=-1e9;
function frame(t){
  stepAnim(t);
  // fade scientific lines out in mythic view for the selected constellation
  const target=(mythic&&selected)?0:1; const k=reduced?1:0.08; lineFade+=(target-lineFade)*k; if(Math.abs(target-lineFade)<0.01)lineFade=target;
  computeSky(nowDate());
  paint(t); updateFigures();
  if(t-lastHeader>1000){ lastHeader=t; updateHeader(); updateVisList(); updateWhere(); $('hint').style.opacity=selected?'0':'1'; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// deep link: #con=Cyg&myth=1&lat=..&lon=..&h=offset
(function(){ const q=new URLSearchParams(location.hash.slice(1)); if(!q.size)return;
  if(q.has('lat')&&q.has('lon')){obs.lat=+q.get('lat');obs.lon=+q.get('lon');obs.label=q.get('label')||nearestCity(obs.lat,obs.lon);obs.known=true;closeLoc();updateHeader();}
  if(q.has('h')){tOffset=+q.get('h');$('tslider').value=String(tOffset);updateTimeLabel();}
  if(q.get('myth')==='1')setMythic(true);
  if(q.has('con')){setTimeout(()=>{computeSky(nowDate());const c=conById[q.get('con')];if(c)selectCon(c);},150);}
})();
})();
