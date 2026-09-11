import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, CartIcon } from '@/components/shared/icons';
import { clearSessionToken, getSessionToken } from '@/features/auth/session';
import { useOrder } from '@/features/orders/hooks/use-order';
import { OrderReceipt } from '@/features/orders/components/order-receipt';
import { OrderSkeleton } from '@/features/orders/components/order-skeleton';
import { OrderStatus } from '@/features/orders/components/order-status';

function isOrderSessionExpired(error: unknown) {
  return isAxiosError(error) && error.response?.status === 401;
}

function isOrderNotFound(error: unknown) {
  return isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 403);
}

const STATUS_COPY: Record<'pending' | 'confirmed' | 'rejected', { heading: string; description: string }> = {
  pending: {
    heading: 'Aguardando confirmação do pagamento',
    description:
      'Sua compra foi registrada. O pagamento simulado está sendo processado e esta página atualiza sozinha até o resultado.',
  },
  confirmed: {
    heading: 'Pagamento confirmado!',
    description:
      'Os NFTs foram adicionados à sua coleção e os itens comprados foram removidos do seu carrinho.',
  },
  rejected: {
    heading: 'Pagamento não concluído',
    description:
      'A simulação recusou o pagamento. Seu carrinho continua com os itens e você pode tentar novamente.',
  },
};

export function OrderDetailPage() {
  const { orderId } = useParams({ from: '/order/$orderId' });
  const token = useMemo(getSessionToken, []);
  const navigate = useNavigate();
  const orderQuery = useOrder(orderId, token);

  useEffect(() => {
    if (orderQuery.isError && isOrderSessionExpired(orderQuery.error)) {
      clearSessionToken();
      void navigate({ to: '/login', search: { redirect: `/order/${orderId}` } });
    }
  }, [orderQuery.isError, orderQuery.error, orderId, navigate]);

  if (!token) {
    return null;
  }

  if (orderQuery.isPending) {
    return <OrderSkeleton />;
  }

  if (orderQuery.isError) {
    if (isOrderNotFound(orderQuery.error)) {
      return (
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-4 px-4 py-24 text-center md:px-6">
          <h1 className="font-display text-2xl font-bold text-kurio-cream">Pedido não encontrado</h1>
          <p className="max-w-md text-sm leading-relaxed text-kurio-tan">
            O pedido que você procura não existe ou não pertence a esta conta.
          </p>
          <Button onClick={() => void navigate({ to: '/' })}>
            Voltar ao catálogo
            <ArrowRightIcon width={16} height={16} />
          </Button>
        </div>
      );
    }

    return (
      <div
        role="alert"
        className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-4 px-4 py-24 text-center md:px-6"
      >
        <h1 className="font-display text-2xl font-bold text-kurio-cream">
          Não foi possível carregar o pedido.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-kurio-tan">
          Ocorreu uma falha inesperada. Tente novamente em instantes.
        </p>
        <Button onClick={() => void orderQuery.refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  const order = orderQuery.data;
  const copy = STATUS_COPY[order.status];

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-8 md:px-6 md:pt-10">
      <OrderStatus status={order.status} />
      <h1 className="mt-4 font-display text-2xl font-bold text-kurio-cream md:text-3xl">{copy.heading}</h1>
      <p className="mt-2 text-sm leading-relaxed text-kurio-tan">{copy.description}</p>

      <div className="mt-8">
        <OrderReceipt order={order} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {order.status === 'confirmed' ? (
          <Button onClick={() => void navigate({ to: '/' })}>
            Voltar ao catálogo
            <ArrowRightIcon width={16} height={16} />
          </Button>
        ) : null}
        {order.status === 'rejected' ? (
          <Button onClick={() => void navigate({ to: '/cart' })}>
            <CartIcon width={16} height={16} />
            Revisar carrinho e tentar novamente
          </Button>
        ) : null}
        {order.status === 'pending' ? (
          <Button variant="outline" onClick={() => void orderQuery.refetch()}>
            Atualizar status
          </Button>
        ) : null}
      </div>
    </div>
  );
}