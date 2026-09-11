import { ArrowRightIcon } from '@/components/shared/icons';
import { Button } from '@/components/ui/button';
import type { Quote } from '@/types/domain';

export interface ReviewLine {
  nftId: string;
  name: string;
  editionName: string | undefined;
  quantity: number;
  unitPrice: string | undefined;
  lineTotal: string | undefined;
}

interface CheckoutReviewProps {
  lines: ReviewLine[];
  quote: Quote | undefined;
  couponCode: string | undefined;
  statusMessage: string | null;
  submitting: boolean;
  canConfirm: boolean;
  confirmLabel: string;
  onConfirm: () => void;
  onBackToCart: () => void;
}

export function CheckoutReview({
  lines,
  quote,
  couponCode,
  statusMessage,
  submitting,
  canConfirm,
  confirmLabel,
  onConfirm,
  onBackToCart,
}: CheckoutReviewProps) {
  const total = quote?.total;
  const discount = quote?.discount;

  return (
    <section
      aria-label="Revisão da compra"
      className="rounded-md border border-kurio-line/60 bg-kurio-surface p-5 lg:sticky lg:top-6"
    >
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-kurio-cream">
        Revisão da compra
      </h2>

      {!quote ? (
        <p className="mt-4 text-sm text-kurio-tan" aria-live="polite">
          Calculando valores...
        </p>
      ) : null}

      {lines.length > 0 ? (
        <ul className="mt-4 space-y-3 border-b border-kurio-line/60 pb-4" aria-label="Itens da compra">
          {lines.map((line) => (
            <li key={line.nftId} className="flex items-start justify-between gap-4 text-sm">
              <span className="text-kurio-tan">
                <span className="font-bold text-kurio-cream">{line.name}</span>
                {line.editionName ? (
                  <span className="block text-xs text-kurio-tan">{line.editionName} · Qtd. {line.quantity}</span>
                ) : null}
              </span>
              <span className="shrink-0 font-display text-kurio-cream">
                {line.lineTotal ? `${line.lineTotal} ETH` : '—'}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-kurio-tan">Subtotal</dt>
          <dd className="font-display text-kurio-cream">{quote ? `${quote.subtotal} ETH` : '—'}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-kurio-tan">Desconto</dt>
          <dd className="font-display text-kurio-cream">
            {discount === undefined ? '—' : discount === '0' ? `${discount} ETH` : `-${discount} ETH`}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-kurio-tan">Taxa de rede</dt>
          <dd className="font-display text-kurio-cream">{quote ? `${quote.networkFee} ETH` : '—'}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-kurio-line/60 pt-3">
          <dt className="font-display font-bold text-kurio-cream">Total</dt>
          <dd className="font-display text-lg font-bold text-kurio-accent">
            {total ? `${total} ETH` : '—'}
          </dd>
        </div>
        {couponCode ? (
          <p className="text-xs text-kurio-tan">Cupom aplicado: <span className="font-bold text-kurio-accent">{couponCode}</span></p>
        ) : null}
      </dl>

      <p aria-live="polite" role="status" className="mt-4 min-h-8 text-sm font-bold text-kurio-accent">
        {statusMessage}
      </p>

      <Button
        className="mt-2 w-full"
        disabled={!canConfirm}
        onClick={onConfirm}
      >
        {submitting ? 'Confirmando...' : confirmLabel}
        <ArrowRightIcon width={16} height={16} className="hidden md:block" />
      </Button>
      <Button variant="ghost" className="mt-2 w-full" onClick={onBackToCart}>
        Voltar ao carrinho
      </Button>
    </section>
  );
}