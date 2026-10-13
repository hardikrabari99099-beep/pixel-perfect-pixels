import type { Booking } from "@/lib/data";

export const statusLabel: Record<Booking["status"], string> = {
  pending: "Payment under verification",
  approved: "Confirmed",
  rejected: "Payment not verified",
  used: "Entry completed",
};

export function StatusBadge({ s }: { s: Booking["status"] }) {
  const cls = s === "approved" ? "bg-secondary text-primary" : s === "rejected" ? "bg-destructive/10 text-destructive" : s === "used" ? "bg-muted text-muted-foreground" : "bg-accent/15 text-accent-foreground";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{statusLabel[s]}</span>;
}
