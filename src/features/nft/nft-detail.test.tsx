import { http, HttpResponse, delay } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { routeTree } from '@/app/router/router';
import { authApi, cartApi } from '@/lib/api/resources';
import { setSessionToken } from '@/features/auth/session';
import { seedNfts } from '@/mocks/fixtures/seed';
import { selectMockScenario } from '@/mocks/scenarios';
import { server } from '@/mocks/server';

beforeAll(() => {
  window.scrollTo = () => {};
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderDetail(initialEntry = '/nfts/nft-aurora') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

function getQuantityGroup() {
  // The reference-aligned purchase UI renders one stepper per breakpoint
  // (hidden md:flex and md:hidden), both present in jsdom.
  return within(screen.getAllByRole('group', { name: 'Quantidade' })[0]);
}

describe('nft detail', () => {
  it('renders the loading skeleton and then the detail content', async () => {
    server.use(
      http.get('*/api/nfts/:nftId', async () => {
        await delay(100);
        return HttpResponse.json(seedNfts[0]);
      }),
    );

    renderDetail();

    await waitFor(() => expect(document.querySelector('.shimmer')).not.toBeNull());
    expect(await screen.findByRole('heading', { name: 'Aurora Signal' })).toBeInTheDocument();
    expect(screen.getAllByText('1.25 ETH').length).toBeGreaterThan(0);
    expect(screen.getByText('Kurio Genesis')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /peça 1 de 18, 8 disponíveis/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /peça 1 de 2, 2 disponíveis/i })).toBeInTheDocument();
    expect(screen.getByText('Disponível: 8 · Limite de 3 por compra')).toBeInTheDocument();
  });

  it('shows the not-found state for an unknown NFT', async () => {
    renderDetail('/nfts/unknown-id');

    expect(await screen.findByText('NFT não encontrado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /voltar ao catálogo/i })).toBeInTheDocument();
  });

  it('shows an error state and recovers through retry', async () => {
    let failing = true;
    server.use(
      http.get('*/api/nfts/:nftId', () =>
        failing ? HttpResponse.error() : HttpResponse.json(seedNfts[0]),
      ),
    );

    renderDetail();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    failing = false;
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('heading', { name: 'Aurora Signal' })).toBeInTheDocument();
  });

  it('blocks purchase and communicates a sold-out edition', async () => {
    selectMockScenario('sold-out');

    renderDetail();

    expect(await screen.findByText('Edição esgotada')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /peça 1 de 18, esgotada/i }),
    ).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Comprar NFT' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Comprar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Comprar NFT' })).toBeDisabled();
    expect(getQuantityGroup().getByRole('button', { name: /aumentar quantidade/i })).toBeDisabled();
  });

  it('clamps quantity between 1 and the edition limit', async () => {
    renderDetail();

    await screen.findByRole('heading', { name: 'Aurora Signal' });
    const quantityGroup = getQuantityGroup();
    const increment = quantityGroup.getByRole('button', { name: /aumentar quantidade/i });
    const decrement = quantityGroup.getByRole('button', { name: /diminuir quantidade/i });

    expect(decrement).toBeDisabled();
    fireEvent.click(increment);
    fireEvent.click(increment);
    expect(quantityGroup.getByText('3')).toBeInTheDocument();
    expect(increment).toBeDisabled();
    fireEvent.click(decrement);
    expect(quantityGroup.getByText('2')).toBeInTheDocument();
    expect(increment).not.toBeDisabled();
  });

  it('renders the mobile purchase block with price and full-width CTA', async () => {
    renderDetail();

    await screen.findByRole('heading', { name: 'Aurora Signal' });

    const mobileCta = screen.getByRole('button', { name: 'Comprar NFT' });
    expect(mobileCta).toBeInTheDocument();
    expect(mobileCta).not.toBeDisabled();
    expect(screen.getAllByText('1.25 ETH').length).toBeGreaterThanOrEqual(2);
  });

  it('renders reference-aligned metadata rows with data-driven attributes', async () => {
    renderDetail();

    await screen.findByRole('heading', { name: 'Aurora Signal' });

    expect(screen.getByText('ID do token:')).toBeInTheDocument();
    expect(screen.getByText('Coleção:')).toBeInTheDocument();
    expect(screen.getByText('Atributos:')).toBeInTheDocument();
    expect(screen.getByText('Kurio Genesis')).toBeInTheDocument();
    expect(screen.getByText('Iluminação, Generativo, Raro')).toBeInTheDocument();
    expect(screen.queryByText('Criador:')).not.toBeInTheDocument();
  });

  it('renders the deterministic contract in truncated reference style', async () => {
    renderDetail();

    await screen.findByRole('heading', { name: 'Aurora Signal' });

    expect(screen.getByText(/^0x[0-9A-F]{4}…[0-9A-F]{4}$/)).toBeInTheDocument();
  });

  it.each([
    ['nft-aurora', 'Edição Standard: peça 1 de 18, 8 disponíveis'],
    ['nft-orbit', 'Edição Collector: peça 1 de 1, 1 disponível'],
    ['nft-emerald', 'Edição Standard: peça 1 de 58, 6 disponíveis'],
    ['nft-tide', 'Edição Open edition: edição aberta, 15 disponíveis'],
  ])('renders the reference-style edition label for %s', async (nftId, ariaLabel) => {
    renderDetail(`/nfts/${nftId}`);

    await screen.findByRole('group', { name: 'Edições disponíveis' });
    expect(screen.getByRole('button', { name: ariaLabel })).toBeInTheDocument();
  });

  it('marks the open edition pill as ABERTA', async () => {
    renderDetail('/nfts/nft-tide');

    await screen.findByRole('group', { name: 'Edições disponíveis' });
    expect(screen.getByText('ABERTA')).toBeInTheDocument();
  });

  it('renders the emerald attributes and seeded token id from the token data', async () => {
    renderDetail('/nfts/nft-emerald');

    await screen.findByRole('heading', { name: 'Emerald Ape #042' });
    expect(screen.getByText('Óculos, Esmeralda, Raro')).toBeInTheDocument();
    expect(screen.getByText('#842')).toBeInTheDocument();
  });

  it('toggles a favorite for an authenticated user', async () => {
    const session = await authApi.login({ email: 'ada@kurio.test', password: 'kurio-ada-2026' });
    setSessionToken(session.session.token);

    renderDetail();

    // Ada starts with nft-aurora favorited in the seed.
    const removeButton = await screen.findAllByRole('button', { name: /remover dos favoritos/i });
    fireEvent.click(removeButton[0]);

    expect(
      await screen.findAllByRole('button', { name: /adicionar aos favoritos/i }),
    ).not.toHaveLength(0);
  });

  it('surfaces the API feedback when a guest tries to favorite', async () => {
    renderDetail();

    const favoriteButtons = await screen.findAllByRole('button', {
      name: /adicionar aos favoritos/i,
    });
    fireEvent.click(favoriteButtons[0]);

    expect(await screen.findByText('Entre para favoritar este NFT.')).toBeInTheDocument();
  });

  it('adds the selected quantity to the guest cart', async () => {
    localStorage.setItem('kurio-guest-id', 'detail-test-guest');

    renderDetail();

    await screen.findByRole('heading', { name: 'Aurora Signal' });
    fireEvent.click(getQuantityGroup().getByRole('button', { name: /aumentar quantidade/i }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Comprar' })[0]);

    expect(await screen.findByText(/adicionado ao carrinho/i)).toBeInTheDocument();

    const cart = await cartApi.get({ guestId: 'detail-test-guest' });
    expect(
      cart.cart.items.some((item) => item.nftId === 'nft-aurora' && item.quantity === 2),
    ).toBe(true);
  });

  it('recovers from an availability conflict and refreshes the NFT data', async () => {
    renderDetail();

    await screen.findByRole('heading', { name: 'Aurora Signal' });
    fireEvent.click(getQuantityGroup().getByRole('button', { name: /aumentar quantidade/i }));
    fireEvent.click(getQuantityGroup().getByRole('button', { name: /aumentar quantidade/i }));
    selectMockScenario('sold-out');
    fireEvent.click(screen.getAllByRole('button', { name: 'Comprar' })[0]);

    expect(await screen.findByText(/estoque insuficiente/i)).toBeInTheDocument();
    expect(await screen.findByText('Edição esgotada')).toBeInTheDocument();
  });

  it('ignores duplicate add-to-cart clicks while submitting', async () => {
    let addCalls = 0;
    server.use(
      http.post('*/api/cart/items', async () => {
        addCalls += 1;
        await delay(150);
        return HttpResponse.json(
          {
            item: { id: 'cart-item-1', nftId: 'nft-aurora', editionId: 'aurora-standard', quantity: 1 },
          },
          { status: 201 },
        );
      }),
    );

    renderDetail();

    const addButton = await screen.findByRole('button', { name: 'Comprar' });
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    await waitFor(() => expect(addCalls).toBe(1));
    await waitFor(() => expect(addButton).not.toBeDisabled());
  });
});