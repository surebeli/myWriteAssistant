# T04 — builder Output

## Summary
Added Claude as the second registered AI adapter using `@ai-sdk/anthropic`, with Anthropic-specific capabilities, model creation, `prepareMessages`, usage extraction, and sanitized error normalization. T04 also changes Doubao's OpenAI-compatible `prepareMessages` path to put the system prompt into the messages array, so Claude and OpenAI-compatible adapters now exercise different capability-driven dispatch shapes. The provider smoke runner can now target the registered Claude adapter.

## Files touched
- src/lib/ai/adapters/claude.ts (new, ~95 lines): Claude adapter using `createAnthropic`, default model, capabilities, usage extraction, and safe error normalization.
- src/lib/ai/adapters/doubao.ts (modified, ~5 lines): changes OpenAI-compatible system prompt handling to system-role messages for AC16 distinction.
- src/lib/ai/adapters/index.ts (modified, ~5 lines): exports and registers `claudeAdapter`.
- tests/unit/claude-adapter.test.ts (new, ~80 lines): covers registration, capabilities, Anthropic system prompt handling, usage extraction, and redaction.
- tests/unit/doubao-adapter.test.ts (modified, ~5 lines): updates OpenAI-compatible system prompt expectation.
- tests/unit/test-providers.test.ts (modified, ~20 lines): proves `runProviderSmoke(..., only: "claude")` targets the registered Claude adapter with an injected sender.
- package.json (modified): adds `@ai-sdk/anthropic`.
- package-lock.json (modified): locks `@ai-sdk/anthropic@3.0.75` and transitive AI SDK provider packages.
- .hopper/queue.md (modified): marks T04 done and appends activity log entries.
- .hopper/COST-LOG.md (modified): appends T04 dogfood cost row.
- .hopper/handoffs/T04-output.md (new): v3 structured output artifact for Leader review.

## Acceptance verification (6/6)
1. ✓ Claude adapter implemented — `tests/unit/claude-adapter.test.ts` passed, covering capabilities, `createModel` wiring by package typecheck, `prepareMessages`, `extractUsage`, and `normalizeError`.
2. ✓ Registry registration works — `tests/unit/claude-adapter.test.ts` asserts `listAdapters()` contains `claude` and `getAdapter("claude") === claudeAdapter`.
3. ✓ Anthropic `prepareMessages` differs from OpenAI-compatible dispatch — `tests/unit/claude-adapter.test.ts` asserts Claude keeps `system` separate while Doubao moves system into a system-role message.
4. ✓ Package + lockfile updated — `npm install @ai-sdk/anthropic` completed; plain `npm install` completed with "up to date"; `package.json` includes `@ai-sdk/anthropic` and `package-lock.json` locks `@ai-sdk/anthropic@3.0.75`.
5. ✓ Required verification commands passed — fresh `npx tsc --noEmit` exited 0; fresh `npm test` passed 8 files / 26 tests; fresh `npm run build` compiled and generated 7/7 static pages.
6. ✓ Claude smoke command is wired — `npm run smoke:providers -- --only=claude` exited 0 and printed `SKIPPED claude (missing_key)`. `SMOKE_CLAUDE_API_KEY=missing` in this environment, so this verifies local T13 command integration but not a live upstream Claude call.

## Decisions / deviations from spec
- Used `claude-sonnet-4-20250514` as the default Claude model. Anthropic's official model docs recommend stable snapshot IDs for production consistency, and list this as the Sonnet 4 API ID.
- Changed Doubao `prepareMessages` during T04 to satisfy the T04/AC16 requirement that Anthropic and OpenAI-compatible dispatch paths be observably different.
- Real upstream Claude smoke was not possible because `SMOKE_CLAUDE_API_KEY` is not set. The local smoke command still exits 0 per T13 default skip behavior; CI `--require-all-stable` remains the real five-provider gate.
- There is an unrelated modified `.hopper/handoffs/T-EXE-1-output.md` in the worktree from another session/post-commit bookkeeping. It was not touched or staged by T04.
- The Commit section cannot embed the final short SHA before the atomic commit without making the file self-referential. This artifact records the planned commit message; Step 10 reports the actual SHA.

## Open questions for Leader
none

## Commit
Pending Step 9 atomic commit with message `[T04] Claude adapter and smoke integration`.

## Next recommendation
T07

---

## Leader review

- **Verdict**: ✅ accept (strong)
- **Date**: 2026-05-06T23:30:00+08:00
- **Reviewed-by**: leader (claude-opus-4-7)
- **Notes**:

  **AC16 真正落地（这次最关键的强信号）**：
  - spec v2 的 AC16 要求"Claude adapter 与 OpenAI-compat adapter 各发同样的 (system, userMessages)，断言 streamText 调用参数因 prepareMessages 不同而不同"
  - T04 不仅实装 Claude（system 走独立 parameter），还**回头改了 Doubao**（system 进 messages 数组）让两条 dispatch path 真有行为差异
  - 这是"capability flag 真转化为 behavior divergence"——T17 时 Critic v1 Issue 1 担心的"capabilities 摆设"被这次 commit 终结
  - tests/unit/claude-adapter.test.ts assert 两 adapter 的 prepareMessages 输出 shape 不同 → 是真测试不是 type-level 应付

  **架构亮点**：registry.ts 与 adapters/index.ts 解耦
  - T02 把 `providerRegistry` 改成从 `import { adapters } from "./adapters"` 取值
  - T04 加 Claude 时只动 `adapters/index.ts`，**不碰 registry.ts**
  - 副作用：T-EXE-1 在 registry.ts 加的 JSDoc 不被破坏 → **预期的 T04 / T-EXE-1 在 registry.ts 的并发冲突没发生**（被架构设计天然规避）
  - 这是 implicit 的 "interface stable, contents grow" 模式，应该写进 hopper architectural patterns 文档

  **smoke command 验证**：
  - `npm run smoke:providers -- --only=claude` 走通流程；missing key 时 SKIP 是 T13 的预期行为
  - CI ship gate `--require-all-stable` 仍是真的把关（D2 v2 规则未变）

  **Decisions/deviations 全合理**：
  - default model `claude-sonnet-4-20250514`（snapshot ID）是 production-grade 选择
  - Doubao prepareMessages 调整是**正确的"fix forward"**——Builder 看到 AC16 要求行为分异，主动修了上一 task 而不是装作不存在
  - SMOKE_CLAUDE_API_KEY 缺失下走 SKIP（合规）；真上游验证靠 CI 配置 secret

  **P7 (WIP leakage) 自动闭环**：
  - Kimi 之前 flag 的 untracked `tests/unit/claude-adapter.test.ts` 被 T04 这次 commit 一并归档
  - 但**P7 仍然是真协议 gap**——只是这次刚好自愈；下次 Builder 卡住或 multi-task 并发时还会重现
  - P7 必须随下次 sync 上 llm-hopper main

  **Strategic**：Builder 推荐 next = T07 (Kimi adapter)。**Leader 反对**：
  - T01-T04 已成 batch，**应先跑 T15 Critic** 做 batch adversarial review
  - 现在堆 T07/T08 不先 review，就丢失了"4 adapter 落地后回看架构"的最佳 critic 时机
  - **建议 next = T15** (Critic, GPT-5.5 独立 session)，T15 done 后再 T07/T08

- **Follow-up tasks queued**: 无（不需要新 task；只是建议 ping 顺序调整）
