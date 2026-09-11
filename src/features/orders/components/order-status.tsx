import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types/domain';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pagamento pendente',
  confirmed: 'Pagamento confirmado',
  rejected: 'Pagamento recusado',
};

export function OrderStatus({ status }: { status: OrderStatus }) {
  return (
    <p
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-1 text-xs font-bold uppercase tracking-wide',
        status === 'pending' && 'border-kurio-line text-kurio-tan',
        status === 'confirmed' && 'border-kurio-mint bg-kurio-mint/10 text-kurio-mint',
        status === 'rejected' && 'border-kurio-accent bg-kurio-accent/10 text-kurio-accent',
      )}
    >
      {STATUS_LABELS[status]}
    </p>
  );
}