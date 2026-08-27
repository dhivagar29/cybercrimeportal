import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-wrap">
      <p className="eyebrow">Page not found</p>
      <h1 className="page-title">This path has no case.</h1>
      <p className="lede">Return to the citizen dashboard and choose a visible action.</p>
      <Link className="button-primary mt-4" href="/">Return home</Link>
    </div>
  );
}
