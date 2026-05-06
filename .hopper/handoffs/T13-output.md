# T13 — builder Output

## Summary
Implemented the provider smoke test runner for the vendor-agnostic AI refactor. The script reads `SMOKE_<PROVIDER>_API_KEY` environment variables, walks registered adapters, sends a `ping` prompt through the adapter-created AI SDK model, enforces non-empty responses within the 10s default timeout, skips missing keys in local/default mode, and fails missing keys or unregistered stable providers in `--require-all-stable` mode for CI ship gates.

## Files touched
- scripts/test-providers.ts (new, ~186 lines): CLI smoke runner, argument parser, env key naming, AI SDK ping sender, result formatting.
- tests/unit/test-providers.test.ts (new, ~78 lines): Vitest coverage for env key mapping, `--only`, CI strict mode, skip behavior, strict missing-key failure, and empty-response failure.
- package.json (modified, ~2 lines): adds `smoke:providers` script and `tsx` dev dependency.
- package-lock.json (modified): locks `tsx` and transitive dependencies.
- .hopper/queue.md (modified): marks T13 in-progress then done and appends activity log entries.
- .hopper/COST-LOG.md (modified): appends T13 dogfood cost row.
- .hopper/handoffs/T13-output.md (new): v3 structured output artifact for Leader review.

## Acceptance verification (6/6)
1. ✓ `scripts/test-providers.ts` exists — verified by file creation at `scripts/test-providers.ts`.
2. ✓ `package.json` has `npm run smoke:providers` — verified by `package.json` script `"smoke:providers": "tsx scripts/test-providers.ts"`.
3. ✓ Supports `--only=<id>` — verified by `npm test` covering `parseSmokeArgs(["--only=claude"], { CI: "true" })`.
4. ✓ Supports `--require-all-stable` and CI strict mode — verified by `npm test` covering CI-forced `requireAllStable` and strict missing-key failure.
5. ✓ Default mode skips missing keys while still testing keyed registered providers — verified by `npm test` case `skips providers without keys in default mode`.
6. ✓ Smoke runner asserts non-empty response and default command runs locally — verified by `npm test` empty-response failure case and `npm run smoke:providers` output `No registered providers to smoke test.` with exit 0.

## Decisions / deviations from spec
- Added `tsx` as a dev dependency so `npm run smoke:providers` can execute `scripts/test-providers.ts` directly without a build step.
- In `--require-all-stable` mode, unregistered stable providers fail as `not_registered`. This keeps the CI ship gate closed until all five stable adapters are actually registered.
- The Commit section cannot embed the final short SHA before the atomic commit without making the file self-referential. This artifact records the planned commit message; Step 10 reports the actual SHA.

## Open questions for Leader
none

## Commit
Pending Step 9 atomic commit with message `[T13] provider smoke script`.

## Next recommendation
T14-spike
