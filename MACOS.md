# 息间 macOS 适配测试版

当前统一版本：0.3.2-rc.1（包含 0.3.2-mac.2 的修复）；基于 Windows 0.3.1；Electron 43.3.0。

## 本次修复

0.3.2-mac.2 修复已有计时窗口但 Dock 不显示图标的问题。原因为旧版启用了 `visibleOnFullScreen: true`，Electron 43.3.0 在 macOS 上因此隐藏 Dock。现在明确使用普通应用模式并保留 Dock，计时窗口与提醒只跟随普通桌面。增加启动、迷你模式、隐藏窗口、提醒弹出、Dock 再激活的 Mac 冒烟测试断言；这些原生断言仍待 Mac runner 执行。

替换前请从屏幕顶部「息间」菜单选择退出。将新版复制到系统「应用程序」并替换旧版，本机设置和工作计划无需迁移。Finder 中可用 ⌘⇧A 打开「应用程序」文件夹。

## 下载包选择与安装

| 电脑 | 测试包 |
| --- | --- |
| Apple 芯片（M 系列） | `Xijian-0.3.2-rc.1-mac-arm64.zip` |
| Intel 芯片 | `Xijian-0.3.2-rc.1-mac-x64.zip` |

最低系统要求为 macOS 12 Monterey。可在苹果菜单 → 关于本机查看芯片和系统版本。

1. 解压对应 ZIP，将「息间.app」拖入「应用程序」。
2. 从「应用程序」打开「息间」。
3. 若系统提示无法验证开发者，在尝试打开后进入系统设置 → 隐私与安全性，查看是否有「仍要打开」。只在确认是本次下载的测试包时允许。不要关闭整个系统的安全检查。

这是开发测试包。它使用 ad-hoc 本地签名，没有 Apple Developer ID 签名，也没有经过 Apple 公证。Linux 环境无法验证 Gatekeeper 和 Mac 启动结果。如果显示「已损坏」或打开即退出，不要假设安装成功；应通过下文 Mac 构建步骤重新构建并检查签名。

## 使用

- 保留原有完整计时卡片、迷你模式、专注/短休息/长休息、健康提醒、今日统计和工作计划。
- 屏幕顶部菜单栏显示倒计时；暂停或电脑休眠时加上暂停标记。点击图标打开功能菜单。
- 计时组件和提醒窗口跟随普通 Spaces；不再强制覆盖其他应用的全屏桌面。Electron 43.3.0 的全屏覆盖实现会调用 DockHide，造成上一版 Dock 图标消失。此版保留普通 Mac 应用身份，启动时显示 Dock 图标；点击可找回计时组件，右键可打开设置和工作计划。多显示器与 Stage Manager 仍需真机验证。
- 关闭计时组件只隐藏窗口；Dock 图标和菜单栏操作均可重新显示。明确退出会保存数据并停止计时。
- 保留原来休眠/锁屏期间暂停计时、恢复后延迟健康提醒的规则。
- 设置与记录位于 `~/Library/Application Support/息间/`；升级时保持该目录。
- Mac 测试版使用重新安装的方式升级。不会下载 Windows EXE 更新，也不会清除本机数据。

| 快捷键（息间窗口激活时） | 操作 |
| --- | --- |
| ⌘ , | 设置 |
| ⌘ Return | 开始 / 暂停计时 |
| ⌘ ⇧ M | 切换迷你模式 |
| ⌘ ⇧ P | 工作计划 |
| ⌘ W | 关闭当前窗口；计时组件仅隐藏 |
| ⌘ Q | 保存并退出 |
| ⌘ C / V / X / A / Z | 标准编辑操作 |

## 在 Mac 上构建

安装 Node.js 24 与 Xcode Command Line Tools 后，在项目目录运行：

```bash
npm ci
npm run typecheck
npm test
npm run test:smoke
npm run dist:mac -- --config.mac.identity=- --config.mac.entitlements=build/entitlements.adhoc.plist --config.mac.entitlementsInherit=build/entitlements.adhoc.plist
```

`release/` 会得到两个架构的 DMG 和 ZIP。`test:smoke` 需要有登录桌面的 Mac，会使用独立临时数据目录，不触碰真实工作计划。

仓库附带 `.github/workflows/build-desktop.yml`。推送 `main` / `feature/**` 后，**Build Windows and macOS** 同时在 Windows x64、Mac arm64 和 Mac Intel 原生 runner 上运行类型检查、核心测试、桌面冒烟测试与打包；Mac 另执行 `codesign --verify --deep --strict`。版本标签会在三个目标全部通过后创建统一 Release 草稿，具体见 [RELEASING.md](RELEASING.md)。工作流配置存在不等于远程构建已通过，应以 Actions 实际结果为准。

正式发行需使用自己的 Apple Developer ID 证书并配置 Apple 公证。正式签名使用 `build/entitlements.mac.plist`；ad-hoc 测试签名才使用允许加载无 Team ID 库的 `build/entitlements.adhoc.plist`。没有证书与公证的测试包不能宣称为系统已信任的正式版本。

## 0.3.2-mac.2 本地验证记录与限制

- TypeScript 类型检查通过，所有运行资源成功构建。
- 11 项核心测试通过：专注完成、睡眠/锁屏重叠暂停、重启恢复、健康提醒恢复宽限、多显示器边界、Mac 窗口规则、菜单栏时间格式、工作计划落盘、损坏备份恢复、新版数据只读保护、Mac 禁止自动更新。
- 两个架构的 `.app` 已打包；包含原界面、字体、图标、音效与隔离 preload。
- 在 Linux 上使用 `rcodesign 0.29.0` 对两个应用包及嵌套 Mach-O 生成 ad-hoc 签名。该工具的 `verify` 对这些签名返回 CMS 错误，并明确提示验证功能存在已知问题。因此**未取得完整签名验证通过的结论**，必须以 Mac 的 `codesign --verify --deep --strict` 为准。
- Electron 桌面冒烟测试在当前宿主环境被本地 socket 限制阻断，未执行完成。未验证 Mac 真机启动、原生快捷键、菜单栏显示、通知声音、实际休眠、Retina、多显示器、全屏与系统安装拦截。
- 如需重新生成 Linux 上的试用 ZIP，先运行 `npm run pack:mac -- --config.mac.identity=null`，再使用 `scripts/package-mac-test.py --rcodesign /absolute/path/to/rcodesign`。此路径仍需 Mac 验收。

参考文档：[Electron Tray](https://www.electronjs.org/docs/latest/api/tray)、[Electron BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window)、[electron-builder macOS](https://www.electron.build/v26/docs/mac/)、[apple-codesign](https://github.com/indygreg/apple-platform-rs)。
