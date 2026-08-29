"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PrintDocumentButton } from "@/components/print-document-button";
import { analyzeSocialNarrative } from "@/lib/engine";
import { getLiveTakedownCase } from "@/lib/mock/takedown-cases";
import { useSafety } from "@/lib/safety";
import {
  evidenceChecklistItems,
  platformMeta,
  takedownCaseStorageKey,
  takedownHarmMeta,
  type SavedTakedownCase,
} from "@/lib/takedown";

function safeCase(raw: string | null): SavedTakedownCase | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedTakedownCase;
    return parsed.version === 1 && parsed.acknowledgement?.startsWith("2") ? parsed : null;
  } catch {
    return null;
  }
}

export function TakedownGrievanceDocument({ acknowledgement }: { acknowledgement: string }) {
  const { clearRevision, privateMode, readSensitiveItem } = useSafety();
  const [caseData, setCaseData] = useState<SavedTakedownCase | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = safeCase(readSensitiveItem(takedownCaseStorageKey(acknowledgement)));
      const seeded = saved ? null : getLiveTakedownCase(acknowledgement, Date.now());
      setCaseData(saved ?? (seeded ? { ...seeded, version: 1 } : null));
      setResolved(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [acknowledgement, clearRevision, readSensitiveItem]);

  if (!resolved) return <div className="document-page mx-auto max-w-4xl px-4 py-8"><div className="panel" role="status"><strong>Filling the saved grievance report…</strong></div></div>;
  if (!caseData) return <div className="page-wrap"><section className="panel"><p className="eyebrow">Document not found {privateMode ? "in this tab" : "on this device"}</p><h1 className="mt-2 text-3xl">The anonymous report is not available here.</h1><Link className="button-primary mt-4" href="/case">Return to cases</Link></section></div>;

  const platform = platformMeta[caseData.platform];
  const harm = takedownHarmMeta[caseData.harm];
  const analysis = analyzeSocialNarrative(caseData.narrative, caseData.harm);
  const preserved = evidenceChecklistItems.filter((item) => caseData.evidence[item.id]);
  const contentDeadline = caseData.harm === "ncii" ? "24 hours" : "15 days";

  return (
    <div className="document-page mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <div className="print-hidden mb-5 flex flex-wrap items-center justify-between gap-3"><Link className="button-secondary" href={`/case/takedown/${caseData.acknowledgement}`}>← Back to takedown case</Link><PrintDocumentButton /></div>
      <article className="document-sheet border border-[#7c8792] bg-white p-5 text-[0.95rem] leading-7 shadow-lg sm:p-10">
        <div className="border-b-2 border-[var(--primary)] pb-5"><p className="m-0 text-xs font-black uppercase tracking-[0.12em] text-[var(--primary)]">Independent hackathon prototype · mock document</p><h1 className="mb-0 mt-3 text-3xl leading-tight">{caseData.grievanceReport.title}</h1><p className="mb-0 mt-2 font-mono text-sm">Anonymous/citizen acknowledgement: {caseData.acknowledgement}</p></div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2"><div><strong>To</strong><p className="m-0">The Grievance Officer</p><p className="m-0">{caseData.grievanceReport.recipient}</p><p className="m-0">{platform.label}</p></div><div className="sm:text-right"><strong>Generated</strong><p className="m-0">{new Date(caseData.grievanceReport.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p></div></div>
        <p className="mt-7 border-y border-[#aeb8c2] py-3"><strong>Subject:</strong> {caseData.grievanceReport.subject}</p>
        <p>{caseData.anonymous ? "This report is submitted anonymously. No name, account, phone number, email address, or identity document was collected by this prototype." : "This report was prepared on the citizen's device without creating an account or uploading an identity document."}</p>
        <p>I report {harm.label.toLowerCase()} on {platform.label}. The locally generated classification is <strong>{analysis.category} → {analysis.subcategory}</strong>.</p>
        <div className="my-6 border-l-4 border-[var(--primary)] bg-[var(--blue-soft)] p-4"><strong>Citizen&apos;s account</strong><p className="mb-0 mt-2 whitespace-pre-wrap">{caseData.narrative}</p></div>
        {analysis.entities.length ? <div><p className="mb-2 font-black">Identifiers found in the account</p><ul className="mt-0 pl-5">{analysis.entities.map((item) => <li key={item.id}>{item.label}: <span className="font-mono">{item.value}</span></li>)}</ul></div> : null}
        <p>The report was prepared at {new Date(caseData.reportedAt).toLocaleString("en-IN")}. This prototype tracks a 24-hour platform acknowledgement window. For this incident type, it then tracks a <strong>{contentDeadline}</strong> content-action window{caseData.harm === "ncii" ? " because intimate images require the tighter clock" : ""}.</p>
        <p className="mb-2 font-black">I request that the platform:</p>
        <ol className="mt-0 pl-6"><li className="mb-2">Acknowledge this report and provide a dated platform reference within 24 hours.</li><li className="mb-2">Preserve the profile, content, login, and communication records relevant to this report.</li><li className="mb-2">Remove or restrict the reported content/account and record the action within {contentDeadline}.</li><li className="mb-2">Prevent repeat uploads or impersonating accounts where the platform&apos;s tools allow it.</li><li className="mb-2">Give the reporter a plain-language action-taken response suitable for a later NCRP or police escalation.</li></ol>
        <div className="mt-8 border-t border-[#aeb8c2] pt-5"><strong>Evidence preserved before blocking</strong>{preserved.length ? <ul className="mb-0 pl-5">{preserved.map((item) => <li key={item.id}>{item.label}</li>)}</ul> : <p className="mb-0 mt-2">No checklist item was marked. The platform should still review and preserve available account records.</p>}</div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2"><div><div className="h-12 border-b border-[#7c8792]" /><p className="mt-2">{caseData.anonymous ? "Anonymous report — signature intentionally omitted" : "Signature if the citizen chooses to provide one"}</p></div><div><div className="h-12 border-b border-[#7c8792]" /><p className="mt-2">Date and place</p></div></div>
        <p className="mt-8 border-2 border-dashed border-[#7c8792] p-3 text-xs leading-5">Prototype notice: this filled report is for the hackathon demonstration only. It has not been sent to {platform.label}, NCRP, police, or any public authority.</p>
      </article>
      <p className="print-hidden mt-4 text-center text-sm text-[var(--muted)]">Review the filled mock report, then use your browser&apos;s print dialog to save it as PDF.</p>
    </div>
  );
}
