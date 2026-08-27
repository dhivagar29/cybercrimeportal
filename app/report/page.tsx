import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";

export const metadata = { title: "Stop the money" };

export default function ReportPage() {
  return (
    <div className="page-wrap">
      <p className="eyebrow">Golden hour response</p>
      <h1 className="page-title">Stop the bleeding.</h1>
      <p className="lede">Four facts are enough to send a simulated hold request into the payment chain. Your full account can be written later.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_0.7fr]">
        <section className="panel">
          <h2 className="mt-0 text-2xl">What we need first</h2>
          <ol className="grid list-none gap-3 p-0">
            {['Amount sent', 'When it happened', 'Payment rail', 'Your bank'].map((item, index) => <li className="flex items-center gap-3 border-b border-[#cbd5df] pb-3 font-black last:border-0" key={item}><span className="grid size-9 shrink-0 place-items-center bg-[#0b2b4c] text-white">{index + 1}</span>{item}</li>)}
          </ol>
          <Link className="button-primary mt-2 w-full" href="/report/hold">Enter the four facts <ArrowRight aria-hidden="true" size={20} /></Link>
        </section>
        <aside className="panel bg-[#fff4df]">
          <Clock3 aria-hidden="true" size={30} className="text-[#9a6700]" />
          <h2 className="mb-2 text-xl">The clock starts with the fraud</h2>
          <p className="m-0 leading-6 text-[#52606d]">The next screen keeps the elapsed time visible. Speed matters more than perfect wording.</p>
        </aside>
      </div>
    </div>
  );
}
