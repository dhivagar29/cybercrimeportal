"use client";

import { ArrowRight, UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { writeMockSession } from "@/lib/auth";
import { findPersonaByCredentials, personas } from "@/lib/mock/personas";
import type { DemoPersona } from "@/lib/mock/types";

export function DemoLogin({ initialPersonaId }: { initialPersonaId?: string }) {
  const router = useRouter();
  const initialPersona = personas.find((item) => item.id === initialPersonaId);
  const [email, setEmail] = useState(initialPersona?.email ?? "");
  const [password, setPassword] = useState(initialPersona?.password ?? "");
  const [error, setError] = useState("");

  function signIn(persona: DemoPersona) {
    writeMockSession(persona.id);
    router.push(persona.destination);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const persona = findPersonaByCredentials(email, password);
    if (!persona) { setError("Those details do not match a printed mock account."); return; }
    setError("");
    signIn(persona);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <form className="panel" onSubmit={submit}>
        <UserRoundCheck aria-hidden="true" size={36} className="text-[var(--primary)]" />
        <h2 className="mb-1 text-2xl">Use email and password</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">This creates only a local demo session. Golden Hour remains public without signing in.</p>
        <label className="mt-4 block"><span className="field-label">Email</span><input className="field-control" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className="mt-4 block"><span className="field-label">Password</span><input className="field-control" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error ? <p className="border-2 border-[var(--warning)] bg-[var(--warning-soft)] p-3 text-sm font-black text-[var(--warning-dark)]" role="alert">{error}</p> : null}
        <button className="button-primary mt-5 w-full" type="submit">Sign in <ArrowRight aria-hidden="true" size={20} /></button>
      </form>
      <section aria-labelledby="personas-heading">
        <p className="eyebrow">One-click demo accounts</p>
        <h2 id="personas-heading" className="mt-1 text-2xl">Choose a citizen journey.</h2>
        <div className="mt-4 grid gap-3">
          {personas.map((persona) => (
            <article className="panel" key={persona.id}>
              <div className="flex items-start justify-between gap-3"><div><h3 className="m-0 text-xl">{persona.name}</h3><p className="mb-0 mt-1 text-sm leading-6 text-[var(--muted)]">{persona.description}</p></div><span className="status-pill">Age {persona.age}</span></div>
              <p className="my-4 border-y border-dashed border-[var(--line-strong)] py-3 font-mono text-sm font-black">{persona.email} / {persona.password}</p>
              <button className="button-secondary w-full" type="button" onClick={() => signIn(persona)}>Sign in as {persona.firstName} <ArrowRight aria-hidden="true" size={19} /></button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
