export function Metric({ value, label, detail }: { value: string; label: string; detail?: string }) {
  return (
    <div className="border-t-4 border-[#0b2b4c] bg-white p-4">
      <strong className="block text-3xl tracking-[-0.04em] text-[#0b2b4c]">{value}</strong>
      <span className="mt-1 block font-black">{label}</span>
      {detail ? <span className="mt-1 block text-sm leading-5 text-[#52606d]">{detail}</span> : null}
    </div>
  );
}
