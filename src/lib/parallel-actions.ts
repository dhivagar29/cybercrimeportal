export const PARALLEL_ACTIONS_VERSION = 1 as const;

export type ParallelActionId = "call-1930" | "notify-bank" | "rbi-window" | "pause-mandates" | "check-sims";

export interface ParallelActionState {
  version: typeof PARALLEL_ACTIONS_VERSION;
  completed: ParallelActionId[];
  updatedAt: string;
}

export function parallelActionsStorageKey(scopeId: string) {
  return `reclaim:parallel-actions:${scopeId}:v1`;
}

export function addWorkingDays(value: string | number | Date, workingDays: number) {
  const deadline = new Date(value);
  let added = 0;
  while (added < workingDays) {
    deadline.setDate(deadline.getDate() + 1);
    const day = deadline.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return deadline;
}

export function readParallelActionState(raw: string | null): ParallelActionState {
  if (!raw) return { version: PARALLEL_ACTIONS_VERSION, completed: [], updatedAt: "" };
  try {
    const parsed = JSON.parse(raw) as ParallelActionState;
    return parsed.version === PARALLEL_ACTIONS_VERSION && Array.isArray(parsed.completed)
      ? parsed
      : { version: PARALLEL_ACTIONS_VERSION, completed: [], updatedAt: "" };
  } catch {
    return { version: PARALLEL_ACTIONS_VERSION, completed: [], updatedAt: "" };
  }
}
