export type PassType = { id: string; name: string; price: number; desc: string; left: number; vip?: boolean };
export type EventItem = {
  id: string; name: string; venue: string; area: string; dates: string; time: string;
  artist: string; tag: string; from: number; about: string; passes: PassType[];
};

const std = (base: number): PassType[] => [
  { id: "single", name: "Single Day", price: base, desc: "Entry for any one night", left: 240 },
  { id: "couple", name: "Couple Pass", price: Math.round(base * 1.8), desc: "Entry for two, one night", left: 120 },
  { id: "season", name: "Season Pass", price: base * 7, desc: "All 9 nights, one person", left: 60 },
  { id: "vip", name: "VIP Season", price: base * 14, desc: "All nights, lounge & front circle", left: 15, vip: true },
];

export const EVENTS: EventItem[] = [
  { id: "rangilo-raas", name: "Rangilo Raas Utsav", venue: "Sarsana Dome Grounds", area: "Sarsana", dates: "3 – 11 Oct", time: "8:00 PM onwards", artist: "Kinjal Dave", tag: "Most booked", from: 599, about: "Surat's biggest open-air garba with live orchestra and a 40,000 sq ft arena.", passes: std(599) },
  { id: "vesu-garba", name: "Vesu Garba Mahotsav", venue: "VR Mall Grounds", area: "Vesu", dates: "3 – 11 Oct", time: "8:30 PM onwards", artist: "Aishwarya Majmudar", tag: "Premium", from: 799, about: "A premium family-friendly Navratri with curated food court and VIP lounge.", passes: std(799) },
  { id: "adajan-dandiya", name: "Adajan Dandiya Night", venue: "Riverfront Plot", area: "Adajan", dates: "3 – 11 Oct", time: "8:00 PM onwards", artist: "Geeta Rabari", tag: "Riverside", from: 449, about: "Traditional dandiya by the Tapi river, folk-first and community driven.", passes: std(449) },
  { id: "piplod-nights", name: "Piplod Navratri Nights", venue: "SVNIT Ground", area: "Piplod", dates: "3 – 11 Oct", time: "9:00 PM onwards", artist: "Osman Mir", tag: "New", from: 399, about: "Youth-favourite garba with modern beats and traditional rounds.", passes: std(399) },
];

export const getEvent = (id: string) => EVENTS.find((e) => e.id === id);
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export type Booking = {
  id: string; eventId: string; passId: string; qty: number; name: string; phone: string;
  email: string; date: string; total: number; createdAt: string;
};
const KEY = "aapnopass.bookings";
export const loadBookings = (): Booking[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
export const saveBooking = (b: Booking) => localStorage.setItem(KEY, JSON.stringify([b, ...loadBookings()]));
export const newId = () => "AP" + Date.now().toString(36).toUpperCase().slice(-6) + Math.floor(Math.random() * 90 + 10);
