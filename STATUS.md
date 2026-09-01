# 希望之峰 — 项目状态

> 更新于 2026-08-23。跨会话续作先读这个 + `docs/2026-08-16-希望峰学园-design.md`。（原名"希望峰学园"，大张 2026-08-16 改为**希望之峰**）

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
- **2026-09-01晚 教材大换版适配（sw v40）**：2026秋是新课标教材三年换版收官年，语数英三科五上全部换新版（语文换近10篇课文/数学苏教新课标版/英语译林5A新版旧版停用）。三科 CURRICULUM+PAGES(67条) 已全量切 2026 版电子课本（dzkbw xs5s_2026/5a_2026，PC新版目录页有静态链接直接钉页码）：
  - 语文 37 条：28 条旧内容迁移（含落花生公版全文/生字表）+ 8 条新增课文骨架（诺曼底号/梅兰芳蓄须/金字塔/航天员的信/第一场雪/走遍天下书为侣/习作故事新编/习作我最喜爱的季节）+ 古诗词三首第三首换《早春呈水部张十八员外》注记
  - 数学 20 条：新 8 单元结构；面积/统计/小数乘除/字母表示 4 组旧内容迁移对位，图形的运动/可能性/因数与倍数/观察物体/4个☆综合实践/期末复习为骨架
  - 英语 10 条：新 8U+2P 全骨架（Good habits…We love festivals），新语法预告 there be/频率副词/三单
  - **待滚动**：新增课文+数学新单元+英语全科的预习/生字/知识点/练习深度填充；科学/道法/音乐/美术/信息/劳动 6 科结构保留旧版待核对（dzkbw 已挂苏教科学 5s_2026）
- **2026-08-23 全量填充完成**：85 课全部有内容（预习任务+词语/单词+知识点+练习），skeleton 清零
  - 语文（部编五上）40 课：精读课含逐课写字表（来源：知乎组词版逐课核对）；古诗课全文+诗意；略读/口语/习作为学习支架
  - 数学（苏教五上）27 课：公式+易错点+自编例题（答案已验算）
  - 英语（译林5A）18 课：单词表逐单元核对（来源：搜狐2017版单词汇总）+语法点+练习
  - ⚠️ 现代文课文全文未收录（版权+准确性，按"内容概括+结构写法+关键句+课后题"编排）；源远对照纸质课本使用
  - **2026-08-23 晚补充**：大张要求全部收录现代文全文——未整册搬运（公开仓 DMCA 连坐整个 Pages，是硬红线）。改做两件事：
    - 公版课文全文收录：落花生（许地山1941年卒，公有领域；文字按腾讯文库课本版转录核对，尾段按通行引用）、少年中国说（梁启超1929年卒，古文岛核验）。app.js 新增 fullText 渲染（课文全文区块）
    - 三科学科页新增"📖 看电子课本"按钮 → dzkbw 电子课本网对应课本页（语文 rjb/yuwen/xs5s_2019、数学 sjb/shuxue/xs5s、英语 yilin/yingyu/5a，均验证 200）；官方源 https://basic.smartedu.cn/elecEdu
    - **逐课"📖 课本原文"链接**（2026-08-23 深夜第三轮）：85/85 课全部挂上 m.dzkbw.com 手机版电子课本页（语文 40 课逐条对页码；数学按单元起始页 004/010/033/051/058/087/097/102/113，逐个 title 实测钉死；英语按单元起始页 008-080）。入口两处：课文列表行尾 📖 图标（stopPropagation 直接开书）+ 课文详情页全宽按钮。PC 版 dzkbw 目录无静态链接（JS 渲染），手机版才有——坑记住了
    - sw v8
- 课表：**五(8)班新表 OCR 校正版上线（2026-09-01，sw v39）**——每天 6 节（上午3+下午3）+ 节次时间同步换新；⚠️ 当天 v38 为视觉直读手写表，整表读错当天即废（教训：表格图片一律 RapidOCR 坐标重建，不靠视觉直读）；迁移 scheduleVer→3（比对 SCHEDULE_2025_4TH / SCHEDULE_2026_V38 两张废表）；转录+原图存档 `docs/2026-09-01-五上课表与作息/`
- 课外班：用户自加

## 待办（滚动）
- [ ] 生字"词语积累"部分按模型知识+组词整理，开学后对照课本词语表抽查（写字表已逐课核对）
- [ ] 源远实际使用后的反馈调整（内容深浅/题目难度）
- [ ] 黑白熊更多动作细化（happy帧可加跳跃位移）
- [ ] 课外班到点提醒（需通知权限，PWA 通知 or 暂缓）
- [ ] TWA APK（链路见 memory twa-apk-build-chain）
- [ ] 源远实际使用后的反馈调整

## 关键决策记录
- 名字：希望峰学园（弹丸论破梗，大张批准）；备选"超高校级小天地"未用
- 积分=黑白熊奖章（官方设定货币）；先赚后花
- 仓库公开：GitHub 免费计划私有仓无 Pages，代码无密钥故公开（与 xiaotiandi 同模式）
- **源远主力设备=华为平板（2026-08-16 大张确认）**：v2.1 已适配——补 mobile-web-app-capable meta（鸿蒙加到主屏）、横屏左侧导航已验证（≥760px 生效）、息屏/切后台停止 3D 渲染省电。鸿蒙若商店浏览器加不到主屏，改用华为自带浏览器或装 Chrome

---
相关: [[2026-08-16-希望峰学园-design]]
