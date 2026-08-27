import banksJson from "@/data/banks.json";
import citizensJson from "@/data/citizens.json";
import complaintsJson from "@/data/complaints.json";
import suspectsJson from "@/data/suspects.json";
import type {
  BankFixture,
  CitizenFixture,
  ComplaintFixture,
  LiveComplaint,
  SuspectIdentifier,
} from "@/types/domain";

export const citizens = citizensJson as CitizenFixture[];
export const banks = banksJson as BankFixture[];
export const complaintFixtures = complaintsJson as ComplaintFixture[];
export const suspects = suspectsJson as SuspectIdentifier[];

const fromNow = (offsetMinutes: number, now: number) =>
  new Date(now + offsetMinutes * 60_000).toISOString();

export function getLiveComplaints(now = Date.now()): LiveComplaint[] {
  return complaintFixtures.map(
    ({
      occurredOffsetMinutes,
      reportedOffsetMinutes,
      stageStartedOffsetMinutes,
      ...complaint
    }) => ({
      ...complaint,
      occurredAt: fromNow(occurredOffsetMinutes, now),
      reportedAt: fromNow(reportedOffsetMinutes, now),
      stageStartedAt: fromNow(stageStartedOffsetMinutes, now),
    }),
  );
}

export function getBank(id: string) {
  return banks.find((bank) => bank.id === id);
}
