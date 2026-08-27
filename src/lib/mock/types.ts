export const caseStages = [
  "filed",
  "routed",
  "assigned",
  "hold_placed",
  "fir_linked",
  "custody_applied",
  "restored",
] as const;

export type CaseStage = (typeof caseStages)[number];
export type Rail = "UPI" | "IMPS" | "NEFT" | "RTGS" | "Card" | "Wallet";
export type SuspectIdentifierType = "phone" | "upi" | "url" | "apk";

export interface CitizenFixture {
  id: string;
  name: string;
  age: number;
  language: "en" | "hi";
  persona: "fresh-victim" | "relative-filed" | "case-builder";
  accessCode: string;
  description: string;
}

export interface ComplaintFixture {
  id: string;
  citizenId: string;
  state: string;
  district: string;
  category: string;
  subcategory: string;
  amount: number;
  occurredOffsetMinutes: number;
  reportedOffsetMinutes: number;
  stage: CaseStage;
  stageStartedOffsetMinutes: number;
  rail: Rail;
  sourceBankId: string;
  beneficiaryBankId: string;
  holdAmount: number;
  reference: string;
}

export interface BankFixture {
  id: string;
  name: string;
  maskedAccount: string;
  holdAmount: number;
  upiApps: string[];
  fraudLine: string;
}

export interface PersonaCaseHistory {
  acknowledgement: string;
  label: string;
  amount: number;
  currentStage: CaseStage;
  filedFor: "self" | "relative";
  legacyStatus?: "Disposed";
}

export interface DemoPersona extends CitizenFixture {
  email: string;
  password: "demo1234";
  firstName: string;
  destination: string;
  caseHistory: PersonaCaseHistory[];
}

export interface SuspectIdentifier {
  id: string;
  type: SuspectIdentifierType;
  value: string;
  reports: number;
  lastSeenOffsetDays: number;
}

export interface LiveComplaint extends Omit<ComplaintFixture, "occurredOffsetMinutes" | "reportedOffsetMinutes" | "stageStartedOffsetMinutes"> {
  occurredAt: string;
  reportedAt: string;
  stageStartedAt: string;
}
