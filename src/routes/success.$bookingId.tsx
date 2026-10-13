import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PassCard } from "@/components/site";
import { StatusBadge } from "@/components/booking-view";
import { fetchBookings, inr } from "@/lib/data";
import { downloadPass } from "@/lib/pdf";

export const Route = createFileRoute("/success/$bookingId")({
  head: () => ({
    meta: [
      { title: "Booking received — AapnoPass" },
      { name: "description", content: "Your Navratri pass booking status." },
      { property: "og:title", content: "Booking received — AapnoPass" },
      { property: "og:description", content: "Your Navratri pass booking status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Success,
});

function Success() {
  const { bookingId } = Route.useParams();
  const { data, isLoading } = useQuery({ queryKey: ["booking", bookingId], queryFn: () => fetchBookings([bookingId]), refetchInterval: 15000 });
  if (isLoading) return <p className="py-24 text-center text-muted-foreground">Loading…</p>;
  const b = data?.[0];
  if (!b) return <p className="py-24 text-center">Booking not found.</p>;
  const ok = b.status === "approved" || b.status === "used";
  return (
    <section className="mx-auto grid max-w-5xl items-center gap-12 px-5 py-16 md:grid-cols-2">
      <div>
        <StatusBadge s={b.status} />
        <h1 className="mt-5 font-display text-5xl">{ok ? `Aapno pass is ready, ${b.name.split(" ")[0]}!` : b.status === "rejected" ? "We couldn't verify your payment" : "Thank you! We're verifying your payment."}</h1>
        <p className="mt-4 text-muted-foreground">{b.pass_name} × {b.qty} for {b.event_name} · {inr(b.total)} · UTR {b.utr}</p>
        {!ok && b.status === "pending" && <p className="mt-2 text-sm text-muted-foreground">Your pass unlocks here as soon as we match your UTR. Booking ID: <b>{b.id}</b> — save it.</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          {ok && <button onClick={() => downloadPass(b)} className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Download PDF pass</button>}
          <Link to="/my-pass" className="rounded-full border px-6 py-3 font-semibold">My passes</Link>
        </div>
      </div>
      <div className={`flex justify-center ${ok ? "" : "opacity-40 blur-[2px]"}`}><PassCard event={b.event_name} name={b.name} date={b.night} type={`${b.pass_name} × ${b.qty}`} id={b.id} /></div>
    </section>
  );
}
