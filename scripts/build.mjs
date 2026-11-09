import { build } from 'esbuild';
import { mkdir, rm, copyFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await Promise.all([
  build({ entryPoints: ['src/main/main.ts'], outfile: 'dist/main.cjs', bundle: true, platform: 'node', format: 'cjs', target: 'node24', external: ['electron', 'electron-updater'], sourcemap: true }),
  build({ entryPoints: ['src/main/preload.ts'], outfile: 'dist/preload.cjs', bundle: true, platform: 'node', format: 'cjs', target: 'node24', external: ['electron'] }),
  build({ entryPoints: ['src/renderer/app.ts'], outfile: 'dist/renderer.js', bundle: true, platform: 'browser', target: 'chrome148', loader: { '.woff2': 'file' }, assetNames: 'fonts/[name]', sourcemap: true })
]);
await copyFile('src/renderer/index.html', 'dist/index.html');
await copyFile('assets/chime.wav', 'dist/chime.wav');
console.log('Built main process, isolated preload, renderer, fonts and sound.');
