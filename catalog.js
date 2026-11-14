// Monstellar catalog add-on. Load AFTER the main script and targets.js:
//   <script src="targets.js"></script><script src="catalog.js"></script>
// Adds a searchable list of all targets directly under the 5 featured targets,
// and exact-name matching in the CMD box. Uses the main script's globals ($, load, V).
(()=>{
const CAT=typeof CATALOG!="undefined"?CATALOG:[];
if(!CAT.length)return;

const css=document.createElement("style");
css.textContent=`
#cw{display:flex;flex-direction:column;gap:6px}
#cq{width:100%;padding:7px 12px;font-size:13px;caret-color:var(--a);background:color-mix(in srgb,var(--a) 8%,transparent);border-left:2px solid var(--ln)}
#cq::placeholder{color:var(--lb)}
#cl{max-height:clamp(90px,calc(100vh - 640px),260px);overflow:auto;scrollbar-width:thin;scrollbar-color:var(--a) transparent;overscroll-behavior:contain;display:flex;flex-direction:column;gap:2px}
#cl button{flex:none;height:30px;display:flex;align-items:center;gap:12px;padding:0 12px;text-align:left;font:600 13px var(--disp);letter-spacing:.14em;text-transform:uppercase;color:var(--lb);background:color-mix(in srgb,var(--a) 8%,transparent);border-left:2px solid var(--ln);clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,0 100%);transition:background .15s}
#cl button span{color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cl button:hover{background:color-mix(in srgb,var(--a) 18%,transparent)}
#cl button.on{background:var(--a);color:#000;border-left-color:var(--a)}#cl button.on span{color:#000}
#cl div{padding:8px;font:600 12px var(--disp);letter-spacing:.2em;color:var(--lb)}
`;
document.head.append(css);

const wrap=document.createElement("div");
wrap.id="cw";
wrap.innerHTML=`<input id="cq" placeholder="SEARCH ${CAT.length} TARGETS" autocomplete="off" aria-label="Search all targets"><div id="cl"></div>`;
$("nav").after(wrap);

const fill=q=>{
  q=(q||"").trim().toLowerCase().replace(/^m\s*(\d+)$/,"messier $1");
  const cur=typeof V!="undefined"&&V?V.n:"",pad=n=>String(n).padStart(2,"0"),
  m=CAT.map((r,i)=>[r,i]).filter(([r])=>!q||(r[0]+" "+r[3]).toLowerCase().includes(q));
  $("cl").replaceChildren(...m.map(([[n,ra,dec,ty],i])=>{
    const b=document.createElement("button"),s=document.createElement("span");
    b.dataset.n=n;b.className=n==cur?"on":"";
    b.title=`${ty} · RA ${ra}° Dec ${dec}°`;
    b.append(pad(i+6),s);s.textContent=n;
    b.onclick=()=>load(n,ra,dec);return b;
  }));
  if(!m.length){const d=document.createElement("div");d.textContent="NO MATCHING TARGETS";$("cl").append(d)}
};
fill("");
$("cq").oninput=e=>fill(e.target.value);

// keep the highlighted row in sync with whatever target is loaded
const L0=load;
load=function(n,...a){
  [...$("cl").children].forEach(b=>b.classList.toggle("on",b.dataset.n==n));
  return L0.call(this,n,...a);
};
[...$("cl").children].forEach(b=>b.classList.toggle("on",b.dataset.n==V?.n));

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
