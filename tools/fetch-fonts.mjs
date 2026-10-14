// 把站点用到的字体下载到 site/fonts/，生成 site/fonts.css
// 三个字体都是可变字体：一个文件覆盖整段字重。
// 中文按页面实际用字做子集（Google Fonts text= 参数）。改了文案后重跑：node tools/fetch-fonts.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const SITE = new URL('../', import.meta.url);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const html = await readFile(new URL('index.html', SITE), 'utf8');
const js = await readFile(new URL('main.js', SITE), 'utf8');
const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
const chars = [...new Set([...ascii, ...'≈→↗—–·', ...(html + js).replace(/<[^>]+>/g, ' ')])]
  .filter(c => c.codePointAt(0) >= 32 && c !== '﻿').join('');

const FAMILIES = [
  { family: 'Noto Sans SC', file: 'noto-sans-sc', axis: '400..900', text: chars },
  { family: 'Geist', file: 'geist', axis: '400..600' },
  { family: 'Geist Mono', file: 'geist-mono', axis: '400..500' },
];

await mkdir(new URL('fonts/', SITE), { recursive: true });
let css = '/* 自动生成：node tools/fetch-fonts.mjs */\n';
let total = 0;
for (const f of FAMILIES) {
  let url = `https://fonts.googleapis.com/css2?family=${f.family.replace(/ /g, '+')}:wght@${f.axis}&display=swap`;
  if (f.text) url += '&text=' + encodeURIComponent(f.text);
  const src = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
  // 每个 @font-face 前面有 /* subset */ 注释；带 text= 时没有注释、只有一个块
  const faces = [...src.matchAll(/(?:\/\* ([\w-]+) \*\/\s*)?@font-face \{([^}]+)\}/g)]
    .filter(m => f.text || m[1] === 'latin');
  if (faces.length !== 1) throw new Error(`${f.family}: expected 1 face, got ${faces.length}`);
  const body = faces[0][2];
  const woff = body.match(/url\((https:[^)]+)\)/)[1];
  const range = (body.match(/unicode-range: ([^;]+);/) || [])[1];
  const name = `${f.file}.woff2`;
  const buf = Buffer.from(await (await fetch(woff, { headers: { 'User-Agent': UA } })).arrayBuffer());
  await writeFile(new URL('fonts/' + name, SITE), buf);
  total += buf.length;
  console.log(name.padEnd(22), (buf.length / 1024).toFixed(1) + ' KB');
  const [lo, hi] = f.axis.split('..');
  css += `@font-face { font-family: "${f.family}"; font-style: normal; font-weight: ${lo} ${hi}; font-display: swap; src: url("fonts/${name}") format("woff2");${range ? ` unicode-range: ${range};` : ''} }\n`;
}
await writeFile(new URL('fonts.css', SITE), css);
console.log(`chars: ${chars.length} · total: ${(total / 1024).toFixed(1)} KB`);
