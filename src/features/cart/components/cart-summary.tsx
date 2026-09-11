import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { TicketIcon } from '@/components/shared/icons';
import { useQuote } from '@/features/cart/hooks/use-quote';

type QuoteQuery = ReturnType<typeof useQuote>;

interface CartSummaryProps {
  quote: QuoteQuery;
  couponCode: string | undefined;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
  onCheckout: () => void;
  onClear: () => void;
  clearing: boolean;
}

function couponErrorMessage(error: unknown) {
  if (isAxiosError<{ error?: { code?: string } }>(error)) {
    const code = error.response?.data?.error?.code;
    if (code === 'coupon_invalid') return 'Esse cupom não é válido.';
    if (code === 'coupon_expired') return 'Esse cupom expirou.';
  }
  return 'Não foi possível validar esse cupom.';
}

export function CartSummary({
  quote,
  couponCode,
  onApplyCoupon,
  onRemoveCoupon,
  onCheckout,
  onClear,
  clearing,
}: CartSummaryProps) {
  const [draft, setDraft] = useState('');
  const [feedback, setFeedback] = useState<{ status: 'applied' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!couponCode) {
      return;
    }
    if (quote.isFetching) {
      return;
    }
    if (quote.isError) {
      setFeedback({ status: 'error', message: couponErrorMessage(quote.error) });
      onRemoveCoupon();
      return;
    }
    if (quote.data?.couponCode === couponCode) {
      setFeedback({ status: 'applied', message: `Cupom ${couponCode} aplicado.` });
    }
  }, [couponCode, quote.isFetching, quote.isError, quote.error, quote.data, onRemoveCoupon]);

  const apply = () => {
    const code = draft.trim().toUpperCase();
    if (!code || code === couponCode) return;
    setFeedback(null);
    onApplyCoupon(code);
    setDraft('');
  };

  const removeCoupon = () => {
    setFeedback(null);
    onRemoveCoupon();
    setDraft('');
  };

  const hasItems = quote.data?.items.length !== undefined && quote.data.items.length > 0;
  const quoteReady = Boolean(quote.data && hasItems);
  const quoteBlocked = Boolean(couponCode && quote.isError);

  const discount = quote.data?.discount;

  return (
    <section
      aria-label="Resumo da compra"
      className="rounded-md border border-kurio-line/60 bg-kurio-surface p-5"
    >
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-kurio-cream">
        Resumo da compra
      </h2>

      {!quoteReady ? (
        <p className="mt-4 text-sm text-kurio-tan" aria-live="polite">
          Calculando valores...
        </p>
      ) : null}

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-kurio-tan">Subtotal</dt>
          <dd className="font-display text-kurio-cream">{quote.data ? `${quote.data.subtotal} ETH` : '—'}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-kurio-tan">Desconto</dt>
          <dd className="font-display text-kurio-cream">
            {discount === undefined ? '—' : discount === '0' ? `${discount} ETH` : `-${discount} ETH`}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-kurio-tan">Taxa de rede</dt>
          <dd className="font-display text-kurio-cream">{quote.data ? `${quote.data.networkFee} ETH` : '—'}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-kurio-line/60 pt-3">
          <dt className="font-display font-bold text-kurio-cream">Total</dt>
          <dd className="font-display text-lg font-bold text-kurio-accent">
            {quote.data ? `${quote.data.total} ETH` : '—'}
          </dd>
        </div>
      </dl>

      <div className="mt-5">
        <div className="flex items-center gap-2">
          <TicketIcon width={16} height={16} className="shrink-0 text-kurio-tan" />
          <label htmlFor="coupon-input" className="text-xs font-bold uppercase tracking-wide text-kurio-cream">
            Cupom de desconto
          </label>
        </div>
        <div className="mt-2 flex gap-2">
          <input
            id="coupon-input"
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') apply();
            }}
            placeholder="Ex.: KURIO10"
            className="h-10 min-w-0 flex-1 rounded-md border border-kurio-line bg-kurio-night px-3 font-display text-sm text-kurio-cream placeholder:text-kurio-tan/60 outline-none focus-visible:ring-2 focus-visible:ring-kurio-accent"
          />
          <Button onClick={apply} disabled={!draft.trim()} className="shrink-0">
            Aplicar
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p aria-live="polite" className="min-h-5 text-xs">
            {!feedback && (couponCode || quote.isFetching) ? (
              <span className="text-kurio-tan">Validando cupom...</span>
            ) : null}
            {feedback?.status === 'applied' ? (
              <span className="text-kurio-accent">{feedback.message}</span>
            ) : null}
            {feedback?.status === 'error' ? (
              <span role="alert" className="font-bold text-kurio-accent">
                {feedback.message}
              </span>
            ) : null}
            {!feedback && !couponCode && !quote.isFetching ? (
              <span className="text-kurio-tan">Nenhum cupom aplicado.</span>
            ) : null}
          </p>
          {couponCode || feedback?.status === 'applied' ? (
            <Button variant="ghost" size="sm" onClick={removeCoupon}>
              Remover cupom
            </Button>
          ) : null}
        </div>
      </div>

      <Button
        className="mt-5 w-full"
        disabled={!quoteReady || quoteBlocked || quote.isFetching}
        onClick={onCheckout}
      >
        Finalizar compra
      </Button>
      <Button variant="ghost" className="mt-2 w-full" disabled={clearing} onClick={onClear}>
        {clearing ? 'Limpando carrinho...' : 'Limpar carrinho'}
      </Button>
    </section>
  );
}