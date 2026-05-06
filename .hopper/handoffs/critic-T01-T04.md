# Critic Review — T01-T04 Batch

Date: 2026-05-06T23:54:36.2865457+08:00
Role: critic
Model: GPT-5.5 Codex
Scope: T01/T02/T03/T04 provider abstraction batch, with T13/T17 read as supporting infrastructure.

## Verdict

**REWORK before landing T01-T04 as an independent PR boundary.**

The abstraction shape is directionally sound, and AC16's `prepareMessages` path is real behavior, not a type-only flag. The blocking problem is integration boundary: the refactored routes now require `providerConfig`, but the current product hooks still post legacy bodies. There is also a plan-level gap for OpenAI: v0.2 declares five stable providers and the smoke gate enforces five, but the registry and task queue only have Doubao, Claude, Kimi, and DeepSeek coverage.

## Findings

### 1. [P1] (confidence: 10/10) Current Chat/Proactive UI 400s against the refactored routes

Evidence:
- `src/app/api/chat/route.ts:30` returns `missing_provider_config` when `providerConfig` is absent.
- `src/app/api/proactive/route.ts:30` does the same before sentence validation.
- `src/hooks/use-chat.ts:61` posts only `{ messages, context }`.
- `src/hooks/use-proactive.ts:58` posts only `{ sentence, context }`.

Impact: After T02, the existing UI can no longer call either route. Chat adds an assistant placeholder, receives HTTP 400, and falls into the generic error path; Proactive silently fails through its error handler. T05 is planned to wire `resolveProviderConfig`, but that means T01-T04 is not a shippable PR boundary by itself.

Recommendation: Either make T05 a hard landing dependency for this batch, or move minimal client request assembly into the T02 boundary so the product never lands in a route/client mismatch state.

### 2. [P1] (confidence: 10/10) OpenAI is declared stable but has no adapter task or registry entry

Evidence:
- `src/lib/ai/types.ts:7` includes `"openai"` in `AIProviderId`.
- `scripts/test-providers.ts:7` includes `"openai"` in `STABLE_PROVIDER_IDS`.
- `src/lib/ai/adapters/index.ts:8` registers only `[doubaoAdapter, claudeAdapter]`.
- `.hopper/handoffs/leader-tasklist.md:31` and `:32` queue Kimi and DeepSeek adapters, but there is no OpenAI adapter task.
- `npm run smoke:providers -- --require-all-stable` currently fails with `FAILED openai (not_registered)` in addition to the expected missing-key failures.

Impact: AC3 cannot pass even after T07/T08 unless OpenAI is added or explicitly removed from v0.2 stable scope. This is not just pending implementation; the task graph has no owner for the missing provider.

Recommendation: Leader should queue an OpenAI adapter task before the ship gate, or revise the spec/smoke stable list to four providers.

### 3. [P1] (confidence: 9/10) Error redaction misses common bare API-key messages

Evidence:
- Global sanitizer only matches `Bearer ...`, `apiKey=...`, and `authorization: ...` forms at `src/lib/ai/route-helpers.ts:71`.
- Doubao adapter repeats the same narrower patterns at `src/lib/ai/adapters/doubao.ts:98`.
- Claude adds `x-api-key`, but still misses whitespace label forms and bare key strings at `src/lib/ai/adapters/claude.ts:95`.
- Replaying the current regexes against `Incorrect API key provided: sk-secret-token` leaves the key unchanged.

Impact: Provider errors often phrase auth failures as natural language, not `apiKey=...`. AC9/AC13 require API keys to be absent from API route error response messages; this redactor can leak a user key if upstream includes it in a message.

Recommendation: Use one shared redactor and add tests for bare `sk-...`, `sk-ant-...`, whitespace labels like `API key provided: ...`, `x-api-key: ...`, and JSON-ish fields. Route helpers and adapters should call the same function.

### 4. [P2] (confidence: 8/10) Proactive validation bypasses the standardized error contract

Evidence:
- `src/app/api/proactive/route.ts:34` returns `Response.json({ error: "Sentence is required" }, { status: 400 })`.
- The spec requires API route errors to return `{ error: { code, provider, requestId, message } }`.

Impact: Client-side failure/cost recording work in T09 will need a consistent `requestId` and `errorCode`; this path loses both. It also creates a second response shape for the same route family.

Recommendation: Return a sanitized structured error, for example `code: "missing_sentence"`, `provider: providerConfig.id`, `requestId`, and `message: "Sentence is required."`.

### 5. [P2] (confidence: 8/10) T04 did not prove live Claude smoke compatibility

Evidence:
- T04 acceptance says Claude smoke should pass, but `.hopper/handoffs/T04-output.md` records `SKIPPED claude (missing_key)`.
- Strict smoke currently fails missing keys for Doubao/Claude and `not_registered` for OpenAI/Kimi/DeepSeek.

Impact: The Claude package compiles and the command is wired, but upstream Anthropic compatibility remains unverified in this environment. That is acceptable for local development only if CI is guaranteed to run `--require-all-stable` with real keys before ship.

Recommendation: Keep T04 accepted as adapter wiring, but do not count it as a live provider smoke pass. The ship checklist must distinguish "command path works" from "provider compatibility proved".

## Non-Findings Verified

- `callAdapter()` is the only `streamText` call path in the reviewed API routes.
- `keyStorage.get(...)` appears only in `src/lib/ai/request-assembly.ts`, matching the single request-assembly contract for future client wiring.
- AC16's provider-specific `prepareMessages` behavior is real: Claude keeps `system` separate while Doubao moves it into the message array.
- The current Doubao grep allow-list matches the expected deferred hits, including the T06-owned status bar label.

## Verification Performed

- Read `.hopper/PING.md`, `.hopper/queue.md`, `.hopper/handoffs/leader-tasklist.md`, and the v0.2 plan.
- Read T01/T02/T03/T04 outputs plus T13/T17 supporting outputs.
- Inspected the T01/T02/T03/T04 code surface under `src/lib/ai`, `src/app/api`, `src/hooks`, `tests`, `scripts`, and eslint rule files.
- Ran `git fetch origin`.
- Ran `git diff --check 03bfba4^..2576ee1 -- src/lib/ai src/app/api tests scripts package.json package-lock.json eslint.config.mjs eslint-rules` (passed).
- Ran `npm run smoke:providers -- --require-all-stable` outside the sandbox after Node hit a sandboxed `EPERM`; command failed as expected with missing keys and unregistered providers.

## Next Recommendation

Leader should decide whether T01-T04 is allowed to remain an internal, non-shippable intermediate batch until T05 lands. If not, send a rework task to wire minimal `resolveProviderConfig` into `use-chat` and `use-proactive` before this batch can land. Also queue or remove OpenAI before T07/T08 continue the adapter wave.

---

## Leader response

- **Date**: 2026-05-07T00:20:00+08:00
- **Reviewed-by**: leader (claude-opus-4-7)
- **Verdict acceptance**: ✅ **Critic 的 REWORK verdict 完全接受**——3 个 P1 全部为真实 ship-blocking issue，不是过度严苛
- **承认的 Leader review 盲点**：
  - 我做 T02 review (strong accept) 时**只检查了后端 AC1（grep allow-list），没验证 client side 是否还在 post 旧 body shape**——Critic Finding #1 是我应当抓但没抓到的核心整合问题
  - T04 review 时也没验证 OpenAI 是否真有 adapter——`STABLE_PROVIDER_IDS` 含 "openai" 但 registry 没有，是 spec 设计与 task 拆分的不一致，我作为 spec 作者应该在拆 task 时就发现
  - sanitizer 的 regex 我以为"覆盖 Bearer/api_key/authorization"就够了，没想到 upstream 报错是自然语言形态（"Incorrect API key provided: sk-..."）
  - **这次 dogfood 强烈印证：Leader review 与 Critic batch review 是互补的，单 Leader review 不够**

### Action plan（每 finding 对应一个新 task）

| Finding | Action | New task |
|---------|--------|----------|
| #1 client/server break | wire resolveProviderConfig 进 use-chat / use-proactive；同时 fold finding #4（proactive bare error）一起修 | **T02-rework** (builder, deps T02, M) |
| #2 OpenAI 缺 adapter | 加 OpenAI adapter（同 Kimi/DeepSeek 模式） | **T-OPENAI** (builder, deps T04+T13, S) |
| #3 sanitizer regex gap | 扩展 sanitizer 覆盖 bare sk-.../sk-ant-.../whitespace label/x-api-key forms；统一所有 adapter normalizeError 走共享 sanitizer | **T-SANITIZER-FIX** (builder, deps T02, S) |
| #4 (P2) proactive bare error | fold into T02-rework | — |
| #5 (P2) T04 not live-smoked | 不加 task；ship checklist 加一条"distinguish wiring-works vs live-verified"；CI 必须 `--require-all-stable` with real secrets | (doc only) |

### 关于 PR boundary

- T01-T04 batch **不再算 shippable PR**——必须先完成 T02-rework + T-SANITIZER-FIX 才能 land
- T05 重新升级为"配套 task"（之前是独立任务），实际上 T02-rework 完成 client wiring 后 T05 的 Settings UI 就 build on real working hooks
- T-OPENAI 不阻塞 land 顺序但必须 T07/T08 之前完成（避免 5-stable gate 失败）

### Verdict 落地

- Critic-T15 verdict 为 REWORK；3 个 rework task 已加进 queue + tasklist
- T02 与 T04 的原 review verdict 不撤回（accept 在当时是基于"AC1 grep + AC16 prepareMessages 工作"是合理的），但 critic-T01-T04.md 现在是这一批的**真实交付状态**——T02-rework + T-SANITIZER-FIX 完成才算批次实际 ship-ready
- Builder 下一 ping 应优先 **T02-rework**（最高优先级，ship-blocker），然后 T-SANITIZER-FIX，再 T-OPENAI
- T07/T08 推迟到 T02-rework + T-SANITIZER-FIX done 之后
