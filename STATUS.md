# 希望之峰 — 项目状态

> 更新于 2026-08-16。跨会话续作先读这个 + `docs/2026-08-16-希望峰学园-design.md`。（原名"希望峰学园"，大张 2026-08-16 改为**希望之峰**）

## 在线状态
- 网址：https://seven7776.github.io/kibogamine/ （GitHub Pages，仓库 seven7776/kibogamine，**公开仓**，master 根目录）
- **APK**：`C:\Users\z\kibogamine-twa\希望之峰.apk`（TWA 封装 1.7MB，packageId `io.github.seven7776.kibogamine`，orientation=any 支持平板横屏），已发微信
- TWA 工程：`C:\Users\z\kibogamine-twa\`（复制 xiaotiandi-twa 改的，签名密钥库同语儿 App：android.keystore / alias android / pass Xtd@2026app）
- **assetlinks 已配**：新仓 seven7776/seven7776.github.io（根域 Pages）放了 .well-known/assetlinks.json（含 kibogamine + xiaotiandi 两个包名，同一证书）→ TWA 真全屏无地址栏
- v2.1 已上线：3D 黑白熊 + 华为平板适配；v4 sw
- v2.2（2026-08-20）：牙齿去塑料感（暖白哑光 #F3EEDF + 圆头胶囊牙 + 每颗明度差/错落），sw bump v5；APK 重打：**fallbackType 改 webview**（鸿蒙无 Chrome 时 customtabs 兜底打不开的根因），v1+v2+v3 签名，旧版备份 `希望之峰-v1-customtabs-备份.apk`

## 技术要点
- 纯前端：index.html + styles.css + **three.min.js(r152 UMD)** + **pet3d.js(3D引擎)** + data.js（课程数据）+ app.js（主程序）
- localStorage key：`kibogamine-v1`；无后端，备份=设置页导出JSON
- 黑白熊3D：pet3d.js 程序化建模——MeshStandardMaterial+onBeforeCompile shader 按局部x半白半黑；红斜眼=自定义Extrude楔形；咧嘴=7颗白牙弧线排布+深口腔底；左白右黑圆耳；白肚皮+X扣。9姿态(idle呼吸眨眼/walk/sit/sleep/happy/giggle/angry/eat/back)+9皮肤(调色板+配件mesh：领带/草裙/泳圈4段torus/草帽)。静帧走共享离屏渲染器(logo+皮肤缩略图)，活动画=独立stage(溜达熊+房间熊)
- 像素版备份：docs/dev/pet-pixel-backup.js
- PWA：manifest + sw.js（缓存名 kibogamine-v2，**改代码部署必须 bump 版本号**）
- 图标：docs/dev/icon.html（3D静帧）Edge 无头截图生成
- 调试：docs/dev/pet3d-test.html（全姿态/皮肤预览）；**Edge 无头截图有 Windows 125% 缩放坑**：window-size=目标CSS宽度×1.25；headless WebGL 可用（SwiftShader）

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
- **源远主力设备=华为平板（2026-08-16 大张确认）**：v2.1 已适配——补 mobile-web-app-capable meta（鸿蒙加到主屏）、横屏左侧导航已验证（≥760px 生效）、息屏/切后台停止 3D 渲染省电。鸿蒙若商店浏览器加不到主屏，改用华为自带浏览器或装 Chrome
