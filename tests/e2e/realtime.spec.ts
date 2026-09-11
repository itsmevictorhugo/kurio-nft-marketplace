import { expect, test, type Page } from '@playwright/test';

/**
 * Realtime E2E flows (RT-01..RT-11). Every event travels through the real
 * `socket.io-client` WebSocket path intercepted by the MSW socket transport:
 * the mock hub broadcasts `nft.updated` / `order.updated` and the application
 * applies the version ordering rules before invalidating the affected caches.
 */

const ADA_EMAIL = 'ada@kurio.test';
const ADA_PASSWORD = 'kurio-ada-2026';
const LIN_EMAIL = 'lin@kurio.test';
const LIN_PASSWORD = 'kurio-lin-2026';

async function resetMockState(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        const response = await fetch('/api/__mock/reset', { method: 'POST' });
        if (response.ok) {
          return;
        }
      } catch {
        // worker not ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error('Mock service worker never became ready.');
  });
}

async function setScenario(page: Page, scenario: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const ok = await page.evaluate(async (name) => {
      try {
        const response = await fetch('/api/__mock/scenario', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ scenario: name }),
        });
        return response.ok;
      } catch {
        return false;
      }
    }, scenario);
    if (ok) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Unable to select scenario ${scenario}.`);
}

async function emitRealtime(
  page: Page,
  event: 'nft.updated' | 'order.updated',
  envelope: { resourceId: string; version: number; payload: unknown },
) {
  await page.evaluate(
    async ({ event, envelope }) => {
      const response = await fetch('/api/__mock/socket/emit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event,
          envelope: { eventId: `evt-e2e-${Math.random().toString(36).slice(2)}`, ...envelope },
        }),
      });
      if (!response.ok) {
        throw new Error(`Unable to emit realtime event ${event}.`);
      }
    },
    { event, envelope },
  );
}

async function realtimeConnectionCount(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch('/api/__mock/socket/connections');
    const data = (await response.json()) as { connections: number };
    return data.connections;
  });
}

async function waitForRealtimeConnections(point: 'open' | 'closed', page: Page, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const count = await realtimeConnectionCount(page);
    if (point === 'closed' ? count === 0 : count >= 1) {
      return;
    }
    await page.waitForTimeout(120);
  }
  throw new Error(`Realtime connection never reached ${point === 'closed' ? '0' : '≥1'}.`);
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('main')).toContainText('Seja dono do futuro da arte digital');
}

async function connectWallet(page: Page) {
  await page.getByRole('radiogroup', { name: 'Rede' }).getByText('Ethereum', { exact: true }).click();
  await page.getByRole('radiogroup', { name: 'Carteira' }).getByText('Ada primary').click();
  await page.getByRole('button', { name: 'Conectar carteira (simulação)' }).click();
  const dialog = page.getByRole('dialog', { name: 'Conectar carteira' });
  await dialog.getByRole('button', { name: 'Conectar', exact: true }).click();
  await expect(page.getByText('Conectado: Ada primary · Ethereum')).toBeVisible();
}

function auroraCard(page: Page) {
  return page.locator('article', { hasText: 'Aurora Signal' });
}

test.beforeEach(async ({ page }) => {
  await resetMockState(page);
});

test('updates the catalog price when nft.updated arrives without reload (RT-01, RT-02)', async ({ page }) => {
  await page.goto('/');
  await expect(auroraCard(page)).toContainText('1.25 ETH');

  await setScenario(page, 'price-changed');

  await expect(auroraCard(page)).toContainText('1.5 ETH');
});

async function expectDetailPrice(page: Page, price: string) {
  await expect(page.locator('p:visible').filter({ hasText: new RegExp(`^${price} ETH$`) })).toBeVisible();
}

test('updates the NFT detail when nft.updated arrives (RT-03)', async ({ page }) => {
  await page.goto('/nfts/nft-aurora');
  await expect(page.getByRole('heading', { level: 1, name: 'Aurora Signal' })).toBeVisible();
  await expectDetailPrice(page, '1.25');

  await setScenario(page, 'price-changed');

  await expectDetailPrice(page, '1.5');
});

test('reflects a sold-out edition in the cart after nft.updated (RT-04)', async ({ page }) => {
  await login(page, ADA_EMAIL, ADA_PASSWORD);
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
  await expect(page.getByText('Edição Standard')).toBeVisible();
  await expect(page.getByText('Edição indisponível no momento.')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Finalizar compra' })).toBeEnabled();

  await setScenario(page, 'sold-out');

  await expect(page.getByText('Edição indisponível no momento.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Finalizar compra' })).toBeDisabled();
});

test('blocks checkout on a stale quote after nft.updated and allows a fresh confirmation (RT-05)', async ({
  page,
}) => {
  await login(page, ADA_EMAIL, ADA_PASSWORD);
  await page.goto('/checkout');

  const review = page.getByRole('region', { name: 'Revisão da compra' });
  await expect(review.getByText('Aurora Signal')).toBeVisible();
  await expect(review.getByText('2.128 ETH')).toBeVisible();
  await connectWallet(page);
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled();

  // Price/availability changes while the user is on the checkout page.
  await setScenario(page, 'price-changed');

  await expect(page.getByText('Os valores foram atualizados. Revise e confirme novamente.')).toBeVisible();
  await expect(review.getByText('1.5 ETH')).toBeVisible();
  await expect(review.getByText('2.378 ETH')).toBeVisible();

  // Confirmation is blocked while a stale quotation is attached.
  await page.getByRole('button', { name: 'Revisar valores e confirmar' }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await expect(page.getByText('Os valores foram atualizados. Revise e confirme novamente.')).toBeVisible();

  // A fresh quotation is obtained and the user confirms again.
  await setScenario(page, 'payment-confirmed');
  await page.getByRole('button', { name: 'Revisar valores e confirmar' }).click();

  await expect(page).toHaveURL(/\/order\/order-\d+/);
  await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible();
});

test('ignores duplicate and stale nft.updated events without refetching (RT-07, RT-08)', async ({ page }) => {
  let nftGetRequests = 0;
  page.on('request', (request) => {
    if (request.method() === 'GET' && request.url().includes('/api/nfts')) {
      nftGetRequests += 1;
    }
  });

  await page.goto('/');
  await expect(auroraCard(page)).toContainText('1.25 ETH');

  await setScenario(page, 'price-changed');
  await expect(auroraCard(page)).toContainText('1.5 ETH');

  const currentVersion = await page.evaluate(async () => {
    const response = await fetch('/api/nfts/nft-aurora');
    const nft = (await response.json()) as { id: string; price: string; version: number };
    return nft.version;
  });

  const requestsBeforeEmits = nftGetRequests;

  // A duplicate (same version) and then a stale (older version) event must be
  // ignored: no invalidation, no refetch, and the catalog price must not move.
  await emitRealtime(page, 'nft.updated', {
    resourceId: 'nft-aurora',
    version: currentVersion,
    payload: { nft: { id: 'nft-aurora', price: '9.9', version: currentVersion } },
  });
  await emitRealtime(page, 'nft.updated', {
    resourceId: 'nft-aurora',
    version: currentVersion - 1,
    payload: { nft: { id: 'nft-aurora', price: '0.001', version: currentVersion - 1 } },
  });

  await page.waitForTimeout(800);
  expect(nftGetRequests).toBe(requestsBeforeEmits);
  await expect(auroraCard(page)).toContainText('1.5 ETH');
});

test('recovers a pending order after an interrupted connection and resolves it via order.updated (RT-06, RT-09, RT-10)', async ({
  page,
}) => {
  await login(page, ADA_EMAIL, ADA_PASSWORD);
  await page.goto('/checkout');
  await connectWallet(page);
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(page).toHaveURL(/\/order\/order-\d+/);

  const orderUrl = page.url();
  await expect(page.getByText('Pagamento pendente', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Aguardando confirmação do pagamento' }),
  ).toBeVisible();

  // The socket is genuinely connected while the order is pending.
  await waitForRealtimeConnections('open', page);

  // The connection is interrupted server-side.
  await page.evaluate(() => fetch('/api/__mock/socket/disconnect', { method: 'POST' }));
  await waitForRealtimeConnections('closed', page);

  // The socket.io client reconnects on its own and starts REST reconciliation.
  await waitForRealtimeConnections('open', page);
  await expect(
    page.getByRole('heading', { name: 'Aguardando confirmação do pagamento' }),
  ).toBeVisible();
  await expect(page.url()).toBe(orderUrl);

  // The recovered order must not create a duplicate: still the same order id.
  await setScenario(page, 'payment-confirmed');
  await page.getByRole('button', { name: 'Atualizar status' }).click();

  await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pagamento confirmado!' })).toBeVisible();
  await expect(page.url()).toBe(orderUrl);

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
});

test('cleans up realtime subscriptions on session change and isolates the next session (RT-11)', async ({
  page,
}) => {
  await login(page, ADA_EMAIL, ADA_PASSWORD);
  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: 'Finalizar compra' })).toBeVisible();
  await waitForRealtimeConnections('open', page);

  // Session expiry makes the app clear the token through its own session-error
  // path (a fresh authenticated request is rejected with 401).
  await setScenario(page, 'session-expired');
  await page.goto('/order/order-does-not-exist');
  await expect(page).toHaveURL(/\/login/);
  await waitForRealtimeConnections('open', page);

  // The next session restarts with its own isolated connection and private data.
  await setScenario(page, 'default');
  await login(page, LIN_EMAIL, LIN_PASSWORD);
  await waitForRealtimeConnections('open', page);

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
  await expect(page.getByText('Aurora Signal')).not.toBeVisible();
});