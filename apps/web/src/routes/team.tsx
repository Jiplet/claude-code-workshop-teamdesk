import {
  ANNOUNCEMENT_BODY_MAX_LENGTH,
  MEMBER_NAME_MAX_LENGTH,
  MEMBER_ROLES,
} from "@repo/db/shared";
import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useCallback, useMemo } from "react";
import AnnouncementList from "#/components/announcement-list";
import FormError from "#/components/form-error";
import MemberPicker from "#/components/member-picker";
import MinifigHead from "#/components/minifig-head";
import PageError from "#/components/page-error";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Kbd, KbdGroup } from "#/components/ui/kbd";
import {
  NativeSelect,
  NativeSelectOption,
} from "#/components/ui/native-select";
import { Textarea } from "#/components/ui/textarea";
import { useActingMember } from "#/hooks/use-acting-member";
import { useAction } from "#/hooks/use-action";
import { getTrpc } from "#/integrations/trpc/client";
import { formatUtc } from "#/lib/datetime";

export const Route = createFileRoute("/team")({
  loader: async () => {
    const trpc = getTrpc();
    const [members, announcements] = await Promise.all([
      trpc.members.list.query(),
      trpc.announcements.latest.query(),
    ]);
    return { announcements, members };
  },
  component: TeamPage,
  errorComponent: PageError,
});

function TeamPage() {
  const { announcements, members } = Route.useLoaderData();
  const { actingMember, setActingMemberId } = useActingMember(members);
  const addMember = useAction();
  const postAnnouncement = useAction();
  const actorId = actingMember?.id ?? "";

  const memberNames = useMemo(
    () => new Map(members.map((member) => [member.id, member.name])),
    [members]
  );

  const handleAddMember = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const ok = await addMember.run(() =>
        getTrpc().members.add.mutate({
          actorId,
          member: {
            email: String(data.get("email") ?? ""),
            name: String(data.get("name") ?? ""),
            role:
              MEMBER_ROLES.find((role) => role === data.get("role")) ??
              "member",
          },
        })
      );
      if (ok) {
        form.reset();
      }
    },
    [actorId, addMember.run]
  );

  const handlePost = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const ok = await postAnnouncement.run(() =>
        getTrpc().announcements.post.mutate({
          actorId,
          announcement: { body: String(data.get("body") ?? "") },
        })
      );
      if (ok) {
        form.reset();
      }
    },
    [actorId, postAnnouncement.run]
  );

  return (
    <main className="page-wrap px-4 py-12">
      <section className="flex max-w-3xl flex-col gap-4">
        <p className="island-kicker m-0">Teamdesk</p>
        <h1 className="display-title m-0 text-4xl text-foreground sm:text-5xl">
          Team
        </h1>
        <p className="m-0 text-base text-muted-foreground leading-8">
          Who is on the team and what they need to know.
        </p>
        <MemberPicker
          members={members}
          onChange={setActingMemberId}
          value={actingMember?.id}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-2xl text-foreground">Members</h2>
        <ul className="m-0 list-none space-y-4 p-0">
          {members.map((member) => (
            <li
              className="flex items-center gap-4 border-border border-t pt-4"
              key={member.id}
            >
              <MinifigHead
                className="size-14 flex-shrink-0"
                name={member.name}
                seed={member.id}
              />
              <div className="min-w-0">
                <p className="m-0 font-semibold text-foreground">
                  {member.name}
                </p>
                <p className="m-0 text-muted-foreground text-sm">
                  {member.email}, {member.role}, joined{" "}
                  {formatUtc(member.joinedAt).slice(0, 10)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {actingMember?.role === "admin" ? (
          <form
            className="island-shell mt-6 p-6 sm:p-8"
            onSubmit={handleAddMember}
          >
            <p className="island-kicker mb-3">Add member</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                aria-label="Name"
                maxLength={MEMBER_NAME_MAX_LENGTH}
                name="name"
                placeholder="Name"
                required
              />
              <Input
                aria-label="Email"
                name="email"
                placeholder="Email"
                required
                type="email"
              />
              <NativeSelect
                aria-label="Role"
                className="sm:w-32"
                defaultValue="member"
                name="role"
              >
                {MEMBER_ROLES.map((role) => (
                  <NativeSelectOption key={role} value={role}>
                    {role}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <Button disabled={addMember.pending} type="submit">
                {addMember.pending ? "Adding…" : "Add member"}
              </Button>
            </div>
            <FormError message={addMember.error} />
          </form>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-2xl text-foreground">
          Announcements
        </h2>
        <form className="island-shell mb-6 p-6 sm:p-8" onSubmit={handlePost}>
          <label
            className="island-kicker mb-3 block"
            htmlFor="announcement-body"
          >
            Post an announcement
          </label>
          <Textarea
            id="announcement-body"
            maxLength={ANNOUNCEMENT_BODY_MAX_LENGTH}
            name="body"
            required
          />
          <div className="mt-3 flex items-center gap-3">
            <Button disabled={postAnnouncement.pending} type="submit">
              {postAnnouncement.pending ? "Posting…" : "Post"}
            </Button>
            <span className="text-muted-foreground text-xs">
              or{" "}
              <KbdGroup>
                <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd>
              </KbdGroup>
            </span>
          </div>
          <FormError message={postAnnouncement.error} />
        </form>
        <AnnouncementList
          announcements={announcements}
          memberNames={memberNames}
        />
      </section>
    </main>
  );
}
