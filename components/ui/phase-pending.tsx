export function PhasePending({ title, phase, description }: { title: string; phase: string; description: string }) {
  return (
    <div className="max-w-2xl rounded-xl border border-dashed border-slate-300 bg-white p-8">
      <div className="mb-2 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
        {phase}
      </div>
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
    </div>
  );
}
