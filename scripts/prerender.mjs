// Writes dist/<route>/index.html with the page's text already in the HTML,
// so crawlers that do not run JavaScript can read it. Run after `vite build`
// and `vite build --ssr src/prerender-entry.jsx --outDir .prerender`.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const { render, routes } = await import(pathToFileURL(path.join(root, '.prerender', 'prerender-entry.js')).href);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

for (const { path: route } of routes) {
  const rendered = render(route);
  const { title, description } = rendered;
  // Helmet emits <title>/<meta>/<link> inline in the markup; they belong in <head> (set below)
  const html = rendered.html.replace(/^(?:<title>.*?<\/title>|<(?:meta|link)\b[^>]*>)+/s, '');
  const canonical = `https://www.nextto.in${route}`;
  let out = template
    .replace(/<title>.*?<\/title>/s, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${canonical}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canonical}$2`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  if (!out.includes(`<div id="root">${html.slice(0, 20)}`)) throw new Error(`root div not found for ${route}`);
  const dir = path.join(dist, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), out);
  console.log(`prerendered ${route} (${html.length} chars)`);
}
fs.rmSync(path.join(root, '.prerender'), { recursive: true, force: true });
