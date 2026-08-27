import Link from "next/link";
import { DemoLogin } from "@/components/demo-login";

export const metadata = { title: "Demo citizen access" };

export default function LoginPage() {
  return <div className="page-wrap"><Link className="text-sm font-black text-[#0b2b4c]" href="/">← Public landing page</Link><p className="eyebrow mt-5">Demo access</p><h1 className="page-title">Choose whose case to open.</h1><p className="lede">No real account is created. Each mock citizen starts at a different point in the recovery journey.</p><div className="mt-6"><DemoLogin /></div></div>;
}
