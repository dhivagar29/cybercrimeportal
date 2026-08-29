"use client";

import {
  AlertTriangle,
  ArrowRight,
  Check,
  Circle,
  EyeOff,
  FileText,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getLiveTakedownCase } from "@/lib/mock/takedown-cases";
import {
  evidenceChecklistItems,
  getTakedownSlaDeadline,
  getTakedownSlaLabel,
  nextTakedownStage,
  platformMeta,
  TAKEDOWN_CASES_KEY,
  takedownCaseStorageKey,
  takedownHarmMeta,
  takedownStageMeta,
  takedownStages,
  type SavedTakedownCase,
} from "@/lib/takedown";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function formatDateTime(value: string | number) {
  return new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatCountdown(milliseconds: number) {
  const absolute = Math.max(0, Math.abs(milliseconds));
  const days = Math.floor(absolute / DAY);
  const hours = Math.floor((absolute % DAY) / HOUR);
  const minutes = Math.floor((absolute % HOUR) / 60_000);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function safeCase(raw: string | null): SavedTakedownCase | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedTakedownCase;
    return parsed.version === 1 && parsed.acknowledgement?.startsWith("2") ? parsed : null;
  } catch {
    return null;
  }
}

function safeCaseList(raw: string | null): SavedTakedownCase[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SavedTakedownCase[];
    return Array.isArray(parsed) ? parsed.filter((item) => item.version === 1) : [];
  } catch {
    return [];
  }
}

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Keep the tracker interactive even if private storage is unavailable.
  }
}

export function TakedownCaseFile({ acknowledgement }: { acknowledgement: string }) {
  const [caseData, setCaseData] = useState<SavedTakedownCase | null>(null);
  const [resolved, setResolved] = useState(false);
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState<"advance" | "escalate" | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = safeCase(readStorage(takedownCaseStorageKey(acknowledgement)));
      const seeded = saved ? null : getLiveTakedownCase(acknowledgement, Date.now());
      setCaseData(saved ?? (seeded ? { ...seeded, version: 1 } : null));
      setNow(Date.now());
      setResolved(true);
    });
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { window.cancelAnimationFrame(frame); window.clearInterval(timer); };
  }, [acknowledgement]);

  function persist(next: SavedTakedownCase) {
    writeStorage(takedownCaseStorageKey(next.acknowledgement), JSON.stringify(next));
    const cases = safeCaseList(readStorage(TAKEDOWN_CASES_KEY));
    writeStorage(TAKEDOWN_CASES_KEY, JSON.stringify([next, ...cases.filter((item) => item.acknowledgement !== next.acknowledgement)]));
    setCaseData(next);
  }

  async function advance() {
    if (!caseData) return;
    const nextStage = nextTakedownStage(caseData.stage);
    if (!nextStage) return;
    setBusy("advance");
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    const occurredAt = new Date().toISOString();
    persist({
      ...caseData,
      stage: nextStage,
      stageStartedAt: occurredAt,
      platformReference: nextStage === "platform_acknowledged" ? `PLAT-${caseData.acknowledgement.slice(-7)}` : caseData.platformReference,
      history: [...caseData.history, {
        stage: nextStage,
        occurredAt,
        detail: nextStage === "platform_acknowledged" ? `${platformMeta[caseData.platform].label} acknowledgement recorded. The content-action clock started.` : "The mock platform reports that the content or account has been acted on.",
      }],
    });
    setBusy(null);
  }

  async function escalate() {
    if (!caseData) return;
    setBusy("escalate");
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    const occurredAt = new Date().toISOString();
    persist({
      ...caseData,
      stage: "escalated_to_ncrp",
      stageStartedAt: occurredAt,
      history: [...caseData.history, {
        stage: "escalated_to_ncrp",
        occurredAt,
        detail: `Missed ${getTakedownSlaLabel(caseData.stage, caseData.harm).toLowerCase()} recorded in a mock NCRP / police escalation note.`,
      }],
    });
    setBusy(null);
  }

  const timeline = useMemo(() => {
    if (!caseData) return [];
    return [
      ...caseData.history.map((event, index) => ({ id: `stage-${index}`, occurredAt: event.occurredAt, title: takedownStageMeta[event.stage].label, detail: event.detail, kind: event.stage === "escalated_to_ncrp" ? "warning" as const : "state" as const })),
      { id: caseData.grievanceReport.id, occurredAt: caseData.grievanceReport.generatedAt, title: "Platform grievance report generated", detail: `Filled for ${caseData.grievanceReport.recipient}. Stored on this device; not sent.`, kind: "document" as const },
    ].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  }, [caseData]);

  if (!resolved) return <section className="panel" role="status"><strong>Loading the saved takedown case…</strong></section>;
  if (!caseData) return <section className="panel"><p className="eyebrow">Case not found on this device</p><h1 className="mt-2 text-3xl">This acknowledgement is not saved here.</h1><p className="leading-7 text-[var(--muted)]">Anonymous reports live only in the browser that created them.</p><div className="mt-5 flex flex-wrap gap-3"><Link className="button-primary" href="/takedown">Start a report</Link><Link className="button-secondary" href="/case">See demo cases</Link></div></section>;

  const deadlineIso = getTakedownSlaDeadline(caseData.stageStartedAt, caseData.stage, caseData.harm);
  const deadline = deadlineIso ? new Date(deadlineIso).getTime() : null;
  const remaining = deadline && now ? deadline - now : 0;
  const breached = deadline !== null && now > deadline;
  const currentMeta = takedownStageMeta[caseData.stage];
  const harmMeta = takedownHarmMeta[caseData.harm];
  const platform = platformMeta[caseData.platform];
  const nextStage = nextTakedownStage(caseData.stage);
  const completedEvidence = evidenceChecklistItems.filter((item) => caseData.evidence[item.id]).length;

  return (
    <div className="grid gap-5">
      <section className={`border-2 p-4 sm:p-5 ${breached ? "border-[var(--warning)] bg-[var(--warning-soft)]" : "border-[var(--primary)] bg-white"}`} aria-labelledby="social-current-stage">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl"><div className="flex flex-wrap items-center gap-2"><p className="eyebrow m-0">Current content state</p>{caseData.anonymous ? <span className="status-pill text-[var(--safe)]"><EyeOff aria-hidden="true" className="mr-1" size={14} /> Anonymous</span> : null}</div><h2 id="social-current-stage" className="m-0 mt-2 text-3xl">{currentMeta.label}</h2><p className="mb-0 mt-3 leading-7 text-[var(--muted)]">{currentMeta.meaning}</p></div>
          {deadline ? <div className={`${breached ? "bg-[var(--warning-dark)]" : "bg-[var(--primary)]"} min-w-48 p-3 text-white`} role="timer"><span className="block text-xs font-black uppercase tracking-[0.08em]">{breached ? "SLA overdue" : getTakedownSlaLabel(caseData.stage, caseData.harm)}</span><strong className="mt-1 block font-mono text-2xl">{now ? (breached ? `+${formatCountdown(remaining)}` : formatCountdown(remaining)) : "Calculating…"}</strong><span className="mt-1 block text-xs">Due {formatDateTime(deadline)}</span></div> : <span className="status-pill text-[var(--safe)]">No active platform clock</span>}
        </div>
        <div className="mt-5 grid gap-3 border-t border-[var(--line)] pt-4 sm:grid-cols-2"><div><span className="text-xs font-black uppercase text-[var(--muted)]">Who is acting</span><strong className="mt-1 block">{currentMeta.actor}</strong></div><div><span className="text-xs font-black uppercase text-[var(--muted)]">Platform</span><strong className="mt-1 block">{platform.label}</strong>{caseData.platformReference ? <span className="font-mono text-sm text-[var(--muted)]">{caseData.platformReference}</span> : null}</div></div>
        <p className="mb-0 mt-4 text-xs leading-5 text-[var(--muted)]">The 24-hour acknowledgement clock and content-action deadlines shown here model the IT Rules 2021 flow for this prototype.</p>
      </section>

      {breached && caseData.stage !== "content_action_taken" && caseData.stage !== "escalated_to_ncrp" ? <section className="border-2 border-[var(--warning)] bg-[var(--warning-soft)] p-4 sm:p-5" aria-labelledby="takedown-escalation-heading"><div className="flex items-start gap-3"><AlertTriangle aria-hidden="true" className="mt-1 shrink-0 text-[var(--warning-dark)]" size={30} /><div><p className="eyebrow text-[var(--warning-dark)]">Platform deadline missed</p><h2 id="takedown-escalation-heading" className="m-0 mt-1 text-2xl">Your evidence is ready to escalate.</h2><p className="mb-0 mt-2 text-sm leading-6 text-[var(--muted)]">The generated note includes the platform, acknowledgement, incident type, missed deadline, and preserved evidence list.</p></div></div><button className="button-primary mt-5 w-full sm:w-auto" type="button" disabled={busy !== null} onClick={escalate}><ShieldAlert aria-hidden="true" size={20} /> {busy === "escalate" ? "Preparing escalation note…" : "Escalate to NCRP / police"}</button></section> : null}

      <section className="panel" aria-labelledby="takedown-stages-heading"><p className="eyebrow">Takedown tracker</p><h2 id="takedown-stages-heading" className="m-0 mt-1 text-2xl">Every platform hand-off has a deadline.</h2><ol className="mt-5 grid list-none gap-0 p-0">{takedownStages.map((stage, index) => { const current = caseData.stage === stage; const recorded = caseData.history.some((event) => event.stage === stage); const complete = recorded && !current; const meta = takedownStageMeta[stage]; const sla = stage === "reported_to_platform" ? "24 hours to acknowledge" : stage === "platform_acknowledged" ? harmMeta.actionSlaLabel : stage === "content_action_taken" ? "Action recorded" : "Available after a missed SLA"; return <li className="grid grid-cols-[2rem_1fr] gap-3" key={stage}><div className="flex flex-col items-center"><span className={`grid size-7 place-items-center border-2 ${complete ? "border-[var(--safe)] bg-[var(--safe)] text-white" : current ? "border-[var(--primary)] bg-[var(--blue-soft)] text-[var(--primary)]" : "border-[var(--line-strong)] bg-white text-[var(--line-strong)]"}`}>{complete ? <Check aria-hidden="true" size={17} /> : <Circle aria-hidden="true" size={11} fill={current ? "currentColor" : "none"} />}</span>{index < takedownStages.length - 1 ? <span className={`min-h-12 w-0.5 flex-1 ${complete ? "bg-[var(--safe)]" : "bg-[var(--line)]"}`} /> : null}</div><div className="pb-5"><strong className={current ? "text-[var(--primary)]" : ""}>{meta.label}</strong><p className="m-0 mt-1 text-sm leading-6 text-[var(--muted)]">{meta.meaning}</p><p className="m-0 mt-1 text-xs font-black uppercase tracking-[0.04em] text-[var(--muted)]">{sla}</p></div></li>; })}</ol></section>

      <section className="panel bg-[var(--blue-soft)]" aria-labelledby="social-sla-heading"><p className="eyebrow">Two clocks, shown separately</p><h2 id="social-sla-heading" className="m-0 mt-1 text-2xl">The content type sets the tighter deadline.</h2><dl className="mt-4 grid gap-px bg-[var(--line-strong)] sm:grid-cols-2"><div className="bg-white p-3"><dt className="text-sm font-black">Platform acknowledgement</dt><dd className="m-0 mt-1 text-sm text-[var(--muted)]">24 hours after the report</dd></div><div className="bg-white p-3"><dt className="text-sm font-black">Content action for this case</dt><dd className="m-0 mt-1 text-sm text-[var(--muted)]">{harmMeta.actionSlaLabel}{caseData.harm === "ncii" ? " — the tighter intimate-image clock applies" : ""}</dd></div></dl></section>

      <section className="panel" aria-labelledby="preserved-evidence-heading"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Preserved before blocking</p><h2 id="preserved-evidence-heading" className="m-0 mt-1 text-2xl">Evidence checklist</h2></div><span className="status-pill text-[var(--safe)]">{completedEvidence} of {evidenceChecklistItems.length} marked</span></div><ul className="mt-4 grid list-none gap-2 p-0">{evidenceChecklistItems.map((item) => <li className={`flex min-h-14 items-start gap-3 border-2 p-3 ${caseData.evidence[item.id] ? "border-[var(--safe)] bg-[var(--safe-soft)]" : "border-[var(--line)] bg-white"}`} key={item.id}>{caseData.evidence[item.id] ? <Check aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--safe)]" size={21} /> : <Circle aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--line-strong)]" size={21} />}<span><strong className="block">{item.label}</strong><span className="mt-1 block text-sm leading-6 text-[var(--muted)]">{caseData.evidence[item.id] ? "Marked as preserved on this device." : "Not marked; the report can still proceed."}</span></span></li>)}</ul></section>

      <section className="panel" aria-labelledby="social-document-heading"><p className="eyebrow">Generated from this report</p><h2 id="social-document-heading" className="m-0 mt-1 text-2xl">Platform Grievance Officer report</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Filled for {caseData.grievanceReport.recipient}. It can be reviewed, printed, or saved as PDF.</p><Link className="button-primary mt-3" href={`/case/takedown/${caseData.acknowledgement}/documents/grievance-report`}><FileText aria-hidden="true" size={20} /> Open filled report <ArrowRight aria-hidden="true" size={18} /></Link></section>

      <section className="panel" aria-labelledby="takedown-timeline-heading"><p className="eyebrow">One chronological record</p><h2 id="takedown-timeline-heading" className="m-0 mt-1 text-2xl">Everything that happened</h2><ol className="mt-5 grid list-none gap-0 p-0">{timeline.map((event, index) => <li className="grid grid-cols-[2rem_1fr] gap-3" key={event.id}><div className="flex flex-col items-center"><span className={`grid size-7 place-items-center border-2 ${event.kind === "warning" ? "border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--warning-dark)]" : event.kind === "document" ? "border-[var(--primary)] bg-[var(--blue-soft)] text-[var(--primary)]" : "border-[var(--safe)] bg-[var(--safe-soft)] text-[var(--safe)]"}`}>{event.kind === "document" ? <FileText aria-hidden="true" size={15} /> : event.kind === "warning" ? <AlertTriangle aria-hidden="true" size={15} /> : <Check aria-hidden="true" size={15} />}</span>{index < timeline.length - 1 ? <span className="min-h-12 w-0.5 flex-1 bg-[var(--line)]" /> : null}</div><div className="pb-5"><time className="text-xs font-black uppercase text-[var(--muted)]" dateTime={event.occurredAt}>{formatDateTime(event.occurredAt)}</time><strong className="mt-1 block">{event.title}</strong><p className="m-0 mt-1 text-sm leading-6 text-[var(--muted)]">{event.detail}</p></div></li>)}</ol></section>

      <section className="border-2 border-dashed border-[var(--line-strong)] bg-white p-4"><p className="eyebrow">Demo control</p><h2 className="m-0 mt-1 text-xl">Walk the citizen-visible platform state.</h2><p className="text-sm leading-6 text-[var(--muted)]">This simulates a platform action. It does not contact the platform, NCRP, or police.</p>{nextStage ? <button className="button-primary" type="button" disabled={busy !== null} onClick={advance}>{busy === "advance" ? "Updating the mock platform…" : `Advance to ${takedownStageMeta[nextStage].label}`} <ArrowRight aria-hidden="true" size={18} /></button> : <span className="status-pill text-[var(--safe)]">No further mock platform step</span>}</section>
    </div>
  );
}
