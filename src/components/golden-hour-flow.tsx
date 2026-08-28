"use client";

import {
  ArrowLeft,
  ArrowRight,
  BanknoteArrowDown,
  Check,
  CheckCircle2,
  Clock3,
  PhoneCall,
  Search,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatGoldenHourDuration,
  GOLDEN_HOUR_REPORT_KEY,
  GOLDEN_HOUR_TICKET_KEY,
  paymentMethods,
  whenChoices,
  type GoldenHourTicket,
  type PaymentMethod,
  type WhenChoice,
} from "@/lib/golden-hour";
import { banks } from "@/lib/mock/banks";

type FlowStep = 0 | 1 | 2 | 3;

const stepLabels = ["Amount", "When", "Payment", "Bank"] as const;

function makeReference(now: number) {
  return `2${String(now).padStart(13, "0").slice(-13)}`;
}

function safeTicket(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GoldenHourTicket;
    return parsed.reference?.startsWith("2") ? parsed : null;
  } catch {
    return null;
  }
}

export function GoldenHourFlow() {
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<FlowStep>(0);
  const [amount, setAmount] = useState("");
  const [whenChoice, setWhenChoice] = useState<WhenChoice | null>(null);
  const [occurredAt, setOccurredAt] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [bankId, setBankId] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [ticket, setTicket] = useState<GoldenHourTicket | null>(null);
  const [showInterrupt, setShowInterrupt] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const openedAt = Date.now();
      setStartedAt(openedAt);
      setNow(openedAt);
      setTicket(safeTicket(window.localStorage.getItem(GOLDEN_HOUR_TICKET_KEY)));
      amountInputRef.current?.focus();
    });
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  const elapsedSeconds = ticket?.responseSeconds ?? (startedAt && now ? Math.floor((now - startedAt) / 1000) : 0);
  const selectedBank = banks.find((bank) => bank.id === (ticket?.bankId ?? bankId));
  const filteredBanks = useMemo(() => {
    const query = bankSearch.trim().toLocaleLowerCase("en-IN");
    if (!query) return banks;
    return banks.filter((bank) => `${bank.name} ${bank.upiApps.join(" ")}`.toLocaleLowerCase("en-IN").includes(query));
  }, [bankSearch]);

  function chooseWhen(choice: (typeof whenChoices)[number]) {
    setWhenChoice(choice.id);
    setOccurredAt(new Date((now || startedAt) - choice.offsetMinutes * 60_000).toISOString());
    setStep(2);
  }

  function choosePayment(method: PaymentMethod) {
    setPaymentMethod(method);
    setStep(3);
  }

  function submitHold() {
    if (!amount || !whenChoice || !occurredAt || !paymentMethod || !selectedBank || !startedAt) return;
    const requestedAt = Date.now();
    const nextTicket: GoldenHourTicket = {
      amount: Number(amount),
      whenChoice,
      occurredAt,
      paymentMethod,
      bankId: selectedBank.id,
      bankName: selectedBank.name,
      reference: makeReference(requestedAt),
      requestedAt: new Date(requestedAt).toISOString(),
      responseSeconds: Math.max(0, Math.floor((requestedAt - startedAt) / 1000)),
      state: "hold-request-sent",
    };
    window.localStorage.setItem(GOLDEN_HOUR_TICKET_KEY, JSON.stringify(nextTicket));
    window.localStorage.setItem(GOLDEN_HOUR_REPORT_KEY, JSON.stringify(nextTicket));
    setTicket(nextTicket);
  }

  if (showInterrupt) {
    return (
      <section className="mx-auto grid min-h-[70dvh] max-w-3xl content-center gap-6" aria-labelledby="digital-arrest-heading">
        <div className="border-2 border-[var(--primary)] bg-white p-5 sm:p-8">
          <ShieldAlert aria-hidden="true" className="text-[var(--primary)]" size={44} />
          <p className="eyebrow mt-5">Hang up first</p>
          <h1 id="digital-arrest-heading" className="mt-2 text-3xl leading-tight sm:text-4xl">There is no such thing as a digital arrest.</h1>
          <p className="mt-4 text-xl font-bold leading-8">Police never demand money on a call. Hang up now.</p>
          <ol className="mt-6 grid list-none gap-3 p-0">
            {["End the call. Do not explain or negotiate.", "Stop screen sharing. Do not send money or share an OTP.", "Call 1930 and a trusted person from your own phone."].map((action, index) => (
              <li className="flex min-h-14 items-center gap-3 border border-[var(--border)] bg-[var(--surface-muted)] p-3" key={action}>
                <span className="grid size-9 shrink-0 place-items-center bg-[var(--primary)] font-black text-white">{index + 1}</span>
                <strong>{action}</strong>
              </li>
            ))}
          </ol>
          <button className="button-primary mt-6 w-full" type="button" onClick={() => setShowInterrupt(false)}>
            <Check aria-hidden="true" size={21} /> I have hung up — return to report
          </button>
        </div>
        <ElapsedClock seconds={elapsedSeconds} />
      </section>
    );
  }

  if (ticket && selectedBank) {
    return (
      <section className="mx-auto grid min-h-[72dvh] max-w-3xl content-center gap-5" aria-labelledby="hold-confirmation-heading">
        <div className="border-2 border-[#08745c] bg-[#eaf6f2] p-5 sm:p-7" role="status">
          <div className="flex items-start gap-3">
            <CheckCircle2 aria-hidden="true" className="mt-1 shrink-0 text-[#08745c]" size={42} />
            <div>
              <p className="m-0 text-xs font-black uppercase tracking-[0.12em] text-[#08745c]">Hold request sent</p>
              <h1 id="hold-confirmation-heading" className="m-0 mt-2 text-3xl leading-tight">The bank has been alerted.</h1>
            </div>
          </div>
          <dl className="mt-6 grid gap-px bg-[#8cb8aa] sm:grid-cols-2">
            <div className="bg-white p-4"><dt className="text-xs font-black uppercase text-[var(--muted)]">Reference</dt><dd className="m-0 mt-1 break-all font-mono text-xl font-black">{ticket.reference}</dd></div>
            <div className="bg-white p-4"><dt className="text-xs font-black uppercase text-[var(--muted)]">Target bank or app</dt><dd className="m-0 mt-1 text-lg font-black">{ticket.bankName}</dd></div>
            <div className="bg-white p-4"><dt className="text-xs font-black uppercase text-[var(--muted)]">Amount</dt><dd className="m-0 mt-1 text-xl font-black">₹{ticket.amount.toLocaleString("en-IN")}</dd></div>
            <div className="bg-white p-4"><dt className="text-xs font-black uppercase text-[var(--muted)]">Stopwatch</dt><dd className="m-0 mt-1 font-mono text-xl font-black">Hold requested in {formatGoldenHourDuration(ticket.responseSeconds)}</dd></div>
          </dl>
          <p className="mb-0 mt-4 text-sm leading-6"><strong>Prototype:</strong> this is a saved mock CFCFRMS ticket. No bank or government system was contacted.</p>
        </div>

        <section className="panel" aria-labelledby="right-now-heading">
          <h2 id="right-now-heading" className="mt-0 text-2xl">Do these 3 things right now</h2>
          <ol className="grid list-none gap-3 p-0">
            <ActionItem number={1} icon={<PhoneCall aria-hidden="true" size={21} />} title="Call 1930" detail="Tell them you already have this mock reference and need an urgent financial-fraud report." />
            <ActionItem number={2} icon={<PhoneCall aria-hidden="true" size={21} />} title={`Call ${ticket.bankName}`} detail={`Mock fraud line: ${selectedBank.fraudLine}. Use the official number in a real emergency.`} />
            <ActionItem number={3} icon={<Check aria-hidden="true" size={21} />} title="Keep every chat and screenshot" detail="Do not delete messages, call logs, payment receipts, or profile details." />
          </ol>
        </section>

        <Link className="button-primary w-full" href="/report">
          Now build your case <ArrowRight aria-hidden="true" size={21} />
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl" aria-labelledby="golden-hour-heading">
      <div className="sticky top-0 z-10 mb-4 border-2 border-[var(--primary)] bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-black uppercase tracking-[0.1em] text-[var(--muted)]">Golden Hour · Step {step + 1} of 4</p>
            <p className="m-0 mt-1 text-sm font-bold">Time matters: every minute lowers recovery odds</p>
          </div>
          <strong className="shrink-0 font-mono text-2xl text-[var(--primary)]" aria-label={`${elapsedSeconds} seconds elapsed`}>{formatGoldenHourDuration(elapsedSeconds)}</strong>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1" aria-hidden="true">
          {stepLabels.map((label, index) => <span className={`h-1.5 ${index <= step ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`} key={label} />)}
        </div>
      </div>

      <div className="border-2 border-[var(--primary)] bg-white p-5 sm:p-8">
        {step === 0 ? (
          <form onSubmit={(event) => { event.preventDefault(); if (Number(amount) > 0) setStep(1); }}>
            <p className="eyebrow">One answer at a time</p>
            <h1 id="golden-hour-heading" className="mt-2 text-3xl leading-tight sm:text-4xl">How much money left your account?</h1>
            <p className="mt-3 text-[var(--muted)]">An estimate is enough. You can correct it later.</p>
            <label className="relative mt-7 block">
              <span className="sr-only">Amount lost in rupees</span>
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-black">₹</span>
              <input ref={amountInputRef} className="min-h-20 w-full border-2 border-[var(--primary)] bg-white py-3 pl-12 pr-4 text-3xl font-black outline-none focus:ring-4 focus:ring-[var(--focus)]" name="amount" type="number" inputMode="numeric" min="1" step="1" autoComplete="off" placeholder="0" required value={amount} onChange={(event) => setAmount(event.target.value)} />
            </label>
            <button className="button-primary mt-5 w-full" type="submit" disabled={Number(amount) <= 0}>Continue <ArrowRight aria-hidden="true" size={21} /></button>
            <button className="mt-6 min-h-12 w-full text-left text-sm font-bold text-[var(--primary)] underline decoration-2 underline-offset-4" type="button" onClick={() => setShowInterrupt(true)}>Is someone on a call telling you to pay right now?</button>
          </form>
        ) : null}

        {step === 1 ? (
          <div>
            <p className="eyebrow">Question 2 of 4</p>
            <h1 id="golden-hour-heading" className="mt-2 text-3xl leading-tight sm:text-4xl">When did it happen?</h1>
            <p className="mt-3 text-[var(--muted)]">Choose the closest answer.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {whenChoices.map((choice) => <button className="min-h-16 border-2 border-[var(--primary)] bg-white px-4 text-left text-xl font-black hover:bg-[var(--blue-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus)]" type="button" key={choice.id} onClick={() => chooseWhen(choice)}>{choice.label}</button>)}
            </div>
            <BackButton onClick={() => setStep(0)} />
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <p className="eyebrow">Question 3 of 4</p>
            <h1 id="golden-hour-heading" className="mt-2 text-3xl leading-tight sm:text-4xl">How did the money move?</h1>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {paymentMethods.map((method) => <button className="min-h-16 border-2 border-[var(--primary)] bg-white px-4 text-left text-xl font-black hover:bg-[var(--blue-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus)]" type="button" key={method} onClick={() => choosePayment(method)}>{method}</button>)}
            </div>
            <BackButton onClick={() => setStep(1)} />
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <p className="eyebrow">Question 4 of 4</p>
            <h1 id="golden-hour-heading" className="mt-2 text-3xl leading-tight sm:text-4xl">Which bank or app?</h1>
            <label className="relative mt-6 block">
              <span className="sr-only">Search banks and payment apps</span>
              <Search aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={24} />
              <input className="min-h-16 w-full border-2 border-[var(--primary)] bg-white py-3 pl-12 pr-4 text-lg font-bold outline-none focus:ring-4 focus:ring-[var(--focus)]" type="search" autoFocus placeholder="Search bank or app" value={bankSearch} onChange={(event) => setBankSearch(event.target.value)} />
            </label>
            <div className="mt-3 max-h-72 overflow-y-auto border border-[var(--border)]" role="listbox" aria-label="Banks and apps">
              {filteredBanks.length ? filteredBanks.map((bank) => (
                <button className={`flex min-h-16 w-full items-center justify-between gap-3 border-b border-[var(--border)] px-4 text-left last:border-b-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--focus)] ${bankId === bank.id ? "bg-[var(--blue-soft)]" : "bg-white hover:bg-[var(--surface-muted)]"}`} role="option" aria-selected={bankId === bank.id} type="button" key={bank.id} onClick={() => setBankId(bank.id)}>
                  <span><strong className="block">{bank.name}</strong><span className="mt-1 block text-sm text-[var(--muted)]">{bank.upiApps.join(" · ")}</span></span>
                  {bankId === bank.id ? <CheckCircle2 aria-hidden="true" className="shrink-0 text-[#08745c]" /> : null}
                </button>
              )) : <p className="m-0 p-4 text-[var(--muted)]">No match. Try the bank name or payment app.</p>}
            </div>
            <button className="button-primary mt-5 w-full" type="button" disabled={!bankId} onClick={submitHold}><BanknoteArrowDown aria-hidden="true" size={22} /> Send mock hold request</button>
            <BackButton onClick={() => setStep(2)} />
          </div>
        ) : null}
      </div>
      <p className="mt-4 text-center text-sm text-[var(--muted)]">No login. No ID upload. No category selection.</p>
    </section>
  );
}

function ElapsedClock({ seconds }: { seconds: number }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 border-2 border-[var(--primary)] bg-white p-3">
      <span className="flex items-center gap-2 text-sm font-bold"><Clock3 aria-hidden="true" size={20} /> Time since this screen opened</span>
      <strong className="font-mono text-xl">{formatGoldenHourDuration(seconds)}</strong>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return <button className="mt-5 inline-flex min-h-12 items-center gap-2 px-1 font-bold text-[var(--primary)] underline decoration-2 underline-offset-4" type="button" onClick={onClick}><ArrowLeft aria-hidden="true" size={20} /> Back</button>;
}

function ActionItem({ number, icon, title, detail }: { number: number; icon: React.ReactNode; title: string; detail: string }) {
  return (
    <li className="grid grid-cols-[2.5rem_1fr] gap-3 border-2 border-[var(--border)] bg-white p-3">
      <span className="grid size-10 place-items-center bg-[var(--primary)] text-white" aria-label={`Step ${number}`}>{icon}</span>
      <div><strong className="block text-lg">{title}</strong><p className="m-0 mt-1 text-sm leading-6 text-[var(--muted)]">{detail}</p></div>
    </li>
  );
}
