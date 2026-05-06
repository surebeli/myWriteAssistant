# GEMINI.md

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

## Likely roles for Gemini in this repo

According to `.hopper/AGENTS.md`，本项目 Gemini 同时担任：

- `researcher` — 大上下文调研角色（已用于 Day 1 audit）
- `builder-ui` — Settings UI、Cost dashboard、Migration dialog 等前端实装

如不确定本 session 当哪个角色，向用户确认。
