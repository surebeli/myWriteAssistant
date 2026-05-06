# CLAUDE.md

This project uses **llm-hopper** for multi-LLM coordination.

## Ping protocol

When the user types `ping` (or `ping <role>` / `ping --status` / `ping --dry`), **read `.hopper/PING.md` and follow it exactly** — don't paraphrase, execute its steps.

## Project context

- **What this is**: Next.js 16 + React 19 + TipTap + Tauri v2 写作助手
- **Current branch**: `feat/hopper-dogfood`
- **Active work**: v0.2 vendor-agnostic AI provider refactor，spec at `docs/plans/2026-05-06-v0.2-vendor-agnostic-refactor.md`
- **Role-LLM bindings**: `.hopper/AGENTS.md`（注：此文件 ≠ 根目录的 `AGENTS.md`，后者只是 Codex CLI bootstrap）
- **Phase cursor**: `.hopper/MANIFEST.md`
- **Task queue**: `.hopper/queue.md`

## Conventions in this repo

- 不创建 PRD/TRD 之外的 design 文档（除非 spec 明确要求）
- 模型版本只在 `.hopper/AGENTS.md` 写死，不进 PRD/TRD
- Builder PR commit message 前缀 `[T##]`
- Critic 必须用独立 session（无 Builder 历史）
