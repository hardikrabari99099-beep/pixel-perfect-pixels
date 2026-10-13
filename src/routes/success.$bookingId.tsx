import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PassCard } from "@/components/site";
import { getEvent, inr, loadBookings, type Booking } from "@/lib/data";
import { downloadPass } from "@/lib/pdf";

export const Route = createFileRoute("/success/$bookingId")({
  head: () => ({
    meta: [
      { title: "Booking confirmed — AapnoPass" },
      { name: "description", content: "Your Navratri pass is ready to download." },
      { property: "og:title", content: "Booking confirmed — AapnoPass" },
      { property: "og:description", content: "Your Navratri pass is ready." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Success,
});

function Success() {
  const { bookingId } = Route.useParams();
  const [b, setB] = useState<Booking | null | undefined>(undefined);
  useEffect(() => { setB(loadBookings().find((x) => x.id === bookingId) ?? null); }, [bookingId]);
  if (b === undefined) return null;
  if (!b) return <p className="py-24 text-center">Booking not found.</p>;
  const ev = getEvent(b.eventId)!;
  const pass = ev.passes.find((p) => p.id === b.passId)!;
  return (
    <section className="mx-auto grid max-w-5xl items-center gap-12 px-5 py-16 md:grid-cols-2">
      <div>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary">✓ Payment successful</span>
        <h1 className="mt-5 font-display text-5xl">Aapno pass is ready, {b.name.split(" ")[0]}!</h1>
        <p className="mt-4 text-muted-foreground">{pass.name} × {b.qty} for {ev.name} · {inr(b.total)} paid.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={() => downloadPass(b)} className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Download PDF pass</button>
          <Link to="/my-pass" className="rounded-full border px-6 py-3 font-semibold">My passes</Link>
        </div>
      </div>
      <div className="flex justify-center"><PassCard event={ev.name} name={b.name} date={b.date} type={`${pass.name} × ${b.qty}`} id={b.id} /></div>
    </section>
  );
}
