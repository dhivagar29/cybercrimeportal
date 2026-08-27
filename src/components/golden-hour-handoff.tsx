"use client";

import { CheckCircle2, Clock3, Landmark, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getWhenLabel,
  GOLDEN_HOUR_REPORT_KEY,
  type GoldenHourTicket,
} from "@/lib/golden-hour";

export function GoldenHourHandoff() {
  const [ticket, setTicket] = useState<GoldenHourTicket | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = window.localStorage.getItem(GOLDEN_HOUR_REPORT_KEY);
        if (stored) setTicket(JSON.parse(stored) as GoldenHourTicket);
      } catch {
        setTicket(null);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!ticket) return null;

  return (
    <section className="mt-6 border-2 border-[#08745c] bg-[#eaf6f2] p-4" aria-labelledby="captured-details-heading">
      <div className="flex items-start gap-3">
        <CheckCircle2 aria-hidden="true" className="mt-1 shrink-0 text-[#08745c]" size={30} />
        <div>
          <p className="eyebrow text-[#075a49]">Hold request {ticket.reference}</p>
          <h2 id="captured-details-heading" className="m-0 mt-1 text-xl">These details are already captured.</h2>
          <p className="mb-0 mt-1 text-sm text-[var(--muted)]">We will not ask for them again while you build the case.</p>
        </div>
      </div>
      <dl className="mt-4 grid gap-px bg-[#8cb8aa] sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-3"><dt className="flex items-center gap-2 text-xs font-black uppercase text-[var(--muted)]"><WalletCards aria-hidden="true" size={15} /> Amount</dt><dd className="m-0 mt-1 font-black">₹{ticket.amount.toLocaleString("en-IN")}</dd></div>
        <div className="bg-white p-3"><dt className="flex items-center gap-2 text-xs font-black uppercase text-[var(--muted)]"><Clock3 aria-hidden="true" size={15} /> When</dt><dd className="m-0 mt-1 font-black">{getWhenLabel(ticket.whenChoice)}</dd></div>
        <div className="bg-white p-3"><dt className="text-xs font-black uppercase text-[var(--muted)]">Payment</dt><dd className="m-0 mt-1 font-black">{ticket.paymentMethod}</dd></div>
        <div className="bg-white p-3"><dt className="flex items-center gap-2 text-xs font-black uppercase text-[var(--muted)]"><Landmark aria-hidden="true" size={15} /> Bank or app</dt><dd className="m-0 mt-1 font-black">{ticket.bankName}</dd></div>
      </dl>
    </section>
  );
}
