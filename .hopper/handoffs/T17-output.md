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

---

## Leader review

- **Verdict**: ⚠ accept-with-note
- **Date**: 2026-05-06T17:50:00+08:00
- **Reviewed-by**: leader (claude-opus-4-7)
- **Notes**:
  - Acceptance evidence 是具体的——5/5 都有 file path 与 assertion 内容（`getAdapter("openai")` / `callAdapter(...)`），不是空话
  - 11 tests + tsc --noEmit 全过；测试 scaffolding 真的能跑而不是只搭壳
  - **Reusable 基础设施亮点**：(a) `helpers/next-route-server.ts` 桥 Node HTTP req → Web Request（Next.js 16 route handler 接 Web Request，Supertest 用 Node HTTP，必须有这个 bridge）；(b) `helpers/mock-provider.ts` 的 `createMockAdapter` + `createMockTextStreamResult` 是 T02 / T05 / AC16 都会复用的——T17 等于把整套测试基建钉好了，下游 task 写测试成本会显著降
  - **关键 note → T02**：T17 在 chat/route.ts 加了"minimal providerConfig 分支"（保留 legacy env-read else-branch）让 sanity test 跑通——这是必要的 scope expansion，但**T02 必须删 else-branch 与 legacy env 代码**，否则 AC1（grep allow-list）会抓到 src/app/api/chat/route.ts 里残留 `process.env.DOUBAO_*`。这个约束应该明示给 T02 Builder
  - Self-reference 处理沿用 T13 模式（"Pending Step 9 atomic commit + message"占位 + Step 10 给真 SHA）；这已经是 implicit pattern，未来批量出现再统一写进 PING.md
  - Builder 再次推荐 T14-spike 为 next；**Leader 仍倾向 T02**——T17 已经把 mock 基建打底，T02 是 critical path 上能立刻吃这个红利的 task；T14-spike 推到下一波 OK
- **Follow-up tasks queued**: none（T02 acceptance 已经覆盖"删 legacy path"，无需新加 task；只要 T02 PR review 时 Critic 抓住 grep 即可）
