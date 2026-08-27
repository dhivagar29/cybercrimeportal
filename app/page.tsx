import Link from "next/link";
import { ArrowRight, PhoneCall, Search } from "lucide-react";
import { Metric } from "@/components/metric";
import { StartHoldLink } from "@/components/start-hold-link";
import { citizens } from "@/src/lib/mock/fixtures";

export default function HomePage() {
  return (
    <div className="page-wrap">
      <section className="grid gap-6 border-b-2 border-[#cbd5df] pb-8 md:grid-cols-[1.2fr_0.8fr] md:items-end">
        <div>
          <p className="eyebrow">Act now. Details can wait.</p>
          <h1 className="page-title">Have you lost money?</h1>
          <p className="lede">These scams are engineered to work on anyone. You did not cause this. Start with the money trail—we will build the complaint after.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <StartHoldLink className="button-primary">Yes — stop the money <ArrowRight aria-hidden="true" size={20} /></StartHoldLink>
            <Link className="button-secondary" href="/check">No — check something first <Search aria-hidden="true" size={20} /></Link>
          </div>
          <p className="mt-4 flex items-start gap-2 text-sm leading-5 text-[#52606d]"><PhoneCall aria-hidden="true" className="mt-0.5 shrink-0" size={17} /> In a real emergency, call the official helpline <strong className="text-[#101d2b]">1930</strong>. This prototype does not place calls or reports.</p>
        </div>
        <aside className="panel panel-dark">
          <p className="m-0 text-xs font-black uppercase tracking-[0.12em] text-[#9dd8ff]">Design target</p>
          <p className="my-2 text-5xl font-black tracking-[-0.06em]">&lt; 90 sec</p>
          <p className="m-0 leading-6 text-[#d7e8f5]">From this screen to a simulated hold request. No account. No ID scan. Four facts only.</p>
        </aside>
      </section>

      <section aria-labelledby="why-heading" className="py-8">
        <p className="eyebrow">Why the first minutes matter</p>
        <h2 id="why-heading" className="mt-2 max-w-[18ch] text-3xl leading-tight tracking-[-0.035em]">A complaint records harm. A fast hold can limit it.</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Metric value="₹22,495 cr" label="reported lost in 2025" detail="Across 28.15 lakh reported cases." />
          <Metric value="₹7,647 cr" label="frozen since April 2021" detail="Money identified and stopped in the banking chain." />
          <Metric value="₹167 cr" label="returned to victims" detail="Only 2.2 paise returned for every rupee frozen." />
        </div>
      </section>

      <section aria-labelledby="demo-heading" className="border-t-2 border-[#cbd5df] py-8">
        <p className="eyebrow">Judge-ready demo access</p>
        <h2 id="demo-heading" className="mt-2 text-2xl tracking-[-0.03em]">Three mock citizens. No real passwords.</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {citizens.map((citizen) => (
            <article className="panel" key={citizen.id}>
              <div className="flex items-start justify-between gap-3"><h3 className="m-0 text-lg">{citizen.name}</h3><span className="status-pill">Age {citizen.age}</span></div>
              <p className="min-h-12 text-sm leading-5 text-[#52606d]">{citizen.description}</p>
              <p className="mb-0 border-t border-dashed border-[#8292a2] pt-3 font-mono text-sm font-black">Code: {citizen.accessCode}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel bg-[#eaf6f2] md:flex md:items-center md:justify-between md:gap-6">
        <div><p className="eyebrow text-[#08745c]">The thesis</p><h2 className="my-2 text-2xl leading-tight">cybercrime.gov.in is designed to receive a complaint. This is designed to get your money back.</h2></div>
        <StartHoldLink direct className="button-primary mt-4 shrink-0 md:mt-0">Start the 90-second flow <ArrowRight aria-hidden="true" size={20} /></StartHoldLink>
      </section>
    </div>
  );
}
