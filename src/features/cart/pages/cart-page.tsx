import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '@/components/shared/icons';
import { useCart, useCartItemDetails, describeCartItem } from '@/features/cart/hooks/use-cart';
import { useQuote } from '@/features/cart/hooks/use-quote';
import {
  useClearCart,
  useRemoveCartItem,
  useUpdateCartItemQuantity,
} from '@/features/cart/hooks/use-cart-mutations';
import { CartItemRow } from '@/features/cart/components/cart-item';
import { CartSkeleton } from '@/features/cart/components/cart-skeleton';
import { CartSummary } from '@/features/cart/components/cart-summary';

export function CartPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const items = cart.data?.items ?? [];
  const nftsById = useCartItemDetails(items.length ? items : undefined);

  const [couponCode, setCouponCode] = useState<string | undefined>();
  const applyCoupon = useCallback((code: string) => setCouponCode(code), []);
  const removeCoupon = useCallback(() => setCouponCode(undefined), []);
  const quote = useQuote(couponCode);
  const lineTotalsById = useMemo(
    () => new Map((quote.data?.items ?? []).map((item) => [item.cartItemId, item.total])),
    [quote.data],
  );

  const updateQuantity = useUpdateCartItemQuantity();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();

  const [pendingItems, setPendingItems] = useState<Set<string>>(new Set());
  const [removingId, setRemovingId] = useState<string | null>(null);

  const changeQuantity = (itemId: string, quantity: number) => {
    setPendingItems((previous) => new Set(previous).add(itemId));
    updateQuantity.mutate(
      { itemId, quantity },
      {
        onSettled: () => {
          setPendingItems((previous) => {
            const next = new Set(previous);
            next.delete(itemId);
            return next;
          });
        },
      },
    );
  };

  const remove = (itemId: string) => {
    setRemovingId(itemId);
    removeItem.mutate(itemId, {
      onSettled: () => setRemovingId(null),
    });
  };

  const availabilityConflict = isAxiosError(updateQuantity.error) && updateQuantity.error.response?.status === 409;
  const mutationFailed = Boolean(updateQuantity.error || removeItem.error || clearCart.error);

  if (cart.isLoading) {
    return <CartSkeleton />;
  }

  if (cart.isError) {
    return (
      <div
        role="alert"
        className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-4 px-4 py-24 text-center md:px-6"
      >
        <h1 className="font-display text-2xl font-bold text-kurio-cream">
          Não foi possível carregar o carrinho.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-kurio-tan">
          Ocorreu uma falha inesperada. Tente novamente em instantes.
        </p>
        <Button onClick={() => void cart.refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-4 px-4 py-24 text-center md:px-6">
        <h1 className="font-display text-2xl font-bold text-kurio-cream">Seu carrinho está vazio</h1>
        <p className="max-w-md text-sm leading-relaxed text-kurio-tan">
          Ainda não há NFTs no seu carrinho. Explore o catálogo e adicione obras que você queira colecionar.
        </p>
        <Button onClick={() => void navigate({ to: '/' })}>
          Explorar NFTs
          <ArrowRightIcon width={16} height={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 md:px-6 md:pt-8">
      <h1 className="font-display text-2xl font-bold text-kurio-cream md:text-3xl">Carrinho de NFTs</h1>
      <p aria-live="polite" className="mt-2 min-h-5 text-sm" role="status">
        {availabilityConflict ? (
          <span className="font-bold text-kurio-accent">
            Estoque insuficiente: ajustamos os itens conforme a disponibilidade.
          </span>
        ) : null}
        {mutationFailed ? (
          <span className="font-bold text-kurio-accent">Não foi possível atualizar o carrinho. Tente novamente.</span>
        ) : null}
      </p>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
        <ul className="space-y-4" aria-label="Itens do carrinho">
          {items.map((item) => {
            const display = describeCartItem(item, nftsById);
            const edition = display.nft?.editions.find((candidate) => candidate.id === item.editionId);
            const maxQuantity = edition ? Math.min(edition.available, edition.maxPerOrder) : 0;
            return (
              <CartItemRow
                key={item.id}
                nftId={item.nftId}
                imageUrl={display.nft?.imageUrl}
                name={display.nft?.name ?? 'NFT indisponível'}
                editionName={display.editionName ?? 'indisponível'}
                unitPrice={display.unitPrice ?? '—'}
                lineTotal={lineTotalsById.get(item.id)}
                itemId={item.id}
                quantity={item.quantity}
                maxQuantity={maxQuantity}
                pending={pendingItems.has(item.id) || removingId === item.id}
                onQuantityChange={changeQuantity}
                onRemove={remove}
              />
            );
          })}
        </ul>

        <CartSummary
          quote={quote}
          couponCode={couponCode}
          onApplyCoupon={applyCoupon}
          onRemoveCoupon={removeCoupon}
          onCheckout={() => void navigate({ to: '/checkout' })}
          onClear={() => void clearCart.mutate()}
          clearing={clearCart.isPending}
        />
      </div>
    </div>
  );
}