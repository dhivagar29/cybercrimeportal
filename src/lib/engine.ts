import { takedownHarmMeta, type TakedownHarm } from "@/lib/takedown";
import { wcHarmMeta, type WcHarm } from "@/lib/wc-track";

export type EntityKind = "amount" | "utr" | "upi" | "phone" | "url" | "handle";

export interface ExtractedEntity {
  id: string;
  kind: EntityKind;
  label: string;
  value: string;
  source: "narrative" | "mock-ocr";
}

export interface TimelineEvent {
  id: string;
  occurredAt: string;
  title: string;
  detail: string;
}

export interface IntakeAnalysis {
  category: string;
  subcategory: string;
  confidence: number;
  confidenceNotes: string[];
  summary: string;
  entities: ExtractedEntity[];
  timeline: TimelineEvent[];
  matchedBy: "canned-scenario" | "keyword-rules";
  scenarioId?: ScenarioId;
}

export interface ClassificationRule {
  id: string;
  pattern: RegExp;
  category: string;
  subcategory: string;
  note: string;
}

export interface SocialClassificationRule {
  id: "ncii" | "sextortion" | "account-takeover" | "impersonation";
  pattern: RegExp;
  harm: TakedownHarm;
  note: string;
}

export interface SocialNarrativeAnalysis {
  category: string;
  subcategory: string;
  suggestedHarm: TakedownHarm;
  confidence: number;
  confidenceNotes: string[];
  summary: string;
  entities: ExtractedEntity[];
  matchedRuleId: SocialClassificationRule["id"] | "selected-harm" | "fallback";
}

export interface WcClassificationRule {
  id: "stalking" | "repeated-contact" | "threats" | "minor-involvement" | "ncii" | "sextortion" | "impersonation";
  pattern: RegExp;
  harm: WcHarm;
  note: string;
}

export interface WcNarrativeAnalysis {
  category: string;
  subcategory: string;
  suggestedHarm: WcHarm;
  confidence: number;
  confidenceNotes: string[];
  summary: string;
  entities: ExtractedEntity[];
  matchedRuleId: WcClassificationRule["id"] | "selected-harm" | "fallback";
}

export const classificationRules: ClassificationRule[] = [
  { id: "investment", pattern: /\b(trading|investment|profit|returns?|crypto|withdrawal|stock tips?)\b/i, category: "Online Financial Fraud", subcategory: "Investment Scam", note: "Investment, trading, profit, or withdrawal language matched." },
  { id: "digital-arrest", pattern: /\b(digital arrest|arrest|cbi|customs|narcotics|safe account|parcel)\b/i, category: "Online Financial Fraud", subcategory: "Digital Arrest", note: "Authority impersonation or digital-arrest coercion matched." },
  { id: "sextortion", pattern: /\b(video call|nude|naked|morph(?:ed|ing)?|intimate|sextortion|blackmail)\b/i, category: "Online and Social Media Crime", subcategory: "Sextortion", note: "Sexual-image coercion or blackmail language matched." },
  { id: "vishing", pattern: /\b(electricity|kyc|blocked|disconnect(?:ed|ion)?|bank officer|customer care|verify account)\b/i, category: "Online Financial Fraud", subcategory: "Vishing", note: "Urgent service, KYC, or account-blocking call language matched." },
  { id: "upi", pattern: /\b(upi|qr code|collect request|phonepe|google pay|gpay|paytm)\b/i, category: "Online Financial Fraud", subcategory: "UPI Fraud", note: "UPI payment or collect-request language matched." },
  { id: "card", pattern: /\b(credit card|debit card|card number|cvv|card otp|pos transaction)\b/i, category: "Online Financial Fraud", subcategory: "Debit/Credit Card Fraud", note: "Card credential or card transaction language matched." },
  { id: "loan-app", pattern: /\b(loan app|instant loan|recovery agent|contact list|loan repayment)\b/i, category: "Online Financial Fraud", subcategory: "Fraudulent Loan App", note: "Loan-app or coercive recovery language matched." },
  { id: "job", pattern: /\b(job offer|part.time job|task scam|work from home|recruiter|registration fee)\b/i, category: "Online Financial Fraud", subcategory: "Online Job Fraud", note: "Recruitment, task, or work-from-home payment language matched." },
  { id: "shopping", pattern: /\b(online shopping|seller|marketplace|refund|order|delivery|product never)\b/i, category: "Online Financial Fraud", subcategory: "E-commerce Fraud", note: "Marketplace, order, delivery, or refund language matched." },
  { id: "impersonation", pattern: /\b(impersonat(?:e|ed|ion)|fake profile|hacked account|instagram|facebook|whatsapp account)\b/i, category: "Online and Social Media Crime", subcategory: "Impersonation", note: "A fake or compromised social-media identity matched." },
  { id: "malware", pattern: /\b(apk|anydesk|remote access|screen share|malware|ransomware|unknown app)\b/i, category: "Cyber Attack", subcategory: "Malware / Remote Access", note: "APK, remote-access, or malware language matched." },
  { id: "harassment", pattern: /\b(cyber bullying|bullying|abusive messages|threats|trolling)\b/i, category: "Online and Social Media Crime", subcategory: "Cyber Bullying / Harassment", note: "Online abuse, threats, or harassment language matched." },
];

export const socialClassificationRules: SocialClassificationRule[] = [
  {
    id: "ncii",
    pattern:
      /\b(morph(?:ed|ing)?|nude|intimate images?|shared (?:my )?(?:photos?|videos?)|posted (?:my )?(?:photos?|videos?))\b/i,
    harm: "ncii",
    note: "Language about morphed, nude, intimate, or already-shared media matched NCII.",
  },
  {
    id: "sextortion",
    pattern:
      /\b(photos?|videos?|video call|pay or|blackmail|sextortion|leak|send (?:it|them) to)\b/i,
    harm: "sextortion",
    note: "Photo or video blackmail language matched sextortion.",
  },
  {
    id: "account-takeover",
    pattern:
      /\b(logged out|password (?:was )?changed|account (?:was )?hacked|can(?:not|'t) log in|unknown login)\b/i,
    harm: "account_takeover",
    note: "Loss of access or an unexpected password change matched account takeover.",
  },
  {
    id: "impersonation",
    pattern:
      /\b(fake profile|fake account|pretending(?:\s+(?:to be|as))?|impersonat(?:e|ed|ing|ion)|using my (?:name|photo))\b/i,
    harm: "impersonation",
    note: "Fake-profile or identity-copying language matched impersonation.",
  },
];

export const wcClassificationRules: WcClassificationRule[] = [
  {
    id: "minor-involvement",
    pattern: /\b(child|minor|my (?:son|daughter)|student|pupil|under 18|schoolchild)\b/i,
    harm: "child_safety",
    note: "Language indicating that a minor is involved matched the child-safety route.",
  },
  {
    id: "ncii",
    pattern: /\b(morph(?:ed|ing)?|private image|intimate image|shared without (?:my )?consent|posted without (?:my )?consent)\b/i,
    harm: "ncii_woman",
    note: "Language about private or morphed images shared without consent matched the NCII route.",
  },
  {
    id: "sextortion",
    pattern: /\b(blackmail|pay or|threaten(?:ed|ing)? to share|demand(?:ed|ing)? money|sextortion)\b/i,
    harm: "sextortion_woman",
    note: "Blackmail or payment-demand language matched the sextortion route.",
  },
  {
    id: "impersonation",
    pattern: /\b(fake profile|fake account|pretending to be me|using my (?:name|photo)|impersonat(?:e|ed|ing|ion))\b/i,
    harm: "impersonation_woman",
    note: "Fake-profile or identity-copying language matched impersonation.",
  },
  {
    id: "repeated-contact",
    pattern: /\b(keeps? contact(?:ing)?|keeps? messaging|after I blocked|after blocking|new accounts?|different numbers?|won't stop contacting)\b/i,
    harm: "stalking",
    note: "Repeated contact after blocking matched the cyber-stalking route.",
  },
  {
    id: "stalking",
    pattern: /\b(stalk(?:ing|ed)?|following me online|monitoring my account|watching my profile)\b/i,
    harm: "stalking",
    note: "Language about persistent online monitoring or stalking matched the cyber-stalking route.",
  },
  {
    id: "threats",
    pattern: /\b(threat|threaten(?:ed|ing)?|afraid|harm me|hurt me|find me)\b/i,
    harm: "online_harassment",
    note: "Threat or safety-concern language matched the online-harassment route.",
  },
];

export const scenarioIds = ["meena", "arjun", "priya"] as const;
export type ScenarioId = (typeof scenarioIds)[number];

type CannedScenario = {
  citizen: string;
  chipLabel: string;
  narrative: string;
  category: string;
  subcategory: string;
  summary: string;
  confidenceNotes: string[];
  entities: Array<Omit<ExtractedEntity, "id" | "source">>;
  timeline: Array<{ offsetMinutes: number; title: string; detail: string }>;
};

export const cannedScenarios: Record<ScenarioId, CannedScenario> = {
  meena: {
    citizen: "Meena Iyer",
    chipLabel: "Try Meena's story",
    narrative: "I joined a WhatsApp trading group called Prime Alpha Returns. They showed fake profits, then asked me to keep investing. Today I sent ₹4,20,000 by bank transfer. The UTR was 426082716421. I spoke to 9876543210 and the admin used @primealphahelp. Now they demand another tax before I can withdraw.",
    category: "Online Financial Fraud",
    subcategory: "Investment Scam",
    summary: "A WhatsApp trading group used fabricated returns and a withdrawal fee to induce repeated transfers.",
    confidenceNotes: ["Investment, trading, profit, and withdrawal terms agree.", "The amount, 12-digit UTR, phone number, and handle were found.", "This matches the seeded Meena demo account."],
    entities: [
      { kind: "amount", label: "Amount", value: "₹4,20,000" },
      { kind: "utr", label: "UTR", value: "426082716421" },
      { kind: "phone", label: "Phone number", value: "9876543210" },
      { kind: "handle", label: "Account handle", value: "@primealphahelp" },
    ],
    timeline: [
      { offsetMinutes: -7200, title: "Joined trading group", detail: "Added to the Prime Alpha Returns WhatsApp group." },
      { offsetMinutes: -180, title: "Profit shown", detail: "The group displayed fabricated returns and demanded a larger transfer." },
      { offsetMinutes: -42, title: "Money transferred", detail: "₹4,20,000 sent by bank transfer; UTR 426082716421." },
      { offsetMinutes: -15, title: "Withdrawal blocked", detail: "Another ‘tax’ payment was demanded before withdrawal." },
    ],
  },
  arjun: {
    citizen: "Arjun Nair",
    chipLabel: "Try Arjun's story",
    narrative: "I got a call from 9812345678 saying my electricity account was blocked and the power would be disconnected. I paid Rs 18,000 by UPI to powerhelp@oksbi. The UTR is 426082701894. They also told me to install QuickBillSupport.apk and then stopped replying.",
    category: "Online Financial Fraud",
    subcategory: "Vishing",
    summary: "A caller used an urgent electricity-disconnection threat to obtain a UPI payment and push an APK installation.",
    confidenceNotes: ["Electricity, blocked, and disconnected terms indicate vishing.", "The amount, UPI ID, 12-digit UTR, and phone number were found.", "The APK mention is retained as supporting evidence."],
    entities: [
      { kind: "amount", label: "Amount", value: "₹18,000" },
      { kind: "upi", label: "UPI ID", value: "powerhelp@oksbi" },
      { kind: "utr", label: "UTR", value: "426082701894" },
      { kind: "phone", label: "Phone number", value: "9812345678" },
    ],
    timeline: [
      { offsetMinutes: -95, title: "Fraud call received", detail: "Caller threatened immediate electricity disconnection." },
      { offsetMinutes: -82, title: "UPI payment sent", detail: "₹18,000 sent to powerhelp@oksbi." },
      { offsetMinutes: -75, title: "APK requested", detail: "Caller asked for QuickBillSupport.apk to be installed." },
      { offsetMinutes: -55, title: "Caller stopped responding", detail: "The number stopped responding after payment." },
    ],
  },
  priya: {
    citizen: "Priya Sharma",
    chipLabel: "Try Priya's story",
    narrative: "A caller claimed to be from CBI and said a customs parcel put my father under digital arrest. They kept him on a video call and ordered him to move ₹6,80,000 to a safe account by NEFT. The UTR was 426081522047. They called from 9911223344 and sent a fake notice from custody-check.in.",
    category: "Online Financial Fraud",
    subcategory: "Digital Arrest",
    summary: "Callers impersonated investigators, isolated the victim on a video call, and directed a transfer to a claimed safe account.",
    confidenceNotes: ["CBI, customs parcel, digital arrest, and safe account terms agree.", "The amount, 12-digit UTR, phone number, and web address were found.", "The narrative says Priya is filing for her father."],
    entities: [
      { kind: "amount", label: "Amount", value: "₹6,80,000" },
      { kind: "utr", label: "UTR", value: "426081522047" },
      { kind: "phone", label: "Phone number", value: "9911223344" },
      { kind: "url", label: "Web address", value: "custody-check.in" },
    ],
    timeline: [
      { offsetMinutes: -310, title: "Impersonation call began", detail: "Caller claimed to be from CBI about a customs parcel." },
      { offsetMinutes: -280, title: "Video-call isolation", detail: "The victim was told he was under digital arrest and must stay visible." },
      { offsetMinutes: -220, title: "NEFT transfer sent", detail: "₹6,80,000 moved to a claimed safe account." },
      { offsetMinutes: -180, title: "Relative learned of fraud", detail: "Priya began preserving the fake notice and call details." },
    ],
  },
};

export const demoNarratives = Object.fromEntries(
  scenarioIds.map((id) => [id, cannedScenarios[id].narrative]),
) as Record<ScenarioId, string>;

const upiPattern = /\b[\w.-]+@[a-z]{2,}\b/gi;
const utrPattern = /\b\d{12}\b/g;
const moneyPattern = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|crore|cr)?/gi;
const phonePattern = /(?:\+91[\s-]?)?\b[6-9]\d{9}\b/g;
const urlPattern = /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?\b/gi;
const handlePattern = /(?<![\w.-])@[a-z0-9_]{3,}\b/gi;

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()))];
}

function normalizeAmount(raw: string, unit?: string) {
  const base = Number(raw.replaceAll(",", ""));
  if (/lakh|lakhs|lac|lacs/i.test(unit ?? "")) return base * 100_000;
  if (/crore|cr/i.test(unit ?? "")) return base * 10_000_000;
  return base;
}

function entity(kind: EntityKind, label: string, value: string, index: number, source: ExtractedEntity["source"] = "narrative"): ExtractedEntity {
  return { id: `${kind}-${index}-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)}`, kind, label, value, source };
}

function relativeIso(now: number, offsetMinutes: number) {
  return new Date(now + offsetMinutes * 60_000).toISOString();
}

function buildScenario(id: ScenarioId, now: number): IntakeAnalysis {
  const scenario = cannedScenarios[id];
  return {
    category: scenario.category,
    subcategory: scenario.subcategory,
    confidence: 97,
    confidenceNotes: scenario.confidenceNotes,
    summary: scenario.summary,
    entities: scenario.entities.map((item, index) => entity(item.kind, item.label, item.value, index)),
    timeline: scenario.timeline.map((item, index) => ({ id: `${id}-event-${index + 1}`, occurredAt: relativeIso(now, item.offsetMinutes), title: item.title, detail: item.detail })),
    matchedBy: "canned-scenario",
    scenarioId: id,
  };
}

function detectScenario(text: string): ScenarioId | null {
  const lower = text.toLowerCase();
  if (lower.includes("prime alpha returns") || lower.includes("426082716421")) return "meena";
  if (lower.includes("powerhelp@oksbi") || lower.includes("quickbillsupport.apk")) return "arjun";
  if (lower.includes("custody-check.in") || lower.includes("426081522047")) return "priya";
  return null;
}

export function extractEntities(input: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  for (const match of input.matchAll(moneyPattern)) {
    const amount = normalizeAmount(match[1], match[2]);
    entities.push(entity("amount", "Amount", `₹${amount.toLocaleString("en-IN")}`, entities.length));
  }
  unique(input.match(upiPattern) ?? []).forEach((value) => entities.push(entity("upi", "UPI ID", value, entities.length)));
  unique(input.match(utrPattern) ?? []).forEach((value) => entities.push(entity("utr", "UTR", value, entities.length)));
  unique(input.match(phonePattern) ?? []).forEach((value) => entities.push(entity("phone", "Phone number", value.replace(/\D/g, "").slice(-10), entities.length)));
  unique(input.match(urlPattern) ?? []).filter((value) => !value.includes("@")).forEach((value) => entities.push(entity("url", "Web address", value.replace(/[.,!?]+$/, ""), entities.length)));
  unique(input.match(handlePattern) ?? []).forEach((value) => entities.push(entity("handle", "Account handle", value, entities.length)));
  return entities;
}

export function analyzeNarrative(input: string, requestedScenario?: ScenarioId, now = Date.now()): IntakeAnalysis {
  const text = input.trim();
  const scenarioId = requestedScenario ?? detectScenario(text);
  if (scenarioId) return buildScenario(scenarioId, now);

  const rule = classificationRules.find((item) => item.pattern.test(text)) ?? {
    id: "other",
    category: "Online Financial Fraud",
    subcategory: "Other Online Financial Fraud",
    note: "No single taxonomy clue was strong enough; the citizen can correct this draft.",
  };
  const entities = extractEntities(text);
  const amount = entities.find((item) => item.kind === "amount")?.value;
  const paymentIdentifier = entities.find((item) => item.kind === "upi" || item.kind === "utr")?.value;
  const confidence = Math.min(92, 68 + (rule.id === "other" ? 0 : 12) + Math.min(12, entities.length * 3));

  return {
    category: rule.category,
    subcategory: rule.subcategory,
    confidence,
    confidenceNotes: [rule.note, entities.length ? `${entities.length} identifier${entities.length === 1 ? " was" : "s were"} extracted with fixed local patterns.` : "No payment identifier was found; the report can still continue.", "This is a deterministic suggestion. The citizen remains in control."],
    summary: `The account describes suspected ${rule.subcategory.toLowerCase()}${amount ? ` involving ${amount}` : ""}. Confirm each detail before it enters the complaint.`,
    entities,
    timeline: [
      { id: "event-contact", occurredAt: relativeIso(now, -120), title: "Suspicious contact or activity", detail: "The citizen's account begins here. Edit the time and wording if needed." },
      ...(amount || paymentIdentifier ? [{ id: "event-payment", occurredAt: relativeIso(now, -60), title: "Money or identifier shared", detail: [amount, paymentIdentifier].filter(Boolean).join(" · ") }] : []),
      { id: "event-report", occurredAt: relativeIso(now, 0), title: "Report being prepared", detail: "Facts extracted locally and waiting for citizen confirmation." },
    ],
    matchedBy: "keyword-rules",
  };
}

export function analyzeSocialNarrative(
  input: string,
  selectedHarm?: TakedownHarm,
): SocialNarrativeAnalysis {
  const text = input.trim();
  const rule = socialClassificationRules.find((item) => item.pattern.test(text));
  const suggestedHarm = rule?.harm ?? selectedHarm ?? "harassment";
  const harmMeta = takedownHarmMeta[suggestedHarm];
  const entities = extractEntities(text);
  const matchedRuleId = rule?.id ?? (selectedHarm ? "selected-harm" : "fallback");
  const confidence = Math.min(
    94,
    (rule ? 86 : selectedHarm ? 76 : 62) + Math.min(8, entities.length * 2),
  );

  const ruleNote = rule?.note ??
    (selectedHarm
      ? "The selected incident type supplies the draft classification; no stronger phrase conflicted with it."
      : "No single phrase was decisive, so the draft uses online harassment and remains fully correctable.");

  return {
    category: harmMeta.category,
    subcategory: harmMeta.subcategory,
    suggestedHarm,
    confidence,
    confidenceNotes: [
      ruleNote,
      entities.length
        ? `${entities.length} contact or account identifier${entities.length === 1 ? " was" : "s were"} extracted with fixed local patterns.`
        : "No account identifier was found; the report can still continue.",
      "This suggestion is produced locally by deterministic rules. The citizen confirms the wording.",
    ],
    summary: `The account describes suspected ${harmMeta.shortLabel.toLowerCase()} on a social platform. Preserve the evidence and confirm this draft before reporting it.`,
    entities,
    matchedRuleId,
  };
}

export function analyzeWcNarrative(
  input: string,
  selectedHarm?: WcHarm,
): WcNarrativeAnalysis {
  const text = input.trim();
  const rule = wcClassificationRules.find((item) => item.pattern.test(text));
  const suggestedHarm = rule?.harm ?? selectedHarm ?? "online_harassment";
  const harmMeta = wcHarmMeta[suggestedHarm];
  const entities = extractEntities(text);
  const matchedRuleId = rule?.id ?? (selectedHarm ? "selected-harm" : "fallback");
  const confidence = Math.min(
    94,
    (rule ? 86 : selectedHarm ? 76 : 62) + Math.min(8, entities.length * 2),
  );
  const ruleNote = rule?.note ??
    (selectedHarm
      ? "The selected harm supplies the draft classification; no stronger phrase conflicted with it."
      : "No single phrase was decisive, so the draft uses online harassment and remains fully correctable.");

  return {
    category: harmMeta.category,
    subcategory: harmMeta.subcategory,
    suggestedHarm,
    confidence,
    confidenceNotes: [
      ruleNote,
      entities.length
        ? `${entities.length} contact or account identifier${entities.length === 1 ? " was" : "s were"} extracted with fixed local patterns.`
        : "No account identifier was found; the report can still continue.",
      "This suggestion is produced locally by deterministic rules. The reporter confirms the wording.",
    ],
    summary: `The account describes suspected ${harmMeta.shortLabel.toLowerCase()}. The reporter can correct this draft before it is recorded.`,
    entities,
    matchedRuleId,
  };
}

export function getMockOcrEntities(analysis: IntakeAnalysis | null) {
  if (!analysis) return [];
  return analysis.entities
    .filter((item) => item.kind === "utr" || item.kind === "upi")
    .map((item, index) => ({ ...item, id: `ocr-${item.id}-${index}`, source: "mock-ocr" as const }));
}
