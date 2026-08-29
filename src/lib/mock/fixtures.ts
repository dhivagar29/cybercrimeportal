import { banks } from "@/lib/mock/banks";
import { caseFixtures } from "@/lib/mock/cases";
import { personas } from "@/lib/mock/personas";
import { scamDatabase } from "@/lib/mock/scamdb";
import { hydrateFixture } from "@/lib/kernel/time";
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

export function getLiveComplaints(now = Date.now()): LiveComplaint[] {
  return complaintFixtures.map((fixture) =>
    hydrateFixture(fixture, now, {
      occurredOffsetMinutes: "occurredAt",
      reportedOffsetMinutes: "reportedAt",
      stageStartedOffsetMinutes: "stageStartedAt",
    }),
  );
}

export function getBank(id: string) {
  return banks.find((bank) => bank.id === id);
}
