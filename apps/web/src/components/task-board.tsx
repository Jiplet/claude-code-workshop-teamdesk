import {
  type Member,
  TASK_STATUSES,
  type Task,
  type TaskStatus,
} from "@repo/db/shared";
import { type ChangeEvent, type DragEvent, useCallback, useState } from "react";
import {
  NativeSelect,
  NativeSelectOption,
} from "#/components/ui/native-select";

const COLUMN_TITLES: Record<TaskStatus, string> = {
  done: "Done",
  in_progress: "In progress",
  todo: "To do",
};

const EMPTY_TEXT: Record<TaskStatus, string> = {
  done: "Nothing finished yet.",
  in_progress: "Nobody has started anything.",
  todo: "All clear.",
};

const isTaskStatus = (value: string): value is TaskStatus =>
  (TASK_STATUSES as readonly string[]).includes(value);

interface TaskBoardProps {
  disabled: boolean;
  members: readonly Member[];
  onAssign: (taskId: string, assigneeId: string | null) => void;
  onMove: (taskId: string, status: TaskStatus) => void;
  tasks: readonly Task[];
  /** The viewer's date, YYYY-MM-DD, for marking overdue cards. */
  today: string;
}

/**
 * Kanban board: one column per status. Cards move by drag and drop or with
 * their status menu, which also serves keyboard and touch users.
 */
export default function TaskBoard({
  disabled,
  members,
  onAssign,
  onMove,
  tasks,
  today,
}: TaskBoardProps) {
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);

  const handleDragStart = useCallback((event: DragEvent<HTMLLIElement>) => {
    const { taskId } = event.currentTarget.dataset;
    if (taskId) {
      event.dataTransfer.setData("text/plain", taskId);
      event.dataTransfer.effectAllowed = "move";
    }
  }, []);

  const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    const { status } = event.currentTarget.dataset;
    if (status && isTaskStatus(status)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setDropTarget(status);
    }
  }, []);

  const handleDragLeave = useCallback(() => setDropTarget(null), []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setDropTarget(null);
      const { status } = event.currentTarget.dataset;
      const taskId = event.dataTransfer.getData("text/plain");
      if (taskId && status && isTaskStatus(status)) {
        onMove(taskId, status);
      }
    },
    [onMove]
  );

  const handleStatus = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const { taskId } = event.currentTarget.dataset;
      const { value } = event.currentTarget;
      if (taskId && isTaskStatus(value)) {
        onMove(taskId, value);
      }
    },
    [onMove]
  );

  const handleAssign = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const { taskId } = event.currentTarget.dataset;
      if (taskId) {
        onAssign(taskId, event.currentTarget.value || null);
      }
    },
    [onAssign]
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {TASK_STATUSES.map((status) => {
        const column = tasks.filter((task) => task.status === status);
        return (
          // biome-ignore lint/a11y/noNoninteractiveElementInteractions: drop target for mouse users; each card's status menu does the same by keyboard
          <section
            aria-label={COLUMN_TITLES[status]}
            className={`island-shell flex min-h-48 flex-col p-4 transition-colors ${
              dropTarget === status ? "border-primary bg-accent" : ""
            }`}
            data-status={status}
            key={status}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <header className="mb-3 flex items-center justify-between">
              <h2 className="island-kicker m-0">{COLUMN_TITLES[status]}</h2>
              <span className="rounded-full bg-muted px-2 text-muted-foreground text-xs">
                {column.length}
              </span>
            </header>
            {column.length === 0 ? (
              <p className="m-0 text-muted-foreground text-sm">
                {EMPTY_TEXT[status]}
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {column.map((task) => (
                  <TaskCard
                    disabled={disabled}
                    key={task.id}
                    members={members}
                    onAssign={handleAssign}
                    onDragStart={handleDragStart}
                    onStatus={handleStatus}
                    task={task}
                    today={today}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function dueText(task: Task, today: string): string {
  if (task.completedAt) {
    return `Done ${task.completedAt.slice(0, 10)}`;
  }
  if (task.dueOn === null) {
    return "No due date";
  }
  return task.dueOn < today
    ? `Overdue, was due ${task.dueOn}`
    : `Due ${task.dueOn}`;
}

function TaskCard({
  disabled,
  members,
  onAssign,
  onDragStart,
  onStatus,
  task,
  today,
}: {
  disabled: boolean;
  members: readonly Member[];
  onAssign: (event: ChangeEvent<HTMLSelectElement>) => void;
  onDragStart: (event: DragEvent<HTMLLIElement>) => void;
  onStatus: (event: ChangeEvent<HTMLSelectElement>) => void;
  task: Task;
  today: string;
}) {
  const overdue =
    task.status !== "done" && task.dueOn !== null && task.dueOn < today;
  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: drag handle for mouse users; the status menu below does the same by keyboard
    <li
      className="cursor-grab rounded-xl border border-border bg-background p-3 active:cursor-grabbing"
      data-task-id={task.id}
      draggable={!disabled}
      onDragStart={onDragStart}
    >
      <p
        className={
          task.status === "done"
            ? "m-0 text-muted-foreground line-through"
            : "m-0 text-foreground"
        }
      >
        {task.title}
      </p>
      <p
        className={`m-0 mt-0.5 text-xs ${
          overdue ? "font-medium text-destructive" : "text-muted-foreground"
        }`}
      >
        {dueText(task, today)}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <NativeSelect
          aria-label={`Assignee for ${task.title}`}
          data-task-id={task.id}
          disabled={disabled || task.status === "done"}
          onChange={onAssign}
          size="sm"
          value={task.assigneeId ?? ""}
        >
          <NativeSelectOption value="">Unassigned</NativeSelectOption>
          {members.map((member) => (
            <NativeSelectOption key={member.id} value={member.id}>
              {member.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={`Status of ${task.title}`}
          data-task-id={task.id}
          disabled={disabled}
          onChange={onStatus}
          size="sm"
          value={task.status}
        >
          {TASK_STATUSES.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {COLUMN_TITLES[status]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
    </li>
  );
}
