import { cn } from '@/lib/utils';
import type { NftEdition } from '@/types/domain';

interface EditionSelectorProps {
  editions: NftEdition[];
  selectedId: string;
  onSelect: (editionId: string) => void;
}

function editionLabel(edition: NftEdition) {
  const soldOut = edition.available === 0;
  if (edition.total !== undefined && edition.editionNumber !== undefined) {
    return `${edition.editionNumber}/${edition.total}${soldOut ? ' · esgotada' : ''}`;
  }
  return `ABERTA${soldOut ? ' · esgotada' : ''}`;
}

function editionAriaLabel(edition: NftEdition) {
  const isOpen = edition.total === undefined || edition.editionNumber === undefined;
  const context = isOpen ? 'edição aberta' : `peça ${edition.editionNumber} de ${edition.total}`;
  const status =
    edition.available === 0
      ? 'esgotada'
      : `${edition.available} ${edition.available === 1 ? 'disponível' : 'disponíveis'}`;
  return `Edição ${edition.name}: ${context}, ${status}`;
}

export function EditionSelector({ editions, selectedId, onSelect }: EditionSelectorProps) {
  return (
    <div>
      <h2 className="font-display text-sm font-bold text-kurio-cream">Edição:</h2>
      <div role="group" aria-label="Edições disponíveis" className="mt-3 flex flex-wrap gap-2">
        {editions.map((edition) => {
          const isSelected = edition.id === selectedId;
          const soldOut = edition.available === 0;
          return (
            <button
              key={edition.id}
              type="button"
              aria-pressed={isSelected}
              aria-label={editionAriaLabel(edition)}
              disabled={soldOut}
              onClick={() => onSelect(edition.id)}
              className={cn(
                'rounded-full border px-4 py-1.5 font-display text-xs font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-kurio-accent',
                isSelected
                  ? 'border-kurio-accent bg-kurio-accent/10 text-kurio-accent'
                  : 'border-kurio-line bg-transparent text-kurio-tan hover:border-kurio-accent/60 hover:text-kurio-cream',
                soldOut && 'cursor-not-allowed line-through opacity-50',
              )}
            >
              {editionLabel(edition)}
            </button>
          );
        })}
      </div>
    </div>
  );
}