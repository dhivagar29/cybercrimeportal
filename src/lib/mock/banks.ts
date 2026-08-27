import type { BankFixture } from "@/lib/mock/types";

const bankRecords: Omit<BankFixture, "fraudLine">[] = [
  { id: "bank-sbi", name: "State Bank of India", maskedAccount: "•••• 4821", holdAmount: 42000, upiApps: ["BHIM SBI Pay", "YONO SBI"] },
  { id: "bank-hdfc", name: "HDFC Bank", maskedAccount: "•••• 1907", holdAmount: 118000, upiApps: ["PayZapp", "HDFC MobileBanking"] },
  { id: "bank-axis", name: "Axis Bank", maskedAccount: "•••• 7634", holdAmount: 27500, upiApps: ["Axis Mobile", "Google Pay"] },
  { id: "bank-icici", name: "ICICI Bank", maskedAccount: "•••• 3012", holdAmount: 84000, upiApps: ["iMobile Pay", "Pockets"] },
  { id: "bank-kotak", name: "Kotak Mahindra Bank", maskedAccount: "•••• 5580", holdAmount: 0, upiApps: ["Kotak Mobile Banking"] },
  { id: "bank-pnb", name: "Punjab National Bank", maskedAccount: "•••• 4403", holdAmount: 0, upiApps: ["PNB ONE"] },
  { id: "bank-bob", name: "Bank of Baroda", maskedAccount: "•••• 2218", holdAmount: 0, upiApps: ["bob World"] },
  { id: "bank-canara", name: "Canara Bank", maskedAccount: "•••• 9074", holdAmount: 0, upiApps: ["Canara ai1"] },
  { id: "bank-union", name: "Union Bank of India", maskedAccount: "•••• 6105", holdAmount: 0, upiApps: ["Union ease"] },
  { id: "bank-indusind", name: "IndusInd Bank", maskedAccount: "•••• 3862", holdAmount: 0, upiApps: ["INDIE", "BHIM IndusPay"] },
  { id: "bank-idfc", name: "IDFC FIRST Bank", maskedAccount: "•••• 1146", holdAmount: 0, upiApps: ["IDFC FIRST Mobile"] },
  { id: "bank-yes", name: "YES BANK", maskedAccount: "•••• 7710", holdAmount: 0, upiApps: ["iris by YES BANK"] },
  { id: "bank-indian", name: "Indian Bank", maskedAccount: "•••• 2934", holdAmount: 0, upiApps: ["IndOASIS"] },
  { id: "bank-boi", name: "Bank of India", maskedAccount: "•••• 6841", holdAmount: 0, upiApps: ["BOI Mobile Omni Neo"] },
  { id: "bank-federal", name: "Federal Bank", maskedAccount: "•••• 7359", holdAmount: 0, upiApps: ["FedMobile"] },
  { id: "bank-rbl", name: "RBL Bank", maskedAccount: "•••• 8096", holdAmount: 0, upiApps: ["RBL MoBank"] },
  { id: "bank-au", name: "AU Small Finance Bank", maskedAccount: "•••• 1572", holdAmount: 0, upiApps: ["AU 0101"] },
  { id: "bank-paytm", name: "Paytm Payments Bank", maskedAccount: "•••• 3488", holdAmount: 0, upiApps: ["Paytm"] },
  { id: "bank-airtel", name: "Airtel Payments Bank", maskedAccount: "•••• 5263", holdAmount: 0, upiApps: ["Airtel Thanks"] },
  { id: "bank-ippb", name: "India Post Payments Bank", maskedAccount: "•••• 9950", holdAmount: 0, upiApps: ["IPPB Mobile Banking"] },
];

export const banks: BankFixture[] = bankRecords.map((bank, index) => ({
  ...bank,
  fraudLine: `1800-000-${String(2101 + index).padStart(4, "0")}`,
}));

export const upiApps = ["BHIM", "Google Pay", "PhonePe", "Paytm", "Amazon Pay", "WhatsApp Pay"] as const;
