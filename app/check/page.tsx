import { Search, Share2, ShieldAlert } from "lucide-react";

export const metadata = { title: "Scam check" };

export default function CheckPage() {
  return (
    <div className="page-wrap">
      <p className="eyebrow">Scam check</p>
      <h1 className="page-title">Check before you trust.</h1>
      <p className="lede">Paste a phone number, UPI ID, web address, or APK name. The check uses a seeded mock repository—not a live government watchlist.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_0.7fr]">
        <section className="panel"><Search aria-hidden="true" size={30} className="text-[#0b2b4c]" /><h2 className="text-xl">200 mock identifiers</h2><p className="text-[#52606d]">Seeded reports cover phone numbers, UPI handles, suspicious URLs, and APK names.</p></section>
        <aside className="panel bg-[#fff4df]"><ShieldAlert aria-hidden="true" className="text-[#9a6700]" /><h2 className="mb-1 text-xl">Built to share</h2><p className="mb-2 text-sm leading-5 text-[#52606d]">Results become a clear card you can forward to a parent.</p><span className="inline-flex items-center gap-2 font-black"><Share2 aria-hidden="true" size={18} /> WhatsApp-ready</span></aside>
      </div>
    </div>
  );
}
