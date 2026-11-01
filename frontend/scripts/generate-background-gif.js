const fs = require('fs');
const path = require('path');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');

const width = 640;
const height = 360;
const totalFrames = 36;
const delay = 60; // 60ms per frame (~16-17fps, very smooth)

const gif = GIFEncoder();
const targetPath = path.join(__dirname, '..', 'public', 'images', 'auth-bg.gif');

console.log('Generating animated cool gradient mesh GIF to:', targetPath);

// Mathematical harmonic field with cool colors:
// Primary palette: Deep Navy, Cobalt Blue, Cyan Sky, Cool Slate, Light Indigo
const colorStops = [
  { r: 15, g: 23, b: 42 },   // #0f172a slate-900
  { r: 30, g: 58, b: 138 },  // #1e3a8a blue-900
  { r: 37, g: 99, b: 235 },  // #2563eb blue-600
  { r: 14, g: 165, b: 233 }, // #0ea5e9 sky-500
  { r: 56, g: 189, b: 248 }, // #38bdf8 sky-400
  { r: 99, g: 102, b: 241 }, // #6366f1 indigo-500
  { r: 241, g: 245, b: 249 } // #f1f5f9 slate-100
];

function lerpColor(c1, c2, t) {
  return [
    Math.round(c1.r + (c2.r - c1.r) * t),
    Math.round(c1.g + (c2.g - c1.g) * t),
    Math.round(c1.b + (c2.b - c1.b) * t),
  ];
}

for (let frame = 0; frame < totalFrames; frame++) {
  const theta = (frame / totalFrames) * 2 * Math.PI;
  const rgba = new Uint8Array(width * height * 4);

  // Orbs moving in smooth harmonic loops
  const orb1 = {
    x: width * (0.35 + 0.18 * Math.cos(theta)),
    y: height * (0.35 + 0.15 * Math.sin(theta)),
    r: width * 0.45,
    c: { r: 14, g: 165, b: 233 } // Cyan / Sky
  };

  const orb2 = {
    x: width * (0.65 - 0.2 * Math.sin(theta)),
    y: height * (0.6 + 0.18 * Math.cos(theta)),
    r: width * 0.5,
    c: { r: 37, g: 99, b: 235 } // Cobalt Blue
  };

  const orb3 = {
    x: width * (0.5 + 0.22 * Math.cos(theta + Math.PI / 3)),
    y: height * (0.3 - 0.12 * Math.sin(theta + Math.PI / 3)),
    r: width * 0.4,
    c: { r: 99, g: 102, b: 241 } // Indigo
  };

  const orb4 = {
    x: width * (0.2 + 0.15 * Math.sin(theta + Math.PI)),
    y: height * (0.75 + 0.12 * Math.cos(theta + Math.PI)),
    r: width * 0.38,
    c: { r: 56, g: 189, b: 248 } // Sky light
  };

  let idx = 0;
  for (let y = 0; y < height; y++) {
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = x / width;

      // Base gradient (cool twilight to soft daylight)
      let r = 230 + ny * 20 - nx * 15;
      let g = 238 + ny * 14 - nx * 10;
      let b = 250 - ny * 10 + nx * 5;

      // Distance to orbs
      const d1 = Math.hypot(x - orb1.x, y - orb1.y) / orb1.r;
      const d2 = Math.hypot(x - orb2.x, y - orb2.y) / orb2.r;
      const d3 = Math.hypot(x - orb3.x, y - orb3.y) / orb3.r;
      const d4 = Math.hypot(x - orb4.x, y - orb4.y) / orb4.r;

      const w1 = Math.max(0, 1 - Math.pow(d1, 1.3));
      const w2 = Math.max(0, 1 - Math.pow(d2, 1.3));
      const w3 = Math.max(0, 1 - Math.pow(d3, 1.4));
      const w4 = Math.max(0, 1 - Math.pow(d4, 1.3));

      // Composite colors
      r = r * 0.35 + orb1.c.r * w1 * 0.4 + orb2.c.r * w2 * 0.45 + orb3.c.r * w3 * 0.35 + orb4.c.r * w4 * 0.3;
      g = g * 0.35 + orb1.c.g * w1 * 0.4 + orb2.c.g * w2 * 0.45 + orb3.c.g * w3 * 0.35 + orb4.c.g * w4 * 0.3;
      b = b * 0.35 + orb1.c.b * w1 * 0.4 + orb2.c.b * w2 * 0.45 + orb3.c.b * w3 * 0.35 + orb4.c.b * w4 * 0.3;

      rgba[idx++] = Math.min(255, Math.max(0, Math.round(r)));
      rgba[idx++] = Math.min(255, Math.max(0, Math.round(g)));
      rgba[idx++] = Math.min(255, Math.max(0, Math.round(b)));
      rgba[idx++] = 255;
    }
  }

  // Quantize palette to 128 colors for sleek gradient and small file size
  const palette = quantize(rgba, 128);
  const index = applyPalette(rgba, palette);

  gif.writeFrame(index, width, height, { palette, delay });
}

gif.finish();

const buffer = gif.bytes();
fs.writeFileSync(targetPath, buffer);
console.log(`Successfully generated GIF! File size: ${(buffer.length / 1024).toFixed(1)} KB`);
