const { build, Platform, Arch } = require('electron-builder');
const pkg = require('../package.json');
if (process.platform !== 'darwin') throw new Error('Use a native macOS runner');
if (pkg.version !== '0.5.1') throw new Error('Unexpected build input version');
const config = { ...pkg.build, directories: { output: 'release', buildResources: 'assets' }, publish: null,
  mac: { ...pkg.build.mac, artifactName: 'Xijian-0.5.1-macOS-${arch}.${ext}', identity: '-',
    hardenedRuntime: true, entitlements: 'build/entitlements.adhoc.plist',
    entitlementsInherit: 'build/entitlements.adhoc.plist' } };
build({targets: Platform.MAC.createTarget(['dmg','zip'], process.arch==='arm64'?Arch.arm64:Arch.x64), config, publish:'never'}).catch(error=>{console.error(error);process.exitCode=1;});
