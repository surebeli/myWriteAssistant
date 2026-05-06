---
critic: gpt-5.5
generated: 2026-05-06T12:41:35.7738339+08:00
verdict: PASS_WITH_CHANGES
revisions_required_count: 11
---

## Section 1: Spec issues

### Issue 1

- **Severity**: 高
- **Location**: spec §5.2 lines 174-207; §5.3 lines 228-236; D2 line 70
- **Issue**: `AIAdapterCapabilities` 只是摆设，spec 没有定义 route 如何根据 `supportsSystem` / streaming 差异实际组装请求。
- **Failure mode**: Builder 可以实现一个类型正确的 adapter，然后 route 继续把同一组 `{ role: "system" }` messages 塞给所有模型。Claude、OpenAI-compatible 国内模型、未来不支持 system role 的 provider 会在真实 prompt 下表现不一致，而 AC2/T13 的 "ping" smoke 很可能仍然通过。这样 provider abstraction 看起来完成，实际只是把 Doubao 的调用形状换了个目录。
- **Suggested fix**: 在 §5.2 给 adapter 增加 `prepareMessages` 或 `buildTextRequest` contract，或在 `route-helpers.ts` 明确根据 capabilities 做 system prompt fallback；T01/T02/T04 acceptance 必须验证 Claude 与 OpenAI-compatible 的 system prompt 处理路径不同且被调用。

### Issue 2

- **Severity**: 高
- **Location**: spec §6.1 lines 347-354; tasklist T18 line 42
- **Issue**: 迁移方案假设首次启动 UI 能检测并导入 `DOUBAO_API_KEY`，但 React/Tauri renderer 不能直接读取运行时进程环境里的 secret。
- **Failure mode**: T18 只做 dialog/hook 会写出一个永远检测不到旧 key 的迁移 UI。现有 v0.1 用户升级后看到空状态，旧环境变量仍在但无法导入，Leader 以为 migration 已解决，实际用户第一步就丢配置。
- **Suggested fix**: §6.1 必须指定数据通道：Next API migration endpoint 或 Tauri command 负责读取 env 并只在用户确认时写入 `keyStorage`；T18 依赖应加 Builder-owned bridge，不能只交给 Builder-UI。

### Issue 3

- **Severity**: 高
- **Location**: spec §2 line 23; §5.2 lines 164-165; §7 lines 377-380
- **Issue**: `summary` 被列为 v0.2 scenario，但当前 repo 只有 `/api/chat` 和 `/api/proactive`，tasklist没有任何 summary route 或调用点迁移。
- **Failure mode**: Settings 可以出现 "Summary 用 C" 的配置，但没有任何请求会消费它。AC5 只测 chat/proactive，两路都绿也不能证明 per-scenario routing 完成。这个是典型死配置，后续 cost dashboard 还会出现永远为 0 的 summary 维度，污染产品语义。
- **Suggested fix**: 二选一：v0.2 删除 `summary` from `AIScenario` 和 UI；或新增 summary route/call-site task，并把 AC5/AC6 覆盖到 summary。

### Issue 4

- **Severity**: 中
- **Location**: spec D6 lines 99-114; §7 AC6 line 381; tasklist T09 line 33
- **Issue**: cancelled cost record 依赖 route finish event，但用户 abort streaming fetch 时 finish event 通常不会到达 client。
- **Failure mode**: 成功和 failure 都能记账，cancelled 路径在真实 UI 中漏记；AC6 如果只 mock 一个 "cancelled finish event" 就会假通过。dashboard 会低估用户实际取消的调用次数和 latency，idempotency 也没有机会工作。
- **Suggested fix**: D6 明确 cancellation 由 client abort handler 写 `AICallRecord(status="cancelled", tokensUnknown=true)`；route 只能尽力记录 server-side abort，不作为 client cost record 的唯一来源。

### Issue 5

- **Severity**: 中
- **Location**: spec D2 lines 71-73; §7 AC3 line 378; tasklist T13 line 37
- **Issue**: provider ship gate 仍然自相矛盾：D2 说 smoke 未通过不暴露，下一行又说 experimental 仍出现在 UI；AC3 又把五家都叫 stable，但 T13 缺 key 时 skip 而不是 fail。
- **Failure mode**: 团队可以在没有 Kimi/DeepSeek secret 的情况下把 smoke 全部 "skip" 成绿色，又可以把失败 provider 标 experimental 后照常 ship。最后 v0.2 宣称五家首发，实际只验证了两家。
- **Suggested fix**: 选一个硬规则：要么 v0.2 gate 要求五家 secrets 全备且 smoke 全 pass；要么把首发承诺改成 "verified providers only"，UI 只展示 smoke-pass provider，experimental 不计入首发文案。

### Issue 6

- **Severity**: 中
- **Location**: spec §6.3 lines 365-370; tasklist T03 line 27
- **Issue**: rollback 依赖 "v0.1 forward-compat"，但这是对已发布版本的要求，不是 v0.2 分支里写个 `schemaVersion` 就能保证。
- **Failure mode**: 如果 v0.1 已经不能容忍 schemaVersion=2，v0.2 发布后再发现 rollback 失败就来不及了。T03 里的 "如不容忍则改 v0.1 或开 patch" 没有 release gate，也没有单独任务，容易被当成实现细节吞掉。
- **Suggested fix**: 在 tasklist 增加显式 `v0.1.x forward-compat patch` gate，或把 rollback 声明降级为 "用户可手动导出 key 后重装 v0.1"，不要假装自动可回滚。

## Section 2: Task list issues

### Task issue 1

- **Task ID**: T14-spike / T14-impl
- **Issue**: queue 已拆成 `T14-spike` 和 `T14-impl`，但 tasklist 仍是单个 T14；queue 里 `T14-impl` 只依赖 T03，不依赖 `T14-spike`。T03 一 done，implementation 就可能被 ping 弹出，绕过 spike 决策。
- **Suggested fix**: tasklist 和 queue 对齐为两个 ID，并把 `T14-impl` Depends 改成 `T03, T14-spike`。

### Task issue 2

- **Task ID**: T04
- **Issue**: Claude adapter 必然需要 `@ai-sdk/anthropic`，但 T04 触碰文件没有 `package.json` / lockfile，acceptance 也没有 "依赖已安装且 build 通过"。
- **Suggested fix**: T04 touch files 加 `package.json` 与 lockfile，acceptance 加 `npm install` 后 `npm run build` 或 `tsc --noEmit`。

### Task issue 3

- **Task ID**: T13
- **Issue**: acceptance 规定缺 key 的 provider skip，而 spec AC3 又要求五家 stable provider smoke 通过。这个 acceptance 会制造假绿。
- **Suggested fix**: 本地允许 skip，但 ship gate 必须有 `--require-all-stable` 或 CI secret 检查；缺任一 stable key 时 v0.2 release 失败。

### Task issue 4

- **Task ID**: T12
- **Issue**: T12 只说改 bubble 和 message type，acceptance 只验证旧消息不崩，没有要求 chat/proactive 新消息实际写入 `producedBy`。
- **Suggested fix**: T12 touch files 加 chat/proactive response handling，acceptance 加 "新生成消息含 provider/model metadata" 的单测或 E2E。

### Task issue 5

- **Task ID**: T18
- **Issue**: 首启 migration dialog 被派给 Builder-UI，但核心是读取旧 env key 并写 secure storage，这是跨 Next/Tauri/secret handling 的 wiring，不是纯 UI。
- **Suggested fix**: T18 改为 Builder-UI + Builder pair，或拆 `T18a migration bridge` 和 `T18b dialog UI`。

## Section 3: Risk gaps

### Risk gap 1

- **Risk**: Renderer XSS / supply-chain dependency 读取内存中的 `providerConfig.apiKey`
- **Trigger**: D1 把 apiKey 放入 React renderer 内存和 fetch body；任何 XSS、恶意 dependency、调试扩展都能在请求前读到 key。
- **Mitigation**: 明确 security claim 只覆盖 at-rest storage，不声称 renderer 内存安全；加 CSP/no remote script gate，route payload 不进任何 analytics，并把长期方案放到 Tauri command/Rust sidecar。
- **Severity**: 高

### Risk gap 2

- **Risk**: Provider dependency/package drift 导致 adapter 编译期或运行时失败
- **Trigger**: Claude/Kimi/DeepSeek adapter 需要新增或复用 AI SDK provider packages，但 tasklist 没有统一 dependency ownership，lockfile 可能由任意 PR 顺手改。
- **Mitigation**: 每个 adapter task 明确 package ownership；T13 smoke 前跑 build/typecheck；PR review 禁止未解释的 AI SDK version bump。
- **Severity**: 中

### Risk gap 3

- **Risk**: Cost pricing table 过期导致 "省钱"卖点误导
- **Trigger**: `pricing.ts` 是硬编码只读表，provider 改价或 model override 指向未列价格时继续显示估算 `$`。
- **Mitigation**: unknown model 必须显示 `estimatedUsd: undefined` 和 "price unknown"，不要套 default price；README 标明价格表日期。
- **Severity**: 中

## Section 4: Verdict justification

verdict 给 `PASS_WITH_CHANGES`，不是 `PASS`。v1 spec 已经把 v0 的大洞补上了：provider config 有单入口、usage/error contract 有形状、security/rollback/AC 都比初稿更机械。但它仍有 3 个会直接影响 T01/T03/T18 的结构性漏洞：adapter capabilities 没有执行 contract，`summary` scenario 没有任何实现路径，旧 Doubao env migration 在 renderer 侧不可达。这些不修就开 T01，Builder 会把错误 interface 写进地基；不修就开 T18，migration 会变成一张漂亮但无效的 dialog。其余问题主要是 gate 语义和 task dependency 对齐，Leader 可以在 30 分钟内改 spec/tasklist，不需要整体 redraft。条件是这些修订必须先落盘，再让 Builder 开 Wave 1；否则 v0.2 会在 "五家首发"、"可回滚"、"成本记录完整" 三个对用户可见的承诺上交付缩水。
