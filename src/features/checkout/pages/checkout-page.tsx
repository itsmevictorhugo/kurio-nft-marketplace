import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '@/components/shared/icons';
import { getSessionToken, clearSessionToken } from '@/features/auth/session';
import { useSession } from '@/features/auth/hooks/use-session';
import { getAppliedCoupon, clearAppliedCoupon } from '@/features/cart/applied-coupon';
import { useCart, useCartItemDetails, describeCartItem } from '@/features/cart/hooks/use-cart';
import { useQuote } from '@/features/cart/hooks/use-quote';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useWallets } from '@/features/wallets/hooks/use-wallets';
import { getRequestIdentity } from '@/features/cart/identity';
import { CollectorData } from '@/features/checkout/components/collector-data';
import { WalletForm, type ConnectState } from '@/features/checkout/components/wallet-form';
import { CheckoutReview } from '@/features/checkout/components/checkout-review';
import { CheckoutSkeleton } from '@/features/checkout/components/checkout-skeleton';
import {
  CheckoutAttempt,
  buildIdempotencyKey,
  clearCheckoutAttempt,
  createAttemptId,
  quoteTotals,
  readCheckoutAttempt,
  totalsMatch,
  writeCheckoutAttempt,
} from '@/features/checkout/checkout-attempt';
import {
  useCreateOrder,
  isOrderTimeout,
  isOrderSessionError,
  orderConflictKind,
} from '@/features/checkout/hooks/use-create-order';
import type { Order } from '@/types/domain';

const derivedValuesMessage = 'Os valores foram atualizados. Revise e confirme novamente.';

export function CheckoutPage() {
  const token = useMemo(getSessionToken, []);
  const identity = getRequestIdentity();
  const navigate = useNavigate();

  const sessionQuery = useSession();
  const profileQuery = useProfile(token);
  const walletsQuery = useWallets(identity);
  const cartQuery = useCart();
  const items = cartQuery.data?.items ?? [];
  const nftsById = useCartItemDetails(items.length ? items : undefined);

  const [couponCode, setCouponCode] = useState(getAppliedCoupon);
  const quoteQuery = useQuote(couponCode);

  const [attempt, setAttempt] = useState<CheckoutAttempt | null>(() =>
    token ? readCheckoutAttempt(token) : null,
  );
  const [needsRenewal, setNeedsRenewal] = useState(false);
  const [orderBanner, setOrderBanner] = useState<string | null>(null);

  const [selectedWalletId, setSelectedWalletId] = useState<string | undefined>();
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'polygon' | undefined>();
  const [connection, setConnection] = useState<ConnectState>('none');

  const createOrder = useCreateOrder(token ?? '');
  const [attempting, setAttempting] = useState(false);

  // Initialise a checkout attempt when the first quote arrives.
  useEffect(() => {
    if (!token || attempt || !quoteQuery.data) {
      return;
    }
    const initial: CheckoutAttempt = {
      attemptId: createAttemptId(),
      quoteId: quoteQuery.data.id,
      couponCode: couponCode?.toUpperCase(),
      totals: quoteTotals(quoteQuery.data),
    };
    setAttempt(initial);
    writeCheckoutAttempt(token, initial);
  }, [token, attempt, quoteQuery.data, couponCode]);

  // Wallet/network changes reset the simulated connection.
  useEffect(() => {
    setConnection('none');
  }, [selectedWalletId, selectedNetwork]);

  // Session expiry on any authenticated query: redirect to login.
  useEffect(() => {
    if (
      isOrderSessionError(sessionQuery.error) ||
      isOrderSessionError(profileQuery.error) ||
      isOrderSessionError(walletsQuery.error)
    ) {
      clearSessionToken();
      void navigate({ to: '/login', search: { redirect: '/checkout' } });
    }
  }, [sessionQuery.error, profileQuery.error, walletsQuery.error, navigate]);

  const handleOrderError = useCallback(
    (error: unknown) => {
      if (isOrderSessionError(error)) {
        clearSessionToken();
        void navigate({ to: '/login', search: { redirect: '/checkout' } });
        return;
      }
      const kind = orderConflictKind(error);
      if (kind === 'stale') {
        setNeedsRenewal(true);
        setOrderBanner('Os valores foram atualizados. Revise e confirme novamente.');
      } else if (kind === 'availability') {
        setNeedsRenewal(true);
        setOrderBanner(
          'Um item não está mais disponível na quantidade escolhida. Revise o carrinho e confirme novamente.',
        );
      } else if (kind === 'coupon') {
        clearAppliedCoupon();
        setCouponCode(undefined);
        setNeedsRenewal(true);
        setOrderBanner('O cupom não é mais válido e foi removido. Revise e confirme novamente.');
      } else {
        setOrderBanner('Não foi possível confirmar o pedido. Tente novamente.');
      }
    },
    [navigate],
  );

  const confirmCheckout = useCallback(async () => {
    if (!token || attempting) {
      return;
    }
    setAttempting(true);
    setOrderBanner(null);

    try {
      const freshResult = await quoteQuery.refetch();
      if (freshResult.error) {
        if (isOrderSessionError(freshResult.error)) {
          clearSessionToken();
          void navigate({ to: '/login', search: { redirect: '/checkout' } });
          return;
        }
        const kind = orderConflictKind(freshResult.error);
        setNeedsRenewal(kind === 'availability');
        setOrderBanner(
          kind === 'availability'
            ? 'Um item não está mais disponível na quantidade escolhida. Revise o carrinho e confirme novamente.'
            : 'Não foi possível confirmar o pedido. Tente novamente.',
        );
        return;
      }

      const fresh = freshResult.data;
      if (!fresh) {
        setOrderBanner('Não foi possível confirmar o pedido. Tente novamente.');
        return;
      }

      const freshCoupon = couponCode?.toUpperCase();

      let current: CheckoutAttempt = attempt ?? {
        attemptId: createAttemptId(),
        quoteId: fresh.id,
        couponCode: freshCoupon,
        totals: quoteTotals(fresh),
      };

      if (!attempt) {
        setAttempt(current);
        writeCheckoutAttempt(token, current);
      }

      const freshTotals = quoteTotals(fresh);
      const mismatch =
        !totalsMatch(freshTotals, current.totals) || (freshCoupon ?? null) !== (current.couponCode ?? null);

      if (mismatch) {
        const rotated: CheckoutAttempt = {
          attemptId: createAttemptId(),
          quoteId: fresh.id,
          couponCode: freshCoupon,
          totals: freshTotals,
        };
        setAttempt(rotated);
        writeCheckoutAttempt(token, rotated);
        setNeedsRenewal(true);
        return;
      }

      // Adopt the latest quote id so the server can look it up, while keeping
      // the attempt id stable so the idempotency key doesn't change.
      if (fresh.id !== current.quoteId) {
        const aligned = { ...current, quoteId: fresh.id };
        setAttempt(aligned);
        writeCheckoutAttempt(token, aligned);
        current = aligned;
      }

      const idempotencyKey = buildIdempotencyKey(current.attemptId);

      let created: { order: Order } | undefined;
      try {
        created = await createOrder.mutateAsync({ quoteId: current.quoteId, idempotencyKey });
      } catch (error) {
        if (isOrderTimeout(error)) {
          try {
            created = await createOrder.mutateAsync({ quoteId: current.quoteId, idempotencyKey });
          } catch (retryError) {
            handleOrderError(retryError);
            return;
          }
        } else {
          handleOrderError(error);
          return;
        }
      }

      clearCheckoutAttempt(token);
      setNeedsRenewal(false);
      void navigate({ to: '/order/$orderId', params: { orderId: created?.order.id ?? '' } });
    } finally {
      setAttempting(false);
    }
  }, [token, attempting, quoteQuery, couponCode, attempt, createOrder, navigate, handleOrderError]);

  const lines = useMemo(() => {
    if (!quoteQuery.data) {
      return [];
    }
    return quoteQuery.data.items.map((quoteItem) => {
      const display = describeCartItem(
        { id: quoteItem.cartItemId, nftId: quoteItem.nftId, editionId: quoteItem.editionId, quantity: quoteItem.quantity },
        nftsById,
      );
      return {
        nftId: quoteItem.nftId,
        name: display.nft?.name ?? 'NFT',
        editionName: display.editionName,
        quantity: quoteItem.quantity,
        unitPrice: display.unitPrice,
        lineTotal: quoteItem.total,
      };
    });
  }, [quoteQuery.data, nftsById]);

  const liveTotals = quoteQuery.data ? quoteTotals(quoteQuery.data) : undefined;
  const attemptMismatch =
    attempt && liveTotals
      ? !totalsMatch(attempt.totals, liveTotals) || (attempt.couponCode ?? null) !== (couponCode?.toUpperCase() ?? null)
      : false;
  const valuesChanged = needsRenewal || attemptMismatch;

  const selectedWallet = walletsQuery.data?.find((wallet) => wallet.id === selectedWalletId);
  const networkMismatch = Boolean(selectedWallet && selectedNetwork && selectedWallet.network !== selectedNetwork);
  const isConnected = connection === 'connected' && !networkMismatch;
  const hasQuote = Boolean(quoteQuery.data && quoteQuery.data.items.length > 0);
  const canConfirm = isConnected && hasQuote && !attempting;
  const confirmLabel = valuesChanged ? 'Revisar valores e confirmar' : 'Confirmar compra';

  const handleConnectConfirmed = useCallback(() => {
    setConnection('connecting');
    setTimeout(() => setConnection('connected'), 600);
  }, []);

  if (sessionQuery.isPending || profileQuery.isPending || walletsQuery.isPending || cartQuery.isPending) {
    return <CheckoutSkeleton />;
  }

  if (cartQuery.isError) {
    return (
      <div
        role="alert"
        className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-4 px-4 py-24 text-center md:px-6"
      >
        <h1 className="font-display text-2xl font-bold text-kurio-cream">
          Não foi possível carregar o checkout.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-kurio-tan">
          Ocorreu uma falha inesperada ao acessar seu carrinho. Tente novamente em instantes.
        </p>
        <Button onClick={() => void cartQuery.refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-4 px-4 py-24 text-center md:px-6">
        <h1 className="font-display text-2xl font-bold text-kurio-cream">Seu carrinho está vazio</h1>
        <p className="max-w-md text-sm leading-relaxed text-kurio-tan">
          Explore o catálogo antes de finalizar a compra.
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
      <h1 className="font-display text-2xl font-bold text-kurio-cream md:text-3xl">Finalizar compra</h1>
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
        <div className="space-y-6">
          <CollectorData
            displayName={profileQuery.data?.displayName ?? sessionQuery.data?.user.displayName}
            email={sessionQuery.data?.user.email}
          />
          <WalletForm
            wallets={walletsQuery.data}
            selectedWalletId={selectedWalletId}
            onSelectWallet={setSelectedWalletId}
            selectedNetwork={selectedNetwork}
            onSelectNetwork={setSelectedNetwork}
            connection={connection}
            onConnectConfirmed={handleConnectConfirmed}
            onConnectRefused={() => setConnection('refused')}
            onDisconnect={() => setConnection('none')}
          />
          {profileQuery.isError || walletsQuery.isError ? (
            <p role="alert" className="text-sm font-bold text-kurio-accent">
              Alguns dados não foram carregados. Tente novamente mais tarde.
            </p>
          ) : null}
        </div>
        <CheckoutReview
          lines={lines}
          quote={quoteQuery.data}
          couponCode={couponCode}
          statusMessage={orderBanner ?? (valuesChanged ? derivedValuesMessage : null)}
          submitting={attempting}
          canConfirm={canConfirm}
          confirmLabel={confirmLabel}
          onConfirm={() => void confirmCheckout()}
          onBackToCart={() => void navigate({ to: '/cart' })}
        />
      </div>
    </div>
  );
}