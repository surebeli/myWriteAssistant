---
critic: gpt-5.5
generated: 2026-05-06T12:06:24.6958278+08:00
verdict: FAIL
revisions_required_count: 12
---

## Section 1: Spec issues

### Issue 1

- **Severity**: 高
- **Location**: §4 D1 lines 44-54, §4 D7 lines 94-100, §5.2 lines 130-134, §5.4 lines 185-193
- **Issue**: D1 要求每次 request payload 携带 `apiKey`，D7 又声称 Tauri key 放 secure storage 且 UI 不感知底层，但 spec 没定义“发请求前谁从 secure storage 取 key、何时注入 payload、如何避免持久化”的流程。
- **Failure mode**: Builder 会在 T02/T03/T05 之间各自补洞：route 需要 `providerConfig.apiKey`，Settings store 又不能存 key，UI 又要切 provider 立即生效；最终不是 chat 拿不到 key，就是把 key 塞回 Zustand/localStorage，直接打穿 AC9。
- **Suggested fix**: 在 §5.3 前补一段 client request assembly contract：由单一 `resolveProviderConfig(scenario)` 读取 settings + `keyStorage.get()`，只在内存中拼出带 key 的 payload，并规定 API route、UI、store 都不得自行拼 config。

### Issue 2

- **Severity**: 高
- **Location**: §4 D1 lines 46-54, §4 D7 lines 96-100, §7 AC9 lines 228-229
- **Issue**: “API key 走 payload”被写成安全前提，但 Tauri webview 到 Next API route 的 request body 仍会出现在 DevTools network、debug logging、error reporting、proxy/tracing middleware 或 crash dump 中；secure storage 只保护静态存储，不保护传输面。
- **Failure mode**: AC9 只检查“不出现在 localStorage”会通过，但桌面端实际仍可在 DevTools 或日志中看到 API key；这会制造一个看似安全、实则泄露路径更多的版本。
- **Suggested fix**: §4/D7 和 AC9 必须扩展为“不进入 persistent storage + 不进入 client-visible request logs”，并指定 production Tauri 禁用 DevTools、API route 禁止记录 body、错误对象不得包含 `providerConfig`。

### Issue 3

- **Severity**: 高
- **Location**: §5.2 lines 137-143, §4 D2 lines 58-65, §5.3 lines 161-173
- **Issue**: `AIAdapter.createModel(config) => LanguageModelV1` 只抽象了 model factory，没有抽象 provider capability：system prompt 支持方式、usage metadata 返回位置、streaming end event、baseURL/header 差异、OpenAI-compatible provider 的非标准错误格式都没有 contract。
- **Failure mode**: 5 个 adapter 可以“存在”并通过 ping，但 chat/proactive 在真实 system+user prompt、streaming、usage extraction、错误处理上各走各的；尤其 Claude 与 OpenAI-compatible 的 usage/token 字段不同，会让 AC3、AC6、AC7 同时变成伪通过。
- **Suggested fix**: §5.2 必须给 `AIAdapter` 增加 `capabilities`、`buildRequest` 或 `normalizeResult` contract，至少覆盖 `supportsSystem`, `streamingMode`, `extractUsage`, `normalizeError`, `defaultBaseURL`。

### Issue 4

- **Severity**: 高
- **Location**: §4 D6 lines 84-93, §5.3 lines 170-173, §7 AC6-AC7 lines 225-227
- **Issue**: Cost recording 的核心传输方式写成“response trailer 或 streaming end event”，但没有规定 chat/proactive 当前到底是 streaming 还是 non-streaming，也没有定义失败、取消、中断、无 usage 返回时的记录规则。
- **Failure mode**: T09 可以随便选一种实现导致另一路 API 不记账；部分 provider 不返 token usage 时 dashboard 仍显示 0 或空值，看起来 AC6 过了但 cost 数据不可用；stream 中断时甚至可能永远写不进 IndexedDB。
- **Suggested fix**: §5.3 明确统一响应协议：每个 route 必须在 final JSON/SSE `finish` event 返回 `usage`，无 usage 时记录 `tokensUnknown: true` 而不是写 0，并把失败/取消是否记账写进 AC6。

### Issue 5

- **Severity**: 中
- **Location**: §3 lines 28-40, §4 D6 lines 84-93, §7 AC7 line 226
- **Issue**: §3 明说“任何新功能”out of scope，但 §2/§4/§7 又强制新增 cost dashboard、pricing override 和三视图；这是实打实的新产品功能，不是 provider refactor 的必要条件。
- **Failure mode**: Builder 会把 v0.2 主线从“解耦 provider”拖成“计费产品化”，T09/T10/T16 成为关键路径；一旦 usage metadata 或 pricing 不稳定，整个 vendor-agnostic ship 被 dashboard 阻塞。
- **Suggested fix**: 要么承认 cost dashboard 是 v0.2 goal 并从 non-goals 删除“任何新功能”绝对句，要么把 AC7 降级为内部 debug table，不允许 pricing override 和三视图进入 ship gate。

### Issue 6

- **Severity**: 中
- **Location**: §6.1 lines 202-206, §4 D4 lines 72-76
- **Issue**: Migration 只告诉用户 `DOUBAO_API_KEY` 不再生效，且明确不自动迁移；这不是 migration，是配置丢弃通知。
- **Failure mode**: 现有 v0.1 用户升级后 Chat/Proactive 全部禁用，必须手动复制 env key；如果用户不知道 env 文件位置，首启体验从“可用 Doubao”退化成“不可用空状态”。
- **Suggested fix**: §6.1 至少要定义一次性检测和复制辅助：检测到 env key 时显示“检测到旧 Doubao 配置，点击导入到 secure storage/localStorage”的显式 opt-in，而不是静默丢弃。

### Issue 7

- **Severity**: 中
- **Location**: §6.3 lines 212-216
- **Issue**: “回 main 分支即可”不是可执行 rollback；它没有处理桌面安装包已发布、settings schema 已升级、IndexedDB 新 store 已创建、用户 key 已迁入 secure storage 的状态回退。
- **Failure mode**: v0.2 Tauri build 或 key storage 出问题时，代码回 main 也无法让已升级用户恢复 v0.1 行为；support 只能叫用户清数据或重装，等于没有 rollback。
- **Suggested fix**: §6.3 必须补 release rollback checklist：保留 v0.1 installer、settings schema versioning、v0.2 数据不阻断 v0.1 启动、桌面发布失败时禁止标记 v0.2 shipped。

### Issue 8

- **Severity**: 中
- **Location**: §7 AC1-AC5 lines 220-224, AC9 lines 228-229
- **Issue**: Acceptance 大量依赖 grep 和手动验证，且 grep pattern 过窄；把 `process.env['DOUBAO_API_KEY']`、`createOpenAI({ baseURL: ...doubao... })`、`豆包` 文案移动到别处都能绕过。
- **Failure mode**: Builder 可以通过 AC1/AC2 但 route 仍然 provider-coupled；AC4/AC5 “手动验证”没有 request inspection 标准，会漏掉 UI 改了但 API 仍用旧 provider 的回归。
- **Suggested fix**: AC 增加机械验证：route 单元/集成测试断言 body provider 决定 adapter；grep 扩展到 `DOUBAO|doubao|豆包|createOpenAI` 并列出 allowed paths。

## Section 2: Task list issues

- **Task ID**: T02
- **Issue**: Acceptance 要求“既有 Doubao 流程在 Settings 配置后端到端可用”，但 T05 Settings UI 还没做；Wave 2 里 T02 与 T03 并行，T02 无法真实端到端验证。
- **Suggested fix**: T02 acceptance 改为 API-level integration test；端到端 Doubao 验证移到 T05 或新增 ship checklist。

- **Task ID**: T04
- **Issue**: Acceptance 写“T13 smoke 对该 provider 通过”，依赖却是 T02/T03，没有依赖 T13；任务表允许 T04 在 smoke script 未完成或未适配新 adapter 时启动。
- **Suggested fix**: T04 依赖改为 T02, T03, T13，并要求 T13 支持 selective provider smoke。

- **Task ID**: T05
- **Issue**: Owner 给 Builder-UI，但 acceptance 包含“切 provider 后 chat 调用对的家”，这需要 request assembly、key storage、route adapter 的跨层判断，不是纯 UI。
- **Suggested fix**: 把 T05 拆成 UI-only 与 integration wiring，后者归 Builder；或把 T05 owner 改为 Builder + Builder-UI pair。

- **Task ID**: T07 / T08
- **Issue**: 标成 S 且要求“UI 列表出现 Kimi/DeepSeek”，但 UI provider list 很可能由 T05 写死或读 registry；T07/T08 与 T05/T11 存在文件/行为冲突。
- **Suggested fix**: 规定 UI 只能从 registry 读 provider catalog，T07/T08 acceptance 改为“registry 出现”，不直接改 UI 文件。

- **Task ID**: T09
- **Issue**: 依赖只写 T02，但它要改 client 写 IndexedDB、pricing、chat/proactive metadata；如果 T05 的 provider request wiring 尚未稳定，T09 会反复改同一批 client 调用代码。
- **Suggested fix**: T09 依赖 T02 + T05，或先做 route metadata contract，client IndexedDB 写入后移。

- **Task ID**: T13
- **Issue**: 工作量 S 低估；它要读取多 provider env keys、遍历 registry、处理国内 provider baseURL/model、超时、退出码、表格输出，还要成为所有 adapter 的验收基础。
- **Suggested fix**: 改为 M，并把 provider-specific env var 命名、skip 规则、CI/本地行为写入 acceptance。

- **Task ID**: T14
- **Issue**: Wave 2 说 T14 spike 与 T03 同步进行，但任务依赖 T03；同时 T14 要改 `key-storage.ts` Tauri 分支，会和 T03 的 Web 实现同文件冲突。
- **Suggested fix**: 先独立做 plugin spike 文档，不碰 `key-storage.ts`；实现阶段等 T03 merge 后再开始。

- **Task ID**: Wave 4
- **Issue**: T06、T07、T08、T09 并行不成立：T09 会改 chat/proactive route 和 types，T07/T08 改 registry/adapters，T06/T11 读 settings/provider name；共享 `types.ts`、`registry.ts`、settings shape 的冲突概率高。
- **Suggested fix**: Wave 4 改成 adapter completion first，registry freeze 后再做 status/message/cost UI。

## Section 3: Risk gaps

- **Risk**: Provider catalog 与用户 model override 不兼容
- **Trigger**: 用户手动输入 registry 未列出的 model，或 provider 改名/下线 default model。
- **Mitigation**: 在 §5.2/§5.4 定义 model validation：允许 custom model 但请求失败要保留原配置并显示 provider-scoped error，不得清空 settings。
- **Severity**: 中

- **Risk**: 错误响应泄露密钥或污染 UI
- **Trigger**: OpenAI-compatible provider 把 request body、Authorization 片段或 upstream debug 信息放进 error message，route 直接 `return Response.json({ error })`。
- **Mitigation**: API route 统一 sanitize error，只返回 code/provider/requestId，不返回 upstream raw error；完整错误只能写不含 key 的本地 debug log。
- **Severity**: 高

- **Risk**: Multiple tabs / windows 造成 cost record 重复或丢失
- **Trigger**: Tauri 或 web 多窗口同时发 chat/proactive，请求完成后各自写 IndexedDB，request_id 不唯一或 retry 后重复。
- **Mitigation**: `requestId` 由 client 生成并作为 idempotency key；IndexedDB 写入以 requestId 去重。
- **Severity**: 中

- **Risk**: “experimental provider”逻辑与 AC3 冲突
- **Trigger**: D2 说 smoke 失败仍可标 experimental 出现在 UI，AC3 又要求 5 个 provider 都通过 smoke。
- **Mitigation**: 二选一：v0.2 ship gate 要么要求 5 家 stable 全通过，要么允许 experimental 但 AC3 改成 stable provider 必过且 experimental 不计入“首发支持”。
- **Severity**: 高

## Section 4: Verdict justification

Verdict 是 `FAIL`，不是 `PASS_WITH_CHANGES`。这份 spec 的核心问题不是措辞缺口，而是 contract 缺失：key 从 secure storage 到 payload 的路径没定义，payload 传 key 的泄露面被 AC9 掩盖，adapter interface 无法承载 5 家 provider 在 streaming、usage、system prompt 和错误格式上的真实差异，cost metadata 协议也没有可实现的统一出口。这 4 个高严重度问题不修，Builder 会在 T02/T03/T05/T09/T14 各自发明局部方案，最后得到一个 grep 过关、UI 能切、但安全性和记账都不可验证的 v0.2。Task list 还把依赖拆错：T02 要依赖尚未存在的 Settings UI 做端到端，T04 要跑未声明依赖的 T13，T14 与 T03 同文件并行冲突。Leader 必须 redraft spec 和 tasklist，先补 contract 与验收标准，再允许 T01 开工。
