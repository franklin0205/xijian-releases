import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
assert.match(pkg.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
assert.equal(lock.version, pkg.version, 'Lockfile version differs from package.json');
assert.equal(lock.packages[''].version, pkg.version, 'Lockfile root version differs');
if (process.env.GITHUB_REF_TYPE === 'tag') {
  assert.equal(process.env.GITHUB_REF_NAME, `v${pkg.version}`, 'Release tag must match package.json');
}
console.log(`Shared desktop version: ${pkg.version}`);
