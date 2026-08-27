import { Landmark, Scale, TimerReset } from "lucide-react";

export const metadata = { title: "Money restoration" };

export default function RestorePage() {
  return (
    <div className="page-wrap">
      <p className="eyebrow">Money restoration tracker</p>
      <h1 className="page-title">Frozen is not returned.</h1>
      <p className="lede">See the beneficiary bank holding each amount, the legal step that releases it, and the bank’s 15-day execution clock.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {[{icon: Landmark, title: 'Locate the money', text: 'Trace each held amount to the beneficiary bank.'}, {icon: Scale, title: 'Unlock the legal step', text: 'Direct interim custody below ₹50,000; FIR linkage above it.'}, {icon: TimerReset, title: 'Track execution', text: 'Count the 15 days after a bank receives the order.'}].map(({icon: Icon, title, text}) => <div className="panel" key={title}><Icon aria-hidden="true" className="text-[#0b2b4c]" /><h2 className="mb-1 text-lg">{title}</h2><p className="m-0 text-sm leading-5 text-[#52606d]">{text}</p></div>)}
      </div>
    </div>
  );
}
