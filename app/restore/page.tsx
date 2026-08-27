import { RestorationTracker } from "@/components/restoration-tracker";

export const metadata = { title: "Money restoration" };

export default function RestorePage() {
  return (
    <div className="page-wrap">
      <p className="eyebrow">Money restoration tracker</p>
      <h1 className="page-title">Frozen is not returned.</h1>
      <p className="lede">See the beneficiary bank holding each amount, the legal step that releases it, and the bank’s 15-day execution clock.</p>
      <div className="mt-6"><RestorationTracker /></div>
    </div>
  );
}
