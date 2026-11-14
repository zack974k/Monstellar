// Cloudflare Worker: CORS proxy limited to NASA IRSA (?u=<encoded IRSA url>). Without ?u it serves the static site if an ASSETS binding exists.
export default{async fetch(r,env){
  const u=new URL(r.url).searchParams.get("u"),h={"access-control-allow-origin":"*"};
  if(u===null)return env.ASSETS?env.ASSETS.fetch(r):new Response("Monstellar proxy",{headers:h});
  if(!/^https:\/\/irsa\.ipac\.caltech\.edu\//.test(u))return new Response("forbidden",{status:403,headers:h});
  const x=await fetch(u);
  return new Response(x.body,{status:x.status,headers:{...h,"content-type":x.headers.get("content-type")||"application/octet-stream"}});
}}
