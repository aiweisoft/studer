# Studer · 学习时间管理

一款基于 uni-app 的学习时间管理应用，帮助你安排学习计划、记录学习时间、管理学习科目并查看学习统计。

## 功能特性

| 模块 | 说明 |
| --- | --- |
| 今日 | 今日学习进度、学习计时器（选择科目 + 记录内容）、今日学习记录列表 |
| 计划 | 学习计划的增删改查，设置起止日期与每日目标，自动计算完成进度 |
| 科目 | 学习科目分类管理，支持自定义颜色标记，展示今日与累计学习时长 |
| 统计 | 支持「本周 / 本月 / 全部」切换，展示学习天数、总时长、日均时长、各科目时长分布与每日明细 |

## 技术栈

- uni-app（Vue 3 + `<script setup>` 组合式 API）
- HBuilderX 5.24
- 数据存储：`uni.setStorageSync` / `uni.getStorageSync` 本地存储，无后端、无网络请求
- 无第三方 UI 库，使用 uni-app 内置组件

## 项目结构

```
studer/
├── App.vue                     # 应用根组件 + 全局样式
├── main.js                     # 应用入口（Vue3 createSSRApp）
├── pages.json                  # 页面路由 + 全局样式 + 底部 tabBar
├── manifest.json               # 应用标识与平台打包配置
├── uni.scss                    # uni-app 内置 SCSS 变量
├── index.html                  # H5 模板
├── uni.promisify.adaptor.js    # uni API Promise 化适配器
├── utils/
│   └── storage.js              # 业务数据层：本地存储 CRUD + 统计工具
├── pages/
│   ├── index/index.vue         # 「今日」
│   ├── plan/plan.vue           # 「计划」
│   ├── subject/subject.vue     # 「科目」
│   └── stats/stats.vue         # 「统计」
├── static/                     # 静态资源
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
- 时长统一以「秒」为单位存储，展示时通过 `formatDuration` 换算。

## 开发约定

详见 [AGENTS.md](./AGENTS.md)。

## License

MIT
