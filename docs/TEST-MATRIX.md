# Test Matrix

## 1. Purpose

Map challenge requirements to implementation evidence and automated tests.

The README remains authoritative.

---

## 2. Catalog

| ID     | Requirement            | Test                                                      |
| ------ | ---------------------- | --------------------------------------------------------- |
| CAT-01 | Search                 | catalog.test.tsx (Vitest)                                 |
| CAT-02 | Combined filters       | catalog.test.tsx (Vitest)                                 |
| CAT-03 | Sorting                | catalog.test.tsx (Vitest)                                 |
| CAT-04 | Pagination             | catalog.test.tsx (Vitest)                                 |
| CAT-05 | URL persistence        | catalog.test.tsx (Vitest) + E2E route/reload (foundation.spec.ts) |
| CAT-06 | Browser history        | não coberto por teste automatizado                        |
| CAT-07 | Empty results          | catalog.test.tsx (Vitest)                                 |
| CAT-08 | API failure            | catalog.test.tsx (Vitest)                                 |
| CAT-09 | Out-of-order responses | não coberto por teste automatizado para REST             |

Implemented catalog evidence:

- `src/features/catalog/catalog.test.tsx` (Vitest, 11): search term in the URL
  and results, pagination reset on filter change, sort preset in the URL,
  second catalog page from the URL, network/maximum/minimum price filters
  through the URL, empty state with URL restoration, error state recovered
  through retry, real artwork assets, and card navigation to the NFT detail
  route.
- `src/mocks/domain.test.ts` (Vitest): filter, sort, pagination and missing
  NFT detail through the REST mock domain.
- Direct access to the detail page and reload are exercised by
  `tests/e2e/foundation.spec.ts` and the public smoke suite; there is no
  catalog-specific E2E spec.
- No dedicated `catalog.spec.ts` or `resilience.spec.ts` exists. CAT-06
  (browser back/forward restore) and CAT-09 (out-of-order REST responses) have
  no dedicated automated test; ordering protection is enforced at the realtime
  layer by the version guard (RT-07/08), not for REST reads.

---

## 3. NFT Detail

| ID     | Requirement         | Test                                                             |
| ------ | ------------------- | ---------------------------------------------------------------- |
| NFT-01 | Direct access       | tests/e2e/foundation.spec.ts + public smoke suit (E2E)           |
| NFT-02 | Gallery             | nft-detail.test.tsx (Vitest, conteúdo) + visual.spec (E2E)       |
| NFT-03 | NFT information     | nft-detail.test.tsx (Vitest)                                     |
| NFT-04 | Edition             | nft-detail.test.tsx (Vitest)                                     |
| NFT-05 | Quantity limit      | nft-detail.test.tsx (Vitest) + cart.spec.ts (E2E, limite por pedido) |
| NFT-06 | Not found           | nft-detail.test.tsx (Vitest)                                     |
| NFT-07 | Unavailable edition | nft-detail.test.tsx (Vitest) + realtime.spec.ts RT-04 (E2E)      |
| NFT-08 | Favorite            | nft-detail.test.tsx (Vitest) → §5 Favorites                      |

Implemented NFT detail evidence:

- `src/features/nft/nft-detail.test.tsx` (Vitest, 15 + 4 `it.each` sub-cases):
  loading skeleton, not-found state, error + retry, sold-out state, quantity
  clamp, mobile purchase block, reference-aligned metadata rows, contract in
  truncated reference style, ABERTA edition pill, emerald attributes with
  seeded token id, favorite toggle, guest favorite feedback, add to guest cart,
  availability-conflict recovery, and duplicate-click protection.
- `tests/e2e/foundation.spec.ts` visits the detail page by direct URL and
  reloads it; the public smoke suite asserts direct-URL + refresh against the
  deployed build.
- Gallery thumbnails have no dedicated interaction test (rendering is covered
  by the unit content tests and the NFT detail visual baseline).

---

## 4. Authentication

| ID      | Requirement             | Test      |
| ------- | ----------------------- | --------- |
| AUTH-01 | Registration            | auth.spec |
| AUTH-02 | Registration validation | auth.spec |
| AUTH-03 | Registration conflict   | auth.spec |
| AUTH-04 | Login                   | auth.spec |
| AUTH-05 | Session persistence     | auth.spec |
| AUTH-06 | Session expiration      | auth.spec |
| AUTH-07 | Logout                  | auth.spec |
| AUTH-08 | User switching          | auth.spec |

Implemented authentication evidence:

- `src/features/auth/login.test.tsx` (Vitest, 7 tests): heading/form render,
  empty-field validation, invalid credentials, successful login storing the
  session token, `redirect=/checkout` resolution, `redirect` to an order page,
  and rejection of non-internal redirect values.
- `src/features/auth/register.test.tsx` (Vitest, 6 tests): heading/form render,
  empty-field validation, invalid email/short name/short password, registration
  conflict (409), successful registration with redirect to home and to checkout.
- `tests/e2e/auth.spec.ts` (Playwright, desktop + mobile): AUTH-01 registration
  success, AUTH-02 validation errors (empty, invalid email, short name, short
  password), AUTH-03 duplicate email conflict, AUTH-04 login success with
  redirect to checkout/order/malicious redirect fallback, AUTH-05 session
  persistence across refresh, AUTH-06 session expiration via `session-expired`
  scenario redirects to login with toast, AUTH-07 logout clears session and
  private caches (cart isolation), AUTH-08 user switching isolates private data.
  Every scenario starts from isolated mock state via `POST /api/__mock/reset`.

---

## 5. Favorites

| ID     | Requirement            | Test                                                          |
| ------ | ---------------------- | ------------------------------------------------------------- |
| FAV-01 | Add favorite           | nft-detail.test.tsx (Vitest)                                  |
| FAV-02 | Remove favorite        | nft-detail.test.tsx (Vitest)                                  |
| FAV-03 | Persistence            | domain.test.ts (Vitest, isolamento por usuário)               |
| FAV-04 | Optimistic update      | não aplicável (toggle server-gated: feedback após a resposta da API) |
| FAV-05 | Rollback after failure | sem teste automatizado dedicado                               |

Implemented favorites evidence:

- `src/features/nft/nft-detail.test.tsx`: toggles a favorite for an
  authenticated user; surfaces the API feedback when a guest tries to favorite.
- `src/mocks/domain.test.ts`: favorites persist and are isolated per
  authenticated user (Ada vs Lin).
- The toggle is server-gated (`use-favorite-toggle.ts` drives the mock API and
  invalidates `['favorites']`), so there is no optimistic UI to roll back; a
  mutation failure is surfaced through the returned `error`/`resetError`.
- No dedicated `favorites.spec.ts` E2E exists.

---

## 6. Cart

| ID      | Requirement                      | Test          |
| ------- | -------------------------------- | ------------- |
| CART-01 | Add item                         | cart.spec     |
| CART-02 | Change quantity                  | cart.spec     |
| CART-03 | Remove item                      | cart.spec     |
| CART-04 | Availability limit               | cart.spec     |
| CART-05 | Coupon apply                     | cart.spec     |
| CART-06 | Coupon removal                   | cart.spec     |
| CART-07 | Invalid coupon                   | cart.spec     |
| CART-08 | Expired coupon                   | cart.spec     |
| CART-09 | Refresh persistence              | cart.spec     |
| CART-10 | Guest/authenticated preservation | cart.spec     |
| CART-11 | Price update                     | realtime.spec |
| CART-12 | Availability update              | realtime.spec |

Implemented cart evidence:

- `src/features/cart/cart.test.tsx` (Vitest, 18 tests): loading skeleton,
  empty state with catalog CTA, items with edition/price/quote values,
  optimistic quantity update with quote reconciliation, rollback on network
  failure with accessible error, `409 availability_conflict` banner and
  reconcile, remove item, clear cart, KURIO10 acceptance with discounted
  totals (`-0.125 ETH` / `1.128 ETH`), invalid coupon, expired coupon, coupon
  removal, guest `X-Guest-Id` header, authenticated `Authorization` header,
  guest/auth cache-key isolation, identity resolution and guest→user merge.
- `tests/e2e/cart.spec.ts` (Playwright, desktop + mobile): add from NFT
  detail with header/mobile badge count, quantity edit with totals and
  refresh persistence, item removal, per-order availability cap, rejected
  (sold-out) edition state with blocked checkout, coupon apply/remove/invalid/
  expired, and guest cart merge on login without leaking another user's cart.
  Every scenario starts from an isolated, deterministic mock state via
  `POST /api/__mock/reset`.

CART-12 is covered by the realtime milestone: a live `sold-out` event marks
the edition unavailable in the cart with checkout blocked (`realtime.spec.ts`,
RT-04). CART-11 is covered through the shared quotation mechanism: an
`nft.updated` event invalidates the quote used by both the cart and the
checkout review, and the refreshed totals (1.5 ETH / 2.378 ETH) are asserted in
the checkout review flow (`realtime.spec.ts`, RT-05); the cart page consumes the
same quote data, though the E2E does not assert the cart page totals directly.

---

## 7. Checkout

| ID       | Requirement                | Test          |
| -------- | -------------------------- | ------------- |
| CHECK-01 | Collector data             | checkout.spec |
| CHECK-02 | Wallet selection           | checkout.spec |
| CHECK-03 | Network selection          | checkout.spec |
| CHECK-04 | Simulated connection       | checkout.spec |
| CHECK-05 | Connection refusal         | checkout.spec |
| CHECK-06 | Disconnection              | checkout.spec |
| CHECK-07 | Review                     | checkout.spec |
| CHECK-08 | Price revalidation         | checkout.spec |
| CHECK-09 | Availability revalidation  | checkout.spec |
| CHECK-10 | Coupon revalidation        | checkout.spec |
| CHECK-11 | Fee revalidation           | checkout.spec |
| CHECK-12 | Stale confirmation blocked | realtime.spec |

Implemented checkout evidence:

- `src/features/checkout/checkout.test.tsx` (Vitest, 11 tests): auth guard,
  collector data + wallet form render, empty cart state, wallet/network
  mismatch blocking, wallet connect/refused/disconnect, successful order
  creation navigation, `values-changed` banner through quote revalidation,
  cart preserved on rejection, idempotency key stability across repeated
  confirm clicks, and coupon carried from the cart across navigation.
- `src/features/checkout/checkout-attempt.test.ts` (Vitest, 12 tests): quote
  total extraction, `totalsMatch`, the attempt store (
  write/read/clear/corruption/missing), per-token isolation, and the stable
  idempotency key derivation (deterministic per attempt, distinct across
  attempts, never derived from the quote id).
- `tests/e2e/checkout.spec.ts` (Playwright, desktop + mobile): anonymous
  redirect to login, wallet connect + simulated purchase with the
  `payment-confirmed` scenario, and refused payment with the cart kept intact.
  Every scenario starts from `POST /api/__mock/reset` and sets the scenario
  through `POST /api/__mock/scenario`.

CHECK-12 is covered by the realtime milestone: a stale quote is detected after
a live `price-changed`/`nft.updated` event and the confirmation is blocked
until the quote is re-accepted (`realtime.spec.ts`, RT-05).

---

## 8. Orders

| ID       | Requirement                      | Test                |
| -------- | -------------------------------- | ------------------- |
| ORDER-01 | Create order                     | checkout.spec       |
| ORDER-02 | Idempotency                      | order-recovery.spec |
| ORDER-03 | Repeated click protection        | order-recovery.spec |
| ORDER-04 | Timeout recovery                 | order-recovery.spec |
| ORDER-05 | Pending                          | order-recovery.spec |
| ORDER-06 | Confirmed                        | checkout.spec       |
| ORDER-07 | Rejected                         | order-recovery.spec |
| ORDER-08 | Refresh recovery                 | order-recovery.spec |
| ORDER-09 | Receipt snapshot                 | checkout.spec       |
| ORDER-10 | Preserve cart after failure      | order-recovery.spec |
| ORDER-11 | Remove purchased quantities only | checkout.spec |

Implemented order evidence:

- `src/features/orders/order-page.test.tsx` (Vitest, 7 tests): auth guard,
  not-found for another user's order (403 → not found, not a session expiry),
  pending status, scenario-driven confirmation, rejected status with a
  back-to-cart CTA, `/order-confirmation` redirect to home, and receipt totals.
- `tests/e2e/order-recovery.spec.ts` (Playwright, desktop + mobile): the
  `order-timeout` scenario (first `POST /orders` → 504 after the order is
  stored) is auto-retried once with the same idempotency key, the recovered
  order confirms and the cart is emptied of the purchased quantities — no
  duplicate orders.
- Mock scenarios used: `payment-confirmed`, `payment-rejected`,
  `order-timeout` (204/504 semantics per `docs/API-CONTRACTS.md`), all wired
  through `POST /api/__mock/scenario` and reset per test.

---

## 9. Profile

| ID         | Requirement               | Test                       |
| ---------- | ------------------------- | -------------------------- |
| PROFILE-01 | View profile              | profile-wallets.spec.ts (E2E) |
| PROFILE-02 | Edit profile              | profile-wallets.spec.ts (E2E) |
| PROFILE-03 | Avatar                    | profile-wallets.spec.ts (E2E) |
| PROFILE-04 | Password change           | profile-wallets.spec.ts (E2E) |
| PROFILE-05 | Validation errors         | profile-wallets.spec.ts (E2E) |
| PROFILE-06 | Persistence after refresh | profile-wallets.spec.ts (E2E) |

Implemented profile evidence:

- `tests/e2e/profile-wallets.spec.ts` (desktop + mobile): PROFILE-01..06 view,
  edit, avatar, password change, validation and persistence after refresh, plus
  the auth guard redirect.
- `src/mocks/domain.test.ts`: profile updates through the REST mock domain.
- No dedicated `profile.spec.ts` exists; the E2E file is
  `tests/e2e/profile-wallets.spec.ts`.

---

## 10. Wallets

| ID        | Requirement       | Test                       |
| --------- | ----------------- | -------------------------- |
| WALLET-01 | List wallets      | profile-wallets.spec.ts (E2E) |
| WALLET-02 | Primary wallet    | profile-wallets.spec.ts (E2E) |
| WALLET-03 | Secondary wallet  | profile-wallets.spec.ts (E2E) |
| WALLET-04 | Add wallet        | profile-wallets.spec.ts (E2E) |
| WALLET-05 | Edit wallet       | profile-wallets.spec.ts (E2E) |
| WALLET-06 | Validation errors | profile-wallets.spec.ts (E2E) |

Implemented wallets evidence:

- `tests/e2e/profile-wallets.spec.ts` (desktop + mobile): WALLET-01..06 list,
  add, edit, primary selection, validation errors and empty state, plus the
  auth guard redirect.
- `src/mocks/domain.test.ts`: wallet updates through the REST mock domain.
- No dedicated `wallets.spec.ts` exists; the E2E file is
  `tests/e2e/profile-wallets.spec.ts`.

---

## 11. Realtime

| ID    | Requirement            | Test          |
| ----- | ---------------------- | ------------- |
| RT-01 | `nft.updated`          | realtime.spec |
| RT-02 | Catalog update         | realtime.spec |
| RT-03 | Detail update          | realtime.spec |
| RT-04 | Cart update            | realtime.spec |
| RT-05 | Stale quote detection  | realtime.spec |
| RT-06 | `order.updated`        | realtime.spec |
| RT-07 | Duplicate event        | realtime.spec |
| RT-08 | Stale event            | realtime.spec |
| RT-09 | Reconnection           | realtime.spec |
| RT-10 | Pending order recovery | realtime.spec |
| RT-11 | Session isolation      | realtime.spec |

Implemented realtime evidence (`tests/e2e/realtime.spec.ts`, desktop + mobile):

- RT-01/02 catalog price update without reload; RT-03 NFT detail price update;
  RT-04 sold-out reflected in a loaded cart with checkout blocked.
- RT-05 stale-quote detection after a real `nft.updated` event: confirmation
  blocked, new totals shown, and a fresh `payment-confirmed` order completes.
- RT-06/09/10 `order.updated` through the real Socket.IO path: pending order
  survives a server disconnect, reconnect reconciliation recovers the same
  order URL, a `payment-confirmed` scenario resolves it without duplicates.
- RT-07/08 duplicate and older (stale) events are rejected by the version
  guard without triggering any REST refetch.
- RT-11 session-expiry cleanup: the old session's socket and private cache
  are dropped, the next session reconnects isolated with no cross-user data.

Vitest evidence:

- `src/features/realtime/lib/version-guard.test.ts` (8 tests): accept on first
  evidence, accept equal/newer versions, reject stale versions, and the stateful
  tracker's monotonic memory.
- `src/mocks/domain.test.ts`: order `version` increments from 1 on transition
  (2 once terminal) and the sold-out scenario bumps the NFT version.

---

## 12. Accessibility

| ID      | Requirement         | Test                                                        |
| ------- | ------------------- | ----------------------------------------------------------- |
| A11Y-01 | Keyboard navigation | sem spec dedicado; coberto em Vitest/E2E funcional          |
| A11Y-02 | Visible focus       | sem spec dedicado; coberto em Vitest/E2E funcional          |
| A11Y-03 | Dialog focus        | sem spec dedicado; coberto no dropdown (auth) em Vitest/E2E |
| A11Y-04 | Form validation     | auth/register/profile/wallets E2E + Vitest                  |
| A11Y-05 | Accessible feedback | `role="status"`/`role="alert"` verificado em Vitest/E2E     |
| A11Y-06 | Drawer focus        | sem teste automatizado dedicado (mobile nav/stepper)        |

Implemented accessibility evidence:

- No dedicated `accessibility.spec.ts` exists. Accessibility behaviors are
  verified inside existing component tests and functional E2E: labels and
  validation messages (`register.test.tsx`, `login.test.tsx`, profile and
  wallet E2E), keyboard-accessible dropdown menu with focus trap and visible
  focus (`auth.spec.ts`), `role="status"`/`role="alert"` feedback for
  mutations and realtime changes (`cart.test.tsx`, `realtime.spec.ts`), and
  state never conveyed only by color (cart/availability states). These verify
  behavior but are not a dedicated keyboard/focus E2E pass; that remains an
  explicit, unautomated gap.

---

## 13. Resilience

| ID     | Requirement      | Test                                                        |
| ------ | ---------------- | ----------------------------------------------------------- |
| RES-01 | Slow network     | nft-detail.test.tsx / cart.test.tsx (delay msw inline)      |
| RES-02 | Variable latency | cart.test.tsx / nft-detail.test.tsx (50–150 ms inline)      |
| RES-03 | Network failure  | cart.test.tsx (rollback de update falho)                    |
| RES-04 | HTTP 4xx         | cart/nft (409 availability), auth.spec (401), domain.test (cupom/403) |
| RES-05 | HTTP 5xx         | order-recovery.spec.ts (504/order-timeout)                  |
| RES-06 | Retry/recovery   | catalog.test.tsx (retry) + checkout/order-recovery (retry idempotente) |
| RES-07 | Skeletons        | cart.test.tsx / nft-detail.test.tsx (loading skeleton)      |

Implemented resilience evidence:

- No dedicated `resilience.spec.ts` exists. Slow/variable latency is exercised
  with inline `msw` `delay()` in `cart.test.tsx` (120/50 ms) and
  `nft-detail.test.tsx` (100/150 ms); the MSW `latency` scenario (150 ms on all
  REST handlers) exists in the mock layer but is not selected by any automated
  test.
- Network failure: optimistic quantity update rolled back with accessible
  error (`cart.test.tsx`).
- HTTP 4xx/5xx: availability conflict 409 (cart/nft-detail), session 401 and
  `session-expired` (auth.spec.ts), coupon/order conflicts and 403 per-user
  order isolation (`domain.test.ts`, `order-page.test.tsx`), order timeout 504
  (`order-recovery.spec.ts`).
- Retry/recovery: catalog error retry, idempotency-key retry after a 504
  (`checkout.test.tsx`, `order-recovery.spec.ts`).
- Skeletons with shimmer: loading states asserted in `cart.test.tsx` and
  `nft-detail.test.tsx`.

---

## 14. Visual Regression

| ID      | Requirement                | Test         |
| ------- | -------------------------- | ------------ |
| VIS-01  | Home baseline at 390px     | visual.spec  |
| VIS-02  | Home baseline at 768px     | visual.spec  |
| VIS-03  | Home baseline at 1440px    | visual.spec  |
| VIS-04  | NFT Detail at 390px        | visual.spec  |
| VIS-05  | NFT Detail at 768px        | visual.spec  |
| VIS-06  | NFT Detail at 1440px       | visual.spec  |
| VIS-07  | Cart at 390px              | visual.spec  |
| VIS-08  | Cart at 768px              | visual.spec  |
| VIS-09  | Cart at 1440px             | visual.spec  |
| VIS-10  | Payment at 390px           | visual.spec  |
| VIS-11  | Payment at 768px           | visual.spec  |
| VIS-12  | Payment at 1440px          | visual.spec  |

Implemented visual regression evidence:

- `tests/e2e/visual.spec.ts` executes 4 cases — Home, NFT Detail, Cart and
  Payment. Each case iterates the viewports explicitly (390x844, 768x1024,
  1440x900), so a normal run performs 12 real Playwright
  `toHaveScreenshot()` comparisons (baseline vs. fresh capture).
- Versioned baselines exist for all 12 comparisons under
  `tests/e2e/visual.spec.ts-snapshots/`.
- Every case starts from deterministic mock state via
  `POST /api/__mock/reset`; the cart and payment cases render the seeded Ada
  cart.
- The 4 cases run once, on the desktop project; the mobile project skips
  them because the viewports are set explicitly by the spec (re-running
  would duplicate the same three widths). Mobile layout continuity is still
  exercised by the functional suite on both projects.

---

## 15. Lighthouse

Required audits:

```text
Home
NFT Detail
```

Profiles:

```text
Desktop
Mobile
```

Measurements:

```text
3 per page/profile
```

Report median:

- Performance;
- Accessibility;
- Best Practices;
- SEO.

Record:

- LCP;
- CLS;
- TBT.

Implemented Lighthouse evidence:

- `scripts/lighthouse/audit.mjs` runs Home and NFT Detail on mobile and
  desktop profiles (4 scenarios × 3 runs), computes category medians
  and compares them to the README thresholds, and exits non-zero when a
  scenario fails.
- Run via `npm run audit:lighthouse` (builds first). Reports per run
  (HTML/JSON) and aggregated `summary.json` are delivered under
  `reports/lighthouse/`.
- Medians (Lighthouse 13.4.1, production build, default seed):

  | Scenario            | P    | A   | BP  | SEO | LCP (ms) | CLS    | TBT (ms) | Result |
  | ------------------- | ---: | --: | --: | --: | -------: | -----: | -------: | ------ |
  | Home mobile         | 91   | 100 | 96  | 92  | 3156     | 0.0004 | 64       | PASS   |
  | NFT Detail mobile   | 90   | 100 | 96  | 92  | 3229     | 0.0000 | 22       | PASS   |
  | Home desktop        | 99   | 96  | 96  | 92  | 802      | 0.0003 | 0        | PASS   |
  | NFT Detail desktop  | 95   | 100 | 96  | 92  | 705      | 0.1274 | 0        | PASS   |

- Initial mobile runs scored P=88/89 (below the ≥90 target); the cause was
  render-blocking CSS (~150 ms flagged by Lighthouse) plus the LCP image
  being lazy/non-prioritized behind the large JS bundle. The production
  build now inlines the stylesheet (`scripts/inline-css.mjs`) and marks the
  LCP hero/catalog/gallery images `fetchPriority="high"` (first catalog row
  eager), which lifted both mobile medians to 91/90. No functionality or
  visual fidelity changed; the audit still loads the real artwork, fonts and
  features.

---

## 16. Requirement Traceability

Every implemented requirement should eventually map to:

```text
Requirement
    ↓
Implementation
    ↓
MSW scenario
    ↓
Automated test
    ↓
Definition of Done
```

Missing evidence must be explicitly marked rather than assumed complete.
