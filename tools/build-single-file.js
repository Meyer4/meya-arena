// Meya Arena — single-file builder.
// Bundles the whole game (Three.js + all code, CSS already inline in index.html)
// into ONE .html file that runs from anywhere: file://, WhatsApp share, any host.
// Usage: npm i -g esbuild   (or: cd /tmp/build && npm i three@0.160.0 esbuild)
//        NODE_PATH=/tmp/build/node_modules node tools/build-single-file.js
const fs = require('fs');
const path = require('path');

async function main() {
  let esbuild;
  try { esbuild = require('esbuild'); }
  catch { esbuild = require('/tmp/build/node_modules/esbuild'); }

  const root = path.join(__dirname, '..');
  const result = await esbuild.build({
    entryPoints: [path.join(root, 'client/src/main.js')],
    bundle: true,
    minify: true,
    format: 'iife',
    target: 'es2020',
    nodePaths: ['/tmp/build/node_modules'],
    write: false,
    logLevel: 'warning',
  });
  const bundle = result.outputFiles[0].text;
  if (!bundle.includes('WebGLRenderer')) throw new Error('Bundle looks wrong (no three.js?)');

  let html = fs.readFileSync(path.join(root, 'client/index.html'), 'utf8');
  html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/, '');
  html = html.replace(
    '<script type="module" src="./src/main.js"></script>',
    () => '<script>\n' + bundle + '\n</script>'
  );
  if (html.includes('src="./src/main.js"')) throw new Error('Module script tag not replaced');

  const outDir = path.join(root, 'dist');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, 'meya-arena-game.html');
  fs.writeFileSync(out, html);
  console.log('BUILT:', out, (fs.statSync(out).size / 1024).toFixed(0) + 'KB');
}
main().catch((e) => { console.error('BUILD FAILED:', e.message); process.exit(1); });
