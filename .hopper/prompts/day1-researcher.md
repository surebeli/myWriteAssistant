# Day 1 Researcher Handoff

Anchor: `.hopper/prompts/day1-researcher.md::root`

---

## Meta

- **Target session**: Gemini CLI (model: `gemini-3.1-pro-preview`) running in `myWriteAssistant/` 项目根目录
- **Role**: Researcher
- **Why this LLM**: 1M+ context 一次吞下全部 plan docs + 核心源码。同时这是本次 dogfood 的"非 Claude leader 强制任务"，用于实测厂商无关 thesis
- **Output destination**: `.hopper/handoffs/day1-researcher-output.md`（由 Gemini CLI 直接写盘）
- **Next handoff**: Day 2 — Leader (Claude Opus 4.7) 基于本输出起草 v0.2 重构 spec

---

## 操作（执行者：用户）

1. 确认你在 `F:\workspace\ai\myWriteAssistant\` 启动了 `gemini` CLI
2. 复制下面 BEGIN PROMPT 到 END PROMPT 之间的内容，粘贴到 Gemini CLI session
3. Gemini 会自己 Read 列表里的 21 个文件，整合后用 Write 把 audit 直接落地到 `.hopper/handoffs/day1-researcher-output.md`
4. 检查输出文件，跟我说 "Day 1 audit ready"，我会切到 Day 2 Leader 节奏

---

## === BEGIN PROMPT ===

You are the **Researcher** in an `llm-hopper` multi-agent workflow. Your output will be consumed by a **Leader** (Claude Opus 4.7) in a separate session, so make it self-contained.

### Project context

You are in the `myWriteAssistant` repo root. It is a Next.js 16 + React 19 + TipTap + Tauri v2 writing-assistant app, currently with AI integration **locked to Doubao** (字节豆包) via Vercel AI SDK. The current branch is `feat/hopper-dogfood`. Phases 1-6 have feature code committed but rough.

### Upcoming refactor (the reason for this audit)

Over the next 3 weeks, the project will be refactored to be **vendor-agnostic**: AI provider becomes a pluggable abstraction with adapters for Doubao / Claude / OpenAI / DeepSeek / Kimi, and users can pick provider per scenario (chat / proactive / summary). UI will expose provider selection and a cross-vendor cost dashboard.

### Your task

Read the following files from the current working directory (relative paths):

**plan docs (6)**
- `docs/plans/2026-01-31-mywriteassistant-design.md`
- `docs/plans/2026-01-31-technical-decisions.md`
- `docs/plans/2026-01-31-phase1-implementation.md`
- `docs/plans/2026-01-31-phase2-implementation.md`
- `docs/plans/2026-01-31-phase3-implementation.md`
- `docs/plans/2026-01-31-phase4-implementation.md`

**AI integration source (10)**
- `src/app/api/chat/route.ts`
- `src/app/api/proactive/route.ts`
- `src/components/ai/chat-panel.tsx`
- `src/components/ai/chat-input.tsx`
- `src/components/ai/proactive-panel.tsx`
- `src/components/ai/message-bubble.tsx`
- `src/stores/ai-store.ts`
- `src/stores/settings-store.ts`
- `src/lib/material-matcher.ts`
- `src/lib/sentence-detector.ts`

**config / metadata (2)**
- `package.json`
- `README.md`

**Tauri side (3, lighter reference only)**
- `src-tauri/src/lib.rs`
- `src-tauri/src/main.rs`
- `src-tauri/Cargo.toml`

**also check** if `.env.example` exists — read it if so; skip silently if not.

After reading **all** of these holistically (don't summarize file by file), produce a structured audit report and **write it to `.hopper/handoffs/day1-researcher-output.md`**.

### Required deliverable structure

The output file must start with this frontmatter:

```
---
researcher: gemini-3.1-pro-preview
generated: <ISO-8601 timestamp>
input_files_count: <N>
estimated_tokens_in: <approx>
estimated_tokens_out: <approx>
---
```

Fill `estimated_tokens_*` with your best estimate; do not leave as `unknown`.

Then 5 sections:

#### 1. AI 集成耦合点清单

枚举所有 Doubao 写死或 single-provider 假设的位置：

- a) **直接调用 Doubao 的代码点**（API 路由 / SDK 初始化等）
- b) **引用 Doubao 模型名 / API key 环境变量的代码点**
- c) **假设单 provider 的状态结构**（Zustand stores 中的字段命名 / shape）
- d) **UI 组件里的 provider 假设**（Settings 是否有 provider 字段 / Chat / Proactive 是否假定调用同一家）
- e) **Tauri 侧是否有任何 AI 调用 / 模型配置**（如有）

格式：每条标注 file path + 行号 + 关键代码片段（≤3 行）。

#### 2. AIProvider 抽象层边界建议

- 抽象层文件 / 目录位置（基于现有 `src/lib/` 与 `src/app/api/` 结构）
- TypeScript interface 草案（≤30 行代码块）
- Doubao 实现重构成 adapter 的最小改动量描述（"删 N 行，加 M 行，挪 K 个 import" 这种粒度）
- Claude / OpenAI / DeepSeek / Kimi 各自接入时的 API 形态差异提示（streaming 协议、auth 方式、model id 命名等）
- 是否需要"per scenario provider"的 routing 层（chat 用 X、proactive 用 Y），需要的话给最小设计

#### 3. plan docs 与实际代码的偏差

| Plan 描述 | 实际实现 | 偏差程度（轻/中/重） | 影响 |
|---|---|---|---|

至少 5 条。完全一致的不列。

#### 4. 重构风险点

3-5 个最可能踩坑的点。每个：

- 风险描述（一句话）
- 触发条件（什么动作引爆）
- 缓解建议
- 严重度（低 / 中 / 高）

#### 5. 给 Leader 的开放问题

3-7 个你不能在 Researcher 阶段决定、需要 Leader 拍板的问题。每个：

- 问题描述
- 你倾向的答案（option A vs B）+ 理由
- 不决策会卡住哪些后续工作

### Constraints

- **不要编造**文件不存在的路径或代码内容；不确定时明示"未在文件中找到"
- 引用代码时给出**具体行号**
- 重构建议**保守优先**：最小改动 > 完美架构。本次 scope 是"让 AI provider 可换"，不是重写 AI 集成
- **markdown 格式**，标题层级与上面 5 节一致
- 总长 1500-3000 字（中文），不超过 4000 字
- 不要建议任何 scope 外的事（不要建议加新功能 / 改 UI 设计 / 调 Tauri 架构等，除非直接阻塞 vendor-agnostic 重构）
- 完成后用 Write 工具落地到 `.hopper/handoffs/day1-researcher-output.md`，**不要**只在对话里输出

### Sanity check before writing

写出文件前自检：
1. 是否真的读了上面 21 个路径？(漏读必须明示)
2. 每个 section 是否有具体证据（行号 / 文件路径），还是空话？
3. Section 5 的开放问题是否真的"无法 Researcher 决定"？如果你能决定就别推给 Leader
4. 输出长度是否在 1500-4000 字之间？

完成后回复一句"Audit written to .hopper/handoffs/day1-researcher-output.md (~XXX 字)"。

## === END PROMPT ===

---

## 完成后由谁做什么

- **Gemini CLI**：自己 Read 21 个文件 → 写 audit → Write 到 `.hopper/handoffs/day1-researcher-output.md`
- **你（用户）**：检查输出文件是否合理，跟我说 "Day 1 audit ready"
- **我（下一个 Claude Opus session 里）**：基于 audit 写 Day 2 Leader 的 v0.2 重构 spec
