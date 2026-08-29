import { ArrowRight, FileText, MessageSquareWarning, ShieldCheck, TimerReset } from "lucide-react";
import Link from "next/link";
import { Metric } from "@/components/metric";

const stats = [
  { value: "₹22,495 cr", label: "lost in 2025", detail: "Reclaim starts with the payment trail before asking for a complete complaint." },
  { value: "~2%", label: "of complaints become FIRs", detail: "Every case stage names what happened next—and states clearly that a complaint is not an FIR." },
  { value: "₹7,647 cr", label: "frozen · ₹167 cr returned", detail: "The restoration tracker shows the legal step between a bank hold and money back in the account." },
] as const;

export default function HomePage() {
  return (
    <div className="page-wrap">
      <section className="border-b-2 border-[var(--line)] pb-10 pt-3">
        <p className="eyebrow">Citizen-side cybercrime recovery</p>
        <h1 className="page-title max-w-[19ch]">Report in your own words. Freeze the money first. See exactly where your case is.</h1>
        <p className="lede mt-5">A calm, mock-only path to stop financial loss, preserve online evidence, and see what happens after a report.</p>
        <div className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-2">
          <Link className="button-alert" href="/golden-hour"><TimerReset aria-hidden="true" size={22} /> I&apos;m losing money RIGHT NOW</Link>
          <Link className="button-secondary" href="/report"><FileText aria-hidden="true" size={21} /> Report a cybercrime / track my case <ArrowRight aria-hidden="true" size={20} /></Link>
        </div>
        <Link className="button-quiet mt-3 w-full max-w-3xl justify-between bg-white text-left text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--blue-soft)]" href="/takedown">
          <span className="flex items-center gap-3 text-left"><MessageSquareWarning aria-hidden="true" className="shrink-0" size={22} /> Being harassed or blackmailed online?</span>
          <ArrowRight aria-hidden="true" className="shrink-0" size={20} />
        </Link>
        <Link className="button-quiet mt-3 w-full max-w-3xl justify-between bg-white text-left text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--blue-soft)]" href="/report/safe">
          <span className="flex items-center gap-3 text-left"><ShieldCheck aria-hidden="true" className="shrink-0" size={22} /> Safer report for women and children</span>
          <ArrowRight aria-hidden="true" className="shrink-0" size={20} />
        </Link>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">No login is required for Golden Hour, Stop the Spread, or safer reporting. This prototype never contacts a bank, platform, police, or the 1930 helpline.</p>
      </section>
      <section aria-labelledby="evidence-heading" className="py-9">
        <p className="eyebrow">Why the flow is split</p>
        <h2 id="evidence-heading" className="mt-2 text-3xl tracking-[-0.035em]">Three gaps. Three direct responses.</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">{stats.map((stat) => <Metric key={stat.value} value={stat.value} label={stat.label} detail={stat.detail} />)}</div>
      </section>
      <section className="panel bg-[var(--blue-soft)] md:flex md:items-center md:justify-between md:gap-6">
        <div><p className="eyebrow">Demo access</p><h2 className="my-2 text-2xl">Open Meena, Arjun, or Priya’s complete mock journey.</h2><p className="mb-0 text-sm leading-6 text-[var(--muted)]">Credentials are printed on the login page. No real account or password is used.</p></div>
        <Link className="button-primary mt-5 shrink-0 md:mt-0" href="/login">Choose a mock citizen <ArrowRight aria-hidden="true" size={20} /></Link>
      </section>
    </div>
  );
}
