import type { ExtractedEntity } from "@/lib/engine";
import type { HistoryEvent } from "@/lib/kernel/history";
import { resolveSla } from "@/lib/kernel/sla";
import { defineTrack, type StageMeta } from "@/lib/kernel/stages";
import { buildStorageKey } from "@/lib/kernel/storage";
import {
  emptyEvidenceChecklist,
  INTIMATE_IMAGE_ACTION_SLA_HOURS,
  PLATFORM_ACKNOWLEDGEMENT_SLA_HOURS,
  STANDARD_PLATFORM_ACTION_SLA_HOURS,
  type EvidenceChecklistState,
  type TakedownPlatform,
} from "@/lib/takedown";

export const wcHarms = [
  "online_harassment",
  "stalking",
  "ncii_woman",
  "sextortion_woman",
  "impersonation_woman",
  "child_safety",
] as const;

export type WcHarm = (typeof wcHarms)[number];

export const reporterRoles = [
  "self",
  "guardian",
  "teacher_or_counsellor",
  "other_trusted_adult",
] as const;

export type ReporterRole = (typeof reporterRoles)[number];

export const wcSubjects = ["self", "child", "helping_other"] as const;
export type WcSubject = (typeof wcSubjects)[number];

export const wcStages = [
  "reported",
  "platform_acknowledged",
  "content_action_taken",
  "escalated_to_authority",
  "support_connected",
] as const;

export type WcStage = (typeof wcStages)[number];

export const reporterRoleMeta: Record<ReporterRole, { label: string }> = {
  self: { label: "I am reporting for myself" },
  guardian: { label: "Parent or guardian" },
  teacher_or_counsellor: { label: "Teacher or counsellor" },
  other_trusted_adult: { label: "Another trusted adult" },
};

export const wcSubjectMeta: Record<WcSubject, { label: string }> = {
  self: { label: "Myself" },
  child: { label: "A child I am responsible for" },
  helping_other: { label: "Someone else who asked me to help" },
};

export const wcHarmMeta: Record<
  WcHarm,
  {
    label: string;
    shortLabel: string;
    category: string;
    subcategory: string;
    actionSlaHours: number;
    actionSlaLabel: string;
    authorityLabel: string;
  }
> = {
  online_harassment: {
    label: "Abusive messages or online harassment",
    shortLabel: "Online harassment",
    category: "Online and Social Media Crime",
    subcategory: "Cyber Bullying / Online Harassment",
    actionSlaHours: STANDARD_PLATFORM_ACTION_SLA_HOURS,
    actionSlaLabel: "15-day action window",
    authorityLabel: "NCRP and the appropriate local police intake",
  },
  stalking: {
    label: "Repeated contact, stalking, or threats",
    shortLabel: "Cyber stalking or threats",
    category: "Online and Social Media Crime",
    subcategory: "Cyber Stalking",
    actionSlaHours: STANDARD_PLATFORM_ACTION_SLA_HOURS,
    actionSlaLabel: "15-day action window",
    authorityLabel: "NCRP and the appropriate local police intake",
  },
  ncii_woman: {
    label: "Intimate images shared without consent",
    shortLabel: "Non-consensual intimate imagery",
    category: "Online and Social Media Crime",
    subcategory: "Non-consensual Intimate Imagery (NCII)",
    actionSlaHours: INTIMATE_IMAGE_ACTION_SLA_HOURS,
    actionSlaLabel: "24-hour intimate-image action window",
    authorityLabel: "NCRP and the appropriate women’s safety police intake",
  },
  sextortion_woman: {
    label: "Blackmail or threats involving private images",
    shortLabel: "Sextortion or image-based blackmail",
    category: "Online and Social Media Crime",
    subcategory: "Cyber Blackmail / Sextortion",
    actionSlaHours: STANDARD_PLATFORM_ACTION_SLA_HOURS,
    actionSlaLabel: "15-day action window",
    authorityLabel: "NCRP and the appropriate women’s safety police intake",
  },
  impersonation_woman: {
    label: "A fake profile is pretending to be me",
    shortLabel: "Impersonation",
    category: "Online and Social Media Crime",
    subcategory: "Fake Profile / Impersonation",
    actionSlaHours: STANDARD_PLATFORM_ACTION_SLA_HOURS,
    actionSlaLabel: "15-day action window",
    authorityLabel: "NCRP and the appropriate local cybercrime intake",
  },
  child_safety: {
    label: "A minor is being targeted or contacted online",
    shortLabel: "Child online safety",
    category: "Cyber Crime against Women & Children",
    subcategory: "Online Child Safety / POCSO-track Handling",
    actionSlaHours: INTIMATE_IMAGE_ACTION_SLA_HOURS,
    actionSlaLabel: "24-hour child-safety response window",
    authorityLabel: "The appropriate child-protection and POCSO-track police intake",
  },
};

export const wcStageMeta: Record<WcStage, StageMeta> = {
  reported: {
    label: "Reported",
    meaning: "The report and evidence description are recorded in this prototype.",
    actor: "Citizen or trusted adult",
  },
  platform_acknowledged: {
    label: "Platform acknowledged",
    meaning: "The platform has acknowledged the content or account report.",
    actor: "Platform grievance team",
  },
  content_action_taken: {
    label: "Content action taken",
    meaning: "The platform reports that it removed, restricted, or reviewed the content or account.",
    actor: "Platform grievance team",
  },
  escalated_to_authority: {
    label: "Escalated to authority",
    meaning: "The missed deadline or safety concern is ready for the appropriate authority route.",
    actor: "NCRP and the appropriate authority",
  },
  support_connected: {
    label: "Support connected",
    meaning: "The case record notes that the reporter reached an appropriate real support route.",
    actor: "Citizen and real support service",
  },
};

const wcTrack = defineTrack({ stages: wcStages, meta: wcStageMeta });

export const wcStageIndex = wcTrack.stageIndex;
export const isWcAtOrAfter = wcTrack.isAtOrAfter;
export const nextWcStage = wcTrack.nextStage;

export const wcEscalationMeta: Record<
  WcHarm,
  { platform: string; ncrp: string; authority: string }
> = Object.fromEntries(
  wcHarms.map((harm) => [
    harm,
    {
      platform: "The platform’s reporting route",
      ncrp: "National Cyber Crime Reporting Portal intake",
      authority: wcHarmMeta[harm].authorityLabel,
    },
  ]),
) as Record<WcHarm, { platform: string; ncrp: string; authority: string }>;

export function getWcSlaHours(stage: WcStage, harm: WcHarm) {
  if (stage === "reported") return PLATFORM_ACKNOWLEDGEMENT_SLA_HOURS;
  if (stage === "platform_acknowledged") return wcHarmMeta[harm].actionSlaHours;
  return null;
}

export function resolveWcSla(
  stageStartedAt: string,
  stage: WcStage,
  harm: WcHarm,
  now = Date.now(),
) {
  const hours = getWcSlaHours(stage, harm);
  if (hours === null) return null;
  try {
    return resolveSla({ stageStartedAt, hours, now });
  } catch {
    return null;
  }
}

export const childInvolvementOptions = [
  "A child’s account or identity is being targeted",
  "A child is receiving repeated or threatening contact",
  "Content involving a child needs a safety response",
] as const;

export type WcTrackingMode = "anonymous_recovery" | "private_session";
export type WcStep =
  | "mode"
  | "who"
  | "reporter_role"
  | "child_involvement"
  | "harm"
  | "platform"
  | "describe"
  | "evidence"
  | "review"
  | "submitted";

export interface WcDraft {
  version: 1;
  step: WcStep;
  trackingMode: WcTrackingMode | null;
  subject: WcSubject | null;
  reporterRole: ReporterRole | null;
  harm: WcHarm | null;
  platform: TakedownPlatform | null;
  childInvolvement: string;
  narrative: string;
  profileLink: string;
  postedDescription: string;
  evidence: EvidenceChecklistState;
  acknowledgement?: string;
  recoveryPassphrase?: string;
}

export interface WcCase extends Omit<WcDraft, "step"> {
  acknowledgement: string;
  recoveryPassphrase?: string;
  stage: WcStage;
  reportedAt: string;
  stageStartedAt: string;
  analysis: {
    category: string;
    subcategory: string;
    confidence: number;
    confidenceNotes: string[];
    entities: ExtractedEntity[];
  };
  history: HistoryEvent<WcStage>[];
}

export const emptyWcDraft: WcDraft = {
  version: 1,
  step: "mode",
  trackingMode: null,
  subject: null,
  reporterRole: null,
  harm: null,
  platform: null,
  childInvolvement: "",
  narrative: "",
  profileLink: "",
  postedDescription: "",
  evidence: { ...emptyEvidenceChecklist },
};

export const WC_DRAFT_KEY = buildStorageKey("wc:draft");
export const WC_CASES_KEY = buildStorageKey("wc-cases");

export function normaliseRecoveryPassphrase(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

const passphraseWords = [
  "river", "mango", "lamp", "cloud", "garden", "paper", "window", "silver",
  "morning", "basket", "forest", "pencil", "orange", "bridge", "candle", "button",
] as const;

export function makeRecoveryPassphrase(seed = Date.now()) {
  let value = Math.abs(seed) || 1;
  const words: string[] = [];
  for (let index = 0; index < 4; index += 1) {
    value = (value * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    words.push(passphraseWords[value % passphraseWords.length]);
  }
  return words.join(" ");
}
