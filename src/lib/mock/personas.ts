import type { DemoPersona } from "@/lib/mock/types";

export const personas: DemoPersona[] = [
  {
    id: "citizen-meena", firstName: "Meena", name: "Meena Iyer", age: 61, language: "en", persona: "fresh-victim", email: "meena@demo.in", password: "demo1234", accessCode: "meena@demo.in / demo1234", destination: "/case/22026082710482", description: "Lost ₹4.2 lakh to a WhatsApp investment group; the payment trail is still moving.",
    caseHistory: [
      { acknowledgement: "22026082710482", label: "WhatsApp investment group", amount: 420000, currentStage: "hold_placed", filedFor: "self" },
      { acknowledgement: "22026072307618", label: "Trading platform impersonation", amount: 250000, currentStage: "fir_linked", filedFor: "self" },
    ],
  },
  {
    id: "citizen-arjun", firstName: "Arjun", name: "Arjun Nair", age: 28, language: "en", persona: "case-builder", email: "arjun@demo.in", password: "demo1234", accessCode: "arjun@demo.in / demo1234", destination: "/case/22026082709831", description: "Lost ₹18,000 after a fake electricity-bill call; building the complaint in his own words.",
    caseHistory: [
      { acknowledgement: "22026082709831", label: "Fake electricity-bill call", amount: 18000, currentStage: "assigned", filedFor: "self" },
      { acknowledgement: "22026061206109", label: "Social-media impersonation", amount: 49000, currentStage: "restored", filedFor: "self" },
    ],
  },
  {
    id: "citizen-priya", firstName: "Priya", name: "Priya Sharma", age: 34, language: "en", persona: "relative-filed", email: "priya@demo.in", password: "demo1234", accessCode: "priya@demo.in / demo1234", destination: "/case/22026081508724", description: "Filed 12 days ago for her father; tracking ₹6.8 lakh after NCRP marked it ‘Disposed’.",
    caseHistory: [
      { acknowledgement: "22026081508724", label: "Digital-arrest coercion against her father", amount: 680000, currentStage: "routed", filedFor: "relative", legacyStatus: "Disposed" },
      { acknowledgement: "22026082711203", label: "Card fraud", amount: 132000, currentStage: "custody_applied", filedFor: "self" },
    ],
  },
];

export function findPersonaByCredentials(email: string, password: string) {
  return personas.find((persona) => persona.email === email.trim().toLowerCase() && persona.password === password);
}

export function findPersona(id: string | null) {
  return personas.find((persona) => persona.id === id);
}
