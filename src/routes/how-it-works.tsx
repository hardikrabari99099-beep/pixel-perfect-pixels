import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — AapnoPass" },
      { name: "description", content: "Find an event, book your pass, and enter with a QR code." },
      { property: "og:title", content: "How It Works — AapnoPass" },
      { property: "og:description", content: "Find. Book. Celebrate." },
    ],
  }),
  component: () => (
    <section className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="font-display text-5xl">How it works</h1>
      <ol className="mt-10 space-y-6">
        {["Explore Navratri events across Surat and compare passes.", "Choose your pass, enter the name to print, and pay securely.", "Your personalized PDF pass with a unique QR code is generated instantly.", "Show the QR at the gate — it's scanned once and marked as used."].map((s, i) => (
          <li key={i} className="flex gap-5 rounded-2xl border bg-card p-6"><span className="font-display text-3xl text-saffron">0{i + 1}</span><p className="pt-2">{s}</p></li>
        ))}
      </ol>
    </section>
  ),
});
