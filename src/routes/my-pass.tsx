import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getEvent, inr, loadBookings, type Booking } from "@/lib/data";
import { downloadPass } from "@/lib/pdf";

export const Route = createFileRoute("/my-pass")({
  head: () => ({
    meta: [
      { title: "My Passes — AapnoPass" },
      { name: "description", content: "View and download your Navratri passes." },
      { property: "og:title", content: "My Passes — AapnoPass" },
      { property: "og:description", content: "All your Navratri passes in one place." },
    ],
  }),
  component: MyPass,
});

function MyPass() {
  const [list, setList] = useState<Booking[]>([]);
  useEffect(() => setList(loadBookings()), []);
  return (
    <section className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="font-display text-5xl">My passes</h1>
      {!list.length && <p className="mt-6 text-muted-foreground">No passes yet. <Link to="/events" className="font-semibold text-primary">Explore events →</Link></p>}
      <div className="mt-8 space-y-3">
        {list.map((b) => {
          const ev = getEvent(b.eventId)!;
          return (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5">
              <div><p className="font-display text-xl">{ev.name}</p><p className="text-sm text-muted-foreground">{b.id} · {b.date} · {inr(b.total)}</p></div>
              <button onClick={() => downloadPass(b)} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Download PDF</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
