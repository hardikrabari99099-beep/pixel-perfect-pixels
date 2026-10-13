import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { getEvent, inr, newId, saveBooking } from "@/lib/data";

export const Route = createFileRoute("/events/$id")({
  loader: ({ params }) => {
    const e = getEvent(params.id);
    if (!e) throw notFound();
    return e;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} Passes — AapnoPass` },
          { name: "description", content: loaderData.about },
          { property: "og:title", content: `${loaderData.name} — AapnoPass` },
          { property: "og:description", content: loaderData.about },
        ]
      : [{ title: "Event unavailable — AapnoPass" }, { name: "robots", content: "noindex" }],
  }),
  component: EventPage,
});

const NIGHTS = Array.from({ length: 9 }, (_, i) => `${i + 3} Oct 2026`);

function EventPage() {
  const e = Route.useLoaderData();
  const nav = useNavigate();
  const [passId, setPassId] = useState(e.passes[0]!.id);
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState<string>(NIGHTS[0]!);
  const [f, setF] = useState({ name: "", phone: "", email: "" });
  const [paying, setPaying] = useState(false);
  const pass = e.passes.find((p) => p.id === passId)!;
  const season = passId.includes("season") || passId === "vip";
  const total = pass.price * qty;
  const valid = f.name.trim().length > 1 && /^\d{10}$/.test(f.phone) && /\S+@\S+\.\S+/.test(f.email);

  const pay = () => {
    setPaying(true);
    setTimeout(() => {
      const id = newId();
      saveBooking({ id, eventId: e.id, passId, qty, ...f, date: season ? "3 – 11 Oct 2026" : date, total, createdAt: new Date().toISOString() });
      nav({ to: "/success/$bookingId", params: { bookingId: id } });
    }, 1400);
  };

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <p className="text-sm font-semibold text-saffron">{e.area}, Surat</p>
        <h1 className="mt-2 font-display text-5xl">{e.name}</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">{e.about}</p>
        <div className="mt-6 grid max-w-xl grid-cols-2 gap-4 text-sm">
          {[["Venue", e.venue], ["Dates", e.dates], ["Time", e.time], ["Artist", e.artist]].map(([k, v]) => (
            <div key={k} className="rounded-xl border bg-card p-4"><p className="text-muted-foreground">{k}</p><p className="font-semibold">{v}</p></div>
          ))}
        </div>
        <h2 className="mt-12 font-display text-3xl">Pass options</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {e.passes.map((p) => (
            <button key={p.id} onClick={() => setPassId(p.id)} className={`rounded-2xl border p-5 text-left transition ${p.id === passId ? "border-primary bg-secondary ring-2 ring-primary" : "bg-card"}`}>
              <div className="flex justify-between"><span className="font-semibold">{p.name}</span>{p.vip && <span className="rounded-full bg-gold px-2 text-xs font-bold text-accent-foreground">VIP</span>}</div>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <p className="mt-3 text-xl font-bold text-primary">{inr(p.price)}</p>
              <p className="text-xs text-muted-foreground">{p.left} left</p>
            </button>
          ))}
        </div>
      </div>

      <aside className="h-fit rounded-3xl border bg-card p-6 shadow-sm lg:sticky lg:top-24">
        <h3 className="font-display text-2xl">Book your pass</h3>
        {!season && (
          <label className="mt-4 block text-sm">Night
            <select value={date} onChange={(ev) => setDate(ev.target.value)} className="mt-1 h-11 w-full rounded-xl border bg-background px-3">{NIGHTS.map((n) => <option key={n}>{n}</option>)}</select>
          </label>
        )}
        <div className="mt-4 flex items-center justify-between text-sm">Quantity
          <div className="flex items-center gap-3">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-8 w-8 rounded-full border">−</button>{qty}
            <button onClick={() => setQty(Math.min(10, qty + 1))} className="h-8 w-8 rounded-full border">+</button>
          </div>
        </div>
        {(["name", "phone", "email"] as const).map((k) => (
          <input key={k} value={f[k]} onChange={(ev) => setF({ ...f, [k]: ev.target.value })} placeholder={k === "name" ? "Full name (printed on pass)" : k === "phone" ? "Mobile number (10 digits)" : "Email"} className="mt-3 h-11 w-full rounded-xl border bg-background px-3 text-sm" />
        ))}
        <div className="mt-5 flex justify-between border-t pt-4"><span>Total</span><span className="text-xl font-bold">{inr(total)}</span></div>
        <button disabled={!valid || paying} onClick={pay} className="mt-4 h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground disabled:opacity-40">
          {paying ? "Processing payment…" : `Pay ${inr(total)}`}
        </button>
        <p className="mt-3 text-center text-xs text-muted-foreground">Demo payment · no real charge</p>
      </aside>
    </section>
  );
}
