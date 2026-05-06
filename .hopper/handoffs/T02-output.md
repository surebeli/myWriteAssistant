# T02 — builder Output

## Summary
Refactored the API routes away from the legacy `process.env.DOUBAO_*` fallback and into the provider abstraction from T01/T17. This adds the first real adapter (`doubao`), registers it, routes chat/proactive requests through `callAdapter`, returns 400 when `providerConfig` is absent, standardizes sanitized provider error JSON, and adds a custom ESLint guard plus integration/unit coverage for the new contract.

## Files touched
- src/lib/ai/adapters/doubao.ts (new, ~90 lines): Doubao OpenAI-compatible adapter with capabilities, passthrough `prepareMessages`, usage extraction, and normalized errors.
- src/lib/ai/adapters/index.ts (modified, ~5 lines): exports registered adapters.
- src/lib/ai/registry.ts (modified, ~2 lines): registers the Doubao adapter.
- src/lib/ai/types.ts (modified, ~2 lines): aligns `createModel` with AI SDK `LanguageModel`.
- src/lib/ai/route-helpers.ts (modified, ~35 lines): adds sanitized error response helpers and keeps `callAdapter` as the only `streamText` caller.
- src/app/api/chat/route.ts (modified, ~60 lines): removes legacy env fallback and dispatches payload-driven chat requests through `callAdapter`.
- src/app/api/proactive/route.ts (modified, ~55 lines): removes legacy env fallback and dispatches proactive requests through `callAdapter`.
- eslint-rules/no-route-request-console-log.mjs (new, ~70 lines): local rule rejecting `console.log(req.*)` / `console.log(request.*)` patterns.
- eslint.config.mjs (modified, ~15 lines): wires the local route logging rule for API route files.
- tests/integration/api/chat-route.test.ts (modified, ~65 lines): covers Claude mock adapter dispatch, missing config 400, and sanitized error JSON.
- tests/integration/api/proactive-route.test.ts (new, ~80 lines): covers Kimi mock adapter dispatch for proactive route.
- tests/unit/doubao-adapter.test.ts (new, ~60 lines): covers adapter registration, passthrough messages, usage extraction, and error normalization.
- tests/unit/route-helpers.test.ts (new, ~40 lines): proves `callAdapter` applies `prepareMessages` before `streamText`.
- tests/unit/eslint-no-route-request-console-log.test.mjs (new, ~30 lines): verifies the local ESLint rule rejects request object logging.
- .hopper/grep-allowlist.txt (new, ~15 lines): initial provider-name grep allow-list for T02/T11.
- .hopper/queue.md (modified): marks T02 in-progress then done and appends activity log entries.
- .hopper/COST-LOG.md (modified): appends T02 dogfood cost row.
- .hopper/handoffs/T02-output.md (new): v3 structured output artifact for Leader review.

## Acceptance verification (8/8)
1. ✓ Doubao adapter implemented and registered — `tests/unit/doubao-adapter.test.ts` passed; `listAdapters()` contains `doubao` and `getAdapter("doubao")` returns `doubaoAdapter`.
2. ✓ Chat/proactive routes use `callAdapter` and no longer construct `streamText` directly — route grep over `src/app/api/**/route.ts` for `streamText|createOpenAI|process\.env\.DOUBAO|console\.error|console\.log\((req|request)` returned no matches.
3. ✓ Missing `providerConfig` returns 400 — `tests/integration/api/chat-route.test.ts` asserts `missing_provider_config` JSON with requestId preserved.
4. ✓ Error responses go through sanitizer — `tests/integration/api/chat-route.test.ts` asserts a provider failure response omits `sk-secret-token` and returns the sanitized `{ code, provider, requestId, message }` shape.
5. ✓ Route integration tests switch adapters via mock body — chat test sends `providerConfig.id = "claude"` and proactive test sends `providerConfig.id = "kimi"`; both assert `getAdapter(...)` and `callAdapter(...)`.
6. ✓ Capability-driven dispatch path covered — `tests/unit/route-helpers.test.ts` asserts `callAdapter` invokes `adapter.prepareMessages(...)` and passes the adjusted system/messages into `streamText`.
7. ✓ Grep allow-list established and verified — `Compare-Object` between grep hits for `DOUBAO|doubao|豆包|createOpenAI` under `src/` and `.hopper/grep-allowlist.txt` returned no diff.
8. ✓ Verification commands passed — fresh `npx tsc --noEmit` exited 0; fresh `npm test` passed 7 files / 20 tests; fresh scoped ESLint for T02 route/config/rule files exited 0; `git diff --check` exited 0.

## Decisions / deviations from spec
- Created `.hopper/grep-allowlist.txt` in T02 even though T11 owns the final sweep. This lets T02 satisfy the grep allow-list acceptance now while leaving T11 a clear artifact to maintain.
- Kept `src/components/layout/status-bar.tsx` hardcoded `豆包 API` as an allow-listed deferred hit because T06 explicitly owns that UI change.
- Full `npm run lint` is currently blocked by an existing `react-hooks/set-state-in-effect` error in `src/components/settings/welcome-dialog.tsx`, outside T02's touched files. Scoped ESLint for all T02 route/config/rule files passes.
- The Commit section cannot embed the final short SHA before the atomic commit without making the file self-referential. This artifact records the planned commit message; Step 10 reports the actual SHA.

## Open questions for Leader
none

## Commit
Pending Step 9 atomic commit with message `[T02] Doubao adapter and route refactor`.

## Next recommendation
T04
