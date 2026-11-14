// node bake.mjs [pick,ladder,blink]  ->  cut/*.fits + cut/*.xml + cut/m.json (pre-baked IRSA cutouts, served as static assets; re-run to refresh, resumes if interrupted)
import{readFileSync as rd,writeFileSync as wr,mkdirSync as mk,existsSync as ex}from"fs";import{createHash as ch}from"crypto";
const H=rd("index.html","utf8"),T=JSON.parse(H.match(/const T=(\[\[.*?\]\]);/)[1]),Md=(process.argv[2]||"pick,ladder,blink").split(",");
const pick=R=>Array.from({length:Math.min(5,R.length)},(_,i)=>R[Math.round(i*(R.length-1)/Math.max(Math.min(5,R.length)-1,1))]),
SIA=(ra,dec)=>`https://irsa.ipac.caltech.edu/SIA?COLLECTION=spherex_qr3&POS=circle+${ra}+${dec}+0.02&MAXREC=300`,
LAD=[.8,1.2,1.6,2,2.4,2.6,2.7,2.8,2.9,3,3.1,3.2,3.35,3.6,3.75,4.05,4.15,4.22,4.27,4.32,4.4,4.5,4.58,4.64,4.67,4.7,4.8,4.9],
ladder=(R,w,wx)=>{const m=r=>(+r[w]+ +r[wx])/2*1e6,used=new Set,o=[];for(const l of LAD){let b=-1,bd=1e9;R.forEach((r,i)=>{const d=Math.abs(m(r)-l);if(!used.has(i)&&d<bd){bd=d;b=i}});if(b>=0&&bd<.06){used.add(b);o.push(R[b])}}return o.length>1?o:R.slice(0,12)};
const blink=(R,w,wx,t)=>{const m=r=>(+r[w]+ +r[wx])/2*1e6;let best=[];for(const a of R){const c=[];R.forEach(b=>{Math.abs(m(a)-m(b))<.05&&c.every(x=>Math.abs(x[t]-b[t])>.04)&&c.push(b)});c.length>best.length&&(best=c)}return best.sort((a,b)=>a[t]-b[t]).slice(0,10)};
const un=s=>s.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,"&"),
cut=b=>{let o=0;while(o<b.length){const h={};for(let e=0;!e;o+=2880)for(let i=0;i<36;i++){const c=b.toString("latin1",o+i*80,o+i*80+80);if(c.startsWith("END")){e=1;break}if(c[8]=="=")h[c.slice(0,8).trim()]=c.slice(10).split("/")[0].trim()}const n=+h.NAXIS||0;let N=n?1:0;for(let j=1;j<=n;j++)N*=+h["NAXIS"+j];o+=Math.ceil(Math.abs(+h.BITPIX)/8*(+h.GCOUNT||1)*(N+(+h.PCOUNT||0))/2880)*2880;if(n==2)return b.subarray(0,o)}return b},
get=async(u,tx)=>{for(let i=0;;i++)try{const r=await fetch(u,{signal:AbortSignal.timeout(12e4)});if(!r.ok)throw Error(r.status);return tx?await r.text():Buffer.from(await r.arrayBuffer())}catch(e){if(i>2)throw e;await new Promise(r=>setTimeout(r,1e3*(i+1)))}};
mk("cut",{recursive:true});let M={};try{M=JSON.parse(rd("cut/m.json","utf8"))}catch{}
const q=[],hs=u=>ch("sha1").update(u).digest("hex").slice(0,10);
for(const[nm,ra,dec]of T){
  const su=SIA(ra,dec),x=await get(su,1),f=[...x.matchAll(/<FIELD\b[^>]*\bname="([^"]*)"/g)].map(m=>m[1]),u=f.indexOf("access_url"),t=f.indexOf("t_min"),w=f.indexOf("em_min"),wx=f.indexOf("em_max");
  wr(`cut/${hs(su)}.xml`,x);M[su]=`cut/${hs(su)}.xml`;
  const R=[...x.matchAll(/<TR[^>]*>([\s\S]*?)<\/TR>/g)].map(m=>[...m[1].matchAll(/<TD\s*\/>|<TD[^>]*>([\s\S]*?)<\/TD>/g)].map(d=>un((d[1]||"").replace(/^<!\[CDATA\[|\]\]>$/g,"").trim()))).filter(r=>(r[u]||"").includes("/ibe/")),
  Rt=[...R].sort((a,b)=>a[t]-b[t]),Rw=[...R].sort((a,b)=>a[w]-b[w]);
  if(!R.length){console.log(nm,"no scans");continue}
  const S=[...(Md.includes("pick")?pick(Rt):[]),...(Md.includes("ladder")?ladder(Rw,w,wx):[]),...(Md.includes("blink")?blink(Rt,w,wx,t):[])];
  for(const r of S){const cu=`${r[u]}${r[u].includes("?")?"&":"?"}center=${ra},${dec}&size=0.25`;M[cu]&&ex(M[cu])||q.some(z=>z[0]==cu)||q.push([cu,nm])}
  console.log(nm,R.length,"scans,",S.length,"frames picked")}
let d=0,fail=0,mb=0;
await Promise.all(Array.from({length:4},async()=>{while(q.length){const[cu,nm]=q.shift();try{const b=cut(await get(cu)),p=`cut/${hs(cu)}.fits`;wr(p,b);M[cu]=p;mb+=b.length/1e6}catch(e){fail++;console.log("FAIL",nm,String(e).slice(0,80))}d++;process.stdout.write(`\r${d} done, ${fail} failed, ${mb.toFixed(1)} MB  `)}}));
wr("cut/m.json",JSON.stringify(M));console.log(`\nm.json: ${Object.keys(M).length} entries. frames are trimmed to the first image. Now: git add cut && git commit && deploy`)
