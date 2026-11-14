// Monstellar catalog add-on. Load AFTER the main script and targets.js:
//   <script src="targets.js"></script><script src="catalog.js"></script>
// Uses the main script's globals ($, load, tab, V). Adds a CATALOG button (key T),
// a searchable panel of all targets, and exact-name matching in the CMD box.
(()=>{
const CAT=typeof CATALOG!="undefined"?CATALOG:[];
if(!CAT.length)return;

const css=document.createElement("style");
css.textContent=`
#cat{display:flex;flex-direction:column;left:372px;top:84px;width:320px;max-height:calc(100vh - 190px);z-index:4}
#cat .pb{display:flex;flex-direction:column;min-height:0;flex:1}
#cq{width:100%;padding:4px 0 8px;border-bottom:1px solid var(--ln);font-size:13px;caret-color:var(--a)}
#cq::placeholder{color:var(--lb)}
#cl{flex:1;min-height:0;margin-top:8px;overflow:auto;scrollbar-width:thin;scrollbar-color:var(--a) transparent;overscroll-behavior:contain;display:flex;flex-direction:column;gap:2px}
#cl button{flex:none;text-align:left;padding:5px 10px;font:600 13px var(--disp);letter-spacing:.1em;text-transform:uppercase;color:var(--ink);background:color-mix(in srgb,var(--a) 8%,transparent);border-left:2px solid var(--ln)}
#cl button:hover{background:color-mix(in srgb,var(--a) 18%,transparent)}
#cl button.on{background:var(--a);color:#000;border-left-color:var(--a)}
#cl small{display:block;font:11px var(--mono);letter-spacing:.04em;text-transform:none;color:var(--lb)}
#cl button.on small{color:#000}
#cl div{padding:8px;font:600 12px var(--disp);letter-spacing:.2em;color:var(--lb)}
body:not([data-tab=t]) #cat{display:none}
@media(max-width:1000px){#cat{left:10px;right:10px;width:auto;top:80px;max-height:calc(100vh - 170px)}}
`;
document.head.append(css);

const pn=document.createElement("aside");
pn.id="cat";pn.className="ui pnl";pn.hidden=true;
pn.innerHTML=`<h2>Catalog</h2><div class="pb"><input id="cq" placeholder="SEARCH ${CAT.length} TARGETS" autocomplete="off" aria-label="Filter targets"><div id="cl"></div></div>`;
document.body.append(pn);
// the main script zooms on wheel; keep wheel scrolling the list instead
pn.addEventListener("wheel",e=>e.stopPropagation());

const bt=document.createElement("button");
bt.className="chip";bt.id="cb";bt.textContent="CATALOG";bt.title="Browse all targets (T)";
$("pal").before(bt);

const fill=q=>{
  q=(q||"").trim().toLowerCase().replace(/^m\s*(\d+)$/,"messier $1");
  const m=CAT.filter(r=>!q||(r[0]+" "+r[3]).toLowerCase().includes(q)),cur=typeof V!="undefined"&&V?V.n:"";
  $("cl").replaceChildren(...m.map(([n,ra,dec,ty])=>{
    const b=document.createElement("button"),s=document.createElement("span"),i=document.createElement("small");
    b.dataset.n=n;b.className=n==cur?"on":"";s.textContent=n;
    i.textContent=`${ty} · ${ra.toFixed(2)}° ${dec>0?"+":""}${dec.toFixed(2)}°`;
    b.append(s,i);b.onclick=()=>{tog(false);load(n,ra,dec)};return b;
  }));
  if(!m.length){const d=document.createElement("div");d.textContent="NO MATCHING TARGETS";$("cl").append(d)}
};
const tog=o=>{
  o=o===undefined?pn.hidden:o;
  if(o&&document.body.dataset.tab!="t")tab("t");
  pn.hidden=!o;
  if(o){fill($("cq").value);if(matchMedia("(min-width:1001px)").matches)$("cq").focus()}
};
bt.onclick=()=>tog();
$("cq").oninput=e=>fill(e.target.value);
addEventListener("keydown",e=>{
  if(e.key=="Escape")return tog(false);
  if(e.target.tagName=="INPUT"||e.metaKey||e.ctrlKey||e.altKey)return;
  if(e.key.toLowerCase()=="t")tog();
});

// keep the highlighted catalog row in sync with whatever target is loaded
const L0=load;
load=function(n,...a){
  [...$("cl").children].forEach(b=>b.classList.toggle("on",b.dataset.n==n));
  return L0.call(this,n,...a);
};

// CMD box: exact catalog names (M31, "47 Tucanae", Sirius…) load instantly; everything else goes to the original handler
$("q").placeholder="NAME OR RA, DEC (DEG)";$("q").setAttribute("aria-label","Target name, or RA and Dec in degrees");
const f0=$("f").onsubmit;
$("f").onsubmit=e=>{
  const q=$("q").value.trim().toLowerCase().replace(/^m\s*(\d+)$/,"messier $1"),
  h=q&&CAT.find(r=>{const n=r[0].toLowerCase();return n==q||n.startsWith(q+" ")});
  if(h){e.preventDefault();return load(h[0],h[1],h[2])}
  return f0.call($("f"),e);
};
})();
