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
| Authentication       | PENDING   | login/register/profiles UI not implemented; session-token placeholder only |
| Favorites            | PENDING   | API-driven from detail; dedicated favorites UI pending |
| Checkout/Orders      | PENDING   | `/checkout` and `/order/*` are placeholders |
| Profile/Wallets      | PENDING   | API contracts exist; UI pending |
| Realtime             | PENDING   | Socket.IO milestone not started; cart realtime explicitly deferred (ADR-013) |
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
