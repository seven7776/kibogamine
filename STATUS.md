# 希望峰学园 — 项目状态

> 更新于 2026-08-16。跨会话续作先读这个 + `docs/2026-08-16-希望峰学园-design.md`。

## 在线状态
- 网址：https://seven7776.github.io/kibogamine/ （GitHub Pages，仓库 seven7776/kibogamine，**公开仓**，master 根目录）
- v1.0 已上线（2026-08-16）：五大页面 + 像素黑白熊引擎 + 积分 + 课表 + 打卡

## 技术要点
- 纯前端：index.html + styles.css + pet.js（像素引擎）+ data.js（课程数据）+ app.js（主程序）
- localStorage key：`kibogamine-v1`；无后端，备份=设置页导出JSON
- 黑白熊：pet.js 手绘 18×19 像素帧（11帧动作+9皮肤），canvas 渲染；改皮肤改 SKINS/OVERLAYS
- PWA：manifest + sw.js（缓存名 kibogamine-v1，**改代码部署必须 bump 版本号**）
- 图标：docs/dev/icon.html 渲染后 Edge 无头截图生成
- 调试：docs/dev/pet-test.html（全帧/皮肤预览）；**Edge 无头截图有 Windows 125% 缩放坑**：window-size=目标CSS宽度×1.25

## 内容进度
- 语文（部编五上）：8单元27课目录齐；第1-3课（白鹭/落花生/桂花雨）完整内容
- 数学（苏教五上）：9单元目录齐；第一单元2课完整内容
- 英语（译林5A）：8单元目录齐；Unit1 前2课完整内容
- 课表：预填四(8)班课表占位，开学换五年级新课表（用户手动改）
- 课外班：用户自加

## 待办（滚动）
- [ ] 学习内容持续填充（优先语文4-8课、数学第二单元、英语U1后2课）
- [ ] 黑白熊更多动作细化（happy帧可加跳跃位移）
- [ ] 课外班到点提醒（需通知权限，PWA 通知 or 暂缓）
- [ ] TWA APK（链路见 memory twa-apk-build-chain）
- [ ] 源远实际使用后的反馈调整

## 关键决策记录
- 名字：希望峰学园（弹丸论破梗，大张批准）；备选"超高校级小天地"未用
- 积分=黑白熊奖章（官方设定货币）；先赚后花
- 仓库公开：GitHub 免费计划私有仓无 Pages，代码无密钥故公开（与 xiaotiandi 同模式）
