# myWriteAssistant × llm-hopper Dogfood

Anchor: `.hopper/DOGFOOD.md::root`

本目录是 [llm-hopper](https://github.com/surebeli/llm-hopper) 在 myWriteAssistant 项目里的活体使用记录，不是 myWriteAssistant 自身的产品组件。

---

## 1. 目标

在 3 周内，用 hopper 协调多个 LLM（Gemini / Claude / GPT / Kimi / DeepSeek）完成 myWriteAssistant 的一次主要重构：

> **将 AI provider 从 Doubao 锁死，重构为厂商无关的 pluggable provider 抽象，并在产品里暴露多 LLM 选择 + 跨厂商 cost 视图。**

这同时是：

- myWriteAssistant 自己的 v0.2 产品里程碑（让产品本身也成为 vendor-agnostic 的活样本）
- llm-hopper 的第一次正式 dogfood，验证多 LLM 协作 discipline 在真实工程任务里的工作效果
- IP path 的素材源：dogfood 过程的观察、各 LLM 的差异、cost 真实数据将沉淀为后续 HN essay 的内容

---

## 2. 范围（3 周硬约束）

### Week 1 — 调研 + 抽象

- [ ] Day 1：Researcher (Gemini 3.1 Pro Preview) 输出 audit 报告
- [ ] Day 2-3：Leader (Claude Opus 4.7) 基于 audit 写 v0.2 重构 spec → `myWriteAssistant/docs/plans/2026-05-XX-v0.2-vendor-agnostic-refactor.md`
- [ ] Day 4-7：Builder (GPT-5.5) 落地 `AIProvider` interface + Doubao adapter 重构 + 第 2 个 provider（Claude 或 OpenAI）跑通 chat route

### Week 2 — Provider 扩展 + Settings UI

- [ ] DeepSeek、Kimi adapter 落地
- [ ] Settings 面板加 "AI Provider" 配置（Builder-UI = Gemini 3.1 Pro Preview）
- [ ] Per-scenario provider 配置（chat / proactive / summary 各自可选）

### Week 3 — Cost dashboard + 收尾 + ship

- [ ] 跨 provider 的 token / cost 聚合到 IndexedDB
- [ ] 产品内 cost 视图（Builder-UI）
- [ ] Tauri build 跑通
- [ ] Ship myWriteAssistant v0.2（web + desktop）
- [ ] 整理 dogfood 观察日志，沉淀为 essay 素材

### 不在本 scope 内（明确不做）

- ❌ Phase 5 Proactive 的 polish
- ❌ Phase 6 Tauri 的功能扩展（只确保能 build）
- ❌ 自定义图标 / 性能优化
- ❌ 新功能（任何与"vendor-agnostic 重构"无关的新需求）

---

## 3. 成功条件（dogfood 视角）

不是 myWriteAssistant 完美，而是 hopper 流程跑得通：

1. ✅ 至少完成 1 个 **non-Claude leader** 任务（Day 1 Gemini Researcher 满足）
2. ✅ 至少完成 1 个完整 Researcher → Leader → Builder → Critic 闭环
3. ✅ COST-LOG 里有跨 ≥3 个 LLM 的真实 token / 成本数据
4. ✅ 至少 3 条**可写进 essay 的观察**（比如某个 LLM 在某类任务上的特殊表现）
5. ✅ Hopper 的 prompt / handoff / phase cursor 没有出现破坏性的协议漂移

myWriteAssistant 自身的 v0.2 ship 是**期望**，但 ship 失败不等于 dogfood 失败——dogfood 测的是流程，不是产出。

---

## 4. 当前 cursor

参见 `.hopper/MANIFEST.md`。

---

## 5. 观察日志

> 每个 handoff 完成后追加一条。包含：日期 / 角色 / LLM / 任务 / 耗时 / 成本（如有）/ 一句话观察。

| 日期 | 角色 | LLM | 任务 | 耗时 | 成本 | 观察 |
|------|------|-----|------|------|------|------|
| 2026-05-06 | Researcher | gemini-3.1-pro-preview | 读 21 个文件 + 写 audit | ? | ~25k in / ~2k out（Gemini 自报）| Audit 整体可用 ~70%。命中：耦合点全找到、interface 草案合理、plan↔code 偏差表实用。漏：cost observability 没提（Leader 补上 D6）、Tauri secure storage 没提（Leader 补上 D7）。瑕疵：markdown 输出有反引号转义 glitch（` typescript` → `	ypescript`），下次 Researcher 模板里要加"不要用 4-space indent 起 code fence"约束 |
| 2026-05-06 | Leader | claude-opus-4-7 | 基于 audit 写 v0.2 spec + 16-task list + 更新 cursor/log | ? | ? | Spec 落 ~280 行；7 项 Leader 决策（D1-D7）覆盖 Researcher 3 个开放问题 + 4 个新增点；task list 16 条带依赖图与 5 个 wave；Critic gate 强制独立 session，写进 task 表的"约定"段 |
| 2026-05-06 | Critic | gpt-5.5 | 审查 spec v0 + tasklist v0 + audit | ? | ? | Verdict **FAIL**，12 处 issue。命中力强：4 个高严重度的 contract 缺失（key flow / transport leak / adapter capability / cost protocol）都是真问题，不是吹毛求疵；task 依赖图被指出真实并行冲突（Wave 4）。观察：GPT-5.5 在 plan-review 上的"找漏洞"能力比预期更尖锐；这给 Builder 阶段的 PR critic 立了高 bar |
| 2026-05-06 | Leader (retry) | claude-opus-4-7 | 基于 Critic v0 重写 spec v1 + tasklist v1 | ? | ? | Spec 扩到 ~400 行；新增 §5.3.1 request assembly contract + 扩 §5.2 capability/usage/error contract；D6/D7 钉协议；§7 AC 从 12 条扩到 15 条机械可验证；task 加 T17（route 集成测试）+ T18（migration dialog）；Wave 重排消除文件冲突。关键观察：**Critic FAIL 把 spec 工程质量提升了一档——这就是多 LLM 协作的真实价值，单一 Claude 写完直接进 Builder 会带 12 个 latent bug 进去** |
| 2026-05-06 | Critic v1 (via ping protocol!) | gpt-5.5 codex | 审查 spec v1 + tasklist v1 + audit；通过 ping 协议在 Codex CLI 自动 pop / lock / write / log / report | ~5 min | ~30k/4.5k ~$0.25 | Verdict **PASS_WITH_CHANGES**（11 issues：3 高 + 3 中 spec / 5 task / 3 risk gap）。**关键里程碑**：ping 协议在非 Claude CLI **首次实跑成功**——从 pop 到 mark done 全程零人工干预，COST-LOG 自动落库。这是 hopper v0.3 路径的硬验证。Critic 命中：capabilities 是摆设没执行 contract / migration 在 renderer 不可达 / summary scenario 是死配置 / cancellation 不能依赖 finish event / experimental gate 自相矛盾——全是真问题 |
| 2026-05-06 | Leader v2 | claude-opus-4-7 | 应用 Critic v1 surgical fixes → spec v2 + tasklist v2 | ? | ? | spec 加 prepareMessages 让 capabilities 真可执行；migration bridge server-side（T18 拆 T18a/T18b）；删 summary scenario 推 v0.3；cancellation 由 client abort 写；experimental ship gate 砍掉（5 stable smoke 必 pass）；rollback 降级为手动；加 R12-R14（renderer memory / dependency drift / pricing staleness）。spec 从 ~400 → ~430 行；3 轮 review 后 spec 工程密度显著提升。**第二个关键观察**：Critic v0 与 v1 的尖锐度有显著差异（v0 12 issues 主结构性问题；v1 11 issues 多是 contract 落地的细节 gap）——这说明 spec 在每轮迭代后的"剩余漏洞分布"会变化，第二个 critic 不是"重新审"而是"在新基线上找新漏洞"——这是 essay 素材点 |
| 2026-05-06 | Builder T01 | gpt-5.5 codex | 创建 src/lib/ai/ 抽象层骨架（types/registry/prompts/pricing/key-storage/request-assembly/route-helpers + adapters/index.ts） | ~6 min | (待 cost log 自报) | T01 done via ping。**第三个关键观察**：Builder 在编码时**修了 spec 没注意到的 SDK 版本问题**——我 spec 用 `LanguageModelV1` 来自 `@ai-sdk/provider`（AI SDK 4.x），实际 SDK 5.x 用 `V2`。Researcher / Critic v0 / Critic v1 三轮 review 都没抓到这个 import 错误，因为大家都在审 surface contract，没人去 grep 实际的 npm 依赖版本。Builder 第一件事就是 fix。**结论**：spec review 阶段 LLM 看 contracts，coding 阶段 LLM 看 actual imports——这是 multi-LLM "层次发现"的真效应，不是叙事。**第四个观察**：sanitizer Builder 没按 spec 写 stub，直接给了工作版 regex（覆盖 Bearer / api_key / authorization）；这是好方向上的 scope expansion——但需要 T02 / Critic 验证覆盖度足够，避免"看起来工作但漏 case"。**第五个观察**：Builder 顺手修了 use-workspace.ts 的 TS narrowing 问题以让 tsc 通过——这是 spec 措辞模糊（"tsc passes" 没限定范围）导致的合理 scope creep，不算违规但应记录为"acceptance 写法的失误成本" |

---

## 6. 关联

- llm-hopper 主仓库：https://github.com/surebeli/llm-hopper
- myWriteAssistant 主仓库：https://github.com/surebeli/myWriteAssistant
- 角色绑定：`.hopper/AGENTS.md`
- Day 1 Researcher prompt：`.hopper/prompts/day1-researcher.md`
- 历次 handoff 输出归档：`.hopper/handoffs/`
