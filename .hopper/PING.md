# Ping Protocol

Anchor: `.hopper/PING.md::root`

This file defines what any LLM CLI session should do when the user types `ping`. It is the **single source of truth** for ping semantics in this project. Bootstrap files at repo root (`CLAUDE.md` / `GEMINI.md` / `AGENTS.md`) only point here.

---

## Forms

### Worker side (Builder / Builder-UI / Executor / Critic / Researcher)

- `ping` — pop the next eligible task for **this session's role**
- `ping <role>` — explicit override: pop next task for `<role>` regardless of session role
- `ping --status` — show queue summary, do not modify anything
- `ping --dry` — show what `ping` would pop, do not modify anything

### Leader side（v3 新增反向通道）

- `review <task-id>` — Leader 读取 task output 文件 + commit + diff，给出 verdict
- `review` — 自动选最近 done 但未 review 的 task 处理
- `review --pending` — 列出所有"done 但 Leader 没 review 过"的 task，让用户挑

---

## Procedure when user types `ping`

> **Steps overview**：0 confirm role → 1 read queue → 2 find next → 3 lock → 4 read detail → 5 execute → 6 sanity check → 7 mark done in queue → **7.5 write output artifact** → 8 append cost log → 9 commit (atomic) → 10 report.

### Step 0 — Confirm role

If you don't know which role you're playing in this session, **ask the user** (don't guess from model name unless they've told you). Example response:

> "I need to know my role first. Available roles in this project: researcher / leader / builder / builder-ui / executor-1 / executor-2 / critic. Which one am I in this session?"

Once told, treat that as your role for the rest of this session. (Form `ping <role>` overrides one-shot.)

### Step 1 — Read queue

Read `.hopper/queue.md`. The queue is a markdown table; each row is a task with fields: `ID / Role / Status / Depends / Brief`.

### Step 2 — Find next eligible task

Among rows where:

1. `Role` matches your current session role (or the override role)
2. `Status: pending`
3. **All** task IDs in `Depends` have `Status: done` somewhere in the queue

Pick the row with the **lowest task ID** (lexicographic on T## works; `critic-v1` etc. by definition order).

If no eligible task: respond `No eligible tasks for <role>. Queue: <X> pending / <Y> in-progress / <Z> done.` End procedure.

### Step 3 — Lock (pop)

Edit `.hopper/queue.md`: change that row's `Status` from `pending` to `in-progress`. Append a line below the table:

```
- <task-id> started at <ISO timestamp> by <role> (<your model name>)
```

Save the file. **Do this before starting work** — it's the lock.

### Step 4 — Read task detail

Look up full task spec in `.hopper/handoffs/leader-tasklist.md` (find the `**T##**` row). Also read any referenced spec sections (`docs/plans/...`).

### Step 5 — Execute

Do the work per Acceptance criteria. Use whatever tools you have (Read / Edit / Write / Bash etc.).

### Step 6 — Sanity check before claiming done

Don't mark `done` until every Acceptance bullet for the task is verified:

- File-existence checks → confirm with `ls` / Glob
- `tsc --noEmit` style checks → run them
- Grep checks → run them
- Test checks → run them
- Manual verification → state explicitly "manual verification needed: <describe what user should check>" and leave Status `in-progress` until user confirms

### Step 7 — Mark done

Edit `.hopper/queue.md`:

- Change `Status: in-progress` → `Status: done`
- Append below the table:
  ```
  - <task-id> done at <ISO timestamp> — <one-line summary>
  ```

If task **failed** (acceptance can't be met): set `Status: failed`, write a `.hopper/handoffs/blocker-<task-id>.md` with the reason, and **do not advance**. Tell user to escalate to Leader.

### Step 7.5 — Write output artifact (NEW in v3)

**Mandatory**：mark done 之后，写一份**结构化 output 文件**到 `.hopper/handoffs/<task-id>-output.md`，作为 Leader 反向 feedback 的数据源。

不同角色的 output 文件名约定：

- Builder / Builder-UI / Executor: `.hopper/handoffs/<task-id>-output.md`
- Critic: `.hopper/handoffs/critic-<task-id>.md` 或 `day*-critic-*.md`（已有约定）
- Researcher: `.hopper/handoffs/<day>-researcher-output.md`（已有约定）

**为什么需要这个**：Step 10 的"Report" 只在 Worker CLI session 短暂存在，Leader session 拿不到。output.md 落盘后 Leader 可以 `review <task-id>` 时直接读。**这条规则解决"feedback 靠 copy-paste"的协议结构性 gap**。

**Builder Output Template**（Builder/Builder-UI/Executor 用）：

```markdown
# <task-id> — <role> Output

## Summary
<one paragraph：做了什么、为什么这样做>

## Files touched
- path/to/file (new/modified, ~N lines): <one-line purpose>
- ...

## Acceptance verification (X/Y)
1. ✓ <criterion 1> — <evidence: 命令输出 / 文件路径 / 行号>
2. ✓ <criterion 2> — <evidence>
...

## Decisions / deviations from spec
- <decision 1>: <reason; 是否需要 Leader 审议>
- <deviation 1>: <spec 写 X，实际做 Y，因为 Z>
- 如完全按 spec：写 "无偏离"

## Open questions for Leader
<bullet list；如无写 "none">

## Commit
<short-sha> "[<task-id>] <message>"

## Next recommendation
<下一个建议 pop 的 task ID 或 blocker 提示>
```

模板见 `.hopper/templates/builder-output.md`（如本项目已部署）。

### Step 8 — Append to cost log

Append a row to `.hopper/COST-LOG.md`. If it doesn't exist, create it with header:

```markdown
# Cost Log

| Date | Task | Role | Model | Tokens In/Out | Approx $ | Notes |
|------|------|------|-------|---------------|----------|-------|
```

Then append your row. If your CLI doesn't expose token counts, **estimate** and prefix with `~`. Never leave blank — this is dogfood data.

### Step 9 — Commit (atomic)

**Mandatory**：本步骤把"work 文件 + queue 状态翻转 + cost log 行 + handoff 文档"打包成单一 git commit，让 PR 边界与 task 边界对齐。

```bash
git add <all files you touched in this ping cycle>
git commit -m "[<task-id>] <one-line summary>"
```

约定：

- **Prefix**：commit message 必须以 `[<task-id>]` 开头（如 `[T03]` / `[critic-v1]` / `[T18a]`）
- **Body 建议**（非强制）：空行后写 "Files touched: ..." 与 "Acceptance: X/Y verified"
- **不要 push**——push 是 Leader 的特权，由用户手动决定时机
- **不要 amend** 之前的 commit——每个 task 一个新 commit
- **不要 `--no-verify`** —— 让 hooks / lint 跑；如果失败见下方 "If commit fails"

**git add 的 scope**：

- 你修改的 work 文件（src/、docs/、tests/ 等）
- `.hopper/queue.md`（含 Step 3 的 lock 与 Step 7 的 done 翻转）
- `.hopper/COST-LOG.md`（Step 8 的新行）
- `.hopper/handoffs/<task-id>-output.md`（**Step 7.5 必有**）
- 不要 `git add .` 或 `git add -A`——精确加你 touched 的文件

**If commit fails**（pre-commit hook / lint / typecheck 报错）：

1. **不能 mark done 提前完成**——commit 失败 = task 没真正完成
2. 尝试修复：读 hook 报错信息 → 改对应文件 → 重新 git add + commit
3. 修复 3 次仍失败 → 把 queue.md 里 task status 从 `done` 退回 `in-progress`，写 `.hopper/handoffs/blocker-<task-id>.md` 描述 hook 报什么错，停止此次 ping，把控制权还给用户

**Critic role 的特殊约定**：

- Critic 不改产品代码，只产出 review 文档（`.hopper/handoffs/critic-*.md` 或 `day*-critic-spec-review*.md`）
- 同样要 commit：`[<task-id>] critic review: <verdict>` + 改 queue.md / COST-LOG.md
- Critic 的 commit 不触发 Builder PR review；它本身就是 review 产物

### Step 10 — Report

Format your final response:

```
✅ <task-id> done

Shipped: <one line>
Files touched: <list>
Acceptance: <X>/<Y> verified, <Z> needs manual confirm
Commit: <short-sha> "[<task-id>] <message>"

Next pending for <role>: <task-id-or-"none">
Queue: <pending>/<in-progress>/<done>/<failed>
```

---

## Forms detail

### `ping --status`

Read queue, output a summary table grouped by Role and Status. No file changes.

### `ping --dry`

Run Steps 0-2 only; show "Would pop: <task-id> (<brief>)". No file changes.

### `ping <role>`

Override role for this one ping. Used when one CLI session covers multiple roles (e.g. Gemini doing both Researcher and Builder-UI at different times).

---

## Leader Review Protocol（v3 新增）

Leader 通过 `review` 系列命令消费 Worker 落盘的 output.md，避免人工 copy-paste。

### Procedure when user types `review <task-id>`

#### Step 1 — Locate task

Read `.hopper/queue.md`，找到 row with ID = `<task-id>`，确认 `Status: done`（如果 in-progress 或 pending 提示用户）。

#### Step 2 — Read artifacts

- `.hopper/handoffs/<task-id>-output.md` — Worker 的结构化 output（**主输入**）
- 关联 commit：`git log --oneline --grep="\\[<task-id>\\]"` 找 sha → `git show --stat <sha>` 看文件改动
- 必要时读关键 diff：`git show <sha> -- <key file>`
- 如有：`.hopper/handoffs/critic-<task-id>.md`（如该 task 已被 Critic 审过）

#### Step 3 — Evaluate

把 output.md 的 5 个段落（Summary / Files / Acceptance / Decisions / Open questions）逐项验证：

- **Acceptance**：每条 evidence 是否真的支持 ✓？
- **Deviations**：偏离 spec 的决定是否合理？需要 Leader 修订 spec？
- **Open questions**：每个问题给明确答复（不留悬置）

#### Step 4 — Verdict

四选一：

| Verdict | 含义 | 后续动作 |
|---------|------|----------|
| ✅ **accept** | 完全 OK，ship as-is | 无新动作；可在 HOPPER-FEEDBACK 加观察 |
| ⚠ **accept-with-note** | 接受但有跟进事项 | 在 task 的 output.md 末尾追加 `## Leader review: <verdict>` + note；如有改进想法加 HOPPER-FEEDBACK |
| ✗ **rework** | 需要修复 | 把新 task `<task-id>-rework-1` 推进 queue.md（status pending）；spec 在原 task 的 output.md 末尾说清楚需要改什么；原 task 状态保持 done |
| 🚫 **revert** | 严重错误，需回滚 | **不自动 revert**；告诉用户该 commit 应被 revert；写入 `.hopper/handoffs/blocker-<task-id>.md`；queue 里加 `<task-id>-revert` task |

#### Step 5 — Write feedback to output.md

不论 verdict 是哪个，都在 `.hopper/handoffs/<task-id>-output.md` 末尾追加：

```markdown
---

## Leader review

- Verdict: <accept / accept-with-note / rework / revert>
- Date: <ISO timestamp>
- Reviewed-by: leader (<your model name>)
- Notes:
  - <bullet 1>
  - <bullet 2>
- Follow-up tasks queued: <list of new task IDs in queue.md or "none">
```

#### Step 6 — Commit feedback

提交 review changes（output.md 末尾追加 + 可能的 queue.md / HOPPER-FEEDBACK 改动）：

```bash
git add .hopper/handoffs/<task-id>-output.md [.hopper/queue.md] [.hopper/HOPPER-FEEDBACK.md]
git commit -m "[review:<task-id>] <verdict>: <one-line>"
```

### Procedure when user types `review`（无参数）

读 `.hopper/queue.md`，找最新一条 status=done 且其 output.md 末尾没有 `## Leader review` 段的 task。等同于 `review <that-id>`。

如果所有 done task 都已 review：响应 "No pending feedback. Last reviewed: <task-id>."

### Procedure when user types `review --pending`

读 `.hopper/queue.md`，列出所有"done 但未 review"的 task ID 与 brief。**不**进入 review 流程，让用户挑下一个。

---

## Concurrency notes

- This protocol is **not race-safe**. Don't `ping` simultaneously in two sessions for the same role
- If you find a task in `in-progress` matching your role, that means another session has it (or crashed mid-execution). Pick next eligible OR report `Stalled: <task-id> in-progress for <duration>; do you want me to override?` Don't auto-take a stalled task

## Push protocol

Adding new tasks to the queue is **Leader's privilege**. Builder / Executor / Critic etc. **do not push** new tasks; if you find work that should be done but isn't queued, write it as a recommendation in your handoff output and let Leader decide whether to enqueue.

Leader pushes by editing `.hopper/queue.md` directly: add a row, set `Status: pending` and `Depends:` correctly. No special command needed.

## When NOT to use `ping`

- For ad-hoc questions ("what does this code do?") — just answer normally
- For exploratory work without a queued task — just do the work; don't try to fit into the protocol
- For Day 1 / Day 2 type kickoff work that's not in the queue — Leader uses `.hopper/prompts/*.md` directly

## Schema versioning

| Version | Date | Change |
|---------|------|--------|
| v1 | 2026-05-06 | Initial: 9 steps without commit |
| v2 | 2026-05-06 | Added Step 9 atomic commit; renumbered Report to Step 10 |
| **v3** | **2026-05-06** | **Added Step 7.5 (output artifact required) + Leader Review Protocol (`review` family)；解决 worker → leader feedback 的协议 gap** |

If queue.md format or protocol ever changes incompatibly, future versions will document the migration here.
