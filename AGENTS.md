# AGENTS.md (Codex CLI bootstrap)

> ⚠️ **不要与 `.hopper/AGENTS.md` 混淆**——后者是 llm-hopper 的角色-LLM 绑定表，本文件只是 Codex CLI 的项目级指令文件。

This project uses **llm-hopper** for multi-LLM coordination.

## Ping protocol

When the user types `ping` (or `ping <role>` / `ping --status` / `ping --dry`), **read `.hopper/PING.md` and follow it exactly** — don't paraphrase, execute its steps.

## Project context

- **What this is**: Next.js 16 + React 19 + TipTap + Tauri v2 写作助手
- **Current branch**: `feat/hopper-dogfood`
- **Active work**: v0.2 vendor-agnostic AI provider refactor，spec at `docs/plans/2026-05-06-v0.2-vendor-agnostic-refactor.md`
- **Role-LLM bindings**: `.hopper/AGENTS.md`
- **Phase cursor**: `.hopper/MANIFEST.md`
- **Task queue**: `.hopper/queue.md`

## Likely roles for GPT-5.5 (Codex / ChatGPT) in this repo

按 `.hopper/AGENTS.md`：

- `builder` — 通用 TS / Rust 代码、adapter 实现、route 重构（主要工作量）
- `critic` — Builder 输出的 PR diff adversarial review（**必须独立 session**，与 builder 不共享历史）

⚠️ Critic 角色的硬要求：开新 chat、不带 Builder 历史。
