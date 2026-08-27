import Link from "next/link";

export const metadata = { title: "Four facts for a hold" };

export default function HoldPage() {
  return (
    <div className="page-wrap">
      <p className="eyebrow">Golden hour · four facts</p>
      <h1 className="page-title">Start with the money trail.</h1>
      <p className="lede">Use the guided flow to capture only what a bank needs to identify the transfer. The full interactive hold request is the next build slice.</p>
      <Link className="button-secondary mt-5" href="/report">Back to response overview</Link>
    </div>
  );
}
