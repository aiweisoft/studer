# Studer · 学习时间管理

一款基于 uni-app 的学习时间管理应用，帮助你安排学习计划、专注计时、管理学习科目并查看学习统计。

## 功能特性

| 模块 | 说明 |
| --- | --- |
| 今日 | **番茄钟倒计时**：可选 15/25/45/60 分钟或自定义 1–60 分钟；选择科目并填写学习内容（必填）后开始。倒计时结束或手动结束时保存记录，并以**应用内弹窗 + 震动**提醒。展示今日已学时长（秒/分/小时自适应）、**今日学习目标**（依据进行中的计划汇总每日目标，显示已完成/目标、进度条与「还需学习」剩余时长）与今日记录（科目 + 内容 + 时长） |
| 计划 | 学习计划增删改查，设置起止日期与每日目标，自动计算完成进度；支持**一键导入推荐计划**（小学生 / 中学生 / 高中生 / 大学生 / 上班族 5 类人群，含预置科目与计划） |
| 科目 | 学习科目分类管理，支持自定义颜色标记，展示今日与累计学习时长 |
| 统计 | 支持「今日 / 本周 / 本月 / 全部」切换，展示学习天数、累计时长、日均时长、记录次数、近 7 天趋势、各科目时长分布与每日明细（日期徽章 + 相对进度条） |

## 技术栈

- uni-app（Vue 3 + `<script setup>` 组合式 API）
- HBuilderX 5.24
- 数据存储：`uni.setStorageSync` / `uni.getStorageSync` 本地存储，无后端、无网络请求
- 无第三方 UI 库，使用 uni-app 内置组件
- 底部 tabBar 使用本地 PNG 图标（`static/tabbar/`）

## 项目结构

```
studer/
├── App.vue                     # 应用根组件 + 全局样式
├── main.js                     # 应用入口（Vue3 createSSRApp）
├── pages.json                  # 页面路由 + 全局样式 + 底部 tabBar（图标 + 文字）
├── manifest.json               # 应用标识与平台打包配置
├── uni.scss                    # uni-app 内置 SCSS 变量
├── index.html                  # H5 模板
├── uni.promisify.adaptor.js    # uni API Promise 化适配器
├── utils/
│   ├── storage.js              # 业务数据层：本地存储 CRUD + 统计/时间工具
│   └── presets.js              # 5 类人群的推荐学习计划模板
├── pages/
│   ├── index/index.vue         # 「今日」：番茄钟倒计时 + 今日概览与记录
│   ├── plan/plan.vue           # 「计划」：计划管理 + 推荐计划导入
│   ├── subject/subject.vue     # 「科目」：科目分类管理
│   └── stats/stats.vue         # 「统计」：今日/本周/本月/全部数据看板
├── static/
│   ├── tabbar/                 # tabBar 图标（普通 + 选中态，各 4 个）
│   └── logo.png
└── unpackage/                  # 编译产物（git 已忽略）
```

## 运行方式

本项目由 HBuilderX 管理，仓库内没有 `package.json`，无需 `npm install`。

1. 使用 HBuilderX 打开项目根目录。
2. 选择「运行」到目标平台：
   - H5：运行到浏览器
   - 微信小程序：运行到小程序模拟器（需在 `manifest.json` 配置 AppID）
   - App：运行到手机或模拟器
3. 编译产物输出到 `unpackage/`，该目录不会提交到仓库。

也可使用 HBuilderX CLI 打开项目：

```shell
D:\HBuilderX\cli.exe
```

## 数据存储

- 所有数据保存在设备本地，卸载应用或清除缓存会丢失数据。
- 存储键统一以 `studer_` 为前缀，集中定义在 `utils/storage.js` 的 `KEYS` 中。
- 时长统一以「秒」为单位存储，展示时通过 `formatDuration` / 自适应单位换算。
- 一周以**周一**为起点；日期区间（今日/本周/本月/全部）由 `utils/storage.js` 计算。

## 开发约定

详见 [AGENTS.md](./AGENTS.md)。

## License

MIT
