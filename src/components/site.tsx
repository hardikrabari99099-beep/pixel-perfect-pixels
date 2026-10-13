import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/data";

const nav = [
  { to: "/", label: "Home" },
  { to: "/events", label: "Explore Events" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/my-pass", label: "My Pass" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold text-primary">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-forest text-sm text-saffron">આ</span>
          AapnoPass
        </Link>
        <nav className="hidden gap-7 text-sm md:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }} className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground font-semibold" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/events" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Explore Events</Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { data: s } = useQuery(settingsQuery);
  return (
    <footer className="mt-24 bg-forest text-forest-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl">AapnoPass</p>
          <p className="mt-2 text-sm opacity-70">{s?.tagline}</p>
        </div>
        <div className="text-sm opacity-80">
          <p className="font-semibold">{s?.supportLine}</p>
          <p className="mt-2">{s?.contactPhone} · {s?.contactEmail}</p>
        </div>
        <div className="text-sm opacity-70 md:text-right">{s?.footerText}</div>
      </div>
    </footer>
  );
}

export function QR({ value, size = 96 }: { value: string; size?: number }) {
  const [src, setSrc] = useState("");
  useEffect(() => { QRCode.toDataURL(value, { margin: 1, width: size * 2 }).then(setSrc); }, [value, size]);
  return src ? <img src={src} width={size} height={size} alt="Pass QR code" className="rounded-md bg-card p-1" /> : <div style={{ width: size, height: size }} className="rounded-md bg-card" />;
}

export function PassCard({ event, name, date, type, id }: { event: string; name: string; date: string; type: string; id: string }) {
  return (
    <div className="ticket-notch w-72 rounded-2xl bg-forest p-5 text-forest-foreground shadow-2xl">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em]">
        <span className="text-saffron">AapnoPass</span><span className="opacity-60">{id}</span>
      </div>
      <p className="mt-3 font-display text-xl leading-tight">{event}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div><p className="opacity-60">Name</p><p className="font-semibold">{name}</p></div>
        <div><p className="opacity-60">Date</p><p className="font-semibold">{date}</p></div>
        <div className="col-span-2"><p className="opacity-60">Pass</p><p className="font-semibold text-gold">{type}</p></div>
      </div>
      <div className="my-4 border-t border-dashed border-forest-foreground/25" />
      <div className="flex items-center justify-between">
        <p className="text-[11px] opacity-60">Scan at entry gate</p>
        <QR value={`AAPNOPASS:${id}`} size={72} />
      </div>
    </div>
  );
}
