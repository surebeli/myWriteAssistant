# <task-id> — <role> Output

> **使用说明**：把本文件复制到 `.hopper/handoffs/<task-id>-output.md`（替换占位文件名），按 PING.md Step 7.5 填写。删除本说明段。

## Summary

<one paragraph：做了什么、为什么这样做>

## Files touched

- `path/to/file.ext` (new/modified, ~N lines): <one-line purpose>
- ...

## Acceptance verification (X/Y)

1. ✓ <criterion 1> — <evidence: 命令输出 / 文件路径 / 行号>
2. ✓ <criterion 2> — <evidence>
...
N. ⚠ <criterion N> — needs manual confirm: <describe what user should check>

## Decisions / deviations from spec

- <decision 1>: <reason; 是否需要 Leader 审议>
- <deviation 1>: <spec 写 X，实际做 Y，因为 Z>
- 如完全按 spec：写 "无偏离"

## Open questions for Leader

- <question 1>
- <question 2>
- 如无：写 "none"

## Commit

`<short-sha> "[<task-id>] <message>"`

## Next recommendation

<下一个建议 pop 的 task ID 或 blocker 提示>

---

<!-- Leader 在 review 完成后会在此追加：
## Leader review
- Verdict: <accept | accept-with-note | rework | revert>
- Date: <ISO>
- Reviewed-by: leader (<model>)
- Notes: ...
- Follow-up tasks queued: <ids or "none">
-->
