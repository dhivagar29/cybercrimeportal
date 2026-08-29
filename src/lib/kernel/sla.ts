export interface ResolveSlaInput {
  stageStartedAt: string;
  hours: number;
  now?: number;
}

export interface ResolvedSla {
  deadline: string;
  breached: boolean;
  msRemaining: number;
}

export function resolveSla({
  stageStartedAt,
  hours,
  now = Date.now(),
}: ResolveSlaInput): ResolvedSla {
  const startedAt = new Date(stageStartedAt).getTime();
  if (!Number.isFinite(startedAt) || !Number.isFinite(hours)) {
    throw new TypeError("resolveSla requires a valid stage start and hour count.");
  }

  const deadlineMs = startedAt + hours * 60 * 60 * 1000;
  const msRemaining = deadlineMs - now;

  return {
    deadline: new Date(deadlineMs).toISOString(),
    breached: msRemaining < 0,
    msRemaining,
  };
}
