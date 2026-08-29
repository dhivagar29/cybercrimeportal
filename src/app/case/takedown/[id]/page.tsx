import Link from "next/link";
import { TakedownCaseFile } from "@/components/takedown-case-file";

type Props = { params: Promise<{ id: string }> };

export default async function TakedownCasePage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="page-wrap">
      <div className="mb-6">
        <Link className="text-sm font-black text-[var(--primary)]" href="/case">← All cases</Link>
        <p className="eyebrow mt-5">Stop the spread · {id}</p>
        <h1 className="page-title">Takedown case file</h1>
        <p className="lede">See what the platform has done, which deadline applies, and when escalation becomes available.</p>
      </div>
      <TakedownCaseFile acknowledgement={id} />
    </div>
  );
}
