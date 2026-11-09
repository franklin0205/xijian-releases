# xijian-releases
PC桌面小组件，番茄钟、工作计划...

## 下载与安装

[下载最新版息间 Windows x64 安装包](https://github.com/franklin0205/xijian-releases/releases/latest/download/Xijian-Setup.exe)

下载后双击安装，完成后从桌面或开始菜单打开「息间」。使用过目录版的设备，先从托盘退出旧版再安装。

首次使用可在计时卡片底部开启健康提醒，在设置中调整专注、喝水和休息节奏，点清单图标记录工作计划。

## 后续更新

安装版会检查新版本。收到提示后，可从托盘菜单或「设置 → 桌面与通知」下载更新，再选择重启安装。设置、工作计划和记录保存在本机，升级时沿用。

也可以重新下载最新版安装包，双击进行覆盖升级。

[查看版本记录](https://github.com/franklin0205/xijian-releases/releases)

当前安装包尚未签名，Windows可能显示发布者验证提示。

## Windows / macOS 统一候选版 · 0.3.2-rc.1

本项目从 Windows 0.3.1 安装包内的 source map 恢复应用源代码，并补齐构建配置。保留原有番茄钟、健康提醒、迷你模式与工作计划，新增 Mac 菜单栏倒计时、原生快捷键、单色 Retina 菜单栏图标和多桌面支持。

支持 macOS 12 或以上，分别构建 Apple Silicon（arm64）和 Intel（x64）应用。尚未完成 Mac 真机验收与 Apple 开发者签名/公证，不能视为正式发行版。

安装、开发与验证说明见 [MACOS.md](MACOS.md)，代码恢复来源见 [SOURCE_RECOVERY.md](SOURCE_RECOVERY.md)。

```bash
npm ci
npm run typecheck
npm test
npm start
```

## 双端同步迭代

Windows 与 Mac 共用 `src/` 和 `package.json` 中的版本号，平台差异由运行时判断。当前 `0.3.2-rc.1` 包含 Mac `0.3.2-mac.2` 的 Dock 修复，并统一为双端候选版。

推送到 `main` 或 `feature/**` 后，**Build Windows and macOS** 自动执行以下三个原生任务；提交到 `main` 的 PR 也会触发检查：

| 目标 | 原生测试与产物 |
| --- | --- |
| Windows x64 | 类型检查、核心测试、桌面冒烟测试、NSIS EXE 与更新文件 |
| Mac Apple 芯片 | 同样的检查与测试、arm64 DMG / ZIP、原生签名验证 |
| Mac Intel 芯片 | 同样的检查与测试、x64 DMG / ZIP、原生签名验证 |

普通提交的包在 [Actions](https://github.com/franklin0205/xijian-releases/actions/workflows/build-desktop.yml) 对应运行的 Artifacts 下载，保留 14 天。推送与版本号匹配的 `v*` 标签后，必须三个目标全部成功，才创建包含全部安装包、Windows 更新文件和 SHA-256 清单的同一份 **Release 草稿**。已发布版本不会被自动覆盖。

后续只维护一套代码、一次版本号，见 [RELEASING.md](RELEASING.md)。自动构建与应用内自动升级是两回事：Mac 目前仍通过重新安装升级；Windows 保留原有应用内更新。
