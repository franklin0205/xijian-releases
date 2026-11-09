# 代码恢复来源

用户提供的仓库为 `https://github.com/franklin0205/xijian-releases.git`。拉取时 `main` 只含 README，没有应用源码和构建配置。现有 Windows Releases 未修改。

原始输入：

- Release：`v0.3.1`
- 文件：`Xijian-Setup-0.3.1-x64.exe`
- 大小：100026973 字节
- SHA-256：`9346748aec81e09d16199e266bca078b4d200f4331f1593649dbd3d213564197`
- 安装包内 Electron 版本：43.3.0

未执行 Windows 安装程序。通过 7-Zip 解包并读取 `resources/app.asar`。从以下 source map 的 `sourcesContent` 恢复 `src/` 下 TypeScript 和 CSS：

- `dist/main.cjs.map`：main、updates、store、bounds、engine、work-plans、shared。
- `dist/renderer.js.map`：app、icons、renderer/work-plans、shared、domain/work-plans。
- `dist/renderer.css.map`：style、work-plans、字体声明。

HTML、字体、PNG/SVG/ICO 图标和提示音取自同一安装包。字体许可证原样保留。原 preload 只有编译后的 CommonJS，依据其已有 API 恢复成 TypeScript，并仅新增只读平台名称。

重新补齐 package.json、锁文件、tsconfig、esbuild 构建脚本、测试、macOS 图标与签名配置、CI，以及 Mac 平台适配。这些配置不是声称从缺失的开发仓库逐字恢复。

应用原包标记 `UNLICENSED`，本分支保持该声明，不擅自增加开源授权。首次恢复时源代码及构建配置保存在本地 `feature/macos-adaptation` 分支。后续按项目所有者要求接入同一仓库，统一维护 Windows 与 Mac 源码和自动构建；实际远程提交及发布状态以 GitHub 为准。
