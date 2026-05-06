# Leader Task List — v0.2 Vendor-Agnostic Refactor

Anchor: `.hopper/handoffs/leader-tasklist.md::root`

- Source spec：`docs/plans/2026-05-06-v0.2-vendor-agnostic-refactor.md` (v2)
- Issued by：Leader (Claude Opus 4.7)，**v2 after Critic v1 PASS_WITH_CHANGES**
- Status：**ready for Builder Wave 1**——Critic v1 PASS_WITH_CHANGES 修订项已落地；Builder 可启动 T01

---

## 任务约定

- 每个 task 一个 PR，commit message 前缀 `[T##]`
- PR 描述里贴 task ID + acceptance 自检
- Builder 完成后**自己**先跑 acceptance 列表，全绿再 @Critic
- Critic 审查不通过 → Builder 改 → 再 review，最多 3 轮，第 4 轮还不过 escalate 给 Leader 重新拆 task
- 严重度：S = 1-2h、M = 半天-1天、L = 2-3 天

---

## Task table

| ID | Owner | 标题 | 触碰文件 | Acceptance | 依赖 | 工作量 |
|----|-------|------|----------|------------|------|--------|
| **T01** | Builder (GPT-5.5) | 创建 `src/lib/ai/` 抽象层骨架 | 新增 `src/lib/ai/{types,registry,prompts,pricing,key-storage,request-assembly,route-helpers}.ts`；`adapters/` 目录占位 | types.ts 含 spec §5.2 全部类型（含 capabilities / `prepareMessages` / extractUsage / normalizeError / AdjustedRequest）；route-helpers 暴露 `callAdapter` 签名（实现可留 stub）；registry 暂时空数组；其他文件 stub 但 export 到位；`tsc --noEmit` 通过 | — | M |
| **T02** | Builder (GPT-5.5) | Doubao 重构成第一 adapter；API route 切到 payload-driven + sanitizer | 新增 `src/lib/ai/adapters/doubao.ts`（含 capabilities + `prepareMessages` 默认 passthrough + extractUsage + normalizeError）；改 `src/app/api/chat/route.ts`、`src/app/api/proactive/route.ts` 走 `callAdapter`；`route-helpers.ts` 实装 logger + error sanitizer + `callAdapter`；ESLint custom rule 禁 `console.log(req.*)` | AC1（grep allow-list）+ AC2（route 集成测试用 mock body 切 adapter）+ AC16 部分（route 走 callAdapter，不直接构造 streamText）；request 缺 providerConfig 时返回 400；error response 走 sanitizer；T17 集成测试 scaffolding 准备好后 T02 PR 必须含 ≥2 条 route 集成测试 | T01, T17 | L |
| **T03** | Builder (GPT-5.5) | Settings store 升级 + key-storage Web 实现 + schemaVersion | 改 `src/stores/settings-store.ts`（含 `schemaVersion: 2`）；`src/lib/ai/key-storage.ts`（Web localStorage 实现先行，Tauri 见 T14-impl）；`request-assembly.ts` 实装 `resolveProviderConfig` | settings shape 与 spec §5.4 一致；现有非 AI settings 字段一字不丢；key-storage Web 模式可读写；API key 不进 Zustand persist；`resolveProviderConfig` 单测覆盖 simple/advanced 两 mode；schemaVersion=2 写入；**注意**：v0.1 forward-compat 不再是本任务硬要求（rollback v2 改为手动），但建议加注释提示后续若需 forward-compat 走独立 v0.1.x patch | T01 | L |
| **T04** | Builder (GPT-5.5) | 第 2 个 adapter（Claude）+ smoke 集成 | `src/lib/ai/adapters/claude.ts`（完整实现 capabilities + `prepareMessages` Anthropic-style + extractUsage + normalizeError，**注意**：Anthropic system prompt 走独立 parameter，与 OpenAI-compat 不同，prepareMessages 必须真的不一样）；registry 注册；**改 `package.json` + lockfile** 装 `@ai-sdk/anthropic`（v2 新增） | adapter 实现完整；T13 smoke 对 Claude 通过（`npm run smoke:providers -- --only=claude`）；UI 暂不暴露（等 T05）；**`npm install` + `tsc --noEmit` + `npm run build` 三步全通过**（v2 新增） | T02, T03, **T13** | M |
| **T05** | Builder-UI (Gemini) **+ Builder pair on wiring** | Settings AI 段重写：simple/advanced + provider 选择器 + 接通 resolveProviderConfig | 改 Settings 入口 + 子组件；可能新增 `src/components/settings/ai-settings.tsx`；chat-panel / proactive-panel 改造从 settings 直读 provider 改为调 `resolveProviderConfig` 拿 config；**v0.2 仅暴露 chat/proactive scenario，不出现 summary**（v2） | spec §5.4 的 mode 切换可用；切 provider 后 chat 调对的家（route 集成测试断言）；现有非 AI Settings 字段保留；空状态引导（D4）实现；**所有 chat / proactive 调用点经审计仅通过 `resolveProviderConfig` 取 config**（grep 反向搜索 `keyStorage.get` 仅 1 个调用点）| T03, T17 | L |
| **T06** | Executor-1 (Kimi) | 状态栏读 store 替换"豆包 API"硬编码 | 改 `src/components/layout/status-bar.tsx` | grep `豆包 API` in components/layout/ 返回 0；状态栏显示当前激活 scenario 的 provider 名（通过 `registry.getAdapter(id).name` 渲染）| T03, T05 | S |
| **T07** | Builder (GPT-5.5) | Kimi adapter | `src/lib/ai/adapters/kimi.ts`；registry 注册；如需新依赖**改 `package.json` + lockfile** | T13 smoke 通过；**registry 中注册成功**（不直接改 UI）；adapter 三个核心 method（prepareMessages / extractUsage / normalizeError）完整；`npm install` + `tsc --noEmit` 通过 | T04, T13 | S |
| **T08** | Builder (GPT-5.5) | DeepSeek adapter | `src/lib/ai/adapters/deepseek.ts`；registry；如需新依赖**改 `package.json` + lockfile** | T13 smoke 通过；registry 注册成功；UI 不直接改；`npm install` + `tsc --noEmit` 通过 | T04, T13 | S |
| **T09** | Builder (GPT-5.5) | Cost recording：route 输出 metadata + client 写 IndexedDB（含 idempotency + cancellation） | 改 chat/proactive route 末尾加 finish event with usage（spec §5.3）；新增 `src/stores/ai-call-store.ts`（IndexedDB via idb-keyval）；`src/lib/ai/pricing.ts` 内置 5 家粗算价；client 端在 chat-panel 收 finish 事件 → 写 IndexedDB（按 requestId 去重）；**client 端实现 abort handler**（v2）：`AbortController.abort()` 触发时直接写 `AICallRecord(status='cancelled', tokensUnknown=true, latencyMs=已用时间)`；失败 / cancelled 都写 | AC6 三种 status 各一条 E2E（含 cancellation 由 client 写）；AC14 multi-window 去重单测；usage 缺失时 `tokensUnknown=true` 而非 0；finish event 在 streaming 与 non-streaming 两路均生效；**unknown model → `estimatedUsd: undefined`**（R14）| T02, T05 | M |
| **T10** | Builder-UI (Gemini) | Cost dashboard 视图（三 table，无图表，无 override） | 新增 `src/app/cost/page.tsx`；`src/components/cost/*.tsx`；侧边导航加入口 | 三 table 视图（by provider / by scenario / by day）显示 token 与估算 $；空数据时空状态；**禁**图表库；**禁** pricing override UI；导出 **禁**；unknown pricing 显示 "price unknown" 不套默认价 | T09 | M |
| **T11** | Executor-2 (DeepSeek-flash) | 杂项 sweep + 维护 grep allow-list | grep 全仓库 `DOUBAO|doubao|豆包|createOpenAI`，处理；维护 `.hopper/grep-allowlist.txt` | grep 命中全部位于 allow-list；其他位置改为 "AI provider" 或 dynamic 文案；allow-list 文件本身有清晰注释 | T05, T06 | S |
| **T12** | Executor-1 (Kimi) | message bubble 加 `producedBy` 标注 + chat/proactive 写入 metadata（v2 扩展）| 改 `src/components/ai/message-bubble.tsx`；message 类型加 `producedBy?: {provider, model}`；**改 chat-panel / proactive-panel 让新生成消息真的写入 producedBy**（v2 新增） | bubble 右下角显示 provider 简称；旧消息无该字段不显示且不报错；**新生成消息单测断言含 `producedBy`**（v2）| T09 | S |
| **T13** | Builder (GPT-5.5) | Provider smoke test 脚本 | 新增 `scripts/test-providers.ts`；package.json 加 `npm run smoke:providers` 与 `npm run smoke:providers -- --only=<id>` 与 `npm run smoke:providers -- --require-all-stable`（v2） | 输入：从 env 读测试 keys（命名约定 `SMOKE_<PROVIDER>_API_KEY`）；遍历 registered adapters；对每个发"ping"，断言响应非空且 < 10s；**默认模式**：缺 key 的 provider skip；**`--require-all-stable` 模式**：缺任一 stable key 即 fail（CI ship gate 用此模式）（v2 修订）；支持 `--only` 过滤；CI 与本地行为：CI 强制 `--require-all-stable`，本地默认非严格 | T01 | M |
| **T14-spike** | Builder (GPT-5.5) | Tauri secure storage plugin 调研（**仅文档，不动代码**） | 调研 `tauri-plugin-stronghold` vs `tauri-plugin-store` + OS keyring；半天内出 `docs/plans/2026-05-XX-tauri-key-storage-spike.md`；**不碰 `key-storage.ts` / `tauri.conf.json`** | spike 文档 200-400 字 + 决策清晰（选型 + 理由 + 已知坑） | — | S |
| **T14-impl** | Builder (GPT-5.5) | Tauri secure storage 实装 + DevTools 禁用 + key 导出 utility | 写 `src-tauri/` 端 plugin 接入；`key-storage.ts` 的 Tauri 分支；改 `tauri.conf.json` 禁用生产 DevTools；新增 `npm run export-keys`（rollback 用，spec §6.3 v2） | AC9（key 不在 localStorage / Tauri Web Storage）+ AC10（DevTools 禁用 + 启动验证）通过；export-keys utility 可执行 + 输出环境变量格式；migration bridge（T18a）已存在时不冲突 | T03, **T14-spike**（v2 修订：依赖 spike 决策）| L |
| **T15** | Critic (GPT-5.5, **独立 session**) | T01-T04 PR diff adversarial review | review only | 至少识别 3 个潜在问题或明确"无重大问题"；输出落 `.hopper/handoffs/critic-T01-T04.md` | T01-T04 完成 | M |
| **T16** | Critic (GPT-5.5, **独立 session**) | T09-T10 cost dashboard PR diff review | review only | 同上，落 `.hopper/handoffs/critic-T09-T10.md` | T09-T10 完成 | S |
| **T17** | Builder (GPT-5.5) | API route 集成测试 scaffolding（**v2 update**：vitest 已被 T03 装好）| 加 supertest（或 Next API testing 等价）；新增 `tests/integration/api/` 目录；提供 mock provider helper（不真调上游） | vitest 复用 T03 已设的；scaffolding 跑通；写 1 条 sanity 测试（POST /api/chat with mock providerConfig → adapter 被调）；T02 / T05 / AC16 等后续测试可在此基础上加；**工作量 M → S**（vitest 部分 T03 已做） | T01, T03（T03 已装 vitest） | S |
| **T18a**（v2 拆出）| Builder (GPT-5.5) | Migration bridge：Next API endpoint + Tauri command 读取 legacy DOUBAO env | 新增 `src/app/api/migration/legacy-doubao-key/route.ts`（GET：检测 env，返回 `{found, masked}`）；新增 `src/app/api/migration/import-legacy-doubao-key/route.ts`（POST：写 keyStorage + 返回成功）；Tauri 端对应 command（`read_legacy_doubao_env` / `import_legacy_doubao_env`）；服务端永不返回完整 key 给 client，仅 `masked: 'sk-***xyz'` | 两端 endpoint / command 都返回相同 shape；E2E 模拟 env 存在 / 不存在两种情况；返回值绝不含完整 key（unit test 断言 mask 格式） | T03 | M |
| **T18b**（v2 拆出）| Builder-UI (Gemini) | 首启 migration dialog UI + 空状态引导组件 | 新增 `src/components/onboarding/doubao-import-dialog.tsx`；启动检测 hook 调 T18a bridge；空状态引导组件 | AC11 + AC12 通过；dialog 仅弹一次（已记录"已询问过"标志）；接受路径调 T18a import endpoint → 写 keyStorage；忽略路径走空状态；`DOUBAO_API_KEY` 缺失时不弹 | T18a, T03 | M |

---

## 🔬 Validation-only tasks（不在 v0.2 ship scope；纯为 dogfood 验证 7/7 角色 + 跨家 cost 对比）

| ID | Owner | 标题 | 触碰文件 | Acceptance | 依赖 | 工作量 |
|----|-------|------|----------|------------|------|--------|
| **T-EXE-1** | Executor-1 (Kimi 2.6) | 🔬 给 `src/lib/ai/` public exports 加 JSDoc 注释 | `src/lib/ai/types.ts` / `registry.ts` / `route-helpers.ts` / `request-assembly.ts` / `prompts.ts` / `pricing.ts` / `key-storage.ts` / `adapters/index.ts`（**仅注释行**，不改 logic） | (a) 每个 export（type / interface / function / const）有 1-3 行 JSDoc；@param / @returns 按需；(b) `tsc --noEmit` 仍 pass；(c) `git diff --stat` 显示仅注释行变化（如不确定可在 output.md 里标记需 Leader 确认）；(d) 用 Kimi 长上下文优势：一次吞 7 个文件后批量加注释 | T01 | S |
| **T-EXE-2** | Executor-2 (DeepSeek V4-flash) | 🔬 README.md 加 "AI provider abstraction (v0.2 进行中)" 小节 | `README.md`（仅扩展，不改原有段落） | (a) 新增 15-30 行段落；位置紧跟 "AI Chat 模式" / "AI Proactive 模式" 两条 feature 下方；(b) 内容需描述：vendor-agnostic 目标 / 5 家首发 provider 名单 / 当前为 v0.2 进行中 / 链接到 `docs/plans/2026-05-06-v0.2-vendor-agnostic-refactor.md`；(c) 现有 README 段落顺序不动；(d) markdown 合法 | T01 | S |

**Validation 任务约定**：

- 不进 v0.2 ship gate（不计入 AC1-AC16）
- 不需要 Critic 强制 review；但 Leader 会 `review T-EXE-X` 走完整 v3 协议（验证 review 在 Executor 任务上也工作）
- COST-LOG 必须自报 token / $（这是验证目的之一）
- 如果 Executor session 不会 git commit 或不会按 PING v3 走完整流程，**真实暴露**——出 blocker 我们调 PING.md / 模板

---

## 依赖图（文字版）

```
T01 (foundation types + helpers + callAdapter signature)
 ├──► T02 (Doubao adapter + route refactor + sanitizer + callAdapter impl)   [also depends T17]
 ├──► T03 (settings + key-storage Web + resolveProviderConfig)
 ├──► T13 (smoke script with --require-all-stable)
 ├──► T17 (integration test scaffolding)
 │
T02 + T03 + T13 ──► T04 (Claude adapter, package.json + lockfile + build verify)
 │
T03 + T17 ──► T05 (Settings UI + wiring)
        │
        ├──► T06 (status bar)
        ├──► T11 (sweep + grep allow-list)  [also depends T06]
        └──► T18a (migration bridge, Builder)
                ├──► T18b (migration dialog UI, Builder-UI)
 │
T04 + T13 ──┬──► T07 (Kimi)        ──┐
            └──► T08 (DeepSeek)      ├─► T15 (Critic on T01-T04 batch)
                                     │
T02 + T05 ──► T09 (cost recording w/ idempotency + cancellation)
        │
        └──► T10 (cost dashboard, table-only) ──► T16 (Critic on T09-T10)
        └──► T12 (producedBy in bubble + chat/proactive write metadata)
 │
T14-spike ──► T14-impl (Tauri secure storage + DevTools off + export-keys util)   [also depends T03]
```

---

## Parallel groups（Wave）

**Wave 1** (Day 4)：T01 only

**Wave 2** (Day 5-7)：T17 + T13 + T03 + **T14-spike**（half day, no code） 并行

**Wave 3** (Day 8-10)：T02（依赖 T01+T17）+ T05（依赖 T03+T17）；之后 T04（依赖 T02+T03+T13）；T18a 启动（依赖 T03）

**Wave 4** (Week 2 上半)：T15 critic on T01-T04；T07 + T08（registry-only）；T18b（依赖 T18a）

**Wave 5** (Week 2 下半)：T09 cost recording（依赖 T02+T05 已稳定）；T14-impl（依赖 T03 + T14-spike）；T06 + T11 sweep

**Wave 6** (Week 3)：T10 dashboard；T12 producedBy；T16 critic；ship checklist 跑 AC1-AC16

> **Wave 4 关键约束**：T07 / T08 **不直接改 UI 文件**，UI 由 T05 已在 Wave 3 内从 registry 自动读取；T07 / T08 只动 `adapters/` + `registry.ts` + 必要的 `package.json`，避免与 T06 / T11 / T12 的文件冲突。

---

## Critic 强制规则

- T15 / T16 必须用**独立 session** 跑——同一个 GPT-5.5 账号是可以的，但**新开 chat、不带 Builder 历史**
- Critic prompt 模板待 Builder kick off 前由 Leader 创建（PR diff review 模板，非本次 spec review 模板）
- Critic 输出归档到 `.hopper/handoffs/critic-*.md`，永不删

---

## 阻塞与 escalation

任何 task 出现以下情况立即停下：

1. Smoke test 怎么改都跑不通（Vercel AI SDK 真的不兼容某 provider）→ R2 缓解：从首发名单**移除**该 provider，不允许 ship as experimental
2. Tauri secure storage 所有候选 plugin 都不工作
3. AC1 / AC2 / AC16 之类的 grep / 集成测试发现 spec 写的边界没法落地
4. Critic 第 3 轮仍然不通过
5. Migration bridge（T18a）发现 Next.js API route 不能在 Tauri 桌面 build 里执行，或 Tauri command 命名冲突——这是 v0.2 整体 architecture 假设

→ 回到 `.hopper/MANIFEST.md` 把 cursor 改成 `BLOCKED`，把 issue 写在 `.hopper/handoffs/blocker-<task>.md`，停止后续派发，等 Leader 介入。

---

## Cost log requirement

每个 Builder/Builder-UI/Executor session 完成 task 后，必须在 `.hopper/COST-LOG.md` 追加一行：

```
| 2026-05-XX | T## | <role> | <model> | <tokens_in>/<tokens_out> | <approx $> | 一句话观察 |
```

如果 session 没有自报 token 能力，估一个数字并标注 `~`。**不能留空**——这是 dogfood 的核心数据。

---

## v2 changelog

- **2026-05-06 (v0)**：初版 16 task
- **2026-05-06 (v1)**：Critic v0 FAIL 修订；新增 T17 / T18；wave 重排消除文件冲突
- **2026-05-06 (v2)**：Critic v1 PASS_WITH_CHANGES 修订：
  - **T01**：types.ts 加 `prepareMessages` 与 `AdjustedRequest`；route-helpers 暴露 `callAdapter` 签名
  - **T02**：route 走 `callAdapter` 不直接构造 streamText；AC16 部分覆盖（capability driven dispatch）
  - **T04**：触碰 `package.json` + lockfile；acceptance 加 `npm install + tsc + build`
  - **T07 / T08**：同 T04 处理 dependency
  - **T09**：client abort handler 写 cancellation；unknown model `estimatedUsd: undefined`
  - **T12**：扩 touch 与 acceptance，要求 chat/proactive 真写入 `producedBy` metadata
  - **T13**：加 `--require-all-stable` 模式；CI ship gate 用此模式不允许 skip
  - **T14**：拆为 T14-spike（无依赖，仅文档）+ T14-impl（依赖 T03 + T14-spike）；T14-impl 加 export-keys utility
  - **T18 拆为 T18a + T18b**：T18a Builder 实装 server-side bridge（Next API + Tauri command）；T18b Builder-UI 做 dialog
  - **Wave 4 / Wave 5** 调整以容纳新拆任务
  - **依赖图** 同步更新
  - **escalation** 加 R2 缓解（不允许 experimental ship）和 T18a architecture 假设兜底
