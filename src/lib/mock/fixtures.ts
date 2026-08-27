import { banks } from "@/lib/mock/banks";
import { caseFixtures } from "@/lib/mock/cases";
import { personas } from "@/lib/mock/personas";
import { scamDatabase } from "@/lib/mock/scamdb";
import type {
  CitizenFixture,
  ComplaintFixture,
  LiveComplaint,
  SuspectIdentifier,
} from "@/lib/mock/types";

export const citizens: CitizenFixture[] = personas;
export { banks };
export const complaintFixtures: ComplaintFixture[] = caseFixtures;
export const suspects: SuspectIdentifier[] = scamDatabase;

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
