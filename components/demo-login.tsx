"use client";

import { ArrowRight, UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const personas = [
  { id: "citizen-meena", name: "Meena", email: "meena@demo.in", password: "demo1234", route: "/report/hold", task: "Stop ₹4.2 lakh investment-scam loss" },
  { id: "citizen-arjun", name: "Arjun", email: "arjun@demo.in", password: "demo1234", route: "/describe", task: "Build an ₹18,000 UPI fraud case" },
  { id: "citizen-priya", name: "Priya", email: "priya@demo.in", password: "demo1234", route: "/case/22026081508724", task: "Track and escalate a 12-day-old case" },
] as const;

export function DemoLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const requested = new URLSearchParams(window.location.search).get("persona");
      const persona = personas.find((item) => item.id === requested);
      if (persona) { setEmail(persona.email); setPassword(persona.password); }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function choose(persona: (typeof personas)[number]) {
    setEmail(persona.email); setPassword(persona.password); setError("");
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const persona = personas.find((item) => item.email === email.trim().toLowerCase() && item.password === password);
    if (!persona) { setError("Use one of the three printed mock credentials below."); return; }
    window.localStorage.setItem("cybercrimeportal:persona:v1", persona.id);
    router.push(persona.route);
  }

  return (
    <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
      <form className="panel" onSubmit={submit}>
        <UserRoundCheck aria-hidden="true" size={34} className="text-[#0b2b4c]" />
        <h2 className="mb-1 text-2xl">Open a mock citizen case</h2>
        <p className="mt-1 text-sm leading-5 text-[#52606d]">This is a scenario chooser, not real authentication. The public demo remains available without signing in.</p>
        <label className="mt-4 block"><span className="field-label">Mock email</span><input className="field-control" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className="mt-4 block"><span className="field-label">Mock password</span><input className="field-control" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error ? <p className="border-2 border-[#a83308] bg-[#fff1eb] p-3 text-sm font-black text-[#a83308]" role="alert">{error}</p> : null}
        <button className="button-primary mt-5 w-full" type="submit">Enter selected scenario <ArrowRight aria-hidden="true" size={20} /></button>
      </form>
      <section aria-labelledby="credentials-heading">
        <p className="eyebrow">Printed mock credentials</p><h2 id="credentials-heading" className="mt-1 text-2xl">One click fills the form.</h2>
        <div className="mt-4 grid gap-3">
          {personas.map((persona) => <button className="panel w-full text-left hover:border-[#0b2b4c]" type="button" onClick={() => choose(persona)} key={persona.id}><span className="flex items-center justify-between gap-3"><strong className="text-lg">{persona.name}</strong><span className="status-pill">Use demo</span></span><span className="mt-2 block text-sm leading-5 text-[#52606d]">{persona.task}</span><span className="mt-3 block border-t border-dashed border-[#8292a2] pt-3 font-mono text-sm font-black">{persona.email} / {persona.password}</span></button>)}
        </div>
      </section>
    </div>
  );
}
