// Cloudflare Worker: CORS proxy (FITS cutouts are trimmed to the first 2D image, ~90 KB instead of ~4 MB) limited to NASA IRSA (?u=<encoded IRSA url>). Without ?u it serves the static site if an ASSETS binding exists.
const cut=b=>{const d=new Uint8Array(b),t=new TextDecoder("latin1");let o=0;while(o<d.length){const h={};for(let e=0;!e;o+=2880)for(let i=0;i<36;i++){const c=t.decode(d.subarray(o+i*80,o+i*80+80));if(c.startsWith("END")){e=1;break}if(c[8]=="=")h[c.slice(0,8).trim()]=c.slice(10).split("/")[0].trim()}const n=+h.NAXIS||0;let N=n?1:0;for(let j=1;j<=n;j++)N*=+h["NAXIS"+j];o+=Math.ceil(Math.abs(+h.BITPIX)/8*(+h.GCOUNT||1)*(N+(+h.PCOUNT||0))/2880)*2880;if(n==2)return d.slice(0,o)}return d};
export default{async fetch(r,env,ctx){
  const u=new URL(r.url).searchParams.get("u"),h={"access-control-allow-origin":"*"};
  if(u===null)return env.ASSETS?env.ASSETS.fetch(r):new Response("Monstellar proxy",{headers:h});
  if(!/^https:\/\/irsa\.ipac\.caltech\.edu\//.test(u))return new Response("forbidden",{status:403,headers:h});
  const c=caches.default,k=new Request(u);let x=await c.match(k);
  if(!x){
    for(let i=0;i<2;i++){x=await fetch(u);if(x.status<500)break}
    if(x.ok&&/center=/.test(u))x=new Response(cut(await x.arrayBuffer()),{headers:{"content-type":"application/fits"}});
    if(x.ok)ctx.waitUntil(c.put(k,new Response(x.clone().body,{headers:{"content-type":x.headers.get("content-type")||"application/octet-stream","cache-control":"public,max-age=21600"}})));
  }
  return new Response(x.body,{status:x.status,headers:{...h,"content-type":x.headers.get("content-type")||"application/octet-stream"}});
}}
