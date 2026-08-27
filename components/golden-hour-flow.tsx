"use client";

import { BanknoteArrowDown, CalendarClock, Check, CheckCircle2, Clock3, Landmark, PhoneCall, ShieldCheck, Smartphone, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { banks } from "@/lib/fixtures";
import type { Rail } from "@/types/domain";
import { RESPONSE_START_KEY } from "@/components/start-hold-link";

const HOLD_KEY = "cybercrimeportal:hold-request:v1";
const rails: Rail[] = ["UPI", "IMPS", "NEFT", "RTGS", "Card", "Wallet"];

type HoldRequest = {
  ticket: string;
  amount: number;
  occurredAt: string;
  rail: Rail;
  bankId: string;
  firedAt: string;
  responseSeconds: number;
};

function localDateTime(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${hours ? `${hours}:` : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function addWorkingDays(from: Date, count: number) {
  const result = new Date(from);
  let remaining = count;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return result;
}

export function GoldenHourFlow() {
  const [amount, setAmount] = useState("68000");
  const [occurredAt, setOccurredAt] = useState("");
  const [rail, setRail] = useState<Rail>("UPI");
  const [bankId, setBankId] = useState("bank-hdfc");
  const [now, setNow] = useState(0);
  const [hold, setHold] = useState<HoldRequest | null>(null);
  const [responseStart, setResponseStart] = useState(0);
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const mountedAt = Date.now();
      setNow(mountedAt);
      setOccurredAt(localDateTime(new Date(mountedAt - 34 * 60_000)));
      const stored = window.localStorage.getItem(HOLD_KEY);
      if (stored) setHold(JSON.parse(stored) as HoldRequest);
      setResponseStart(Number(window.sessionStorage.getItem(RESPONSE_START_KEY) || mountedAt));
    });
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(timer);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const elapsedTarget = hold?.occurredAt ?? occurredAt;
  const elapsedSeconds = now && elapsedTarget ? Math.floor((now - new Date(elapsedTarget).getTime()) / 1000) : 0;
  const responseSeconds = hold?.responseSeconds ?? (now && responseStart ? Math.max(0, Math.floor((now - responseStart) / 1000)) : 0);
  const selectedBank = banks.find((bank) => bank.id === (hold?.bankId ?? bankId));
  const zeroLiabilityDeadline = addWorkingDays(new Date(hold?.firedAt ?? now), 3);

  function fireHold(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request: HoldRequest = {
      ticket: `GH-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      amount: Number(amount),
      occurredAt: new Date(occurredAt).toISOString(),
      rail,
      bankId,
      firedAt: new Date().toISOString(),
      responseSeconds,
    };
    window.localStorage.setItem(HOLD_KEY, JSON.stringify(request));
    setHold(request);
  }

  function resetDemo() {
    window.localStorage.removeItem(HOLD_KEY);
    window.sessionStorage.setItem(RESPONSE_START_KEY, String(Date.now()));
    setHold(null);
    setCompletedActions([]);
  }

  const manualActions = [
    { id: "card", title: "Block card and netbanking", detail: "Use your bank’s official app or number.", icon: ShieldCheck },
    { id: "mandates", title: "Revoke UPI mandates", detail: "Review AutoPay and pending collect requests.", icon: Smartphone },
    { id: "sims", title: "Check SIMs in your name", detail: "Use the official Sanchar Saathi service.", icon: PhoneCall },
  ];

  if (hold) {
    return (
      <div className="grid gap-5">
        <section className="border-2 border-[#08745c] bg-[#eaf6f2] p-4" role="status" aria-live="polite">
          <div className="flex items-center gap-3"><CheckCircle2 aria-hidden="true" className="text-[#08745c]" size={36} /><div><p className="m-0 text-xs font-black uppercase tracking-[0.12em] text-[#08745c]">Simulated hold request fired</p><h1 className="m-0 mt-1 text-2xl">The money trail is moving.</h1></div></div>
          <dl className="mt-5 grid grid-cols-2 gap-px bg-[#8cb8aa] md:grid-cols-4">
            <div className="bg-white p-3"><dt className="text-xs font-black uppercase text-[#52606d]">Ticket</dt><dd className="m-0 mt-1 font-mono font-black">{hold.ticket}</dd></div>
            <div className="bg-white p-3"><dt className="text-xs font-black uppercase text-[#52606d]">Amount</dt><dd className="m-0 mt-1 font-black">₹{hold.amount.toLocaleString("en-IN")}</dd></div>
            <div className="bg-white p-3"><dt className="text-xs font-black uppercase text-[#52606d]">Fraud elapsed</dt><dd className="m-0 mt-1 font-mono font-black">{formatDuration(elapsedSeconds)}</dd></div>
            <div className="bg-white p-3"><dt className="text-xs font-black uppercase text-[#52606d]">Response time</dt><dd className="m-0 mt-1 font-mono font-black">{formatDuration(hold.responseSeconds)}</dd></div>
          </dl>
          <p className="mb-0 text-sm leading-5"><strong>Prototype only:</strong> no bank or government system was contacted.</p>
        </section>

        <section aria-labelledby="parallel-actions" className="panel">
          <p className="eyebrow">Parallel action checklist</p>
          <h2 id="parallel-actions" className="mt-1 text-2xl">Do these at the same time.</h2>
          <div className="mt-4 grid gap-2">
            <div className="flex gap-3 border-2 border-[#08745c] bg-[#f2fbf8] p-3"><span className="grid size-7 shrink-0 place-items-center bg-[#08745c] text-white"><Check aria-hidden="true" size={18} /></span><div><strong>Bank hold requested</strong><p className="m-0 mt-1 text-sm text-[#52606d]">Simulated request sent to {selectedBank?.name} for the {hold.rail} trail.</p></div></div>
            <div className="flex gap-3 border-2 border-[#08745c] bg-[#f2fbf8] p-3"><span className="grid size-7 shrink-0 place-items-center bg-[#08745c] text-white"><Check aria-hidden="true" size={18} /></span><div><strong>1930 ticket raised</strong><p className="m-0 mt-1 text-sm text-[#52606d]">Mock ticket {hold.ticket}; no real helpline request was made.</p></div></div>
            <div className="flex gap-3 border-2 border-[#9a6700] bg-[#fff8e8] p-3"><CalendarClock aria-hidden="true" className="shrink-0 text-[#9a6700]" /><div><strong>RBI reporting deadline: {zeroLiabilityDeadline.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</strong><p className="m-0 mt-1 text-sm text-[#52606d]">Three working days from this report. Notify your bank through an official channel.</p></div></div>
            {manualActions.map(({ id, title, detail, icon: Icon }) => {
              const done = completedActions.includes(id);
              return <button key={id} type="button" onClick={() => setCompletedActions((current) => done ? current.filter((item) => item !== id) : [...current, id])} aria-pressed={done} className={`flex w-full gap-3 border-2 p-3 text-left ${done ? "border-[#08745c] bg-[#f2fbf8]" : "border-[#cbd5df] bg-white"}`}><span className={`grid size-7 shrink-0 place-items-center ${done ? "bg-[#08745c] text-white" : "bg-[#e6ebf0] text-[#0b2b4c]"}`}>{done ? <Check aria-hidden="true" size={18} /> : <Icon aria-hidden="true" size={18} />}</span><span><strong className="block">{title}</strong><span className="mt-1 block text-sm text-[#52606d]">{detail}</span></span></button>;
            })}
          </div>
        </section>

        <div className="flex flex-wrap gap-3"><a className="button-primary" href="/describe">Build the full case</a><button className="button-quiet" type="button" onClick={resetDemo}><Undo2 aria-hidden="true" size={18} /> Reset demo</button></div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_0.42fr]">
      <form className="panel" onSubmit={fireHold}>
        <div className="mb-5 flex items-center justify-between gap-3 border-b-2 border-[#cbd5df] pb-4">
          <div><p className="eyebrow m-0">Golden hour · four facts</p><h1 className="m-0 mt-1 text-2xl">Start with the transfer.</h1></div>
          <div className="bg-[#fff4df] px-3 py-2 text-right"><span className="block text-[0.65rem] font-black uppercase text-[#9a6700]">Fraud elapsed</span><strong className="font-mono text-lg" aria-label={`${elapsedSeconds} seconds since fraud`}>{formatDuration(elapsedSeconds)}</strong></div>
        </div>
        <div className="grid gap-5">
          <label><span className="field-label">1. How much left your account?</span><span className="relative block"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-black">₹</span><input className="field-control pl-9" name="amount" type="number" inputMode="numeric" min="1" step="1" required value={amount} onChange={(event) => setAmount(event.target.value)} /></span></label>
          <label><span className="field-label">2. When did it happen?</span><input className="field-control" name="occurredAt" type="datetime-local" required max={now ? localDateTime(new Date(now)) : undefined} value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} /><span className="field-help">An estimate is enough. You can correct it later.</span></label>
          <label><span className="field-label">3. How did the money move?</span><select className="field-control" name="rail" value={rail} onChange={(event) => setRail(event.target.value as Rail)}>{rails.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label><span className="field-label">4. Which bank did it leave?</span><select className="field-control" name="bankId" value={bankId} onChange={(event) => setBankId(event.target.value)}>{banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.name} {bank.maskedAccount}</option>)}</select></label>
        </div>
        <button className="button-primary mt-6 w-full" type="submit"><BanknoteArrowDown aria-hidden="true" size={22} /> Fire simulated hold request</button>
        <p className="mb-0 mt-3 text-center text-xs leading-5 text-[#52606d]">No account, category selection, suspect details, ID scan, or evidence upload.</p>
      </form>
      <aside className="grid content-start gap-3">
        <div className="panel panel-dark"><Clock3 aria-hidden="true" className="text-[#9dd8ff]" /><p className="mb-1 text-sm text-[#b8d2e7]">Response clock</p><strong className="font-mono text-3xl">{formatDuration(responseSeconds)}</strong><p className="mb-0 text-sm text-[#d7e8f5]">Target: send in under 01:30.</p></div>
        <div className="panel"><Landmark aria-hidden="true" className="text-[#0b2b4c]" /><h2 className="mb-1 text-lg">What this fires</h2><p className="m-0 text-sm leading-5 text-[#52606d]">A mock hold instruction, a mock 1930 ticket, and the next actions—together.</p></div>
      </aside>
    </div>
  );
}
