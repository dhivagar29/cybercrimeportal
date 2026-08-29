"use client";

import { CircleDollarSign, FileText, Home, Languages, LogIn, Search, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AUTH_EVENT, readMockSession } from "@/lib/auth";
import { findPersona } from "@/lib/mock/personas";
import {
  SafetyFloatingControls,
  SafetyNoticeStrip,
  SafetyPanel,
} from "@/components/safety/safety-controls";
import { SafetyCheckInterstitial } from "@/components/safety/safety-check";
import { SafetyProvider } from "@/components/safety/safety-provider";
import {
  NEUTRAL_EXIT_ROUTE,
  RECLAIM_STORAGE_CLEARED_EVENT,
  useSafety,
} from "@/lib/safety";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/golden-hour", label: "Stop loss", icon: CircleDollarSign },
  { href: "/report", label: "Report", icon: FileText },
  { href: "/case", label: "Cases", icon: ShieldCheck },
  { href: "/scam-check", label: "Scam check", icon: Search },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SafetyProvider>
      <AppShellFrame>{children}</AppShellFrame>
    </SafetyProvider>
  );
}

function AppShellFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [personaId, setPersonaId] = useState<string | null>(null);
  const { requiresSafetyCheck } = useSafety();

  useEffect(() => {
    function syncSession() { setPersonaId(readMockSession()?.personaId ?? null); }
    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener(AUTH_EVENT, syncSession);
    window.addEventListener(RECLAIM_STORAGE_CLEARED_EVENT, syncSession);
    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(AUTH_EVENT, syncSession);
      window.removeEventListener(RECLAIM_STORAGE_CLEARED_EVENT, syncSession);
    };
  }, []);

  const persona = findPersona(personaId);

  if (pathname === NEUTRAL_EXIT_ROUTE) return <>{children}</>;

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="mock-banner">Independent hackathon prototype — not affiliated with I4C/MHA. All data is mock.</div>
      <header className="app-header border-b-2 border-[var(--primary)] bg-white">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-2 px-4 py-3 md:px-8">
          <Link href="/" className="flex min-h-12 items-center gap-2 no-underline" aria-label="Reclaim home">
            <span className="hidden size-10 shrink-0 place-items-center bg-[var(--primary)] text-white sm:grid"><ShieldCheck aria-hidden="true" size={23} /></span>
            <strong className="text-xl tracking-[-0.03em] text-[var(--primary)]">Reclaim</strong>
          </Link>
          <div className="flex items-center gap-2">
            <button aria-label="Demo: English only" className="button-quiet px-2 text-xs" type="button" disabled title="Language switching is outside this demo"><Languages aria-hidden="true" size={17} /><span>Demo: English only</span></button>
            <Link className="button-secondary px-3" href={persona ? "/case" : "/login"} aria-label={persona ? `Account for ${persona.name}` : "Log in to a mock account"}>
              {persona ? <UserRound aria-hidden="true" size={18} /> : <LogIn aria-hidden="true" size={18} />}
              <span className="hidden sm:inline">{persona ? persona.firstName : "Log in"}</span>
            </Link>
          </div>
        </div>
      </header>
      <SafetyNoticeStrip />
      <main id="main-content">{requiresSafetyCheck ? <SafetyCheckInterstitial /> : children}</main>
      <nav aria-label="Primary" className="app-nav fixed inset-x-0 bottom-0 z-40 border-t-2 border-[var(--primary)] bg-white md:static">
        <div className="mx-auto grid w-full max-w-[760px] grid-cols-5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === href : pathname.startsWith(href);
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 border-r border-[var(--line)] px-1 text-center text-[0.68rem] font-black no-underline last:border-r-0 md:flex-row md:text-sm ${active ? "bg-[var(--primary)] text-white" : "bg-white text-[var(--ink)] hover:bg-[var(--blue-soft)]"}`}><Icon aria-hidden="true" size={20} strokeWidth={2.4} /><span>{label}</span></Link>;
          })}
        </div>
      </nav>
      <SafetyFloatingControls />
      <SafetyPanel />
    </>
  );
}
