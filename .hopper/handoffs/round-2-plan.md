# Round 2 Plan B — Leader 自驱执行手册

Anchor: `.hopper/handoffs/round-2-plan.md::root`

- **Issued**: 2026-05-07
- **Audience**: leader-primary (GPT-5.5 xhigh)
- **Status**: T07 + T08 done；剩余 4 task 由 Leader 推进
- **Strategy Advisor mode**: 观察 + on-demand（不再 hands-on dispatch）

---

## Plan B 起因

T07 (gpt-5.5-high control, $0.32 token-est) 和 T08 (Kimi-thinking 单跑, $0.06 token-est, 5.3x 节省) 已 done。pair-A 原计划在 T08 上做"Kimi 主体 + DeepSeek-flash sidecar"，但 T08 实际只跑了 Kimi 主体——sidecar polish 没跑。

Plan B 决策：**接受 T08 = Kimi-thinking 单跑数据点**，把 pair 配置重新分配到 M/L task（polish 价值更大）。

## 任务分配（剩余 4 个）

| Task | Effort | Owner | 期望 cost (token-est) | 真实 $ 边际 |
|------|--------|-------|---------------------|-----------|
| T09 (Cost recording) | M | **pair-A: Kimi-thinking (sub) + DeepSeek-flash (API)** | $0.05-0.10 | sub-quota + ~$0.002 API |
| T18a (Migration bridge) | M | **pair-B: Mimo-pro (API) + DeepSeek-flash (API)** | $0.06-0.12 | 全 API ~$0.005-0.015 |
| T14-spike (Tauri 调研) | S | **pair-C: DeepSeek-pro (API) + Gemini-flash (sub)** | $0.03-0.08 | DeepSeek-pro API ~$0.003 + sub-quota |
| T05 (Settings UI) | L | **builder-ui (Gemini)** | $0.20-0.50 | sub-quota |
| ~~pair-D 暂搁置~~ | — | （无合适 task；如 T09 done 后想加跑同任务对照可考虑）| — | — |

## Leader 操作循环（每 task 一轮）

对每个剩余 task：

1. **Pre-dispatch verify**：read `.hopper/queue.md` 确认 task pending + deps satisfied + AGENTS.md 配置正确
2. **Dispatch instruction to user**：告诉用户该开哪个 LLM session、怎么 bootstrap、ping 哪个 task
   - 对 pair task：先 dispatch substantive session，等其 done 后再 dispatch sidecar polish session
   - **不要直接 ping**——用户来开 session 并粘贴 prompt
3. **等 Builder/pair done 信号**（substantive commit + sidecar commit 都到位）
4. **Light review**（per leader-round2-bootstrap.md "Light review of Builder output" 段落）：
   - 读 output.md + git show + 跑 fresh verification（tests/tsc/lint/smoke 按 task 类型）
   - cost audit：对比 token-est $ vs 期望表 + 记录真实 $ 边际
   - 出 verdict：**pass-trivial** / **escalate-critic** / **block-rework**
5. **Verdict 落盘**：append "## Leader review (light)" 到 `<task-id>-output.md` 末尾，commit `[review:<task-id>] light: <verdict>`
6. **进下一 task**

## Escalation triggers — 何时拉 Strategy Advisor 进来

**不要**为以下日常事项打扰：
- 普通 pass-trivial 决定
- 单 task review 的小 deviation
- Cost 在期望区间内的波动
- 单个 task 有 manual verify 需求（你按 PING v5 Step 6 处理 + leader-feedback file 即可）

**必须**升级 Strategy Advisor（在本 chat 里 user 转告我）的 5 类情况：

1. **同一 task 连续 manual verify 失败 ≥ 2 次** — 暴露协议或 spec 漏洞，需 Strategy 决策
2. **某 pair 配置（如 mimo-pro）在 task done 时质量明显低于其他 pair** — 影响 essay narrative，需重新评估
3. **Cost 超期望区间 100% 以上**（如期望 $0.05 实际 $0.20）— 假设可能错，需重 calibrate
4. **发现新协议 gap 或可写进 HOPPER-FEEDBACK 的 essay-quality 观察** — Strategy 决定是否升 v6 patch
5. **完成所有 4 task 后** — Strategy 接手做 v3 essay 起草（带 Round 2 数据）

## Critic 升级

当 Leader 给 `escalate-critic` verdict 时：
- 写 `.hopper/handoffs/<task-id>-leader-feedback.md` 描述疑问
- 告诉 user "请开 fresh Claude Opus xhigh Critic session"
- Critic 输出 review 文档后，Leader 读 + 决定是否进 rework / accept

Critic 是 Strategy Advisor 同 model 但 fresh session；不算 Strategy Advisor 介入（fresh context 是 Critic 价值核心）。

## Strategy Advisor 的观察职责

我（Claude Opus 在 advisor chat）会：
- 关注 HOPPER-FEEDBACK 增量（每次 push 后扫一眼）
- 注意 Round 2 cost 数据流
- 在 5 类升级情况发生时介入
- Round 2 全完时接手 essay v3 起草

我**不会**：
- 主动 dispatch 任何 task
- 写 Leader light review verdicts
- 编辑 queue.md / AGENTS.md（除非升级触发）

## 起步动作

读完本文件后回复："Round 2 Plan B understood, starting with T09 dispatch instruction"——然后给用户具体的 T09 dispatch prompt（Kimi-thinking session 怎么开 + ping T09）。

完成 4 task 后回报 "Round 2 done, all 4 tasks reviewed, awaiting Strategy Advisor for essay v3"。
