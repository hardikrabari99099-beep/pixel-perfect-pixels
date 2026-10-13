import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/data";

export const Route = createFileRoute("/how-it-works")({
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  head: () => ({
    meta: [
      { title: "How It Works — AapnoPass" },
      { name: "description", content: "Find an event, pay via UPI, and enter with a QR pass." },
      { property: "og:title", content: "How It Works — AapnoPass" },
      { property: "og:description", content: "Find. Book. Celebrate." },
    ],
  }),
  component: How,
});

function How() {
  const { data: s } = useSuspenseQuery(settingsQuery);
  return (
    <section className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="font-display text-5xl">How it works</h1>
      <ol className="mt-10 space-y-6">
        {s.steps.map((st, i) => {
          const [t, d] = st.split("|");
          return <li key={i} className="flex gap-5 rounded-2xl border bg-card p-6"><span className="font-display text-3xl text-saffron">0{i + 1}</span><div className="pt-1"><p className="font-semibold">{t}</p><p className="text-muted-foreground">{d}</p></div></li>;
        })}
      </ol>
    </section>
  );
}
