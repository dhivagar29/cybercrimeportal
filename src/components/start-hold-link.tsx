"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export const RESPONSE_START_KEY = "cybercrimeportal:response-start:v1";

export function StartHoldLink({ children, className }: { children: ReactNode; className: string }) {
  return (
    <Link href="/golden-hour" className={className} onClick={() => window.sessionStorage.setItem(RESPONSE_START_KEY, String(Date.now()))}>
      {children}
    </Link>
  );
}
