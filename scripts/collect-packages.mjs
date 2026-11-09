import assert from 'node:assert/strict';
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const [platform, arch] = process.argv.slice(2);
const output = 'release/artifacts';
await mkdir(output, { recursive: true });
const windows = `Xijian-Setup-${version}-x64.exe`;
const mac = arch => ['dmg', 'zip'].map(ext => `Xijian-${version}-mac-${arch}.${ext}`);
async function requireFiles(directory, names) {
  for (const name of names) {
    assert.ok((await stat(path.join(directory, name))).size > 0, `Empty package: ${name}`);
  }
}

if (platform === 'release') {
  await requireFiles(output, [windows, 'Xijian-Setup.exe', `${windows}.blockmap`, ...mac('arm64'), ...mac('x64')]);
  const names = (await readdir(output)).filter(name => name !== 'SHA256SUMS.txt').sort();
  assert.ok(names.some(name => name.endsWith('.yml')), 'Windows update metadata missing');
  const lines = [];
  for (const name of names) {
    const hash = createHash('sha256').update(await readFile(path.join(output, name))).digest('hex');
    lines.push(`${hash}  ${name}`);
  }
  await writeFile(path.join(output, 'SHA256SUMS.txt'), `${lines.join('\n')}\n`);
  console.log('Complete release verified: Windows x64, macOS arm64 and macOS x64');
} else {
  assert.ok((platform === 'windows' && arch === 'x64') || (platform === 'macos' && ['arm64', 'x64'].includes(arch)), 'Unsupported target');
  let names;
  if (platform === 'windows') {
    const metadata = (await readdir('release')).filter(name => name.endsWith('.yml') && !name.startsWith('builder-'));
    assert.ok(metadata.length, 'Windows update metadata missing');
    names = [windows, `${windows}.blockmap`, ...metadata];
  } else {
    // Mac updates remain manual until Developer ID signing/notarization is configured.
    // Do not merge architecture-specific Mac update feeds into the Windows feed.
    names = mac(arch);
  }
  await requireFiles('release', names);
  for (const name of names) await copyFile(path.join('release', name), path.join(output, name));
  if (platform === 'windows') await copyFile(path.join(output, windows), path.join(output, 'Xijian-Setup.exe'));
  console.log(`Collected ${platform} ${arch}: ${names.join(', ')}`);
}
