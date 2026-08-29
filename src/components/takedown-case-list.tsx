"use client";

import { ArrowRight, EyeOff, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getLiveTakedownCases } from "@/lib/mock/takedown-cases";
import {
  platformMeta,
  TAKEDOWN_CASES_KEY,
  takedownHarmMeta,
  takedownStageMeta,
  type SavedTakedownCase,
} from "@/lib/takedown";

function readSavedCases(raw: string | null): SavedTakedownCase[] {
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

export function TakedownCaseList() {
  const [cases, setCases] = useState<SavedTakedownCase[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = readSavedCases(readStorage(TAKEDOWN_CASES_KEY));
      const savedIds = new Set(saved.map((item) => item.acknowledgement));
      const seeded = getLiveTakedownCases(Date.now())
        .filter((item) => !savedIds.has(item.acknowledgement))
        .map((item) => ({ ...item, version: 1 as const }));
      setCases([...saved, ...seeded]);
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="mt-7 border-t-2 border-[var(--line)] pt-7" aria-labelledby="takedown-cases-heading">
      <p className="eyebrow">Stop the spread cases</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 id="takedown-cases-heading" className="m-0 mt-1 text-2xl">Harassment, hacked-account, and takedown reports</h2><p className="mb-0 mt-2 text-sm leading-6 text-[var(--muted)]">Content deadlines are tracked separately from money recovery.</p></div>
        <Link className="button-secondary" href="/takedown">Start a takedown report <ArrowRight aria-hidden="true" size={18} /></Link>
      </div>
      {!hydrated ? <div className="panel mt-4" role="status"><strong>Loading device-side takedown reports…</strong></div> : null}
      {hydrated ? <div className="mt-4 grid gap-3">{cases.map((item) => (
        <article className="panel grid gap-3 md:grid-cols-[1fr_auto] md:items-center" key={item.acknowledgement}>
          <div>
            <div className="flex flex-wrap items-center gap-2"><ShieldAlert aria-hidden="true" className="text-[var(--primary)]" size={22} /><h3 className="m-0 font-mono text-lg">{item.acknowledgement}</h3><span className="status-pill text-[var(--primary)]">{takedownStageMeta[item.stage].label}</span>{item.anonymous ? <span className="status-pill text-[var(--safe)]"><EyeOff aria-hidden="true" className="mr-1" size={14} /> Anonymous</span> : null}</div>
            <p className="mb-0 mt-2 text-sm leading-6 text-[var(--muted)]">{takedownHarmMeta[item.harm].shortLabel} · {platformMeta[item.platform].label} · reported {new Date(item.reportedAt).toLocaleString("en-IN")}</p>
          </div>
          <Link className="button-secondary" href={`/case/takedown/${item.acknowledgement}`}>Open tracker <ArrowRight aria-hidden="true" size={18} /></Link>
        </article>
      ))}</div> : null}
    </section>
  );
}
