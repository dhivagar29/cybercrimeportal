import type {
  HistoryEvent,
  HistoryFixture,
} from "@/lib/kernel/history";
import { resolveSla } from "@/lib/kernel/sla";
import { defineTrack, type StageMeta } from "@/lib/kernel/stages";
import {
  buildScopedStorageKey,
  buildStorageKey,
} from "@/lib/kernel/storage";

export const takedownPlatforms = [
  "whatsapp",
  "instagram",
  "facebook",
  "x",
  "telegram",
  "youtube",
  "other",
] as const;

export type TakedownPlatform = (typeof takedownPlatforms)[number];

export const takedownHarms = [
  "impersonation",
  "sextortion",
  "account_takeover",
  "harassment",
  "ncii",
] as const;

export type TakedownHarm = (typeof takedownHarms)[number];

export const PLATFORM_ACKNOWLEDGEMENT_SLA_HOURS = 24;
export const STANDARD_PLATFORM_ACTION_SLA_HOURS = 15 * 24;
export const INTIMATE_IMAGE_ACTION_SLA_HOURS = 24;

export const takedownStages = [
  "reported_to_platform",
  "platform_acknowledged",
  "content_action_taken",
  "escalated_to_ncrp",
] as const;

export type TakedownStage = (typeof takedownStages)[number];

export const evidenceChecklistItems = [
  {
    id: "screenshot_context",
    label: "Screenshot with the URL and timestamp visible",
    detail: "Keep the whole screen so the platform and time can be verified.",
  },
  {
    id: "profile_link",
    label: "Save the profile link or account ID",
    detail: "Copy the link before blocking. A display name can be changed later.",
  },
  {
    id: "stop_engaging",
    label: "Do not reply or engage further",
    detail: "Preserve what is already there, then stop contact.",
  },
] as const;

export type EvidenceChecklistId = (typeof evidenceChecklistItems)[number]["id"];
export type EvidenceChecklistState = Record<EvidenceChecklistId, boolean>;

export const emptyEvidenceChecklist: EvidenceChecklistState = {
  screenshot_context: false,
  profile_link: false,
  stop_engaging: false,
};

export const platformMeta: Record<
  TakedownPlatform,
  {
    label: string;
    grievanceRecipient: string;
    recoverySteps: string[];
  }
> = {
  whatsapp: {
    label: "WhatsApp",
    grievanceRecipient: "WhatsApp grievance contact",
    recoverySteps: [
      "Open WhatsApp on the number you own and request a fresh verification code.",
      "Never share the six-digit code or two-step-verification PIN.",
      "Review Linked devices and sign out sessions you do not recognise.",
    ],
  },
  instagram: {
    label: "Instagram",
    grievanceRecipient: "Meta grievance contact for Instagram",
    recoverySteps: [
      "Use Instagram's hacked-account recovery option from the sign-in screen.",
      "Check your email for a message about an address or password change and reverse it.",
      "Remove unknown sessions after access is restored, then enable two-factor authentication.",
    ],
  },
  facebook: {
    label: "Facebook",
    grievanceRecipient: "Meta grievance contact for Facebook",
    recoverySteps: [
      "Use Facebook's compromised-account recovery option from a device used before.",
      "Secure the email account linked to Facebook before resetting the password.",
      "End unknown sessions after access is restored, then enable two-factor authentication.",
    ],
  },
  x: {
    label: "X",
    grievanceRecipient: "X grievance contact",
    recoverySteps: [
      "Start account-access recovery with the email address or phone number on the account.",
      "Secure the linked email account and revoke unfamiliar third-party applications.",
      "Reset the password and end other sessions after access is restored.",
    ],
  },
  telegram: {
    label: "Telegram",
    grievanceRecipient: "Telegram abuse contact",
    recoverySteps: [
      "Open Settings, then Devices, and terminate sessions you do not recognise.",
      "Enable two-step verification and add a recovery email you control.",
      "Ask your mobile provider to secure your SIM if verification codes were intercepted.",
    ],
  },
  youtube: {
    label: "YouTube",
    grievanceRecipient: "Google grievance contact for YouTube",
    recoverySteps: [
      "Start Google Account recovery from a device and location used before.",
      "Review recent security activity and remove unfamiliar devices.",
      "Revoke unknown channel permissions after access is restored.",
    ],
  },
  other: {
    label: "Other platform",
    grievanceRecipient: "Platform grievance contact",
    recoverySteps: [
      "Use the platform's official account-recovery page or app settings.",
      "Secure the linked email account and phone number first.",
      "Remove unknown sessions and enable two-factor authentication after recovery.",
    ],
  },
};

export const takedownHarmMeta: Record<
  TakedownHarm,
  {
    label: string;
    shortLabel: string;
    category: string;
    subcategory: string;
    actionSlaHours: number;
    actionSlaLabel: string;
  }
> = {
  impersonation: {
    label: "Fake profile or impersonation",
    shortLabel: "Impersonation",
    category: "Online and Social Media Crime",
    subcategory: "Fake Profile / Impersonation",
    actionSlaHours: STANDARD_PLATFORM_ACTION_SLA_HOURS,
    actionSlaLabel: "15-day platform action window",
  },
  sextortion: {
    label: "Blackmail with photos or videos",
    shortLabel: "Sextortion",
    category: "Online and Social Media Crime",
    subcategory: "Cyber Blackmail / Sextortion",
    actionSlaHours: STANDARD_PLATFORM_ACTION_SLA_HOURS,
    actionSlaLabel: "15-day platform action window",
  },
  account_takeover: {
    label: "My account is hacked",
    shortLabel: "Hacked account",
    category: "Online and Social Media Crime",
    subcategory: "Hacked Social Media Account",
    actionSlaHours: STANDARD_PLATFORM_ACTION_SLA_HOURS,
    actionSlaLabel: "15-day platform action window",
  },
  harassment: {
    label: "Stalking or threats",
    shortLabel: "Stalking or threats",
    category: "Online and Social Media Crime",
    subcategory: "Cyber Stalking / Online Harassment",
    actionSlaHours: STANDARD_PLATFORM_ACTION_SLA_HOURS,
    actionSlaLabel: "15-day platform action window",
  },
  ncii: {
    label: "Intimate images shared without consent",
    shortLabel: "Intimate images shared",
    category: "Online and Social Media Crime",
    subcategory: "Non-consensual Intimate Imagery (NCII)",
    actionSlaHours: INTIMATE_IMAGE_ACTION_SLA_HOURS,
    actionSlaLabel: "24-hour intimate-image action window",
  },
};

export const takedownStageMeta: Record<TakedownStage, StageMeta> = {
  reported_to_platform: {
    label: "Reported to platform",
    meaning: "Your evidence and grievance report have been recorded for the platform.",
    actor: "Platform grievance team",
  },
  platform_acknowledged: {
    label: "Platform acknowledged",
    meaning: "The platform has acknowledged the report. Its action clock is now running.",
    actor: "Platform grievance team",
  },
  content_action_taken: {
    label: "Content removed / action taken",
    meaning: "The platform reports that the content or account has been acted on.",
    actor: "Platform grievance team",
  },
  escalated_to_ncrp: {
    label: "Escalated to NCRP / police",
    meaning: "The missed platform deadline has been added to a cybercrime escalation record.",
    actor: "NCRP intake and district police",
  },
};

const takedownTrack = defineTrack({
  stages: takedownStages,
  meta: takedownStageMeta,
});

export interface TakedownHistoryFixture
  extends HistoryFixture<TakedownStage> {
  stage: TakedownStage;
}

export interface TakedownHistoryEvent extends HistoryEvent<TakedownStage> {
  stage: TakedownStage;
}

export interface GrievanceReportFixture {
  id: string;
  title: string;
  recipient: string;
  subject: string;
  generatedOffsetMinutes: number;
  status: "generated";
}

export interface GeneratedGrievanceReport
  extends Omit<GrievanceReportFixture, "generatedOffsetMinutes"> {
  generatedAt: string;
}

export interface TakedownCaseFixture {
  acknowledgement: string;
  anonymous: boolean;
  platform: TakedownPlatform;
  harm: TakedownHarm;
  narrative: string;
  category: string;
  subcategory: string;
  reportedOffsetMinutes: number;
  stage: TakedownStage;
  stageStartedOffsetMinutes: number;
  platformReference?: string;
  evidence: EvidenceChecklistState;
  grievanceReport: GrievanceReportFixture;
  history: TakedownHistoryFixture[];
}

export interface LiveTakedownCase
  extends Omit<
    TakedownCaseFixture,
    | "reportedOffsetMinutes"
    | "stageStartedOffsetMinutes"
    | "grievanceReport"
    | "history"
  > {
  reportedAt: string;
  stageStartedAt: string;
  grievanceReport: GeneratedGrievanceReport;
  history: TakedownHistoryEvent[];
}

export interface SavedTakedownDraft {
  version: 1;
  step: "mode" | "platform" | "harm" | "guidance" | "describe" | "review" | "submitted";
  anonymous: boolean | null;
  platform: TakedownPlatform | null;
  harm: TakedownHarm | null;
  evidence: EvidenceChecklistState;
  narrative: string;
  acknowledgement?: string;
}

export interface SavedTakedownCase extends LiveTakedownCase {
  version: 1;
}

export const TAKEDOWN_DRAFT_KEY = buildStorageKey("takedown:draft");
export const TAKEDOWN_CASES_KEY = buildStorageKey("takedown-cases");
export const TAKEDOWN_DRAFT_STORAGE_KEY = TAKEDOWN_DRAFT_KEY;

export function takedownCaseStorageKey(acknowledgement: string) {
  return buildScopedStorageKey("takedown-case", acknowledgement);
}

export const takedownCaseStateStorageKey = takedownCaseStorageKey;

export function getTakedownSlaHours(stage: TakedownStage, harm: TakedownHarm) {
  if (stage === "reported_to_platform") return PLATFORM_ACKNOWLEDGEMENT_SLA_HOURS;
  if (stage === "platform_acknowledged") return takedownHarmMeta[harm].actionSlaHours;
  return null;
}

export function getTakedownSlaLabel(stage: TakedownStage, harm: TakedownHarm) {
  if (stage === "reported_to_platform") return "24-hour platform acknowledgement window";
  if (stage === "platform_acknowledged") return takedownHarmMeta[harm].actionSlaLabel;
  return "No active platform deadline";
}

export function getTakedownSlaDeadline(
  stageStartedAt: string,
  stage: TakedownStage,
  harm: TakedownHarm,
) {
  const hours = getTakedownSlaHours(stage, harm);
  if (hours === null) return null;
  try {
    return resolveSla({ stageStartedAt, hours }).deadline;
  } catch {
    return null;
  }
}

export function isTakedownSlaBreached(
  stageStartedAt: string,
  stage: TakedownStage,
  harm: TakedownHarm,
  now = Date.now(),
) {
  const hours = getTakedownSlaHours(stage, harm);
  if (hours === null) return false;
  try {
    return resolveSla({ stageStartedAt, hours, now }).breached;
  } catch {
    return false;
  }
}

export function nextTakedownStage(
  stage: TakedownStage,
): "platform_acknowledged" | "content_action_taken" | null {
  if (stage === "content_action_taken" || stage === "escalated_to_ncrp") {
    return null;
  }
  const next = takedownTrack.nextStage(stage);
  return next === "platform_acknowledged" || next === "content_action_taken"
    ? next
    : null;
}
