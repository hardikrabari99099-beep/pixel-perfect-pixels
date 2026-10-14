import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/booking-view";
import { eventsQuery, inr, settingsQuery, type Booking, type EventItem, type PassType, type Settings } from "@/lib/data";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — AapnoPass" },
      { name: "description", content: "AapnoPass admin panel." },
      { property: "og:title", content: "Admin — AapnoPass" },
      { property: "og:description", content: "AapnoPass admin panel." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const inp = "h-10 w-full rounded-lg border bg-background px-3 text-sm";
const btn = "rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40";

function Admin() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) return setIsAdmin(null);
    supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (session === undefined) return null;
  if (!session) return <Login />;
  if (isAdmin === null) return <p className="py-24 text-center">Checking access…</p>;
  if (!isAdmin) return (
    <div className="py-24 text-center"><p>This account is not an admin.</p><button className={btn + " mt-4"} onClick={() => supabase.auth.signOut()}>Sign out</button></div>
  );
  return <Panel email={session.user.email ?? ""} />;
}

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const go = async () => {
    setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) setMsg(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      if (error) setMsg(error.message);
      else if (!data.session) setMsg("Check your email to confirm the account, then sign in.");
    }
  };
  return (
    <section className="mx-auto max-w-sm px-5 py-20">
      <h1 className="font-display text-4xl">Admin {mode === "in" ? "sign in" : "setup"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">The first account created becomes the admin.</p>
      <input className={inp + " mt-6"} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className={inp + " mt-3"} type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
      {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
      <button className={btn + " mt-5 w-full"} onClick={go}>{mode === "in" ? "Sign in" : "Create admin account"}</button>
      <button className="mt-3 w-full text-sm text-muted-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "First time? Create admin account" : "Have an account? Sign in"}</button>
    </section>
  );
}

const TABS = ["Bookings", "Events", "Website text", "Contact", "UPI payment"] as const;

function Panel({ email }: { email: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Bookings");
  const qc = useQueryClient();
  const signOut = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); };
  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Admin panel</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">{email}<button onClick={signOut} className="rounded-full border px-4 py-1.5">Sign out</button></div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm font-medium ${t === tab ? "bg-primary text-primary-foreground" : "border bg-card"}`}>{t}</button>)}
      </div>
      <div className="mt-8">
        {tab === "Bookings" && <Bookings />}
        {tab === "Events" && <Events />}
        {tab === "Website text" && <SettingsForm fields={TEXT_FIELDS} />}
        {tab === "Contact" && <SettingsForm fields={CONTACT_FIELDS} />}
        {tab === "UPI payment" && <SettingsForm fields={UPI_FIELDS} />}
      </div>
    </section>
  );
}

function Bookings() {
  const [filter, setFilter] = useState<"all" | Booking["status"]>("pending");
  const [q, setQ] = useState("");
  const { data = [], refetch } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => { const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false }); if (error) throw error; return data as Booking[]; },
  });
  const set = async (id: string, status: Booking["status"]) => { await supabase.from("bookings").update({ status }).eq("id", id); refetch(); };
  const list = data.filter((b) => (filter === "all" || b.status === filter) && (b.id + b.utr + b.name + b.phone).toLowerCase().includes(q.toLowerCase()));
  const revenue = data.filter((b) => b.status === "approved" || b.status === "used").reduce((a, b) => a + b.total, 0);
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[["Pending", data.filter((b) => b.status === "pending").length], ["Confirmed", data.filter((b) => b.status === "approved").length], ["Entered", data.filter((b) => b.status === "used").length], ["Revenue", inr(revenue)]].map(([k, v]) => (
          <div key={k} className="rounded-2xl border bg-card p-4"><p className="text-sm text-muted-foreground">{k}</p><p className="text-2xl font-bold">{v}</p></div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <input className={inp + " max-w-xs"} placeholder="Search UTR, booking ID, name, phone" value={q} onChange={(e) => setQ(e.target.value)} />
        {(["pending", "approved", "used", "rejected", "all"] as const).map((f) => <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 text-sm capitalize ${f === filter ? "bg-secondary font-semibold" : "border"}`}>{f}</button>)}
      </div>
      <div className="mt-4 space-y-2">
        {list.map((b) => (
          <div key={b.id} className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[1.5fr_1fr_auto] md:items-center">
            <div><p className="font-semibold">{b.name} · {b.phone}</p><p className="text-sm text-muted-foreground">{b.event_name} · {b.pass_name} × {b.qty} · {b.night}</p><p className="text-xs text-muted-foreground">{b.id} · {b.email} · {new Date(b.created_at).toLocaleString("en-IN")}</p></div>
            <div><p className="text-sm">UTR <b className="font-mono">{b.utr}</b></p><p className="text-sm">{inr(b.total)}</p><div className="mt-1"><StatusBadge s={b.status} /></div></div>
            <div className="flex flex-wrap gap-2">
              {b.status !== "approved" && <button className={btn} onClick={() => set(b.id, "approved")}>Approve</button>}
              {b.status === "approved" && <button className="rounded-full border px-4 py-2 text-sm" onClick={() => set(b.id, "used")}>Mark entered</button>}
              {b.status !== "rejected" && <button className="rounded-full border px-4 py-2 text-sm text-destructive" onClick={() => set(b.id, "rejected")}>Reject</button>}
            </div>
          </div>
        ))}
        {!list.length && <p className="text-muted-foreground">No bookings here.</p>}
      </div>
    </div>
  );
}

const blankEvent = (): EventItem => ({ id: "", name: "", venue: "", area: "", dates: "", time: "", artist: "", tag: "", about: "", nights: [], passes: [], active: true, sort: 99 });

function Events() {
  const qc = useQueryClient();
  const { data = [] } = useQuery(eventsQuery);
  const [edit, setEdit] = useState<EventItem | null>(null);
  if (edit) return <EventEditor ev={edit} onDone={() => { setEdit(null); qc.invalidateQueries({ queryKey: ["events"] }); }} />;
  return (
    <div>
      <button className={btn} onClick={() => setEdit(blankEvent())}>+ Add event</button>
      <div className="mt-4 space-y-2">
        {data.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-2xl border bg-card p-4">
            <div><p className="font-semibold">{e.name} {!e.active && <span className="text-xs text-muted-foreground">(hidden)</span>}</p><p className="text-sm text-muted-foreground">{e.venue} · {e.dates} · {e.passes.length} pass types</p></div>
            <button className="rounded-full border px-4 py-2 text-sm" onClick={() => setEdit(e)}>Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventEditor({ ev, onDone }: { ev: EventItem; onDone: () => void }) {
  const isNew = !ev.id;
  const [e, setE] = useState<EventItem>(ev);
  const [nights, setNights] = useState(ev.nights.join("\n"));
  const [msg, setMsg] = useState("");
  const f = (k: keyof EventItem, label: string, area = false) => (
    <label className="block text-sm">{label}
      {area ? <textarea className={inp + " mt-1 h-24 py-2"} value={String(e[k])} onChange={(x) => setE({ ...e, [k]: x.target.value })} />
        : <input className={inp + " mt-1"} value={String(e[k])} onChange={(x) => setE({ ...e, [k]: x.target.value })} />}
    </label>
  );
  const setPass = (i: number, p: Partial<PassType>) => setE({ ...e, passes: e.passes.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const save = async () => {
    const id = e.id || e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!id || !e.name) return setMsg("Name is required.");
    const row = { ...e, id, nights: nights.split("\n").map((s) => s.trim()).filter(Boolean), passes: e.passes as unknown as never };
    const { error } = await supabase.from("events").upsert(row);
    if (error) return setMsg(error.message);
    onDone();
  };
  const del = async () => { if (confirm("Delete this event?")) { await supabase.from("events").delete().eq("id", e.id); onDone(); } };
  return (
    <div className="rounded-3xl border bg-card p-6">
      <h2 className="font-display text-2xl">{isNew ? "New event" : `Edit ${ev.name}`}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {f("name", "Event name")}{f("venue", "Venue")}{f("area", "Area")}{f("dates", "Dates text")}{f("time", "Time")}{f("artist", "Artist")}{f("tag", "Badge")}
        <label className="block text-sm">Order<input type="number" className={inp + " mt-1"} value={e.sort} onChange={(x) => setE({ ...e, sort: +x.target.value })} /></label>
        <div className="md:col-span-2">{f("about", "Description", true)}</div>
        <label className="block text-sm">Nights (one per line)<textarea className={inp + " mt-1 h-32 py-2"} value={nights} onChange={(x) => setNights(x.target.value)} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={e.active} onChange={(x) => setE({ ...e, active: x.target.checked })} /> Visible on website</label>
      </div>
      <h3 className="mt-8 font-semibold">Pass types</h3>
      <div className="mt-3 space-y-3">
        {e.passes.map((p, i) => (
          <div key={i} className="grid gap-2 rounded-xl border p-3 md:grid-cols-[1.2fr_0.7fr_0.6fr_1.5fr_auto] md:items-center">
            <input className={inp} placeholder="Name" value={p.name} onChange={(x) => setPass(i, { name: x.target.value })} />
            <input className={inp} type="number" placeholder="Price ₹" value={p.price} onChange={(x) => setPass(i, { price: +x.target.value })} />
            <input className={inp} type="number" placeholder="Stock" value={p.left} onChange={(x) => setPass(i, { left: +x.target.value })} />
            <input className={inp} placeholder="Description" value={p.desc} onChange={(x) => setPass(i, { desc: x.target.value })} />
            <div className="flex items-center gap-3 text-xs">
              <label><input type="checkbox" checked={!!p.season} onChange={(x) => setPass(i, { season: x.target.checked })} /> All nights</label>
              <label><input type="checkbox" checked={!!p.vip} onChange={(x) => setPass(i, { vip: x.target.checked })} /> VIP</label>
              <button className="text-destructive" onClick={() => setE({ ...e, passes: e.passes.filter((_, j) => j !== i) })}>Remove</button>
            </div>
          </div>
        ))}
        <button className="rounded-full border px-4 py-2 text-sm" onClick={() => setE({ ...e, passes: [...e.passes, { id: "p" + Date.now().toString(36), name: "", price: 0, desc: "", left: 100 }] })}>+ Add pass type</button>
      </div>
      {msg && <p className="mt-4 text-sm text-destructive">{msg}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button className={btn} onClick={save}>Save event</button>
        <button className="rounded-full border px-5 py-2 text-sm" onClick={onDone}>Cancel</button>
        {!isNew && <button className="ml-auto text-sm text-destructive" onClick={del}>Delete event</button>}
      </div>
    </div>
  );
}

type Field = { k: keyof Settings; label: string; area?: boolean };
const TEXT_FIELDS: Field[] = [
  { k: "heroEyebrow", label: "Top small line" }, { k: "heroTitle", label: "Main heading (line 1)" }, { k: "heroTitleAccent", label: "Main heading (line 2, coloured)" },
  { k: "heroText", label: "Intro paragraph", area: true }, { k: "featuredTitle", label: "Events section heading" },
  { k: "steps", label: "How it works steps (one per line, format: Title|Description)", area: true },
  { k: "tagline", label: "Footer tagline" }, { k: "supportLine", label: "Footer support line" }, { k: "footerText", label: "Footer copyright text" },
];
const CONTACT_FIELDS: Field[] = [
  { k: "contactPhone", label: "Contact phone number" }, { k: "whatsapp", label: "WhatsApp number (with country code, digits only, e.g. 919876543210)" },
  { k: "contactEmail", label: "Contact email" }, { k: "contactAddress", label: "Address" }, { k: "contactText", label: "Contact page text", area: true },
];
const UPI_FIELDS: Field[] = [
  { k: "upiId", label: "UPI ID (QR code is created from this automatically)" }, { k: "upiName", label: "Payee name shown in UPI app" },
  { k: "paymentNote", label: "Payment instructions for customers", area: true },
];

function SettingsForm({ fields }: { fields: Field[] }) {
  const qc = useQueryClient();
  const { data } = useQuery(settingsQuery);
  const [s, setS] = useState<Settings | null>(null);
  const [saved, setSaved] = useState("");
  useEffect(() => { if (data) setS(data); }, [data]);
  if (!s) return null;
  const save = async () => {
    const { error } = await supabase.from("site_settings").update({ data: s as unknown as never, updated_at: new Date().toISOString() }).eq("id", 1);
    setSaved(error ? error.message : "Saved ✓ — live on the website now.");
    qc.invalidateQueries({ queryKey: ["settings"] });
  };
  return (
    <div className="max-w-2xl space-y-4 rounded-3xl border bg-card p-6">
      {fields.map(({ k, label, area }) => {
        const v = k === "steps" ? s.steps.join("\n") : String(s[k] ?? "");
        const on = (val: string) => setS({ ...s, [k]: k === "steps" ? val.split("\n") : val });
        return (
          <label key={k} className="block text-sm font-medium">{label}
            {area ? <textarea className={inp + " mt-1 h-28 py-2"} value={v} onChange={(e) => on(e.target.value)} /> : <input className={inp + " mt-1"} value={v} onChange={(e) => on(e.target.value)} />}
          </label>
        );
      })}
      <div className="flex items-center gap-3"><button className={btn} onClick={save}>Save changes</button><span className="text-sm text-muted-foreground">{saved}</span></div>
    </div>
  );
}
