# T-SANITIZER-FIX — builder Output

## Summary
Expanded the shared `sanitizeErrorMessage` redaction patterns to cover Critic T15 credential leakage cases, including whitespace-separated labels, `x-api-key`, `Authorization`, bare OpenAI-style keys, and bare Anthropic-style keys. Existing provider adapters now reuse the shared sanitizer instead of carrying duplicated local regexes.

## Files touched
- src/lib/ai/route-helpers.ts (modified): expanded `sanitizeErrorMessage` patterns for label/header/bare key redaction.
- src/lib/ai/adapters/doubao.ts (modified): imports and calls shared `sanitizeErrorMessage` in `normalizeError`.
- src/lib/ai/adapters/claude.ts (modified): imports and calls shared `sanitizeErrorMessage` in `normalizeError`.
- tests/unit/route-helpers.test.ts (modified): adds redaction cases for Critic T15 sanitizer examples.
- .hopper/queue.md (modified): records T-SANITIZER-FIX start/done state.
- .hopper/COST-LOG.md (modified): records estimated task cost.
- .hopper/handoffs/T-SANITIZER-FIX-output.md (new): structured task handoff.

## Acceptance verification (4/4)
1. ✓ Regex coverage added — `tests/unit/route-helpers.test.ts` covers `Bearer X`, `api_key=X`, `api-key: X`, `x-api-key: X`, `x-api-key X`, `Authorization: X`, `Authorization X`, `API key provided: X`, `API key X`, `api key: X`, bare `sk-...`, and bare `sk-ant-...`.
2. ✓ Critic concrete example covered — `Incorrect API key provided: sk-secret-token` becomes `Incorrect API key provided: [redacted]` in `tests/unit/route-helpers.test.ts`.
3. ✓ Existing adapters reuse shared sanitizer — grep shows `sanitizeErrorMessage` imported/called in `src/lib/ai/adapters/doubao.ts` and `src/lib/ai/adapters/claude.ts`; no `redactSensitiveText` remains in existing adapters.
4. ✓ Scoped verification passed — `npm test`, `npx tsc --noEmit`, targeted Vitest, scoped ESLint, and adapter grep all passed.

## Decisions / deviations from spec
- The task spec mentions future adapter files for OpenAI/Kimi/DeepSeek, but this branch currently only has `doubao.ts` and `claude.ts` under `src/lib/ai/adapters/`. I updated all existing adapters and left no local adapter redactor behind. Future T-OPENAI/T07/T08 adapter implementations should import `sanitizeErrorMessage` from `route-helpers.ts`.
- The bare `sk-...` redaction is intentionally broad enough to cover Critic's short `sk-secret-token` example as well as longer production-looking keys.

## Open questions for Leader
- none

## Commit
pending — final SHA reported in Step 10.

## Next recommendation
`T-OPENAI` is the next pending builder rework by queue order and fills the 5-stable provider registration gap.
