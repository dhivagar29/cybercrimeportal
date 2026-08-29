"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  EyeOff,
  FileText,
  LockKeyhole,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeSocialNarrative, type SocialNarrativeAnalysis } from "@/lib/engine";
import { makeAcknowledgement } from "@/lib/report";
import {
  emptyEvidenceChecklist,
  evidenceChecklistItems,
  platformMeta,
  TAKEDOWN_CASES_KEY,
  TAKEDOWN_DRAFT_KEY,
  takedownCaseStorageKey,
  takedownHarms,
  takedownHarmMeta,
  takedownPlatforms,
  type EvidenceChecklistId,
  type SavedTakedownCase,
  type SavedTakedownDraft,
  type TakedownHarm,
  type TakedownPlatform,
} from "@/lib/takedown";

const steps = ["mode", "platform", "harm", "guidance", "describe", "review", "submitted"] as const;
const stepHeadingStyle = { outline: "none" } as const;

const blankDraft: SavedTakedownDraft = {
  version: 1,
  step: "mode",
  anonymous: null,
  platform: null,
  harm: null,
  evidence: { ...emptyEvidenceChecklist },
  narrative: "",
};

function safeDraft(raw: string | null): SavedTakedownDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedTakedownDraft;
    if (parsed.version !== 1 || !steps.includes(parsed.step)) return null;
    if (parsed.platform && !takedownPlatforms.includes(parsed.platform)) return null;
    if (parsed.harm && !takedownHarms.includes(parsed.harm)) return null;
    return {
      ...blankDraft,
      ...parsed,
      evidence: { ...emptyEvidenceChecklist, ...parsed.evidence },
    };
  } catch {
    return null;
  }
}

function safeCaseList(raw: string | null) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SavedTakedownCase[];
    return Array.isArray(parsed) ? parsed.filter((item) => item.version === 1 && item.acknowledgement?.startsWith("2")) : [];
  } catch {
    return [];
  }
}

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The flow remains usable when storage is unavailable; only resume is lost.
  }
}

function subjectFor(harm: TakedownHarm) {
  if (harm === "sextortion") return "Urgent sextortion report and request to preserve account records";
  if (harm === "ncii") return "Urgent removal of intimate images shared without consent";
  if (harm === "account_takeover") return "Hacked account recovery and preservation request";
  if (harm === "impersonation") return "Removal of impersonating profile and preservation request";
  return "Online threats report and request for platform action";
}

export function TakedownFlow() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [draft, setDraft] = useState<SavedTakedownDraft>(blankDraft);
  const [analysis, setAnalysis] = useState<SocialNarrativeAnalysis | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState<"analyse" | "submit" | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = safeDraft(readStorage(TAKEDOWN_DRAFT_KEY));
      if (stored) {
        setDraft(stored);
        if ((stored.step === "review" || stored.step === "submitted") && stored.harm && stored.narrative.trim()) {
          setAnalysis(analyzeSocialNarrative(stored.narrative, stored.harm));
        }
      }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStorage(TAKEDOWN_DRAFT_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    headingRef.current?.focus();
  }, [draft.step, hydrated]);

  const stepNumber = Math.min(6, steps.indexOf(draft.step) + 1);
  const selectedPlatform = draft.platform ? platformMeta[draft.platform] : null;
  const selectedHarm = draft.harm ? takedownHarmMeta[draft.harm] : null;
  const understood = useMemo(() => {
    if (analysis) return analysis;
    if (draft.harm && draft.narrative.trim()) return analyzeSocialNarrative(draft.narrative, draft.harm);
    return null;
  }, [analysis, draft.harm, draft.narrative]);

  function update(patch: Partial<SavedTakedownDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function choosePlatform(platform: TakedownPlatform) {
    update({ platform, step: "harm" });
  }

  function chooseHarm(harm: TakedownHarm) {
    update({ harm, step: "guidance" });
  }

  function toggleEvidence(id: EvidenceChecklistId) {
    setDraft((current) => ({
      ...current,
      evidence: { ...current.evidence, [id]: !current.evidence[id] },
    }));
  }

  async function analyseDescription() {
    if (!draft.harm || draft.narrative.trim().length < 10) return;
    setBusy("analyse");
    await new Promise((resolve) => window.setTimeout(resolve, 550));
    setAnalysis(analyzeSocialNarrative(draft.narrative, draft.harm));
    update({ step: "review" });
    setBusy(null);
  }

  async function submitReport() {
    if (!draft.platform || !draft.harm || !understood) return;
    setBusy("submit");
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    const now = new Date();
    const acknowledgement = makeAcknowledgement(now.getTime());
    const harmMeta = takedownHarmMeta[draft.harm];
    const platform = platformMeta[draft.platform];
    const savedCase: SavedTakedownCase = {
      version: 1,
      acknowledgement,
      anonymous: draft.anonymous === true,
      platform: draft.platform,
      harm: draft.harm,
      narrative: draft.narrative.trim(),
      category: harmMeta.category,
      subcategory: harmMeta.subcategory,
      reportedAt: now.toISOString(),
      stage: "reported_to_platform",
      stageStartedAt: now.toISOString(),
      evidence: { ...draft.evidence },
      grievanceReport: {
        id: `grievance-${acknowledgement}`,
        title: "Platform Grievance Officer report",
        recipient: platform.grievanceRecipient,
        subject: subjectFor(draft.harm),
        generatedAt: now.toISOString(),
        status: "generated",
      },
      history: [{
        stage: "reported_to_platform",
        occurredAt: now.toISOString(),
        detail: `${draft.anonymous ? "Anonymous report" : "Device-side report"} prepared for ${platform.label}. The 24-hour acknowledgement clock started.`,
      }],
    };
    writeStorage(takedownCaseStorageKey(acknowledgement), JSON.stringify(savedCase));
    const cases = safeCaseList(readStorage(TAKEDOWN_CASES_KEY));
    writeStorage(TAKEDOWN_CASES_KEY, JSON.stringify([savedCase, ...cases.filter((item) => item.acknowledgement !== acknowledgement)]));
    setDraft((current) => ({ ...current, acknowledgement, step: "submitted" }));
    setBusy(null);
  }

  function resetDraft() {
    try {
      window.localStorage.removeItem(TAKEDOWN_DRAFT_KEY);
    } catch {
      // Reset the in-memory flow even when device storage is unavailable.
    }
    setAnalysis(null);
    setDraft({ ...blankDraft, evidence: { ...emptyEvidenceChecklist } });
  }

  if (!hydrated) {
    return <section className="panel min-h-72" role="status"><p className="eyebrow">Stop the spread</p><h1 className="mt-2 text-3xl">Restoring your saved report…</h1><p className="text-[var(--muted)]">Your draft stays on this device.</p></section>;
  }

  if (draft.step === "submitted" && draft.acknowledgement && selectedPlatform && selectedHarm) {
    return (
      <section className="mx-auto grid min-h-[70dvh] max-w-3xl content-center gap-5" aria-labelledby="takedown-confirmation-heading">
        <div className="border-2 border-[var(--safe)] bg-[var(--safe-soft)] p-5 sm:p-8" role="status">
          <CheckCircle2 aria-hidden="true" className="text-[var(--safe)]" size={44} />
          <p className="eyebrow mt-5 text-[var(--safe)]">Report prepared</p>
          <h1 ref={headingRef} tabIndex={-1} style={stepHeadingStyle} id="takedown-confirmation-heading" className="mt-2 text-3xl leading-tight sm:text-4xl">Your evidence trail is recorded.</h1>
          <dl className="mt-6 grid gap-px bg-[#8cb8aa] sm:grid-cols-2">
            <div className="bg-white p-4"><dt className="text-xs font-black uppercase text-[var(--muted)]">Acknowledgement</dt><dd className="m-0 mt-1 break-all font-mono text-xl font-black">{draft.acknowledgement}</dd></div>
            <div className="bg-white p-4"><dt className="text-xs font-black uppercase text-[var(--muted)]">Mode</dt><dd className="m-0 mt-1 font-black">{draft.anonymous ? "Anonymous — no identity collected" : "Saved on this device"}</dd></div>
            <div className="bg-white p-4"><dt className="text-xs font-black uppercase text-[var(--muted)]">Platform</dt><dd className="m-0 mt-1 font-black">{selectedPlatform.label}</dd></div>
            <div className="bg-white p-4"><dt className="text-xs font-black uppercase text-[var(--muted)]">Incident type</dt><dd className="m-0 mt-1 font-black">{selectedHarm.shortLabel}</dd></div>
          </dl>
          <p className="mb-0 mt-4 text-sm leading-6"><strong>Prototype:</strong> this acknowledgement and report are stored only in this browser. No platform, NCRP, or police system was contacted.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link className="button-primary" href={`/case/takedown/${draft.acknowledgement}`}>Track takedown <ArrowRight aria-hidden="true" size={19} /></Link>
          <Link className="button-secondary" href={`/case/takedown/${draft.acknowledgement}/documents/grievance-report`}><FileText aria-hidden="true" size={19} /> Open grievance report</Link>
        </div>
        <button className="button-quiet w-full" type="button" onClick={resetDraft}>Start another report</button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl" aria-labelledby="takedown-heading">
      <div className="sticky top-0 z-10 mb-4 border-2 border-[var(--primary)] bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div><p className="m-0 text-xs font-black uppercase tracking-[0.08em] text-[var(--primary)]">Stop the spread · {stepNumber} of 6</p><p className="m-0 mt-1 text-sm font-bold">Preserve evidence first. Then report.</p></div>
          <ShieldAlert aria-hidden="true" className="shrink-0 text-[var(--primary)]" size={28} />
        </div>
      </div>

      <div className="border-2 border-[var(--primary)] bg-white p-5 sm:p-8">
        {draft.step === "mode" ? (
          <div>
            <p className="eyebrow">No login required</p>
            <h1 ref={headingRef} tabIndex={-1} style={stepHeadingStyle} id="takedown-heading" className="mt-2 text-3xl leading-tight sm:text-4xl">How do you want to make this report?</h1>
            <p className="mt-4 leading-7 text-[var(--muted)]">If sharing your identity feels unsafe, stay anonymous. This path will never ask for your name, phone, email, account, or ID.</p>
            <div className="mt-7 grid gap-3">
              <button className="min-h-20 w-full border-2 border-[var(--primary)] bg-[var(--primary)] px-4 text-left text-xl font-black text-white" type="button" onClick={() => update({ anonymous: true, step: "platform" })}><span className="flex items-center gap-3"><EyeOff aria-hidden="true" className="shrink-0" size={25} /> Report anonymously</span><span className="mt-2 block text-sm font-normal leading-6">No identity fields. You receive a 14-digit acknowledgement.</span></button>
              <button className="min-h-20 w-full border-2 border-[var(--line-strong)] bg-white px-4 text-left text-xl font-black hover:border-[var(--primary)] hover:bg-[var(--blue-soft)]" type="button" onClick={() => update({ anonymous: false, step: "platform" })}><span className="flex items-center gap-3"><LockKeyhole aria-hidden="true" className="shrink-0 text-[var(--primary)]" size={25} /> Continue on this device</span><span className="mt-2 block text-sm font-normal leading-6 text-[var(--muted)]">Still no account creation. This browser remembers your draft.</span></button>
            </div>
          </div>
        ) : null}

        {draft.step === "platform" ? (
          <div>
            <p className="eyebrow">Question 1 of 2</p>
            <h1 ref={headingRef} tabIndex={-1} style={stepHeadingStyle} id="takedown-heading" className="mt-2 text-3xl leading-tight sm:text-4xl">Where is it happening?</h1>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {takedownPlatforms.map((platform) => <ChoiceButton key={platform} onClick={() => choosePlatform(platform)}>{platformMeta[platform].label}</ChoiceButton>)}
            </div>
            <BackButton onClick={() => update({ step: "mode" })} />
          </div>
        ) : null}

        {draft.step === "harm" ? (
          <div>
            <p className="eyebrow">Question 2 of 2</p>
            <h1 ref={headingRef} tabIndex={-1} style={stepHeadingStyle} id="takedown-heading" className="mt-2 text-3xl leading-tight sm:text-4xl">What is happening?</h1>
            <div className="mt-7 grid gap-3">
              {takedownHarms.map((harm) => <ChoiceButton key={harm} onClick={() => chooseHarm(harm)}>{takedownHarmMeta[harm].label}</ChoiceButton>)}
            </div>
            <BackButton onClick={() => update({ step: "platform" })} />
          </div>
        ) : null}

        {draft.step === "guidance" && draft.harm && selectedPlatform ? (
          <GuidanceScreen
            headingRef={headingRef}
            harm={draft.harm}
            platform={draft.platform!}
            evidence={draft.evidence}
            onToggle={toggleEvidence}
            onContinue={() => update({ step: "describe" })}
            onBack={() => update({ step: "harm" })}
          />
        ) : null}

        {draft.step === "describe" && draft.harm ? (
          <div>
            <p className="eyebrow">Build the report</p>
            <h1 ref={headingRef} tabIndex={-1} style={stepHeadingStyle} id="takedown-heading" className="mt-2 text-3xl leading-tight sm:text-4xl">Tell us only what happened.</h1>
            <p className="mt-3 leading-7 text-[var(--muted)]">A few sentences are enough. Include the profile, phone number, or URL if you have it. Do not paste intimate images.</p>
            <label className="mt-6 block"><span className="field-label">Short description</span><textarea className="field-control min-h-44 resize-y text-lg leading-7" autoFocus maxLength={1200} value={draft.narrative} onChange={(event) => update({ narrative: event.target.value })} placeholder="Example: A fake Instagram account is pretending to be me and messaging my family…" /><span className="field-help">Analysed locally with fixed rules. Nothing is uploaded.</span></label>
            <button className="button-primary mt-5 w-full" type="button" disabled={draft.narrative.trim().length < 10 || busy !== null} onClick={analyseDescription}>{busy === "analyse" ? "Structuring your report…" : "Understand my report"} <ArrowRight aria-hidden="true" size={20} /></button>
            <BackButton onClick={() => update({ step: "guidance" })} />
          </div>
        ) : null}

        {draft.step === "review" && draft.harm && understood && selectedPlatform ? (
          <div>
            <p className="eyebrow">Check the draft</p>
            <h1 ref={headingRef} tabIndex={-1} style={stepHeadingStyle} id="takedown-heading" className="mt-2 text-3xl leading-tight sm:text-4xl">Here&apos;s what we understood.</h1>
            <div className="mt-5 border-2 border-[var(--primary)] bg-[var(--blue-soft)] p-4">
              <div className="flex flex-wrap items-center gap-2"><span className="status-pill text-[var(--primary)]">{takedownHarmMeta[draft.harm].shortLabel}</span><span className="status-pill text-[var(--safe)]">{understood.confidence}% confidence</span></div>
              <p className="mb-0 mt-3 leading-7">{understood.summary}</p>
            </div>
            {understood.suggestedHarm !== draft.harm ? <div className="mt-4 border-2 border-[var(--warning)] bg-[var(--warning-soft)] p-4"><strong>The words also look like {takedownHarmMeta[understood.suggestedHarm].shortLabel}.</strong><p className="mb-0 mt-2 text-sm leading-6">Keep your selected type or correct it below. You decide what enters the report.</p></div> : null}
            <fieldset className="mt-5"><legend className="font-black">Correct the incident type if needed</legend><div className="mt-3 grid gap-2">{takedownHarms.map((harm) => <button aria-pressed={draft.harm === harm} className={`min-h-14 w-full border-2 px-3 text-left font-black ${draft.harm === harm ? "border-[var(--primary)] bg-[var(--blue-soft)]" : "border-[var(--line)] bg-white hover:border-[var(--primary)]"}`} type="button" key={harm} onClick={() => update({ harm })}>{takedownHarmMeta[harm].label}{draft.harm === harm ? <Check aria-hidden="true" className="ml-2 inline text-[var(--safe)]" size={18} /> : null}</button>)}</div></fieldset>
            {understood.entities.length ? <div className="mt-5"><strong className="block">Identifiers found</strong><ul className="mt-2 flex list-none flex-wrap gap-2 p-0">{understood.entities.map((item) => <li className="border border-[var(--line-strong)] bg-white px-3 py-2 font-mono text-sm" key={item.id}>{item.value}</li>)}</ul></div> : <p className="mt-5 text-sm leading-6 text-[var(--muted)]">No identifier was found. That does not stop the report.</p>}
            <div className="mt-5 border-t border-[var(--line)] pt-4"><strong className="block">What will be generated</strong><p className="mb-0 mt-2 text-sm leading-6 text-[var(--muted)]">A filled grievance report for {selectedPlatform.grievanceRecipient}, an acknowledgement, and a live 24-hour platform-response clock.</p></div>
            <button className="button-primary mt-5 w-full" type="button" disabled={busy !== null} onClick={submitReport}><FileText aria-hidden="true" size={20} /> {busy === "submit" ? "Preparing the grievance report…" : "Generate report and acknowledgement"}</button>
            <BackButton onClick={() => update({ step: "describe" })} />
          </div>
        ) : null}
      </div>
      <p className="mt-4 text-center text-sm text-[var(--muted)]">Mock-only. No platform or authority is contacted.</p>
    </section>
  );
}

function GuidanceScreen({ headingRef, harm, platform, evidence, onToggle, onContinue, onBack }: { headingRef: React.RefObject<HTMLHeadingElement | null>; harm: TakedownHarm; platform: TakedownPlatform; evidence: SavedTakedownDraft["evidence"]; onToggle: (id: EvidenceChecklistId) => void; onContinue: () => void; onBack: () => void }) {
  const isSextortion = harm === "sextortion";
  const isHacked = harm === "account_takeover";
  const isNcii = harm === "ncii";
  return (
    <div className={isSextortion ? "grid min-h-[62dvh] content-center" : ""}>
      <div className={`border-2 p-4 sm:p-5 ${isSextortion || isNcii ? "border-[var(--warning)] bg-[var(--warning-soft)]" : "border-[var(--primary)] bg-[var(--blue-soft)]"}`}>
        {isSextortion ? <AlertTriangle aria-hidden="true" className="text-[var(--warning-dark)]" size={42} /> : <ShieldAlert aria-hidden="true" className="text-[var(--primary)]" size={38} />}
        <p className={`eyebrow mt-4 ${isSextortion || isNcii ? "text-[var(--warning-dark)]" : ""}`}>Act before filling a form</p>
        <h1 ref={headingRef} tabIndex={-1} style={stepHeadingStyle} id="takedown-heading" className="mt-2 text-3xl leading-tight sm:text-4xl">{isSextortion ? "Do not pay." : isHacked ? `Recover your ${platformMeta[platform].label} account first.` : isNcii ? "Preserve the link. The removal clock is 24 hours." : "Preserve the evidence before blocking."}</h1>
        <p className="mb-0 mt-4 text-lg font-bold leading-8">{isSextortion ? "Do not delete the chats. Paying does not stop it. Capture the evidence first, then block the account." : isNcii ? "You did not consent to this. Save enough information to identify the post; do not reshare the image as proof." : "These attacks are engineered to create fear and urgency. This is not your fault."}</p>
      </div>

      {isHacked ? <section className="mt-4 border-2 border-[var(--primary)] bg-white p-4" aria-labelledby="recovery-heading"><h2 id="recovery-heading" className="m-0 text-xl">Mock {platformMeta[platform].label} recovery steps</h2><ol className="mt-4 grid gap-3 pl-6">{platformMeta[platform].recoverySteps.map((item) => <li className="pl-1 leading-7" key={item}>{item}</li>)}</ol><p className="mb-0 mt-3 text-xs leading-5 text-[var(--muted)]">These are demo instructions, not live platform links.</p></section> : null}

      <fieldset className="mt-5"><legend className="text-xl font-black">Preserve what you can</legend><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Your choices are saved on this device. You can continue even if an item is not available.</p><div className="mt-3 grid gap-2">{evidenceChecklistItems.map((item) => <label className={`grid min-h-16 cursor-pointer grid-cols-[1.75rem_1fr] gap-3 border-2 p-3 ${evidence[item.id] ? "border-[var(--safe)] bg-[var(--safe-soft)]" : "border-[var(--line)] bg-white hover:border-[var(--primary)]"}`} key={item.id}><input className="mt-1 size-6 accent-[var(--safe)]" type="checkbox" checked={evidence[item.id]} onChange={() => onToggle(item.id)} /><span><strong className="block">{item.label}</strong><span className="mt-1 block text-sm leading-6 text-[var(--muted)]">{item.detail}</span></span></label>)}</div></fieldset>
      <button className="button-primary mt-5 w-full" type="button" onClick={onContinue}><Check aria-hidden="true" size={20} /> I have preserved what I can</button>
      <BackButton onClick={onBack} />
    </div>
  );
}

function ChoiceButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button className="min-h-16 w-full break-words border-2 border-[var(--primary)] bg-white px-4 py-3 text-left text-xl font-black hover:bg-[var(--blue-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus)]" type="button" onClick={onClick}>{children}</button>;
}

function BackButton({ onClick }: { onClick: () => void }) {
  return <button className="mt-5 inline-flex min-h-12 items-center gap-2 px-1 font-bold text-[var(--primary)] underline decoration-2 underline-offset-4" type="button" onClick={onClick}><ArrowLeft aria-hidden="true" size={20} /> Back</button>;
}
