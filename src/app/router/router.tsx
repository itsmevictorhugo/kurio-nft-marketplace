import { createRootRoute, createRoute, createRouter, parseSearchWith, redirect, stringifySearchWith } from '@tanstack/react-router';
import { RootLayout } from '@/app/layouts/root-layout';
import { RoutePlaceholder } from '@/components/shared/route-placeholder';
import { HomePage } from '@/features/catalog/pages/home-page';
import { validateCatalogSearch } from '@/features/catalog/search-params';
import { NftDetailPage } from '@/features/nft/pages/nft-detail-page';
import { CartPage } from '@/features/cart/pages/cart-page';

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
  component: () => <RoutePlaceholder title="Checkout" />, 
});

const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/order/$orderId',
  component: () => <RoutePlaceholder title="Order confirmation" />, 
});

const orderConfirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/order-confirmation',
  component: () => <RoutePlaceholder title="Order confirmation" />, 
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => <RoutePlaceholder title="Login" />, 
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: () => <RoutePlaceholder title="Register" />, 
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: () => <RoutePlaceholder title="Profile" />, 
});

const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallets',
  component: () => <RoutePlaceholder title="Wallets" />, 
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
