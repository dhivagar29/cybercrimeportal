import { DescribeIntake } from "@/components/describe-intake";

export const metadata = { title: "Describe what happened" };

export default function DescribePage() {
  return (
    <div className="page-wrap">
      <p className="eyebrow">Build the case</p>
      <h1 className="page-title">Tell it your way.</h1>
      <p className="lede">Paste or type the account in plain English. A local rules engine classifies the complaint and extracts the identifiers; you only confirm what is correct.</p>
      <div className="mt-6"><DescribeIntake /></div>
    </div>
  );
}
