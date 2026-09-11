import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, CartIcon, EmailIcon, HeartIcon, LinkedInIcon, ShareXIcon, StarIcon } from '@/components/shared/icons';
import { useNftDetail } from '@/features/nft/hooks/use-nft-detail';
import { useFavoriteToggle } from '@/features/nft/hooks/use-favorite-toggle';
import { useAddToCart } from '@/features/nft/hooks/use-add-to-cart';
import { EditionSelector } from '@/features/nft/components/edition-selector';
import { QuantityStepper } from '@/features/nft/components/quantity-stepper';
import { NftDetailSkeleton } from '@/features/nft/components/nft-detail-skeleton';
import { NftGallery } from '@/features/nft/components/nft-gallery';
import { DetailTabs } from '@/features/nft/components/detail-tabs';
import { CollectionCarousel } from '@/features/nft/components/collection-carousel';
import { cn } from '@/lib/utils';
import type { NftEdition } from '@/types/domain';

function isNotFound(error: unknown) {
  return isAxiosError(error) && error.response?.status === 404;
}

function availabilityLabel(edition: NftEdition) {
  if (edition.available === 0) {
    return 'Edição esgotada';
  }
  return `Disponível: ${edition.available} · Limite de ${edition.maxPerOrder} por compra`;
}

interface FavoriteButtonProps {
  nftId: string;
  withLabel?: boolean;
}

function FavoriteButton({ nftId, withLabel }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, isToggling, error, resetError } = useFavoriteToggle(nftId);

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="outline"
        aria-pressed={isFavorite}
        disabled={isToggling}
        onClick={() => {
          resetError();
          toggleFavorite();
        }}
        className={cn(isFavorite && 'border-kurio-accent text-kurio-accent')}
      >
        <HeartIcon width={16} height={16} fill={isFavorite ? 'currentColor' : 'none'} />
        {withLabel ? (isFavorite ? 'Favoritado' : 'Favoritar') : null}
        <span className="sr-only">
          {isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        </span>
      </Button>
      <p aria-live="polite" className="min-h-4 text-xs text-kurio-tan">
        {error ? 'Entre para favoritar este NFT.' : null}
      </p>
    </div>
  );
}

function Rating() {
  return (
    <p className="mt-3 flex items-center gap-2 text-xs text-kurio-tan">
      <span className="flex gap-0.5 text-kurio-accent" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <StarIcon key={index} width={14} height={14} />
        ))}
      </span>
      <span>19 avaliações de colecionadores</span>
    </p>
  );
}

function ShareRow() {
  const shareTargets = [
    { label: 'Compartilhar no LinkedIn', Icon: LinkedInIcon },
    { label: 'Compartilhar por e-mail', Icon: EmailIcon },
    { label: 'Compartilhar no X', Icon: ShareXIcon },
  ] as const;

  return (
    <div className="mt-8 border-t border-kurio-line/60 pt-6">
      <h2 className="font-display text-sm font-bold text-kurio-cream">Compartilhar este NFT:</h2>
      <div className="mt-3 flex gap-2">
        {shareTargets.map(({ label, Icon }) => (
          <span
            key={label}
            role="img"
            aria-label={label}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-kurio-line text-kurio-tan"
          >
            <Icon width={16} height={16} />
          </span>
        ))}
      </div>
    </div>
  );
}

export function NftDetailPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' });
  const navigate = useNavigate();
  const detailQuery = useNftDetail(nftId);

  const [selectedEditionId, setSelectedEditionId] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);

  const nftData = detailQuery.data;
  const selectedEdition: NftEdition | undefined =
    nftData?.editions.find((edition) => edition.id === selectedEditionId) ?? nftData?.editions[0];
  const maxQuantity = selectedEdition
    ? Math.min(selectedEdition.available, selectedEdition.maxPerOrder)
    : 0;
  const isUnavailable = !selectedEdition || selectedEdition.available === 0;

  useEffect(() => {
    setQuantity(1);
  }, [selectedEditionId]);

  const addToCart = useAddToCart(nftId, selectedEdition?.id);
  const addToCartError = addToCart.error;
  const submittingRef = useRef(false);
  const availabilityConflict =
    isAxiosError(addToCartError) && addToCartError.response?.status === 409;
  const unauthorizedCart = isAxiosError(addToCartError) && addToCartError.response?.status === 401;

  const canAddToCart = !isUnavailable && !addToCart.isPending && quantity <= maxQuantity;

  const handleAddToCart = () => {
    // Synchronous guard: two clicks inside one render frame must
    // not produce two submissions.
    if (submittingRef.current) {
      return;
    }
    submittingRef.current = true;
    addToCart.reset();
    addToCart.mutate(quantity, {
      onSettled: () => {
        submittingRef.current = false;
      },
    });
  };

  if (detailQuery.isPending) {
    return <NftDetailSkeleton />;
  }

  if (detailQuery.isError) {
    if (isNotFound(detailQuery.error)) {
      return (
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-4 px-4 py-24 text-center md:px-6">
          <h1 className="font-display text-2xl font-bold text-kurio-cream">NFT não encontrado</h1>
          <p className="max-w-md text-sm leading-relaxed text-kurio-tan">
            A obra que você procura não existe ou não está mais disponível no mercado Kurio.
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
          Não foi possível carregar este NFT.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-kurio-tan">
          Ocorreu uma falha inesperada. Tente novamente em instantes.
        </p>
        <Button onClick={() => void detailQuery.refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  const nft = detailQuery.data;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 md:px-6 md:pt-8">
      <nav aria-label="Trilha de navegação" className="mb-6 text-xs text-kurio-tan">
        <Link
          to="/"
          className="rounded-sm outline-none transition-colors hover:text-kurio-accent focus-visible:ring-2 focus-visible:ring-kurio-accent"
        >
          Início
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-kurio-cream">
          Mercado
        </span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
        <NftGallery imageUrl={nft.imageUrl} nftName={nft.name} />

        <div className="relative">
          <h1 className="pr-12 font-display text-2xl font-bold text-kurio-cream md:text-3xl">{nft.name}</h1>
          <div className="absolute right-0 top-0 md:hidden">
            <FavoriteButton nftId={nftId} />
          </div>
          <p className="mt-3 hidden font-display text-2xl font-bold text-kurio-accent md:block">
            {nft.price} ETH
          </p>
          <Rating />

          <h2 className="mt-6 font-display text-sm font-bold text-kurio-cream">Sobre este NFT:</h2>
          <p className="mt-2 text-sm leading-relaxed text-kurio-tan">{nft.description}</p>

          <div className="mt-6">
            <EditionSelector
              editions={nft.editions}
              selectedId={selectedEdition?.id ?? ''}
              onSelect={setSelectedEditionId}
            />
          </div>

          <p
            aria-live="polite"
            className={cn('mt-4 text-sm font-bold', isUnavailable ? 'text-kurio-accent' : 'text-kurio-cream')}
          >
            {selectedEdition ? availabilityLabel(selectedEdition) : null}
          </p>

          <div className="mt-6 hidden items-center gap-4 md:flex">
            <QuantityStepper
              value={quantity}
              min={1}
              max={Math.max(1, maxQuantity)}
              disabled={isUnavailable}
              onChange={setQuantity}
            />
            <Button
              className="min-w-48"
              disabled={!canAddToCart}
              onClick={handleAddToCart}
            >
              <CartIcon width={16} height={16} />
              {addToCart.isPending ? 'Adicionando...' : 'Comprar'}
            </Button>
            <FavoriteButton nftId={nftId} withLabel />
          </div>

          <div className="mt-6 md:hidden">
            <div className="flex items-center justify-between gap-4">
              <QuantityStepper
                value={quantity}
                min={1}
                max={Math.max(1, maxQuantity)}
                disabled={isUnavailable}
                onChange={setQuantity}
              />
              <p className="font-display text-2xl font-bold text-kurio-accent">{nft.price} ETH</p>
            </div>
            <Button
              className="mt-4 w-full"
              disabled={!canAddToCart}
              onClick={handleAddToCart}
            >
              <CartIcon width={16} height={16} />
              {addToCart.isPending ? 'Adicionando...' : 'Comprar NFT'}
            </Button>
          </div>

          <p aria-live="polite" className="mt-3 min-h-5 text-sm text-kurio-accent">
            {addToCart.isSuccess ? `${nft.name} adicionado ao carrinho.` : null}
            {availabilityConflict ? 'Estoque insuficiente: atualizamos a disponibilidade abaixo.' : null}
            {unauthorizedCart ? 'Entre para adicionar itens ao carrinho.' : null}
          </p>

          <dl className="mt-6 space-y-2 border-t border-kurio-line/60 pt-6 text-sm">
            <div className="flex gap-2">
              <dt className="font-bold text-kurio-cream">ID do token:</dt>
              <dd className="text-kurio-tan">#{nft.tokenId}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold text-kurio-cream">Coleção:</dt>
              <dd className="text-kurio-tan">{nft.collection}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold text-kurio-cream">Atributos:</dt>
              <dd className="text-kurio-tan">{(nft.attributes ?? []).join(', ')}</dd>
            </div>
          </dl>

          <ShareRow />
        </div>
      </div>

      <DetailTabs nft={nft} />
      <CollectionCarousel collection={nft.collection} excludeId={nft.id} />
    </div>
  );
}
