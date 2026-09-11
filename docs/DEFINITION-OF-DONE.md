# Definition of Done

## 1. General Rule

A feature is DONE only when the applicable requirements are implemented, verified and documented.

Rendering the happy-path UI is not sufficient.

---

# 2. Functional

- [ ] Required behavior implemented.
- [ ] Happy path works.
- [ ] Required error states work.
- [ ] Required recovery behavior works.
- [ ] Out-of-scope behavior is not falsely represented as successful.

---

# 3. API

- [ ] Correct REST resource exists.
- [ ] Axios is used.
- [ ] TanStack Query is used for remote state.
- [ ] Request/response types exist.
- [ ] Relevant errors are represented.
- [ ] MSW handler exists.
- [ ] MSW scenario is deterministic.

---

# 4. State

- [ ] Loading state.
- [ ] Empty state where applicable.
- [ ] Error state.
- [ ] Success state.
- [ ] Background update state where applicable.
- [ ] Cache invalidation/update is coherent.
- [ ] User data is isolated.

---

# 5. Realtime

When applicable:

- [ ] Socket.IO client is used.
- [ ] Event contract exists.
- [ ] Version is handled.
- [ ] Duplicate events are safe.
- [ ] Stale events are ignored.
- [ ] Reconnection is handled.
- [ ] REST reconciliation is handled.
- [ ] Previous session cannot affect current session.

---

# 6. Visual

- [ ] Desktop follows Figma.
- [ ] Mobile follows Figma where a frame exists.
- [ ] Responsive behavior works where no mobile frame exists.
- [ ] Typography is consistent.
- [ ] Colors are consistent.
- [ ] Spacing is consistent.
- [ ] Images/assets follow the supplied design.
- [ ] shadcn components are visually adapted.

---

# 7. Accessibility

- [ ] Keyboard navigation.
- [ ] Visible focus.
- [ ] Semantic HTML.
- [ ] Labels.
- [ ] Associated validation errors.
- [ ] Meaningful image alternatives.
- [ ] Contrast.
- [ ] State not communicated only by color.
- [ ] Mutation feedback.
- [ ] Realtime feedback.
- [ ] Dialog focus.
- [ ] Drawer focus.
- [ ] No unintended horizontal overflow.
- [ ] Zoom does not hide content.

---

# 8. Responsive

Verify:

- [ ] 390px.
- [ ] 768px.
- [ ] 1440px.

Check:

- [ ] navigation;
- [ ] catalog;
- [ ] filters;
- [ ] NFT detail;
- [ ] cart;
- [ ] checkout;
- [ ] forms;
- [ ] account pages.

---

# 9. Testing

- [ ] Relevant Playwright test exists.
- [ ] Test starts from isolated state.
- [ ] Scenario is deterministic.
- [ ] Failure/recovery is covered where required.
- [ ] Chromium execution passes.
- [ ] Desktop execution passes.
- [ ] Mobile execution passes.
- [ ] Visual baseline updated only intentionally.

---

# 10. Performance

Where applicable:

- [ ] Lighthouse configuration exists.
- [ ] Build is optimized.
- [ ] Images use the real delivery assets.
- [ ] Fonts are included as required.
- [ ] No functionality was removed solely for Lighthouse.
- [ ] LCP recorded.
- [ ] CLS recorded.
- [ ] TBT recorded.

---

# 11. Documentation

- [ ] API contract updated.
- [ ] Realtime contract updated.
- [ ] Architecture updated when decisions were made.
- [ ] Test matrix updated.
- [ ] Requirement traceability updated.

---

# 12. Git

Before completion:

- [ ] `git status` reviewed.
- [ ] `git diff` reviewed.
- [ ] No unrelated changes.
- [ ] Focused commit created.
- [ ] Commit message describes the milestone.

---

# 13. Final Delivery

Before submission:

- [ ] Clean checkout works.
- [ ] Lockfile committed.
- [ ] Assets committed.
- [ ] Mocks committed.
- [ ] Fixtures committed.
- [ ] Tests committed.
- [ ] Audit configuration committed.
- [ ] Public deployment works.
- [ ] Direct route access works.
- [ ] Refresh works.
- [ ] README contains setup.
- [ ] README contains fictional credentials.
- [ ] README documents scenarios.
- [ ] README documents scenario reset.
- [ ] README documents required commands.
- [ ] README documents failure reproduction.

---

# 14. Milestone Status

Track each milestone against the applicable sections above. A milestone is
DONE only when every applicable box that is marked is verified and the
evidence is recorded.

| Milestone            | Status    | Evidence |
| -------------------- | --------- | -------- |
| Foundation           | DONE      | `src/app/router`, layouts, dev MSW bootstrap |
| Catalog + NFT Detail | DONE      | `catalog.spec`, `nft.spec` equivalents in Vitest (`catalog.test.tsx`, `nft-detail.test.tsx`) |
| Cart                 | DONE      | `src/features/cart/*`, `cart.test.tsx`, `tests/e2e/cart.spec.ts` (desktop + mobile) |
| Authentication       | PARTIAL   | login implemented for the checkout guard (`login.test.tsx`, `checkout.spec`); registration/profile management UI pending |
| Favorites            | PENDING   | API-driven from detail; dedicated favorites UI pending |
| Checkout/Orders      | DONE      | `src/features/checkout/*`, `src/features/orders/*`, `checkout.test.tsx`, `checkout-attempt.test.ts`, `order-page.test.tsx`, `tests/e2e/checkout.spec.ts`, `tests/e2e/order-recovery.spec.ts` (desktop + mobile) |
| Profile/Wallets      | PENDING   | read-side hooks used by checkout; management UI pending |
| Realtime             | DONE      | `src/features/realtime/*` (version guard + `RealtimeSync`), `src/mocks/socket/*` hub over the MSW `ws` transport, `realtime.spec.ts` (desktop + mobile, RT-01..11), `version-guard.test.ts` (8) |
| Accessibility suite  | PENDING   | `accessibility.spec` not yet written; per-component a11y verified in Vitest/E2E |
| Visual regression    | PENDING   | baselines for Home/NFT Detail/Cart not yet committed |
| Lighthouse           | PENDING   | audit config and report pending |

Cart milestone definition of done — verified:

- Functional: loading skeleton, empty state, items, quantity edit, remove,
  clear, coupon apply/remove/invalid/expired, optimistic UI with rollback,
  409 banner and reconcile, error + retry.
- API: all cart/quote calls use Axios + TanStack Query with typed
  request/response helpers; MSW handlers for cart/quote/coupon are
  deterministic; mock-only reset/scenario endpoints exist.
- State: quote cache keyed by identity + coupon; `setSessionToken`/
  `clearSessionToken` purge `['cart']`/`['quote']` caches; guest and
  authenticated carts never share cache entries.
- Money: all totals rendered verbatim from the quote; `lib/money/eth.ts`
  avoids floating-point ETH arithmetic.
- Visual: 390px and 1440px layouts verified through Playwright mobile/desktop
  projects; no horizontal overflow; shadcn primitives adapted to the Kurio
  theme.
- Accessibility: labelled regions (`Itens do carrinho`, `Resumo da compra`),
  coupon label, quantity group, `role="status"`/`role="alert"` feedback,
  keyboard-reachable steppers and focus-visible rings, state never conveyed
  only by color.
- Testing: `cart.test.tsx` (18) and `tests/e2e/cart.spec.ts` (desktop + mobile
  14) pass; each E2E starts from isolated mock state.
- Realtime: not applicable by scope — deferred (ADR-013).

Checkout/Orders milestone definition of done — verified:

- Functional: guarded routes with login redirect (`/checkout`, `/order/$orderId`),
  collector data, simulated wallet connect/refused/disconnect, network
  mismatch guard, review summary, quote revalidation before confirmation with a
  forced-review banner, order creation, pending → confirmed/rejected via
  scenario-driven reads + polling, receipt, back-to-cart after rejection and
  full empty-cart recovery states.
- API: `POST /orders` with an `Idempotency-Key` header, server-side
  revalidation (`stale_quote`, `availability_conflict`, `coupon_invalid`,
  `coupon_expired`), `GET /orders/:orderId` with per-user isolation (403 for
  another user → not found UX); Axios + TanStack Query for every call; MSW
  scenarios `payment-confirmed`, `payment-rejected`, `order-timeout`;
  `GET /orders/:orderId` advances pending orders deterministically.
- Idempotency: the attempt store persists a stable attempt id per user; the
  key is `checkout-<attemptId>`, stable across repeated clicks, the single 504
  retry, and refresh; rotates only when totals change (verified in
  `checkout-attempt.test.ts` and `checkout.test.tsx`).
- Money: revalidated totals compared with `compareEthAmounts` (decimal), never
  floating point; receipt renders the server snapshot verbatim.
- State: cart and quote caches invalidated on confirmed orders; rejected and
  pending orders keep the cart intact; expired session redirects to login and
  private caches are cleared per session policy.
- Visual: checkout page and order states verified at 390px and 1440px through
  the Playwright mobile/desktop projects; shadcn primitives adapted to the
  Kurio theme.
- Accessibility: labelled wallet/network groups, `role="status"`/`role="alert"`
  banners for revalidation and connection outcomes, keyboard-reachable controls,
  focus-visible rings, error messages associated with fields.
- Testing: `checkout.test.tsx` (11), `checkout-attempt.test.ts` (12),
  `order-page.test.tsx` (7), `login.test.tsx` (7), and the E2E suites
  `tests/e2e/checkout.spec.ts` (desktop + mobile) and
  `tests/e2e/order-recovery.spec.ts` (desktop + mobile) pass; each E2E starts
  from isolated mock state via `POST /api/__mock/reset` and selects scenarios
  via `POST /api/__mock/scenario`.
- Realtime: not used here — order status advances by scenario-driven reads +
  polling (ADR-018); Socket.IO `order.updated` stays in the realtime milestone
  (ADR-013).

Realtime milestone definition of done — verified:

- Functional: a live `nft.updated` refreshes the catalog, NFT detail and cart;
  a sold-out edition blocks checkout; a stale quote is detected and the
  confirmation is blocked until re-accepted; a pending order survives a
  disconnect, is recovered after reconnect and resolves (confirmed) exactly
  once via `order.updated`; duplicate and stale events are rejected without any
  REST refetch; session expiry tears down the previous session's socket and
  cache and the next session is isolated.
- API/transport: the real `socket.io-client` path over the MSW
  `ws` transport + `@mswjs/socket.io-binding`; the mock hub broadcasts real
  envelopes; mock control endpoints (`/api/__mock/scenario`,
  `/api/__mock/socket/emit`, `/api/__mock/socket/disconnect`,
  `/api/__mock/socket/connections`) drive the transport; MSW is the only
  network mocking boundary and no UI code simulates events.
- Ordering: every envelope carries `eventId`/`resourceId`/`version`; the
  version guard applies only strictly newer events and drops duplicates/older
  ones (`version-guard.test.ts`, 8 tests); REST refetch after invalidations is
  authoritative and can never regress state.
- State: accepted events invalidate precise caches (`nft`, `order`, `quote`);
  `order.updated` events for another session are dropped; React Query cache is
  never written by the mock layer.
- Money: totals continue to render verbatim from the revalidated quote;
  `compareEthAmounts` guards the stale-quote detection.
- Realtime/a11y: realtime feedback announces the forced-review values banner
  (`role="status"`); the sold-out and pending states remain accessible.
- Testing: `tests/e2e/realtime.spec.ts` RT-01..11 (desktop + mobile, 14) pass;
  `version-guard.test.ts` (8) and the extended `mocks/domain.test.ts` version
  assertions pass; every E2E starts from isolated mock state and drives events
  through the real transport (no test calls app realtime handlers directly).
