import { Languages, Mic, ScanText } from "lucide-react";

export const metadata = { title: "Describe what happened" };

export default function DescribePage() {
  return (
    <div className="page-wrap">
      <p className="eyebrow">Build the case</p>
      <h1 className="page-title">Tell it your way.</h1>
      <p className="lede">Speak, paste, or type in English or Hindi. The system extracts the facts and fills the complaint; you only confirm what is correct.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {[{icon: Mic, title: 'Speak naturally', text: 'No legal or police language needed.'}, {icon: ScanText, title: 'Paste evidence', text: 'Messages, UTRs, phone numbers and handles.'}, {icon: Languages, title: 'English or Hindi', text: 'The meaning is preserved, not just the labels.'}].map(({icon: Icon, title, text}) => <div className="panel" key={title}><Icon aria-hidden="true" className="text-[#0b2b4c]" /><h2 className="mb-1 text-lg">{title}</h2><p className="m-0 text-sm leading-5 text-[#52606d]">{text}</p></div>)}
      </div>
    </div>
  );
}
