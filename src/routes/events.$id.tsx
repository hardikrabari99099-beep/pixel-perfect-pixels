import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QR } from "@/components/site";
import { eventsQuery, inr, newId, rememberId, settingsQuery, upiLink } from "@/lib/data";

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
  const [utr, setUtr] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const pass = e.passes.find((p) => p.id === passId);
  if (!pass) return <p className="py-24 text-center text-muted-foreground">Passes for this event are not on sale yet.</p>;
  const total = pass.price * qty;
  const valid = f.name.trim().length > 1 && /^\d{10}$/.test(f.phone) && /\S+@\S+\.\S+/.test(f.email);
  const utrOk = /^[A-Za-z0-9]{6,30}$/.test(utr.trim());

  const submit = async () => {
    setBusy(true); setErr("");
    const bid = newId();
    const { error } = await supabase.from("bookings").insert({
      id: bid, event_id: e.id, event_name: e.name, pass_id: pass.id, pass_name: pass.name, qty,
      name: f.name.trim(), phone: f.phone, email: f.email.trim(), night: pass.season ? e.dates : night, total, utr: utr.trim(),
    });
    setBusy(false);
    if (error) return setErr("Could not submit. Please check your UTR and try again.");
    rememberId(bid);
    nav({ to: "/success/$bookingId", params: { bookingId: bid } });
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
            <h3 className="font-display text-2xl">Book your pass</h3>
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
            <button disabled={!valid} onClick={() => setStep("pay")} className="mt-4 h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground disabled:opacity-40">Continue to UPI payment</button>
          </>
        ) : (
          <>
            <h3 className="font-display text-2xl">Pay {inr(total)} via UPI</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.paymentNote}</p>
            <div className="mt-5 flex flex-col items-center rounded-2xl bg-secondary p-5">
              <QR value={upiLink(s, total, `${e.name} ${pass.name}`)} size={200} />
              <p className="mt-3 text-sm font-semibold">{s.upiName}</p>
              <p className="text-sm text-muted-foreground">{s.upiId}</p>
              <a href={upiLink(s, total, `${e.name} ${pass.name}`)} className="mt-3 text-sm font-semibold text-primary lg:hidden">Open UPI app →</a>
            </div>
            <label className="mt-5 block text-sm font-medium">UTR / Transaction ID
              <input value={utr} onChange={(ev) => setUtr(ev.target.value)} placeholder="e.g. 427812345678" className={input} />
            </label>
            {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
            <button disabled={!utrOk || busy} onClick={submit} className="mt-4 h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground disabled:opacity-40">{busy ? "Submitting…" : "I have paid — submit UTR"}</button>
            <button onClick={() => setStep("form")} className="mt-2 w-full text-sm text-muted-foreground">← Back</button>
          </>
        )}
      </aside>
    </section>
  );
}
