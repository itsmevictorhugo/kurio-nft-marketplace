# Architecture

## 1. Status

Initial architecture document.

This document records implementation decisions that are not fully specified by the challenge README or Figma.

The README and Figma remain authoritative.

---

# 2. Architecture Goals

The architecture must prioritize:

1. correctness;
2. explicit data flow;
3. mandatory stack compliance;
4. user/session isolation;
5. deterministic mocking;
6. realtime synchronization;
7. testability;
8. responsive visual fidelity;
9. maintainability within the challenge deadline.

---

# 3. Application Structure

Preferred structure:

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── layouts/
│
├── components/
│   ├── ui/
│   └── shared/
│
├── features/
│   ├── auth/
│   ├── catalog/
│   ├── nft/
│   ├── favorites/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── profile/
│   └── wallets/
│
├── lib/
│   ├── axios/
│   ├── query/
│   ├── socket/
│   └── utils/
│
├── mocks/
│   ├── handlers/
│   ├── fixtures/
│   ├── scenarios/
│   ├── database/
│   └── socket/
│
├── types/
└── styles/
```

This structure may be adjusted when implementation evidence justifies a change.

---

# 4. State Strategy

Server state:

```text
TanStack Query
```

URL state:

```text
TanStack Router search params
```

Realtime synchronization:

```text
Socket.IO
→ application event handling
→ TanStack Query/cache synchronization
```

Local UI state should remain local unless it needs broader ownership.

Avoid introducing a global client-state library without a concrete requirement.

---

# 5. Cache Strategy

Cache keys must include all relevant identity and query dimensions.

Private resources must be isolated by authenticated user.

After mutations:

- update precise cache when safe;
- invalidate related queries when necessary;
- avoid stale private data surviving logout/user switching.

Realtime updates should update or invalidate only affected resources.

After reconnection, REST reconciliation restores authoritative state.

---

# 6. Session Policy

Authentication is simulated through the mock API.

Session restoration must work after refresh.

Expiration must preserve enough context for the user to resume the interrupted flow.

Logout/user switching must remove:

- private cached data;
- previous session subscriptions;
- previous session realtime effects.

Passwords are never persisted in plaintext.

---

# 7. Cart Strategy

The cart must survive refresh.

Visitor items must be preserved when authentication occurs.

Cart totals are based on API quotation.

ETH amounts remain decimal strings.

Realtime NFT changes must synchronize the cart.

---

# 8. Checkout Strategy

Checkout follows:

```text
cart
 ↓
review
 ↓
revalidation
 ↓
confirmation
 ↓
order creation
 ↓
pending
 ↓
order update
 ↓
confirmed/rejected
```

A stale quote cannot be confirmed.

Order creation uses idempotency.

---

# 9. REST / Socket.IO Reconciliation

REST is authoritative for resource reconciliation.

Socket.IO provides realtime updates.

Conceptually:

```text
REST
 ↓
initial authoritative state

Socket.IO
 ↓
incremental realtime updates

Reconnect
 ↓
REST reconciliation
 ↓
latest authoritative state
```

Duplicate or stale realtime events must not regress state.

---

# 10. Mock Architecture

MSW provides the network boundary.

The mock system maintains shared state for:

- users;
- sessions;
- NFTs;
- favorites;
- carts;
- profiles;
- wallets;
- orders.

Scenarios are deterministic.

Reset restores a known state.

Realtime mocks must exercise the real Socket.IO client path.

---

# 11. Error and Recovery Model

The implementation explicitly supports the failure scenarios required by the challenge:

- network failure;
- HTTP failures;
- session expiration;
- validation conflicts;
- invalid/expired coupons;
- price changes;
- availability changes;
- payment rejection;
- order timeout;
- reconnect/recovery.

Failures must not silently become successful operations.

---

# 12. Visual Architecture

Tailwind CSS provides styling.

shadcn/ui provides reusable accessible primitives.

The components are customized to match the supplied Figma visual system.

No generic shadcn theme should override the Figma identity.

---

# 13. Responsive Architecture

The Figma desktop/mobile frames define the intended responsive composition.

Required verification widths:

```text
390
768
1440
```

Components should adapt composition where required rather than merely reducing dimensions.

---

# 14. Accessibility Architecture

Accessibility is considered at component and feature level rather than added only at the end.

Focus management is required for:

- dialogs;
- drawers;
- navigation transitions where appropriate.

Mutation and realtime feedback must be communicated accessibly.

---

# 15. Testing Architecture

Playwright tests operate against the same MSW scenarios used by the application.

Tests must observe user-visible behavior.

Realtime tests must exercise:

```text
MSW
→ Socket.IO
→ socket.io-client
→ application
```

Tests must start from isolated state.

---

# 16. Performance Architecture

The production build is the Lighthouse target.

No special fake application mode should exist solely to improve Lighthouse scores.

Images, fonts and required functionality must remain representative of the delivered application.

---

# 17. Decisions Log

Decisions that are not directly specified by README/Figma should be recorded here.

Format:

```text
### ADR-XXX — Decision title

Context:
...

Decision:
...

Reason:
...

Alternatives considered:
...

Impact:
...
```

Do not fabricate decisions before they are actually made.

### ADR-001 — Foundation routing and order-confirmation compatibility route

Context:
The README defines the conceptual order route as `/order/$orderId`, while the
foundation task also requires a placeholder at `/order-confirmation`.

Decision:
The foundation exposes both placeholder routes. `/order/$orderId` remains the
canonical route for a persisted order, and `/order-confirmation` is retained as
the task-required compatibility placeholder until the order flow is implemented.

Reason:
This preserves the README route without omitting the explicit foundation-task
route. Neither route currently represents order behavior.

Impact:
The later order milestone must direct confirmed orders to `/order/$orderId` and
decide whether `/order-confirmation` should redirect or be removed.

### ADR-002 — Development mock bootstrap

Context:
The application needs a reusable MSW network boundary from its first runnable
state, before domain handlers are implemented.

Decision:
The browser worker starts before React renders in development, controlled by
`VITE_ENABLE_MSW` (enabled unless explicitly set to `false`). The foundation
registers only a non-domain health handler; fixtures, database, scenarios, and
reset entry points are separate modules for later feature handlers.

Reason:
This keeps mock behavior outside React components and creates one deterministic
state boundary shared by development and tests without inventing product APIs.

Impact:
Feature milestones must add shared-state handlers and scenarios rather than
embedding mock responses in components or services.

### ADR-003 — Coupon validation at quote creation and order creation

Context:
The README requires coupon application in the cart flow and coupon
revalidation before checkout, but no cart-level coupon resource is defined.

Decision:
Coupons are applied when a quote is created (`POST /quote` with an optional
`couponCode`) and are revalidated against current mock state when that quote
is used to create an order. Invalid coupons return `coupon_invalid`; expired
coupons return `coupon_expired` at both points. There is no coupon state on
the cart itself.

Reason:
The quotation is the authoritative snapshot for checkout values, so coupon
application belongs with the quote rather than the cart.

Impact:
The UI applies/removes coupons by requesting a new quote with or without the
code. A coupon that expires between quotation and confirmation surfaces as an
API error at order creation instead of silently applying a stale discount.
Idempotent recovery of an already-created order is exempt from revalidation.

### ADR-004 — Guest cart identity via `X-Guest-Id`

Context:
Carts must exist before authentication and visitor items must survive login,
but unauthenticated requests carry no session token.

Decision:
Guest cart and quotation requests carry an `X-Guest-Id` header; mock carts
are keyed `guest:<id>`. On login, the guest cart is merged into the user cart
by NFT+edition, capped by current edition availability and `maxPerOrder`, and
the guest cart is then cleared. Requests without the header fall back to the
shared `guest:default` cart.

Reason:
The smallest transport-level identity that lets the mock API isolate and
merge guest carts without introducing anonymous accounts.

Impact:
The application must generate and persist a stable guest id per browser and
always send the header for guest cart calls. The `guest:default` fallback is
a mock convenience for fixtures, not a multi-visitor isolation guarantee, and
must be documented as such.

### ADR-005 — Mock scenario selection and state reset

Context:
Scenarios must be deterministic and reusable across development,
demonstration and Playwright, and reset must restore a known state.

Decision:
The active scenario is module-level state selected through
`selectMockScenario()`. Scenario-specific data mutations (for example
`sold-out` and `price-changed`) are applied to the shared mock database at
selection time; handlers consult the active scenario per request.
`resetMockState()` recreates the seed database and returns the scenario to
`default`.

Reason:
Keeping scenario behavior in the mock layer, outside components and handlers'
core logic, gives every test and demo a single deterministic entry point.

Impact:
Scenario effects are synchronous database mutations. Realtime-emitting
scenarios will need to publish events through the Socket.IO mock transport
when realtime is implemented; this decision does not cover that yet.

---

# 18. Figma Deviations

Any intentional visual deviation from the supplied Figma must be documented here.

Format:

```text
### Figma Deviation — <component/screen>

Original:
...

Implemented:
...

Reason:
...

Impact:
...
```

If there are no deviations:

```text
No intentional deviations currently recorded.
```

---

# 19. Known Limitations

Document limitations caused by:

- challenge scope;
- mock environment;
- browser/runtime constraints;
- supplied assets;
- Socket.IO/MSW transport limitations.

Do not hide known limitations.
