import { expect, test, type Page } from '@playwright/test';

/**
 * Formal visual regression — README: "Inclua regressão visual de início,
 * detalhe, carrinho e pagamento, com baselines versionadas e dados estáveis."
 *
 * Every case starts from deterministic mock state via the same reset mechanism
 * used by the functional suite (localStorage cleaned + `/api/__mock/reset`),
 * then navigates through the application's own flows. Snapshots are versioned
 * under `tests/e2e/visual.spec.ts-snapshots/` and compared with Playwright's
 * native `toHaveScreenshot()`.
 *
 * Viewport coverage: 390px (mobile), 768px (tablet), 1440px (desktop).
 * The viewports are set explicitly per case, so the cases run once — on the
 * desktop project only — giving each snapshot a single canonical baseline.
 */

const ADA_EMAIL = 'ada@kurio.test';
const ADA_PASSWORD = 'kurio-ada-2026';

const NFT_PATH = '/nfts/nft-aurora';

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 },
] as const;

const SCREENSHOT_OPTIONS = { animations: 'disabled' as const };

async function resetMockState(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
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

async function loginAsAda(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADA_EMAIL);
  await page.getByLabel('Senha').fill(ADA_PASSWORD);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('main')).toContainText('Seja dono do futuro da arte digital');
}

async function waitForAppImages(page: Page) {
  // Wait for the images actually visible in the current viewport to finish
  // loading so the captured frame is stable. Off-screen lazy images are part
  // of the application's real behavior and are intentionally not awaited.
  await page.evaluate(async () => {
    const waitForImage = (img: HTMLImageElement) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          });
    const visibleImages = Array.from(document.querySelectorAll<HTMLImageElement>('img')).filter((img) => {
      const rect = img.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        rect.right > 0 &&
        rect.left < window.innerWidth
      );
    });
    await Promise.all(visibleImages.map(waitForImage));
    await document.fonts.ready;
  });
}

async function captureStablePage(page: Page, name: string, ready: () => Promise<void>) {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await ready();
    await waitForAppImages(page);
    await expect(page).toHaveScreenshot(`${name}-${viewport.name}.png`, SCREENSHOT_OPTIONS);
  }
}

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-desktop',
    'Visual cases set their viewports explicitly and run once, on the desktop project.',
  );
  await resetMockState(page);
});

test('home', async ({ page }) => {
  await page.goto('/');
  await captureStablePage(page, 'home', async () => {
    await expect(page.getByRole('main')).toContainText('Seja dono do futuro da arte digital');
    const catalog = page.getByRole('list', { name: 'Resultados do catálogo' });
    await expect(catalog).toBeVisible();
    await expect(catalog.getByText('Aurora Signal').first()).toBeVisible();
  });
});

test('nft detail', async ({ page }) => {
  await page.goto(NFT_PATH);
  await captureStablePage(page, 'nft-detail', async () => {
    await expect(page.getByRole('heading', { level: 1, name: 'Aurora Signal' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Comprar/ })).toBeVisible();
  });
});

test('cart', async ({ page }) => {
  await loginAsAda(page);
  await page.goto('/cart');
  await captureStablePage(page, 'cart', async () => {
    await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Itens do carrinho' })).toBeVisible();
  });
});

test('payment', async ({ page }) => {
  await loginAsAda(page);
  await page.goto('/checkout');
  await captureStablePage(page, 'payment', async () => {
    await expect(page.getByRole('heading', { name: 'Finalizar compra' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Revisão da compra' })).toContainText('2.128 ETH');
  });
});