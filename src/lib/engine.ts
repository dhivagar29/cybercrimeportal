export type ExtractedField = {
  label: string;
  value: string;
  kind: "amount" | "utr" | "upi" | "phone" | "handle" | "url";
};

export type IntakeAnalysis = {
  category: string;
  subcategory: string;
  confidence: number;
  summary: string;
  fields: ExtractedField[];
  matchedBy: "demo-scenario" | "local-rules";
};

export const demoNarratives = {
  meena: "I joined a WhatsApp trading group called Prime Alpha Returns. They first asked for ₹20,000 and kept showing profit. Today I transferred ₹4,20,000 by RTGS after speaking to 9876543210. The UTR is UTR42608271642 and the WhatsApp admin is @primealphahelp. Now they want a tax payment before withdrawal.",
  arjun: "I got a call from 9812345678 saying my electricity would be disconnected. I paid Rs 18,000 by UPI to powerhelp@oksbi. UTR42608270189. The caller made me install QuickBillSupport.apk and stopped replying.",
  priya: "A caller claimed to be CBI and kept my father on a video call for a digital arrest. He sent INR 6,80,000 by NEFT to a safe account. Reference UTR42608152204. They used +91 9911223344 and sent a notice from custody-check.in.",
} as const;

const moneyPattern = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|crore|cr)?/gi;
const upiPattern = /\b[a-z0-9][a-z0-9._-]{1,}@[a-z][a-z0-9.-]{1,}\b/gi;
const phonePattern = /(?:\+91[\s-]?)?[6-9]\d{9}\b/g;
const utrPattern = /\b(?:UTR)?[A-Z0-9]{11,22}\b/g;
const urlPattern = /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?\b/gi;
const handlePattern = /(?<![\w.-])@[a-z0-9_]{3,}\b/gi;

function normalizeAmount(raw: string, unit?: string) {
  const base = Number(raw.replaceAll(",", ""));
  if (/lakh|lakhs|lac|lacs/i.test(unit ?? "")) return base * 100_000;
  if (/crore|cr/i.test(unit ?? "")) return base * 10_000_000;
  return base;
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()))];
}

function field(label: string, value: string, kind: ExtractedField["kind"]): ExtractedField {
  return { label, value, kind };
}

function classify(text: string) {
  const lower = text.toLowerCase();
  if (/trading|investment|returns?|profit|withdrawal|crypto/.test(lower)) return ["Online Financial Fraud", "Investment Scam / Trading Scam"] as const;
  if (/digital arrest|cbi|police|customs|courier|safe account/.test(lower)) return ["Online Financial Fraud", "Digital Arrest"] as const;
  if (/electricity|bill|disconnect|utility/.test(lower)) return ["Online Financial Fraud", "Fraud Call / Vishing"] as const;
  if (/card|cvv|otp|credit card|debit card/.test(lower)) return ["Online Financial Fraud", "Debit/Credit Card Fraud"] as const;
  if (/upi|qr code|collect request/.test(lower)) return ["Online Financial Fraud", "UPI Fraud"] as const;
  if (/instagram|facebook|whatsapp|impersonat|profile/.test(lower)) return ["Online and Social Media Crime", "Impersonation / Cheating"] as const;
  if (/apk|remote access|screen share|anydesk/.test(lower)) return ["Cyber Attack", "Malware / Remote Access"] as const;
  return ["Online Financial Fraud", "Other Online Financial Fraud"] as const;
}

export function analyzeNarrative(input: string): IntakeAnalysis {
  const text = input.trim();
  const lower = text.toLowerCase();
  const scenario = lower.includes("prime alpha") || lower.includes("4,20,000")
    ? "meena"
    : lower.includes("electricity") || lower.includes("powerhelp@oksbi")
      ? "arjun"
      : lower.includes("digital arrest") || lower.includes("safe account")
        ? "priya"
        : null;

  const [category, subcategory] = classify(text);
  const fields: ExtractedField[] = [];
  for (const match of text.matchAll(moneyPattern)) fields.push(field("Amount", `₹${normalizeAmount(match[1], match[2]).toLocaleString("en-IN")}`, "amount"));
  unique(text.match(upiPattern) ?? []).forEach((value) => fields.push(field("UPI ID", value, "upi")));
  unique(text.match(phonePattern) ?? []).forEach((value) => fields.push(field("Phone number", value, "phone")));
  unique(text.match(utrPattern) ?? []).filter((value) => /\d/.test(value) && value.length >= 12).forEach((value) => fields.push(field("Payment reference", value, "utr")));
  unique(text.match(urlPattern) ?? []).filter((value) => !value.includes("@") && !/^\d/.test(value)).forEach((value) => fields.push(field("Web address", value, "url")));
  unique(text.match(handlePattern) ?? []).forEach((value) => fields.push(field("Account handle", value, "handle")));

  const summaries = {
    meena: "A WhatsApp trading group induced repeated transfers and demanded another payment to release fabricated returns.",
    arjun: "A caller used an urgent electricity-disconnection threat to induce a UPI payment and APK installation.",
    priya: "Callers impersonated investigators, used digital-arrest coercion, and directed a NEFT transfer to a claimed safe account.",
  } as const;

  return {
    category,
    subcategory,
    confidence: scenario ? 96 : fields.length >= 2 ? 86 : 72,
    summary: scenario ? summaries[scenario] : "The account describes a suspected cyber-enabled financial deception. Confirm the extracted facts before adding them to the complaint.",
    fields,
    matchedBy: scenario ? "demo-scenario" : "local-rules",
  };
}
