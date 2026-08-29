export interface StageMeta {
  label: string;
  meaning: string;
  actor: string;
}

export interface StageTrack<TStage extends string> {
  stages: readonly TStage[];
  meta: Record<TStage, StageMeta>;
  isAtOrAfter: (stage: TStage, target: TStage) => boolean;
  nextStage: (stage: TStage) => TStage | null;
  stageIndex: (stage: TStage) => number;
}

export function defineTrack<TStage extends string>({
  stages,
  meta,
}: {
  stages: readonly TStage[];
  meta: Record<TStage, StageMeta>;
}): StageTrack<TStage> {
  const stageIndex = (stage: TStage) => stages.indexOf(stage);

  return {
    stages,
    meta,
    stageIndex,
    isAtOrAfter(stage, target) {
      const currentIndex = stageIndex(stage);
      const targetIndex = stageIndex(target);
      return currentIndex >= 0 && targetIndex >= 0 && currentIndex >= targetIndex;
    },
    nextStage(stage) {
      const index = stageIndex(stage);
      if (index < 0 || index >= stages.length - 1) return null;
      return stages[index + 1] ?? null;
    },
  };
}
