"use client";

import { Check, Clock3, Landmark, PhoneCall, RadioTower, Repeat2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  addWorkingDays,
  parallelActionsStorageKey,
  readParallelActionState,
  type ParallelActionId,
  type ParallelActionState,
} from "@/lib/parallel-actions";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function formatRemaining(milliseconds: number) {
  const absolute = Math.max(0, Math.abs(milliseconds));
  const days = Math.floor(absolute / DAY);
  const hours = Math.floor((absolute % DAY) / HOUR);
  const minutes = Math.floor((absolute % HOUR) / 60_000);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDeadline(value: Date) {
  return value.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function ParallelActionChecklist({ scopeId, incidentAt, bankName, fraudLine }: { scopeId: string; incidentAt: string; bankName: string; fraudLine: string }) {
  const storageKey = parallelActionsStorageKey(scopeId);
  const [state, setState] = useState<ParallelActionState>({ version: 1, completed: [], updatedAt: "" });
  const [now, setNow] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const deadline = addWorkingDays(incidentAt, 3);
  const remaining = now ? deadline.getTime() - now : 0;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setState(readParallelActionState(window.localStorage.getItem(storageKey)));
      setNow(Date.now());
      setHydrated(true);
    });
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => { window.cancelAnimationFrame(frame); window.clearInterval(timer); };
  }, [storageKey]);

  function toggle(id: ParallelActionId) {
    setState((current) => {
      const completed = current.completed.includes(id) ? current.completed.filter((item) => item !== id) : [...current.completed, id];
      const next: ParallelActionState = { version: 1, completed, updatedAt: new Date().toISOString() };
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  const actions: Array<{ id: ParallelActionId; title: string; why: string; icon: typeof PhoneCall }> = [
    { id: "call-1930", title: "Raise a 1930 ticket", why: "The helpline can place the financial trail into the rapid reporting system. This prototype does not call it for you.", icon: PhoneCall },
    { id: "notify-bank", title: `Notify ${bankName}`, why: `Use the bank’s verified fraud line. Mock number: ${fraudLine}. Ask for a complaint reference in writing.`, icon: Landmark },
    { id: "rbi-window", title: "Record the RBI zero-liability notice", why: "For an unauthorised electronic transaction, reporting to the bank within three working days preserves the zero-customer-liability claim.", icon: Clock3 },
    { id: "pause-mandates", title: "Pause UPI AutoPay mandates", why: "A fraudulent mandate can trigger another debit even after the first payment is reported.", icon: Repeat2 },
    { id: "check-sims", title: "Check SIMs on Sanchar Saathi / TAFCOP", why: "Review mobile connections issued in your name and flag any number you do not recognise.", icon: RadioTower },
  ];

  return (
    <section className="border-2 border-[var(--primary)] bg-white p-4 sm:p-5" aria-labelledby={`parallel-actions-${scopeId}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="eyebrow">Run in parallel</p><h2 id={`parallel-actions-${scopeId}`} className="m-0 mt-1 text-2xl">Protect the account while the case moves.</h2></div>
        <span className="status-pill text-[#08745c]">{hydrated ? `${state.completed.length} of ${actions.length} done` : "Loading saved actions…"}</span>
      </div>
      <div className={`mt-4 border-2 p-3 ${remaining >= 0 ? "border-[var(--primary)] bg-[var(--blue-soft)]" : "border-[var(--warning)] bg-[var(--warning-soft)]"}`} role="timer" aria-live="polite">
        <div className="flex items-start justify-between gap-3"><span><strong className="block">RBI three-working-day window</strong><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">Deadline: {formatDeadline(deadline)}</span></span><strong className="shrink-0 font-mono text-lg">{now ? (remaining >= 0 ? formatRemaining(remaining) : `+${formatRemaining(remaining)}`) : "—"}</strong></div>
        <p className="mb-0 mt-2 text-xs leading-5 text-[var(--muted)]">{remaining >= 0 ? "Time remaining from the recorded incident time." : "The displayed window has passed. Still notify the bank immediately and preserve proof of when you first reported."}</p>
      </div>
      <ul className="mt-4 grid list-none gap-2 p-0">
        {actions.map(({ id, title, why, icon: Icon }) => {
          const checked = state.completed.includes(id);
          return <li key={id}><label className={`grid min-h-20 cursor-pointer grid-cols-[1.75rem_1fr] gap-3 border-2 p-3 ${checked ? "border-[#08745c] bg-[#eaf6f2]" : "border-[var(--line)] bg-white hover:border-[var(--primary)]"}`}><input className="mt-1 size-6 accent-[#08745c]" type="checkbox" checked={checked} onChange={() => toggle(id)} /><span><span className="flex items-center gap-2 font-black"><Icon aria-hidden="true" className="shrink-0 text-[var(--primary)]" size={19} /> {title}{checked ? <Check aria-hidden="true" className="text-[#08745c]" size={18} /> : null}</span><span className="mt-1 block text-sm leading-6 text-[var(--muted)]">{why}</span></span></label></li>;
        })}
      </ul>
      <p className="mb-0 mt-3 text-xs leading-5 text-[var(--muted)]">Checkboxes are a private device-side reminder. They do not contact any service.</p>
    </section>
  );
}
