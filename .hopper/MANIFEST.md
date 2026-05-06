# MANIFEST — myWriteAssistant × llm-hopper Dogfood

Anchor: `.hopper/MANIFEST.md::root`

本文件是本次 dogfood 的 phase cursor，是单一事实源（single source of truth）。所有"现在该做什么"的判断以本文件为准。

---

## Current Phase

**Phase**: 2026-Q2 vendor-agnostic AI provider refactor (myWriteAssistant v0.2)

**Status**: Day 2 v2 done — Spec + tasklist 应用 Critic v1 PASS_WITH_CHANGES 修订完毕；**Builder Wave 1 (T01) 可启动**

**Current cursor**: Day 4 Wave 1 — `T01` is `pending` and unblocked in `.hopper/queue.md`

**Next action**:

1. 用户开 **Builder session**（GPT-5.5 / Codex CLI）在 `F:\workspace\ai\myWriteAssistant\` 根目录
2. 在 session 第一句声明：`你是 builder`
3. 输入：`ping`
4. CLI 自动 Read queue → pop T01 → 执行 → 写盘 → 改 status → 报回
5. T01 完成后，下一个 ping 会拿 T17 / T03 / T13 / T14-spike 中的最低 ID（按依赖图都已 ready）

**Recently completed**:

- ✅ 2026-05-06 Day 1：Researcher (Gemini 3.1 Pro Preview) audit → `.hopper/handoffs/day1-researcher-output.md`
- ✅ 2026-05-06 Day 2 v0：Leader spec v0 → Critic v0 **FAIL** (12 issues) → `.hopper/handoffs/day2-critic-spec-review.md`
- ✅ 2026-05-06 Day 2 v1：Leader 修订 → Critic v1 **PASS_WITH_CHANGES** (11 issues) → `.hopper/handoffs/day2-critic-spec-review-v1.md`
- ✅ 2026-05-06 Day 2 v2：Leader applied surgical fixes → spec v2 + tasklist v2（含 T18 拆分 / T14-spike 依赖 / capabilities 可执行 / migration bridge / cancellation client-side）；queue 同步

---

## Phase Plan（参考）

完整 scope 见 `.hopper/DOGFOOD.md`。简表：

| Day / Week | Cursor 目标 | 主要角色 | 输出落盘位置 |
|---|---|---|---|
| **Day 1** | Researcher audit | Researcher (Gemini) | `.hopper/handoffs/day1-researcher-output.md` |
| Day 2-3 | v0.2 重构 spec | Leader (Claude Opus) | `myWriteAssistant/docs/plans/2026-05-XX-v0.2-vendor-agnostic-refactor.md` + `.hopper/handoffs/leader-tasklist.md` |
| Day 4-7 | `AIProvider` interface + Doubao adapter + provider#2 | Builder (GPT-5.5) → Critic (GPT-5.5) | PRs to `feat/hopper-dogfood` |
| Week 2 | Provider 扩展（DeepSeek/Kimi）+ Settings UI | Builder + Builder-UI | PRs |
| Week 3 | Cost dashboard + Tauri build + ship | Builder + Builder-UI + Executor | PRs + release |

---

## Source of truth 约定

- **Phase cursor**: 本文件（`.hopper/MANIFEST.md`）
- **角色绑定**: `.hopper/AGENTS.md`
- **Scope / 退出条件 / 观察日志**: `.hopper/DOGFOOD.md`
- **任务详情（spec）**: `.hopper/handoffs/leader-tasklist.md`（immutable，由 Leader 维护）
- **任务状态（cursor）**: `.hopper/queue.md`（mutable，由各角色 ping 时更新）
- **Ping 协议**: `.hopper/PING.md`
- **每次 handoff 输出**: `.hopper/handoffs/<role>-<day>-output.md`
- **Cost log**: `.hopper/COST-LOG.md`（首次 handoff 创建）

## CLI bootstrap

每家 CLI 进入本项目目录时自动加载相应 bootstrap 文件，全部指向 `.hopper/PING.md`：

- `CLAUDE.md`（root）— Claude Code
- `GEMINI.md`（root）— Gemini CLI
- `AGENTS.md`（root）— Codex CLI（**注**：此文件 ≠ `.hopper/AGENTS.md`）

---

## 修改记录

| 日期 | Cursor 变化 | 由 |
|------|------------|---|
| 2026-05-06 | 初始化为 Day 1 Researcher pending | litianyi（与 Claude 协作建立） |
| 2026-05-06 | Day 1 audit 完成；cursor 推进到 Day 2 Leader spec 草稿，pending Critic | Leader session (Claude Opus 4.7) |
| 2026-05-06 | Critic v0 FAIL（12 issues）；Leader redrafted spec + tasklist 到 v1；cursor 回到 Critic re-review pending | Critic v0 (GPT-5.5) → Leader (Claude Opus 4.7) |
| 2026-05-06 | Critic v1 PASS_WITH_CHANGES（11 issues）via ping protocol（首次 ping 实跑！）；Leader applied surgical fixes → spec v2 + tasklist v2；T01 ready for Builder Wave 1 | Critic v1 (GPT-5.5 Codex) → Leader (Claude Opus 4.7) |
