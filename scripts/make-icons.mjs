// Generates PNG icons for the PWA with no external dependencies.
// Renders a thematic "Eye of the Gods" mark and writes several sizes.
// Run: node scripts/make-icons.mjs
import zlib from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const OUT = new URL("../icons/", import.meta.url);
mkdirSync(OUT, { recursive: true });

// ---- tiny PNG encoder (RGBA, no deps) --------------------------------------
const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ---- drawing ---------------------------------------------------------------
function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
// Render at the given size with 3x supersampling for smooth edges.
function render(size, { maskable = false } = {}) {
  const SS = 3;
  const S = size * SS;
  const px = Buffer.alloc(S * S * 4);
  const cx = S / 2, cy = S / 2;
  const R = S / 2;
  // Colours
  const bgOuter = [26, 14, 22];     // deep void purple
  const bgInner = [58, 22, 40];     // warmer center
  const ring = [181, 137, 47];      // chaos brass
  const sclera = [222, 214, 200];
  const iris1 = [240, 150, 40];     // fiery
  const iris2 = [190, 40, 20];
  const pupil = [12, 6, 10];

  const safe = maskable ? 0.80 : 0.94; // shrink art for maskable safe zone
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (x - cx), dy = (y - cy);
      const d = Math.hypot(dx, dy);
      const i = (y * S + x) * 4;
      let col = null, a = 0;
      const disc = R * safe;
      if (d <= disc) {
        a = 255;
        const t = Math.min(1, d / disc);
        col = mix(bgInner, bgOuter, t * t);
        // outer ring
        const rOut = disc * 0.96, rIn = disc * 0.80;
        if (d >= rIn && d <= rOut) {
          const e = 1 - Math.abs((d - (rIn + rOut) / 2) / ((rOut - rIn) / 2));
          col = mix(col, ring, Math.max(0, e));
        }
        // eye almond: |dy| scaled bigger so it's a wide lens
        const ex = dx / (disc * 0.66);
        const ey = dy / (disc * 0.34);
        const er = Math.hypot(ex, ey);
        if (er <= 1) {
          col = mix(sclera, col, Math.min(1, Math.max(0, (er - 0.7) / 0.3)));
          // iris
          const ir = Math.hypot(dx, dy) / (disc * 0.30);
          if (ir <= 1) {
            col = mix(iris1, iris2, ir);
            const pr = Math.hypot(dx, dy) / (disc * 0.13);
            if (pr <= 1) col = mix(pupil, col, Math.min(1, pr));
            // glint
            const gx = dx + disc * 0.07, gy = dy + disc * 0.08;
            if (Math.hypot(gx, gy) < disc * 0.04) col = [255, 250, 240];
          }
        }
        // soft edge of disc
        if (d > disc - SS) a = Math.round(255 * (disc - d) / SS);
      }
      if (col) {
        px[i] = Math.round(col[0]);
        px[i + 1] = Math.round(col[1]);
        px[i + 2] = Math.round(col[2]);
        px[i + 3] = Math.max(0, Math.min(255, a));
      } else {
        px[i + 3] = 0;
      }
    }
  }
  // downsample SSxSS -> size
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, al = 0;
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * S + (x * SS + sx)) * 4;
          const af = px[i + 3];
          r += px[i] * af; g += px[i + 1] * af; b += px[i + 2] * af; al += af;
        }
      const o = (y * size + x) * 4;
      const n = SS * SS;
      out[o + 3] = Math.round(al / n);
      if (al > 0) { out[o] = Math.round(r / al); out[o + 1] = Math.round(g / al); out[o + 2] = Math.round(b / al); }
    }
  }
  return encodePNG(size, size, out);
}

const jobs = [
  ["icon-192.png", 192, {}],
  ["icon-512.png", 512, {}],
  ["icon-maskable-512.png", 512, { maskable: true }],
  ["apple-touch-icon.png", 180, { maskable: true }],
  ["favicon-32.png", 32, {}],
];
for (const [name, size, opts] of jobs) {
  writeFileSync(new URL(name, OUT), render(size, opts));
  console.log("wrote icons/" + name);
}
