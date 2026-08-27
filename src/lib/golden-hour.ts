export const GOLDEN_HOUR_TICKET_KEY = "reclaim:golden-hour-ticket:v1";
export const GOLDEN_HOUR_REPORT_KEY = "reclaim:report-draft:v1";

export const whenChoices = [
  { id: "just-now", label: "Just now", offsetMinutes: 0 },
  { id: "under-hour", label: "Under 1 hour", offsetMinutes: 30 },
  { id: "today", label: "Today", offsetMinutes: 4 * 60 },
  { id: "earlier", label: "Earlier", offsetMinutes: 2 * 24 * 60 },
] as const;

export const paymentMethods = ["UPI", "Bank transfer", "Card", "Wallet"] as const;

export type WhenChoice = (typeof whenChoices)[number]["id"];
export type PaymentMethod = (typeof paymentMethods)[number];

export interface GoldenHourAnswers {
  amount: number;
  whenChoice: WhenChoice;
  occurredAt: string;
  paymentMethod: PaymentMethod;
  bankId: string;
  bankName: string;
}

export interface GoldenHourTicket extends GoldenHourAnswers {
  reference: string;
  requestedAt: string;
  responseSeconds: number;
  state: "hold-request-sent";
}

export function formatGoldenHourDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getWhenLabel(choice: WhenChoice) {
  return whenChoices.find((item) => item.id === choice)?.label ?? "Time recorded";
}
