# My Write Assistant

AI 驱动的写作助手，帮助你收集素材、整理思路、高效创作。

## ✨ 功能特性

- 📝 **富文本编辑器** - 基于 TipTap，支持 Markdown、代码高亮、任务列表
- 📚 **素材收藏库** - 导入网页、PDF、Markdown 文件，自动提取摘要
- 💬 **AI Chat 模式** - 基于收藏素材的对话式写作辅助
- ⚡ **AI Proactive 模式** - 实时句子改写建议
- 🖥️ **桌面应用** - 基于 Tauri，轻量原生体验

## 🔌 AI Provider 抽象层（v0.2 进行中）

myWriteAssistant 正在推进 **vendor-agnostic AI provider 重构**（v0.2），目标是将 AI 调用从硬编码的豆包 API 解耦为统一的 provider 抽象层，让用户能够真实跨家选择模型，同时获取 cost 可见性。

v0.2 首发支持 5 家 provider：

- **豆包 (Doubao)** — 当前默认，通过 `@ai-sdk/openai` 兼容层接入
- **Claude (Anthropic)** — 通过 `@ai-sdk/anthropic` 接入
- **OpenAI** — 通过 `@ai-sdk/openai` 接入
- **Kimi (Moonshot)** — OpenAI-compatible 接入
- **DeepSeek** — OpenAI-compatible 接入

核心架构包括 `AIAdapter` interface（capability、usage、error 统一协议）、adapter registry、per-scenario 路由配置（支持 Chat / Proactive 分别指定模型）、统一 key storage 抽象（Tauri 桌面端走 OS keyring，Web 端走 localStorage 加显式风险提示）和 cost observability（每次调用记录 token 消耗 + 估算费用，提供 table-only dashboard）。API key 全程由 `resolveProviderConfig` 单一入口组装，**禁止** `process.env` 读取或各处自拼。

当前处于 **v0.2 开发中**，完成后 Settings 页面可真实切换 provider，无需改环境变量。v0.2 同时提供首次启动的 legacy Doubao 配置迁移检测 bridge，让老用户平滑升级。

详细设计见 [v0.2 设计文档](docs/plans/2026-05-06-v0.2-vendor-agnostic-refactor.md)。

## 🚀 快速开始

### 前置要求

- Node.js >= 20.9.0 (推荐使用 nvm)
- Rust (用于 Tauri 桌面应用)

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env.local` 并配置：

```bash
# 豆包 API 配置
DOUBAO_API_KEY=your-api-key
DOUBAO_API_BASE=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_MODEL=doubao-1-5-pro-32k-250115
```

### 开发模式

**Web 开发：**
```bash
npm run dev
```

**桌面应用开发：**
```bash
# 使用脚本（自动配置 nvm 和 cargo）
./scripts/dev.sh

# 或直接运行
npm run tauri:dev
```

### 生产构建

**构建桌面应用：**
```bash
./scripts/build.sh
# 或
npm run tauri:build
```

生成的安装包位于 `src-tauri/target/release/bundle/`：
- macOS: `.dmg`, `.app`
- Windows: `.msi`, `.exe`
- Linux: `.deb`, `.AppImage`

## 📁 项目结构

```
myWriteAssistant/
├── src/                    # Next.js 前端源码
│   ├── app/                # 页面路由
│   ├── components/         # React 组件
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具函数
│   └── stores/             # Zustand 状态管理
├── src-tauri/              # Tauri 桌面应用
│   ├── src/                # Rust 源码
│   ├── icons/              # 应用图标
│   └── tauri.conf.json     # Tauri 配置
├── docs/                   # 设计文档
└── scripts/                # 构建脚本
```

## 🛠️ 技术栈

- **前端**: Next.js 16, React 19, TailwindCSS 4, shadcn/ui
- **编辑器**: TipTap
- **状态管理**: Zustand
- **AI**: Vercel AI SDK + 豆包 API
- **桌面**: Tauri v2
- **存储**: IndexedDB (idb-keyval)

## 📝 开发计划

- [x] Phase 1: 基础框架
- [x] Phase 2: 富文本编辑器
- [x] Phase 3: 素材收藏库
- [x] Phase 4: AI Chat 模式
- [x] Phase 5: AI Proactive 模式
- [x] Phase 6: Tauri 桌面应用
- [ ] 性能优化
- [ ] 自定义图标

## 📄 License

MIT

