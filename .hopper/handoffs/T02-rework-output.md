# T02-rework — builder Output

## Summary
Done. Wired chat/proactive client hooks to resolve provider configuration before POSTing, added request IDs and scenario fields to the client body, fixed proactive missing-sentence responses to use the sanitized provider error contract, folded in the Doubao manual-verification fix so the OpenAI-compatible adapter uses Chat Completions routing, and aligned route stream output with the client data-stream parser.

## Files touched
- src/hooks/use-chat.ts (modified): resolves chat providerConfig and requestId before calling `/api/chat`.
- src/hooks/use-proactive.ts (modified): resolves proactive providerConfig and requestId before calling `/api/proactive`.
- src/app/api/chat/route.ts (modified): returns data stream protocol chunks for the existing client parser.
- src/app/api/proactive/route.ts (modified): returns structured sanitized `missing_sentence` errors and data stream protocol chunks.
- src/lib/ai/route-helpers.ts (modified): adds explicit legacy data-stream response encoding for `ai@6`.
- src/lib/ai/adapters/doubao.ts (modified): routes Doubao through `provider.chat(model)`.
- tests/integration/client/hooks-request-body.test.tsx (new): verifies chat/proactive fetch body shape.
- tests/integration/api/chat-route.test.ts (modified): verifies chat route data stream protocol output.
- tests/integration/api/proactive-route.test.ts (modified): verifies `missing_sentence` error contract and proactive route data stream protocol output.
- tests/integration/api/helpers/mock-provider.ts (modified): exposes mock `fullStream` chunks for route data-stream tests.
- tests/unit/doubao-adapter.test.ts (modified): verifies Doubao uses Chat Completions routing.
- .hopper/queue.md (modified): records T02-rework start/done state.
- .hopper/COST-LOG.md (modified): records estimated task cost.
- .hopper/handoffs/T02-rework-output.md (new): structured task handoff.

## Acceptance verification (9/9)
1. ✓ `use-chat` POST body includes `{ providerConfig, requestId, scenario: 'chat', messages }` — verified by `tests/integration/client/hooks-request-body.test.tsx`.
2. ✓ `use-proactive` POST body includes `{ providerConfig, requestId, scenario: 'proactive', sentence, context }` — verified by `tests/integration/client/hooks-request-body.test.tsx`.
3. ✓ `requestId` uses `generateRequestId()` — verified by mocked `generateRequestId` in `tests/integration/client/hooks-request-body.test.tsx`.
4. ✓ `providerConfig` uses `resolveProviderConfig(scenario)` — verified by mocked `resolveProviderConfig` in `tests/integration/client/hooks-request-body.test.tsx`.
5. ✓ proactive "Sentence is required" returns sanitized `{ error: { code: 'missing_sentence', provider, requestId, message } }` — verified by `tests/integration/api/proactive-route.test.ts`.
6. ✓ scoped type/build/test checks pass — `npx tsc --noEmit`, `npm test`, targeted Vitest, and scoped ESLint passed.
7. ✓ Doubao manual-verification routing blocker fixed — `tests/unit/doubao-adapter.test.ts` verifies `provider.chat(model)`.
8. ✓ route stream protocol matches current client parser — `tests/integration/api/chat-route.test.ts` and `tests/integration/api/proactive-route.test.ts` verify `0:"text"\n` output.
9. ✓ Manual verification passed — Leader confirmed UI streams and displays the Doubao AI response.

## Decisions / deviations from spec
- Manual verification 暴露 doubao adapter routing 到 OpenAI Responses API（/responses），Doubao 不支持。修复 fold 进本 task：provider() → provider.chat()。同样问题影响所有 OpenAI-compat adapter；T07 (Kimi) / T08 (DeepSeek) / T-OPENAI acceptance 应加 'must use .chat() not default routing' 约束。
- Manual verification 第二轮暴露 stream 协议错配——route toTextStreamResponse 与 client (use-chat.ts line 100) 期待的 Data Stream Protocol 不一致。修复 fold 进本 task：toTextStreamResponse → data stream response（本地 ai@6.0.64 没有 `toDataStreamResponse()`，因此在 `route-helpers.ts` 显式实现 `createDataStreamResponse` 输出 `0:"text"\n`）。同样问题影响 proactive route，已统一修复。

## Open questions for Leader
- none

## Commit
pending — atomic commit will use message `[T02-rework] wire client hooks; fold doubao routing + stream protocol fixes`; final SHA reported in Step 10.

## Next recommendation
Next high-priority builder rework is T-SANITIZER-FIX or T-OPENAI per Leader priority; queue lexicographic default would pick T-OPENAI, but T-SANITIZER-FIX is another Critic T15 ship-risk item.

---

## Leader review

- **Verdict**: ✅ accept (strong)
- **Date**: 2026-05-07T03:30:00+08:00
- **Reviewed-by**: leader (claude-opus-4-7)
- **Notes**:

  **Critic T15 Findings 闭环情况**：
  - **Finding #1** (client/server contract break)：✅ 闭环——use-chat.ts 第 61-69 行 + use-proactive.ts 第 58-66 行均 resolve providerConfig + requestId 后 POST，正确 body shape
  - **Finding #4** (proactive bare error)：✅ 闭环——route 第 38 行返 `code: "missing_sentence"` sanitized contract
  - **Finding #5** (T04 not live-smoked)：✅ 部分闭环——本 task **真的对 Doubao 做了 live smoke**（3 轮 manual verify）；这是 v0.2 第一次真打到上游 provider；T04 Claude 仍未 live-smoke
  - Findings #2 / #3 不在本 task scope（属 T-OPENAI / T-SANITIZER-FIX）

  **3 轮 manual verify 暴露的 hidden bug 与处理**：
  - **第 1 轮**：Doubao 返 403 AccessDenied at `/responses` endpoint。Builder fold 修：`provider() → provider.chat()` 强制 chat completions 路由
  - **第 2 轮**：response body 有内容但 UI 空。Builder fold 修：route 的 `toTextStreamResponse()` → 自实现 data stream encoder（`route-helpers.ts` 的 `createDataStreamResponse`），因 ai@6.0.64 不暴露 `toDataStreamResponse()`
  - **第 3 轮**：✅ UI 流式显示，end-to-end work
  - **关键观察**：每个 fold 都伴随 regression 测试（doubao-adapter.test.ts 加 chat() 路由断言；chat/proactive route test 加 `0:"text"\n` protocol 断言）。Builder 不只 fix 还 lock 防回退

  **代码质量亮点**：
  - 9/9 acceptance 全部具体到 file path + assertion；manual verification 这条留 "Leader confirmed" 是诚实做法不是装作机械可验证
  - `tests/integration/client/hooks-request-body.test.tsx` 新增 194 行——覆盖 mocked `resolveProviderConfig` / `generateRequestId` + body shape 断言；这种"client-side integration test"模式以前没有，Builder 主动建立 pattern
  - `route-helpers.ts` 的 `createDataStreamResponse` 是合理 workaround——AI SDK 升级后回归原生 API 时易拆，commit message 已说明背景

  **Cost 观察**：~$0.85 / ~105k tokens——比常规 L 级 task 贵 3-4x，但因为是 **3 轮 iteration**（每轮包括 read context + fix + test + report）。这暴露 manual verification cycle 的 cost 真实——值得在 essay 里讨论"protocol 多轮 cost vs 协议简化省时但漏 bug"的 trade-off

  **Strategic next**：
  - Builder 推荐 next = T-SANITIZER-FIX or T-OPENAI（lex order T-OPENAI 先），与 Leader 想法一致——**T-SANITIZER-FIX 优先**（Critic Finding #3 ship-risk，与 T02 同源；T-OPENAI 是补 5-stable gate 但不阻塞核心）
  - 注意 T07/T08/T-OPENAI 都将复用 OpenAI-compat 模式（共享 Doubao 已修的 `provider.chat()` pattern + data stream encoder）；如 Builder 之前没在那些 adapter 复用 doubao 模板，要 explicit 加约束

- **Follow-up tasks queued**: 
  - 无新 task，但 HOPPER-FEEDBACK 将记一组观察（live-smoke 必要性 / SDK 版本飘移 / manual verify 必须循环 / Builder 多轮 fold 修复模式）
  - PING.md 可能升 v5：adapter-touching tasks 必须含 live smoke against real upstream（实施成本：每 adapter task 多 5-10 分钟手工，但 catch ship-blocker bug 的 ROI 巨大）
