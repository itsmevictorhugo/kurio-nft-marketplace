export function CartSkeleton() {
  return (
    <div data-testid="cart-skeleton" className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 md:px-6 md:pt-8">
      <div className="shimmer h-8 w-48 rounded-md" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
        <ul className="space-y-4" aria-hidden="true">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index} className="flex items-center gap-4 rounded-md border border-kurio-line/60 p-4">
              <div className="shimmer h-20 w-20 shrink-0 rounded-md" />
              <div className="flex-1 space-y-3">
                <div className="shimmer h-4 w-40 rounded-md" />
                <div className="shimmer h-3 w-24 rounded-md" />
                <div className="shimmer h-3 w-16 rounded-md" />
              </div>
              <div className="shimmer h-10 w-28 rounded-md" />
            </li>
          ))}
        </ul>
        <div className="space-y-3 rounded-md border border-kurio-line/60 p-5" aria-hidden="true">
          <div className="shimmer h-4 w-32 rounded-md" />
          <div className="shimmer h-4 w-full rounded-md" />
          <div className="shimmer h-4 w-3/4 rounded-md" />
          <div className="shimmer h-4 w-2/3 rounded-md" />
          <div className="shimmer h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}