"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  KeyRound,
  Link2,
  LockKeyhole,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeWcNarrative } from "@/lib/engine";
import { safeReadJson } from "@/lib/kernel/storage";
import { makeAcknowledgement } from "@/lib/report";
import { useSafety } from "@/lib/safety";
import {
  emptyEvidenceChecklist,
  evidenceChecklistItems,
  platformMeta,
  takedownPlatforms,
  type EvidenceChecklistId,
  type TakedownPlatform,
} from "@/lib/takedown";
import {
  childInvolvementOptions,
  emptyWcDraft,
  makeRecoveryPassphrase,
  normaliseRecoveryPassphrase,
  reporterRoleMeta,
  resolveWcSla,
  WC_CASES_KEY,
  WC_DRAFT_KEY,
  wcEscalationMeta,
  wcHarmMeta,
  wcHarms,
  wcStageMeta,
  wcSubjectMeta,
  type ReporterRole,
  type WcCase,
  type WcDraft,
  type WcHarm,
  type WcStep,
  type WcSubject,
  type WcTrackingMode,
} from "@/lib/wc-track";

const validSteps: readonly WcStep[] = [
  "mode", "who", "reporter_role", "child_involvement", "harm", "platform",
  "describe", "evidence", "review", "submitted",
];

const adultHarms = wcHarms.filter((harm) => harm !== "child_safety");

function safeDraft(raw: string | null): WcDraft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as WcDraft;
    if (value.version !== 1 || !validSteps.includes(value.step)) return null;
    if (value.harm && !wcHarms.includes(value.harm)) return null;
    if (value.platform && !takedownPlatforms.includes(value.platform)) return null;
    return {
      ...emptyWcDraft,
      ...value,
      evidence: { ...emptyEvidenceChecklist, ...value.evidence },
    };
  } catch {
    return null;
  }
}

function safeCases(raw: string | null) {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as WcCase[];
    return Array.isArray(value)
      ? value.filter((item) => item.version === 1 && item.acknowledgement?.startsWith("2"))
      : [];
  } catch {
    return [];
  }
}

function formatDeadline(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  }).format(new Date(value));
}

function formatRemaining(milliseconds: number) {
  if (milliseconds <= 0) return "Deadline passed";
  const totalMinutes = Math.ceil(milliseconds / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m remaining`;
}

export function WcSafeIntake() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hydratedRevision = useRef<number | null>(null);
  const {
    clearRevision,
    privateMode,
    readSensitiveItem,
    removeSensitiveItem,
    setPrivateMode,
    writeSensitiveItem,
  } = useSafety();
  const [draft, setDraft] = useState<WcDraft>({
    ...emptyWcDraft,
    evidence: { ...emptyEvidenceChecklist },
  });
  const [activeCase, setActiveCase] = useState<WcCase | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (hydratedRevision.current === clearRevision) return;
    hydratedRevision.current = clearRevision;
    const frame = window.requestAnimationFrame(() => {
      const storedDraft = safeDraft(readSensitiveItem(WC_DRAFT_KEY));
      if (storedDraft) {
        setDraft(storedDraft);
        if (storedDraft.acknowledgement) {
          const cases = safeCases(readSensitiveItem(WC_CASES_KEY));
          setActiveCase(cases.find((item) => item.acknowledgement === storedDraft.acknowledgement) ?? null);
        }
      } else if (clearRevision > 0) {
        setDraft({ ...emptyWcDraft, evidence: { ...emptyEvidenceChecklist } });
        setActiveCase(null);
      }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [clearRevision, readSensitiveItem]);

  useEffect(() => {
    if (!hydrated) return;
    writeSensitiveItem(WC_DRAFT_KEY, JSON.stringify(draft));
  }, [draft, hydrated, privateMode, writeSensitiveItem]);

  useEffect(() => {
    if (!hydrated) return;
    headingRef.current?.focus();
  }, [draft.step, hydrated]);

  useEffect(() => {
    if (!activeCase) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [activeCase]);

  const analysis = useMemo(() => {
    if (!draft.harm) return null;
    const source = [draft.narrative, draft.postedDescription].filter(Boolean).join(" ");
    return analyzeWcNarrative(source, draft.harm);
  }, [draft.harm, draft.narrative, draft.postedDescription]);

  function update(patch: Partial<WcDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function chooseMode(mode: WcTrackingMode) {
    if (mode === "anonymous_recovery") setPrivateMode(false);
    else setPrivateMode(true);
    update({ trackingMode: mode, step: "who" });
  }

  function chooseSubject(subject: WcSubject) {
    if (subject === "self") {
      update({ subject, reporterRole: "self", harm: null, step: "harm" });
      return;
    }
    update({ subject, reporterRole: null, harm: subject === "child" ? "child_safety" : null, step: "reporter_role" });
  }

  function chooseReporterRole(role: ReporterRole) {
    update({ reporterRole: role, step: draft.subject === "child" ? "child_involvement" : "harm" });
  }

  function chooseHarm(harm: WcHarm) {
    update({ harm, step: "platform" });
  }

  function choosePlatform(platform: TakedownPlatform) {
    update({ platform, step: "describe" });
  }

  function toggleEvidence(id: EvidenceChecklistId) {
    setDraft((current) => ({
      ...current,
      evidence: { ...current.evidence, [id]: !current.evidence[id] },
    }));
  }

  function recoverCase() {
    const phrase = normaliseRecoveryPassphrase(recoveryInput);
    const cases = safeReadJson<WcCase[]>(WC_CASES_KEY) ?? [];
    const found = cases.find(
      (item) => item.recoveryPassphrase && normaliseRecoveryPassphrase(item.recoveryPassphrase) === phrase,
    );
    if (!found) {
      setRecoveryError("No case on this device matches that passphrase. Check all four words.");
      return;
    }
    setPrivateMode(false);
    setActiveCase(found);
    setDraft({
      version: 1,
      step: "submitted",
      trackingMode: found.trackingMode,
      subject: found.subject,
      reporterRole: found.reporterRole,
      harm: found.harm,
      platform: found.platform,
      childInvolvement: found.childInvolvement,
      narrative: found.narrative,
      profileLink: found.profileLink,
      postedDescription: found.postedDescription,
      evidence: found.evidence,
      acknowledgement: found.acknowledgement,
      recoveryPassphrase: found.recoveryPassphrase,
    });
    setRecoveryError("");
  }

  async function submitCase() {
    if (!draft.harm || !draft.platform || !draft.reporterRole || !draft.subject || !analysis) return;
    setBusy(true);
    await new Promise((resolve) => window.setTimeout(resolve, 550));
    const timestamp = Date.now();
    const acknowledgement = makeAcknowledgement(timestamp);
    const recoveryPassphrase = draft.trackingMode === "anonymous_recovery"
      ? makeRecoveryPassphrase(timestamp)
      : undefined;
    const reportedAt = new Date(timestamp).toISOString();
    const savedCase: WcCase = {
      ...draft,
      acknowledgement,
      recoveryPassphrase,
      stage: "reported",
      reportedAt,
      stageStartedAt: reportedAt,
      analysis: {
        category: analysis.category,
        subcategory: analysis.subcategory,
        confidence: analysis.confidence,
        confidenceNotes: analysis.confidenceNotes,
        entities: analysis.entities,
      },
      history: [{
        stage: "reported",
        occurredAt: reportedAt,
        detail: draft.subject === "child"
          ? "A trusted adult prepared a child-safety record for POCSO-track handling. No image or video was collected."
          : `An anonymous safety report was prepared for ${platformMeta[draft.platform].label}. No identity was collected.`,
      }],
    };
    const cases = safeCases(readSensitiveItem(WC_CASES_KEY));
    writeSensitiveItem(WC_CASES_KEY, JSON.stringify([savedCase, ...cases]));
    const submittedDraft: WcDraft = {
      ...draft,
      step: "submitted",
      acknowledgement,
      recoveryPassphrase,
    };
    setActiveCase(savedCase);
    setDraft(submittedDraft);
    setBusy(false);
  }

  function startAgain() {
    removeSensitiveItem(WC_DRAFT_KEY);
    setPrivateMode(true);
    setActiveCase(null);
    setRecoveryInput("");
    setRecoveryError("");
    setDraft({ ...emptyWcDraft, evidence: { ...emptyEvidenceChecklist } });
  }

  if (!hydrated) {
    return (
      <section className="panel min-h-72" role="status">
        <p className="eyebrow">Safer reporting</p>
        <h1 className="mt-2 text-3xl">Preparing a private session…</h1>
        <p className="text-[var(--muted)]">No report text is loaded until the device safety check is complete.</p>
      </section>
    );
  }

  if (draft.step === "submitted" && activeCase) {
    const harm = wcHarmMeta[activeCase.harm!];
    const platform = platformMeta[activeCase.platform!];
    const stage = wcStageMeta[activeCase.stage];
    const sla = resolveWcSla(activeCase.stageStartedAt, activeCase.stage, activeCase.harm!, now);
    return (
      <section className="mx-auto grid max-w-3xl gap-5" aria-labelledby="safe-report-confirmation">
        <div className="border-2 border-[var(--safe)] bg-[var(--safe-soft)] p-5 sm:p-8" role="status">
          <CheckCircle2 aria-hidden="true" className="text-[var(--safe)]" size={44} />
          <p className="eyebrow mt-5 text-[var(--safe)]">Anonymous report recorded</p>
          <h1 ref={headingRef} tabIndex={-1} id="safe-report-confirmation" className="mt-2 text-3xl outline-none sm:text-4xl">You can return without giving your identity.</h1>
          <dl className="mt-6 grid gap-px bg-[#8cb8aa] sm:grid-cols-2">
            <InfoItem label="Acknowledgement" value={activeCase.acknowledgement} mono />
            <InfoItem label="Status" value={stage.label} />
            <InfoItem label="Where" value={platform.label} />
            <InfoItem label="Report type" value={harm.shortLabel} />
          </dl>
          {activeCase.recoveryPassphrase ? (
            <div className="mt-5 border-2 border-[var(--primary)] bg-white p-4">
              <p className="m-0 flex items-center gap-2 font-black"><KeyRound aria-hidden="true" size={21} /> Recovery passphrase</p>
              <p className="my-3 break-words font-mono text-2xl font-black tracking-wide">{activeCase.recoveryPassphrase}</p>
              <p className="mb-0 text-sm leading-6">Write these four words somewhere safe. Lose them and the case cannot be recovered, because nothing ties it to a person.</p>
            </div>
          ) : (
            <p className="mb-0 mt-5 border-2 border-[var(--warning)] bg-[var(--warning-soft)] p-4 text-sm leading-6"><strong>Private session:</strong> this case exists only in this tab. Closing it loses the report.</p>
          )}
        </div>

        <section className="panel" aria-labelledby="safe-status-heading">
          <p className="eyebrow">Live track</p>
          <h2 id="safe-status-heading" className="mt-2 text-2xl">{stage.label}</h2>
          <p className="leading-7">{stage.meaning}</p>
          <p className="text-sm font-bold text-[var(--muted)]">Who is acting: {stage.actor}</p>
          {sla ? (
            <div className="mt-4 border-2 border-[var(--primary)] bg-[var(--blue-soft)] p-4">
              <p className="m-0 flex items-center gap-2 font-black"><Clock3 aria-hidden="true" size={20} /> 24-hour acknowledgement clock</p>
              <p className="mb-0 mt-2 text-sm leading-6">{formatRemaining(sla.msRemaining)} · due {formatDeadline(sla.deadline)}</p>
            </div>
          ) : null}
          <ol className="mt-5 grid gap-2 pl-6">
            {Object.values(wcEscalationMeta[activeCase.harm!]).map((label) => <li key={label} className="pl-1 leading-7">{label}</li>)}
          </ol>
        </section>

        {activeCase.subject === "child" ? <ChildlinePanel /> : <WomenSupportPanel />}
        <p className="m-0 text-sm leading-6 text-[var(--muted)]">Mock-only: no platform, NCRP, police, or helpline was contacted.</p>
        <button className="button-quiet w-full" type="button" onClick={startAgain}>Start another safe report</button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl" aria-labelledby="wc-flow-heading">
      <div className="sticky top-0 z-10 mb-4 border-2 border-[var(--primary)] bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-black uppercase tracking-[0.08em] text-[var(--primary)]">Women &amp; Children · safer report</p>
            <p className="m-0 mt-1 text-sm font-bold">One decision at a time. {privateMode ? "Private mode is on." : "Anonymous recovery is saved on this device."}</p>
          </div>
          <ShieldCheck aria-hidden="true" className="shrink-0 text-[var(--primary)]" size={28} />
        </div>
      </div>

      <div className="border-2 border-[var(--primary)] bg-white p-5 sm:p-8">
        {draft.step === "mode" ? (
          <Step headingRef={headingRef} eyebrow="Start safely" title="How should this report be kept?">
            <p className="leading-7">No choice asks for a name or account.</p>
            <div className="mt-5 grid gap-3">
              <ChoiceButton onClick={() => chooseMode("anonymous_recovery")}>
                <KeyRound aria-hidden="true" size={24} />
                <span><strong className="block">Report anonymously and track it later</strong><span className="mt-1 block text-sm font-normal leading-6">Saves this mock case on this browser and creates a four-word recovery passphrase. Private mode will turn off.</span></span>
              </ChoiceButton>
              <ChoiceButton onClick={() => chooseMode("private_session")}>
                <LockKeyhole aria-hidden="true" size={24} />
                <span><strong className="block">Keep it only in this tab</strong><span className="mt-1 block text-sm font-normal leading-6">Nothing is saved. Closing the tab loses the draft and report.</span></span>
              </ChoiceButton>
            </div>
            <div className="mt-7 border-t-2 border-[var(--line)] pt-5">
              <label className="field-label" htmlFor="recovery-passphrase">Already have a recovery passphrase?</label>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input id="recovery-passphrase" className="field-control" value={recoveryInput} onChange={(event) => setRecoveryInput(event.target.value)} placeholder="four words" autoComplete="off" />
                <button className="button-secondary" type="button" disabled={normaliseRecoveryPassphrase(recoveryInput).split(" ").length !== 4} onClick={recoverCase}>Reopen case</button>
              </div>
              {recoveryError ? <p className="mb-0 mt-2 text-sm font-bold text-[var(--alert)]" role="alert">{recoveryError}</p> : null}
            </div>
          </Step>
        ) : null}

        {draft.step === "who" ? (
          <Step headingRef={headingRef} eyebrow="About this report" title="Who is this about?">
            <div className="mt-5 grid gap-3">
              {(Object.keys(wcSubjectMeta) as WcSubject[]).map((subject) => <ChoiceButton key={subject} onClick={() => chooseSubject(subject)}>{wcSubjectMeta[subject].label}<ArrowRight aria-hidden="true" className="ml-auto shrink-0" size={20} /></ChoiceButton>)}
            </div>
            <BackButton onClick={() => update({ step: "mode" })} />
          </Step>
        ) : null}

        {draft.step === "reporter_role" ? (
          <Step headingRef={headingRef} eyebrow={draft.subject === "child" ? "Trusted adult" : "Helping someone"} title={draft.subject === "child" ? "What is your role?" : "How are you helping?"}>
            {draft.subject === "child" ? <p className="border-l-4 border-[var(--primary)] bg-[var(--blue-soft)] p-3 leading-7">The child is never asked to type. A trusted adult records only what is needed for safety routing.</p> : null}
            <div className="mt-5 grid gap-3">
              {(draft.subject === "child" ? ["guardian", "teacher_or_counsellor", "other_trusted_adult"] as const : ["teacher_or_counsellor", "other_trusted_adult"] as const).map((role) => <ChoiceButton key={role} onClick={() => chooseReporterRole(role)}>{reporterRoleMeta[role].label}<ArrowRight aria-hidden="true" className="ml-auto shrink-0" size={20} /></ChoiceButton>)}
            </div>
            {draft.subject === "child" ? <ChildlinePanel /> : null}
            <BackButton onClick={() => update({ step: "who" })} />
          </Step>
        ) : null}

        {draft.step === "child_involvement" ? (
          <Step headingRef={headingRef} eyebrow="Child safety" title="What needs a safety response?">
            <p className="leading-7">Choose the closest summary. Do not describe images or graphic detail.</p>
            <div className="mt-5 grid gap-3">{childInvolvementOptions.map((option) => <ChoiceButton key={option} onClick={() => update({ childInvolvement: option, harm: "child_safety", step: "platform" })}>{option}<ArrowRight aria-hidden="true" className="ml-auto shrink-0" size={20} /></ChoiceButton>)}</div>
            <p className="mt-5 border-2 border-[var(--primary)] bg-[var(--blue-soft)] p-4 text-sm font-bold leading-6">This class of report is prepared for POCSO-track handling rather than an ordinary platform grievance.</p>
            <ChildlinePanel />
            <BackButton onClick={() => update({ step: "reporter_role" })} />
          </Step>
        ) : null}

        {draft.step === "harm" ? (
          <Step headingRef={headingRef} eyebrow="What is happening" title="Choose the closest description.">
            <p className="leading-7">You do not need to know a legal category.</p>
            <div className="mt-5 grid gap-3">{adultHarms.map((harm) => <ChoiceButton key={harm} onClick={() => chooseHarm(harm)}>{wcHarmMeta[harm].label}<ArrowRight aria-hidden="true" className="ml-auto shrink-0" size={20} /></ChoiceButton>)}</div>
            <BackButton onClick={() => update({ step: draft.subject === "self" ? "who" : "reporter_role" })} />
          </Step>
        ) : null}

        {draft.step === "platform" ? (
          <Step headingRef={headingRef} eyebrow="Evidence location" title="Where is this happening?">
            {draft.subject === "child" ? <p className="leading-7">The platform is recorded only as the place where evidence may exist. The report remains on the child-safety route.</p> : null}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">{takedownPlatforms.map((platform) => <ChoiceButton key={platform} onClick={() => choosePlatform(platform)}>{platformMeta[platform].label}</ChoiceButton>)}</div>
            <BackButton onClick={() => update({ step: draft.subject === "child" ? "child_involvement" : "harm" })} />
          </Step>
        ) : null}

        {draft.step === "describe" ? (
          <Step headingRef={headingRef} eyebrow="Optional" title="Describe it in your own words.">
            <p className="leading-7">Keep it brief and factual. Do not include images or graphic detail.</p>
            <label className="sr-only" htmlFor="wc-narrative">Description of what happened</label>
            <textarea id="wc-narrative" className="field-control mt-4 min-h-44 resize-y" value={draft.narrative} onChange={(event) => update({ narrative: event.target.value })} placeholder={draft.subject === "child" ? "A brief adult-written summary, if you choose…" : "A brief summary, if you choose…"} />
            <button className="button-primary mt-4 w-full" type="button" onClick={() => update({ step: "evidence" })}>Continue <ArrowRight aria-hidden="true" size={20} /></button>
            <button className="button-quiet mt-3 w-full" type="button" onClick={() => update({ narrative: "", step: "evidence" })}>I would rather not write it out</button>
            <BackButton onClick={() => update({ step: "platform" })} />
          </Step>
        ) : null}

        {draft.step === "evidence" ? (
          <Step headingRef={headingRef} eyebrow="Describe and link only" title="Preserve evidence without uploading it.">
            <p className="border-2 border-[var(--safe)] bg-[var(--safe-soft)] p-4 font-bold leading-7">Nothing you send here is stored as an image or video, and you should never have to hand over the images to get help.</p>
            <label className="field-label mt-5" htmlFor="wc-profile-link">Profile or post link <span className="font-normal">(optional)</span></label>
            <div className="relative"><Link2 aria-hidden="true" className="absolute left-3 top-4 text-[var(--muted)]" size={19} /><input id="wc-profile-link" className="field-control pl-10" inputMode="url" value={draft.profileLink} onChange={(event) => update({ profileLink: event.target.value })} placeholder="https://… or account name" /></div>
            <label className="field-label mt-5" htmlFor="wc-post-description">What was posted or sent? <span className="font-normal">(optional)</span></label>
            <textarea id="wc-post-description" className="field-control min-h-28 resize-y" value={draft.postedDescription} onChange={(event) => update({ postedDescription: event.target.value })} placeholder="Describe it briefly without repeating harmful content." />
            <fieldset className="mt-6"><legend className="text-xl font-black">Evidence checklist</legend><div className="mt-3 grid gap-2">{evidenceChecklistItems.map((item) => <label className={`grid min-h-16 cursor-pointer grid-cols-[1.75rem_1fr] gap-3 border-2 p-3 ${draft.evidence[item.id] ? "border-[var(--safe)] bg-[var(--safe-soft)]" : "border-[var(--line)] bg-white"}`} key={item.id}><input className="mt-1 size-6 accent-[var(--safe)]" type="checkbox" checked={draft.evidence[item.id]} onChange={() => toggleEvidence(item.id)} /><span><strong className="block">{item.label}</strong><span className="mt-1 block text-sm leading-6 text-[var(--muted)]">{item.detail}</span></span></label>)}</div></fieldset>
            <button className="button-primary mt-5 w-full" type="button" onClick={() => update({ step: "review" })}><Check aria-hidden="true" size={20} /> Review the report</button>
            <BackButton onClick={() => update({ step: "describe" })} />
          </Step>
        ) : null}

        {draft.step === "review" && draft.harm && draft.platform && analysis ? (
          <Step headingRef={headingRef} eyebrow="Check before recording" title={draft.subject === "child" ? "Review the child-safety record." : "Review the anonymous report."}>
            <dl className="mt-5 grid gap-px bg-[var(--line)] sm:grid-cols-2">
              <InfoItem label="Who" value={draft.subject ? wcSubjectMeta[draft.subject].label : "Not added"} />
              <InfoItem label="Reporter role" value={draft.reporterRole ? reporterRoleMeta[draft.reporterRole].label : "Not added"} />
              <InfoItem label="Type" value={wcHarmMeta[draft.harm].shortLabel} />
              <InfoItem label="Where" value={platformMeta[draft.platform].label} />
            </dl>
            <div className="mt-5 border-2 border-[var(--primary)] bg-[var(--blue-soft)] p-4">
              <p className="eyebrow">Locally suggested classification</p>
              <p className="mb-0 mt-2 font-black">{analysis.category} → {analysis.subcategory}</p>
              <p className="mb-0 mt-2 text-sm leading-6">{analysis.confidenceNotes[0]} This is a deterministic draft, not a live AI service.</p>
            </div>
            {draft.subject === "child" ? (
              <p className="mt-5 border-2 border-[var(--primary)] bg-white p-4 font-bold leading-7">This record is prepared for POCSO-track handling through {wcHarmMeta.child_safety.authorityLabel}. No media is collected.</p>
            ) : (
              <ol className="mt-5 grid gap-2 pl-6">{Object.values(wcEscalationMeta[draft.harm]).map((label) => <li key={label} className="pl-1 leading-7">{label}</li>)}</ol>
            )}
            {draft.subject === "child" ? <ChildlinePanel /> : <WomenSupportPanel />}
            <button className="button-primary mt-5 w-full" type="button" disabled={busy} onClick={submitCase}><UserRoundCheck aria-hidden="true" size={20} /> {busy ? "Creating your private record…" : "Create acknowledgement"}</button>
            <BackButton onClick={() => update({ step: "evidence" })} />
          </Step>
        ) : null}
      </div>
      <p className="mt-4 text-center text-sm leading-6 text-[var(--muted)]">Reference only: this prototype does not contact a platform, NCRP, police, or a helpline.</p>
    </section>
  );
}

function Step({ headingRef, eyebrow, title, children }: { headingRef: React.RefObject<HTMLHeadingElement | null>; eyebrow: string; title: string; children: React.ReactNode }) {
  return <div><p className="eyebrow">{eyebrow}</p><h1 ref={headingRef} tabIndex={-1} id="wc-flow-heading" className="mt-2 text-3xl leading-tight outline-none sm:text-4xl">{title}</h1>{children}</div>;
}

function ChoiceButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button className="flex min-h-16 w-full items-center gap-3 break-words border-2 border-[var(--primary)] bg-white px-4 py-3 text-left text-lg font-black hover:bg-[var(--blue-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus)]" type="button" onClick={onClick}>{children}</button>;
}

function BackButton({ onClick }: { onClick: () => void }) {
  return <button className="mt-5 inline-flex min-h-12 items-center gap-2 px-1 font-bold text-[var(--primary)] underline decoration-2 underline-offset-4" type="button" onClick={onClick}><ArrowLeft aria-hidden="true" size={20} /> Back</button>;
}

function InfoItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="bg-white p-4"><dt className="text-xs font-black uppercase tracking-wide text-[var(--muted)]">{label}</dt><dd className={`m-0 mt-1 break-words font-black ${mono ? "font-mono text-xl" : ""}`}>{value}</dd></div>;
}

function ChildlinePanel() {
  return <aside className="mt-5 border-2 border-[var(--safe)] bg-[var(--safe-soft)] p-4" aria-label="Childline reference"><strong className="block text-lg">Childline: 1098</strong><p className="mb-0 mt-2 text-sm leading-6">Reference information only. This prototype never calls or contacts Childline. For immediate danger use 112.</p></aside>;
}

function WomenSupportPanel() {
  return <aside className="mt-5 border-2 border-[var(--safe)] bg-[var(--safe-soft)] p-4" aria-label="Women safety helpline reference"><strong className="block text-lg">Women Helpline: 181</strong><p className="mb-0 mt-2 text-sm leading-6">Reference information only. This prototype never calls or contacts the helpline. For immediate danger use 112.</p></aside>;
}
