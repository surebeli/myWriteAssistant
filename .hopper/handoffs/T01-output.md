# T01 — Builder Output

> **注**：本文件由 Leader 在 PING v3 协议建立后**回溯构造**，原 ping cycle (T01) 是 PING v1 时代，无 output 落盘要求。从 commit `03bfba4` + Builder 当时 CLI report 重组。后续 task 必须在 Step 7.5 自行落盘。

## Summary

创建 `src/lib/ai/` 抽象层骨架。完整定义 v0.2 spec §5.2 所需类型（含 capabilities + prepareMessages + extractUsage + normalizeError + AdjustedRequest + AICallRecord）；route-helpers 暴露 callAdapter 签名 + 工作版 sanitizer（regex 覆盖 Bearer/api_key/authorization）；adapter registry 占位空数组等待 T02 起注册第一个 Doubao adapter。

## Files touched

- `src/lib/ai/types.ts` (new, ~80 lines): 核心类型定义
- `src/lib/ai/registry.ts` (new, ~22 lines): adapter registry + getAdapter/listAdapters/hasAdapter
- `src/lib/ai/route-helpers.ts` (new, ~52 lines): callAdapter + sanitizeProviderError + sanitizeErrorMessage（含 Bearer/api_key/authorization regex）+ logAIRequest（auto-redact providerConfig）
- `src/lib/ai/prompts.ts` (new, stub): prompt 字符串集中位
- `src/lib/ai/pricing.ts` (new, stub): 5 家 token 价格表占位
- `src/lib/ai/key-storage.ts` (new, stub): 待 T03 实装 Web 模式
- `src/lib/ai/request-assembly.ts` (new, stub): 待 T03 实装 resolveProviderConfig
- `src/lib/ai/adapters/index.ts` (new, stub): adapter index 占位
- `src/hooks/use-workspace.ts` (modified, +3 -2): TS narrowing 修复让 tsc --noEmit 通过

## Acceptance verification (5/5)

1. ✓ types.ts 含 spec §5.2 全部类型 — 包括 capabilities / prepareMessages / extractUsage / normalizeError / AdjustedRequest / AICallRecord
2. ✓ registry 暂时空数组 — `providerRegistry: AIAdapter[] = []`
3. ✓ 其他文件 stub 但 export 到位 — prompts/pricing/key-storage/request-assembly 均有 placeholder export
4. ✓ `tsc --noEmit` 通过 — Builder 自报 5/5 verified
5. ✓ route-helpers 暴露 callAdapter — signature 完整

## Decisions / deviations from spec

- **types.ts 用 LanguageModelV2** 而非 spec 写的 `LanguageModelV1`：spec 引用过时（AI SDK 4.x），实际依赖 SDK 5.x 用 V2。Builder 自纠了这个问题。**Leader spec v2+ 已采纳此修正**
- **CoreMessage 别名为 ModelMessage**：AI SDK 5.x 的新名字，types.ts 加 `export type CoreMessage = ModelMessage` 桥接 spec 术语
- **sanitizer 工作版 vs spec 的 stub**：spec 只要求 callAdapter signature，Builder 直接给了 sanitizeErrorMessage 的工作 regex 实现。这是好方向上的 scope expansion，但 T02 应该验证 regex 覆盖度（DOGFOOD 第四观察）
- **use-workspace.ts narrowing 修复**：spec 没要求改这个文件，Builder 修了让 tsc 通过。spec "tsc --noEmit passes" 措辞模糊（whole repo vs only new files），Builder 解读为 repo-wide。**已记录到 HOPPER-FEEDBACK::P3**

## Open questions for Leader

- sanitizer regex 覆盖 Bearer / api_key / authorization 是否足够？是否需要加 `Cookie:` / `x-api-key:` / 其他 provider-specific patterns？（建议在 T02 / T13 smoke 时实测）
- adapter registry 当前是 plain array `AIAdapter[]`，未来要改为 Map 或 lazy init 时是否影响 callsite？

## Commit

`03bfba4 "feat(ai)[T01]: scaffold src/lib/ai/ abstraction skeleton"`

## Next recommendation

T03 (settings store + key storage Web + resolveProviderConfig) 已完成。下一个：T13 (provider smoke script) 或 T17 (集成测试 scaffolding，scope 已被 T03 偷跑一半，剩 supertest)；按 lex order 默认 T13。

---

<!-- Leader review 待补 -->
