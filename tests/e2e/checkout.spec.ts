import { expect, test, type Page } from '@playwright/test';

/**
 * Checkout E2E flows against the MSW-mocked API. Ada's seeded cart is used:
 * Aurora Signal (Standard, 1.25 ETH) + Tide Archive (Open edition, 0.875 ETH).
 * The guest identity is generated per browser, so the seeded guest cart is
 * never attached and Ada's cart stays deterministic on every login.
 */

const ADA_EMAIL = 'ada@kurio.test';
const ADA_PASSWORD = 'kurio-ada-2026';

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
  // The mock control endpoint only exists after the MSW service worker is
  // active; a recent full navigation may still be registering it. Retry so a
  // slow registration never flakes the scenario set-up.
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

function hasNoHorizontalOverflow() {
  return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
}

async function loginAsAda(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADA_EMAIL);
  await page.getByLabel('Senha').fill(ADA_PASSWORD);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('main')).toContainText('Seja dono do futuro da arte digital');
}

async function connectWallet(page: Page, walletLabel = 'Ada primary') {
  await page.getByRole('radiogroup', { name: 'Rede' }).getByText('Ethereum', { exact: true }).click();
  await page.getByRole('radiogroup', { name: 'Carteira' }).getByText(walletLabel).click();
  await page.getByRole('button', { name: 'Conectar carteira (simulação)' }).click();
  const dialog = page.getByRole('dialog', { name: 'Conectar carteira' });
  await dialog.getByRole('button', { name: 'Conectar', exact: true }).click();
  await expect(page.getByText(`Conectado: ${walletLabel} · Ethereum`)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await resetMockState(page);
});

test('redirects an anonymous visitor to login before checkout', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel('Email')).toBeVisible();
});

test('logs in, connects a wallet and completes a simulated purchase', async ({ page }) => {
  await loginAsAda(page);
  await page.goto('/checkout');

  await expect(page.getByRole('heading', { name: 'Finalizar compra' })).toBeVisible();
  await expect(page.getByText('Ada Collector')).toBeVisible();
  await expect(page.getByText('ada@kurio.test')).toBeVisible();

  const review = page.getByRole('region', { name: 'Revisão da compra' });
  await expect(review.getByText('Aurora Signal')).toBeVisible();
  await expect(review.getByText('Tide Archive')).toBeVisible();
  await expect(review.getByText('2.125 ETH')).toBeVisible();
  await expect(review.getByText('0.003 ETH')).toBeVisible();
  await expect(review.getByText('2.128 ETH')).toBeVisible();
  await expect(page.evaluate(hasNoHorizontalOverflow)).resolves.toBe(true);

  await connectWallet(page);
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled();

  await setScenario(page, 'payment-confirmed');
  await page.getByRole('button', { name: 'Confirmar compra' }).click();

  await expect(page).toHaveURL(/\/order\/order-\d+/);
  await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pagamento confirmado!' })).toBeVisible();
  await expect(
    page.getByText('Os NFTs foram adicionados à sua coleção'),
  ).toBeVisible();

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
});

test('shows a refused payment and keeps the cart intact', async ({ page }) => {
  await loginAsAda(page);
  await page.goto('/checkout');
  await connectWallet(page);

  await setScenario(page, 'payment-rejected');
  await page.getByRole('button', { name: 'Confirmar compra' }).click();

  await expect(page.getByText('Pagamento recusado', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pagamento não concluído' })).toBeVisible();
  await expect(page.getByText(/simulação recusou o pagamento/i)).toBeVisible();

  await page.getByRole('button', { name: /Revisar carrinho e tentar novamente/ }).click();
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Aurora Signal', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tide Archive', exact: true })).toBeVisible();
});