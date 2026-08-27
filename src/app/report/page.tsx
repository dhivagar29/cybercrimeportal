import { ArrowRight, FileText, FolderSearch } from "lucide-react";
import Link from "next/link";
import { GoldenHourHandoff } from "@/components/golden-hour-handoff";

export const metadata = { title: "Report or track a case" };

export default function ReportPage() {
  return (
    <div className="page-wrap">
      <p className="eyebrow">Build the case</p>
      <h1 className="page-title">Report without knowing the form.</h1>
      <p className="lede">Describe what happened in plain words, or open an existing mock case. Reclaim handles the category and identifiers; the citizen confirms the draft.</p>
      <GoldenHourHandoff />
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <section className="panel"><FileText aria-hidden="true" size={36} className="text-[var(--primary)]" /><h2 className="mb-2 text-2xl">Start or resume a report</h2><p className="min-h-16 text-sm leading-6 text-[var(--muted)]">Use the deterministic on-device intake to extract amounts, UPI IDs, references, phone numbers, and URLs.</p><Link className="button-primary mt-3 w-full" href="/describe">Describe what happened <ArrowRight aria-hidden="true" size={20} /></Link></section>
        <section className="panel"><FolderSearch aria-hidden="true" size={36} className="text-[var(--primary)]" /><h2 className="mb-2 text-2xl">Track a filed case</h2><p className="min-h-16 text-sm leading-6 text-[var(--muted)]">See the district route, assigned officer stage, bank hold, FIR linkage, custody request, and restoration.</p><Link className="button-secondary mt-3 w-full" href="/case">Open mock cases <ArrowRight aria-hidden="true" size={20} /></Link></section>
      </div>
      <aside className="mt-5 border-l-4 border-[var(--primary)] bg-[var(--blue-soft)] p-4 text-sm leading-6"><strong>A complaint is not an FIR.</strong> Reclaim keeps those milestones separate so “filed” never looks like “investigation complete.”</aside>
    </div>
  );
}
