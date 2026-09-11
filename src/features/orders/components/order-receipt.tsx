import type { Order } from '@/types/domain';

function formatInstant(value: string) {
  return value.slice(0, 16).replace('T', ' ');
}

export function OrderReceipt({ order }: { order: Order }) {
  return (
    <section
      aria-label="Comprovante do pedido"
      className="rounded-md border border-kurio-line/60 bg-kurio-surface p-5"
    >
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-kurio-cream">
        Comprovante do pedido
      </h2>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold text-kurio-cream">Pedido:</dt>
          <dd className="text-kurio-tan">#{order.id}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold text-kurio-cream">Referência da transação:</dt>
          <dd className="break-all text-kurio-tan">{order.transactionReference}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold text-kurio-cream">Data:</dt>
          <dd className="text-kurio-tan">{formatInstant(order.createdAt)}</dd>
        </div>
      </dl>

      {order.items.length > 0 ? (
        <ul className="mt-5 space-y-3 border-t border-kurio-line/60 pt-4 text-sm" aria-label="Itens do pedido">
          {order.items.map((item) => (
            <li key={`${item.nftId}:${item.editionId}`} className="flex items-start justify-between gap-4">
              <span className="text-kurio-tan">
                <span className="font-bold text-kurio-cream">{item.name}</span>
                <span className="block text-xs text-kurio-tan">Qtd. {item.quantity}</span>
              </span>
              <span className="shrink-0 font-display text-kurio-cream">{item.total} ETH</span>
            </li>
          ))}
        </ul>
      ) : null}

      <dl className="mt-5 space-y-3 border-t border-kurio-line/60 pt-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-kurio-tan">Subtotal</dt>
          <dd className="font-display text-kurio-cream">{order.subtotal} ETH</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-kurio-tan">Desconto</dt>
          <dd className="font-display text-kurio-cream">
            {order.discount === '0' ? `${order.discount} ETH` : `-${order.discount} ETH`}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-kurio-tan">Taxa de rede</dt>
          <dd className="font-display text-kurio-cream">{order.networkFee} ETH</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-kurio-line/60 pt-3">
          <dt className="font-display font-bold text-kurio-cream">Total</dt>
          <dd className="font-display text-lg font-bold text-kurio-accent">{order.total} ETH</dd>
        </div>
      </dl>
    </section>
  );
}