import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';

export interface WalletConnectDialogProps {
  open: boolean;
  walletLabel: string;
  networkLabel: string;
  onConfirm: () => void;
  onRefuse: () => void;
  onClose: () => void;
}

function focusableElements(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  );
}

/**
 * Local simulated-wallet confirmation dialog. Wallet connectivity is part of
 * this challenge's mock surface only: the dialog communicates the simulation
 * and requires an explicit accept/refuse action, mirroring real wallet
 * approval dialogs without a real blockchain.
 */
export function WalletConnectDialog({
  open,
  walletLabel,
  networkLabel,
  onConfirm,
  onRefuse,
  onClose,
}: WalletConnectDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const initial = panelRef.current?.querySelector<HTMLElement>('button:not([disabled])');
    initial?.focus();
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) {
        return;
      }
      const focusables = focusableElements(panelRef.current);
      if (focusables.length === 0) {
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-kurio-night/80"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-dialog-title"
        aria-describedby="wallet-dialog-description"
        className="relative w-full max-w-sm rounded-md border border-kurio-line bg-kurio-surface p-6 shadow-lg shadow-black/50 outline-none"
      >
        <h2 id="wallet-dialog-title" className="font-display text-lg font-bold text-kurio-cream">
          Conectar carteira
        </h2>
        <p id="wallet-dialog-description" className="mt-3 text-sm leading-relaxed text-kurio-tan">
          Esta é uma simulação local de carteira. Autorize o uso de{' '}
          <span className="font-bold text-kurio-cream">{walletLabel}</span> na rede{' '}
          <span className="font-bold text-kurio-cream">{networkLabel}</span> para continuar.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onRefuse}>
            Recusar
          </Button>
          <Button onClick={onConfirm}>
            Conectar
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}