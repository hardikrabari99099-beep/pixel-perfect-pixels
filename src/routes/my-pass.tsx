import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/booking-view";
import { fetchBookings, inr, myIds, rememberId } from "@/lib/data";
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
  const [ids, setIds] = useState<string[]>([]);
  const [find, setFind] = useState("");
  useEffect(() => setIds(myIds()), []);
  const { data: list = [] } = useQuery({ queryKey: ["my", ids], queryFn: () => fetchBookings(ids), enabled: ids.length > 0 });
  const add = () => { const v = find.trim().toUpperCase(); if (v) { rememberId(v); setIds(myIds()); setFind(""); } };
  return (
    <section className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="font-display text-5xl">My passes</h1>
      <div className="mt-6 flex gap-2">
        <input value={find} onChange={(e) => setFind(e.target.value)} placeholder="Have a booking ID? Enter it here" className="h-11 flex-1 rounded-full border bg-card px-5 text-sm" />
        <button onClick={add} className="rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Find</button>
      </div>
      {!list.length && <p className="mt-6 text-muted-foreground">No passes yet. <Link to="/events" className="font-semibold text-primary">Explore events →</Link></p>}
      <div className="mt-8 space-y-3">
        {list.map((b) => (
          <div key={b.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5">
            <div><p className="font-display text-xl">{b.event_name}</p><p className="text-sm text-muted-foreground">{b.id} · {b.pass_name} × {b.qty} · {b.night} · {inr(b.total)}</p><div className="mt-2"><StatusBadge s={b.status} /></div></div>
            {(b.status === "approved" || b.status === "used") && <button onClick={() => downloadPass(b)} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Download PDF</button>}
          </div>
        ))}
      </div>
    </section>
  );
}
