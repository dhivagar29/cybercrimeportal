import Link from "next/link";
import { notFound } from "next/navigation";
import { getBank, getLiveComplaints } from "@/src/lib/mock/fixtures";

type Props = { params: Promise<{ id: string }> };

export default async function CaseDetailPage({ params }: Props) {
  const { id } = await params;
  const complaint = getLiveComplaints().find((item) => item.id === id);
  if (!complaint) notFound();
  const bank = getBank(complaint.beneficiaryBankId);

  return (
    <div className="page-wrap">
      <p className="eyebrow">Live case file · {complaint.id}</p>
      <h1 className="page-title">{complaint.subcategory}</h1>
      <p className="lede">₹{complaint.amount.toLocaleString("en-IN")} reported through {complaint.rail}. Routed to {complaint.district}, {complaint.state}.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="panel"><span className="eyebrow">Current stage</span><strong className="mt-2 block text-xl capitalize">{complaint.stage.replaceAll("_", " ")}</strong></div>
        <div className="panel"><span className="eyebrow">Money held</span><strong className="mt-2 block text-xl">₹{complaint.holdAmount.toLocaleString("en-IN")}</strong><span className="text-sm text-[#52606d]">{bank?.name ?? "Bank trace pending"}</span></div>
        <div className="panel"><span className="eyebrow">Payment reference</span><strong className="mt-2 block break-all font-mono text-base">{complaint.reference}</strong></div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3"><Link className="button-secondary" href="/case">All cases</Link><Link className="button-primary" href={`/restore?case=${complaint.id}`}>Track this money</Link></div>
    </div>
  );
}
