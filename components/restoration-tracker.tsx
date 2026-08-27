"use client";

import { Check, Clock3, FileSignature, Landmark, Scale, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { banks, complaintFixtures } from "@/src/lib/mock/fixtures";

const ORDER_KEY = "cybercrimeportal:restoration-order:v1";

function formatClock(ms: number) {
  const safe = Math.max(0, ms);
  const days = Math.floor(safe / 86_400_000);
  const hours = Math.floor((safe % 86_400_000) / 3_600_000);
  const minutes = Math.floor((safe % 3_600_000) / 60_000);
  return `${days}d ${hours}h ${minutes}m`;
}

export function RestorationTracker() {
  const [caseId, setCaseId] = useState(complaintFixtures[1].id);
  const [drafted, setDrafted] = useState(false);
  const [orderReceivedAt, setOrderReceivedAt] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setNow(Date.now());
      const requested = new URLSearchParams(window.location.search).get("case");
      if (requested && complaintFixtures.some((item) => item.id === requested)) setCaseId(requested);
      setOrderReceivedAt(window.localStorage.getItem(ORDER_KEY));
    });
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => { window.cancelAnimationFrame(frame); window.clearInterval(timer); };
  }, []);

  const complaint = complaintFixtures.find((item) => item.id === caseId) ?? complaintFixtures[1];
  const beneficiaryBank = banks.find((bank) => bank.id === complaint.beneficiaryBankId);
  const directCustody = complaint.amount < 50_000;
  const executionDeadline = orderReceivedAt ? new Date(orderReceivedAt).getTime() + 15 * 86_400_000 : null;

  function startExecutionClock() {
    const receivedAt = new Date().toISOString();
    window.localStorage.setItem(ORDER_KEY, receivedAt);
    setOrderReceivedAt(receivedAt);
  }

  return (
    <div className="grid gap-5">
      <label className="panel"><span className="field-label">Choose a mock complaint</span><select className="field-control" value={caseId} onChange={(event) => { setCaseId(event.target.value); setDrafted(false); }}>{complaintFixtures.map((item) => <option value={item.id} key={item.id}>{item.id} · {item.subcategory} · ₹{item.amount.toLocaleString("en-IN")}</option>)}</select></label>

      <section className="panel" aria-labelledby="money-location">
        <p className="eyebrow">Money location</p><h2 id="money-location" className="mt-1 text-2xl">₹{complaint.holdAmount.toLocaleString("en-IN")} is marked at {beneficiaryBank?.name ?? "the beneficiary bank"}.</h2>
        <div className="mt-5 grid gap-0 md:grid-cols-3">
          <div className="border-2 border-[#cbd5df] p-3"><WalletCards aria-hidden="true" className="text-[#0b2b4c]" /><strong className="mt-2 block">Your bank</strong><span className="text-sm text-[#52606d]">Transfer reference {complaint.reference}</span></div>
          <div className="border-x-2 border-b-2 border-[#cbd5df] p-3 md:border-y-2 md:border-l-0"><span className="status-pill text-[#08745c]">Trace active</span><strong className="mt-2 block">Mock CFCFRMS chain</strong><span className="text-sm text-[#52606d]">Complaint and beneficiary trail linked.</span></div>
          <div className="border-x-2 border-b-2 border-[#08745c] bg-[#eaf6f2] p-3 md:border-y-2 md:border-l-0"><Landmark aria-hidden="true" className="text-[#08745c]" /><strong className="mt-2 block">{beneficiaryBank?.name}</strong><span className="text-sm text-[#52606d]">Held money is not yet returned.</span></div>
        </div>
      </section>

      <section className={`border-2 p-4 ${directCustody ? "border-[#08745c] bg-[#eaf6f2]" : "border-[#9a6700] bg-[#fff8e8]"}`}>
        <Scale aria-hidden="true" size={30} className={directCustody ? "text-[#08745c]" : "text-[#9a6700]"} />
        <p className="eyebrow mt-3">Legal release path</p>
        <h2 className="mt-1 text-2xl">{directCustody ? "Direct interim custody request" : "FIR linkage required first"}</h2>
        <p className="leading-6 text-[#52606d]">{directCustody ? "The reported amount is under ₹50,000. This demo prepares a direct interim custody request under Section 106(3) BNSS." : "The reported amount is ₹50,000 or more. Link the complaint to an FIR before seeking interim custody of the held amount."}</p>
        <button className="button-primary" type="button" onClick={() => setDrafted(true)}><FileSignature aria-hidden="true" size={20} /> Draft application and bond</button>
      </section>

      {drafted ? <section className="panel" aria-live="polite"><p className="eyebrow">Documents drafted</p><h2 className="mt-1 text-2xl">Ready to review—not filed.</h2><details className="border-t-2 border-[#cbd5df] py-3" open><summary className="cursor-pointer font-black">Interim custody application</summary><div className="mt-3 whitespace-pre-line bg-[#f6f8fa] p-3 text-sm leading-6">{`To the competent authority,\n\nI request interim custody of ₹${complaint.holdAmount.toLocaleString("en-IN")} presently marked at ${beneficiaryBank?.name}. Complaint acknowledgement: ${complaint.id}. Payment reference: ${complaint.reference}.\n\nThis is a mock draft and requires legal review before use.`}</div></details><details className="border-t-2 border-[#cbd5df] py-3"><summary className="cursor-pointer font-black">Indemnity bond</summary><div className="mt-3 whitespace-pre-line bg-[#f6f8fa] p-3 text-sm leading-6">{`I undertake to return the released sum if directed by a competent court and to cooperate with the investigation connected to acknowledgement ${complaint.id}.\n\nMock draft — no signature or legal effect.`}</div></details><button className="button-secondary mt-3" type="button" onClick={() => window.print()}>Print mock drafts</button></section> : null}

      <section className="panel panel-dark"><Clock3 aria-hidden="true" className="text-[#9dd8ff]" /><p className="eyebrow mt-3 text-[#9dd8ff]">Bank execution clock</p>{orderReceivedAt && executionDeadline ? <><h2 className="mt-1 text-3xl font-mono">{formatClock(executionDeadline - now)}</h2><p className="text-[#d7e8f5]">remaining in the mock 15-day bank execution window.</p><p className="mb-0 inline-flex items-center gap-2 bg-[#08745c] px-3 py-2 text-sm font-black"><Check aria-hidden="true" size={18} /> Mock order received {new Date(orderReceivedAt).toLocaleDateString("en-IN")}</p></> : <><h2 className="mt-1 text-2xl">Clock starts when the bank receives the order.</h2><p className="text-[#d7e8f5]">Drafting an application does not start this clock.</p><button className="button-primary" type="button" onClick={startExecutionClock}>Mark mock order received</button></>}</section>
    </div>
  );
}
