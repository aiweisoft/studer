# AGENTS.md

本文件面向在本仓库中工作的智能编码代理，描述项目约定、运行方式与协作规则。

## 1. 项目概览

- 类型：uni-app 项目，Vue 3 + `<script setup>` 组合式 API。
- 构建工具：HBuilderX（本项目由 HBuilderX 5.24 管理），**仓库内没有 `package.json` / `node_modules` / Vite 配置**，不要尝试 `npm install` 或 `npm run`。
- 应用主题：学习时间管理（学习计划 / 学习科目 / 学习计时 / 学习统计）。
- 数据来源：全部为设备本地存储，无后端、无 uniCloud、无网络请求。
- 语言：界面文案、注释、提交信息统一使用中文。

## 2. 项目结构与模块组织

```
studer/
├── App.vue                     # 应用根组件 + 全局样式（页面背景、button/input 重置）
├── main.js                     # 应用入口，Vue3 createSSRApp
├── pages.json                  # 页面路由 + 全局样式 + 底部 tabBar 配置
├── manifest.json               # 应用标识、平台打包配置（app-plus / mp-weixin 等）
├── uni.scss                    # uni-app 内置 SCSS 变量（一般不改动）
├── index.html                  # H5 模板
├── uni.promisify.adaptor.js    # uni API Promise 化适配器（勿删）
├── utils/
│   └── storage.js              # 唯一的业务数据层：本地存储 CRUD + 统计工具
├── pages/                      # 页面，每个页面一个同名目录
│   ├── index/index.vue         # 「今日」：今日进度、学习计时器、今日记录
│   ├── plan/plan.vue           # 「计划」：学习计划增删改 + 进度
│   ├── subject/subject.vue     # 「科目」：学习科目分类管理
│   └── stats/stats.vue         # 「统计」：周/月/全部学习数据看板
├── static/                     # 静态资源（图片等），路径以 /static 开头引用
└── unpackage/                  # 编译产物与缓存，git 已忽略，勿手动编辑
```

约定：
- 新增页面：`pages/<name>/<name>.vue`，并在 `pages.json` 的 `pages` 与（若需显示）`tabBar.list` 中同步登记。
- 新增数据实体：在 `utils/storage.js` 中扩展，页面不直接调用 `uni.setStorageSync`。
- 静态资源放入 `static/`，页面内用绝对路径 `/static/xxx.png` 引用。

## 3. 构建 / 运行 / 测试命令

本仓库没有自动化测试与 lint 脚本，**不存在「运行单个测试」的命令**。验证方式如下：

- 运行 / 预览：在 HBuilderX 中打开项目后，选择「运行」到目标平台（H5、微信小程序、App 等）。
  也可使用 HBuilderX CLI：`D:\HBuilderX\cli.exe` 打开项目路径后运行。
- 编译产物输出到 `unpackage/`，该目录被 `.gitignore` 忽略，不要提交。
- 修改代码后请在 HBuilderX 控制台确认无报错，并检查目标平台页面行为。
- 涉及数据层的改动，至少手动验证：新增 → 列表刷新 → 重启应用后数据仍在。

代理在完成任务后，**无需也不能**运行 `npm test` / `npm run lint` 等命令；改为说明需要在 HBuilderX 中人工验证的步骤。

## 4. 代码风格与协作规则

### 4.1 导入（imports）

- Vue 响应式 API（`ref` / `computed` / `watch` / `onMounted` 等）从 `vue` 导入。
- **uni-app 页面生命周期（`onLoad` / `onShow` / `onHide` / `onUnload` / `onPullDownRefresh` 等）必须从 `@dcloudio/uni-app` 导入**，不要从 `vue` 导入，否则 H5 会报 “does not provide an export named 'onShow'”。
- 业务数据函数从 `utils/storage.js` 具名导入，路径使用相对路径（如 `../../utils/storage`）。
- 不使用未声明的依赖；本项目无第三方 UI 库，优先使用内置组件（`view` / `text` / `input` / `picker` / `button` / `image`）。

### 4.2 组件与状态

- 统一使用 `<script setup>`，`ref` 存可变状态，`computed` 存派生数据。
- 页面数据在 `onShow` 中重新加载，保证从其他 tab 返回时列表/统计是最新的。
- 计时器等需要清理的资源，在 `onUnload` 中 `clearInterval`，避免内存泄漏。
- 组件模板保持简洁，复杂逻辑放到 `methods`/函数中。

### 4.3 命名

- 页面目录与文件名：小写单词，如 `plan`、`subject`。
- 变量与函数：小驼峰（`selectedSubjectId`、`loadRecords`）。
- 常量：大写下划线（`KEYS.PLANS`）。
- 布尔值以 `is` / `has` / `show` 等开头（`timerRunning`、`showForm`）。
- 事件处理函数以 `on` 开头（`onSubjectChange`），业务动作以动词开头（`startTimer`、`confirmPlan`）。

### 4.4 样式

- 使用 `<style>`（非 scoped）配合页面根类名（`.`）隔离；单位统一使用 `rpx`。
- 主题色：主色 `#667eea`，渐变 `linear-gradient(135deg, #667eea, #764ba2)`；成功/危险色沿用 `#2ecc71` / `#e74c3c`。
- 卡片风格：白底 + `border-radius: 16rpx` + 轻微阴影，页面背景 `#f5f7fa`。
- **H5 兼容硬约束：不要给 `input` / `textarea` 设置 `box-sizing: border-box`**（无论在全局、页面还是行内样式），否则可能导致输入框无法聚焦或无法输入。

### 4.5 数据层（utils/storage.js）

- 存储键统一加前缀 `studer_`，集中定义在 `KEYS` 对象中。
- 对外暴露具名函数：`getXxx` / `saveXxx` / `deleteXxx` / `getRecordsByRange` 等；`saveXxx` 对新增（无 `id`）自动生成 `id` 与 `createdAt`。
- 数据以 JSON 字符串存入 `uni.getStorageSync` / `uni.setStorageSync`，读取失败时返回空数组，不抛出异常。
- 时长统一以「秒」为单位存储，展示时用 `formatDuration` / 除以 3600 换算。

### 4.6 错误处理与用户反馈

- 表单校验失败用 `uni.showToast({ title, icon: 'none' })` 提示，并 `return` 中断。
- 删除等破坏性操作先用 `uni.showModal` 二次确认，确认后再执行。
- 成功操作用 `uni.showToast({ icon: 'success' })` 反馈。
- 不在代码中硬编码、打印或提交任何密钥/凭证。

### 4.7 提交与变更

- 仅在用户明确要求时创建 git 提交；不要主动提交或推送。
- 提交信息使用中文，简明描述「为什么」改。
- 不要编辑 `unpackage/`、`node_modules/`（不存在）及 `uni.promisify.adaptor.js`。
