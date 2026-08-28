"use client";

import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Check,
  Circle,
  Clock3,
  FileText,
  RotateCcw,
  Scale,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  caseDocumentTypes,
  documentMeta,
  isAtOrAfter,
  nextTrustStage,
  trustStageMeta,
  trustStages,
  trustStorageKey,
  type CaseActivity,
  type CaseDocumentType,
  type LiveTrustCase,
  type SavedTrustState,
  type TrustStage,
} from "@/lib/case-trust";
import { formatGoldenHourDuration, GOLDEN_HOUR_TICKET_KEY, type GoldenHourTicket } from "@/lib/golden-hour";
import type { BankFixture, LiveComplaint } from "@/lib/mock/types";

const DAY = 86_400_000;
const HOUR = 3_600_000;

function formatCountdown(milliseconds: number) {
  const absolute = Math.max(0, Math.abs(milliseconds));
  const days = Math.floor(absolute / DAY);
  const hours = Math.floor((absolute % DAY) / HOUR);
  const minutes = Math.floor((absolute % HOUR) / 60_000);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDateTime(value: string | number) {
  return new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function safeSavedState(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedTrustState;
    return parsed.version === 1 && trustStages.includes(parsed.stage) ? parsed : null;
  } catch {
    return null;
  }
}

function initialState(trustCase: LiveTrustCase): SavedTrustState {
  return { version: 1, stage: trustCase.initialStage, stageStartedAt: trustCase.stageStartedAt, activities: [] };
}

export function LiveCaseFile({ complaint, trustCase, banks }: { complaint: LiveComplaint; trustCase: LiveTrustCase; banks: BankFixture[] }) {
  const storageKey = trustStorageKey(complaint.id);
  const [saved, setSaved] = useState<SavedTrustState>(() => initialState(trustCase));
  const [now, setNow] = useState(0);
  const [goldenTicket, setGoldenTicket] = useState<GoldenHourTicket | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setNow(Date.now());
      const stored = safeSavedState(window.localStorage.getItem(storageKey));
      if (stored) setSaved(stored);
      try {
        const rawTicket = window.localStorage.getItem(GOLDEN_HOUR_TICKET_KEY);
        const ticket = rawTicket ? JSON.parse(rawTicket) as GoldenHourTicket : null;
        if (ticket?.amount === complaint.amount) setGoldenTicket(ticket);
      } catch {
        setGoldenTicket(null);
      }
    });
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { window.cancelAnimationFrame(frame); window.clearInterval(timer); };
  }, [complaint.amount, storageKey]);

  const stage = saved.stage;
  const stageMeta = trustStageMeta[stage];
  const stageDeadline = stageMeta.slaHours === null ? null : new Date(saved.stageStartedAt).getTime() + stageMeta.slaHours * HOUR;
  const stageRemaining = stageDeadline === null || !now ? 0 : stageDeadline - now;
  const currentStageBreached = stageDeadline !== null && now > stageDeadline;
  const historicalBreach = trustCase.breaches[0];
  const hasActionableBreach = Boolean(historicalBreach || currentStageBreached) && !saved.dgoEscalatedAt;
  const holdTotal = trustCase.bankHolds.reduce((sum, hold) => sum + hold.amount, 0);
  const earliestHold = trustCase.bankHolds.length ? Math.min(...trustCase.bankHolds.map((hold) => new Date(hold.heldAt).getTime())) : null;
  const holdExpiry = earliestHold === null ? null : earliestHold + 90 * DAY;
  const holdWarningAt = holdExpiry === null ? null : holdExpiry - 15 * DAY;
  const holdRemaining = holdExpiry === null || !now ? null : holdExpiry - now;
  const sgoDeadline = saved.dgoEscalatedAt ? new Date(saved.dgoEscalatedAt).getTime() + 15 * DAY : null;
  const directCustody = complaint.amount < 50_000;
  const bankById = new Map(banks.map((bank) => [bank.id, bank]));

  function persist(next: SavedTrustState) {
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    setSaved(next);
  }

  function advance() {
    const nextStage = nextTrustStage(stage, complaint.amount);
    if (!nextStage) return;
    const occurredAt = new Date().toISOString();
    const activity: CaseActivity = { id: `state-${Date.now()}`, type: "state", title: trustStageMeta[nextStage].label, detail: `Mock action advanced the citizen-visible case from ${stageMeta.label}.`, occurredAt };
    persist({ ...saved, stage: nextStage, stageStartedAt: occurredAt, activities: [...saved.activities, activity] });
  }

  function escalateToDgo() {
    const occurredAt = new Date().toISOString();
    const missed = historicalBreach?.title ?? `${stageMeta.slaLabel} expired`;
    const note = `To: District Grievance Officer, ${complaint.district}\nSubject: SLA escalation — NCRP ${complaint.id}\n\nThe ${missed.toLowerCase()} in the complaint of ₹${complaint.amount.toLocaleString("en-IN")}. The citizen requests a dated action-taken note, confirmation of all active bank holds, and the next accountable officer.\n\nAssigned IO: ${trustCase.officer.name}, ${trustCase.officer.designation}\nThis is a generated mock escalation; it has not been sent.`;
    const nextStage = nextTrustStage(stage, complaint.amount) ?? stage;
    const activity: CaseActivity = { id: `dgo-${Date.now()}`, type: "escalation", title: "Escalated to District Grievance Officer", detail: `${missed}. Mock note generated; case advanced to ${trustStageMeta[nextStage].label}.`, occurredAt };
    persist({ ...saved, stage: nextStage, stageStartedAt: occurredAt, dgoEscalatedAt: occurredAt, dgoNote: note, activities: [...saved.activities, activity] });
  }

  function appealToSgo() {
    if (!saved.dgoEscalatedAt || saved.sgoAppealedAt) return;
    const occurredAt = new Date().toISOString();
    const note = `To: State Grievance Officer, ${complaint.state}\nSubject: Appeal within 15 days — NCRP ${complaint.id}\n\nThe District Grievance Officer escalation dated ${formatDateTime(saved.dgoEscalatedAt)} has not resolved the recorded service delay. Please review the bank and IO action trail and protect the active holds.`;
    const activity: CaseActivity = { id: `sgo-${Date.now()}`, type: "appeal", title: "State Grievance Officer appeal prepared", detail: "Appeal recorded within the 15-day mock window.", occurredAt };
    persist({ ...saved, sgoAppealedAt: occurredAt, sgoNote: note, activities: [...saved.activities, activity] });
  }

  function recordDocument(type: CaseDocumentType) {
    if (saved.activities.some((item) => item.type === "document" && item.documentType === type)) return;
    const activity: CaseActivity = { id: `document-${type}-${Date.now()}`, type: "document", title: `${documentMeta[type].shortTitle} generated`, detail: "Filled HTML document opened for review and print-to-PDF.", occurredAt: new Date().toISOString(), documentType: type };
    persist({ ...saved, activities: [...saved.activities, activity] });
  }

  function reset() {
    window.localStorage.removeItem(storageKey);
    setSaved(initialState(trustCase));
  }

  const timeline = [
    ...(goldenTicket ? [{ id: `golden-${goldenTicket.reference}`, occurredAt: goldenTicket.requestedAt, title: "Golden Hour hold request sent", detail: `Mock ticket ${goldenTicket.reference} sent to ${goldenTicket.bankName} in ${formatGoldenHourDuration(goldenTicket.responseSeconds)}.`, tone: "safe" as const }] : []),
    ...trustCase.history.map((event, index) => ({ id: `history-${index}`, occurredAt: event.occurredAt, title: trustStageMeta[event.stage].label, detail: event.detail, tone: "normal" as const })),
    ...trustCase.breaches.map((breach) => ({ id: `breach-${breach.id}`, occurredAt: breach.dueAt, title: `SLA event: ${breach.title}`, detail: breach.detail, tone: "warning" as const })),
    ...saved.activities.map((activity) => ({ id: activity.id, occurredAt: activity.occurredAt, title: activity.title, detail: activity.detail, tone: activity.type === "escalation" || activity.type === "appeal" ? "warning" as const : activity.type === "document" ? "document" as const : "safe" as const })),
  ].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

  return (
    <div className="grid gap-5">
      <CurrentStatus stage={stage} stageStartedAt={saved.stageStartedAt} deadline={stageDeadline} remaining={stageRemaining} breached={currentStageBreached} officer={trustCase.officer} legacyStatus={trustCase.legacyStatus} now={now} />
      <StateMachine stage={stage} directCustody={directCustody} officerName={trustCase.officer.name} />
      <SlaLadder />

      {historicalBreach || currentStageBreached || saved.dgoEscalatedAt ? <EscalationPanel complaint={complaint} breach={historicalBreach} currentStageBreached={currentStageBreached} saved={saved} sgoDeadline={sgoDeadline} now={now} hasActionableBreach={hasActionableBreach} onEscalate={escalateToDgo} onAppeal={appealToSgo} /> : null}

      <RestorationTracker complaint={complaint} trustCase={trustCase} stage={stage} holdTotal={holdTotal} banks={bankById} directCustody={directCustody} stageDeadline={stage === "restoration_in_progress" ? stageDeadline : null} now={now} onDocument={recordDocument} />

      {holdExpiry && holdWarningAt && stage !== "closed" ? <HoldExpiryPanel expiry={holdExpiry} warningAt={holdWarningAt} remaining={holdRemaining ?? 0} now={now} /> : null}

      <DocumentsPanel complaintId={complaint.id} onDocument={recordDocument} />
      <Timeline events={timeline} />

      <section className="border-2 border-dashed border-[var(--line-strong)] bg-white p-4"><p className="eyebrow">Demo control</p><h2 className="mt-1 text-xl">Walk the citizen-visible state.</h2><p className="text-sm leading-6 text-[var(--muted)]">This simulates actions by police, banks, and courts. It is not an admin interface.</p><div className="flex flex-wrap gap-3">{nextTrustStage(stage, complaint.amount) ? <button className="button-primary" type="button" onClick={advance}>Advance to {trustStageMeta[nextTrustStage(stage, complaint.amount)!].label} <ArrowRight aria-hidden="true" size={18} /></button> : <span className="status-pill text-[#08745c]">Case path complete</span>}<button className="button-quiet" type="button" onClick={reset}><RotateCcw aria-hidden="true" size={18} /> Reset this case</button></div></section>
    </div>
  );
}

function CurrentStatus({ stage, stageStartedAt, deadline, remaining, breached, officer, legacyStatus, now }: { stage: TrustStage; stageStartedAt: string; deadline: number | null; remaining: number; breached: boolean; officer: LiveTrustCase["officer"]; legacyStatus?: "Disposed"; now: number }) {
  const meta = trustStageMeta[stage];
  return <section className={`border-2 p-4 sm:p-5 ${breached ? "border-[var(--warning)] bg-[var(--warning-soft)]" : "border-[var(--primary)] bg-white"}`} aria-labelledby="current-status-heading"><div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-2xl"><div className="flex flex-wrap items-center gap-2"><p className="eyebrow m-0">Current citizen-visible state</p>{legacyStatus ? <span className="status-pill text-[var(--warning-dark)]">Old NCRP label: {legacyStatus}</span> : null}</div><h2 id="current-status-heading" className="m-0 mt-2 text-3xl">{meta.label}</h2><p className="mb-0 mt-3 leading-7 text-[var(--muted)]">{meta.meaning}</p></div>{deadline ? <div className={`${breached ? "bg-[var(--warning-dark)]" : "bg-[var(--primary)]"} min-w-44 p-3 text-white`}><span className="block text-xs font-black uppercase tracking-[0.08em]">{breached ? "SLA overdue" : meta.slaLabel}</span><strong className="mt-1 block font-mono text-2xl">{now ? (breached ? `+${formatCountdown(remaining)}` : formatCountdown(remaining)) : "Calculating…"}</strong><span className="mt-1 block text-xs">Due {formatDateTime(deadline)}</span></div> : <span className="status-pill text-[#08745c]">Complete</span>}</div><div className="mt-5 grid gap-3 border-t border-[var(--line)] pt-4 sm:grid-cols-2"><div><span className="text-xs font-black uppercase text-[var(--muted)]">Who is acting</span><strong className="mt-1 block">{meta.actor}</strong></div><div><span className="text-xs font-black uppercase text-[var(--muted)]">Named case owner</span><strong className="mt-1 block">{officer.name}</strong><span className="text-sm text-[var(--muted)]">{officer.designation} · {officer.unit}</span></div></div><p className="mb-0 mt-4 text-xs text-[var(--muted)]">This state began {formatDateTime(stageStartedAt)}.</p></section>;
}

function StateMachine({ stage, directCustody, officerName }: { stage: TrustStage; directCustody: boolean; officerName: string }) {
  const currentIndex = trustStages.indexOf(stage);
  return <section className="panel" aria-labelledby="state-machine-heading"><p className="eyebrow">No “Under Process”</p><h2 id="state-machine-heading" className="m-0 mt-1 text-2xl">Every hand-off has a name.</h2><ol className="mt-5 grid list-none gap-0 p-0">{trustStages.map((item, index) => { const waived = directCustody && (item === "fir_pending" || item === "fir_registered") && currentIndex >= trustStages.indexOf("restoration_in_progress"); const complete = index < currentIndex || waived; const current = item === stage; const meta = trustStageMeta[item]; return <li className="grid grid-cols-[2rem_1fr] gap-3" key={item}><div className="flex flex-col items-center"><span className={`grid size-7 place-items-center border-2 ${complete ? "border-[#08745c] bg-[#08745c] text-white" : current ? "border-[var(--primary)] bg-[var(--blue-soft)] text-[var(--primary)]" : "border-[var(--line-strong)] bg-white text-[var(--line-strong)]"}`}>{complete ? <Check aria-hidden="true" size={17} /> : <Circle aria-hidden="true" size={11} fill={current ? "currentColor" : "none"} />}</span>{index < trustStages.length - 1 ? <span className={`min-h-12 w-0.5 flex-1 ${complete ? "bg-[#08745c]" : "bg-[var(--line)]"}`} /> : null}</div><div className="pb-5"><div className="flex flex-wrap items-center gap-2"><strong className={current ? "text-[var(--primary)]" : ""}>{meta.label}</strong>{waived ? <span className="status-pill text-[#08745c]">Not required under ₹50k</span> : null}</div><p className="m-0 mt-1 text-sm leading-6 text-[var(--muted)]">{waived ? "Direct interim custody can proceed without FIR linkage in this prototype." : meta.meaning}</p><p className="m-0 mt-1 text-xs font-black uppercase tracking-[0.04em] text-[var(--muted)]">Who: {meta.actor} · SLA: {meta.slaLabel}</p>{item === "assigned_io" && (complete || current) ? <p className="mb-0 mt-2 text-sm font-black"><UserRoundCheck aria-hidden="true" className="mr-1 inline" size={16} /> {officerName}</p> : null}</div></li>; })}</ol></section>;
}

function SlaLadder() {
  const steps = [
    ["Bank submission", "Within 7 days"],
    ["Investigating Officer verification", "Within 15 days"],
    ["District Grievance Officer", "Auto-escalation after a missed SLA"],
    ["State Grievance Officer appeal", "Within 15 days of DGO escalation"],
    ["Held funds", "90-day expiry · warning begins 15 days before"],
  ];
  return <section className="panel bg-[var(--blue-soft)]" aria-labelledby="sla-ladder-heading"><p className="eyebrow">Accountability ladder</p><h2 id="sla-ladder-heading" className="m-0 mt-1 text-2xl">A missed deadline creates your next action.</h2><dl className="mt-4 grid gap-px bg-[var(--line-strong)] sm:grid-cols-2">{steps.map(([label, value]) => <div className="bg-white p-3" key={label}><dt className="text-sm font-black">{label}</dt><dd className="m-0 mt-1 text-sm leading-5 text-[var(--muted)]">{value}</dd></div>)}</dl></section>;
}

function EscalationPanel({ complaint, breach, currentStageBreached, saved, sgoDeadline, now, hasActionableBreach, onEscalate, onAppeal }: { complaint: LiveComplaint; breach?: LiveTrustCase["breaches"][number]; currentStageBreached: boolean; saved: SavedTrustState; sgoDeadline: number | null; now: number; hasActionableBreach: boolean; onEscalate: () => void; onAppeal: () => void }) {
  const lateness = breach?.completedAt ? new Date(breach.completedAt).getTime() - new Date(breach.dueAt).getTime() : breach && now ? now - new Date(breach.dueAt).getTime() : 0;
  return <section className="border-2 border-[var(--warning)] bg-[var(--warning-soft)] p-4 sm:p-5" aria-labelledby="escalation-heading"><div className="flex items-start gap-3"><AlertTriangle aria-hidden="true" className="mt-1 shrink-0 text-[var(--warning-dark)]" size={30} /><div><p className="eyebrow text-[var(--warning-dark)]">SLA accountability</p><h2 id="escalation-heading" className="m-0 mt-1 text-2xl">{breach?.title ?? "Current stage SLA breached"}</h2><p className="mb-0 mt-2 text-sm leading-6 text-[var(--muted)]">{breach?.detail ?? "The current accountable actor has crossed the displayed deadline."}</p></div></div>{breach ? <dl className="mt-4 grid gap-px bg-[#d3a43c] sm:grid-cols-3"><div className="bg-white p-3"><dt className="text-xs font-black uppercase text-[var(--muted)]">Responsible actor</dt><dd className="m-0 mt-1 font-black">{breach.actor}</dd></div><div className="bg-white p-3"><dt className="text-xs font-black uppercase text-[var(--muted)]">SLA due</dt><dd className="m-0 mt-1 font-black">{formatDateTime(breach.dueAt)}</dd></div><div className="bg-white p-3"><dt className="text-xs font-black uppercase text-[var(--muted)]">Delay recorded</dt><dd className="m-0 mt-1 font-mono font-black">{formatCountdown(lateness)}</dd></div></dl> : null}{hasActionableBreach ? <button className="button-primary mt-5 w-full sm:w-auto" type="button" onClick={onEscalate}><ShieldAlert aria-hidden="true" size={20} /> Escalate to District Grievance Officer</button> : null}{saved.dgoNote ? <div className="mt-5 border-2 border-[#08745c] bg-white p-4"><span className="status-pill text-[#08745c]">DGO escalation recorded</span><pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6">{saved.dgoNote}</pre>{sgoDeadline ? <div className="mt-4 border-t border-[var(--line)] pt-4"><strong>State Grievance Officer appeal window</strong><p className="mb-0 mt-1 text-sm">Deadline: {formatDateTime(sgoDeadline)} · {now <= sgoDeadline ? `${formatCountdown(sgoDeadline - now)} remaining` : `${formatCountdown(now - sgoDeadline)} overdue`}</p>{!saved.sgoAppealedAt ? <button className="button-secondary mt-3" type="button" onClick={onAppeal}><Scale aria-hidden="true" size={19} /> Prepare SGO appeal</button> : <p className="mb-0 mt-3 font-black text-[#08745c]">SGO appeal prepared within the 15-day window.</p>}</div> : null}</div> : null}{currentStageBreached && !breach ? <p className="mb-0 mt-3 text-xs">Complaint {complaint.id} remains eligible for DGO escalation while this stage is overdue.</p> : null}</section>;
}

function RestorationTracker({ complaint, trustCase, stage, holdTotal, banks, directCustody, stageDeadline, now, onDocument }: { complaint: LiveComplaint; trustCase: LiveTrustCase; stage: TrustStage; holdTotal: number; banks: Map<string, BankFixture>; directCustody: boolean; stageDeadline: number | null; now: number; onDocument: (type: CaseDocumentType) => void }) {
  const firReady = isAtOrAfter(stage, "fir_registered");
  return <section className="border-2 border-[var(--primary)] bg-white p-4 sm:p-5" aria-labelledby="restoration-heading"><div className="flex items-start gap-3"><Banknote aria-hidden="true" className="mt-1 shrink-0 text-[var(--primary)]" size={34} /><div><p className="eyebrow">Money restoration tracker</p><h2 id="restoration-heading" className="m-0 mt-1 text-3xl">Follow the money, then release it.</h2></div></div><dl className="mt-5 grid gap-px bg-[var(--line-strong)] sm:grid-cols-4"><MoneyValue label="Reported lost" value={complaint.amount} /><MoneyValue label="Traced" value={trustCase.amountTraced} /><MoneyValue label="Held" value={holdTotal} /><MoneyValue label="Returned" value={trustCase.amountReturned} /></dl><div className="mt-5"><h3 className="m-0 text-lg">Where the held money is</h3><div className="mt-3 grid gap-2">{trustCase.bankHolds.map((hold) => <div className="flex min-h-14 items-center justify-between gap-3 border border-[var(--line)] bg-[var(--blue-soft)] p-3" key={`${hold.bankId}-${hold.amount}`}><div><strong>{banks.get(hold.bankId)?.name ?? "Beneficiary bank"}</strong><p className="m-0 mt-1 text-xs text-[var(--muted)]">Held {formatDateTime(hold.heldAt)}</p></div><strong>₹{hold.amount.toLocaleString("en-IN")}</strong></div>)}</div></div><div className={`mt-5 border-l-4 p-4 ${directCustody || firReady ? "border-[#08745c] bg-[#eaf6f2]" : "border-[var(--warning)] bg-[var(--warning-soft)]"}`}>{directCustody ? <><p className="eyebrow text-[#075a49]">Under ₹50,000 path</p><h3 className="m-0 mt-1 text-xl">Apply for direct interim custody — no FIR needed</h3><p className="text-sm leading-6 text-[var(--muted)]">A filled S.106(3) BNSS application is ready. The mock bank execution clock is 15 days after the order.</p><Link className="button-primary mt-3" href={`/case/${complaint.id}/documents/custody-application`} onClick={() => onDocument("custody-application")}>View generated application <ArrowRight aria-hidden="true" size={18} /></Link></> : firReady ? <><p className="eyebrow text-[#075a49]">Above ₹50,000 path</p><h3 className="m-0 mt-1 text-xl">FIR linked — custody application can proceed</h3><Link className="button-primary mt-3" href={`/case/${complaint.id}/documents/custody-application`} onClick={() => onDocument("custody-application")}>Open custody application <ArrowRight aria-hidden="true" size={18} /></Link></> : <><p className="eyebrow text-[var(--warning-dark)]">Above ₹50,000 path</p><h3 className="m-0 mt-1 text-xl">FIR required first</h3><p className="text-sm leading-6 text-[var(--muted)]">The FIR request is ready now. The S.106(3) BNSS custody application is filled and queued behind FIR linkage.</p><div className="mt-3 flex flex-wrap gap-2"><Link className="button-primary" href={`/case/${complaint.id}/documents/fir-request`} onClick={() => onDocument("fir-request")}>Open FIR request <ArrowRight aria-hidden="true" size={18} /></Link><Link className="button-secondary" href={`/case/${complaint.id}/documents/custody-application`} onClick={() => onDocument("custody-application")}>View queued custody application</Link></div></>}</div>{stageDeadline && stage === "restoration_in_progress" && now > 0 ? <div className="mt-4 flex items-center justify-between gap-3 border-2 border-[var(--primary)] p-3"><span><strong className="block">15-day bank execution clock</strong><span className="text-xs text-[var(--muted)]">Due {formatDateTime(stageDeadline)}</span></span><strong className="shrink-0 font-mono text-xl">{stageDeadline >= now ? formatCountdown(stageDeadline - now) : `+${formatCountdown(now - stageDeadline)}`}</strong></div> : null}</section>;
}

function MoneyValue({ label, value }: { label: string; value: number }) { return <div className="bg-white p-3"><dt className="text-xs font-black uppercase text-[var(--muted)]">{label}</dt><dd className="m-0 mt-1 text-xl font-black">₹{value.toLocaleString("en-IN")}</dd></div>; }

function HoldExpiryPanel({ expiry, warningAt, remaining, now }: { expiry: number; warningAt: number; remaining: number; now: number }) {
  if (!now) return <section className="panel bg-[var(--blue-soft)]" role="status"><strong>Calculating the 90-day hold expiry…</strong></section>;
  const warning = now >= warningAt;
  return <section className={`panel ${warning ? "border-[var(--warning)] bg-[var(--warning-soft)]" : "bg-[var(--blue-soft)]"}`}><div className="flex items-start gap-3"><Clock3 aria-hidden="true" className="mt-1 shrink-0 text-[var(--primary)]" size={27} /><div><p className="eyebrow">90-day hold protection</p><h2 className="m-0 mt-1 text-xl">{remaining >= 0 ? `${formatCountdown(remaining)} until hold expiry` : `Hold expired ${formatCountdown(remaining)} ago`}</h2><p className="mb-0 mt-2 text-sm leading-6 text-[var(--muted)]">Expiry: {formatDateTime(expiry)}. The 15-day warning begins {formatDateTime(warningAt)}. {warning ? "Extension or court action needs attention now." : "No expiry action is due yet."}</p></div></div></section>;
}

function DocumentsPanel({ complaintId, onDocument }: { complaintId: string; onDocument: (type: CaseDocumentType) => void }) { return <section className="panel" aria-labelledby="documents-heading"><p className="eyebrow">Filled from this case</p><h2 id="documents-heading" className="m-0 mt-1 text-2xl">Documents you can print or save as PDF</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{caseDocumentTypes.map((type) => <Link className="flex min-h-24 items-start gap-3 border-2 border-[var(--line)] bg-white p-3 no-underline hover:border-[var(--primary)] hover:bg-[var(--blue-soft)]" href={`/case/${complaintId}/documents/${type}`} key={type} onClick={() => onDocument(type)}><FileText aria-hidden="true" className="mt-1 shrink-0 text-[var(--primary)]" size={24} /><span><strong className="block">{documentMeta[type].shortTitle}</strong><span className="mt-1 block text-sm leading-5 text-[var(--muted)]">{documentMeta[type].description}</span></span></Link>)}</div></section>; }

function Timeline({ events }: { events: Array<{ id: string; occurredAt: string; title: string; detail: string; tone: "normal" | "safe" | "warning" | "document" }> }) { return <section className="panel" aria-labelledby="timeline-heading"><p className="eyebrow">One chronological record</p><h2 id="timeline-heading" className="m-0 mt-1 text-2xl">Everything that happened</h2><ol className="mt-5 grid list-none gap-0 p-0">{events.map((event, index) => <li className="grid grid-cols-[2rem_1fr] gap-3" key={event.id}><div className="flex flex-col items-center"><span className={`grid size-7 place-items-center border-2 ${event.tone === "warning" ? "border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--warning-dark)]" : event.tone === "document" ? "border-[var(--primary)] bg-[var(--blue-soft)] text-[var(--primary)]" : "border-[#08745c] bg-[#eaf6f2] text-[#075a49]"}`}>{event.tone === "document" ? <FileText aria-hidden="true" size={15} /> : event.tone === "warning" ? <AlertTriangle aria-hidden="true" size={15} /> : <Check aria-hidden="true" size={15} />}</span>{index < events.length - 1 ? <span className="min-h-12 w-0.5 flex-1 bg-[var(--line)]" /> : null}</div><div className="pb-5"><time className="text-xs font-black uppercase text-[var(--muted)]" dateTime={event.occurredAt}>{formatDateTime(event.occurredAt)}</time><strong className="mt-1 block">{event.title}</strong><p className="m-0 mt-1 text-sm leading-6 text-[var(--muted)]">{event.detail}</p></div></li>)}</ol></section>; }
