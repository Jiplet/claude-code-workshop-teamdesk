import { TASK_TITLE_MAX_LENGTH, type TaskStatus } from "@repo/db/shared";
import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import FormError from "#/components/form-error";
import MemberPicker from "#/components/member-picker";
import PageError from "#/components/page-error";
import TaskBoard from "#/components/task-board";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "#/components/ui/native-select";
import { useActingMember } from "#/hooks/use-acting-member";
import { useAction } from "#/hooks/use-action";
import { getTrpc } from "#/integrations/trpc/client";
import { localDayBounds } from "#/lib/datetime";

export const Route = createFileRoute("/tasks")({
  loader: async () => {
    const trpc = getTrpc();
    const [members, tasks] = await Promise.all([
      trpc.members.list.query(),
      trpc.tasks.list.query(),
    ]);
    return { members, tasks };
  },
  component: TasksPage,
  errorComponent: PageError,
});

function TasksPage() {
  const { members, tasks } = Route.useLoaderData();
  const { actingMember, setActingMemberId } = useActingMember(members);
  const createTask = useAction();
  const updateTask = useAction();
  const actorId = actingMember?.id ?? "";
  // The viewer's date marks overdue cards. It is set after hydration because
  // the server renders in UTC.
  const [today, setToday] = useState("");
  useEffect(() => setToday(localDayBounds().today), []);

  const handleCreate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const ok = await createTask.run(() =>
        getTrpc().tasks.create.mutate({
          actorId,
          task: {
            assigneeId: String(data.get("assigneeId") ?? "") || null,
            dueOn: String(data.get("dueOn") ?? "") || null,
            title: String(data.get("title") ?? ""),
          },
        })
      );
      if (ok) {
        form.reset();
      }
    },
    [actorId, createTask.run]
  );

  const handleMove = useCallback(
    (taskId: string, status: TaskStatus) =>
      updateTask.run(() =>
        getTrpc().tasks.move.mutate({ actorId, status, taskId })
      ),
    [actorId, updateTask.run]
  );

  const handleAssign = useCallback(
    (taskId: string, assigneeId: string | null) =>
      updateTask.run(() =>
        getTrpc().tasks.assign.mutate({ actorId, assigneeId, taskId })
      ),
    [actorId, updateTask.run]
  );

  return (
    <main className="page-wrap px-4 py-12">
      <section className="flex max-w-3xl flex-col gap-4">
        <p className="island-kicker m-0">Teamdesk</p>
        <h1 className="display-title m-0 text-4xl text-foreground sm:text-5xl">
          Tasks
        </h1>
        <p className="m-0 text-base text-muted-foreground leading-8">
          Shared jobs for the team. Drag a card along as the work moves.
        </p>
        <MemberPicker
          members={members}
          onChange={setActingMemberId}
          value={actingMember?.id}
        />
      </section>

      <form className="island-shell mt-10 p-6 sm:p-8" onSubmit={handleCreate}>
        <p className="island-kicker mb-3">New task</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            aria-label="Title"
            maxLength={TASK_TITLE_MAX_LENGTH}
            name="title"
            placeholder="What needs doing?"
            required
          />
          <NativeSelect aria-label="Assignee" defaultValue="" name="assigneeId">
            <NativeSelectOption value="">Unassigned</NativeSelectOption>
            {members.map((member) => (
              <NativeSelectOption key={member.id} value={member.id}>
                {member.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Input
            aria-label="Due date"
            className="sm:w-44"
            name="dueOn"
            type="date"
          />
          <Button disabled={createTask.pending} type="submit">
            {createTask.pending ? "Adding…" : "Add task"}
          </Button>
        </div>
        <FormError message={createTask.error} />
      </form>

      <section className="mt-10">
        <FormError message={updateTask.error} />
        <TaskBoard
          disabled={updateTask.pending}
          members={members}
          onAssign={handleAssign}
          onMove={handleMove}
          tasks={tasks}
          today={today}
        />
      </section>
    </main>
  );
}
