"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleDollarSign, FileText, Home, Languages, Search, ShieldCheck, TextCursorInput } from "lucide-react";
import { useEffect, useState } from "react";

const LARGE_TYPE_KEY = "cybercrimeportal:large-type:v1";
const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/report", label: "Stop loss", icon: CircleDollarSign },
  { href: "/describe", label: "Describe", icon: TextCursorInput },
  { href: "/case", label: "My case", icon: FileText },
  { href: "/check", label: "Scam check", icon: Search },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [largeType, setLargeType] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(LARGE_TYPE_KEY) === "true",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("large-type", largeType);
  }, [largeType]);

  function toggleLargeType() {
    setLargeType((current) => {
      const next = !current;
      document.documentElement.classList.toggle("large-type", next);
      window.localStorage.setItem(LARGE_TYPE_KEY, String(next));
      return next;
    });
  }

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="bg-[#e45118] px-3 py-2 text-center text-xs font-black tracking-wide text-white">
        Independent hackathon prototype — not affiliated with I4C/MHA. All data is mock.
      </div>
      <header className="border-b-2 border-[#0b2b4c] bg-white">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-3 px-4 py-3 md:px-8">
          <Link href="/" className="flex items-center gap-2 no-underline" aria-label="Raksha home">
            <span className="grid size-9 place-items-center bg-[#0b2b4c] text-white"><ShieldCheck aria-hidden="true" size={22} /></span>
            <span><strong className="block tracking-[0.08em] text-[#0b2b4c]">RAKSHA</strong><span className="block text-xs text-[#52606d]">नागरिक साइबर सहायता</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <button className="button-quiet px-2 text-xs" type="button" disabled title="Language switching is outside this demo"><Languages aria-hidden="true" size={16} /><span><span className="hidden md:inline">Demo: </span>English only</span></button>
            <button suppressHydrationWarning className="button-quiet" type="button" onClick={toggleLargeType} aria-pressed={largeType}>
              <span aria-hidden="true" className="text-lg font-black">Aa</span>
              <span className="hidden sm:inline">Large type</span>
            </button>
          </div>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[#0b2b4c] bg-white md:static md:border-y-2 md:border-t-0">
        <div className="mx-auto grid w-full max-w-[760px] grid-cols-5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 border-r border-[#d4dce5] px-1 text-center text-[0.68rem] font-black no-underline last:border-r-0 md:flex-row md:text-sm ${active ? "bg-[#0b2b4c] text-white" : "bg-white text-[#24374a] hover:bg-[#edf4fa]"}`}>
                <Icon aria-hidden="true" size={20} strokeWidth={2.4} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
