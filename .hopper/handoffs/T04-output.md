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
