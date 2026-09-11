interface CollectorDataProps {
  displayName: string | undefined;
  email: string | undefined;
}

export function CollectorData({ displayName, email }: CollectorDataProps) {
  return (
    <section
      aria-label="Dados do colecionador"
      className="rounded-md border border-kurio-line/60 bg-kurio-surface p-5"
    >
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-kurio-cream">
        Comprador
      </h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold text-kurio-cream">Colecionador:</dt>
          <dd className="text-kurio-tan">{displayName}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold text-kurio-cream">Email:</dt>
          <dd className="truncate text-kurio-tan">{email}</dd>
        </div>
      </dl>
    </section>
  );
}