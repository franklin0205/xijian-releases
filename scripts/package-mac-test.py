"""Package already-built Mac apps without losing framework symlinks or Unix modes.

Requires npm run pack:mac first and an independently obtained rcodesign executable.
This produces ad-hoc test builds, not notarized distributions.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import plistlib
import stat
import subprocess
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('--rcodesign', required=True, type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'package.json').read_text())['version']
out = root / 'release'
checksums = []

def add_tree(archive, app):
    archive.write(app, app.name + '/')
    for current, dirs, files in os.walk(app, followlinks=False):
        for name in dirs + files:
            file = Path(current) / name
            relative = file.relative_to(app.parent).as_posix()
            mode = file.lstat().st_mode
            if stat.S_ISLNK(mode):
                info = zipfile.ZipInfo(relative)
                info.create_system = 3
                info.external_attr = mode << 16
                archive.writestr(info, os.readlink(file))
            elif stat.S_ISDIR(mode):
                archive.write(file, relative + '/')
            else:
                archive.write(file, relative)

for arch, directory, cpu in [('arm64', 'mac-arm64', 0x100000c), ('x64', 'mac', 0x1000007)]:
    app = out / directory / '息间.app'
    info = plistlib.loads((app / 'Contents/Info.plist').read_bytes())
    assert info['CFBundleIdentifier'] == 'com.xijian.desktop'
    assert info['CFBundleShortVersionString'] == version
    executable = app / 'Contents/MacOS' / info['CFBundleExecutable']
    with executable.open('rb') as stream:
        header = stream.read(8)
    assert header[:4] == bytes.fromhex('cffaedfe')
    assert int.from_bytes(header[4:8], 'little') == cpu
    assert os.access(executable, os.X_OK)
    for link in app.rglob('*'):
        if link.is_symlink():
            assert link.exists(), f'Broken framework link: {link}'
    entitlements = str(root / 'build/entitlements.adhoc.plist')
    sign_args = [str(args.rcodesign.resolve()), 'sign',
                 '--entitlements-xml-file', entitlements,
                 '--code-signature-flags', 'runtime', '--timestamp-url', 'none']
    # Explicit bundle paths are required by rcodesign 0.29; a literal 'main:'
    # scope silently fails to apply these settings to Electron's app/helper apps.
    helper_apps = [item for item in app.rglob('*.app') if not item.is_symlink()]
    for helper in helper_apps:
        scope = helper.relative_to(app).as_posix()
        sign_args.extend(['--entitlements-xml-file', f'{scope}:{entitlements}',
                          '--code-signature-flags', f'{scope}:runtime'])
    subprocess.run(sign_args + [str(app)], check=True)
    for bundle in [app] + helper_apps:
        bundle_info = plistlib.loads((bundle / 'Contents/Info.plist').read_bytes())
        binary = bundle / 'Contents/MacOS' / bundle_info['CFBundleExecutable']
        details = subprocess.check_output([str(args.rcodesign.resolve()), 'print-signature-info', str(binary)], text=True)
        assert 'ADHOC | RUNTIME' in details, f'Missing hardened runtime: {binary}'
        assert 'com.apple.security.cs.allow-jit' in details, f'Missing JIT entitlement: {binary}'
        assert 'com.apple.security.cs.disable-library-validation' in details, f'Missing ad-hoc library entitlement: {binary}'
    archive_path = out / f'Xijian-{version}-mac-{arch}.zip'
    with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        add_tree(archive, app)
        archive.writestr('安装说明.txt',
            f'息间 {version} macOS {arch} 测试版\n\n'
            '要求 macOS 12 或更高版本。\n'
            '「息间」就是应用，Finder 可能隐藏 .app 后缀。\n'
            '先从旧版顶部菜单栏选择「退出息间」，再复制新版「息间」。\n'
            '在 Finder 按 ⌘⇧A 打开系统「应用程序」文件夹，粘贴并选择替换，然后打开。\n'
            '0.3.2-mac.2 修复底部 Dock 图标消失，点击 Dock 图标可重新显示计时窗口。\n'
            '未完成 Mac 真机验证，没有 Apple 开发者签名与公证。\n'
            '若提示无法验证开发者，可在尝试启动后前往「系统设置 → 隐私与安全性」查看「仍要打开」。\n'
            '若提示已损坏或打开即退出，请反馈错误并改用 Mac 本地构建；不要关闭系统安全保护。\n'
            '计时与提醒、工作计划、迷你模式均保留，菜单栏新增倒计时。\n'
            '关闭窗口会继续计时，可从 Dock 或顶部菜单栏重新显示；⌘Q 保存并退出。\n'
            '数据：~/Library/Application Support/息间/\n'
            '当前测试版通过重新安装升级，不会下载 Windows 更新。\n\n'
            '详细验证范围和签名限制请参阅同包 MACOS.md。\n')
        archive.write(root / 'MACOS.md', 'MACOS.md')
    with zipfile.ZipFile(archive_path) as archive:
        assert archive.testzip() is None
        executable_info = archive.getinfo('息间.app/Contents/MacOS/息间')
        assert executable_info.external_attr >> 16 & 0o111
        for item in archive.infolist():
            if stat.S_ISLNK(item.external_attr >> 16):
                assert archive.read(item).decode()
    digest = hashlib.file_digest(archive_path.open('rb'), 'sha256').hexdigest()
    checksums.append(f'{digest}  {archive_path.name}')
    print(f'Packaged {archive_path.name} ({archive_path.stat().st_size} bytes)', flush=True)
(out / 'SHA256SUMS.txt').write_text('\n'.join(checksums) + '\n')
