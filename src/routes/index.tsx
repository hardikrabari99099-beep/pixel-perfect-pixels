import { createFileRoute, Link } from "@tanstack/react-router";
import hero from "@/assets/hero-garba.jpg";
import { PassCard } from "@/components/site";
import { EVENTS } from "@/lib/data";
import { EventCard } from "./events";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AapnoPass — Surat Ni Navratri, Aapno Pass" },
      { name: "description", content: "Discover Surat's best Navratri events, book online and get your personalized digital pass instantly." },
      { property: "og:title", content: "AapnoPass — Surat Ni Navratri, Aapno Pass" },
      { property: "og:description", content: "Find. Book. Celebrate. Navratri passes across Surat." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <section className="relative overflow-hidden bg-forest text-forest-foreground">
        <img src={hero} alt="Garba night in Surat" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/80 to-transparent" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 md:grid-cols-[1.3fr_1fr] md:py-32">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-saffron">Navratri 2026 · Surat</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] md:text-7xl">Surat Ni Navratri,<br /><span className="text-saffron">Aapno Pass.</span></h1>
            <p className="mt-6 max-w-md text-lg opacity-80">Discover Surat's best Navratri events, book your pass online, and get your personalized digital pass instantly.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/events" className="rounded-full bg-saffron px-6 py-3 font-semibold text-accent-foreground hover:opacity-90">Explore Navratri</Link>
              <Link to="/how-it-works" className="rounded-full border border-forest-foreground/30 px-6 py-3 font-semibold hover:bg-forest-foreground/10">How It Works</Link>
            </div>
          </div>
          <div className="hidden justify-center md:flex">
            <div className="rotate-3"><PassCard event="Rangilo Raas Utsav" name="Riya Patel" date="5 Oct 2026" type="VIP Season" id="AP7K2Q91" /></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex items-end justify-between">
          <div><p className="text-sm font-semibold text-saffron">This season</p><h2 className="font-display text-4xl">Featured events</h2></div>
          <Link to="/events" className="text-sm font-semibold text-primary">View all →</Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {EVENTS.map((e) => <EventCard key={e.id} e={e} />)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <div className="pattern-bandhani grid gap-8 rounded-3xl bg-forest p-10 text-forest-foreground md:grid-cols-3">
          {[["01", "Find", "Browse garba nights across Vesu, Adajan, Piplod and more."], ["02", "Book", "Pick your pass and pay securely in seconds."], ["03", "Celebrate", "Get your PDF pass with QR instantly. Show it at the gate."]].map(([n, t, d]) => (
            <div key={n}><p className="text-saffron">{n}</p><p className="mt-2 font-display text-3xl">{t}.</p><p className="mt-2 text-sm opacity-75">{d}</p></div>
          ))}
        </div>
      </section>
    </>
  );
}
