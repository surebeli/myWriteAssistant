# AGENTS — myWriteAssistant × llm-hopper Dogfood

Anchor: `.hopper/AGENTS.md::root`

本文件定义本次 dogfood 的角色到 LLM 绑定。修改本文件即生效；不要在 PRD / TRD / 其他 docs 里硬编码模型名。

> 本绑定仅适用于本仓库（myWriteAssistant）的本次 dogfood（v0.2 vendor-agnostic refactor）。其他项目的 hopper 绑定独立。

---

## 角色绑定表（Round 2，2026-05-07，含 thinking-mode 显式标注）

> Round 1 binding 见本文件末尾的"Modification history"。Round 2 cost-skew 实验：每个角色的 thinking-mode 显式标出，让 cost 可推测；Builder 引入 4 种 pair 配置做对照。

| Nickname | Role | Model + thinking mode | 主要职责 | Session 入口 |
|---|---|---|---|---|
| researcher-primary | Researcher | **kimi-v2.6-thinking** | 大上下文吞 plan docs + 源码，输出 audit | Kimi web / API（thinking 档）|
| leader-primary | Leader | **gpt-5.5-xhigh** | 战略决策、spec / ADR、scope 取舍、queue push | Codex CLI / ChatGPT desktop（thinking max）|
| builder-ui-primary | Builder-UI | **gemini**（默认 thinking 档）| Settings / Provider 选择器 / Cost 仪表盘等前端 | Gemini web / Cursor |
| builder-single | Builder (control) | **gpt-5.5-high** | 控制组：复杂架构 task baseline | Codex CLI（reasoning_effort=high）|
| builder-pair-A | Builder pair A | **kimi-v2.6-thinking + deepseek-v4-flash** | Kimi 主体（thinking）→ DeepSeek-Flash polish | 两独立 session 顺序 ping |
| builder-pair-B | Builder pair B | **mimo-v2.5-pro + deepseek-v4-flash** | Mimo 主体 → DeepSeek-Flash polish | 同上 |
| builder-pair-C | Builder pair C | **deepseek-v4-pro + gemini-v3.1-flash** | DeepSeek-Pro 主体 → Gemini-Flash polish | 同上 |
| builder-pair-D | Builder pair D | **deepseek-v4-pro + kimi-v2.6-nothinking** | DeepSeek-Pro 主体 → Kimi-nothinking polish（最低 cost 配置）| 同上 |
| critic-primary | Critic | **claude-opus-v4.7-xhigh** | Builder PR diff adversarial review | Claude Code 独立 session（与 leader 分离，thinking max）|
| executor-primary | Executor | deepseek-v4-flash | 极便宜批量打杂（Round 1 遗留 task 用）| DeepSeek web / API |

**Round 2 任务分配（4 pair × 4 task + control + UI）**：

| Task | Effort | Owner |
|------|--------|-------|
| T07 (Kimi adapter) | S | builder-single (gpt-5.5-high) — **control** |
| T08 (DeepSeek adapter) | S | builder-pair-A (kimi-thinking + deepseek-flash) |
| T09 (Cost recording) | M | builder-pair-B (mimo + deepseek-flash) |
| T18a (Migration bridge) | M | builder-pair-C (deepseek-pro + gemini-flash) |
| T14-spike (Tauri storage 调研) | S | builder-pair-D (deepseek-pro + kimi-nothinking) |
| T05 (Settings UI) | L | builder-ui (gemini) |

**Cost 直觉表**（粗估，实际由 COST-LOG.md 验证）：

| Tier | Per-task 估价（M effort baseline）|
|------|-----|
| gpt-5.5-xhigh / claude-opus-xhigh | $0.30-0.80 |
| gpt-5.5-high / claude-opus-default | $0.15-0.40 |
| kimi-thinking / mimo-pro / deepseek-pro | $0.05-0.15 |
| kimi-nothinking / gemini-flash / deepseek-flash | $0.001-0.02 |

**注**：

- thinking-mode 显式标后，cost 推算 = base model price × thinking multiplier（thinking 通常 2-5x non-thinking）
- Pair 主体/sidecar 顺序：主体 commit `[<task-id>] ...` → sidecar polish commit `[<task-id>][polish] ...`，2 commit per task（Round 2 例外，PING v5 主流程是 1 commit/task）
- Critic Claude Opus xhigh 必开**新 Claude Code session**，与 leader Codex 分离，thinking 拉到最大档（HN essay critic 已验证此模式有效）

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
| 2026-05-07 | **Round 2 binding 精化**：所有角色显式标 thinking-mode（让 cost 可推算）；Builder pair 扩到 4 种（pair-A kimi-thinking+deepseek-flash / pair-B mimo+deepseek-flash / pair-C deepseek-pro+gemini-flash / pair-D deepseek-pro+kimi-nothinking）；任务分配 T07/T08/T09/T18a/T14-spike/T05 配 6 种 builder 配置一一对照 | litianyi |
