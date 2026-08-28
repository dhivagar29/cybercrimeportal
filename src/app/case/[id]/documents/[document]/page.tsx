import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintDocumentButton } from "@/components/print-document-button";
import { buildCaseDocument } from "@/lib/case-documents";
import { caseDocumentTypes, documentMeta, type CaseDocumentType } from "@/lib/case-trust";
import { getBank, getLiveComplaints } from "@/lib/mock/fixtures";
import { findPersona } from "@/lib/mock/personas";
import { getLiveTrustCase } from "@/lib/mock/trust-cases";

type Props = { params: Promise<{ id: string; document: string }> };

export default async function CaseDocumentPage({ params }: Props) {
  const { id, document } = await params;
  if (!caseDocumentTypes.includes(document as CaseDocumentType)) notFound();
  const type = document as CaseDocumentType;
  const complaint = getLiveComplaints().find((item) => item.id === id);
  const trustCase = getLiveTrustCase(id);
  if (!complaint || !trustCase) notFound();
  const persona = findPersona(complaint.citizenId);
  if (!persona) notFound();
  const sourceBank = getBank(complaint.sourceBankId);
  const holdBanks = trustCase.bankHolds.flatMap((hold) => { const bank = getBank(hold.bankId); return bank ? [{ bank, amount: hold.amount }] : []; });
  const filled = buildCaseDocument(type, { complaint, trustCase, persona, sourceBank, holdBanks });

  return (
    <div className="document-page mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <div className="print-hidden mb-5 flex flex-wrap items-center justify-between gap-3"><Link className="button-secondary" href={`/case/${id}`}>← Back to case</Link><PrintDocumentButton /></div>
      <article className="document-sheet border border-[#7c8792] bg-white p-5 text-[0.95rem] leading-7 shadow-lg sm:p-10">
        <div className="border-b-2 border-[var(--primary)] pb-5"><p className="m-0 text-xs font-black uppercase tracking-[0.12em] text-[var(--primary)]">Independent hackathon prototype · mock document</p><h1 className="mb-0 mt-3 text-3xl leading-tight">{filled.title}</h1><p className="mb-0 mt-2 font-mono text-sm">NCRP acknowledgement: {id}</p></div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2"><div><strong>To</strong>{filled.addressee.map((line) => <p className="m-0" key={line}>{line}</p>)}</div><div className="sm:text-right"><strong>Date</strong><p className="m-0">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p></div></div>
        <p className="mt-7 border-y border-[#aeb8c2] py-3"><strong>Subject:</strong> {filled.subject}</p>
        <p>{filled.opening}</p>
        {filled.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <p className="mb-2 font-black">I request that you:</p><ol className="mt-0 pl-6">{filled.requests.map((request) => <li className="mb-2" key={request}>{request}</li>)}</ol>
        <p>{filled.closing}</p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2"><div><div className="h-12 border-b border-[#7c8792]" /><p className="mt-2">Signature / thumb impression</p></div><div><div className="h-12 border-b border-[#7c8792]" /><p className="mt-2">Date and place</p></div></div>
        <div className="mt-8 border-t border-[#aeb8c2] pt-5"><strong>Attachments</strong><ul className="mb-0 pl-5">{filled.attachments.map((attachment) => <li key={attachment}>{attachment}</li>)}</ul></div>
        <p className="mt-8 border-2 border-dashed border-[#7c8792] p-3 text-xs leading-5">Prototype notice: this filled document is for the hackathon demonstration only. It has not been sent to a bank, police station, court, or public authority.</p>
      </article>
      <p className="print-hidden mt-4 text-center text-sm text-[var(--muted)]">{documentMeta[type].description}</p>
    </div>
  );
}
