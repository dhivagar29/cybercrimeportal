import { GoldenHourHandoff } from "@/components/golden-hour-handoff";
import { ReportBuilder } from "@/components/report-builder";

export const metadata = { title: "Report or track a case" };

export default function ReportPage() {
  return (
    <div className="page-wrap">
      <p className="eyebrow">Build the case</p>
      <h1 className="page-title">Report without knowing the form.</h1>
      <p className="lede">Describe what happened in plain words. Reclaim suggests the NCRP classification, extracts identifiers, and drafts the statutory form. You check every fact.</p>
      <GoldenHourHandoff />
      <div className="mt-7"><ReportBuilder /></div>
    </div>
  );
}
