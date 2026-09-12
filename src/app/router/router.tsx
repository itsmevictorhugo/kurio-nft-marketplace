import { createRootRoute, createRoute, createRouter, parseSearchWith, redirect, stringifySearchWith } from '@tanstack/react-router';
import { RootLayout } from '@/app/layouts/root-layout';
import { RoutePlaceholder } from '@/components/shared/route-placeholder';
import { getSessionToken } from '@/features/auth/session';
import { LoginPage } from '@/features/auth/pages/login-page';
import { RegisterPage } from '@/features/auth/pages/register-page';
import { HomePage } from '@/features/catalog/pages/home-page';
import { validateCatalogSearch } from '@/features/catalog/search-params';
import { NftDetailPage } from '@/features/nft/pages/nft-detail-page';
import { CartPage } from '@/features/cart/pages/cart-page';
import { CheckoutPage } from '@/features/checkout/pages/checkout-page';
import { OrderDetailPage } from '@/features/orders/pages/order-detail-page';
import { ProfilePage } from '@/features/profile/pages/profile-page';
import { WalletsPage } from '@/features/wallets/pages/wallets-page';

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <RoutePlaceholder title="Page not found" />,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: validateCatalogSearch,
  component: HomePage,
});

const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nfts/$nftId',
  component: NftDetailPage,
});

const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$id',
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/nfts/$nftId', params: { nftId: params.id } });
  },
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  beforeLoad: () => {
    if (!getSessionToken()) {
      throw redirect({ to: '/login', search: { redirect: '/checkout' } });
    }
  },
  component: CheckoutPage,
});

const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/order/$orderId',
  beforeLoad: ({ params }) => {
    if (!getSessionToken()) {
      throw redirect({ to: '/login', search: { redirect: `/order/${params.orderId}` } });
    }
  },
  component: OrderDetailPage,
});

const orderConfirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/order-confirmation',
  beforeLoad: () => {
    throw redirect({ to: '/' });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search?.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  beforeLoad: () => {
    if (getSessionToken()) {
      throw redirect({ to: '/' });
    }
  },
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search?.redirect === 'string' ? search.redirect : undefined,
  }),
  component: RegisterPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: () => {
    if (!getSessionToken()) {
      throw redirect({ to: '/login', search: { redirect: '/profile' } });
    }
  },
  component: ProfilePage,
});

const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallets',
  beforeLoad: () => {
    if (!getSessionToken()) {
      throw redirect({ to: '/login', search: { redirect: '/wallets' } });
    }
  },
  component: WalletsPage,
});

export const routeTree = rootRoute.addChildren([
  homeRoute,
  nftDetailRoute,
  nftRoute,
  cartRoute,
  checkoutRoute,
  orderRoute,
  orderConfirmationRoute,
  loginRoute,
  registerRoute,
  profileRoute,
  walletsRoute,
]);

// Catalog search params are plain strings; keep them out of the default
// JSON-quote round-trip so URLs stay clean (?minPrice=2 instead of %222%22).
export const router = createRouter({
  routeTree,
  stringifySearch: stringifySearchWith((value) => value),
  parseSearch: parseSearchWith((value) => value),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
