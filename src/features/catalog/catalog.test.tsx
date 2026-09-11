import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { routeTree } from '@/app/router/router';
import { seedNfts } from '@/mocks/fixtures/seed';
import { server } from '@/mocks/server';
import { selectMockScenario } from '@/mocks/scenarios';

beforeAll(() => {
  window.scrollTo = () => {};
});

afterEach(() => {
  cleanup();
});

function catalogResponse(items: typeof seedNfts) {
  return {
    items,
    page: 1,
    pageSize: 12,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / 12)),
  };
}

function renderHome(initialEntry = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });

  const view = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { ...view, router };
}

function getGrid() {
  return screen.getByRole('list', { name: 'Resultados do catálogo' });
}

describe('home catalog', () => {
  it('renders the NFT catalog from the API', async () => {
    renderHome();

    const grid = await waitFor(() => getGrid());
    expect(await within(grid).findByText('Aurora Signal')).toBeInTheDocument();
    expect(within(grid).getByText('Tide Archive')).toBeInTheDocument();
    expect(within(grid).getByText('Orbit Bloom')).toBeInTheDocument();
  });

  it('reflects the search term in the URL and the results', async () => {
    const { router } = renderHome();

    // jsdom keeps both the mobile and the toolbar search inputs in the tree
    // (CSS breakpoints do not apply); they share the same controlled state.
    const input = (await screen.findAllByLabelText(/buscar nfts por nome/i))[0];
    fireEvent.change(input, { target: { value: 'tide' } });

    const grid = await waitFor(() => getGrid());
    expect(await within(grid).findByText('Tide Archive')).toBeInTheDocument();
    expect(within(grid).queryByText('Aurora Signal')).not.toBeInTheDocument();
    await waitFor(() => expect(router.state.location.search.search).toBe('tide'));
  });

  it('resets pagination when a filter changes', async () => {
    const { router } = renderHome('/?category=Photography&page=2');

    expect(await screen.findByText(/nenhum nft encontrado/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /arte digital/i }));

    const grid = await waitFor(() => getGrid());
    expect(await within(grid).findByText('Aurora Signal')).toBeInTheDocument();
    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({ category: 'Digital Art' });
      expect(router.state.location.search.page).toBeUndefined();
    });
  });

  it('writes the selected sort preset to the URL', async () => {
    const { router } = renderHome();

    fireEvent.click(await screen.findByRole('button', { name: 'Em alta' }));

    await waitFor(() => expect(router.state.location.search.sort).toBe('price-desc'));
    const grid = await waitFor(() => getGrid());
    expect(await within(grid).findByText('Aurora Signal')).toBeInTheDocument();
  });

  it('serves the second catalog page from the URL', async () => {
    const { router } = renderHome('/?page=2');

    const grid = await waitFor(() => getGrid());
    const cards = await within(grid).findAllByRole('link');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThan(12);
    await waitFor(() => expect(router.state.location.search.page).toBe(2));
  });

  it('renders the real artwork assets from the mock domain', async () => {
    renderHome();

    const grid = await waitFor(() => getGrid());
    await within(grid).findByText('Aurora Signal');
    const image = grid.querySelector('img');
    expect(image).not.toBeNull();
    expect(image).toHaveAttribute('src', expect.stringContaining('/assets/nft/'));
  });

  it('filters by network and maximum price through the URL', async () => {
    renderHome('/?network=solana&maxPrice=1');

    const grid = await waitFor(() => getGrid());
    const names = await within(grid).findAllByRole('heading', { level: 3 });
    expect(names.map((heading) => heading.textContent)).toEqual(['Golden Signal #160']);
  });

  it('filters by minimum price through the URL', async () => {
    renderHome('/?minPrice=2');

    const grid = await waitFor(() => getGrid());
    expect(await within(grid).findByText('Orbit Bloom')).toBeInTheDocument();
    expect(within(grid).queryByText('Aurora Signal')).not.toBeInTheDocument();
  });

  it('shows the empty state and restores the URL when filters are cleared', async () => {
    selectMockScenario('empty-catalog');
    const { router } = renderHome('/?search=zip');

    expect(await screen.findByText(/nenhum nft encontrado/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /limpar filtros/i }));

    await waitFor(() => expect(router.state.location.search).toEqual({}));
  });

  it('shows an error state and recovers through retry', async () => {
    let failing = true;
    server.use(
      http.get('*/api/nfts', () =>
        failing ? HttpResponse.error() : HttpResponse.json(catalogResponse(seedNfts)),
      ),
    );

    renderHome();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();

    failing = false;
    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));

    const grid = await waitFor(() => getGrid());
    expect(await within(grid).findByText('Aurora Signal')).toBeInTheDocument();
  });

  it('navigates to the NFT detail route from a card', async () => {
    const { router } = renderHome();

    const grid = await waitFor(() => getGrid());
    fireEvent.click(await within(grid).findByRole('link', { name: /aurora signal/i }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/nft/nft-aurora'));
    expect(screen.getByText('NFT detail')).toBeInTheDocument();
  });
});
