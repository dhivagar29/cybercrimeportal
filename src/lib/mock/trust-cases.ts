import type { LiveTrustCase, TrustCaseFixture } from "@/lib/case-trust";
import { relativeIso } from "@/lib/kernel/time";

export const trustCaseFixtures: TrustCaseFixture[] = [
  {
    complaintId: "22026082710482", initialStage: "hold_confirmed", stageStartedOffsetMinutes: -4,
    officer: { name: "Inspector Kavya Rao", designation: "Inspector", unit: "Cyber Crime Police Station, Chennai" },
    amountTraced: 290000, amountReturned: 0,
    bankHolds: [{ bankId: "bank-sbi", amount: 75000, holdOffsetMinutes: -6 }, { bankId: "bank-axis", amount: 43000, holdOffsetMinutes: -5 }],
    history: [
      { stage: "filed", offsetMinutes: -13, detail: "Complaint and RTGS trail filed without waiting for suspect details." },
      { stage: "verified", offsetMinutes: -10, detail: "Chennai cyber cell verified the payment trail." },
      { stage: "hold_confirmed", offsetMinutes: -4, detail: "SBI and Axis Bank confirmed ₹1,18,000 held across the chain." },
    ], breaches: [],
  },
  {
    complaintId: "22026082709831", initialStage: "restoration_in_progress", stageStartedOffsetMinutes: -180,
    officer: { name: "Sub-Inspector Ananya Shetty", designation: "Sub-Inspector", unit: "Cyber Crime Police Station, Bengaluru Urban" },
    amountTraced: 18000, amountReturned: 0,
    bankHolds: [{ bankId: "bank-axis", amount: 18000, holdOffsetMinutes: -1100 }],
    history: [
      { stage: "filed", offsetMinutes: -1370, detail: "UPI complaint filed with payee and payment reference." },
      { stage: "verified", offsetMinutes: -1300, detail: "Bengaluru cyber cell verified the electricity-call account." },
      { stage: "hold_confirmed", offsetMinutes: -1100, detail: "Axis Bank confirmed the full ₹18,000 held." },
      { stage: "assigned_io", offsetMinutes: -900, detail: "Sub-Inspector Ananya Shetty took ownership." },
      { stage: "restoration_in_progress", offsetMinutes: -180, detail: "Direct interim custody path opened; FIR not required under the demo rule." },
    ], breaches: [],
  },
  {
    complaintId: "22026081508724", initialStage: "assigned_io", stageStartedOffsetMinutes: -2880,
    officer: { name: "Inspector Vikram Singh", designation: "Inspector", unit: "Cyber Police Station, South Delhi" },
    amountTraced: 310000, amountReturned: 0, legacyStatus: "Disposed", filedForName: "Rajesh Sharma (father)",
    bankHolds: [{ bankId: "bank-hdfc", amount: 50000, holdOffsetMinutes: -4320 }, { bankId: "bank-sbi", amount: 34000, holdOffsetMinutes: -4310 }],
    history: [
      { stage: "filed", offsetMinutes: -17280, detail: "Priya filed the digital-arrest complaint for her father." },
      { stage: "verified", offsetMinutes: -16560, detail: "South Delhi cyber cell verified the NEFT trail and sent bank notices." },
      { stage: "hold_confirmed", offsetMinutes: -4320, detail: "Banks confirmed ₹84,000 held, 1 day 12 hours after the 7-day response SLA." },
      { stage: "assigned_io", offsetMinutes: -2880, detail: "Inspector Vikram Singh was assigned; FIR linkage is the next required step." },
    ],
    breaches: [{ id: "priya-bank-response", title: "Bank response exceeded 7 days", actor: "Beneficiary bank nodal officers", dueOffsetMinutes: -6480, completedOffsetMinutes: -4320, detail: "The formal bank confirmation arrived 1 day 12 hours after its SOP deadline. This unresolved service breach can be escalated even though funds were later held." }],
  },
  {
    complaintId: "22026072307618", initialStage: "fir_registered", stageStartedOffsetMinutes: -7200,
    officer: { name: "Inspector Nisha Patil", designation: "Inspector", unit: "Cyber Police Station, Mumbai Suburban" },
    amountTraced: 91000, amountReturned: 0,
    bankHolds: [{ bankId: "bank-icici", amount: 27500, holdOffsetMinutes: -115200 }],
    history: [
      { stage: "filed", offsetMinutes: -49920, detail: "Investment complaint filed." },
      { stage: "verified", offsetMinutes: -48000, detail: "Payment trail verified." },
      { stage: "hold_confirmed", offsetMinutes: -43200, detail: "ICICI Bank confirmed ₹27,500 held." },
      { stage: "assigned_io", offsetMinutes: -30000, detail: "Investigating officer assigned." },
      { stage: "fir_registered", offsetMinutes: -7200, detail: "FIR registered and linked to the complaint." },
    ], breaches: [],
  },
  {
    complaintId: "22026061206109", initialStage: "closed", stageStartedOffsetMinutes: -1440,
    officer: { name: "Sub-Inspector Farah Khan", designation: "Sub-Inspector", unit: "Cyber Crime Police Station, Jaipur" },
    amountTraced: 49000, amountReturned: 49000,
    bankHolds: [{ bankId: "bank-icici", amount: 49000, holdOffsetMinutes: -172800 }],
    history: [
      { stage: "filed", offsetMinutes: -187020, detail: "Impersonation complaint filed." },
      { stage: "verified", offsetMinutes: -186000, detail: "Social-media and UPI trail verified." },
      { stage: "hold_confirmed", offsetMinutes: -172800, detail: "Full amount held." },
      { stage: "assigned_io", offsetMinutes: -160000, detail: "IO assigned." },
      { stage: "restoration_in_progress", offsetMinutes: -21600, detail: "Direct custody order sent to the bank." },
      { stage: "closed", offsetMinutes: -1440, detail: "₹49,000 returned and restoration action closed." },
    ], breaches: [],
  },
  {
    complaintId: "22026082711203", initialStage: "restoration_in_progress", stageStartedOffsetMinutes: -260,
    officer: { name: "Inspector S. Lakshmi", designation: "Inspector", unit: "Cyber Crime Police Station, Hyderabad" },
    amountTraced: 76000, amountReturned: 0, legacyStatus: "Disposed",
    bankHolds: [{ bankId: "bank-sbi", amount: 42000, holdOffsetMinutes: -300 }],
    history: [
      { stage: "filed", offsetMinutes: -315, detail: "Card fraud complaint filed." },
      { stage: "verified", offsetMinutes: -310, detail: "Card trail verified." },
      { stage: "hold_confirmed", offsetMinutes: -300, detail: "SBI confirmed ₹42,000 held." },
      { stage: "assigned_io", offsetMinutes: -290, detail: "IO assigned." },
      { stage: "fir_registered", offsetMinutes: -275, detail: "FIR linked." },
      { stage: "restoration_in_progress", offsetMinutes: -260, detail: "Custody application filed." },
    ], breaches: [],
  },
];

export function getLiveTrustCase(complaintId: string, now = Date.now()): LiveTrustCase | undefined {
  const fixture = trustCaseFixtures.find((item) => item.complaintId === complaintId);
  if (!fixture) return undefined;
  const { stageStartedOffsetMinutes, history, breaches, bankHolds, ...rest } = fixture;
  return {
    ...rest,
    stageStartedAt: relativeIso(now, stageStartedOffsetMinutes),
    history: history.map((event) => ({ stage: event.stage, detail: event.detail, occurredAt: relativeIso(now, event.offsetMinutes) })),
    breaches: breaches.map((breach) => ({ id: breach.id, title: breach.title, actor: breach.actor, detail: breach.detail, dueAt: relativeIso(now, breach.dueOffsetMinutes), completedAt: breach.completedOffsetMinutes === undefined ? undefined : relativeIso(now, breach.completedOffsetMinutes) })),
    bankHolds: bankHolds.map(({ holdOffsetMinutes, ...hold }) => ({ ...hold, heldAt: relativeIso(now, holdOffsetMinutes) })),
  };
}
