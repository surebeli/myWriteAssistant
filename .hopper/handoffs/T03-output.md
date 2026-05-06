# T03 — Builder Output

> **注**：本文件由 Leader 在 PING v3 协议建立后**回溯构造**，原 ping cycle (T03) 在 PING v2 时代，未要求落盘 output。从 commit `fa78cc6` + Builder CLI report 重组。后续 task 必须在 Step 7.5 自行落盘。

## Summary

Settings store 升级到 v0.2 schema（含 `schemaVersion: 2` + AISettings 扩展支持 simple/advanced mode + per-scenario provider 配置），落地 key-storage Web 实装（localStorage 后端，API key 不进 Zustand persist），落地 `resolveProviderConfig` 单一入口（D1/§5.3.1 contract），加 5 个 unit test 覆盖 simple/advanced 两 mode + 缺 key 异常路径。Vitest 配置同时落盘（虽是 T17 范围但 T03 acceptance 含"单测覆盖"使其必须）。

## Files touched

- `src/stores/settings-store.ts` (modified): 加 `schemaVersion: 2`；ai 段重构为 `mode/simple/perScenario` 结构
- `src/lib/ai/key-storage.ts` (modified, ~50 lines): Web 模式 localStorage 实装，提供 get/set/delete 接口
- `src/lib/ai/request-assembly.ts` (modified, ~30 lines): 实装 `resolveProviderConfig` + `generateRequestId` + `MissingProviderConfigError`
- `src/lib/ai/types.ts` (modified): 加 `AISettingsV2` 与 `AIScenarioProviderSettings` 类型
- `tests/unit/request-assembly.test.ts` (new): 5 个测试覆盖 simple mode / advanced mode / scenario fallback / missing key error / requestId 生成
- `vitest.config.ts` (new): Vitest 配置（**注：本属 T17 范围**）
- `package.json` + `package-lock.json` (modified): 加 vitest dev dep

## Acceptance verification (7/7)

1. ✓ settings shape 与 spec §5.4 一致 — `schemaVersion: 2` / `mode: simple|advanced` / `simple` + `perScenario` 全部到位
2. ✓ 现有非 AI settings 字段一字不丢 — 扩展而非替换
3. ✓ key-storage Web 模式可读写 — localStorage backend 测试覆盖
4. ✓ API key 不进 Zustand persist — keyStorage 完全独立于 settings store
5. ✓ resolveProviderConfig 单测覆盖 simple/advanced — 5/5 test pass
6. ✓ schemaVersion=2 写入 — store 初始化即带
7. ✓ npm test → 5/5 pass + npx tsc --noEmit → pass — Builder 自报全绿

## Decisions / deviations from spec

- **Vitest 配置 T03 装了**：T17 (scaffolding) 原本应该 T17 装，但 T03 acceptance 含"单测覆盖"必须能跑测试，Builder 顺手装了。**已记录到 HOPPER-FEEDBACK::P5**；T17 scope 已被 Leader 缩到只剩 supertest + integration scaffolding（M → S）
- **schemaVersion forward-compat 注释未加**：spec v2 §6.3 提到"建议加注释提示后续若需 forward-compat 走独立 v0.1.x patch"，Builder 没加。这是 nice-to-have 不是 must；可以在 T05 / T18a 修整时顺手补
- **key-storage Tauri 分支占位**：Web 模式已实装，Tauri 模式留给 T14-impl

## Open questions for Leader

- T17 现在 scope 缩到很小（半小时？），要不要 merge 到 T02（route refactor 时顺便加 supertest + 1 sanity test）？还是保持 T17 独立避免 T02 PR 太大？
- resolveProviderConfig 在 advanced mode 下若 perScenario 缺该 scenario 的配置，目前 fallback 到 simple——这个 fallback 行为是否要在 spec 里 explicit 记一下？

## Commit

`fa78cc6 "[T03] settings schema and provider config resolution"`

## Next recommendation

按 lex order：T13 (smoke script，工作量 M)。但 strategic 建议优先 T17 (现已 S，能解锁 T02 + T05)；若 Leader 接受 "T17 merge into T02"，则 T13 直接跑。

---

<!-- Leader review 待补 -->
