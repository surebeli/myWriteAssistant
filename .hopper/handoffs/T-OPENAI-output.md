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

---

## Leader review

- **Verdict**: ✅ accept (strong)
- **Date**: 2026-05-07T11:50:00+08:00
- **Reviewed-by**: leader (claude-opus-4-7)

  **Critic T15 Finding #2 闭环**（最后一个未闭环的 Critic finding）：
  - OpenAI 现已注册到 registry（adapters/index.ts 第 10 行 `[doubaoAdapter, claudeAdapter, openaiAdapter]`）
  - `npm run smoke:providers -- --require-all-stable` 之后 OpenAI 报 `missing_key` 而非 `not_registered`
  - 单测断言 `listAdapters()` 含 `openai` + `getAdapter("openai")` 返 openaiAdapter

  **学习迁移亮点（这是协议外的智力贡献）**：
  - Builder 主动用 `provider.chat(config.model)` routing（openai.ts 第 26 行）——OpenAI 官方其实两条路都支持（`/responses` + `/chat/completions`），用默认 routing 也 work
  - Deviation 段明确写 "folds in the T02-rework manual-verification learning"——**Builder 把上一 task 暴露的 lesson 主动带到下一 task，没需要 Leader 提醒**
  - 这是 dogfood 强信号：协议留 prompt-only flow 不限定具体实现，Worker 在 task 间自我累积工程 wisdom，转化成"防御性默认"。**比 Leader prescribe 强**

  **架构一致性**：
  - 共享 `sanitizeErrorMessage` 复用（openai.ts 第 3 行 import） ✅
  - registry 注册按 doubao / claude / openai 顺序 ✅
  - test 文件结构与 doubao / claude 一致（覆盖 capabilities + routing + prepareMessages + extractUsage + normalizeError + sanitization）✅

  **Single ping → done，0 prose**：与 T-SANITIZER-FIX 同模式，再次印证协议 happy path 正常 work。

  **Strategic next**：
  - **3 个 Critic rework 全部闭环**（T02-rework #1+#4 / T-SANITIZER-FIX #3 / T-OPENAI #2 / T02-rework Doubao live-smoke 部分覆盖 #5）
  - 现在 Builder Codex 可以走 standard build：T07 (Kimi) / T08 (DeepSeek) / T14-spike (Tauri storage 调研)
  - lex 默认下次 ping 会 pop T07 → T08 → T14-spike
  - **但建议在做 T07/T08 之前 pause 一次** —— dogfood 至此累积材料够多（HOPPER-FEEDBACK 5+9+12 条），值得 sync v5 + 起 HN essay 第一稿，避免再堆 task 增加未沉淀负债

- **Follow-up**: 
  - 下一 ping 之前建议 pause 让 Leader 决定走"继续 build"还是"sync + essay"
  - 无新 task
