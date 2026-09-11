import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { TrashIcon } from '@/components/shared/icons';
import { QuantityStepper } from '@/features/nft/components/quantity-stepper';

export interface CartItemRowProps {
  nftId: string;
  imageUrl: string | undefined;
  name: string;
  editionName: string;
  unitPrice: string;
  lineTotal: string | undefined;
  itemId: string;
  quantity: number;
  maxQuantity: number;
  pending: boolean;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function CartItemRow({
  nftId,
  imageUrl,
  name,
  editionName,
  unitPrice,
  lineTotal,
  itemId,
  quantity,
  maxQuantity,
  pending,
  onQuantityChange,
  onRemove,
}: CartItemRowProps) {
  const unavailable = maxQuantity === 0;
  const stepperMax = Math.max(1, maxQuantity);

  return (
    <li className="rounded-md border border-kurio-line/60 bg-kurio-surface p-4">
      <div className="flex items-start gap-4">
        <Link
          to="/nfts/$nftId"
          params={{ nftId }}
          className="shrink-0 overflow-hidden rounded-md outline-none focus-visible:ring-2 focus-visible:ring-kurio-accent"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Arte de ${name}`}
              className="aspect-square h-20 w-20 object-cover"
              loading="lazy"
            />
          ) : (
            <span className="block aspect-square h-20 w-20 bg-kurio-raised" aria-hidden="true" />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to="/nfts/$nftId"
                params={{ nftId }}
                className="block truncate font-display text-sm font-bold text-kurio-cream outline-none transition-colors hover:text-kurio-accent focus-visible:ring-2 focus-visible:ring-kurio-accent"
              >
                {name}
              </Link>
              <p className="mt-1 text-xs text-kurio-tan">Edição {editionName}</p>
              <p className="mt-1 text-xs text-kurio-tan">
                Preço unitário: <span className="text-kurio-cream">{unitPrice} ETH</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remover ${name} do carrinho`}
              disabled={pending}
              onClick={() => onRemove(itemId)}
              className="text-kurio-tan hover:text-kurio-accent"
            >
              <TrashIcon width={16} height={16} />
            </Button>
          </div>

          {unavailable ? (
            <p className="mt-3 text-xs font-bold text-kurio-accent">Edição indisponível no momento.</p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
            <QuantityStepper
              value={quantity}
              min={1}
              max={stepperMax}
              disabled={pending || unavailable}
              onChange={(next) => onQuantityChange(itemId, next)}
            />
            <div className="ml-auto text-right">
              <p className="text-xs text-kurio-tan">Total da linha</p>
              <p className="font-display text-base font-bold text-kurio-accent">
                {lineTotal !== undefined ? `${lineTotal} ETH` : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}