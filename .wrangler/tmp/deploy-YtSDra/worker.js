var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var K = ["IMAGE", "FLAGS", "VARIANCE", "WCS-WAVE"];
var cut = /* @__PURE__ */ __name((b) => {
  const d = new Uint8Array(b), t = new TextDecoder("latin1");
  let o = 0, s, P = [];
  while (o < d.length) {
    s = o;
    const h = {};
    for (let e = 0; !e; o += 2880) for (let i = 0; i < 36; i++) {
      const c = t.decode(d.subarray(o + i * 80, o + i * 80 + 80));
      if (c.startsWith("END")) {
        e = 1;
        break;
      }
      if (c[8] == "=") h[c.slice(0, 8).trim()] = c.slice(10).split("/")[0].trim();
    }
    const n = +h.NAXIS || 0;
    let N = n ? 1 : 0;
    for (let j = 1; j <= n; j++) N *= +h["NAXIS" + j];
    o += Math.ceil(Math.abs(+h.BITPIX) / 8 * (+h.GCOUNT || 1) * (N + (+h.PCOUNT || 0)) / 2880) * 2880;
    (!P.length || K.includes((h.EXTNAME || "").replace(/[' ]/g, ""))) && P.push(d.subarray(s, o));
  }
  const r = new Uint8Array(P.reduce((a, p) => a + p.length, 0));
  let q = 0;
  P.forEach((p) => {
    r.set(p, q);
    q += p.length;
  });
  return r;
}, "cut");
var S3 = "https://nasa-irsa-spherex.s3.us-east-1.amazonaws.com/";
var dc = new TextDecoder("latin1");
var ec = new TextEncoder();
var rng = /* @__PURE__ */ __name(async (k, a, b) => {
  const r = await fetch(S3 + k, { headers: { range: `bytes=${a}-${b}` }, signal: AbortSignal.timeout(15e3) });
  if (r.status != 206) throw Error(`S3 ${r.status} ${k}`);
  return new Uint8Array(await r.arrayBuffer());
}, "rng");
var hd = /* @__PURE__ */ __name((b) => {
  const h = {};
  for (let p = 0; p + 80 <= b.length; p += 80) {
    const c = dc.decode(b.subarray(p, p + 80));
    if (c.startsWith("END     ")) {
      const len = Math.ceil((p + 80) / 2880) * 2880;
      if (len > b.length) return null;
      const n = +h.NAXIS || 0;
      let N = n ? 1 : 0;
      for (let j = 1; j <= n; j++) N *= +h["NAXIS" + j];
      return { h, len, dl: Math.ceil(Math.abs(+h.BITPIX) / 8 * (+h.GCOUNT || 1) * (N + (+h.PCOUNT || 0)) / 2880) * 2880, raw: b.slice(0, len) };
    }
    if (c[8] == "=" && !c.startsWith("HIERARCH")) h[c.slice(0, 8).trim()] = c.slice(10).split("/")[0].trim();
  }
  return null;
}, "hd");
var nm = /* @__PURE__ */ __name((h, k, d) => h[k] === void 0 ? d : parseFloat(h[k]), "nm");
var sip = /* @__PURE__ */ __name((h, P) => {
  const T = [], r = new RegExp("^" + P + "_(\\d+)_(\\d+)$");
  for (const k in h) {
    const m = k.match(r);
    m && T.push([+m[1], +m[2], parseFloat(h[k])]);
  }
  return T;
}, "sip");
var ev = /* @__PURE__ */ __name((T, x, y) => T.reduce((s, [p, q, c]) => s + c * x ** p * y ** q, 0), "ev");
var w2p = /* @__PURE__ */ __name((h, ra, dec) => {
  const R = Math.PI / 180, a0 = nm(h, "CRVAL1") * R, d0 = nm(h, "CRVAL2") * R, a = ra * R, d = dec * R, cc = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(a - a0);
  if (!(cc > 0)) return null;
  const X = Math.cos(d) * Math.sin(a - a0) / cc / R, Y = (Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(a - a0)) / cc / R;
  let m;
  if (h.CD1_1 !== void 0) m = [[nm(h, "CD1_1"), nm(h, "CD1_2", 0)], [nm(h, "CD2_1", 0), nm(h, "CD2_2")]];
  else {
    const s1 = nm(h, "CDELT1", 1), s2 = nm(h, "CDELT2", 1);
    m = [[s1 * nm(h, "PC1_1", 1), s1 * nm(h, "PC1_2", 0)], [s2 * nm(h, "PC2_1", 0), s2 * nm(h, "PC2_2", 1)]];
  }
  const det = m[0][0] * m[1][1] - m[0][1] * m[1][0], u = (m[1][1] * X - m[0][1] * Y) / det, v = (-m[1][0] * X + m[0][0] * Y) / det;
  const AP = sip(h, "AP"), BP = sip(h, "BP");
  let U, V;
  if (AP.length && BP.length) {
    U = u + ev(AP, u, v);
    V = v + ev(BP, u, v);
  } else {
    const A = sip(h, "A"), B = sip(h, "B");
    U = u;
    V = v;
    for (let i = 0; i < 12; i++) {
      U = u - ev(A, U, V);
      V = v - ev(B, U, V);
    }
  }
  return { x: nm(h, "CRPIX1") + U, y: nm(h, "CRPIX2") + V, sc: Math.sqrt(Math.abs(det)) };
}, "w2p");
var setc = /* @__PURE__ */ __name((raw, key, val) => {
  const kp = key.padEnd(8) + "= ";
  for (let p = 0; p + 80 <= raw.length; p += 80) {
    const c = dc.decode(raw.subarray(p, p + 80));
    if (c.startsWith(kp)) {
      const v = Number.isInteger(val) && !key.startsWith("NAXIS") ? val.toFixed(1) : String(val);
      raw.set(ec.encode((kp + v.padStart(20) + c.slice(30)).slice(0, 80).padEnd(80)), p);
      return;
    }
    if (c.startsWith("END     ")) return;
  }
}, "setc");
var rice = /* @__PURE__ */ __name((c, nx) => {
  const out = new Int32Array(nx), T = c.length * 8;
  let bp = 32, last = c[0] << 24 | c[1] << 16 | c[2] << 8 | c[3] | 0;
  const rb = /* @__PURE__ */ __name((n) => {
    let v = 0;
    while (n > 0) {
      if (bp >= T) throw Error("rice overrun");
      const a = 8 - (bp & 7), t = Math.min(a, n);
      v = v * (1 << t) + (c[bp >> 3] >> a - t & (1 << t) - 1);
      bp += t;
      n -= t;
    }
    return v;
  }, "rb");
  for (let i = 0; i < nx; ) {
    const fs = rb(5) - 1, im = Math.min(i + 32, nx);
    if (fs < 0) for (; i < im; i++) out[i] = last;
    else for (; i < im; i++) {
      let d;
      if (fs == 25) d = rb(32);
      else {
        let z = 0;
        while (rb(1) == 0) z++;
        d = z * (1 << fs) + rb(fs);
      }
      d = d >>> 0;
      last = (d & 1 ? ~(d >>> 1) : d >>> 1) + last | 0;
      out[i] = last;
    }
  }
  return out;
}, "rice");
var flagsRows = /* @__PURE__ */ __name(async (key, x, box) => {
  const h = x.h;
  if (!/RICE_1/.test(h.ZCMPTYPE || "") || +h.ZVAL1 != 32 || +h.ZVAL2 != 4 || +h.ZTILE1 != box.W || +h.ZTILE2 != 1 || +h.ZBITPIX != 32 || +h.ZNAXIS1 != box.W || +h.ZNAXIS2 != box.H) throw Error("unsupported FLAGS compression");
  const nr = box.y1 - box.y0, nx = box.x1 - box.x0, dsc = await rng(key, x.ds + 8 * box.y0, x.ds + 8 * box.y1 - 1), dv = new DataView(dsc.buffer, dsc.byteOffset, dsc.byteLength);
  let lo = Infinity, hi = 0;
  const R = [];
  for (let r = 0; r < nr; r++) {
    const n = dv.getInt32(r * 8), o = dv.getInt32(r * 8 + 4);
    R.push([n, o]);
    lo = Math.min(lo, o);
    hi = Math.max(hi, o + n);
  }
  const hb = x.ds + (+h.THEAP || +h.NAXIS1 * +h.NAXIS2), heap = await rng(key, hb + lo, hb + hi - 1), out = new Uint8Array(nr * nx * 4), ov = new DataView(out.buffer);
  R.forEach(([n, o], r) => {
    const row = rice(heap.subarray(o - lo, o - lo + n), box.W);
    for (let i = 0; i < nx; i++) ov.setInt32((r * nx + i) * 4, row[box.x0 + i]);
  });
  return out;
}, "flagsRows");
var DROP = /* @__PURE__ */ new Set(["XTENSION", "BITPIX", "NAXIS", "NAXIS1", "NAXIS2", "PCOUNT", "GCOUNT", "TFIELDS", "TTYPE1", "TFORM1", "ZIMAGE", "ZTENSION", "ZBITPIX", "ZNAXIS", "ZNAXIS1", "ZNAXIS2", "ZPCOUNT", "ZGCOUNT", "ZTILE1", "ZTILE2", "ZCMPTYPE", "ZNAME1", "ZVAL1", "ZNAME2", "ZVAL2", "THEAP", "END"]);
var flagHdr = /* @__PURE__ */ __name((raw) => {
  const f = /* @__PURE__ */ __name((k, v, cm) => (k.padEnd(8) + "= " + (v[0] == "'" ? v.padEnd(20) : v.padStart(20)) + " / " + cm).slice(0, 80).padEnd(80), "f");
  const L = [f("XTENSION", "'IMAGE   '", "Image extension"), f("BITPIX", "32", "array data type"), f("NAXIS", "2", "number of array dimensions"), f("NAXIS1", "0", "x"), f("NAXIS2", "0", "y"), f("PCOUNT", "0", "no group parameters"), f("GCOUNT", "1", "one group")];
  for (let p = 0; p + 80 <= raw.length; p += 80) {
    const c = dc.decode(raw.subarray(p, p + 80));
    if (c.startsWith("END     ")) break;
    if (c.trim() === "" || DROP.has(c.slice(0, 8).trim())) continue;
    L.push(c);
  }
  L.push("END".padEnd(80));
  const out = new Uint8Array(Math.ceil(L.length * 80 / 2880) * 2880).fill(32);
  L.forEach((c, i) => out.set(ec.encode(c), i * 80));
  return out;
}, "flagHdr");
var s3cut = /* @__PURE__ */ __name(async (u) => {
  const m = u.match(/\/ibe\/data\/spherex\/([^?]+\.fits)\?(.*)$/);
  if (!m) return null;
  const q = new URLSearchParams(m[2]), c = (q.get("center") || "").split(",").map(parseFloat), sz = parseFloat(q.get("size")) || 0.25;
  if (c.length < 2 || !c.every(isFinite)) return null;
  const key = m[1], b0 = await rng(key, 0, 36863);
  const at = /* @__PURE__ */ __name(async (off2) => {
    if (off2 + 2880 <= b0.length) {
      const x = hd(b0.subarray(off2));
      if (x) return x;
    }
    for (let rl = 32768; rl <= 262144; rl *= 2) {
      const x = hd(await rng(key, off2, off2 + rl - 1));
      if (x) return x;
    }
    throw Error("header too long");
  }, "at");
  const pri = await at(0);
  let off = pri.len, ex = {}, box;
  for (let n = 0; n < 10 && !ex["WCS-WAVE"]; n++) {
    const x = await at(off), name = (x.h.EXTNAME || "").replace(/['\s]/g, "");
    x.ds = off + x.len;
    off = x.ds + x.dl;
    ex[name] = x;
    if (name == "IMAGE") {
      const W = +x.h.NAXIS1, H2 = +x.h.NAXIS2, p = w2p(x.h, c[0], c[1]);
      if (!p || !W || !H2) throw Error("wcs");
      const nx2 = Math.max(1, Math.round(sz / p.sc)), c0 = Math.round(p.x - 0.5 - nx2 / 2), r0 = Math.round(p.y - 0.5 - nx2 / 2);
      box = { W, H: H2, x0: Math.max(0, c0), x1: Math.min(W, c0 + nx2), y0: Math.max(0, r0), y1: Math.min(H2, r0 + nx2) };
      if (box.x1 - box.x0 < 4 || box.y1 - box.y0 < 4) throw Error("target outside this frame");
    }
    if (box && (name == "IMAGE" || name == "FLAGS" || name == "VARIANCE")) {
      if (name == "FLAGS") {
        x.bp = 4;
        x.z = 1;
        x.p = flagsRows(key, x, box);
        x.p.catch(() => 0);
        continue;
      }
      if (!/IMAGE/.test(x.h.XTENSION || "") || +x.h.NAXIS1 != box.W || +x.h.NAXIS2 != box.H) throw Error("plane size mismatch");
      const bp = Math.abs(+x.h.BITPIX) / 8;
      x.bp = bp;
      x.p = rng(key, x.ds + box.y0 * box.W * bp, x.ds + box.y1 * box.W * bp - 1);
      x.p.catch(() => 0);
    }
    if (name == "WCS-WAVE") {
      if (x.dl > 4e6) throw Error("wave table too big");
      x.p = rng(key, x.ds, x.ds + x.dl - 1);
      x.p.catch(() => 0);
    }
  }
  if (!box || !ex.IMAGE || !ex.FLAGS || !ex.VARIANCE || !ex["WCS-WAVE"]) throw Error("unexpected layout");
  const nx = box.x1 - box.x0, ny = box.y1 - box.y0, parts = [pri.raw];
  for (const name of ["IMAGE", "FLAGS", "VARIANCE"]) {
    const x = ex[name], raw = x.z ? flagHdr(x.raw) : x.raw.slice(), rows = await x.p, bp = x.bp, d = new Uint8Array(Math.ceil(nx * ny * bp / 2880) * 2880);
    if (rows.length < (x.z ? nx * ny * bp : ny * box.W * bp)) throw Error("short read");
    if (x.z) d.set(rows.subarray(0, nx * ny * bp));
    else for (let r = 0; r < ny; r++) d.set(rows.subarray(r * box.W * bp + box.x0 * bp, r * box.W * bp + (box.x0 + nx) * bp), r * nx * bp);
    setc(raw, "NAXIS1", nx);
    setc(raw, "NAXIS2", ny);
    for (const s of ["", "A", "W"]) {
      setc(raw, "CRPIX1" + s, nm(x.h, "CRPIX1" + s) - box.x0);
      setc(raw, "CRPIX2" + s, nm(x.h, "CRPIX2" + s) - box.y0);
    }
    parts.push(raw, d);
  }
  const w = ex["WCS-WAVE"], wd = new Uint8Array(w.dl);
  wd.set((await w.p).subarray(0, w.dl));
  parts.push(w.raw, wd);
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}, "s3cut");
var H = /* @__PURE__ */ __name(async (r, env, ctx) => {
  const u = new URL(r.url).searchParams.get("u"), h = { "access-control-allow-origin": "*", "access-control-expose-headers": "x-src" };
  if (u === null) return env.ASSETS ? env.ASSETS.fetch(r) : new Response("Monstellar proxy", { headers: h });
  if (!/^https:\/\/(irsa\.ipac\.caltech\.edu\/(SIA\?|ibe\/)|(cds|tapvizier\.cds)\.unistra\.fr\/)/.test(u)) return new Response("forbidden", { status: 403, headers: h });
  const c = caches.default, k = new Request(u + (u.includes("?") ? "&" : "?") + "_v=3");
  let x = await c.match(k), src = x ? "cache-" + (x.headers.get("x-src") || "?") : "";
  if (!x) {
    if (/center=/.test(u) && /\/ibe\/data\/spherex\//.test(u) && !/[?&]nos3=1/.test(r.url)) {
      try {
        const b = await s3cut(u);
        b && (x = new Response(b, { headers: { "content-type": "application/fits" } }), src = "s3");
      } catch (e) {
        src = "irsa (s3 failed: " + String(e.message || e).replace(/[^\x20-\x7e]/g, "").slice(0, 80) + ")";
        x = 0;
      }
    }
    if (!x) {
      src = src.startsWith("irsa") ? src : "irsa";
      for (let i = 0; i < 2; i++) {
        x = await fetch(u, { signal: AbortSignal.timeout(25e3) });
        if (x.status < 500) break;
      }
      if (x.ok && /center=/.test(u)) x = new Response(cut(await x.arrayBuffer()), { headers: { "content-type": "application/fits" } });
    }
    if (x.ok) ctx.waitUntil(c.put(k, new Response(x.clone().body, { headers: { "content-type": x.headers.get("content-type") || "application/octet-stream", "cache-control": "public,max-age=2592000,immutable", "x-src": src.split(" ")[0] } })));
  }
  return new Response(x.body, { status: x.status, headers: { ...h, "content-type": x.headers.get("content-type") || "application/octet-stream", "x-src": src } });
}, "H");
var worker_default = { async fetch(r, env, ctx) {
  try {
    return await H(r, env, ctx);
  } catch (e) {
    return new Response("proxy error: " + e, { status: 502, headers: { "access-control-allow-origin": "*" } });
  }
} };
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
