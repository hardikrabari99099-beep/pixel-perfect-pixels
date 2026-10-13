import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — AapnoPass" },
      { name: "description", content: "Get help with your AapnoPass booking." },
      { property: "og:title", content: "Contact AapnoPass" },
      { property: "og:description", content: "We're here to help with your Navratri pass." },
    ],
  }),
  component: () => (
    <section className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="font-display text-5xl">Contact us</h1>
      <p className="mt-4 text-muted-foreground">Questions about a booking or listing your event? Reach out.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6"><p className="text-sm text-muted-foreground">Email</p><p className="font-semibold">hello@aapnopass.in</p></div>
        <div className="rounded-2xl border bg-card p-6"><p className="text-sm text-muted-foreground">City</p><p className="font-semibold">Surat, Gujarat</p></div>
      </div>
    </section>
  ),
});
