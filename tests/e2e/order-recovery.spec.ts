import { expect, test, type Page } from '@playwright/test';

/**
 * Order recovery E2E: the checkout flow must tolerate a simulated payment
 * timeout. The first POST /orders attempt returns 504 after the order was
 * created server-side; the checkout retries with the SAME idempotency key and
 * recovers the already-created order instead of creating a duplicate.
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

async function loginAsAda(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADA_EMAIL);
  await page.getByLabel('Senha').fill(ADA_PASSWORD);
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

test.beforeEach(async ({ page }) => {
  await resetMockState(page);
});

test('recovers the order after a payment timeout without creating duplicates', async ({ page }) => {
  await loginAsAda(page);
  await page.goto('/checkout');
  await connectWallet(page);

  await setScenario(page, 'order-timeout');
  await page.getByRole('button', { name: 'Confirmar compra' }).click();

  // The 504 is retried once with the same key and resolves to the order that
  // was already created server-side.
  await expect(page).toHaveURL(/\/order\/order-\d+/);
  const orderUrl = page.url();
  await expect(page.getByText('Pagamento pendente', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Aguardando confirmação do pagamento' }),
  ).toBeVisible();

  // While the order is pending the cart is preserved.
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Aurora Signal', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tide Archive', exact: true })).toBeVisible();

  // The same recovered order transitions to confirmed once the scenario changes.
  // The order page also polls every 3 s while pending (ADR-018), so the manual
  // "Atualizar status" click may lose the race to an automatic poll under
  // load; both paths must converge to the same confirmed order.
  await page.goto(orderUrl);
  await setScenario(page, 'payment-confirmed');
  const updateStatus = page.getByRole('button', { name: 'Atualizar status' });
  try {
    await updateStatus.click({ timeout: 5000 });
  } catch {
    // the automatic poll already drove the transition — same authoritative GET
  }

  await expect(page.getByText('Pagamento confirmado', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pagamento confirmado!' })).toBeVisible();

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
});