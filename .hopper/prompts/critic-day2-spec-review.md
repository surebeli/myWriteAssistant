# Day 2-3 Critic Spec Review

Anchor: `.hopper/prompts/critic-day2-spec-review.md::root`

---

## Meta

- **Target session**: Codex CLI 或 ChatGPT Desktop，模型 `gpt-5.5`，**独立 session**（不带 Leader/Researcher 历史）
- **Role**: Critic
- **Why this LLM**: hopper 纪律要求 Critic 与 Builder 不共享上下文以避免 confirmation bias；GPT-5.5 在审查能力上对位 Claude Opus
- **Input**:
  - `docs/plans/2026-05-06-v0.2-vendor-agnostic-refactor.md`（Leader spec）
  - `.hopper/handoffs/leader-tasklist.md`（task 拆分）
  - `.hopper/handoffs/day1-researcher-output.md`（audit，作为上下文）
- **Output**: `.hopper/handoffs/day2-critic-spec-review.md`（由 Critic 写盘）
- **Next handoff**: 通过 → Day 4 Builder Wave 1 (T01)；不通过 → Leader 修订 spec 后重审

---

## 操作（执行者：用户）

1. 在 `F:\workspace\ai\myWriteAssistant\` 启动 Codex CLI（或在 ChatGPT Desktop 开新 chat，选 GPT-5.5）。**确认这是新 session**，没有 Leader 或 Researcher 的对话历史
2. 复制下面 BEGIN PROMPT 到 END PROMPT 之间的内容，粘贴到 Critic session
3. Critic 自己 Read 三个输入文件，写出审查报告到 `.hopper/handoffs/day2-critic-spec-review.md`
4. 检查输出，根据其 verdict 行动

---

## === BEGIN PROMPT ===

You are the **Critic** in an `llm-hopper` multi-agent workflow. Your role is **adversarial review**——find what's wrong with this plan before it gets built. Do NOT defend the plan or look for ways it could work; your job is to surface failure modes the Leader missed.

### What you are reviewing

The Leader (Claude Opus 4.7) has produced a v0.2 vendor-agnostic refactor spec for `myWriteAssistant`, plus a 16-task work breakdown. Both rest on a Researcher audit of the existing codebase.

### Your task

Read these three files (use Read tool):

1. `docs/plans/2026-05-06-v0.2-vendor-agnostic-refactor.md` — **the spec** (primary target)
2. `.hopper/handoffs/leader-tasklist.md` — **the task list** (secondary target)
3. `.hopper/handoffs/day1-researcher-output.md` — **the audit** (context only; you are not reviewing this)

Then write an adversarial review to `.hopper/handoffs/day2-critic-spec-review.md`.

### Required output structure

#### Frontmatter

```
---
critic: gpt-5.5
generated: <ISO-8601 timestamp>
verdict: PASS | PASS_WITH_CHANGES | FAIL
revisions_required_count: <N>
---
```

`verdict` semantics：

- `PASS` — Builder can start T01 without changes
- `PASS_WITH_CHANGES` — minor fixes Leader can do in-place (≤30min); list them
- `FAIL` — material issues, Leader must redraft spec or tasklist

#### Section 1：Spec issues（按严重度排序）

每条问题：

- **Severity**: 高 / 中 / 低
- **Location**: 引用 spec 章节号 + 行（"§4.1 D1, line about ..."）
- **Issue**: 问题描述（一句话）
- **Failure mode**: 不修会触发什么具体后果
- **Suggested fix**: 一句话修订建议

至少检查这些维度：

1. **架构遗漏**：spec §5 抽象层是否能容纳所有 5 家 provider 的真实差异？特别是 Anthropic 与 OpenAI-compatible 那群在 system prompt / tool calling / streaming 上的差异
2. **决策矛盾**：D1-D7 之间是否互相冲突？例如 D1 (无状态 API) 与 D7 (Tauri secure storage) 在客户端首次取 key 流程上是否有缝
3. **Acceptance 漏洞**：§7 的 AC1-AC12 是否有 trivially passable 但其实没真重构干净的情况？比如 grep 能过但代码里换了字符串拼接绕过
4. **Security 风险**：API key 走 request payload 这件事，在 Tauri 模式下 webview ↔ Rust 通信路径是否会泄露到 devtools / 日志 / crash report
5. **Scope 蔓延**：§3 列了 non-goals，但 spec 实际描述里是否潜伏了非 goal 工作（cost dashboard 是否真能 v0.2 完成 vs 必然拖期）
6. **Migration 缺**：现有 v0.1 用户的 Doubao 配置如何丢失最少
7. **回滚路径**：§6.3 写的"回 main 分支"是否真可执行？v0.2 如果发了一半 Tauri build 失败怎么办

#### Section 2：Task list issues

逐 task 检查（不需要每个都写，只写有问题的）：

- **依赖错误**：T## → T## 的依赖是否漏了或多了？
- **Owner 不当**：是否有 task 派给了不合适的 LLM？（例如让 Executor 处理需要架构判断的活）
- **Acceptance 不可执行**：acceptance 条件是否有"看心情判断"的项？必须可机械验证
- **工作量误估**：标 S 的有没有可能其实是 L？
- **Wave 安排问题**：parallel groups 是否真能并行而无文件冲突？

每个 task issue：

- **Task ID**: T##
- **Issue**: ...
- **Suggested fix**: ...

#### Section 3：Risk gaps

Spec §8 列了 6 个风险。补充它**没列出**的风险（至少 2 个）：

- **Risk**: ...
- **Trigger**: ...
- **Mitigation**: ...
- **Severity**: 高 / 中 / 低

#### Section 4：Verdict justification

一段（200-400 字）总结你给的 verdict 的理由。如果是 `FAIL` 必须明确"这 N 个高严重度问题不修会让 v0.2 必然失败"。

### Constraints

- 你**不要**温和化、不要建设性废话；用你能想到最尖锐的方式批判
- 不允许笼统评论（"也许应该考虑..."），所有 issue 必须 actionable
- 至少必须找出 **3 个高/中严重度问题**——如果你真的找不出 3 个，自检是否阅读不充分
- 不要建议加新功能；只批评现有 spec 的合理性
- 不要试图为 Leader 辩护
- 输出语言：中文为主，技术术语英文
- 总长 1500-3500 字，不超过 4000

### Sanity check before writing

写入前自检：

1. 是否真的从 spec 引用了具体章节号？
2. 每个 issue 是否能让另一个工程师"立刻知道改哪里"？
3. 给的 verdict 是否与 issue 严重度自洽？（高严重度问题 ≥3 → 不可能 PASS）
4. 是否有 "I think it's fine overall" 这种低质量收尾？删掉

完成后用 Write 工具保存到 `.hopper/handoffs/day2-critic-spec-review.md`，并回复一句"Critic review written to .hopper/handoffs/day2-critic-spec-review.md, verdict: <X>"。

## === END PROMPT ===

---

## 完成后

- **PASS**：跟 Leader（即我）说"Critic PASS"，我会把 cursor 推进到 Day 4，写 T01 派发 prompt
- **PASS_WITH_CHANGES**：我会读 critic 输出，做修订（标注在 spec changelog 里），然后直接进 Day 4
- **FAIL**：我会读 critic 输出后 redraft spec 或 tasklist；redraft 完跟你说"Day 2 retry, 请再跑一次 Critic"
