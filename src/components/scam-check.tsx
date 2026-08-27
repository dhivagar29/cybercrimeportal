"use client";

import { Check, Copy, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { suspects } from "@/lib/mock/fixtures";
import type { SuspectIdentifier } from "@/lib/mock/types";

function normalize(value: string) { return value.trim().toLowerCase().replaceAll(" ", ""); }

export function ScamCheck() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SuspectIdentifier | "clear" | null>(null);
  const [copied, setCopied] = useState(false);

  function check(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const match = suspects.find((item) => normalize(item.value) === normalize(query));
    setResult(match ?? "clear"); setCopied(false);
  }

  async function copyResult() {
    if (!result) return;
    const text = result === "clear" ? `SCAM CHECK — No exact match for ${query} in this 25-item mock repository. Absence is not proof of safety. Independent hackathon prototype.` : `SCAM WARNING — ${result.value}. ${result.reports} reports in the last 30 days. Seeded mock repository. Do not pay, install, or share OTPs. Independent hackathon prototype.`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_0.8fr]">
      <form className="panel" onSubmit={check}>
        <label className="field-label text-xl" htmlFor="suspect-query">Number, UPI ID, URL, or APK name</label>
        <input id="suspect-query" className="field-control" required value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try verify2@paytm" />
        <div className="mt-3 flex flex-wrap gap-2"><button className="button-quiet" type="button" onClick={() => setQuery("verify2@paytm")}>Use reported UPI demo</button><button className="button-quiet" type="button" onClick={() => setQuery("trustedfriend@upi")}>Use no-match demo</button></div>
        <button className="button-primary mt-4 w-full" type="submit"><Search aria-hidden="true" size={20} /> Check 25 mock identifiers</button>
      </form>
      <aside aria-live="polite">
        {result ? <section className={`border-2 p-4 ${result === "clear" ? "border-[var(--safe)] bg-[var(--safe-soft)]" : "border-[var(--warning)] bg-[var(--warning-soft)]"}`}><div className="flex items-center gap-3">{result === "clear" ? <ShieldCheck aria-hidden="true" size={34} className="text-[var(--safe)]" /> : <ShieldAlert aria-hidden="true" size={34} className="text-[var(--warning-dark)]" />}<div><p className="eyebrow m-0">Shareable scam check</p><h2 className="m-0 mt-1 text-2xl">{result === "clear" ? "No exact mock match" : "High-risk match"}</h2></div></div><p className="my-4 break-all border-y-2 border-current py-4 text-xl font-black">{query}</p>{result === "clear" ? <p className="leading-6">No exact match in this 25-item fixture. Absence is not proof of safety. Verify through an official channel before acting.</p> : <><p className="m-0 text-4xl font-black">{result.reports}</p><p className="mt-1 font-black">reports in the last 30 days.</p><p className="text-sm leading-5">Do not pay, install an APK, share an OTP, or allow screen access.</p></>}<button className="button-secondary mt-3 w-full" type="button" onClick={copyResult}>{copied ? <Check aria-hidden="true" size={19} /> : <Copy aria-hidden="true" size={19} />}{copied ? "Copied — ready for WhatsApp" : "Copy result card"}</button><p className="mb-0 mt-3 text-xs">Seeded mock repository. Not a government watchlist.</p></section> : <section className="panel bg-[var(--blue-soft)]"><h2 className="mt-0 text-xl">Check before you act.</h2><p className="mb-0 text-sm leading-6 text-[var(--muted)]">An exact match shows the mock report count. A no-match result still asks you to verify independently.</p></section>}
      </aside>
    </div>
  );
}
