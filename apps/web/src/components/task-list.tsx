import type { Member, Task } from "@repo/db/shared";
import { type ChangeEvent, type MouseEvent, useCallback } from "react";
import { Button } from "#/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "#/components/ui/native-select";

interface TaskListProps {
  disabled: boolean;
  members: readonly Member[];
  onAssign: (taskId: string, assigneeId: string | null) => void;
  onComplete: (taskId: string) => void;
  tasks: readonly Task[];
}

export default function TaskList({
  disabled,
  members,
  onAssign,
  onComplete,
  tasks,
}: TaskListProps) {
  const handleAssign = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const { taskId } = event.currentTarget.dataset;
      if (taskId) {
        onAssign(taskId, event.currentTarget.value || null);
      }
    },
    [onAssign]
  );

  const handleComplete = useCallback(
    (event: MouseEvent<HTMLButtonElement>) =>
      onComplete(event.currentTarget.value),
    [onComplete]
  );

  if (tasks.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No tasks yet. Add the first one above.
      </p>
    );
  }
  return (
    <ul className="m-0 list-none space-y-4 p-0">
      {tasks.map((task) => (
        <li
          className="flex flex-col gap-3 border-border border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
          key={task.id}
        >
          <div>
            <p
              className={
                task.completedAt
                  ? "m-0 text-muted-foreground line-through"
                  : "m-0 text-foreground"
              }
            >
              {task.title}
            </p>
            <p className="m-0 text-muted-foreground text-xs">
              {task.dueOn ? `Due ${task.dueOn}` : "No due date"}
              {task.completedAt
                ? `, done ${task.completedAt.slice(0, 10)}`
                : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NativeSelect
              aria-label={`Assignee for ${task.title}`}
              data-task-id={task.id}
              disabled={disabled || task.completedAt !== null}
              onChange={handleAssign}
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
            {task.completedAt ? null : (
              <Button
                disabled={disabled}
                onClick={handleComplete}
                size="sm"
                value={task.id}
                variant="outline"
              >
                Complete
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
