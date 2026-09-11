import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WalletConnectDialog } from '@/features/checkout/components/wallet-connect-dialog';
import { cn } from '@/lib/utils';
import type { Wallet } from '@/types/domain';

export type ConnectState = 'none' | 'connecting' | 'connected' | 'refused';

const NETWORK_LABELS = { ethereum: 'Ethereum', polygon: 'Polygon' } as const;

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

interface WalletFormProps {
  wallets: Wallet[] | undefined;
  selectedWalletId: string | undefined;
  onSelectWallet: (id: string) => void;
  selectedNetwork: 'ethereum' | 'polygon' | undefined;
  onSelectNetwork: (network: 'ethereum' | 'polygon') => void;
  connection: ConnectState;
  onConnectConfirmed: () => void;
  onConnectRefused: () => void;
  onDisconnect: () => void;
}

export function WalletForm({
  wallets,
  selectedWalletId,
  onSelectWallet,
  selectedNetwork,
  onSelectNetwork,
  connection,
  onConnectConfirmed,
  onConnectRefused,
  onDisconnect,
}: WalletFormProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const selectedWallet = wallets?.find((wallet) => wallet.id === selectedWalletId);
  const bothSelected = Boolean(selectedWallet && selectedNetwork);
  const networkMismatch = Boolean(selectedWallet && selectedNetwork && selectedWallet.network !== selectedNetwork);
  const canConnect = bothSelected && !networkMismatch && connection !== 'connecting';
  const isConnected = connection === 'connected';

  let statusMessage: string | undefined;
  if (!bothSelected) {
    statusMessage = 'Selecione uma rede e uma carteira para continuar.';
  } else if (networkMismatch) {
    statusMessage = `A carteira selecionada está na rede ${NETWORK_LABELS[selectedWallet!.network]}. Selecione uma carteira na rede ${NETWORK_LABELS[selectedNetwork!]} para continuar.`;
  } else if (connection === 'refused') {
    statusMessage = 'Conexão recusada pela simulação. Tente novamente ou escolha outra carteira.';
  } else if (connection === 'connecting') {
    statusMessage = 'Conectando...';
  }

  return (
    <section
      aria-label="Carteira e rede"
      className="rounded-md border border-kurio-line/60 bg-kurio-surface p-5"
    >
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-kurio-cream">
        Pagamento
      </h2>

      <fieldset className="mt-5">
        <legend className="text-xs font-bold uppercase tracking-wide text-kurio-cream">Rede</legend>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Rede">
          {(Object.keys(NETWORK_LABELS) as Array<keyof typeof NETWORK_LABELS>).map((network) => {
            const checked = selectedNetwork === network;
            return (
              <label
                key={network}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md border border-kurio-line px-3 py-2 font-display text-sm text-kurio-cream outline-none transition-colors focus-within:ring-2 focus-within:ring-kurio-accent',
                  checked && 'border-kurio-accent text-kurio-accent',
                )}
              >
                <input
                  type="radio"
                  name="checkout-network"
                  value={network}
                  checked={checked}
                  onChange={() => onSelectNetwork(network)}
                  className="sr-only"
                />
                {NETWORK_LABELS[network]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-xs font-bold uppercase tracking-wide text-kurio-cream">Carteira</legend>
        {!wallets || wallets.length === 0 ? (
          <p className="mt-2 text-sm text-kurio-tan">Nenhuma carteira registrada para esta conta.</p>
        ) : (
          <div className="mt-2 space-y-2" role="radiogroup" aria-label="Carteira">
            {wallets.map((wallet) => {
              const checked = selectedWalletId === wallet.id;
              return (
                <label
                  key={wallet.id}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 rounded-md border border-kurio-line px-3 py-2.5 outline-none transition-colors focus-within:ring-2 focus-within:ring-kurio-accent',
                    checked && 'border-kurio-accent',
                  )}
                >
                  <input
                    type="radio"
                    name="checkout-wallet"
                    value={wallet.id}
                    checked={checked}
                    onChange={() => onSelectWallet(wallet.id)}
                    className="sr-only"
                  />
                  <span className="font-display text-sm text-kurio-cream">
                    {wallet.label}
                    <span className="block text-xs text-kurio-tan">{shortAddress(wallet.address)}</span>
                  </span>
                  <span className="rounded-sm border border-kurio-line/60 px-2 py-0.5 text-xs text-kurio-tan">
                    {NETWORK_LABELS[wallet.network]}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      <p aria-live="polite" role="status" className="mt-4 min-h-5 text-sm">
        {statusMessage ? (
          <span className={connection === 'refused' ? 'font-bold text-kurio-accent' : 'text-kurio-tan'}>
            {statusMessage}
          </span>
        ) : null}
      </p>

      {isConnected && selectedWallet && selectedNetwork ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-sm text-kurio-cream">
            Conectado: {selectedWallet.label} · {NETWORK_LABELS[selectedNetwork]}
          </p>
          <Button variant="outline" size="sm" onClick={onDisconnect}>
            Desconectar
          </Button>
        </div>
      ) : (
        <Button
          className="mt-4 w-full"
          variant="outline"
          disabled={!canConnect}
          onClick={() => setDialogOpen(true)}
        >
          Conectar carteira (simulação)
        </Button>
      )}

      {selectedWallet && selectedNetwork && !networkMismatch ? (
        <WalletConnectDialog
          open={dialogOpen}
          walletLabel={selectedWallet.label}
          networkLabel={NETWORK_LABELS[selectedNetwork]}
          onConfirm={() => {
            setDialogOpen(false);
            onConnectConfirmed();
          }}
          onRefuse={() => {
            setDialogOpen(false);
            onConnectRefused();
          }}
          onClose={() => setDialogOpen(false)}
        />
      ) : null}
    </section>
  );
}