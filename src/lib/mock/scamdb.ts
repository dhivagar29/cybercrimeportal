import type { SuspectIdentifier } from "@/lib/mock/types";

export const scamDatabase: SuspectIdentifier[] = [
  { id: "sus-001", type: "upi", value: "verify2@paytm", reports: 17, lastSeenOffsetDays: -1 },
  { id: "sus-002", type: "upi", value: "securefund@oksbi", reports: 42, lastSeenOffsetDays: -2 },
  { id: "sus-003", type: "upi", value: "powerhelp@oksbi", reports: 31, lastSeenOffsetDays: -3, pattern: "Electricity-bill vishing pattern", firstSeen: "July 2026" },
  { id: "sus-004", type: "upi", value: "customsdesk@ybl", reports: 29, lastSeenOffsetDays: -4 },
  { id: "sus-005", type: "upi", value: "fastprofit@axl", reports: 36, lastSeenOffsetDays: -1 },
  { id: "sus-006", type: "upi", value: "courierfee@ibl", reports: 9, lastSeenOffsetDays: -8 },
  { id: "sus-007", type: "upi", value: "refunddesk@paytm", reports: 14, lastSeenOffsetDays: -6 },
  { id: "sus-008", type: "phone", value: "9812345678", reports: 23, lastSeenOffsetDays: -1, pattern: "Electricity-bill vishing pattern", firstSeen: "July 2026" },
  { id: "sus-009", type: "phone", value: "9123456701", reports: 31, lastSeenOffsetDays: -2 },
  { id: "sus-010", type: "phone", value: "9876543210", reports: 47, lastSeenOffsetDays: -1, pattern: "Investment scam pattern", firstSeen: "June 2026" },
  { id: "sus-011", type: "phone", value: "9012345670", reports: 7, lastSeenOffsetDays: -11 },
  { id: "sus-012", type: "phone", value: "9988776655", reports: 52, lastSeenOffsetDays: -1 },
  { id: "sus-013", type: "phone", value: "8866001122", reports: 16, lastSeenOffsetDays: -7 },
  { id: "sus-014", type: "phone", value: "9911223344", reports: 64, lastSeenOffsetDays: -2, pattern: "Digital-arrest coercion pattern", firstSeen: "May 2026" },
  { id: "sus-015", type: "url", value: "bharat-trade-pro.example", reports: 38, lastSeenOffsetDays: -2 },
  { id: "sus-016", type: "url", value: "parcel-kyc.example", reports: 21, lastSeenOffsetDays: -3 },
  { id: "sus-017", type: "url", value: "electricity-update.example", reports: 19, lastSeenOffsetDays: -4 },
  { id: "sus-018", type: "url", value: "instant-refund.example", reports: 13, lastSeenOffsetDays: -6 },
  { id: "sus-019", type: "url", value: "custody-check.in", reports: 58, lastSeenOffsetDays: -2, pattern: "Digital-arrest coercion pattern", firstSeen: "May 2026" },
  { id: "sus-020", type: "url", value: "remote-helpdesk.example", reports: 33, lastSeenOffsetDays: -1 },
  { id: "sus-021", type: "apk", value: "QuickBillSupport.apk", reports: 24, lastSeenOffsetDays: -2, pattern: "Remote-access APK pattern", firstSeen: "July 2026" },
  { id: "sus-022", type: "apk", value: "BankKYCUpdate.apk", reports: 46, lastSeenOffsetDays: -1 },
  { id: "sus-023", type: "apk", value: "ParcelTrack.apk", reports: 15, lastSeenOffsetDays: -8 },
  { id: "sus-024", type: "apk", value: "SecureDesk.apk", reports: 35, lastSeenOffsetDays: -4 },
  { id: "sus-025", type: "apk", value: "PoliceVerify.apk", reports: 28, lastSeenOffsetDays: -3 },
];

export const caseSuspectQueries: Record<string, string> = {
  "22026082710482": "9876543210",
  "22026082709831": "9812345678",
  "22026081508724": "9911223344",
};
