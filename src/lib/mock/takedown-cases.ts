import {
  platformMeta,
  takedownHarmMeta,
  type LiveTakedownCase,
  type TakedownCaseFixture,
} from "@/lib/takedown";

export const SEEDED_TAKEDOWN_ACKNOWLEDGEMENT = "22026082813001";

export const takedownCaseFixtures: TakedownCaseFixture[] = [
  {
    acknowledgement: SEEDED_TAKEDOWN_ACKNOWLEDGEMENT,
    anonymous: true,
    platform: "instagram",
    harm: "sextortion",
    narrative:
      "An account threatened to send private video-call screenshots to people I know unless I paid. I have not paid. I saved the profile link and screenshots with the time visible.",
    category: takedownHarmMeta.sextortion.category,
    subcategory: takedownHarmMeta.sextortion.subcategory,
    reportedOffsetMinutes: -1565,
    stage: "reported_to_platform",
    stageStartedOffsetMinutes: -1565,
    evidence: {
      screenshot_context: true,
      profile_link: true,
      stop_engaging: true,
    },
    grievanceReport: {
      id: `grievance-${SEEDED_TAKEDOWN_ACKNOWLEDGEMENT}`,
      title: "Platform Grievance Officer report",
      recipient: platformMeta.instagram.grievanceRecipient,
      subject: "Urgent sextortion report and request to preserve account records",
      generatedOffsetMinutes: -1559,
      status: "generated",
    },
    history: [
      {
        stage: "reported_to_platform",
        offsetMinutes: -1565,
        detail:
          "Anonymous sextortion report prepared with the profile link and timestamped screenshots. The 24-hour acknowledgement clock started.",
      },
    ],
  },
];

const relativeIso = (now: number, offsetMinutes: number) =>
  new Date(now + offsetMinutes * 60_000).toISOString();

export function getLiveTakedownCases(now = Date.now()): LiveTakedownCase[] {
  return takedownCaseFixtures.map(
    ({
      reportedOffsetMinutes,
      stageStartedOffsetMinutes,
      grievanceReport,
      history,
      ...fixture
    }) => ({
      ...fixture,
      reportedAt: relativeIso(now, reportedOffsetMinutes),
      stageStartedAt: relativeIso(now, stageStartedOffsetMinutes),
      grievanceReport: {
        id: grievanceReport.id,
        title: grievanceReport.title,
        recipient: grievanceReport.recipient,
        subject: grievanceReport.subject,
        generatedAt: relativeIso(now, grievanceReport.generatedOffsetMinutes),
        status: grievanceReport.status,
      },
      history: history.map(({ offsetMinutes, ...event }) => ({
        ...event,
        occurredAt: relativeIso(now, offsetMinutes),
      })),
    }),
  );
}

export function getLiveTakedownCase(
  acknowledgement: string,
  now = Date.now(),
) {
  return getLiveTakedownCases(now).find(
    (item) => item.acknowledgement === acknowledgement,
  );
}
