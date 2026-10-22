import {
  type Member,
  TASK_STATUSES,
  type Task,
  type TaskFlag,
  type TaskStatus,
} from "@repo/db/shared";
import { Ban, CalendarDays, Flame } from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import MinifigHead from "#/components/minifig-head";
import { Checkbox } from "#/components/ui/checkbox";
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

// Each column has its own colour: the strip on the column, the dot and count
// in its header and the bar down the side of each card.
const STATUS_STYLES: Record<
  TaskStatus,
  { bar: string; count: string; dot: string; strip: string }
> = {
  done: {
    bar: "bg-status-done",
    count: "bg-status-done/12 text-status-done",
    dot: "bg-status-done",
    strip: "bg-status-done",
  },
  in_progress: {
    bar: "bg-status-progress",
    count: "bg-status-progress/12 text-status-progress",
    dot: "bg-status-progress",
    strip: "bg-status-progress",
  },
  todo: {
    bar: "bg-status-todo",
    count: "bg-status-todo/12 text-status-todo",
    dot: "bg-status-todo",
    strip: "bg-status-todo",
  },
};

const isTaskStatus = (value: string): value is TaskStatus =>
  (TASK_STATUSES as readonly string[]).includes(value);

interface TaskBoardProps {
  disabled: boolean;
  members: readonly Member[];
  onAssign: (taskId: string, assigneeId: string | null) => void;
  onFlag: (taskId: string, flag: TaskFlag, value: boolean) => void;
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
  onFlag,
  onMove,
  tasks,
  today,
}: TaskBoardProps) {
  const memberNames = useMemo(
    () => new Map(members.map((member) => [member.id, member.name])),
    [members]
  );
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
            className={`island-shell flex min-h-48 flex-col overflow-hidden bg-muted/40 transition-colors ${
              dropTarget === status ? "border-primary bg-accent" : ""
            }`}
            data-status={status}
            key={status}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className={`h-1 ${STATUS_STYLES[status].strip}`} />
            <header className="flex items-center justify-between px-4 pt-5 pb-4">
              <h2 className="m-0 flex items-center gap-2.5 font-heading text-2xl text-foreground leading-tight">
                <span
                  aria-hidden="true"
                  className={`size-3 rounded-full ${STATUS_STYLES[status].dot}`}
                />
                {COLUMN_TITLES[status]}
              </h2>
              <span
                className={`rounded-full px-3 py-0.5 font-semibold text-sm tabular-nums ${STATUS_STYLES[status].count}`}
              >
                {column.length}
              </span>
            </header>
            {column.length === 0 ? (
              <p className="m-0 mx-4 mb-4 rounded-xl border border-border border-dashed p-4 text-center text-muted-foreground text-sm">
                {EMPTY_TEXT[status]}
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 px-3 pb-4">
                {column.map((task) => (
                  <TaskCard
                    assigneeName={
                      task.assigneeId === null
                        ? null
                        : (memberNames.get(task.assigneeId) ?? null)
                    }
                    disabled={disabled}
                    key={task.id}
                    members={members}
                    onAssign={handleAssign}
                    onDragStart={handleDragStart}
                    onFlag={onFlag}
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
  assigneeName,
  disabled,
  members,
  onAssign,
  onDragStart,
  onFlag,
  onStatus,
  task,
  today,
}: {
  assigneeName: string | null;
  disabled: boolean;
  members: readonly Member[];
  onAssign: (event: ChangeEvent<HTMLSelectElement>) => void;
  onDragStart: (event: DragEvent<HTMLLIElement>) => void;
  onFlag: (taskId: string, flag: TaskFlag, value: boolean) => void;
  onStatus: (event: ChangeEvent<HTMLSelectElement>) => void;
  task: Task;
  today: string;
}) {
  const overdue =
    task.status !== "done" && task.dueOn !== null && task.dueOn < today;
  const done = task.status === "done";

  const handleBlocked = useCallback(
    (checked: boolean | "indeterminate") =>
      onFlag(task.id, "blocked", checked === true),
    [onFlag, task.id]
  );
  const handlePriority = useCallback(
    (checked: boolean | "indeterminate") =>
      onFlag(task.id, "highPriority", checked === true),
    [onFlag, task.id]
  );

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: drag handle for mouse users; the status menu below does the same by keyboard
    <li
      className={`relative cursor-grab overflow-hidden rounded-xl border bg-card py-3 pr-3 pl-5 shadow-[0_1px_2px_rgba(25,28,31,0.06)] transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_rgba(25,28,31,0.25)] active:cursor-grabbing ${
        task.blocked
          ? "border-flag-blocked/50 bg-flag-blocked/5"
          : "border-border"
      }`}
      data-task-id={task.id}
      draggable={!disabled}
      onDragStart={onDragStart}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-3 left-2 w-1 rounded-full ${STATUS_STYLES[task.status].bar}`}
      />
      {task.blocked || task.highPriority ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {task.highPriority ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-flag-priority/12 px-2 py-0.5 font-semibold text-[11px] text-flag-priority uppercase tracking-wide">
              <Flame aria-hidden="true" className="size-3" />
              High priority
            </span>
          ) : null}
          {task.blocked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-flag-blocked/12 px-2 py-0.5 font-semibold text-[11px] text-flag-blocked uppercase tracking-wide">
              <Ban aria-hidden="true" className="size-3" />
              Blocked
            </span>
          ) : null}
        </div>
      ) : null}
      <p
        className={
          done
            ? "m-0 font-medium text-muted-foreground line-through"
            : "m-0 font-medium text-foreground"
        }
      >
        {task.title}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
          {assigneeName === null || task.assigneeId === null ? (
            <span className="inline-block size-6 rounded-full border border-border border-dashed" />
          ) : (
            <MinifigHead
              className="size-6 flex-shrink-0"
              name={assigneeName}
              seed={task.assigneeId}
            />
          )}
          <span className="truncate">{assigneeName ?? "Unassigned"}</span>
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${
            overdue
              ? "bg-flag-blocked/12 font-semibold text-flag-blocked"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <CalendarDays aria-hidden="true" className="size-3" />
          {dueText(task, today)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-border border-t pt-3 text-xs">
        <span className="inline-flex items-center gap-2">
          <Checkbox
            checked={task.blocked}
            className="data-checked:border-flag-blocked data-checked:bg-flag-blocked dark:data-checked:bg-flag-blocked"
            disabled={disabled}
            id={`blocked-${task.id}`}
            onCheckedChange={handleBlocked}
          />
          <label
            className="cursor-pointer text-foreground"
            htmlFor={`blocked-${task.id}`}
          >
            Blocked
          </label>
        </span>
        <span className="inline-flex items-center gap-2">
          <Checkbox
            checked={task.highPriority}
            className="data-checked:border-flag-priority data-checked:bg-flag-priority dark:data-checked:bg-flag-priority"
            disabled={disabled}
            id={`priority-${task.id}`}
            onCheckedChange={handlePriority}
          />
          <label
            className="cursor-pointer text-foreground"
            htmlFor={`priority-${task.id}`}
          >
            High priority
          </label>
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <NativeSelect
          aria-label={`Assignee for ${task.title}`}
          data-task-id={task.id}
          disabled={disabled || done}
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
