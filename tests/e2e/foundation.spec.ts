import { expect, test } from '@playwright/test';

test('loads the application shell', async ({ page }) => {
  const routes = [
    ['/', 'Seja dono do futuro da arte digital'],
    ['/nft/nft-aurora', 'Aurora Signal'],
    ['/nfts/nft-aurora', 'Aurora Signal'],
    ['/cart', 'Seu carrinho está vazio'],
    ['/checkout', 'Entrar na sua conta'],
    ['/order/foundation', 'Entrar na sua conta'],
    ['/order-confirmation', 'Seja dono do futuro da arte digital'],
    ['/login', 'Entrar na sua conta'],
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