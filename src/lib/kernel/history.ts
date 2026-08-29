import { relativeIso } from "@/lib/kernel/time";

export interface HistoryFixture<TStage extends string> {
  stage: TStage;
  offsetMinutes: number;
  detail: string;
}

export interface HistoryEvent<TStage extends string> {
  stage: TStage;
  occurredAt: string;
  detail: string;
}

export function hydrateHistoryFixture<TStage extends string>(
  fixture: HistoryFixture<TStage>,
  now: number,
): HistoryEvent<TStage> {
  const { offsetMinutes, ...event } = fixture;
  return {
    ...event,
    occurredAt: relativeIso(now, offsetMinutes),
  };
}

export function hydrateHistoryFixtures<TStage extends string>(
  fixtures: readonly HistoryFixture<TStage>[],
  now: number,
) {
  return fixtures.map((fixture) => hydrateHistoryFixture(fixture, now));
}
