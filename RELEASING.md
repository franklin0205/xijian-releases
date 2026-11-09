# 息间双端迭代与发布

Windows 和 Mac 共用同一个仓库、源码、版本号与工作流。不要为新功能另建一套只维护 Windows 或只维护 Mac 的源码。

## 每次功能修改

1. 修改 `src/`。平台差异保留在 `process.platform` 分支，Mac 窗口规则放在 `src/main/platform.ts`。
2. 本地执行 `npm run check:version`、`npm run typecheck`、`npm test` 与 `npm run build`。
3. 推送 `main` 或 `feature/**`。GitHub Actions 自动启动 Windows x64、Mac arm64、Mac x64 三项原生构建，各自运行桌面冒烟测试。PR 到 `main` 时也执行。
4. 在 **Build Windows and macOS** 对应运行的 Artifacts 下载测试包。任何目标失败时修复同一份源码，重新推送。

## 创建一个包含双端的版本

只修改一次版本号，`npm version` 会同步更新 `package.json` 和锁文件，例如：

```bash
npm version 0.3.2-rc.2
git push origin main
git push origin v0.3.2-rc.2
```

在主分支操作前应已合并并验证本次功能。正式版可使用 `0.3.2` 等无后缀版本；未完成安装验收前保持 `-rc.N` 候选版。标签必须精确匹配 `v` 加版本号，否则构建会停止。

版本标签触发三个构建任务。全部通过后，工作流将 Windows 安装包与更新文件、两种 Mac 架构的 DMG / ZIP、SHA-256 清单放入一份 Release 草稿。重跑只更新同标签草稿，拒绝修改已经发布的 Release。

草稿中带版本号的 EXE 用于更新，`Xijian-Setup.exe` 是同一文件的固定名称副本，保留现有 README 的下载地址。Mac 两种架构的文件名明确区分，不合并它们的自动更新元数据。

## 发布与安装验收

草稿不面向普通用户，也不会触发已安装应用的更新。确认安装、旧版数据保留、计时与工作计划、托盘/菜单栏、Mac Dock、睡眠恢复与多显示器后，再发布该草稿。

候选版保留 GitHub 的 Pre-release 标记，不替代原有正式版。正式版发布后，Windows 安装版可通过现有更新入口升级。

Mac 目前只有 ad-hoc 签名，没有 Apple Developer ID 签名和公证，仍通过安装包覆盖升级。**双端同步构建不表示 Mac 已支持应用内自动安装更新。** 后续启用 Mac 自动更新时，需要一起补齐正式签名、公证、按架构更新元数据和升级验证。

## 工作流

- 文件：`.github/workflows/build-desktop.yml`
- Windows：`windows-latest`，x64。
- Mac Apple 芯片：`macos-15`，arm64。
- Mac Intel：`macos-15-intel`，x64。
- Node.js：24；依赖由 `npm ci` 按锁文件安装。
- 普通构建使用只读仓库权限；仅标签汇总步骤使用内置 GitHub token 写入 Release 草稿，无需另存个人 token。
- 普通构建产物保留 14 天；发布草稿中的附件独立保存。
