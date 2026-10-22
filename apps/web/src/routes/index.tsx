import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/")({ component: App });

const pages = [
  {
    description: "See who is on the team and read the latest announcements.",
    title: "Team",
    to: "/team",
  },
  {
    description: "The meeting rooms you can book and how many each seats.",
    title: "Rooms",
    to: "/rooms",
  },
  {
    description: "Book a room for a meeting and keep track of your bookings.",
    title: "Bookings",
    to: "/bookings",
  },
  {
    description: "Shared jobs, who has them and when they are due.",
    title: "Tasks",
    to: "/tasks",
  },
  {
    description: "Your bookings today and the tasks you need to finish.",
    title: "My day",
    to: "/my-day",
  },
] as const;

function App() {
  return (
    <main className="page-wrap px-4 pt-14 pb-8">
      <section className="rise-in pt-6 pb-4 sm:pt-10">
        <p className="island-kicker mb-4">Teamdesk</p>
        <h1 className="display-title mb-5 max-w-3xl text-5xl text-foreground leading-[1.05] sm:text-6xl">
          Rooms, bookings and tasks for a small team.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-muted-foreground sm:text-lg">
          One place to book a meeting room, share announcements and keep track
          of who is doing what.
        </p>
        <Button asChild>
          <Link to="/bookings">Book a room</Link>
        </Button>
      </section>

      <section className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
        {pages.map(({ description, title, to }, index) => (
          <article
            className="rise-in border-border border-t pt-5"
            key={title}
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className="mb-2 font-heading text-2xl text-foreground leading-tight">
              <Link className="no-underline" to={to}>
                {title}
              </Link>
            </h2>
            <p className="m-0 text-muted-foreground text-sm">{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
