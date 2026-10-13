import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/data";

export const Route = createFileRoute("/contact")({
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  head: () => ({
    meta: [
      { title: "Contact — AapnoPass" },
      { name: "description", content: "Get help with your AapnoPass booking." },
      { property: "og:title", content: "Contact AapnoPass" },
      { property: "og:description", content: "We're here to help with your Navratri pass." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { data: s } = useSuspenseQuery(settingsQuery);
  const items = [
    ["Phone", s.contactPhone, `tel:${s.contactPhone.replace(/\s/g, "")}`],
    ["WhatsApp", s.whatsapp ? "Chat with us" : "", `https://wa.me/${s.whatsapp}`],
    ["Email", s.contactEmail, `mailto:${s.contactEmail}`],
    ["Address", s.contactAddress, ""],
  ].filter(([, v]) => v);
  return (
    <section className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="font-display text-5xl">Contact us</h1>
      <p className="mt-4 text-muted-foreground">{s.contactText}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.map(([k, v, href]) => (
          <a key={k} href={href || undefined} className="rounded-2xl border bg-card p-6"><p className="text-sm text-muted-foreground">{k}</p><p className="font-semibold">{v}</p></a>
        ))}
      </div>
    </section>
  );
}
