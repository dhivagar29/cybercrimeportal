import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLiveComplaints } from "@/lib/mock/fixtures";
import { SubmittedCases } from "@/components/submitted-cases";
import { trustStageMeta } from "@/lib/case-trust";
import { getLiveTrustCase } from "@/lib/mock/trust-cases";
import { TakedownCaseList } from "@/components/takedown-case-list";


export const metadata = { title: "Live case file" };

export default function CasePage() {
  const complaints = getLiveComplaints().flatMap((complaint) => {
    const trustCase = getLiveTrustCase(complaint.id);
    return trustCase ? [{ complaint, trustCase }] : [];
  });
  return (
    <div className="page-wrap">
      <p className="eyebrow">Live case file</p>
      <h1 className="page-title">Know what is happening.</h1>
      <p className="lede">“Disposed” can mean handed to police, not resolved. Here, each operational and legal step is named.</p>
      <SubmittedCases />
      <div className="mt-6 grid gap-3">
        {complaints.map(({ complaint, trustCase }) => (
          <article className="panel grid gap-3 md:grid-cols-[1fr_auto] md:items-center" key={complaint.id}>
            <div><div className="flex flex-wrap items-center gap-2"><h2 className="m-0 text-lg">{complaint.id}</h2><span className="status-pill text-[#08745c]">{trustStageMeta[trustCase.initialStage].label}</span>{trustCase.legacyStatus ? <span className="status-pill text-[#9a6700]">Old NCRP label: Disposed</span> : null}</div><p className="mb-0 text-sm text-[#52606d]">{complaint.subcategory} · {complaint.district}, {complaint.state} · ₹{complaint.amount.toLocaleString('en-IN')}</p>{trustCase.legacyStatus ? <p className="mb-0 mt-2 text-xs font-black text-[#9a6700]">“Disposed” meant handed to local police—not resolved.</p> : null}</div>
            <Link className="button-secondary" href={`/case/${complaint.id}`}>Open case <ArrowRight aria-hidden="true" size={18} /></Link>
          </article>
        ))}
      </div>
      <TakedownCaseList />
    </div>
  );
}
