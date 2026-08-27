# Reclaim — citizen cybercrime recovery prototype

An independent Build What Moves India hackathon prototype that separates urgent payment-response from the slower work of building a cybercrime complaint.

## Stack

- Next.js App Router, TypeScript, and Tailwind CSS
- Typed mock fixtures under `src/lib/mock/`
- Deterministic local classifier/extractor in `src/lib/engine.ts`
- Browser `localStorage` for resumable demo state
- No database and zero runtime network calls

## Run

```bash
npm install
npm run dev
```

The public demo is mock-only and is not affiliated with I4C or MHA.
