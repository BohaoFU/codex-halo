# Changelog / 更新记录

## 1.4.0

- Replace the outer weekly progress orbit and bubble particles with a clean glass sphere.
- Add broad highlights, soft edge shading and a single continuous inset optical edge.
- Render at the actual Windows pixel scale to avoid resampling artifacts; keep weekly quota inside the sphere.
- Keep the standalone widget as the main experience; the native plugin trial is discontinued.

- 移除球外每周进度弧与气泡粒子，改为干净通透的玻璃球。
- 使用柔和高光、内缘阴影和连续玻璃边缘，减少杂点和生硬描边。
- 按 Windows 实际像素缩放绘制，减少缩放毛边；每周额度继续显示在球内。
- 回到独立悬浮球方案，停止原生插件试验。

## 1.3.0

- Remove the orb's entire hover toolbar; use right-click and the tray for commands.
- Reduce the orb diameter to 104px and remove the empty strip below it.
- Smoothly dock to the nearest left/right edge on release, preserve height and remember position.
- Keep the orb inside the display work area across multi-monitor and display changes.

- 删除球下方的整排悬停按钮，操作统一放在右键和托盘。
- 球体缩至 104px，并去掉底部多余区域。
- 松手平滑吸附左右边缘，保留高度、记住位置。
- 支持多显示器及工作区边界，避免遮挡任务栏或移出屏幕。

## 1.2.0

- Launch at sign-in defaults on for new installs, with a quiet tray-only start until Codex runs.
- Check the Codex desktop process every 3 seconds; hide the widget and pause polling on exit, restore it on restart.
- Distinguish the Store desktop's ChatGPT.exe from ordinary ChatGPT and Halo's own Codex CLI.
- Respect manual hiding; provide bilingual follow/status controls in settings.

- 新安装默认开机启动，Codex 未运行时仅保留托盘。
- 约每 3 秒检测客户端，退出时隐藏并暂停轮询，重开后自动恢复。
- 区分桌面客户端 ChatGPT.exe、普通 ChatGPT 和自身后台 CLI。
- 保留手动隐藏，设置中增加中英文跟随开关与检测状态。

## 1.1.0

- Compact 124px orb with the weekly percentage inside the circle.
- Automatic Windows language detection, with Chinese and English overrides.
- Localized widget, settings, tray menus, reset countdowns and connection messages.
- Unified double-wave app and tray icon.
- Transparent gradient waves, corner panel, automatic refresh and optional startup.

---

- 悬浮球缩至 124px，每周剩余移进圆内。
- 自动检测 Windows 语言，支持中文及 English 手动切换。
- 界面、设置、托盘、倒计时和连接提示完成中英文适配。
- 窗口与托盘统一为双波纹图标。
- 支持透明渐变水波、右下角面板、自动刷新和可选开机启动。
