"use client";

import { DoorOpen, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ClearEverythingAction } from "@/components/safety/clear-everything";
import { SAFETY_PREMISE, useSafety } from "@/lib/safety";

export function SafetyNoticeStrip() {
  const { dismissSafetyNotice, showSafetyNotice } = useSafety();
  if (!showSafetyNotice) return null;

  return (
    <div className="border-b-2 border-[var(--primary)] bg-[var(--blue-soft)] px-4 py-3" role="status">
      <div className="mx-auto flex max-w-[1120px] items-start justify-between gap-3">
        <p className="m-0 text-sm font-bold leading-6">
          {SAFETY_PREMISE} Use Quick exit at any time, or press Esc twice within one second.
        </p>
        <button
          className="grid size-12 shrink-0 place-items-center border-2 border-[var(--primary)] bg-white text-[var(--primary)]"
          type="button"
          onClick={dismissSafetyNotice}
          aria-label="Dismiss safety notice"
        >
          <X aria-hidden="true" size={20} />
        </button>
      </div>
    </div>
  );
}

export function SafetyFloatingControls() {
  const { escapeArmed, isSensitive, openSafetyPanel, quickExit } = useSafety();
  if (!isSensitive) return null;

  return (
    <div className="safety-floating-controls print-hidden" aria-label="Device safety controls">
      {escapeArmed ? (
        <div className="safety-escape-hint border-2 border-[var(--warning-dark)] bg-[var(--warning-soft)] px-3 py-2 text-center text-xs font-black" aria-live="assertive">
          Press Esc once more to leave.
        </div>
      ) : null}
      <button
        className="safety-quick-exit flex min-h-12 items-center justify-center gap-2 border-2 px-3 font-black text-white"
        type="button"
        onClick={quickExit}
      >
        <DoorOpen aria-hidden="true" size={21} /> Quick exit
      </button>
      <button
        className="flex min-h-12 items-center justify-center gap-2 border-2 border-[var(--primary)] bg-white px-3 font-black text-[var(--primary)]"
        type="button"
        onClick={openSafetyPanel}
      >
        <ShieldCheck aria-hidden="true" size={19} /> Device safety
      </button>
    </div>
  );
}

export function SafetyPanel() {
  const {
    closeSafetyPanel,
    continueFromSafetyPanel,
    isSensitive,
    panelOpen,
    panelReason,
    privateMode,
    quickExit,
    requiresSafetyCheck,
    setPrivateMode,
  } = useSafety();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (panelOpen) headingRef.current?.focus();
  }, [panelOpen]);

  if (!isSensitive || !panelOpen) return null;

  return (
    <div className="safety-modal-backdrop print-hidden" role="presentation">
      <section
        className="safety-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="safety-panel-heading"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Device safety</p>
            <h2 ref={headingRef} tabIndex={-1} id="safety-panel-heading" className="m-0 mt-1 text-3xl outline-none">
              Keep this report harder to find.
            </h2>
          </div>
          <button
            className="grid size-12 shrink-0 place-items-center border-2 border-[var(--primary)] bg-white text-[var(--primary)]"
            type="button"
            onClick={closeSafetyPanel}
            aria-label="Close device safety panel"
          >
            <X aria-hidden="true" size={22} />
          </button>
        </div>

        <p className="mt-4 leading-7">{SAFETY_PREMISE}</p>

        {panelReason === "device-risk" ? (
          <div className="mt-4 border-2 border-[var(--warning)] bg-[var(--warning-soft)] p-4">
            <strong className="block">Use a trusted person&apos;s device if you safely can.</strong>
            <p className="mb-0 mt-2 text-sm leading-6">
              Private mode is on. Quick exit replaces this page with a plain weather screen, but browser history may still need to be cleared manually.
            </p>
          </div>
        ) : null}

        <div className="mt-5 border-2 border-[var(--primary)] bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <strong className="flex items-center gap-2 text-lg"><LockKeyhole aria-hidden="true" size={20} /> Private mode</strong>
              <span className="mt-1 block text-sm text-[var(--muted)]">On by default for sensitive pages</span>
            </div>
            <button
              className={`min-h-12 min-w-24 border-2 px-4 font-black ${privateMode ? "border-[var(--safe)] bg-[var(--safe)] text-white" : "border-[var(--line-strong)] bg-white text-[var(--ink)]"}`}
              type="button"
              role="switch"
              aria-checked={privateMode}
              onClick={() => setPrivateMode(!privateMode)}
            >
              {privateMode ? "ON" : "OFF"}
            </button>
          </div>
          <p className="mb-0 mt-3 text-sm leading-6">
            {privateMode
              ? "Nothing is saved, so closing the tab loses the draft."
              : "Drafts are saved in this browser, so someone using this device may find them."}
          </p>
        </div>

        <button className="button-primary mt-4 w-full" type="button" onClick={quickExit}>
          <DoorOpen aria-hidden="true" size={20} /> Quick exit to weather
        </button>

        <div className="mt-4 border-t-2 border-[var(--line)] pt-4">
          <ClearEverythingAction compact />
        </div>

        <p className="mb-0 mt-5 border-l-4 border-[var(--primary)] bg-white p-3 text-sm leading-6">
          Reference only: this prototype does not call or contact anyone. For immediate danger use 112; Childline 1098; Women Helpline 181. For cyber financial fraud use 1930.
        </p>

        {panelReason === "device-risk" && requiresSafetyCheck ? (
          <button className="button-secondary mt-5 w-full" type="button" onClick={continueFromSafetyPanel}>
            Continue with private mode
          </button>
        ) : null}
      </section>
    </div>
  );
}
