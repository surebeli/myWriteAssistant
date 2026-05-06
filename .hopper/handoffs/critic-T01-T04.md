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
