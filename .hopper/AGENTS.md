# AGENTS — myWriteAssistant × llm-hopper Dogfood

Anchor: `.hopper/AGENTS.md::root`

本文件定义本次 dogfood 的角色到 LLM 绑定。修改本文件即生效；不要在 PRD / TRD / 其他 docs 里硬编码模型名。

> 本绑定仅适用于本仓库（myWriteAssistant）的本次 dogfood（v0.2 vendor-agnostic refactor）。其他项目的 hopper 绑定独立。

---

## 角色绑定表（Round 2 起，2026-05-07）

> Round 1 binding 见本文件末尾的"Modification history"。Round 2 是 cost-skew 实验：把 Builder 从 GPT-5.5 swap 到 cheap-tier pair，把 Critic 从 GPT-5.5 swap 到 Claude Opus 4.7，验证 layered discovery 是否在 role-LLM 解耦下仍 work。

| Nickname | Role | Model | 主要职责 | Session 入口 |
|---|---|---|---|---|
| researcher-primary | Researcher | kimi-2.6 | 大上下文吞 plan docs + 源码，输出 audit | Kimi web / API |
| leader-primary | Leader | gpt-5.5 (xhigh reasoning) | 战略决策、spec / ADR、scope 取舍、queue push | Codex CLI（reasoning_effort=high）|
| builder-ui-primary | Builder-UI | gemini-3.1-pro-preview | Settings / Provider 选择器 / Cost 仪表盘等前端 | Gemini web / Cursor |
| builder-single | Builder (control) | gpt-5.5 (xhigh reasoning) | 复杂架构 task（Round 2 仅特定 task 用作对照基线）| Codex CLI |
| builder-pair-A | Builder pair A | kimi-2.6 + deepseek-v4-flash | Kimi 写主体代码 → DeepSeek polish/lint/格式 | 两个独立 session 顺序 ping |
| builder-pair-B | Builder pair B | mimo-v2.5-pro + deepseek-v4-flash | Mimo 写主体 → DeepSeek polish | 两个独立 session 顺序 ping |
| critic-primary | Critic | claude-opus-4-7 | Builder PR diff adversarial review | Claude Code 独立 session（与 leader session 分离）|
| executor-primary | Executor | deepseek-v4-flash | 极便宜批量打杂（仅 Round 1 遗留 task 用） | DeepSeek web / API |

**Round 2 任务分配建议**（在 leader-tasklist.md 内明示每个 task 的 owner 配置）：

- T07: builder-single (GPT-5.5 xhigh) — 控制组
- T08: builder-pair-A (Kimi + DeepSeek) — 实验组 1
- T09: builder-pair-B (Mimo + DeepSeek) — 实验组 2（重 task 验证）
- T05: builder-ui-primary (Gemini) — UI 单跑

**注**：
- `xhigh` reasoning = `reasoning_effort=high` 等价配置；Leader / 单 Builder 用最大推理预算
- Builder pair 顺序：先主体写代码（Kimi 或 Mimo）commit + output.md，再 sidecar polish（DeepSeek-Flash）单独 commit `[<task-id>][polish]`
- Critic Claude Opus 必须开**新 Claude Code session** 不复用 leader 的 Codex session

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
| 2026-05-06 | 短暂 swap executor-primary 与 secondary，又回退到初始绑定（原因：维持原 task-LLM 配对意图——T-EXE-1 用 Kimi 长 ctx 吃 7 文件；T-EXE-2 用 DeepSeek-flash 便宜单文件）| litianyi |
| 2026-05-07 | **Round 2 cost-skew experiment 启动**：Researcher → Kimi；Leader → GPT-5.5 xhigh；Builder 拆为 single (GPT-5.5 xhigh, control) + pair-A (Kimi+DeepSeek) + pair-B (Mimo+DeepSeek)；Critic → Claude Opus 4.7（fresh session）；Builder-UI 仍 Gemini。目的：验证 cheap-tier Builder pair 是否能维持质量同时显著降 cost；为 essay #2 收集对照数据 | litianyi（与 Claude 协作设计）|
