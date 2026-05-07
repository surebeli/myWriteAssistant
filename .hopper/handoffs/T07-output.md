# T07 — builder Output

## Summary
Added the registry-only Kimi adapter as an OpenAI-compatible provider backed by `@ai-sdk/openai`, using Kimi/Moonshot defaults and the same chat-completions routing pattern established by Doubao and OpenAI. The adapter implements capabilities, `prepareMessages`, usage extraction, sanitized error normalization, and focused unit coverage without touching UI code.

## Files touched
- src/lib/ai/adapters/kimi.ts (new, ~95 lines): Kimi adapter with Moonshot base URL, default model, OpenAI-compatible message shaping, usage extraction, and shared sanitizer usage.
- src/lib/ai/adapters/index.ts (modified, ~3 lines): exports and registers `kimiAdapter`.
- tests/unit/kimi-adapter.test.ts (new, ~120 lines): Kimi adapter unit coverage for registration, chat-completions routing, base URL override, message shaping, usage extraction, and redaction.
- tests/unit/test-providers.test.ts (modified, ~6 lines): verifies strict stable-provider smoke now treats Kimi as registered and reports `missing_key`, not `not_registered`.
- .hopper/queue.md (modified): records T07 start/done state.
- .hopper/COST-LOG.md (modified): records estimated task cost.
- .hopper/handoffs/T07-output.md (new): structured task handoff.

## Acceptance verification (5/5)
1. ✓ Kimi adapter implements `prepareMessages`, `extractUsage`, and `normalizeError` — `npm test -- tests/unit/kimi-adapter.test.ts tests/unit/test-providers.test.ts` passed 2 files / 13 tests.
2. ✓ Registry registration succeeds — `tests/unit/kimi-adapter.test.ts` asserts `listAdapters()` contains `kimi` and `getAdapter("kimi")` returns `kimiAdapter`.
3. ✓ T13 smoke command path works — `npm run smoke:providers -- --only=kimi` exits 0 and reports `SKIPPED kimi (missing_key)` with no real key configured.
4. ✓ Dependency/install and type checks pass — `npm install` completed with "up to date"; `npx tsc --noEmit` exited 0.
5. ✓ Scoped lint passes and no UI files were touched — `npm run lint -- src/lib/ai/adapters/kimi.ts src/lib/ai/adapters/index.ts tests/unit/kimi-adapter.test.ts tests/unit/test-providers.test.ts` exited 0; git diff is limited to adapter/test/hopper files.

## Decisions / deviations from spec
- Used `https://api.moonshot.ai/v1` and `kimi-k2.6` as defaults based on the current official Kimi API docs and model list.
- Reused `@ai-sdk/openai` and `provider.chat(config.model)` instead of adding a new dependency because Kimi's API is OpenAI-compatible and the project already depends on `@ai-sdk/openai`.
- Real upstream Kimi smoke was not possible because `SMOKE_KIMI_API_KEY` is not set. The local smoke command still exits 0 per T13 default skip behavior; CI `--require-all-stable` remains the live five-provider gate.
- `npm install` completed without dependency changes; npm reported existing audit warnings (8 vulnerabilities: 4 moderate, 4 high), not introduced by this task.

## Open questions for Leader
none

## Commit
Pending Step 9 atomic commit with message `[T07] Kimi adapter and smoke integration`.

## Next recommendation
T08
