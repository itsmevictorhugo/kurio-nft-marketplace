import { expect, test } from '@playwright/test';

test('loads the application shell', async ({ page }) => {
  const routes = [
    ['/', 'Bem-vindo à Kurio'],
    ['/nft/nft-aurora', 'Aurora Signal'],
    ['/cart', 'Cart'],
    ['/checkout', 'Checkout'],
    ['/order/foundation', 'Order confirmation'],
    ['/order-confirmation', 'Order confirmation'],
    ['/login', 'Login'],
    ['/register', 'Register'],
    ['/profile', 'Profile'],
    ['/wallets', 'Wallets'],
  ] as const;

  for (const [path, title] of routes) {
    await page.goto(path);
    await expect(page).toHaveTitle('Kurio NFT Marketplace');
    await expect(page.getByRole('main')).toContainText(title);

    await page.reload();
    await expect(page.getByRole('main')).toContainText(title);
  }
});
