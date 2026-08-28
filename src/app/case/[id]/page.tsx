import Link from "next/link";
import { notFound } from "next/navigation";
import { banks, getLiveComplaints } from "@/lib/mock/fixtures";
import { getLiveTrustCase } from "@/lib/mock/trust-cases";
import { LiveCaseFile } from "@/components/live-case-file";

type Props = { params: Promise<{ id: string }> };

export default async function CaseDetailPage({ params }: Props) {
  const { id } = await params;
  const complaint = getLiveComplaints().find((item) => item.id === id);
  const trustCase = getLiveTrustCase(id);
  if (!complaint || !trustCase) notFound();

  return <div className="page-wrap"><div className="mb-6"><Link className="text-sm font-black text-[#0b2b4c]" href="/case">← All cases</Link><p className="eyebrow mt-5">Live case file · {complaint.id}</p><h1 className="page-title">{complaint.subcategory}</h1><p className="lede">₹{complaint.amount.toLocaleString("en-IN")} reported through {complaint.rail}. Routed to {complaint.district}, {complaint.state}. A complaint is not an FIR.</p></div><LiveCaseFile complaint={complaint} trustCase={trustCase} banks={banks} /></div>;
}
