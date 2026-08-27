"use client";

import Link from "next/link";
import { Check, FileCheck2, RotateCcw, ScanSearch } from "lucide-react";
import { useEffect, useState } from "react";
import { analyzeNarrative, demoNarratives, type IntakeAnalysis } from "@/lib/engine";

const INTAKE_KEY = "cybercrimeportal:intake:v1";

export function DescribeIntake() {
  const [narrative, setNarrative] = useState("");
  const [analysis, setAnalysis] = useState<IntakeAnalysis | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = window.localStorage.getItem(INTAKE_KEY);
      if (!stored) return;
      const saved = JSON.parse(stored) as { narrative: string; analysis: IntakeAnalysis };
      setNarrative(saved.narrative);
      setAnalysis(saved.analysis);
      setConfirmed(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function analyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnalysis(analyzeNarrative(narrative));
    setConfirmed(false);
  }

  function confirm() {
    if (!analysis) return;
    window.localStorage.setItem(INTAKE_KEY, JSON.stringify({ narrative, analysis, confirmedAt: new Date().toISOString() }));
    setConfirmed(true);
  }

  function reset() {
    window.localStorage.removeItem(INTAKE_KEY);
    setNarrative("");
    setAnalysis(null);
    setConfirmed(false);
  }

  if (confirmed && analysis) {
    return (
      <section className="border-2 border-[#08745c] bg-[#eaf6f2] p-4" role="status">
        <FileCheck2 aria-hidden="true" size={36} className="text-[#08745c]" />
        <p className="eyebrow mt-3 text-[#08745c]">Facts confirmed</p>
        <h1 className="mt-1 text-2xl">Your case draft is saved on this device.</h1>
        <p className="leading-6 text-[#405363]">The complaint remains a complaint—not an FIR. The case file now shows what happens after routing.</p>
        <div className="mt-4 flex flex-wrap gap-3"><Link className="button-primary" href="/case/22026082709831">Open the live case file</Link><button className="button-quiet" type="button" onClick={reset}><RotateCcw aria-hidden="true" size={18} /> Describe another case</button></div>
      </section>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_0.7fr]">
      <form className="panel" onSubmit={analyze}>
        <label htmlFor="narrative" className="field-label text-xl">What happened?</label>
        <p id="narrative-help" className="mt-1 text-sm leading-5 text-[#52606d]">Write it as you would tell a family member. Include messages, payment references, numbers, or handles if you have them.</p>
        <textarea id="narrative" aria-describedby="narrative-help" className="field-control min-h-52 resize-y leading-6" required minLength={20} value={narrative} onChange={(event) => setNarrative(event.target.value)} placeholder="Example: I got a call saying my electricity would be disconnected…" />
        <div className="mt-4">
          <span className="block text-xs font-black uppercase tracking-[0.1em] text-[#52606d]">Load a reliable demo account</span>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <button className="button-quiet" type="button" onClick={() => setNarrative(demoNarratives.meena)}>Meena · investment</button>
            <button className="button-quiet" type="button" onClick={() => setNarrative(demoNarratives.arjun)}>Arjun · UPI call</button>
            <button className="button-quiet" type="button" onClick={() => setNarrative(demoNarratives.priya)}>Priya · digital arrest</button>
          </div>
        </div>
        <button className="button-primary mt-5 w-full" type="submit"><ScanSearch aria-hidden="true" size={21} /> Extract the facts on this device</button>
        <p className="mb-0 mt-3 text-center text-xs text-[#52606d]">Deterministic demo engine. No text leaves this browser. No live AI model is running.</p>
      </form>

      <aside aria-live="polite">
        {analysis ? (
          <div className="panel">
            <p className="eyebrow">Suggested NCRP classification</p>
            <h2 className="mb-1 mt-2 text-xl">{analysis.subcategory}</h2>
            <p className="m-0 text-sm text-[#52606d]">{analysis.category} · {analysis.confidence}% rules confidence</p>
            <p className="mt-4 border-y border-[#cbd5df] py-3 text-sm leading-6">{analysis.summary}</p>
            <h3 className="text-base">Facts found</h3>
            {analysis.fields.length ? <dl className="grid gap-2">{analysis.fields.map((item, index) => <div className="grid grid-cols-[0.7fr_1fr] gap-2 border-b border-dashed border-[#cbd5df] pb-2" key={`${item.kind}-${item.value}-${index}`}><dt className="text-sm font-black text-[#52606d]">{item.label}</dt><dd className="m-0 break-all text-sm font-black">{item.value}</dd></div>)}</dl> : <p className="text-sm text-[#52606d]">No payment identifiers found. The narrative can still be saved.</p>}
            <button className="button-primary mt-4 w-full" type="button" onClick={confirm}><Check aria-hidden="true" size={20} /> This is correct — save draft</button>
            <button className="button-quiet mt-2 w-full" type="button" onClick={() => setAnalysis(null)}>Edit my account</button>
          </div>
        ) : (
          <div className="panel bg-[#edf4fa]"><h2 className="mt-0 text-xl">You describe. The form follows.</h2><p className="mb-0 text-sm leading-6 text-[#52606d]">The local engine looks for category clues, amounts, UTRs, UPI IDs, phone numbers, handles, and URLs. You confirm every field before it becomes part of the draft.</p></div>
        )}
      </aside>
    </div>
  );
}
