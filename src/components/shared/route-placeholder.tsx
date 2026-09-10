interface RoutePlaceholderProps {
  title: string;
}

export function RoutePlaceholder({ title }: RoutePlaceholderProps) {
  return (
    <section aria-labelledby="page-title" className="space-y-2">
      <h1 id="page-title" className="text-3xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="max-w-prose text-slate-300">
        This route is ready for its feature implementation.
      </p>
    </section>
  );
}
