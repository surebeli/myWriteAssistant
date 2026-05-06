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
