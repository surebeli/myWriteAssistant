# Hopper Queue

Anchor: `.hopper/queue.md::root`

- Schema version: 1（见 `.hopper/PING.md`）
- 任务详情见 `.hopper/handoffs/leader-tasklist.md`；本文件**仅追踪状态**
- Status 取值：`pending` / `in-progress` / `done` / `failed`
- 推送权限：仅 Leader
- 弹出协议：见 `.hopper/PING.md`

---

## Tasks

| ID | Role | Status | Depends | Brief |
|----|------|--------|---------|-------|
| critic-v1 | critic | done |  | Re-review spec v1 + tasklist v1（出 `.hopper/handoffs/day2-critic-spec-review-v1.md`，prompt 在 `.hopper/prompts/critic-day2-spec-review.md`）|
| T01 | builder | done |  | `src/lib/ai/` 抽象层骨架（types/registry/prompts/pricing/key-storage/request-assembly/route-helpers + adapters/ 占位）|
| T17 | builder | done | T01, T03 | API route 集成测试 scaffolding（vitest 已被 T03 装好；本任务只加 supertest + tests/integration/api/ + 1 sanity 测试，工作量 S）|
| T03 | builder | done | T01 | Settings store v0.2 schema + key-storage Web 实装 + `resolveProviderConfig` |
| T13 | builder | done | T01 | Provider smoke script（支持 `--only=<id>`）|
| T14-spike | builder | pending |  | Tauri secure storage plugin 调研（半天，**仅出 spike 文档不动代码**）|
| T02 | builder | done | T01, T17 | Doubao adapter + chat/proactive route refactor + error sanitizer |
| T05 | builder-ui (+ builder pair on wiring) | pending | T03, T17 | Settings AI UI + 接通 `resolveProviderConfig` + 空状态引导 |
| T04 | builder | done | T02, T03, T13 | Claude adapter（capability/extractUsage/normalizeError 完整）|
| T18a | builder | pending | T03 | Migration bridge：Next API + Tauri command 读取 legacy DOUBAO env（不返完整 key）|
| T18b | builder-ui | pending | T18a, T03 | 首启 migration dialog UI + 空状态引导组件（调 T18a bridge）|
| T15 | critic | done | T01, T02, T03, T04 | PR diff adversarial review batch 1（出 `critic-T01-T04.md`）|
| T07 | builder | done | T04, T13 | Kimi adapter（registry-only，不直接改 UI）|
| T08 | builder | done | T04, T13 | DeepSeek adapter（registry-only）|
| T09 | builder | pending | T02, T05 | Cost recording：finish event with usage + IndexedDB idempotency |
| T14-impl | builder | pending | T03, T14-spike | Tauri secure storage 实装 + DevTools 禁用 + key 导出工具（接 spike 决策）|
| T06 | executor-1 | pending | T03, T05 | 状态栏读 store 替换"豆包 API"硬编码 |
| T11 | executor-2 | pending | T05, T06 | 全仓库 sweep + 维护 `.hopper/grep-allowlist.txt` |
| T10 | builder-ui | pending | T09 | Cost dashboard 三 table 视图（无图表 / 无 override / 无导出）|
| T12 | executor-1 | pending | T09 | message bubble 加 `producedBy` 标注 |
| T16 | critic | pending | T09, T10 | PR diff review batch 2（cost dashboard，出 `critic-T09-T10.md`）|
| T-EXE-1 | executor-1 | done | T01 | 🔬 [validation-only] 给 src/lib/ai/ public exports 加 JSDoc 注释（不改 logic；tsc 仍过）|
| T-EXE-2 | executor-2 | done | T01 | 🔬 [validation-only] README.md 加 "AI provider abstraction (v0.2 进行中)" 小节（15-30 行，不动现有段落）|
| T02-rework | builder | done | T02 | **[REWORK from Critic T15]** wire resolveProviderConfig 进 use-chat + use-proactive；同时 fix proactive bare error 到 sanitized contract |
| T-OPENAI | builder | done | T04, T13 | **[REWORK from Critic T15]** OpenAI adapter（registry-only，同 Kimi/DeepSeek 模式；填补 5-stable 缺口）|
| T-SANITIZER-FIX | builder | done | T02 | **[REWORK from Critic T15]** 扩展 sanitizer regex（bare sk-.../sk-ant-.../whitespace label/x-api-key forms）+ 统一所有 adapter normalizeError 走共享函数 |

---

## Activity log

> 每次 pop / done / failed 由 popping session 追加一行。

- queue 初始化 at 2026-05-06T?? by leader (claude-opus-4-7)
- critic-v1 started at 2026-05-06T12:38:46.9663370+08:00 by critic (GPT-5.5 Codex)
- critic-v1 done at 2026-05-06T12:43:15.4003581+08:00 - Wrote v1 adversarial spec/tasklist review; verdict PASS_WITH_CHANGES
- queue updated at 2026-05-06T?? by leader (claude-opus-4-7) — applied Critic v1 PASS_WITH_CHANGES surgical fixes; spec v2 + tasklist v2; T18 split into T18a/T18b; T14-impl deps add T14-spike
- T01 started at 2026-05-06T14:55:40.3024311+08:00 by builder (GPT-5.5 Codex)
- T01 done at 2026-05-06T15:01:24.5773153+08:00 — Added AI abstraction skeleton, adapter registry stubs, route helper contract, and passing tsc compatibility
- T03 started at 2026-05-06T16:07:20.0158527+08:00 by builder (GPT-5.5 Codex)
- T03 done at 2026-05-06T16:15:46.7637383+08:00 — Upgraded settings schema, implemented Web key storage and resolveProviderConfig with unit coverage
- T13 started at 2026-05-06T16:58:50.0501493+08:00 by builder (GPT-5.5 Codex)
- T13 done at 2026-05-06T17:12:36.6957902+08:00 — Added provider smoke runner, npm script, CLI flags, and unit coverage
- T17 started at 2026-05-06T17:33:52.9213253+08:00 by builder (GPT-5.5 Codex)
- T17 done at 2026-05-06T17:39:44.6315643+08:00 — Added supertest API integration scaffold and chat route mock-provider sanity test
- T17 status reverted to pending (lost) at e37151c by leader (claude-opus-4-7) — bug
- T17 status restored to done at 2026-05-06T?? by leader (claude-opus-4-7) — fix for e37151c regression
- T-EXE-2 started at 2026-05-06T?? by executor-2 (DeepSeek-V4-Flash)
- T-EXE-2 done at 2026-05-06T?? — Added "AI provider abstraction (v0.2 进行中)" section to README.md (17 lines, 5 providers, design doc link)
- T02 started at 2026-05-06T18:43:34.5341756+08:00 by builder (GPT-5.5 Codex)
- T02 done at 2026-05-06T19:02:05.7088050+08:00 — Added Doubao adapter, refactored chat/proactive routes through callAdapter, sanitized errors, and covered route dispatch tests
- T-EXE-1 started at 2026-05-06T22:48:33.585640+08:00 by executor-1 (Kimi 2.6)
- T-EXE-1 done at 2026-05-06T22:53:00.0000000+08:00 — Added JSDoc comments to all public exports in src/lib/ai/ (8 files, ~80 comment lines); tsc baseline verified; zero logic changes
- T04 started at 2026-05-06T22:49:02.2169692+08:00 by builder (GPT-5.5 Codex)
- T04 done at 2026-05-06T23:04:47.9577727+08:00 — Added Claude adapter, registered Anthropic provider package, verified build/type/tests, and smoke command integration
- T15 started at 2026-05-06T23:44:08.6939035+08:00 by critic (GPT-5.5 Codex)
- T15 done at 2026-05-06T23:54:59.1143211+08:00 — Wrote adversarial review for T01-T04 batch; verdict REWORK before independent landing
- T02-rework started at 2026-05-07T00:46:56.2375729+08:00 by builder (GPT-5.5 Codex)
- T02-rework done at 2026-05-07T02:53:44.5853785+08:00 — Wired resolveProviderConfig/requestId into use-chat & use-proactive; sanitized proactive missing-sentence error; folded 2 manual-verify fixes (Doubao .chat() routing + stream protocol encoder for ai@6 lacking toDataStreamResponse)
- T-SANITIZER-FIX started at 2026-05-07T10:59:05.0252700+08:00 by builder (GPT-5.5 Codex)
- T-SANITIZER-FIX done at 2026-05-07T11:08:10.5565534+08:00 — Extended shared error sanitizer coverage and routed existing adapter normalizeError implementations through sanitizeErrorMessage
- T-OPENAI started at 2026-05-07T11:31:04.6209469+08:00 by builder (GPT-5.5 Codex)
- T-OPENAI done at 2026-05-07T11:40:12.1848511+08:00 — Added registry-only OpenAI adapter with chat-completions routing, shared sanitizer usage, unit coverage, and OpenAI smoke path verification
- T07 started at 2026-05-07T14:12:15.1112020+08:00 by builder (gpt-5.5-high)
- T07 done at 2026-05-07T14:18:00.4296798+08:00 — Added registry-only Kimi adapter with Moonshot defaults, shared sanitizer usage, unit coverage, and smoke path verification
- T08 started at 2026-05-07T14:37:00.0000000+08:00 by builder (kimi-v2.6-thinking)
- T08 done at 2026-05-07T14:42:00.0000000+08:00 — Added registry-only DeepSeek adapter with OpenAI-compatible SDK, shared sanitizer usage, unit coverage, and smoke path verification
