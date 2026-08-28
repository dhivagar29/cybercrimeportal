import Link from "next/link";
import { DemoLogin } from "@/components/demo-login";

export const metadata = { title: "Demo citizen access" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ persona?: string }> }) {
  const { persona } = await searchParams;
  return <div className="page-wrap"><Link className="text-sm font-black text-[var(--primary)]" href="/">← Public landing page</Link><p className="eyebrow mt-5">Demo access</p><h1 className="page-title">Sign in to a mock journey.</h1><p className="lede">Use a one-click persona or type any printed email and password. The session stays only in this browser.</p><div className="mt-6"><DemoLogin initialPersonaId={persona} /></div></div>;
}
