import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QR } from "@/components/site";
import { eventsQuery, inr, newId, rememberId, settingsQuery, UPI_APPS, upiLink } from "@/lib/data";

export const Route = createFileRoute("/events/$id")({
  loader: async ({ context, params }) => {
    const [events] = await Promise.all([context.queryClient.ensureQueryData(eventsQuery), context.queryClient.ensureQueryData(settingsQuery)]);
    const e = events.find((x) => x.id === params.id);
    if (!e) throw notFound();
    return { name: e.name, about: e.about };
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

function EventPage() {
  const { id } = Route.useParams();
  const { data: events } = useSuspenseQuery(eventsQuery);
  const { data: s } = useSuspenseQuery(settingsQuery);
  const e = events.find((x) => x.id === id)!;
  const nav = useNavigate();
  const [passId, setPassId] = useState(e.passes[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [night, setNight] = useState<string>(e.nights[0] ?? e.dates);
  const [f, setF] = useState({ name: "", phone: "", email: "" });
  const [step, setStep] = useState<"form" | "pay">("form");
  const [sheet, setSheet] = useState(false);
  const [bid, setBid] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const pass = e.passes.find((p) => p.id === passId);
  if (!pass) return <p className="py-24 text-center text-muted-foreground">Passes for this event are not on sale yet.</p>;
  const total = pass.price * qty;
  const valid = f.name.trim().length > 1 && /^\d{10}$/.test(f.phone) && /\S+@\S+\.\S+/.test(f.email);
  const note = `${e.name} ${pass.name}`.slice(0, 40);

  const startPay = async () => {
    setErr("");
    if (bid) return setSheet(true);
    setBusy(true);
    const id = newId();
    const { error } = await supabase.from("bookings").insert({
      id, event_id: e.id, event_name: e.name, pass_id: pass.id, pass_name: pass.name, qty,
      name: f.name.trim(), phone: f.phone, email: f.email.trim(), night: pass.season ? e.dates : night, total,
    });
    setBusy(false);
    if (error) return setErr("Something went wrong. Please try again.");
    rememberId(id); setBid(id); setSheet(true);
  };
  const openApp = (base: string) => {
    if (!bid) return;
    window.location.href = upiLink(s, total, note, bid, base);
    setTimeout(() => nav({ to: "/success/$bookingId", params: { bookingId: bid } }), 1500);
  };

  const input = "mt-3 h-11 w-full rounded-xl border bg-background px-3 text-sm";
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
            <button key={p.id} disabled={step === "pay"} onClick={() => setPassId(p.id)} className={`rounded-2xl border p-5 text-left transition ${p.id === passId ? "border-primary bg-secondary ring-2 ring-primary" : "bg-card"}`}>
              <div className="flex justify-between"><span className="font-semibold">{p.name}</span>{p.vip && <span className="rounded-full bg-gold px-2 text-xs font-bold text-accent-foreground">VIP</span>}</div>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <p className="mt-3 text-xl font-bold text-primary">{inr(p.price)}</p>
              <p className="text-xs text-muted-foreground">{p.left} left</p>
            </button>
          ))}
        </div>
      </div>

      <aside className="h-fit rounded-3xl border bg-card p-6 shadow-sm lg:sticky lg:top-24">
        {step === "form" ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Step 01 · Your details</p>
            <h3 className="mt-1 font-display text-2xl">Book your pass</h3>
            {!pass.season && e.nights.length > 0 && (
              <label className="mt-4 block text-sm">Night
                <select value={night} onChange={(ev) => setNight(ev.target.value)} className="mt-1 h-11 w-full rounded-xl border bg-background px-3">{e.nights.map((n) => <option key={n}>{n}</option>)}</select>
              </label>
            )}
            <div className="mt-4 flex items-center justify-between text-sm">Quantity
              <div className="flex items-center gap-3">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-8 w-8 rounded-full border">−</button>{qty}
                <button onClick={() => setQty(Math.min(10, qty + 1))} className="h-8 w-8 rounded-full border">+</button>
              </div>
            </div>
            <input value={f.name} onChange={(ev) => setF({ ...f, name: ev.target.value })} placeholder="Full name (printed on pass)" className={input} />
            <input value={f.phone} onChange={(ev) => setF({ ...f, phone: ev.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="Mobile number (10 digits)" className={input} />
            <input value={f.email} onChange={(ev) => setF({ ...f, email: ev.target.value })} placeholder="Email" className={input} />
            <div className="mt-5 flex justify-between border-t pt-4"><span>Total</span><span className="text-xl font-bold">{inr(total)}</span></div>
            <button disabled={!valid} onClick={() => setStep("pay")} className="mt-4 h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground disabled:opacity-40">Continue to payment →</button>
          </>
        ) : (
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Step 02 · Payment</p>
            <div className="mt-4 space-y-1 rounded-2xl bg-secondary p-4 text-left text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Event</span><span className="font-medium">{e.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pass</span><span className="font-medium">{pass.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span className="font-medium">{qty} × {inr(pass.price)}</span></div>
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">Total</p>
            <p className="font-display text-5xl">{inr(total)}</p>
            <p className="mt-2 text-sm text-muted-foreground">Pay securely using your UPI app.</p>
            {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
            <button disabled={busy} onClick={startPay} className="mt-6 h-14 w-full rounded-full bg-primary text-base font-semibold text-primary-foreground disabled:opacity-40">{busy ? "Please wait…" : "Pay with your UPI app →"}</button>
            <p className="mt-2 text-xs text-muted-foreground">Choose your preferred UPI app to continue.</p>
            <button onClick={() => setStep("form")} className="mt-4 text-sm text-muted-foreground">← Edit details</button>
          </div>
        )}
      </aside>

      {sheet && bid && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest/60 sm:items-center" onClick={() => setSheet(false)}>
          <div className="w-full max-w-sm rounded-t-3xl bg-card p-6 sm:rounded-3xl" onClick={(ev) => ev.stopPropagation()}>
            <div className="flex items-center justify-between"><p className="font-semibold">Pay using</p><p className="font-bold">{inr(total)}</p></div>
            <div className="mt-4 divide-y rounded-2xl border">
              {UPI_APPS.map((a) => (
                <button key={a.name} onClick={() => openApp(a.base)} className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium hover:bg-secondary">
                  <span className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-xs font-bold text-primary">{a.name[0]}</span>{a.name}</span><span>›</span>
                </button>
              ))}
            </div>
            <details className="mt-4 text-center text-xs text-muted-foreground">
              <summary className="cursor-pointer">On a computer? Scan with your phone</summary>
              <div className="mt-3 flex justify-center"><QR value={upiLink(s, total, note, bid)} size={160} /></div>
              <Link to="/success/$bookingId" params={{ bookingId: bid }} className="mt-3 inline-block font-semibold text-primary">I've paid →</Link>
            </details>
          </div>
        </div>
      )}
    </section>
  );
}
