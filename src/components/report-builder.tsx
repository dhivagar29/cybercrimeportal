"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileImage,
  FileText,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  ScanSearch,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { analyzeNarrative, cannedScenarios, getMockOcrEntities, scenarioIds, type EntityKind, type IntakeAnalysis, type ScenarioId } from "@/lib/engine";
import { readMockSession } from "@/lib/auth";
import { GOLDEN_HOUR_REPORT_KEY, type GoldenHourTicket } from "@/lib/golden-hour";
import { findPersona } from "@/lib/mock/personas";
import type { DemoPersona } from "@/lib/mock/types";
import {
  makeAcknowledgement,
  REPORT_BUILDER_KEY,
  rupeeStringToNumber,
  SUBMITTED_CASES_KEY,
  toLocalDateTime,
  type AssistedReportDraft,
  type StatutoryFormDraft,
  type SubmittedCitizenCase,
} from "@/lib/report";

const emptyDraft: AssistedReportDraft = {
  version: 1,
  step: "intake",
  narrative: "",
  analysis: null,
  evidenceNames: [],
  form: null,
  touchedFields: [],
  updatedAt: "",
};

const entityLabels: Record<EntityKind, string> = {
  amount: "Amount",
  utr: "UTR",
  upi: "UPI ID",
  phone: "Phone number",
  url: "Web address",
  handle: "Account handle",
};

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

function defaultForm(analysis: IntakeAnalysis, narrative: string, golden: GoldenHourTicket | null, persona: DemoPersona | undefined): StatutoryFormDraft {
  const findEntity = (...kinds: EntityKind[]) => analysis.entities.find((item) => kinds.includes(item.kind))?.value ?? "";
  const references = analysis.entities.filter((item) => item.kind === "utr" || item.kind === "upi").map((item) => `${item.label}: ${item.value}`).join(" · ");
  const incidentTime = golden?.occurredAt ?? analysis.timeline.find((item) => /money|payment|transfer/i.test(item.title))?.occurredAt ?? analysis.timeline[0]?.occurredAt ?? new Date().toISOString();
  return {
    incidentDateTime: toLocalDateTime(incidentTime),
    category: analysis.category,
    subcategory: analysis.subcategory,
    amount: golden ? `₹${golden.amount.toLocaleString("en-IN")}` : findEntity("amount"),
    paymentMethod: golden?.paymentMethod ?? (findEntity("upi") ? "UPI" : ""),
    bankOrApp: golden?.bankName ?? "",
    narrative,
    paymentReferences: references,
    suspectName: "",
    suspectPhone: findEntity("phone"),
    suspectUpi: findEntity("upi"),
    suspectUrlOrHandle: findEntity("url", "handle"),
    suspectAddress: "",
    complainantName: persona?.name ?? "",
    complainantEmail: persona?.email ?? "",
    complainantPhone: "",
    complainantAge: persona ? String(persona.age) : "",
    filedFor: persona?.persona === "relative-filed" ? "relative" : "self",
  };
}

export function ReportBuilder() {
  const [draft, setDraft] = useState<AssistedReportDraft>(emptyDraft);
  const [hydrated, setHydrated] = useState(false);
  const [active, setActive] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [persona, setPersona] = useState<DemoPersona | undefined>();
  const [golden, setGolden] = useState<GoldenHourTicket | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = safeParse<AssistedReportDraft>(window.localStorage.getItem(REPORT_BUILDER_KEY));
      const session = readMockSession();
      setPersona(findPersona(session?.personaId ?? null));
      setGolden(safeParse<GoldenHourTicket>(window.localStorage.getItem(GOLDEN_HOUR_REPORT_KEY)));
      if (saved?.version === 1 && (saved.narrative || saved.step !== "intake")) {
        setDraft(saved);
        setHasSavedDraft(true);
      } else {
        setActive(true);
      }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated || !active) return;
    const next = { ...draft, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(REPORT_BUILDER_KEY, JSON.stringify(next));
  }, [active, draft, hydrated]);

  function patchDraft(patch: Partial<AssistedReportDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function loadScenario(id: ScenarioId) {
    const narrative = cannedScenarios[id].narrative;
    patchDraft({ narrative, analysis: analyzeNarrative(narrative, id), step: "understood" });
  }

  function runEngine() {
    if (!draft.narrative.trim()) return;
    patchDraft({ analysis: analyzeNarrative(draft.narrative), step: "understood" });
  }

  function updateAnalysis(next: IntakeAnalysis) {
    patchDraft({ analysis: next });
  }

  function continueToForm() {
    if (!draft.analysis) return;
    patchDraft({ form: defaultForm(draft.analysis, draft.narrative, golden, persona), touchedFields: [], step: "form" });
  }

  function handleEvidence(files: FileList | null) {
    if (!files?.length) return;
    const names = Array.from(files).map((file) => file.name);
    const analysis = draft.analysis ?? (draft.narrative.trim() ? analyzeNarrative(draft.narrative) : null);
    patchDraft({ evidenceNames: names, analysis });
  }

  function resetDraft() {
    window.localStorage.removeItem(REPORT_BUILDER_KEY);
    setDraft(emptyDraft);
    setHasSavedDraft(false);
    setActive(true);
  }

  function submitCase() {
    if (!draft.form || !draft.analysis) return;
    const acknowledgement = makeAcknowledgement();
    const submitted: SubmittedCitizenCase = {
      acknowledgement,
      filedAt: new Date().toISOString(),
      category: draft.form.category,
      subcategory: draft.form.subcategory,
      amount: rupeeStringToNumber(draft.form.amount),
      paymentMethod: draft.form.paymentMethod,
      bankOrApp: draft.form.bankOrApp,
      complainantName: draft.form.complainantName || "Citizen",
      summary: draft.analysis.summary,
      stage: "filed",
    };
    const existing = safeParse<SubmittedCitizenCase[]>(window.localStorage.getItem(SUBMITTED_CASES_KEY)) ?? [];
    window.localStorage.setItem(SUBMITTED_CASES_KEY, JSON.stringify([submitted, ...existing.filter((item) => item.acknowledgement !== acknowledgement)]));
    patchDraft({ acknowledgement, step: "submitted" });
  }

  if (!hydrated) return <div className="panel" role="status"><strong>Checking this device for a saved report…</strong></div>;

  if (hasSavedDraft && !active) {
    const labels = { intake: "your description", understood: "checking what we understood", form: "checking the complaint form", submitted: "your acknowledgement" } as const;
    return (
      <section className="border-2 border-[var(--primary)] bg-[var(--blue-soft)] p-5" aria-labelledby="resume-heading">
        <Save aria-hidden="true" className="text-[var(--primary)]" size={38} />
        <p className="eyebrow mt-4">Saved on this device</p>
        <h2 id="resume-heading" className="mt-1 text-2xl">Resume where you left off</h2>
        <p className="leading-7 text-[var(--muted)]">Continue from {labels[draft.step]}. Your words and corrections are still here.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><button className="button-primary" type="button" onClick={() => setActive(true)}>Resume report <ArrowRight aria-hidden="true" size={20} /></button><button className="button-secondary" type="button" onClick={resetDraft}><RotateCcw aria-hidden="true" size={19} /> Start a new report</button></div>
      </section>
    );
  }

  if (draft.step === "submitted" && draft.acknowledgement) {
    return <Acknowledgement acknowledgement={draft.acknowledgement} onNew={resetDraft} />;
  }

  return (
    <div className="grid gap-5">
      <Progress step={draft.step} />
      {draft.step === "intake" ? <IntakeStep draft={draft} onNarrative={(narrative) => patchDraft({ narrative, analysis: null })} onScenario={loadScenario} onEvidence={handleEvidence} onAnalyze={runEngine} /> : null}
      {draft.step === "understood" && draft.analysis ? <UnderstandingStep narrative={draft.narrative} analysis={draft.analysis} evidenceNames={draft.evidenceNames} onChange={updateAnalysis} onEvidence={handleEvidence} onBack={() => patchDraft({ step: "intake" })} onContinue={continueToForm} /> : null}
      {draft.step === "form" && draft.form ? <StatutoryForm form={draft.form} touchedFields={draft.touchedFields} onChange={(form, field) => patchDraft({ form, touchedFields: [...new Set([...draft.touchedFields, field])] })} onBack={() => patchDraft({ step: "understood" })} onSubmit={submitCase} /> : null}
      <p className="m-0 text-center text-xs leading-5 text-[var(--muted)]">Saved locally as you work. Deterministic rules only—no text, image, or identifier leaves this browser.</p>
    </div>
  );
}

function Progress({ step }: { step: AssistedReportDraft["step"] }) {
  const steps = [{ id: "intake", label: "Describe" }, { id: "understood", label: "Check" }, { id: "form", label: "Confirm form" }];
  const current = Math.max(0, steps.findIndex((item) => item.id === step));
  return <ol className="grid grid-cols-3 gap-1 p-0" aria-label="Report progress">{steps.map((item, index) => <li className={`min-h-12 border-2 px-2 py-2 text-center text-sm font-black ${index <= current ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--line)] bg-white text-[var(--muted)]"}`} key={item.id} aria-current={index === current ? "step" : undefined}>{index + 1}. {item.label}</li>)}</ol>;
}

function IntakeStep({ draft, onNarrative, onScenario, onEvidence, onAnalyze }: { draft: AssistedReportDraft; onNarrative: (value: string) => void; onScenario: (id: ScenarioId) => void; onEvidence: (files: FileList | null) => void; onAnalyze: () => void }) {
  return (
    <section className="panel" aria-labelledby="intake-heading">
      <p className="eyebrow">Build the case · no taxonomy needed</p>
      <h2 id="intake-heading" className="mt-2 text-3xl leading-tight">Tell us what happened, in your own words.</h2>
      <p className="max-w-2xl leading-7 text-[var(--muted)]">Write it as you would tell a family member. These scams are engineered to work on anyone. You are not to blame.</p>
      <label className="mt-5 block"><span className="sr-only">Tell us what happened, in your own words</span><textarea className="field-control min-h-56 resize-y text-lg leading-8" autoFocus required minLength={10} value={draft.narrative} onChange={(event) => onNarrative(event.target.value)} placeholder="I received a call or message… Then I sent… The number or payment ID was…" /></label>
      <div className="mt-5"><p className="field-label">Use a complete demo story</p><div className="grid gap-2 sm:grid-cols-3">{scenarioIds.map((id) => <button className="button-quiet" type="button" key={id} onClick={() => onScenario(id)}>{cannedScenarios[id].chipLabel}</button>)}</div></div>
      <EvidenceUploader names={draft.evidenceNames} analysis={draft.analysis} onEvidence={onEvidence} />
      <button className="button-primary mt-6 w-full" type="button" disabled={draft.narrative.trim().length < 10} onClick={onAnalyze}><ScanSearch aria-hidden="true" size={22} /> Show me what you understood</button>
    </section>
  );
}

function EvidenceUploader({ names, analysis, onEvidence }: { names: string[]; analysis: IntakeAnalysis | null; onEvidence: (files: FileList | null) => void }) {
  const ocr = getMockOcrEntities(analysis);
  return (
    <div className="mt-5 border-2 border-dashed border-[var(--line-strong)] bg-[var(--paper)] p-4">
      <label className="button-secondary w-full cursor-pointer"><FileImage aria-hidden="true" size={21} /> Add screenshot evidence<input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => onEvidence(event.target.files)} /></label>
      <p className="mb-0 mt-2 text-xs leading-5 text-[var(--muted)]">Mock upload: filenames stay on this device. Image bytes are not read or sent.</p>
      {names.length ? <div className="mt-3"><strong className="text-sm">Attached: {names.join(", ")}</strong>{ocr.length ? <div className="mt-3 flex flex-wrap gap-2" aria-label="Mock OCR results">{ocr.map((item) => <span className="status-pill bg-white text-[var(--primary)]" key={item.id}>Mock OCR · {item.label}: {item.value}</span>)}</div> : <p className="mb-0 mt-2 text-sm text-[var(--muted)]">Mock OCR found no UPI ID or 12-digit UTR in this draft.</p>}</div> : null}
    </div>
  );
}

function UnderstandingStep({ narrative, analysis, evidenceNames, onChange, onEvidence, onBack, onContinue }: { narrative: string; analysis: IntakeAnalysis; evidenceNames: string[]; onChange: (analysis: IntakeAnalysis) => void; onEvidence: (files: FileList | null) => void; onBack: () => void; onContinue: () => void }) {
  function updateEntity(index: number, value: string) { onChange({ ...analysis, entities: analysis.entities.map((item, itemIndex) => itemIndex === index ? { ...item, value } : item) }); }
  function removeEntity(index: number) { onChange({ ...analysis, entities: analysis.entities.filter((_, itemIndex) => itemIndex !== index) }); }
  function addEntity() { const index = analysis.entities.length; onChange({ ...analysis, entities: [...analysis.entities, { id: `manual-phone-${index}`, kind: "phone", label: "Phone number", value: "", source: "narrative" }] }); }
  function updateTimeline(index: number, patch: Partial<IntakeAnalysis["timeline"][number]>) { onChange({ ...analysis, timeline: analysis.timeline.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }); }
  return (
    <section className="grid gap-5" aria-labelledby="understood-heading">
      <div className="panel">
        <div className="flex items-start gap-3"><CheckCircle2 aria-hidden="true" className="mt-1 shrink-0 text-[#08745c]" size={34} /><div><p className="eyebrow">Local draft · {analysis.confidence}% rules confidence</p><h2 id="understood-heading" className="m-0 mt-1 text-3xl">Here’s what we understood</h2></div></div>
        <p className="mt-4 border-l-4 border-[var(--primary)] bg-[var(--blue-soft)] p-3 leading-7">The engine drafts. You confirm. Change anything that is wrong.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="field-label">NCRP category</span><input className="field-control bg-[var(--blue-soft)] font-bold" value={analysis.category} onChange={(event) => onChange({ ...analysis, category: event.target.value })} /></label><label><span className="field-label">Sub-category</span><input className="field-control bg-[var(--blue-soft)] font-bold" value={analysis.subcategory} onChange={(event) => onChange({ ...analysis, subcategory: event.target.value })} /></label></div>
        <label className="mt-4 block"><span className="field-label">Plain-language summary</span><textarea className="field-control min-h-28 leading-7" value={analysis.summary} onChange={(event) => onChange({ ...analysis, summary: event.target.value })} /></label>
        <div className="mt-4 border-t border-[var(--line)] pt-4"><strong className="text-sm">Why this suggestion</strong><ul className="mb-0 mt-2 pl-5 text-sm leading-6 text-[var(--muted)]">{analysis.confidenceNotes.map((note) => <li key={note}>{note}</li>)}</ul></div>
      </div>

      <section className="panel" aria-labelledby="facts-heading"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Editable facts</p><h3 id="facts-heading" className="m-0 mt-1 text-2xl">Identifiers found</h3></div><button className="button-secondary" type="button" onClick={addEntity}><Plus aria-hidden="true" size={18} /> Add a fact</button></div><div className="mt-4 grid gap-3">{analysis.entities.length ? analysis.entities.map((item, index) => <div className="grid grid-cols-[1fr_auto] items-end gap-2" key={item.id}><label><span className="field-label text-sm">{item.label}</span><input className="field-control bg-[var(--blue-soft)] font-bold" value={item.value} onChange={(event) => updateEntity(index, event.target.value)} /></label><button className="button-quiet px-3" type="button" aria-label={`Remove ${item.label} ${item.value}`} onClick={() => removeEntity(index)}><Trash2 aria-hidden="true" size={20} /></button></div>) : <p className="text-[var(--muted)]">No identifiers found. Add one if you know it, or continue without it.</p>}</div></section>

      <section className="panel" aria-labelledby="timeline-heading"><p className="eyebrow">Editable sequence</p><h3 id="timeline-heading" className="m-0 mt-1 text-2xl">Auto-built timeline</h3><div className="mt-4 grid gap-4">{analysis.timeline.map((item, index) => <div className="border-l-4 border-[var(--primary)] bg-[var(--blue-soft)] p-3" key={item.id}><label><span className="field-label text-sm">When</span><input className="field-control" type="datetime-local" value={toLocalDateTime(item.occurredAt)} onChange={(event) => updateTimeline(index, { occurredAt: new Date(event.target.value).toISOString() })} /></label><label className="mt-3 block"><span className="field-label text-sm">What happened</span><input className="field-control font-bold" value={item.title} onChange={(event) => updateTimeline(index, { title: event.target.value })} /></label><label className="mt-3 block"><span className="field-label text-sm">Detail</span><textarea className="field-control min-h-20" value={item.detail} onChange={(event) => updateTimeline(index, { detail: event.target.value })} /></label></div>)}</div></section>

      <EvidenceUploader names={evidenceNames} analysis={analysis} onEvidence={onEvidence} />
      <div className="grid gap-3 sm:grid-cols-[auto_1fr]"><button className="button-secondary" type="button" onClick={onBack}><ArrowLeft aria-hidden="true" size={19} /> Edit my account</button><button className="button-primary" type="button" onClick={onContinue}><Check aria-hidden="true" size={20} /> This is right — pre-fill the complaint</button></div>
      <details className="border border-[var(--line)] bg-white p-3 text-sm"><summary className="cursor-pointer font-black">Read the original account</summary><p className="mb-0 mt-3 whitespace-pre-wrap leading-6 text-[var(--muted)]">{narrative}</p></details>
    </section>
  );
}

function StatutoryForm({ form, touchedFields, onChange, onBack, onSubmit }: { form: StatutoryFormDraft; touchedFields: string[]; onChange: (form: StatutoryFormDraft, field: keyof StatutoryFormDraft) => void; onBack: () => void; onSubmit: () => void }) {
  function update(field: keyof StatutoryFormDraft, value: string) { onChange({ ...form, [field]: value }, field); }
  const touched = new Set(touchedFields);
  return (
    <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); onSubmit(); }} aria-labelledby="statutory-heading">
      <div className="panel"><p className="eyebrow">Citizen confirmation</p><h2 id="statutory-heading" className="m-0 mt-1 text-3xl">Your NCRP complaint draft</h2><p className="mb-0 mt-3 leading-7 text-[var(--muted)]">Blue fields were filled for you. Please check them. A submitted complaint is not an FIR.</p></div>
      <FormSection title="1. Incident details" icon={<FileText aria-hidden="true" size={26} />}>
        <div className="grid gap-4 sm:grid-cols-2"><FormField field="incidentDateTime" label="Approximate incident date and time" type="datetime-local" required form={form} touched={touched} onChange={update} /><FormField field="amount" label="Amount lost" required form={form} touched={touched} onChange={update} /><FormField field="category" label="NCRP category" required form={form} touched={touched} onChange={update} /><FormField field="subcategory" label="Sub-category" required form={form} touched={touched} onChange={update} /><FormField field="paymentMethod" label="How the money moved" form={form} touched={touched} onChange={update} /><FormField field="bankOrApp" label="Bank or payment app" form={form} touched={touched} onChange={update} /></div><FormField field="paymentReferences" label="UTRs, UPI IDs, or payment references" form={form} touched={touched} onChange={update} /><FormField field="narrative" label="Incident description" multiline required form={form} touched={touched} onChange={update} />
      </FormSection>
      <FormSection title="2. Suspect details — optional" icon={<Pencil aria-hidden="true" size={26} />}><div className="border-l-4 border-[var(--safe)] bg-[var(--safe-soft)] p-3"><strong>Don’t know? Skip — this is the police’s job, not yours.</strong><p className="mb-0 mt-1 text-sm leading-6 text-[var(--muted)]">A missing suspect name, photo, or address must not stop the complaint.</p></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><FormField field="suspectName" label="Name, if known" optional form={form} touched={touched} onChange={update} /><FormField field="suspectPhone" label="Phone number, if known" optional form={form} touched={touched} onChange={update} /><FormField field="suspectUpi" label="UPI ID, if known" optional form={form} touched={touched} onChange={update} /><FormField field="suspectUrlOrHandle" label="URL or account handle, if known" optional form={form} touched={touched} onChange={update} /></div><FormField field="suspectAddress" label="Address, if known" optional multiline form={form} touched={touched} onChange={update} /></FormSection>
      <FormSection title="3. Complainant details" icon={<UserRound aria-hidden="true" size={26} />}><div className="grid gap-4 sm:grid-cols-2"><FormField field="complainantName" label="Full name" required form={form} touched={touched} onChange={update} /><FormField field="complainantEmail" label="Email" type="email" required form={form} touched={touched} onChange={update} /><FormField field="complainantPhone" label="Phone number" type="tel" form={form} touched={touched} onChange={update} /><FormField field="complainantAge" label="Age" type="number" form={form} touched={touched} onChange={update} /></div><label className="mt-4 block"><span className="field-label">Who is this complaint for?</span><select className={`field-control ${!touched.has("filedFor") ? "border-[var(--primary)] bg-[var(--blue-soft)]" : ""}`} value={form.filedFor} onChange={(event) => update("filedFor", event.target.value)}><option value="self">Myself</option><option value="relative">A relative</option></select>{!touched.has("filedFor") ? <AutoFilled /> : null}</label></FormSection>
      <div className="grid gap-3 sm:grid-cols-[auto_1fr]"><button className="button-secondary" type="button" onClick={onBack}><ArrowLeft aria-hidden="true" size={19} /> Check extracted facts</button><button className="button-primary" type="submit"><CheckCircle2 aria-hidden="true" size={21} /> Confirm and file mock complaint</button></div>
    </form>
  );
}

function FormSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <section className="panel"><div className="flex items-center gap-3 text-[var(--primary)]">{icon}<h3 className="m-0 text-2xl">{title}</h3></div><div className="mt-5">{children}</div></section>; }

function FormField({ field, label, type = "text", required = false, optional = false, multiline = false, form, touched, onChange }: { field: keyof StatutoryFormDraft; label: string; type?: string; required?: boolean; optional?: boolean; multiline?: boolean; form: StatutoryFormDraft; touched: Set<string>; onChange: (field: keyof StatutoryFormDraft, value: string) => void }) {
  const value = String(form[field]);
  const autoFilled = Boolean(value) && !touched.has(field);
  const controlClass = `field-control ${multiline ? "min-h-28 leading-7" : ""} ${autoFilled ? "border-[var(--primary)] bg-[var(--blue-soft)]" : ""}`;
  return <label className="mt-4 block"><span className="field-label">{label} {optional ? <span className="font-normal text-[var(--muted)]">(optional)</span> : null}</span>{multiline ? <textarea className={controlClass} required={required} value={value} onChange={(event) => onChange(field, event.target.value)} /> : <input className={controlClass} type={type} required={required} value={value} onChange={(event) => onChange(field, event.target.value)} />}{autoFilled ? <AutoFilled /> : null}</label>;
}

function AutoFilled() { return <span className="mt-1 inline-flex items-center gap-1 text-xs font-black text-[var(--primary)]"><Check aria-hidden="true" size={14} /> We filled this for you — please check</span>; }

function Acknowledgement({ acknowledgement, onNew }: { acknowledgement: string; onNew: () => void }) {
  return <section className="mx-auto max-w-3xl border-2 border-[#08745c] bg-[#eaf6f2] p-5 sm:p-8" role="status" aria-labelledby="ack-heading"><CheckCircle2 aria-hidden="true" className="text-[#08745c]" size={48} /><p className="eyebrow mt-5 text-[#075a49]">Mock complaint filed</p><h2 id="ack-heading" className="m-0 mt-2 text-3xl">Your account has been recorded.</h2><p className="mt-4 leading-7">Acknowledgement number</p><strong className="block break-all bg-white p-4 font-mono text-2xl">{acknowledgement}</strong><p className="mt-4 text-sm leading-6 text-[var(--muted)]">This is a complaint acknowledgement, not an FIR. It is stored only on this device and now appears in the mock case list.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><Link className="button-primary" href="/case">Open the case file <ArrowRight aria-hidden="true" size={20} /></Link><button className="button-secondary" type="button" onClick={onNew}><RotateCcw aria-hidden="true" size={19} /> File another mock complaint</button></div></section>;
}
