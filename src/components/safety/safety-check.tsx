"use client";

import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { SAFETY_PREMISE, useSafety } from "@/lib/safety";

export function SafetyCheckInterstitial() {
  const { answerDeviceSafety } = useSafety();

  return (
    <div className="page-wrap">
      <section
        className="mx-auto max-w-2xl border-2 border-[var(--primary)] bg-white p-5 shadow-[6px_6px_0_#c9d2da] sm:p-8"
        aria-labelledby="device-safety-heading"
      >
        <ShieldCheck aria-hidden="true" className="text-[var(--primary)]" size={42} />
        <p className="eyebrow mt-5">Safety check</p>
        <p className="mt-3 border-l-4 border-[var(--primary)] bg-[var(--blue-soft)] p-3 leading-7">
          {SAFETY_PREMISE}
        </p>
        <h1 id="device-safety-heading" className="mt-6 text-3xl leading-tight sm:text-4xl">
          Is the person doing this able to see this device?
        </h1>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            className="button-primary min-h-16"
            type="button"
            onClick={() => answerDeviceSafety("yes")}
          >
            <Eye aria-hidden="true" size={22} /> Yes, they may see it
          </button>
          <button
            className="button-secondary min-h-16"
            type="button"
            onClick={() => answerDeviceSafety("no")}
          >
            <EyeOff aria-hidden="true" size={22} /> No, this device is private
          </button>
        </div>
        <p className="mb-0 mt-6 text-sm leading-6 text-[var(--muted)]">
          Reference only: this prototype cannot call or contact anyone. For immediate danger use 112; Childline 1098; Women Helpline 181. For cyber financial fraud use 1930.
        </p>
      </section>
    </div>
  );
}
