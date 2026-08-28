"use client";

import { ArrowRight, Check, Copy, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { suspects } from "@/lib/mock/fixtures";
import type { SuspectIdentifier } from "@/lib/mock/types";

function normalize(value: string) { return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[\s/()-]/g, ""); }

export function ScamCheck({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<SuspectIdentifier | "clear" | null>(null);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  async function check(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChecking(true);
    setResult(null);
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    const match = suspects.find((item) => normalize(item.value) === normalize(query));
    setResult(match ?? "clear"); setCopied(false); setChecking(false);
  }

  async function copyResult() {
    if (!result) return;
    const text = result === "clear" ? `SCAM CHECK — No reports yet for ${query} in this 25-item mock repository. That does not mean it is safe. Independent hackathon prototype.` : `SCAM WARNING — ${result.value}. Reported ${result.reports} times · ${result.pattern ?? "reported fraud pattern"} · first seen ${result.firstSeen ?? "July 2026"}. Seeded mock repository. Do not pay, install, or share OTPs.`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_0.8fr]">
      <form className="panel" onSubmit={check}>
        <label className="field-label text-xl" htmlFor="suspect-query">Number, UPI ID, URL, or APK name</label>
        <input id="suspect-query" className="field-control" required value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try verify2@paytm" />
        <div className="mt-3 flex flex-wrap gap-2"><button className="button-quiet" type="button" onClick={() => setQuery("verify2@paytm")}>Use reported UPI demo</button><button className="button-quiet" type="button" onClick={() => setQuery("trustedfriend@upi")}>Use no-match demo</button></div>
        <button className="button-primary mt-4 w-full" type="submit" disabled={checking}><Search aria-hidden="true" size={20} /> {checking ? "Checking the mock reports…" : "Check 25 mock identifiers"}</button>
      </form>
      <aside aria-live="polite">
        {checking ? <section className="panel bg-[var(--blue-soft)]" role="status"><Search aria-hidden="true" className="text-[var(--primary)]" size={30} /><h2 className="mb-0 mt-3 text-xl">Checking exact identifiers…</h2><p className="mb-0 mt-2 text-sm text-[var(--muted)]">Comparing only with the 25 seeded mock records on this device.</p></section> : result ? <ResultCard result={result} query={query} copied={copied} onCopy={copyResult} /> : <section className="panel bg-[var(--blue-soft)]"><h2 className="mt-0 text-xl">Check before you act.</h2><p className="mb-0 text-sm leading-6 text-[var(--muted)]">An exact match shows the mock report count. A no-match result still asks you to verify independently.</p></section>}
      </aside>
    </div>
  );
}

function ResultCard({ result, query, copied, onCopy }: { result: SuspectIdentifier | "clear"; query: string; copied: boolean; onCopy: () => void }) {
  const clear = result === "clear";
  const redFlags = ["Pause. Do not pay, install an APK, or approve a collect request.", "Call the organisation back using a number you found independently.", "Never share an OTP, PIN, or screen access with the caller.", "Preserve the number, payment ID, URL, chats, and screenshots."];
  return <section className={`border-2 p-4 ${clear ? "border-[var(--safe)] bg-[var(--safe-soft)]" : "border-[var(--warning)] bg-[var(--warning-soft)]"}`}><div className="flex items-center gap-3">{clear ? <ShieldCheck aria-hidden="true" size={34} className="text-[var(--safe)]" /> : <ShieldAlert aria-hidden="true" size={34} className="text-[var(--warning-dark)]" />}<div><p className="eyebrow m-0">Shareable scam check</p><h2 className="m-0 mt-1 text-2xl">{clear ? "No reports yet — that doesn’t mean it’s safe" : "High-risk match"}</h2></div></div><p className="my-4 break-all border-y-2 border-current py-4 text-xl font-black">{query}</p>{clear ? <p className="leading-6">No exact match in this 25-item fixture. A new or slightly changed identifier may not appear here.</p> : <><p className="m-0 text-3xl font-black">Reported {result.reports} times</p><p className="mt-2 font-black">{result.pattern ?? "Reported fraud pattern"} · first seen {result.firstSeen ?? "July 2026"}</p></>}<h3 className="mb-2 mt-5 text-lg">Red-flag checklist</h3><ul className="m-0 grid gap-2 p-0">{redFlags.map((flag) => <li className="flex gap-2 text-sm leading-6" key={flag}><Check aria-hidden="true" className="mt-1 shrink-0" size={17} /><span>{flag}</span></li>)}</ul><button className="button-secondary mt-4 w-full" type="button" onClick={onCopy}>{copied ? <Check aria-hidden="true" size={19} /> : <Copy aria-hidden="true" size={19} />}{copied ? "Copied — ready for WhatsApp" : "Copy result card"}</button><div className="mt-3 grid gap-2 sm:grid-cols-2"><Link className="button-primary" href="/golden-hour">Money sent? Stop loss now <ArrowRight aria-hidden="true" size={18} /></Link><Link className="button-secondary" href="/report">Build a report</Link></div><p className="mb-0 mt-3 text-xs">Seeded mock repository. Not a government watchlist.</p></section>;
}
