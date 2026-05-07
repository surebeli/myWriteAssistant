# T08 — Builder Output

## Summary

Added the DeepSeek adapter as a registry-only provider following the same pattern established by T07 (Kimi) and T-OPENAI (OpenAI). DeepSeek uses the OpenAI-compatible API via `@ai-sdk/openai`'s `createOpenAI`, so the adapter structure mirrors OpenAI/Kimi with DeepSeek-specific defaults (`https://api.deepseek.com/v1` base URL, `deepseek-chat` default model). All shared infrastructure (sanitizeErrorMessage, registry, smoke script) was reused without modification.

## Files touched

- `src/lib/ai/adapters/deepseek.ts` (new, ~97 lines): DeepSeek adapter implementation
- `src/lib/ai/adapters/index.ts` (modified, +3 lines): Import/export `deepseekAdapter` and add to `adapters` array
- `tests/unit/deepseek-adapter.test.ts` (new, ~104 lines): Unit tests covering registration, model creation, message preparation, usage extraction, and error normalization
- `.hopper/queue.md` (modified): T08 status flip (pending → in-progress → done) + activity log
- `.hopper/COST-LOG.md` (modified): Cost log row appended

## Acceptance verification (4/4)

1. ✓ T13 smoke 通过 — `npm run smoke:providers -- --only=deepseek` returns `SKIPPED deepseek (missing_key)` (correctly registered, not "not_registered")
2. ✓ registry 注册成功 — `getAdapter("deepseek")` returns `deepseekAdapter`; `listAdapters()` includes `"deepseek"`
3. ✓ UI 不直接改 — No changes to any `src/components/` or `src/app/` UI files; only `adapters/` + `index.ts`
4. ✓ `npm install` + `tsc --noEmit` 通过 — Type-check passes; no new dependencies needed (`@ai-sdk/openai` already present)

Additional verification:
- ✓ `npm run smoke:providers -- --require-all-stable` shows 5 `missing_key` (including deepseek), not `not_registered`
- ✓ `npx vitest run tests/unit/deepseek-adapter.test.ts` — 5/5 tests pass
- ✓ `npx vitest run tests/unit/` — 42/42 tests pass (no regressions)
- ✓ `npx eslint src/lib/ai/adapters/deepseek.ts src/lib/ai/adapters/index.ts tests/unit/deepseek-adapter.test.ts` — clean

## Decisions / deviations from spec

- 无偏离。完全按 T08 spec 和 T07/T-OPENAI 既有模式实现。
- DeepSeek default model 选 `deepseek-chat`（标准对话模型）；`deepseek-reasoner` 留给用户通过 settings override 配置。

## Open questions for Leader

none

## Commit

ff5dc38 "[T08] Add registry-only DeepSeek adapter with OpenAI-compatible SDK, shared sanitizer, unit coverage, and smoke path verification"

## Next recommendation

T09 (Cost recording) 或 T18a (Migration bridge) 是 builder role 的 next pending tasks。T09 依赖 T02 和 T05（T05 仍为 pending），T18a 仅依赖 T03（done），因此 T18a 可能更早 eligible。不过按 AGENTS.md Wave 分配，T08 属于 Wave 4，T18a 也属于 Wave 4，可并行。
