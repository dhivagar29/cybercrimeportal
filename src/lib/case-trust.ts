export const trustStages = [
  "filed",
  "verified",
  "hold_confirmed",
  "assigned_io",
  "fir_pending",
  "fir_registered",
  "restoration_in_progress",
  "closed",
] as const;

export type TrustStage = (typeof trustStages)[number];

export const caseDocumentTypes = ["bank-dispute", "fir-request", "custody-application", "indemnity-bond", "rti-request"] as const;
export type CaseDocumentType = (typeof caseDocumentTypes)[number];

export const documentMeta: Record<CaseDocumentType, { title: string; shortTitle: string; description: string }> = {
  "bank-dispute": { title: "Bank dispute and zero-liability notice", shortTitle: "Bank dispute letter", description: "Notifies the source bank and cites the RBI three-working-day zero-liability rule." },
  "fir-request": { title: "Request for FIR registration and linkage", shortTitle: "FIR request", description: "Asks the district police to register and link an FIR to the complaint." },
  "custody-application": { title: "Application for interim custody under S.106(3) BNSS", shortTitle: "S.106(3) custody application", description: "Requests release of held money through the applicable mock restoration branch." },
  "indemnity-bond": { title: "Indemnity bond for release of held funds", shortTitle: "Indemnity bond", description: "Records the citizen’s undertaking for bank execution of the release." },
  "rti-request": { title: "RTI request for action-taken report", shortTitle: "RTI action-taken request", description: "Requests the dated actions and present custodian of the complaint." },
};

export const trustStageMeta: Record<TrustStage, { label: string; meaning: string; actor: string; slaHours: number | null; slaLabel: string }> = {
  filed: { label: "Filed", meaning: "Your complaint and payment trail are recorded. This is not yet an FIR.", actor: "District cyber cell intake desk", slaHours: 24, slaLabel: "Cell verification target" },
  verified: { label: "Verified by cell", meaning: "The cyber cell checked the basic account and sent the beneficiary trail to the bank.", actor: "District cyber cell and beneficiary bank", slaHours: 7 * 24, slaLabel: "Bank response SLA" },
  hold_confirmed: { label: "Hold confirmed by bank", meaning: "A bank has confirmed money is marked in the beneficiary chain. A hold is not a return.", actor: "District cyber cell", slaHours: 15 * 24, slaLabel: "IO verification and assignment SLA" },
  assigned_io: { label: "Assigned to district IO", meaning: "A named investigating officer owns verification, FIR linkage, and the restoration path.", actor: "Investigating officer", slaHours: 15 * 24, slaLabel: "IO verification SLA" },
  fir_pending: { label: "FIR pending — your action available", meaning: "The complaint is not yet linked to an FIR. A filled request is ready for you to send.", actor: "Investigating officer and district police station", slaHours: 15 * 24, slaLabel: "FIR action / SGO appeal window" },
  fir_registered: { label: "FIR registered", meaning: "The complaint is linked to an FIR, so the above-₹50,000 restoration application can proceed.", actor: "Investigating officer and court liaison", slaHours: 15 * 24, slaLabel: "Custody application target" },
  restoration_in_progress: { label: "Restoration in progress", meaning: "The legal release step is active and the bank execution clock is running.", actor: "Bank nodal officer and competent authority", slaHours: 15 * 24, slaLabel: "Bank execution clock" },
  closed: { label: "Closed", meaning: "The tracked restoration action is complete. The returned amount is recorded below.", actor: "Citizen and bank", slaHours: null, slaLabel: "Complete" },
};

export interface TrustOfficer {
  name: string;
  designation: string;
  unit: string;
}

export interface BankHold {
  bankId: string;
  amount: number;
  holdOffsetMinutes: number;
}

export interface TrustHistoryFixture {
  stage: TrustStage;
  offsetMinutes: number;
  detail: string;
}

export interface SlaBreachFixture {
  id: string;
  title: string;
  actor: string;
  dueOffsetMinutes: number;
  completedOffsetMinutes?: number;
  detail: string;
}

export interface TrustCaseFixture {
  complaintId: string;
  initialStage: TrustStage;
  stageStartedOffsetMinutes: number;
  officer: TrustOfficer;
  amountTraced: number;
  amountReturned: number;
  bankHolds: BankHold[];
  history: TrustHistoryFixture[];
  breaches: SlaBreachFixture[];
  legacyStatus?: "Disposed";
  filedForName?: string;
}

export interface TrustHistoryEvent {
  stage: TrustStage;
  occurredAt: string;
  detail: string;
}

export interface SlaBreach {
  id: string;
  title: string;
  actor: string;
  dueAt: string;
  completedAt?: string;
  detail: string;
}

export interface LiveTrustCase extends Omit<TrustCaseFixture, "stageStartedOffsetMinutes" | "history" | "breaches" | "bankHolds"> {
  stageStartedAt: string;
  history: TrustHistoryEvent[];
  breaches: SlaBreach[];
  bankHolds: Array<Omit<BankHold, "holdOffsetMinutes"> & { heldAt: string }>;
}

export interface CaseActivity {
  id: string;
  type: "escalation" | "document" | "state" | "appeal";
  title: string;
  detail: string;
  occurredAt: string;
  documentType?: CaseDocumentType;
}

export interface SavedTrustState {
  version: 1;
  stage: TrustStage;
  stageStartedAt: string;
  activities: CaseActivity[];
  dgoEscalatedAt?: string;
  dgoNote?: string;
  sgoAppealedAt?: string;
  sgoNote?: string;
}

export function trustStorageKey(complaintId: string) {
  return `reclaim:trust-case:${complaintId}:v1`;
}

export function nextTrustStage(stage: TrustStage, amount: number) {
  const index = trustStages.indexOf(stage);
  if (index < 0 || index >= trustStages.length - 1) return null;
  if (stage === "assigned_io" && amount < 50_000) return "restoration_in_progress" as const;
  if (stage === "fir_pending") return "fir_registered" as const;
  return trustStages[index + 1];
}

export function isAtOrAfter(stage: TrustStage, target: TrustStage) {
  return trustStages.indexOf(stage) >= trustStages.indexOf(target);
}
