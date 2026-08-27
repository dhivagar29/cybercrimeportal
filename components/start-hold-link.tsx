"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export const RESPONSE_START_KEY = "cybercrimeportal:response-start:v1";

export function StartHoldLink({ children, className, direct = false }: { children: ReactNode; className: string; direct?: boolean }) {
  return (
    <Link href={direct ? "/report/hold" : "/report"} className={className} onClick={() => window.sessionStorage.setItem(RESPONSE_START_KEY, String(Date.now()))}>
      {children}
    </Link>
  );
}
