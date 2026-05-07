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

---

## Leader review

- **Verdict**: ✅ accept (strong)
- **Date**: 2026-05-07T11:35:00+08:00
- **Reviewed-by**: leader (claude-opus-4-7)
- **Notes**:

  **Critic T15 Finding #3 完整闭环**：
  - regex 现覆盖：`Bearer` / `api_key=` / `api-key:` / `x-api-key` (有/无冒号) / `Authorization` (有/无冒号) / 自然语言 `API key provided:` / 自然语言 `API key X` / bare `sk-...` / bare `sk-ant-...`
  - Critic 给的具体例子 `Incorrect API key provided: sk-secret-token` → `Incorrect API key provided: [redacted]`：单测 explicit assert
  - Bonus：bare key 形态既覆盖短 test key（`sk-secret-token`）也覆盖 production 长 key（`sk-1234567890abcdefghijklmnopqrstuvwxyz`）

  **架构清理亮点**：
  - 独立 grep 验证：`redactSensitiveText` 在 doubao.ts 和 claude.ts **彻底消失**——T02 时各 adapter 写的本地 regex 拷贝全清掉，统一走 `route-helpers.ts:107` 的 `sanitizeErrorMessage`
  - 这是真正的 "single source of truth for sanitizer" 落地，不只是名义共享
  - Builder 主动留 note 给 T-OPENAI / T07 / T08："future adapters should import sanitizeErrorMessage from route-helpers"——预防协议漂移

  **Single ping → done，无 prose 中断**：
  - 你之前关切的"ping 需要转发太多指令"在本 task 上得到反证——纯 regex + unit test 类 task 完全按原始设计跑：`ping T-SANITIZER-FIX` → 自动 pop → 完成 → done + commit + report，全程 0 out-of-band dispatch
  - 这印证 T02-rework 的 prose 是**因为 manual verify 真的 catch production bug**才发生的，不是协议本身漏（虽然有改进空间）
  - 协议设计 vindicate

  **Strategic next**：T-OPENAI（lex 默认 + 唯一剩余 rework + 填 5-stable gate）。这次预期也是 single-ping done（OpenAI adapter 是 registry-only 模式，无 manual verify 需求；不过应该跑 live smoke 确保 OpenAI 这家也是 chat completions 默认 routing OK——T02-rework 暴露的 OpenAI-compat routing 问题在 OpenAI 官方上其实没有，但保险起见）

- **Follow-up**: 无新 task；HOPPER-FEEDBACK 加一条**O12（正面）**："regex/test 类 task 在 PING 协议下 single-ping done 是常态，证明协议设计在 happy path 上 work；prose-heavy cycle 仅发生在 manual-verify-with-real-bugs 场景"
