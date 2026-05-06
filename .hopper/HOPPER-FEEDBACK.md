# Hopper Feedback Log

Anchor: `.hopper/HOPPER-FEEDBACK.md::root`

dogfood 过程沉淀的洞察，分三类：

- **(A) 已落地的协议改进** — 必须同步到 llm-hopper 主仓库
- **(B) 提案中的改进** — 不一定立即上 main，但记录下来
- **(C) 正面观察** — IP path essay 素材

不同于 `.hopper/DOGFOOD.md`（每次 handoff 的 token / cost / 一句话观察），本文件追踪可"长期上游化"的工程级改进。

## 同步约定

- 每条 (A) 项必须有对应 llm-hopper 主仓库 commit；标 ✓ 已上游 / ⏳ pending
- 每周 review 一次 (B)，看是否升级为 (A)
- (C) 累积到第一篇 essay 发布前，挑 3-5 条最强的写进 narrative

---

## (A) 已落地的协议改进

### F1. PING.md schema v2 — 加 Step 9 atomic commit

- **Date**: 2026-05-06
- **Trigger**: T01 done 后 Builder 没 commit，working tree 堆积；PR 边界与 task 边界不对齐
- **Insight**: 协议 v1 缺 commit step → 必然漏 commit；这不是个人纪律问题，是协议缺陷
- **Patch**: PING.md Step 9 强制 `[<task-id>]` commit；失败 3 次 retry → revert + blocker doc
- **Local commit**: `a097bf1`
- **Upstream status**: ⏳ pending → 这次同步 sweep

### F2. Migration / 跨进程数据交换不能 renderer-side 完成

- **Date**: 2026-05-06
- **Trigger**: Critic v1 Issue 2 — renderer 不能直接读 `process.env`
- **Insight**: spec 写"前端检测旧 env"是常见误解；任何 renderer 内不可达的数据源（fs / env / native API），必须有 server-side bridge（Next API or Tauri command）
- **Patch**: spec D6.1 v2 改写；T18 拆 T18a (Builder bridge) + T18b (Builder-UI dialog)
- **Upstream status**: ⏳ pending → 进 hopper "common pitfalls" 文档（待建）

### F4. PING.md schema v3 — Step 7.5 output artifact + Leader Review Protocol

- **Date**: 2026-05-06
- **Trigger**: dogfood 中发现协议是单向的——Leader → Builder 走 queue + ping 顺；Builder → Leader 反馈靠**人工 copy-paste Builder CLI 输出**。这是结构性 gap
- **Insight**: feedback 通道也必须落盘文件，不能依赖 worker session 的 ephemeral CLI report
- **Patch**: 
  - PING.md v3 加 Step 7.5（Builder 必须写 `.hopper/handoffs/<task-id>-output.md`）+ Leader Review Protocol（`review <task-id>` / `review` / `review --pending`）
  - `templates/builder-output.md` 提供模板
  - 现有 T01 / T03 由 Leader 回溯构造 output.md（标 `> 注：回溯构造`）让 review 流程能立刻试
- **Upstream status**: ⏳ pending → 这次 sync sweep（PING.md + builder-output template 同步到 llm-hopper main）

### F3. AIAdapterCapabilities 必须有可执行 contract，不能只是 flag

- **Date**: 2026-05-06
- **Trigger**: Critic v1 Issue 1 — capability flags 摆设，route 不据它路由
- **Insight**: 静态字段不构成 contract；必须有方法（`prepareMessages`）让 capability 真改路由行为，否则 Builder 实现一个类型正确 adapter 但所有 provider 走同一组 messages
- **Patch**: spec §5.2 v2；AIAdapter 加 `prepareMessages: (system, messages) => AdjustedRequest`
- **Upstream status**: ⏳ pending → 写进 hopper "designing role contracts" 通用 guideline

---

## (B) 提案中（待研究）

### P1. Researcher prompt 应加 "verify imports against package.json"

- **Trigger**: spec 用 `LanguageModelV1`（AI SDK 4.x），实际 SDK 5.x 用 `V2`。Researcher / Critic v0 / Critic v1 三轮 review 都没抓到，Builder 编码时第一件事就修了
- **Insight**: spec review LLM 看 contract 不看 actual deps；加一行约束就能抓
- **Action**: llm-hopper Researcher prompt 模板加约束 "Read package.json + cross-check imports against spec; if any spec reference doesn't exist in current dep version, flag in audit Section 3"
- **Upstream status**: 🤔 待 T03/T04 跑完看是否再次出现，再决定是否上 main

### P2. Critic 第二轮起 prompt 应说 "find DIFFERENT failure modes"

- **Trigger**: Critic v0 issues 主结构性（contract 缺失）；v1 issues 主 contract execution gap。两轮发现的漏洞分布有显著差异——这是好事但很可能被偶然性影响
- **Insight**: 多轮 review 不是冗余，是漏洞分布迁移；但 prompt 没引导就可能让第二轮重复第一轮
- **Action**: llm-hopper Critic prompt 加 conditional 段：如果是非首轮 review，优先找前轮 review 未覆盖的 dimension
- **Upstream status**: 🤔 待提案——单一案例未必是规律

### P3. acceptance 必须明确 scope 范围（whole repo vs only new files）

- **Trigger**: T01 acceptance "tsc --noEmit passes" 模糊；Builder 修了无关文件 `use-workspace.ts`（合理但暴露 ambiguity 成本）
- **Insight**: Leader 写 acceptance 时容易遗漏 scope qualifier；ambiguity 既可能产生有益的 scope creep，也可能产生 scope explosion
- **Action**: llm-hopper Leader prompt 加 reminder "每个 acceptance 必须 scope-qualify：whole repo / new files only / specific paths"
- **Upstream status**: 🤔 待第二次出现再确认是规律

### P5. Test infrastructure 跨 task 边界泄漏

- **Trigger**: T03 acceptance 含 "单测覆盖 simple/advanced 两 mode"，Builder 必须装 vitest 才能写测试。结果 T03 实际触碰了 `vitest.config.ts` + `package.json` + 写了真 test 文件——这本来是 T17 (test scaffolding) 的 scope
- **Insight**: 当 task X 的 acceptance 含"写测试"，但 test infra 是另一个 task，必然出现：(a) X 隐式做 infra；(b) 或 X 做完没测试。前者 scope creep，后者 acceptance 假绿
- **Pattern 假说**：infrastructure tasks（test setup / lint config / build pipeline）必须在依赖它们的 feature task 之前完成；不能让二者并行 ready
- **Action**: llm-hopper Leader prompt 加规则——"如果 task X 的 acceptance 含 unit test，必须依赖某个 test scaffolding task 已 done；不能让二者只共享同一个 prereq"
- **Local fix**: T17 acceptance + 依赖已更新（依赖加 T03，scope 缩到 supertest + integration scaffolding，工作量 M → S）
- **Upstream status**: 🤔 待第二次出现确认是规律；如出现则升 (A) 类同步

### P4. ping `--task=<id>` 任务级 override

- **Trigger**: 当前 ping 按 lex order 选下一个；但 strategic 上 T17（集成测试 scaffolding）比 T03（settings store）更紧迫——T17 通过后能解锁更多并行
- **Insight**: 协议缺 task-id 级 override；用户被迫手动改 queue.md 顺序
- **Action**: PING.md schema v3 加 `ping --task=<id>`；同时考虑 race-safe locking（v0 标记 not-race-safe，但 task-id override 让多 session 协作变得现实）
- **Upstream status**: 🤔 待 T03 跑完观察是否真需要

---

## (C) 正面观察（essay 素材）

### O1. ping 协议在非 Claude CLI 实跑成功

- Critic v1 通过 Codex CLI（GPT-5.5）一次 ping 完整跑完：lock → review → write → log → done → report，**0 人工干预**
- 证据点：PING 协议设计真的 CLI-portable，不是 Claude-Code-specific
- essay 角度：这是 vendor-agnostic thesis 在 protocol 层的活体验证——thesis 不止讲，能跑

### O2. 多 LLM 协作的"层次发现"是真效应，不是叙事

- Researcher (Gemini 1M ctx) 抓 couplings；Critic v0 (GPT-5.5) 抓结构性洞；Critic v1 (GPT-5.5 fresh session) 抓 contract execution gap；Builder (GPT-5.5 Codex) 抓 actual import 版本错误
- 同一家 LLM 在不同 session / 不同角色下找到不同类问题——单 LLM 不可能同时覆盖这 4 个层次
- essay 角度：4 round review 不是冗余，是 cumulative bug discovery

### O3. dogfood 期间 spec 工程密度增长曲线

- v0: ~280 行，12 issues 后 FAIL
- v1: ~400 行，11 issues 后 PASS_WITH_CHANGES
- v2: ~430 行，可上 Builder
- 每轮约增 100 行，但 issue 严重度递降；这表明 spec 收敛，不是发散
- essay 角度：multi-LLM review 让单人 spec 在不增加 wallclock 太多的前提下达到团队 review 才能达到的工程密度

### O4. Builder 自主修 spec 错误（V1→V2）的"层级反馈"

- Spec 写 LanguageModelV1（错），Builder 编码时改成 V2（对），还在 commit message 里说明 "spec said V1 incorrectly, builder corrected"
- 没有人指挥 Builder 这么做——它自己决定的
- essay 角度：当协议设置好（roles, handoffs, acceptance）后，下游角色对上游错误有自纠能力。这是协议设计的成功而非偶然

---

## 同步执行清单

| ID | 描述 | 上游目标位置 | Status |
|----|------|------------|--------|
| F1 | PING.md schema v2 | `llm-hopper/.hopper/PING.md` | ✓ 已同步（commit 8d99899）|
| F1 | queue.md template | `llm-hopper/.hopper/templates/queue.md` | ✓ 已同步 |
| F1 | bootstrap files template | `llm-hopper/.hopper/templates/bootstrap/*` | ✓ 已同步 |
| F1 | README mention | `llm-hopper/README.md` 项目结构段 + TODO | ✓ 已同步 |
| F1 | CHANGELOG | `llm-hopper/CHANGELOG.md` v0.3 unreleased entry | ✓ 已同步 |
| F4 | PING.md schema v3 | `llm-hopper/.hopper/PING.md` | 本次同步 |
| F4 | builder-output template | `llm-hopper/.hopper/templates/builder-output.md` | 本次同步 |
| F4 | CHANGELOG | `llm-hopper/CHANGELOG.md` v0.3 entry 追加 v3 schema | 本次同步 |
| F2/F3 | "common pitfalls" 通用文档 | `llm-hopper/docs/common-pitfalls.md`（未来）| ⏳ 累积 5 条以上再建 |
| P1-P4 | prompt 模板改进 | `llm-hopper/.hopper/prompts/*` | ⏳ 不同步，待提案确认 |
