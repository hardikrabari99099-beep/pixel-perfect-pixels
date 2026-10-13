import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { eventsQuery, inr, minPrice, type EventItem } from "@/lib/data";

export const Route = createFileRoute("/events")({
  loader: ({ context }) => context.queryClient.ensureQueryData(eventsQuery),
  head: () => ({
    meta: [
      { title: "Explore Navratri Events in Surat — AapnoPass" },
      { name: "description", content: "Browse every Navratri garba and dandiya event across Surat." },
      { property: "og:title", content: "Explore Navratri Events — AapnoPass" },
      { property: "og:description", content: "All Surat Navratri events in one place." },
    ],
  }),
  component: EventsLayout,
});

export function EventCard({ e }: { e: EventItem }) {
  return (
    <Link to="/events/$id" params={{ id: e.id }} className="group flex flex-col rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-xl">
      <div className="pattern-bandhani flex h-32 items-end rounded-xl bg-forest p-4">
        {e.tag && <span className="rounded-full bg-saffron px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">{e.tag}</span>}
      </div>
      <p className="mt-4 font-display text-xl leading-tight group-hover:text-primary">{e.name}</p>
      <p className="mt-1 text-sm text-muted-foreground">{e.area} · {e.dates}</p>
      {e.artist && <p className="mt-1 text-sm text-muted-foreground">🎤 {e.artist}</p>}
      {e.passes.length > 0 && <p className="mt-auto pt-4 text-sm">From <span className="font-bold text-primary">{inr(minPrice(e))}</span></p>}
    </Link>
  );
}

function EventsLayout() {
  const match = useMatchRoute();
  if (match({ to: "/events/$id", fuzzy: true })) return <Outlet />;
  return <EventList />;
}

function EventList() {
  const { data: events } = useSuspenseQuery(eventsQuery);
  const [q, setQ] = useState("");
  const [area, setArea] = useState("All");
  const areas = ["All", ...new Set(events.map((e) => e.area))];
  const list = events.filter((e) => (area === "All" || e.area === area) && (e.name + e.venue + e.artist).toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-display text-5xl">Explore Navratri</h1>
      <div className="mt-8 flex flex-wrap gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search event, venue or artist" className="h-11 flex-1 rounded-full border bg-card px-5 text-sm outline-none focus:ring-2 focus:ring-ring" />
        {areas.map((a) => (
          <button key={a} onClick={() => setArea(a)} className={`h-11 rounded-full px-5 text-sm font-medium ${a === area ? "bg-primary text-primary-foreground" : "border bg-card"}`}>{a}</button>
        ))}
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((e) => <EventCard key={e.id} e={e} />)}
      </div>
      {!list.length && <p className="mt-10 text-muted-foreground">No events match your search.</p>}
    </section>
  );
}
