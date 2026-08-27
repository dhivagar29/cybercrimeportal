"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, Circle, Clock3, Landmark, RotateCcw, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { formatGoldenHourDuration, GOLDEN_HOUR_TICKET_KEY, type GoldenHourTicket } from "@/lib/golden-hour";
import { caseStages, type CaseStage, type LiveComplaint } from "@/lib/mock/types";
import type { BankFixture } from "@/lib/mock/types";

const stageMeta: Record<CaseStage, { label: string; citizenCopy: string; slaHours: number | null }> = {
  filed: { label: "Complaint filed", citizenCopy: "The account and payment trail are recorded.", slaHours: 2 },
  routed: { label: "Routed to district", citizenCopy: "The district cyber cell has received the complaint.", slaHours: 24 },
  assigned: { label: "Assigned to investigating officer", citizenCopy: "The IO is validating the trail and beneficiary account.", slaHours: 168 },
  hold_placed: { label: "Hold placed", citizenCopy: "The beneficiary bank has marked money in the chain.", slaHours: 360 },
  fir_linked: { label: "FIR linked", citizenCopy: "The complaint is linked to an FIR for the restoration process.", slaHours: 48 },
  custody_applied: { label: "Interim custody applied", citizenCopy: "The release application is with the competent authority.", slaHours: 360 },
  restored: { label: "Money restored", citizenCopy: "The bank has executed the release to the citizen.", slaHours: null },
};

type SavedCase = { stage: CaseStage; stageStartedAt: string; escalated: boolean };

function formatRemaining(ms: number) {
  const absolute = Math.abs(ms);
  const days = Math.floor(absolute / 86_400_000);
  const hours = Math.floor((absolute % 86_400_000) / 3_600_000);
  const minutes = Math.floor((absolute % 3_600_000) / 60_000);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function LiveCaseFile({ complaint, bank }: { complaint: LiveComplaint; bank?: BankFixture }) {
  const storageKey = `cybercrimeportal:case:${complaint.id}:v1`;
  const [stage, setStage] = useState<CaseStage>(complaint.stage);
  const [stageStartedAt, setStageStartedAt] = useState(complaint.stageStartedAt);
  const [escalated, setEscalated] = useState(false);
  const [now, setNow] = useState(0);
  const [goldenTicket, setGoldenTicket] = useState<GoldenHourTicket | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setNow(Date.now());
      try {
        const holdTicket = window.localStorage.getItem(GOLDEN_HOUR_TICKET_KEY);
        if (holdTicket) setGoldenTicket(JSON.parse(holdTicket) as GoldenHourTicket);
      } catch {
        setGoldenTicket(null);
      }
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return;
      const saved = JSON.parse(stored) as SavedCase;
      setStage(saved.stage);
      setStageStartedAt(saved.stageStartedAt);
      setEscalated(saved.escalated);
    });
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { window.cancelAnimationFrame(frame); window.clearInterval(timer); };
  }, [storageKey]);

  const currentIndex = caseStages.indexOf(stage);
  const meta = stageMeta[stage];
  const deadline = meta.slaHours === null ? null : new Date(stageStartedAt).getTime() + meta.slaHours * 3_600_000;
  const remaining = deadline === null || !now ? 0 : deadline - now;
  const breached = deadline !== null && now > 0 && remaining < 0;
  const holdPlacedAt = stage === "hold_placed" ? new Date(stageStartedAt).getTime() : new Date(complaint.reportedAt).getTime();
  const holdExpiresAt = holdPlacedAt + 90 * 86_400_000;
  const daysToExpiry = Math.ceil((holdExpiresAt - now) / 86_400_000);

  function persist(nextStage: CaseStage, startedAt: string, nextEscalated: boolean) {
    window.localStorage.setItem(storageKey, JSON.stringify({ stage: nextStage, stageStartedAt: startedAt, escalated: nextEscalated } satisfies SavedCase));
  }

  function advance() {
    if (currentIndex >= caseStages.length - 1) return;
    const nextStage = caseStages[currentIndex + 1];
    const startedAt = new Date().toISOString();
    setStage(nextStage);
    setStageStartedAt(startedAt);
    setEscalated(false);
    persist(nextStage, startedAt, false);
  }

  function escalate() {
    setEscalated(true);
    persist(stage, stageStartedAt, true);
  }

  function reset() {
    window.localStorage.removeItem(storageKey);
    setStage(complaint.stage);
    setStageStartedAt(complaint.stageStartedAt);
    setEscalated(false);
  }

  return (
    <div className="grid gap-5">
      <section className={`border-2 p-4 ${breached ? "border-[#9a6700] bg-[#fff8e8]" : "border-[#0b2b4c] bg-white"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="eyebrow">Current stage</p><h1 className="m-0 mt-1 text-2xl">{meta.label}</h1><p className="mb-0 max-w-[60ch] text-sm leading-6 text-[#52606d]">{meta.citizenCopy}</p></div>
          {deadline ? <div className="min-w-32 bg-[#0b2b4c] p-3 text-white"><span className="block text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#b8d2e7]">{breached ? "SLA overdue" : "SLA remaining"}</span><strong className="mt-1 block font-mono text-xl">{formatRemaining(remaining)}</strong></div> : <span className="status-pill text-[#08745c]">Complete</span>}
        </div>
        {breached ? <div className="mt-4 border-t-2 border-[#d3a43c] pt-4"><p className="m-0 flex gap-2 text-sm font-black"><AlertTriangle aria-hidden="true" className="shrink-0 text-[#9a6700]" size={20} /> This stage has crossed its published demo SLA.</p>{escalated ? <p className="mb-0 mt-3 border-2 border-[#08745c] bg-[#eaf6f2] p-3 text-sm font-black text-[#075a49]">District Grievance Officer escalation recorded. Mock reference DGO-{complaint.id.slice(-6)}.</p> : <button className="button-primary mt-3" type="button" onClick={escalate}><ShieldAlert aria-hidden="true" size={20} /> Escalate this delay</button>}</div> : null}
      </section>

      <section className="panel" aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className="mt-0 text-xl">Case timeline</h2>
        <ol className="m-0 grid list-none gap-0 p-0">
          {goldenTicket ? <li className="grid grid-cols-[2rem_1fr] gap-3"><div className="flex flex-col items-center"><span className="grid size-7 place-items-center border-2 border-[#08745c] bg-[#08745c] text-white"><Check aria-hidden="true" size={17} /></span><span className="min-h-10 w-0.5 flex-1 bg-[#08745c]" /></div><div className="pb-5"><strong className="text-[#075a49]">Golden Hour hold request sent</strong><p className="m-0 mt-1 text-sm text-[#52606d]">Mock ticket {goldenTicket.reference} sent to {goldenTicket.bankName} for ₹{goldenTicket.amount.toLocaleString("en-IN")}.</p><p className="mb-0 mt-2 inline-flex items-center gap-2 bg-[#eaf6f2] px-2 py-1 text-sm font-black text-[#075a49]"><Clock3 aria-hidden="true" size={16} /> Requested in {formatGoldenHourDuration(goldenTicket.responseSeconds)}</p></div></li> : null}
          {caseStages.map((item, index) => {
            const complete = index < currentIndex;
            const current = index === currentIndex;
            return <li className="grid grid-cols-[2rem_1fr] gap-3" key={item}><div className="flex flex-col items-center"><span className={`grid size-7 place-items-center border-2 ${complete ? "border-[#08745c] bg-[#08745c] text-white" : current ? "border-[var(--primary)] bg-[var(--blue-soft)] text-[var(--primary)]" : "border-[#8292a2] bg-white text-[#8292a2]"}`}>{complete ? <Check aria-hidden="true" size={17} /> : <Circle aria-hidden="true" size={12} fill={current ? "currentColor" : "none"} />}</span>{index < caseStages.length - 1 ? <span className={`min-h-10 w-0.5 flex-1 ${complete ? "bg-[#08745c]" : "bg-[#cbd5df]"}`} /> : null}</div><div className="pb-5"><strong className={current ? "text-[var(--primary)]" : ""}>{stageMeta[item].label}</strong><p className="m-0 mt-1 text-sm text-[#52606d]">{stageMeta[item].citizenCopy}</p>{item === "hold_placed" && index <= currentIndex ? <p className="mb-0 mt-2 inline-flex items-center gap-2 bg-[#eaf6f2] px-2 py-1 text-sm font-black text-[#075a49]"><Landmark aria-hidden="true" size={16} /> ₹{complaint.holdAmount.toLocaleString("en-IN")} at {bank?.name ?? "beneficiary bank"}</p> : null}</div></li>;
          })}
        </ol>
      </section>

      {currentIndex >= caseStages.indexOf("hold_placed") && stage !== "restored" ? <section className={`panel ${daysToExpiry <= 15 ? "bg-[#fff4df]" : "bg-[#edf4fa]"}`}><div className="flex items-start gap-3"><Clock3 aria-hidden="true" className="shrink-0 text-[#0b2b4c]" /><div><h2 className="m-0 text-lg">Hold expiry: {daysToExpiry} days remaining</h2><p className="mb-0 mt-1 text-sm leading-5 text-[#52606d]">A hold expires after 90 days. This tracker raises a warning 15 days before expiry so an extension or court step can be sought.</p></div></div></section> : null}

      <section className="panel bg-[#f6f8fa]">
        <p className="eyebrow">Grievance ladder</p>
        <h2 className="mt-1 text-xl">A delay has a named next step.</h2>
        <ol className="grid gap-2 pl-5 text-sm leading-6"><li>Bank submits its response within <strong>7 days</strong>.</li><li>Investigating officer verifies within <strong>15 days</strong>.</li><li>Delay auto-escalates to the <strong>District Grievance Officer</strong>.</li><li>Appeal to the <strong>State Grievance Officer within 15 days</strong>.</li><li>Court remedy remains available at any time.</li></ol>
      </section>

      <section className="border-2 border-dashed border-[#8292a2] bg-white p-4"><p className="eyebrow">Demo control</p><h2 className="mt-1 text-xl">Walk the case in one sitting.</h2><p className="text-sm text-[#52606d]">This control simulates officer and bank actions as citizen-visible state changes. It is not an admin interface.</p><div className="flex flex-wrap gap-3">{stage !== "restored" ? <button className="button-primary" type="button" onClick={advance}>Advance to {stageMeta[caseStages[currentIndex + 1]].label} <ArrowRight aria-hidden="true" size={18} /></button> : <Link className="button-primary" href={`/restore?case=${complaint.id}`}>Review restored money <ArrowRight aria-hidden="true" size={18} /></Link>}<button className="button-quiet" type="button" onClick={reset}><RotateCcw aria-hidden="true" size={18} /> Reset this case</button></div></section>
    </div>
  );
}
