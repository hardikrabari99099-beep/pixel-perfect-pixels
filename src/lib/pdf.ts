import { getEvent, inr, type Booking } from "./data";

export async function downloadPass(b: Booking) {
  const [{ jsPDF }, QR] = await Promise.all([import("jspdf"), import("qrcode")]);
  const ev = getEvent(b.eventId)!;
  const pass = ev.passes.find((p) => p.id === b.passId)!;
  const qr = await QR.toDataURL(`AAPNOPASS:${b.id}`, { margin: 1, width: 400 });
  const doc = new jsPDF({ unit: "mm", format: [100, 180] });
  doc.setFillColor(22, 56, 42); doc.rect(0, 0, 100, 180, "F");
  doc.setTextColor(232, 160, 60); doc.setFontSize(10); doc.text("AAPNOPASS", 10, 14);
  doc.setTextColor(245, 238, 220); doc.setFontSize(18); doc.text(ev.name, 10, 28, { maxWidth: 80 });
  doc.setFontSize(9); doc.text(`${ev.venue}, Surat`, 10, 42);
  const row = (l: string, v: string, y: number) => {
    doc.setTextColor(170, 190, 175); doc.setFontSize(7); doc.text(l.toUpperCase(), 10, y);
    doc.setTextColor(245, 238, 220); doc.setFontSize(11); doc.text(v, 10, y + 5);
  };
  row("Name", b.name, 54); row("Pass", `${pass.name} × ${b.qty}`, 68);
  row("Date", b.date, 82); row("Pass ID", b.id, 96); row("Paid", inr(b.total), 110);
  doc.setFillColor(255, 255, 255); doc.roundedRect(25, 122, 50, 50, 3, 3, "F");
  doc.addImage(qr, "PNG", 27, 124, 46, 46);
  doc.save(`AapnoPass-${b.id}.pdf`);
}
