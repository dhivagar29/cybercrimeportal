<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reclaim — project context for all Codex sessions

## What this is

An independent hackathon proof-of-concept rethinking India's National Cyber
Crime Reporting Portal (cybercrime.gov.in / NCRP), judged purely as a CITIZEN
using it in a browser. Everything is mock. No real backend, no government
integration, and ZERO runtime network calls of any kind.

## Stack and commands

Next.js 16 App Router, React 19, TypeScript, Tailwind 4, zod, lucide-react.
Node >= 22. Verify with all three, in this order, and fix everything:
`npm run lint && npm run typecheck && npm run build`
(`build` is `next build --webpack`.) This Next.js version differs from
training data — check `node_modules/next/dist/docs/` before using an API you
are unsure about.

## Product thesis

Three tracks, one spine:

1. Money (Golden Hour + Build the Case) — stop the bleeding in under 90
   seconds, then build a complaint that can convert to an FIR, then track
   restoration. Headline stat: ₹7,647 cr frozen since 2021, only ₹167 cr
   returned.
2. Takedown — social-media harm: stop the spread and preserve evidence,
   with IT-Rules 2021 clocks (24h acknowledgement, 15-day action, 24h for
   intimate images).
3. Women & Children — safety-first reporting for survivors who may be using
   a device the person harming them can reach. This is the newest track.

## Architecture conventions — follow these exactly

- Domain logic: `src/lib/<track>.ts`. Const arrays `as const` become union
  types. Lookup tables are Records keyed by that union, named `<thing>Meta`.
- Shared track machinery lives in `src/lib/kernel/` — stages, SLA computation,
  storage keys, offset→ISO conversion, history events. Use it. Do NOT add a
  fourth parallel copy of stage/SLA logic.
- Mock data: `src/lib/mock/*.ts`. Fixtures store relative `*OffsetMinutes`;
  a `getLive*(now = Date.now())` converts them to ISO at render time so
  seeded cases are always fresh. Never hard-code absolute dates.
- Components: `src/components/*.tsx`, client components own localStorage.
- Routes: `src/app/**/page.tsx` stay thin wrappers over a component.
- localStorage keys: `reclaim:<thing>:v1`. Bump the version on shape change.
- Acknowledgement numbers: 14 digits starting with "2" (portal). Helpline
  1930 acknowledgements start with "3".
- Known debt: `caseStages` (`src/lib/mock/types.ts`) and `trustStages`
  (`src/lib/case-trust.ts`) are two vocabularies for the same money case. Do
  not extend this pattern; do not silently rename either.

## Hard rules

- No network calls at runtime, no LLM APIs. "AI" is the deterministic local
  engine in `src/lib/engine.ts` — keyword rules plus regex extractors plus
  canned scenarios. Never imply a live model is running.
- Every visible feature must work. If it cannot be finished, delete its UI.
  No dead buttons, no "coming soon".
- Citizen side only. No admin or police dashboards.
- Persistent banner on every page: "Independent hackathon prototype — not
  affiliated with I4C/MHA. All data is mock." No government emblems or
  official-looking seals.
- Design for a stressed person on a phone: large type, one decision per
  screen, plain words, high contrast, correct at 390px width.
- Language selector stays visibly disabled, labelled "Demo: English only".

## Safety rules for the Women & Children track (non-negotiable)

- NEVER build an image or video upload on this track. Evidence is described
  and linked, never uploaded. State this in the UI as a deliberate choice.
- Mock narratives on this track are brief, clinical, non-graphic, and
  written as a survivor would summarise. No sexual content. No description
  of acts against a minor. Nothing a screenshot could make lurid.
- Helpline numbers are reference information only — the prototype never
  dials or contacts anyone, and must say so. Use exactly these and invent no
  others: 1098 (Childline), 181 (Women Helpline), 112 (emergency), 1930
  (cyber financial fraud). If a number is needed that is not on this list,
  leave a clearly-labelled placeholder instead of guessing.
- Never present the prototype as a route to real help in a real emergency.
  Every support surface carries a one-line notice pointing to the real
  helplines.
