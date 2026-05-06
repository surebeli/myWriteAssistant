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

---

## Leader review

- **Verdict**: ✅ accept
- **Date**: 2026-05-06T17:30:00+08:00
- **Reviewed-by**: leader (claude-opus-4-7)
- **Notes**:
  - Acceptance evidence 是具体的（每条都有 test-name trace），不是空话——这是 v3 协议希望看到的 output 质量
  - `tsx` 选型 vs tsc compile + node：`tsx` 更轻量且与 vitest 习惯一致，OK
  - `--require-all-stable` 的 `not_registered` failure 类型是正确设计：在 T02/T04/T07/T08 登记 adapter 之前，CI smoke gate 自然 block ship，这是 desired behavior 不是 bug
  - **代码结构亮点**：`SmokeResult.reason` enum (missing_key / not_registered / empty_response / timeout / error) + `sendPing` 依赖注入让 unit test 不调真 API。这种设计可以当后续 hopper script 的参考模板
  - **Self-reference 问题**：Builder 主动指出 output.md 的 Commit 段在 Step 9 之前无法填真实 SHA，用"Pending Step 9 atomic commit + message"占位 + Step 10 Report 给真 SHA。这是 protocol 真实限制，处理得当；未来若多次出现会考虑写进 PING.md 的"Step 7.5 注意事项"
  - **Strategic 建议**（不阻塞 accept）：Builder 推荐 next = T14-spike，但**从 critical path 看 T17 更优**——T17 (S 工作量) 完成后 T02 + T05 同时 unblock，进而 T04 / T07 / T08 / T15 链路全活；T14-spike 只 unblock T14-impl 一条线。Leader 建议下一 ping 走 T17 而非 T14-spike
- **Follow-up tasks queued**: none
