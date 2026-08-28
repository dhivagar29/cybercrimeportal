import { ScamCheck } from "@/components/scam-check";

export const metadata = { title: "Scam check" };

export default async function ScamCheckPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return (
    <div className="page-wrap">
      <p className="eyebrow">Scam check</p>
      <h1 className="page-title">Check before you trust.</h1>
      <p className="lede">Paste a phone number, UPI ID, web address, or APK name. The check uses a seeded mock repository—not a live government watchlist.</p>
      <div className="mt-6"><ScamCheck initialQuery={q ?? ""} /></div>
    </div>
  );
}
