# Task board

The Tasks page becomes a kanban board with three columns: To do, In progress and Done.

## Why

A flat list only says open or done. The team wants to see what someone has picked up, and to move work along by dragging a card.

## Behaviour

- Every task has a status: `todo`, `in_progress` or `done`. New tasks start in To do.
- Existing tasks keep their state: done tasks land in Done, open ones in To do.
- A card shows the title, due date (Overdue when past), assignee and, when done, the date it was done.
- Move a card by dragging it to another column, or with the card's status menu (keyboard and touch).
- Who may move a task: its assignee, its creator or an admin. Anyone may start an unassigned task; starting it assigns it to them.
- Moving to Done records the completion time. Moving out of Done clears it, so the task is open again.
- Moving a card to the column it is already in changes nothing.
- My day keeps listing open tasks (To do and In progress) that are due.
- The new-task form and the assignee menu stay as they are.

## Out of scope

Ordering cards within a column by hand, WIP limits, more columns.
