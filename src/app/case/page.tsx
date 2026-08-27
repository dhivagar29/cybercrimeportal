import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLiveComplaints } from "@/lib/mock/fixtures";
import { SubmittedCases } from "@/components/submitted-cases";

const stageLabel = { filed: 'Filed', routed: 'Routed to district', assigned: 'Assigned to IO', hold_placed: 'Hold placed', fir_linked: 'FIR linked', custody_applied: 'Interim custody applied', restored: 'Money restored' } as const;

export const metadata = { title: "Live case file" };

export default function CasePage() {
  const complaints = getLiveComplaints();
  return (
    <div className="page-wrap">
      <p className="eyebrow">Live case file</p>
      <h1 className="page-title">Know what is happening.</h1>
      <p className="lede">“Disposed” can mean handed to police, not resolved. Here, each operational and legal step is named.</p>
      <SubmittedCases />
      <div className="mt-6 grid gap-3">
        {complaints.map((complaint) => (
          <article className="panel grid gap-3 md:grid-cols-[1fr_auto] md:items-center" key={complaint.id}>
            <div><div className="flex flex-wrap items-center gap-2"><h2 className="m-0 text-lg">{complaint.id}</h2><span className="status-pill text-[#08745c]">{stageLabel[complaint.stage]}</span>{complaint.citizenId === "citizen-priya" ? <span className="status-pill text-[#9a6700]">NCRP label: Disposed</span> : null}</div><p className="mb-0 text-sm text-[#52606d]">{complaint.subcategory} · {complaint.district}, {complaint.state} · ₹{complaint.amount.toLocaleString('en-IN')}</p>{complaint.citizenId === "citizen-priya" ? <p className="mb-0 mt-2 text-xs font-black text-[#9a6700]">“Disposed” means handed to local police here—not resolved.</p> : null}</div>
            <Link className="button-secondary" href={`/case/${complaint.id}`}>Open case <ArrowRight aria-hidden="true" size={18} /></Link>
          </article>
        ))}
      </div>
    </div>
  );
}
