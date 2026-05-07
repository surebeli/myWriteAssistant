# T-OPENAI — builder Output

## Summary
Added a registry-only OpenAI adapter using `@ai-sdk/openai`, matching the OpenAI-compatible message shaping used by Doubao while explicitly routing model creation through `provider.chat(model)` to avoid the AI SDK default Responses API path. Added unit coverage for registration, routing, message preparation, usage extraction, sanitized errors, and the smoke runner's OpenAI registration behavior.

## Files touched
- src/lib/ai/adapters/openai.ts (new): OpenAI adapter with capabilities, `prepareMessages`, `extractUsage`, `normalizeError`, and Chat Completions model creation.
- src/lib/ai/adapters/index.ts (modified): exports and registers `openaiAdapter`.
- tests/unit/openai-adapter.test.ts (new): OpenAI adapter unit coverage including `.chat()` routing.
- tests/unit/test-providers.test.ts (modified): verifies require-all-stable now reports OpenAI as `missing_key`, not `not_registered`.
- .hopper/queue.md (modified): records T-OPENAI start/done state.
- .hopper/COST-LOG.md (modified): records estimated task cost.
- .hopper/handoffs/T-OPENAI-output.md (new): structured task handoff.

## Acceptance verification (5/5)
1. ✓ Adapter implements capabilities, OpenAI-compatible `prepareMessages`, `extractUsage`, and `normalizeError` — `tests/unit/openai-adapter.test.ts`.
2. ✓ Registry registration succeeds — `tests/unit/openai-adapter.test.ts` asserts `listAdapters()` contains `openai` and `getAdapter("openai")` returns `openaiAdapter`.
3. ✓ Smoke command path works — `npm run smoke:providers -- --only=openai` exits 0 and reports `SKIPPED openai (missing_key)` with no real key configured.
4. ✓ `npm install`, `npx tsc --noEmit`, `npm test`, targeted Vitest, and scoped ESLint all pass.
5. ✓ OpenAI no longer fails the strict stable-provider gate as `not_registered` — `tests/unit/test-providers.test.ts` verifies OpenAI is `missing_key`; `npm run smoke:providers -- --require-all-stable` confirms remaining `not_registered` failures are Kimi/DeepSeek only.

## Decisions / deviations from spec
- Used `provider.chat(config.model)` instead of the default callable OpenAI provider route. This folds in the T02-rework manual-verification learning that default `@ai-sdk/openai` routing uses the Responses API path, while the app's OpenAI-compatible adapter pattern needs Chat Completions routing.
- The strict `--require-all-stable` CLI command still exits 1 because `kimi` and `deepseek` are intentionally not registered until T07/T08. This is external to T-OPENAI; OpenAI itself now reports `missing_key`, not `not_registered`.
- `npm install` completed without dependency changes; npm reported existing audit warnings (8 vulnerabilities: 4 moderate, 4 high), not introduced by this task.

## Open questions for Leader
- none

## Commit
pending — final SHA reported in Step 10.

## Next recommendation
Continue with `T07`/`T08` to remove the remaining Kimi/DeepSeek `not_registered` strict smoke gate failures.
