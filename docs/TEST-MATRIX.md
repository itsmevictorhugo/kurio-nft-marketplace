# Test Matrix

## 1. Purpose

Map challenge requirements to implementation evidence and automated tests.

The README remains authoritative.

---

## 2. Catalog

| ID     | Requirement            | Test            |
| ------ | ---------------------- | --------------- |
| CAT-01 | Search                 | catalog.spec    |
| CAT-02 | Combined filters       | catalog.spec    |
| CAT-03 | Sorting                | catalog.spec    |
| CAT-04 | Pagination             | catalog.spec    |
| CAT-05 | URL persistence        | catalog.spec    |
| CAT-06 | Browser history        | catalog.spec    |
| CAT-07 | Empty results          | catalog.spec    |
| CAT-08 | API failure            | catalog.spec    |
| CAT-09 | Out-of-order responses | resilience.spec |

---

## 3. NFT Detail

| ID     | Requirement         | Test           |
| ------ | ------------------- | -------------- |
| NFT-01 | Direct access       | nft.spec       |
| NFT-02 | Gallery             | nft.spec       |
| NFT-03 | NFT information     | nft.spec       |
| NFT-04 | Edition             | nft.spec       |
| NFT-05 | Quantity limit      | nft.spec       |
| NFT-06 | Not found           | nft.spec       |
| NFT-07 | Unavailable edition | nft.spec       |
| NFT-08 | Favorite            | favorites.spec |

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

| ID     | Requirement            | Test           |
| ------ | ---------------------- | -------------- |
| FAV-01 | Add favorite           | favorites.spec |
| FAV-02 | Remove favorite        | favorites.spec |
| FAV-03 | Persistence            | favorites.spec |
| FAV-04 | Optimistic update      | favorites.spec |
| FAV-05 | Rollback after failure | favorites.spec |

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

| ID         | Requirement               | Test         |
| ---------- | ------------------------- | ------------ |
| PROFILE-01 | View profile              | profile.spec |
| PROFILE-02 | Edit profile              | profile.spec |
| PROFILE-03 | Avatar                    | profile.spec |
| PROFILE-04 | Password change           | profile.spec |
| PROFILE-05 | Validation errors         | profile.spec |
| PROFILE-06 | Persistence after refresh | profile.spec |

---

## 10. Wallets

| ID        | Requirement       | Test         |
| --------- | ----------------- | ------------ |
| WALLET-01 | List wallets      | wallets.spec |
| WALLET-02 | Primary wallet    | wallets.spec |
| WALLET-03 | Secondary wallet  | wallets.spec |
| WALLET-04 | Add wallet        | wallets.spec |
| WALLET-05 | Edit wallet       | wallets.spec |
| WALLET-06 | Validation errors | wallets.spec |

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

| ID      | Requirement         | Test               |
| ------- | ------------------- | ------------------ |
| A11Y-01 | Keyboard navigation | accessibility.spec |
| A11Y-02 | Visible focus       | accessibility.spec |
| A11Y-03 | Dialog focus        | accessibility.spec |
| A11Y-04 | Form validation     | accessibility.spec |
| A11Y-05 | Accessible feedback | accessibility.spec |
| A11Y-06 | Drawer focus        | accessibility.spec |

---

## 13. Resilience

| ID     | Requirement      | Test            |
| ------ | ---------------- | --------------- |
| RES-01 | Slow network     | resilience.spec |
| RES-02 | Variable latency | resilience.spec |
| RES-03 | Network failure  | resilience.spec |
| RES-04 | HTTP 4xx         | resilience.spec |
| RES-05 | HTTP 5xx         | resilience.spec |
| RES-06 | Retry/recovery   | resilience.spec |
| RES-07 | Skeletons        | resilience.spec |

---

## 14. Visual Regression

Required baselines:

```text
Home
NFT Detail
Cart
Payment
```

Required contexts:

```text
Desktop
Mobile
```

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
