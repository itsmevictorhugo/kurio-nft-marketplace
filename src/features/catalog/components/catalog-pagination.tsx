import { cn } from '@/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/shared/icons';

interface CatalogPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function pageWindow(page: number, totalPages: number) {
  const start = Math.max(1, Math.min(page - 1, totalPages - 2));
  const end = Math.min(totalPages, start + 2);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

const controlClass =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 font-display text-sm font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-kurio-accent disabled:pointer-events-none disabled:opacity-40';

export function CatalogPagination({ page, totalPages, onPageChange, className }: CatalogPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Paginação do catálogo" className={cn('flex items-center justify-end gap-2', className)}>
      <button
        type="button"
        className={cn(controlClass, 'text-kurio-tan hover:text-kurio-cream')}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeftIcon />
        <span className="sr-only">Página anterior</span>
      </button>

      {pageWindow(page, totalPages).map((candidate) => {
        const isCurrent = candidate === page;
        return (
          <button
            key={candidate}
            type="button"
            aria-current={isCurrent ? 'page' : undefined}
            aria-label={`Ir para a página ${candidate}`}
            onClick={() => onPageChange(candidate)}
            className={cn(
              controlClass,
              isCurrent
                ? 'bg-kurio-flame text-kurio-night'
                : 'bg-kurio-surface text-kurio-cream hover:bg-kurio-raised',
            )}
          >
            {candidate}
          </button>
        );
      })}

      <button
        type="button"
        className={cn(controlClass, 'text-kurio-tan hover:text-kurio-cream')}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        <ChevronRightIcon />
        <span className="sr-only">Próxima página</span>
      </button>
    </nav>
  );
}
