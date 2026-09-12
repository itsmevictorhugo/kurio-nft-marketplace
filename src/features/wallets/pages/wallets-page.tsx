import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallets } from '@/features/wallets/hooks/use-wallets';
import { useCreateWallet, useUpdateWallet } from '@/features/wallets/hooks/use-wallets-mutations';
import { getRequestIdentity } from '@/features/cart/identity';
import type { CreateWalletInput } from '@/types/api';
import type { Wallet } from '@/types/domain';
import { EditIcon, WalletIcon } from '@/components/shared/icons';

function validateAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function validateLabel(label: string) {
  return label.trim().length >= 2;
}

interface WalletDialogProps {
  wallet?: Wallet | null;
  onClose: () => void;
}

function WalletDialog({ wallet, onClose }: WalletDialogProps) {
  const isEditing = Boolean(wallet);
  const [label, setLabel] = useState(wallet?.label ?? '');
  const [address, setAddress] = useState(wallet?.address ?? '');
  const [network, setNetwork] = useState<'ethereum' | 'polygon'>(wallet?.network ?? 'ethereum');
  const [isPrimary, setIsPrimary] = useState(wallet?.isPrimary ?? false);
  const [labelError, setLabelError] = useState('');
  const [addressError, setAddressError] = useState('');

  const createWallet = useCreateWallet();
  const updateWallet = useUpdateWallet();
  const isPending = createWallet.isPending || updateWallet.isPending;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLabelError('');
    setAddressError('');

    let valid = true;
    if (!validateLabel(label)) {
      setLabelError('Rótulo deve ter pelo menos 2 caracteres.');
      valid = false;
    }
    if (!validateAddress(address)) {
      setAddressError('Endereço deve ser um endereço Ethereum válido (0x...).');
      valid = false;
    }
    if (!valid) return;

    const input: CreateWalletInput = { label: label.trim(), address: address.trim(), network, isPrimary };
    if (isEditing && wallet) {
      updateWallet.mutate({ walletId: wallet.id, input });
    } else {
      createWallet.mutate(input);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="wallet-dialog-title">
      <div className="w-full max-w-md rounded-md border border-kurio-line bg-kurio-surface p-5 shadow-lg">
        <h2 id="wallet-dialog-title" className="font-display text-xl text-kurio-cream mb-4">
          {isEditing ? 'Editar Carteira' : 'Nova Carteira'}
        </h2>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="wallet-label" className="text-xs font-bold uppercase tracking-wide text-kurio-cream">
              Rótulo
            </label>
            <input
              id="wallet-label"
              type="text"
              value={label}
              onChange={(event) => {
                setLabel(event.target.value);
                if (labelError) setLabelError('');
              }}
              placeholder="Ex: Minha MetaMask"
              className="h-10 w-full rounded-md border border-kurio-line bg-kurio-night px-3 font-display text-sm text-kurio-cream placeholder:text-kurio-tan/60 outline-none focus-visible:ring-2 focus-visible:ring-kurio-accent disabled:opacity-50 disabled:cursor-not-allowed"
              aria-invalid={Boolean(labelError)}
              aria-describedby={labelError ? 'wallet-label-error' : undefined}
              disabled={isPending}
            />
            {labelError && (
              <p id="wallet-label-error" role="alert" className="text-sm text-kurio-accent">
                {labelError}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="wallet-address" className="text-xs font-bold uppercase tracking-wide text-kurio-cream">
              Endereço
            </label>
            <input
              id="wallet-address"
              type="text"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                if (addressError) setAddressError('');
              }}
              placeholder="0x..."
              className="h-10 w-full rounded-md border border-kurio-line bg-kurio-night px-3 font-display text-sm text-kurio-cream placeholder:text-kurio-tan/60 outline-none focus-visible:ring-2 focus-visible:ring-kurio-accent font-mono disabled:opacity-50 disabled:cursor-not-allowed"
              aria-invalid={Boolean(addressError)}
              aria-describedby={addressError ? 'wallet-address-error' : undefined}
              disabled={isPending}
            />
            {addressError && (
              <p id="wallet-address-error" role="alert" className="text-sm text-kurio-accent">
                {addressError}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-kurio-cream">
              Rede
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="wallet-network"
                  value="ethereum"
                  checked={network === 'ethereum'}
                  onChange={() => setNetwork('ethereum')}
                  className="h-4 w-4 accent-kurio-flame border-kurio-line bg-kurio-night text-kurio-cream focus-visible:ring-2 focus-visible:ring-kurio-accent"
                  disabled={isPending}
                />
                <span className="text-sm text-kurio-cream">Ethereum</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="wallet-network"
                  value="polygon"
                  checked={network === 'polygon'}
                  onChange={() => setNetwork('polygon')}
                  className="h-4 w-4 accent-kurio-flame border-kurio-line bg-kurio-night text-kurio-cream focus-visible:ring-2 focus-visible:ring-kurio-accent"
                  disabled={isPending}
                />
                <span className="text-sm text-kurio-cream">Polygon</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="wallet-isPrimary"
              checked={isPrimary}
              onChange={(event) => setIsPrimary(event.target.checked)}
              className="h-4 w-4 accent-kurio-flame border-kurio-line bg-kurio-night text-kurio-cream focus-visible:ring-2 focus-visible:ring-kurio-accent"
              disabled={isPending}
            />
            <label htmlFor="wallet-isPrimary" className="text-sm text-kurio-cream cursor-pointer">
              Definir como carteira principal
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Adicionar carteira'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function WalletsPage() {
  const identity = getRequestIdentity();
  const wallets = useWallets(identity);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (wallets.isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-4 px-4 py-24 text-center md:px-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-kurio-flame border-t-transparent" />
        <p className="text-sm text-kurio-tan">Carregando carteiras...</p>
      </div>
    );
  }

  if (wallets.isError) {
    return (
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-4 px-4 py-24 text-center md:px-6">
        <h1 className="font-display text-2xl font-bold text-kurio-cream">Não foi possível carregar as carteiras.</h1>
        <p className="max-w-md text-sm leading-relaxed text-kurio-tan">
          Ocorreu uma falha inesperada. Tente novamente em instantes.
        </p>
        <Button onClick={() => void wallets.refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  const walletList = wallets.data ?? [];

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 md:px-6 md:pt-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl font-bold text-kurio-cream md:text-3xl">Carteiras</h1>
        <Button
          variant="outline"
          onClick={() => setShowCreateDialog(true)}
          className="w-full justify-start"
        >
          Adicionar carteira
        </Button>
      </div>

      {walletList.length === 0 ? (
        <div className="rounded-md border border-kurio-line/60 bg-kurio-surface p-12 text-center">
          <WalletIcon width={48} height={48} className="mx-auto text-kurio-tan/50 mb-4" />
          <div>
            <h2 className="font-display text-lg font-bold text-kurio-cream">Nenhuma carteira cadastrada</h2>
            <p className="mt-2 text-sm text-kurio-tan max-w-md mx-auto">
              Adicione uma carteira para poder finalizar compras. Suas carteiras ficam salvas para próximas compras.
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-6 w-full justify-center"
            onClick={() => setShowCreateDialog(true)}
          >
            Adicionar carteira
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {walletList.map((wallet) => (
            <div key={wallet.id} className={`rounded-md border bg-kurio-surface p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${wallet.isPrimary ? 'border-kurio-flame/50' : 'border-kurio-line/60'}`}>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-kurio-flame/10 flex items-center justify-center">
                  <WalletIcon width={24} height={24} className="text-kurio-flame" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-bold text-kurio-cream">{wallet.label}</span>
                    {wallet.isPrimary && (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-kurio-flame/10 px-2 py-0.5 text-xs font-bold text-kurio-flame">
                        Principal
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-kurio-tan font-mono truncate max-w-xs">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </p>
                  <p className="text-xs text-kurio-tan/70 capitalize">{wallet.network}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingWallet(wallet)}
                  aria-label={`Editar ${wallet.label}`}
                >
                  <EditIcon width={16} height={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateDialog && (
        <WalletDialog wallet={null} onClose={() => setShowCreateDialog(false)} />
      )}
      {editingWallet && (
        <WalletDialog wallet={editingWallet} onClose={() => setEditingWallet(null)} />
      )}
    </div>
  );
}