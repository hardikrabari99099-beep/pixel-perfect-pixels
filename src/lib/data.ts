import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PassType = { id: string; name: string; price: number; desc: string; left: number; season?: boolean; vip?: boolean };
export type EventItem = {
  id: string; name: string; venue: string; area: string; dates: string; time: string;
  artist: string; tag: string; about: string; nights: string[]; passes: PassType[]; active: boolean; sort: number;
};
export type Settings = {
  heroEyebrow: string; heroTitle: string; heroTitleAccent: string; heroText: string; featuredTitle: string;
  tagline: string; supportLine: string; steps: string[];
  contactPhone: string; contactEmail: string; contactAddress: string; whatsapp: string; contactText: string;
  upiId: string; upiName: string; paymentNote: string; footerText: string;
};
export type Booking = {
  id: string; event_id: string; event_name: string; pass_id: string; pass_name: string; qty: number;
  name: string; phone: string; email: string; night: string; total: number; utr: string;
  status: "pending" | "approved" | "rejected" | "used"; created_at: string;
};

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("site_settings").select("data").eq("id", 1).single();
    if (error) throw error;
    return data.data as unknown as Settings;
  },
});

export const eventsQuery = queryOptions({
  queryKey: ["events"],
  queryFn: async () => {
    const { data, error } = await supabase.from("events").select("*").order("sort");
    if (error) throw error;
    return data as unknown as EventItem[];
  },
});

export const minPrice = (e: EventItem) => Math.min(...e.passes.map((p) => p.price), Infinity);
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export const newId = () => "AP" + Date.now().toString(36).toUpperCase().slice(-6) + Math.floor(Math.random() * 900 + 100);
export const upiLink = (s: Settings, amount: number, note: string) =>
  `upi://pay?pa=${encodeURIComponent(s.upiId)}&pn=${encodeURIComponent(s.upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

const KEY = "aapnopass.myids";
export const myIds = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
export const rememberId = (id: string) => localStorage.setItem(KEY, JSON.stringify([id, ...myIds()]));
export async function fetchBookings(ids: string[]) {
  if (!ids.length) return [] as Booking[];
  const { data, error } = await supabase.rpc("get_bookings", { _ids: ids });
  if (error) throw error;
  return (data ?? []) as Booking[];
}
