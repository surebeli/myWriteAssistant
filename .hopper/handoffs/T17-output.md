# T17 — builder Output

## Summary
Added API integration test scaffolding for Next route handlers using Vitest plus Supertest. The scaffold includes a small HTTP bridge for `POST(req: Request)` style route handlers, a mock provider helper, and one `/api/chat` sanity test proving a request with `providerConfig` dispatches through the selected adapter without reaching an upstream provider. The route received a minimal providerConfig branch to satisfy the test while preserving the existing legacy path for T02 to fully refactor.

## Files touched
- tests/integration/api/chat-route.test.ts (new, ~60 lines): Supertest sanity test for `POST /api/chat` with mock `providerConfig`.
- tests/integration/api/helpers/next-route-server.ts (new, ~54 lines): converts Node HTTP requests into Web `Request` objects and returns route `Response` objects to Supertest.
- tests/integration/api/helpers/mock-provider.ts (new, ~30 lines): reusable mock adapter and text stream response helpers.
- src/app/api/chat/route.ts (modified, ~16 lines): adds minimal `providerConfig` branch using `getAdapter` and `callAdapter`.
- package.json (modified): adds `supertest` and `@types/supertest` dev dependencies.
- package-lock.json (modified): locks Supertest dependency tree.
- .hopper/queue.md (modified): marks T17 in-progress then done and appends activity log entries.
- .hopper/COST-LOG.md (modified): appends T17 dogfood cost row.
- .hopper/handoffs/T17-output.md (new): v3 structured output artifact for Leader review.

## Acceptance verification (5/5)
1. ✓ Supertest or equivalent added — `package.json` includes `supertest` and `@types/supertest`.
2. ✓ `tests/integration/api/` directory exists — verified with `Get-ChildItem -Recurse -File tests\integration\api`.
3. ✓ Mock provider helper provided — `tests/integration/api/helpers/mock-provider.ts` exports `createMockAdapter` and `createMockTextStreamResult`.
4. ✓ Sanity test covers `POST /api/chat` with mock `providerConfig` and adapter dispatch — `npm test` includes `tests/integration/api/chat-route.test.ts`, asserting `getAdapter("openai")` and one `callAdapter(...)` call.
5. ✓ Scaffolding runs cleanly — fresh `npm test` passed 3 files / 11 tests, and fresh `npx tsc --noEmit` exited 0.

## Decisions / deviations from spec
- Kept the existing legacy Doubao route path when `providerConfig` is absent. This is intentional because T02 owns the full route refactor and env fallback removal; T17 only adds the integration scaffold and one sanity path.
- The route now has a minimal providerConfig branch before T02. This is a small scope expansion required for T17's acceptance criterion that the sanity test prove adapter dispatch.
- The Commit section cannot embed the final short SHA before the atomic commit without making the file self-referential. This artifact records the planned commit message; Step 10 reports the actual SHA.

## Open questions for Leader
none

## Commit
Pending Step 9 atomic commit with message `[T17] API route integration scaffold`.

## Next recommendation
T14-spike
