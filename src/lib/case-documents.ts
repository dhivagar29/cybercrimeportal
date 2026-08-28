import { documentMeta, type CaseDocumentType, type LiveTrustCase } from "@/lib/case-trust";
import type { BankFixture, DemoPersona, LiveComplaint } from "@/lib/mock/types";

export interface CaseDocumentContext {
  complaint: LiveComplaint;
  trustCase: LiveTrustCase;
  persona: DemoPersona;
  sourceBank?: BankFixture;
  holdBanks: Array<{ bank: BankFixture; amount: number }>;
}

export interface FilledCaseDocument {
  title: string;
  addressee: string[];
  subject: string;
  opening: string;
  paragraphs: string[];
  requests: string[];
  closing: string;
  attachments: string[];
}

function formatDate(value: string | number | Date) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function addWorkingDays(from: string, count: number) {
  const date = new Date(from);
  let remaining = count;
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) remaining -= 1;
  }
  return date;
}

function common(ctx: CaseDocumentContext) {
  const { complaint, trustCase, persona } = ctx;
  const victim = trustCase.filedForName ?? persona.name;
  const held = trustCase.bankHolds.reduce((sum, item) => sum + item.amount, 0);
  const holds = ctx.holdBanks.map((item) => `${item.bank.name}: ₹${item.amount.toLocaleString("en-IN")}`).join("; ");
  return { complaint, trustCase, persona, victim, held, holds };
}

export function buildCaseDocument(type: CaseDocumentType, ctx: CaseDocumentContext): FilledCaseDocument {
  const { complaint, trustCase, persona, victim, held, holds } = common(ctx);
  const acknowledgement = complaint.id;
  const complaintDate = formatDate(complaint.reportedAt);
  const eventDate = formatDate(complaint.occurredAt);
  const deadline = formatDate(addWorkingDays(complaint.reportedAt, 3));
  const officer = `${trustCase.officer.name}, ${trustCase.officer.designation}, ${trustCase.officer.unit}`;
  const baseAttachments = [`NCRP acknowledgement ${acknowledgement}`, `Payment reference ${complaint.reference}`, "Payment receipt and preserved communication screenshots"];

  if (type === "bank-dispute") {
    return {
      title: documentMeta[type].title,
      addressee: ["The Nodal Officer — Fraud and Disputes", ctx.sourceBank?.name ?? "Source bank", `${complaint.district}, ${complaint.state}`],
      subject: `Urgent dispute of unauthorised electronic transaction — NCRP ${acknowledgement}`,
      opening: `I, ${persona.name}, report an unauthorised ${complaint.rail} transaction affecting ${victim}.`,
      paragraphs: [
        `On ${eventDate}, ₹${complaint.amount.toLocaleString("en-IN")} was transferred through ${complaint.rail}. The matter was reported on ${complaintDate} under acknowledgement ${acknowledgement}.`,
        `The beneficiary trail has traced ₹${trustCase.amountTraced.toLocaleString("en-IN")}; ₹${held.toLocaleString("en-IN")} is recorded as held across ${holds || "the beneficiary chain"}.`,
        `Under the RBI customer-protection rule represented in this prototype, an unauthorised electronic transaction reported to the bank within three working days carries zero customer liability. The computed reporting deadline is ${deadline}.`,
      ],
      requests: ["Register this dispute immediately and provide a dated complaint number.", "Preserve and share the beneficiary-bank trail with the investigating officer.", "Confirm the zero-liability decision and provisional credit position in writing."],
      closing: `Please coordinate with ${officer}. This prototype letter does not claim that a bank or authority has already received it.`,
      attachments: baseAttachments,
    };
  }

  if (type === "fir-request") {
    return {
      title: documentMeta[type].title,
      addressee: ["The Station House Officer", trustCase.officer.unit, `${complaint.district}, ${complaint.state}`],
      subject: `Request to register and link FIR — NCRP ${acknowledgement}`,
      opening: `I, ${persona.name}, request FIR registration for the cyber-enabled financial fraud affecting ${victim}.`,
      paragraphs: [
        `The complaint was filed on ${complaintDate} for ${complaint.subcategory}. The amount reported is ₹${complaint.amount.toLocaleString("en-IN")} through ${complaint.rail}.`,
        `A complaint acknowledgement is not an FIR. For this claim above ₹50,000, FIR linkage is the next recorded prerequisite before the queued interim-custody application can proceed.`,
        `The trail records ₹${trustCase.amountTraced.toLocaleString("en-IN")} traced and ₹${held.toLocaleString("en-IN")} held (${holds || "bank details recorded in the case file"}).`,
      ],
      requests: ["Register the FIR under the applicable provisions and give the FIR number and police station.", `Link the FIR to NCRP acknowledgement ${acknowledgement}.`, "Notify the concerned banks so the 90-day holds do not lapse during restoration."],
      closing: `The assigned mock officer is ${officer}. I request a written action-taken response.`,
      attachments: baseAttachments,
    };
  }

  if (type === "custody-application") {
    const direct = complaint.amount < 50_000;
    return {
      title: documentMeta[type].title,
      addressee: ["Before the Competent Authority / Jurisdictional Court", `${complaint.district}, ${complaint.state}`],
      subject: `${direct ? "Direct" : "Queued"} interim custody request under S.106(3) BNSS — ${acknowledgement}`,
      opening: `Applicant ${persona.name} seeks interim custody of money held in the cyber-fraud trail affecting ${victim}.`,
      paragraphs: [
        `The reported loss is ₹${complaint.amount.toLocaleString("en-IN")}. Banks have recorded ₹${held.toLocaleString("en-IN")} held: ${holds || "see annexed bank confirmations"}.`,
        direct ? "Because the claim is below ₹50,000, this prototype applies the direct interim-custody branch without requiring FIR linkage first." : "Because the claim exceeds ₹50,000, this application is queued behind FIR registration and linkage. It should be moved immediately when the FIR number is recorded.",
        `The applicant undertakes to preserve evidence, assist the investigation, and execute the attached indemnity bond for the amount released.`,
      ],
      requests: [`Order interim release of the eligible held amount, up to ₹${held.toLocaleString("en-IN")}.`, "Direct each beneficiary bank to execute the order within 15 days.", "Record bank-wise compliance and notify the applicant."],
      closing: `Filed in connection with NCRP acknowledgement ${acknowledgement}; assigned officer: ${officer}.`,
      attachments: [...baseAttachments, "Bank-wise hold schedule", "Indemnity bond"],
    };
  }

  if (type === "indemnity-bond") {
    return {
      title: documentMeta[type].title,
      addressee: ["For submission to the releasing bank / competent authority", `${complaint.district}, ${complaint.state}`],
      subject: `Indemnity for release under NCRP ${acknowledgement}`,
      opening: `I, ${persona.name}, submit this mock indemnity in support of interim release to ${victim}.`,
      paragraphs: [
        `The claim concerns ₹${complaint.amount.toLocaleString("en-IN")} reported lost. The case file records ₹${held.toLocaleString("en-IN")} held across ${holds || "the beneficiary chain"}.`,
        "I state that the facts and documents provided with the complaint are true to the best of my knowledge.",
        "If a competent authority later determines that any released amount is not payable to me, I undertake to comply with its lawful order, subject to my rights and remedies.",
      ],
      requests: ["Accept this bond with the interim-custody application.", "Execute the authorised release to the verified source account.", "Provide a dated transaction confirmation after execution."],
      closing: `Declarant: ${persona.name}. Complaint: ${acknowledgement}. Date: ${formatDate(new Date())}.`,
      attachments: ["Identity verification placeholder — not uploaded in this prototype", `NCRP acknowledgement ${acknowledgement}`, "Interim-custody order when issued"],
    };
  }

  return {
    title: documentMeta[type].title,
    addressee: ["The Public Information Officer", trustCase.officer.unit, `${complaint.district}, ${complaint.state}`],
    subject: `Information sought on action taken — NCRP ${acknowledgement}`,
    opening: `Applicant ${persona.name} seeks an action-taken report for the complaint affecting ${victim}.`,
    paragraphs: [
      `The complaint for ${complaint.subcategory} was filed on ${complaintDate}. The legacy portal label may show “${trustCase.legacyStatus ?? "Under Process"}”; that label does not state whether the loss was resolved.`,
      `The assigned mock officer shown to the citizen is ${officer}. The amount reported is ₹${complaint.amount.toLocaleString("en-IN")}, with ₹${held.toLocaleString("en-IN")} recorded held.`,
      "This request asks only for records and dated actions; it does not ask the PIO to create an opinion or conduct an investigation.",
    ],
    requests: ["Provide the date the complaint reached the district unit and the diary/reference number.", "Provide dates of notices sent to each bank and responses received.", "Provide the FIR number or the recorded reason FIR registration remains pending.", "Provide the present custodian, current action, and next recorded deadline.", "Provide the date on which each 90-day hold expires."],
    closing: `Please provide the response in electronic form to ${persona.email}.`,
    attachments: [`NCRP acknowledgement ${acknowledgement}`],
  };
}
