// Cloudflare Worker: CORS proxy limited to NASA IRSA (?u=<encoded IRSA url>). Without ?u it serves the static site if an ASSETS binding exists.
export default{async fetch(r,env,ctx){
  const u=new URL(r.url).searchParams.get("u"),h={"access-control-allow-origin":"*"};
  if(u===null)return env.ASSETS?env.ASSETS.fetch(r):new Response("Monstellar proxy",{headers:h});
  if(!/^https:\/\/irsa\.ipac\.caltech\.edu\//.test(u))return new Response("forbidden",{status:403,headers:h});
  const c=caches.default,k=new Request(u);let x=await c.match(k);
  if(!x){
    for(let i=0;i<2;i++){x=await fetch(u);if(x.status<500)break}
    if(x.ok)ctx.waitUntil(c.put(k,new Response(x.clone().body,{headers:{"content-type":x.headers.get("content-type")||"application/octet-stream","cache-control":"public,max-age=21600"}})));
  }
  return new Response(x.body,{status:x.status,headers:{...h,"content-type":x.headers.get("content-type")||"application/octet-stream"}});
}}
