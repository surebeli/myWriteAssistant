# AGENTS — myWriteAssistant × llm-hopper Dogfood

Anchor: `.hopper/AGENTS.md::root`

本文件定义本次 dogfood 的角色到 LLM 绑定。修改本文件即生效；不要在 PRD / TRD / 其他 docs 里硬编码模型名。

> 本绑定仅适用于本仓库（myWriteAssistant）的本次 dogfood（v0.2 vendor-agnostic refactor）。其他项目的 hopper 绑定独立。

---

## 角色绑定表

| Nickname | Role | Model | 主要职责 | Session 入口 |
|---|---|---|---|---|
| researcher-primary | Researcher | gemini-3.1-pro-preview | 大上下文吞掉 plan docs + 关键源码，输出 audit 报告 | Gemini web / API（1M+ ctx 场景） |
| leader-primary | Leader | claude-opus-4-7 | 战略决策、spec / ADR、scope 取舍 | Claude Code（推荐使用 hopper skill） |
| builder-ui-primary | Builder-UI | gemini-3.1-pro-preview | Settings 面板、Provider 选择器、Cost 仪表盘等前端实现 | Gemini web / Cursor + Gemini |
| builder-primary | Builder | gpt-5.5 | 通用 TS / Rust 代码、`AIProvider` 抽象层、adapter 实现 | Codex CLI / ChatGPT desktop |
| executor-primary | Executor | kimi-2.6 | 批量轻活：lint / 命名 / 简单组件改动 / 文档行 polish | Kimi web / API |
| executor-secondary | Executor | deepseek-v4-flash | 极便宜的批量打杂（注释、import 整理） | DeepSeek web / API |
| critic-primary | Critic | gpt-5.5 | Builder 输出的 PR diff 做 adversarial review | Codex CLI（独立 session） |

**注：**

- `gemini-3.1-pro-preview` 同时担任 Researcher 与 Builder-UI——两个角色时间错开（Researcher 仅 Day 1；Builder-UI 从 Week 2 开始），不冲突
- `gpt-5.5` 同时担任 Builder 与 Critic——按 hopper 纪律，**Critic 必须在独立 session** 中调用，不复用 Builder 的对话历史，避免 confirmation bias
- 所有 LLM 用户已订阅，无配额阻塞

---

## Handoff 路径

主流路径：

```
Researcher (Gemini)
        │  audit 落地到 .hopper/handoffs/day1-researcher-output.md
        ▼
Leader (Claude Opus)
        │  v0.2 重构 spec 落地到 myWriteAssistant/docs/plans/...
        │  task list 落地到 .hopper/handoffs/leader-tasklist.md
        ▼
Builder (GPT-5.5) ─┬─ Builder-UI (Gemini) ─┬─ Executor (Kimi/DeepSeek)
        │           │                       │
        ▼           ▼                       ▼
   每 PR diff → Critic (GPT-5.5, 独立 session) → review verdict
        ▼
   Builder review pass → merge to feat/hopper-dogfood
```

---

## Cost tracking

每次 handoff 完成后由对应 session 自报 token / 成本，记入 `.hopper/COST-LOG.md`（首次 handoff 时由 Leader 创建）。后期可对比"如果全部走 Claude Opus"的 baseline 算节省比。

---

## 修改记录

| 日期 | 修改 | 由 |
|------|------|---|
| 2026-05-06 | 初始绑定 | litianyi（与 Claude 协作建立） |
