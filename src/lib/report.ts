import type { IntakeAnalysis } from "@/lib/engine";

export const REPORT_BUILDER_KEY = "reclaim:assisted-report:v1";
export const SUBMITTED_CASES_KEY = "reclaim:submitted-cases:v1";

export type ReportStep = "intake" | "understood" | "form" | "submitted";

export interface StatutoryFormDraft {
  incidentDateTime: string;
  category: string;
  subcategory: string;
  amount: string;
  paymentMethod: string;
  bankOrApp: string;
  narrative: string;
  paymentReferences: string;
  suspectName: string;
  suspectPhone: string;
  suspectUpi: string;
  suspectUrlOrHandle: string;
  suspectAddress: string;
  complainantName: string;
  complainantEmail: string;
  complainantPhone: string;
  complainantAge: string;
  filedFor: "self" | "relative";
}

export interface AssistedReportDraft {
  version: 1;
  step: ReportStep;
  narrative: string;
  analysis: IntakeAnalysis | null;
  evidenceNames: string[];
  form: StatutoryFormDraft | null;
  touchedFields: string[];
  updatedAt: string;
  acknowledgement?: string;
}

export interface SubmittedCitizenCase {
  acknowledgement: string;
  filedAt: string;
  category: string;
  subcategory: string;
  amount: number;
  paymentMethod: string;
  bankOrApp: string;
  complainantName: string;
  summary: string;
  stage: "filed";
}

export function makeAcknowledgement(now = Date.now()) {
  return `2${String(now).padStart(13, "0").slice(-13)}`;
}

export function rupeeStringToNumber(value: string) {
  const numeric = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

export function toLocalDateTime(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}
