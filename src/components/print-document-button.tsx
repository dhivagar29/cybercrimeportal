"use client";

import { Printer } from "lucide-react";

export function PrintDocumentButton() {
  return <button className="button-primary print-hidden" type="button" onClick={() => window.print()}><Printer aria-hidden="true" size={20} /> Print or save as PDF</button>;
}
