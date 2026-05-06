# Ping Protocol

Anchor: `.hopper/PING.md::root`

This file defines what any LLM CLI session should do when the user types `ping`. It is the **single source of truth** for ping semantics in this project. Bootstrap files at repo root (`CLAUDE.md` / `GEMINI.md` / `AGENTS.md`) only point here.

---

## Forms

- `ping` — pop the next eligible task for **this session's role**
- `ping <role>` — explicit override: pop next task for `<role>` regardless of session role
- `ping --status` — show queue summary, do not modify anything
- `ping --dry` — show what `ping` would pop, do not modify anything

---

## Procedure when user types `ping`

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

### Step 8 — Append to cost log

Append a row to `.hopper/COST-LOG.md`. If it doesn't exist, create it with header:

```markdown
# Cost Log

| Date | Task | Role | Model | Tokens In/Out | Approx $ | Notes |
|------|------|------|-------|---------------|----------|-------|
```

Then append your row. If your CLI doesn't expose token counts, **estimate** and prefix with `~`. Never leave blank — this is dogfood data.

### Step 9 — Report

Format your final response:

```
✅ <task-id> done

Shipped: <one line>
Files touched: <list>
Acceptance: <X>/<Y> verified, <Z> needs manual confirm

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

Current schema version: 1. If queue.md format ever changes incompatibly, this file will document the migration.
