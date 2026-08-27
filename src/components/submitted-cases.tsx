"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SUBMITTED_CASES_KEY, type SubmittedCitizenCase } from "@/lib/report";

export function SubmittedCases() {
  const [cases, setCases] = useState<SubmittedCitizenCase[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = window.localStorage.getItem(SUBMITTED_CASES_KEY);
        if (stored) setCases(JSON.parse(stored) as SubmittedCitizenCase[]);
      } catch {
        setCases([]);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!cases.length) return null;

  return (
    <section className="mt-6" aria-labelledby="device-cases-heading">
      <p className="eyebrow">Filed from this device</p>
      <h2 id="device-cases-heading" className="mt-1 text-2xl">Your new mock complaints</h2>
      <div className="mt-4 grid gap-3">
        {cases.map((item) => <article className="panel border-[#08745c] bg-[#eaf6f2]" key={item.acknowledgement}><div className="flex items-start gap-3"><CheckCircle2 aria-hidden="true" className="mt-1 shrink-0 text-[#08745c]" size={28} /><div><div className="flex flex-wrap items-center gap-2"><h3 className="m-0 font-mono text-lg">{item.acknowledgement}</h3><span className="status-pill text-[#075a49]">Complaint filed</span></div><p className="mb-0 mt-2 text-sm leading-6">{item.subcategory} · ₹{item.amount.toLocaleString("en-IN")} · {item.paymentMethod || "Payment method to confirm"}</p><p className="mb-0 mt-1 text-xs text-[var(--muted)]">Saved locally {new Date(item.filedAt).toLocaleString("en-IN")}. A complaint is not an FIR.</p></div></div></article>)}
      </div>
    </section>
  );
}
