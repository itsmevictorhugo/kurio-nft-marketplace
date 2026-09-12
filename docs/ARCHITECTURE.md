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

Realtime NFT changes must synchronize the cart (see ADR-013: deferred to the
realtime milestone; REST refetch is authoritative in the meantime).

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

The mock database is serialized to `sessionStorage` and restored when the
module boots again, so server state survives a page refresh the same way a
real backend would (see ADR-012).

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

### ADR-006 — Catalog URL state and sort presets

Context:
The Home catalog must represent search, filters, sorting and pagination in
the URL, but the REST contract exposes only three sort values
(`name-asc`, `price-asc`, `price-desc`) and no recency or network/price-range
filters.

Decision:
Catalog state lives in TanStack Router search params validated by
`validateCatalogSearch` (`search`, `category`, `creator`, `sort`, `page`).
`page` is only serialized when greater than 1. Any filter/search/sort change
resets `page`. The Home tabs are sort presets: "Todos os NFTs" (no sort),
"Novos lançamentos" (`name-asc`) and "Em alta" (`price-desc`), sharing the
same `sort` URL parameter as the sort select. Search input updates use
history-replace to avoid one history entry per keystroke; filter clicks push.

Reason:
One URL-backed state representation prevents a second conflicting catalog
state, and preset tabs reuse an existing API capability instead of inventing
new sort semantics.

Impact:
Price-range and network filters are backed by the minimal `minPrice`,
`maxPrice` and `network` catalog query parameters (see ADR-007 for the
`network` domain field). Out-of-scope navigation (Mercado, Criadores,
Aprenda, footer columns, editorial links) is rendered inertly rather than as
fake links.

### ADR-007 — NFT artwork assets

Context:
The Figma Home uses illustrated artwork. The challenge later supplied four
real artwork assets (`nft-artwork-03/07/08/10.png`, 500×500), now served from
`public/assets/nft/`. The mock domain previously carried no image data.

Decision:
`Nft` records carry a required `imageUrl` field, and the expanded seed maps
each record to one of the four assets deterministically by visual coherence
with its name (green jacket/sunglasses, purple hoodie/bucket hat, cream suit,
golden headphones). Marketing-only sections (hero, banners, editorial) use a
static asset map in `src/features/catalog/lib/artwork.ts` because they are
not backed by NFT records. Cards, hero and the featured panel render real
`<img>` elements with `object-cover` inside fixed aspect-ratio frames.

Reason:
Keeps artwork selection data-driven for NFT records (no per-component
hardcoding) and keeps the data/UI boundary clean for future real assets.

Impact:
The reference screenshots under `public/design/` remain design references
only. When real per-NFT assets arrive, only the seed mapping changes.

### ADR-008 — NFT detail route and pre-auth identity scaffold

Context:
The detail milestone requires `/nfts/:nftId` (task-defined) while the
foundation exposed a `/nft/$id` placeholder, and the favorites/cart APIs need
an authenticated token or a stable guest identity before the authentication
milestone exists.

Decision:
`/nfts/$nftId` is the canonical NFT detail route; `/nft/$id` redirects to it
so the foundation link keeps working. Home cards and the featured panel link
directly to `/nfts/$nftId`. Two tiny storage helpers were introduced without
UI: `features/auth/session.ts` (session token in `localStorage`) and
`features/cart/guest-id.ts` (persistent `X-Guest-Id` via `crypto.randomUUID`).
The detail page resolves its request identity as "token if present, otherwise
guest id", and favorites for guests intentionally call the real API so the
401 contract drives the "entre para favoritar" feedback.

Reason:
Keeps the detail slice fully functional through the REST/MSW boundary without
implementing authentication or a cart page ahead of schedule.

Impact:
The login milestone will replace the storage helpers' callers with the real
session flow (login/logout/user switch must clear the token and private query
caches). The guest id is per-browser, matching ADR-004; the shared
`guest:default` fallback is never used by the app because the id is always
generated.

### ADR-009 — NFT Detail reference-aligned presentation

Context:
The NFT Detail Figma frames show edition pills as `1/18`, `1/58`, `1/1` and
`ABERTA`, a metadata block with exactly `ID do token`, `Coleção` and
`Atributos`, a detail tab with `Rede`/`Contrato`/`Direitos autorais` and rich
pt-BR prose, and a mobile purchase block with price and a full-width
"Comprar NFT" CTA. The initial implementation rendered hardcoded
category/creator metadata and repeated the single desktop CTA on mobile.

Decision:
- `NftEdition` gains optional presentation-only `total`/`editionNumber`;
  `available` and `maxPerOrder` remain the authoritative purchasing fields.
- `Nft` gains optional `attributes: string[]`, a required `contract` and a
  required presentation `tokenId`. Only the seed constructs `Nft` records, so
  required fields are safe. `contract` is derived deterministically from
  (collection, creator) — an FNV-1a fingerprint expanded via xorshift into 40
  uppercase hex chars — and rendered truncated reference-style
  (`0x7A42…19E8`) in the tab rail. `tokenId` is a seeded identifier shown in
  the top "ID do token" row (Emerald seeded as `842`) and is intentionally
  not derived from the database id.
- The top metadata block renders only ID do token, Coleção and Atributos
  (attributes from token data).
- The detail tab renders token-data-driven pt-BR editorial prose and a right
  rail limited to Rede, Contrato and Direitos autorais.
- Desktop keeps stepper + "Comprar" + labeled favorite; mobile shows a
  `md:hidden` block with stepper, price and a full-width "Comprar NFT" button.
  Both CTAs share one handler and the single `aria-live` feedback paragraph.
- The collection carousel reserves layout space while loading by rendering the
  shared `NftCardSkeleton` grid and returns null only when the settled result
  has zero related items.

Reason:
Matches the Figma composition without inventing product behavior, and keeps
all appearance fields data-driven (seed-only) so the REST contract surface
stays minimal.

Alternatives considered:
- Hardcoding the edition pills or `Atributos` string in the component
  (rejected: duplicates seed data into components).
- Reusing `available` to derive the edition size (rejected: equals remaining
  stock, not the edition total).

Impact:
Only seed/domain/UI files change. REST contracts, cart/order semantics,
favorite behavior and the existing loading/error/not-found states are
unchanged.

### ADR-010 — Quote-driven cart summary, computed by the API

Context:
The cart must display subtotal, discount, network fee, total and per-line
totals, and cupons must affect only the discount. ETH amounts must preserve
decimal precision.

Decision:
The cart page derives every money value from the quotation endpoint. The
quote cache is keyed `['quote', identity, couponCode ?? null]` and is enabled
only while the cart has items; requesting a quote with a coupon code applies
it, requesting without one removes it. The UI renders `subtotal`, `discount`,
`networkFee`, `total` and each `QuoteItem.total` verbatim as decimal ETH
strings through `lib/money/eth.ts` utilities. No arithmetic happens in the
browser; discount sign and totals therefore match the server exactly.

Reason:
The quote is the authoritative price snapshot (see ADR-003), so all money
must flow through it rather than being recomputed on the client; this also
guarantees the no-floating-point rule is about formatting, not math.

Impact:
The coupon input only instructs quote creation; the summary is a pure view of
the quote. A coupon error surfaces from the quote request as an accessible
inline message and the plain (no-coupon) quote is restored.

### ADR-011 — Cart mutations: optimistic update, rollback and reconciliation

Context:
Quantity changes must feel immediate, but the server remains authoritative on
availability and quantity; a failed mutation must not leave stale UI state.

Decision:
Quantity updates are optimistic (`setQueryData` with the next quantity),
serialized per item so overlapping taps cannot interleave, and rolled back to
the previous value when the PATCH fails. On settle, the cart and quote queries
are invalidated and refetched so authoritative state wins. A specific `409
availability_conflict` response renders an accessible inline banner and the
refetch reconciles the quantity; any other quantity/remove/clear failure
renders a generic retry message. Add-to-cart keeps its synchronous
submitting guard to prevent duplicate submissions (idempotency requirement
for order creation is handled separately at order time).

Reason:
Optimistic rendering matches the challenge's direct-feedback UX while the
invalidation/refetch loop satisfies the "server is authoritative" and
"duplicates must not regress state" rules without inventing distributed
semantics.

Impact:
Only cart item mutations are optimistic; removal resets the cart summary via
quote invalidation, and clearing navigates the user to the empty state only
after the refetched cart confirms it is empty.

### ADR-012 — Durable mock database across page reloads

Context:
The mock database lives in page scope, so any full navigation re-runs its
module and resets every cart, session, order and scenario — a real backend
would not forget server state on refresh. Refresh persistence (CART-09),
guest→user preservation and scenario-based E2E flows all require durable
server state across page loads.

Decision:
The mock layer serializes the full database (users, sessions, NFTs, carts,
favorites, quotes, orders, wallets, coupons, idempotency records, counters) to
`sessionStorage` and rehydrates it when the module boots again. Persistence is
gated to real browsers (`'serviceWorker' in navigator`), so node/jsdom unit and
integration suites keep their clean per-test databases. Every database-mutating
handler calls `persistMockDatabase()`; `resetMockDatabase()` clears the stored
snapshot and restores the seed.

Reason:
This keeps the "server is durable" semantics of cart and scenario flows honest
in the browser without changing the REST contract or application code.

Impact:
`sessionStorage` is per-tab, so a brand-new tab starts from the seed (by
design, like a fresh backend); E2E suites already reset state per test.
Serialization maps Maps/Sets to entry arrays and rehydrates them.

### ADR-013 — Realtime cart synchronization deferred to the realtime milestone

Context:
The README requires Socket.IO synchronization of NFT changes into the cart,
but this milestone explicitly excludes realtime transport.

Decision:
No Socket.IO events are emitted or consumed for cart state in this milestone.
The cart reads exclusively from REST and reconciles after every mutation or
refetch. Realtime handling of `nft.updated` into the cart, stale-quote
detection, duplicate/stale event guards and reconnection are scheduled for the
realtime milestone and are not simulated from UI code.

Reason:
"Realtime Ordering" requires the real socket path (per the critical rules);
simulating it with UI-driven cache changes would violate the socket-only rule.

Impact:
CART-11/CART-12 in the test matrix were pending until the realtime milestone;
they are now covered by `realtime.spec.ts` through the real socket path
(ADR-020) and are no longer simulated from UI code.

### ADR-014 — Checkout and order routes guarded by a login redirect

Context:
`/checkout` and `/order/$orderId` require an authenticated session, and direct
entry by an anonymous visitor must not expose private data.

Decision:
A single route guard covers the checkout and order-detail routes and redirects
anonymous visitors to `/login?redirect=<target>`. The login page resolves only
internal single-level paths after a successful login (never raw external URLs
or query-bearing strings). When an authenticated query reports 401 during the
flow, the checkout/order pages clear the token and re-enter the same guard.
The foundation placeholder `/order-confirmation` now redirects to `/` because
confirmed orders always land on `/order/$orderId`.

Reason:
One guard plus a validated redirect keeps the session policy explicit without
duplicating protections across pages.

Impact:
Login accepts a `redirect` search param; the "/order-confirmation compatibility
route" (ADR-001) is resolved rather than retained as a placeholder.

### ADR-015 — Simulated wallet connection at checkout

Context:
The challenge simulates payment; there is no real wallet adapter or blockchain
integration in the application.

Decision:
Wallet and network selection are local checkout state read from the wallets
API. Connecting is simulated with the same transport the rest of the app uses:
a 600 ms connecting phase, then connected; a refused outcome is available for
failure coverage. Changing the selected wallet or network resets the
connection. Confirmation requires a selected wallet, a network that matches the
wallet's network, and a connected state.

Reason:
This matches the "simulated payment" requirement while keeping the block of
state local, since a connection is not a server resource in the challenge.

Impact:
There is no wallet-side persistence; the simulated connection is checked only
at the moment of confirmation and never leaves the checkout page.

### ADR-016 — Quote revalidation and idempotency key rotation

Context:
The README requires revalidating quantity/price/coupon/fee before creating an
order, and order creation must be idempotent so repeated confirm clicks,
automatic retries, and page refreshes never create duplicates.

Decision:
The checkout flow keeps a persisted attempt per user
(`kurio-checkout-attempt:<token>` in `sessionStorage`)
containing a stable `attemptId`, the current quote id, coupon, and an exact
copy of the four quote totals. Immediately before `POST /orders` the quote is
refetched; if any monetary field or the coupon differs from the attempt, the
attempt id is rotated and the user is asked to review ("Os valores foram
atualizados. Revise e confirme novamente.") instead of confirming silently. The
server remains authoritative: at order creation it revalidates coupon,
availability and unit price (`coupon_invalid`/`coupon_expired`,
`availability_conflict`, `stale_quote`, all 400/409). The idempotency key is
`checkout-<attemptId>` — stable across repeated clicks, the single 504 retry,
and refreshes; it rotates only when the confirmed totals change. The key is
derived from the attempt id, never from the quote id, so a retried request
reaches the existing order.

Reason:
The quote is the authoritative price snapshot (ADRs 003/010), and the attempt
store gives the idempotency requirement an explicit, tested home instead of
relying on query-cache behavior.

Impact:
Failed confirmations (rejected, timeout, conflicts) never clear the cart or the
attempt; confirmed orders clear the attempt. Server-side, `POST /orders` maps
a repeated key to the previously created order.

### ADR-017 — Single-payment-order retry after a request timeout

Context:
The order-timeout scenario must recover without creating duplicates: the first
`POST /orders` times out (504) only after the server has already stored the
order and its idempotency record.

Decision:
`confirmCheckout` detects a 504 response and retries exactly once with the same
idempotency key. Because the key is stable, the retry either returns the stored
order or surfaces a real error. Any other failure is surfaced once, never
silently retried. Query's automatic retry is disabled for this mutation so the
flow's deliberate retry policy is the only retry policy in play.

Reason:
"Repeated attempts must not create duplicate orders" requires retrying with the
same key, and the mock stores the key before responding 504 (see ADR-019).

Impact:
The order page polling (ADR-018) then advances the recovered order to its
terminal status.

### ADR-018 — Order status resolution by scenario-driven reads and polling

Context:
The realtime `order.updated` channel belongs to a later milestone, but the
checkout/orders milestone must still resolve pending orders to confirmed or
rejected and reconcile the cart.

Decision:
The mock transitions a pending order when it is read: `GET /orders/:orderId`
applies the active scenario (`payment-confirmed` → confirmed,
`payment-rejected` → rejected; `default` stays pending forever). The order page
polls that endpoint every 3 s while the status is pending and stops once it
reaches a terminal status. On `confirmed` the mock has already removed the
purchased quantities from the server-side cart, and the order page invalidates
the cart/quote caches so the UI reflects the new inventory.

Reason:
This is the smallest behavior that satisfies the status and cart-reconciliation
requirements without simulating Socket.IO from UI code (the socket-only rule).

Impact:
Rejected and pending orders leave the cart intact (ORDER-10). The realtime
milestone (ADR-020) adds the `order.updated` Socket.IO channel; the 3 s poll
remains as a fallback when no live socket is available.

### ADR-019 — Mock persistence ordering corrected after E2E findings

Context:
E2E refresh-persistence tests exposed two bugs where the mock mutated shared
state but serialized a stale snapshot, so a page reload regressed server state:
the login handler persisted the database before `createSession()` (the fresh
session disappeared after navigation), and the order read handler transitioned
the order / emptied the cart without calling `persistMockDatabase()` (the
transition and cart reconciliation were lost after a reload even though the
order had confirmed).

Decision:
Every database-mutating handler persists after the mutation completes. The
login handler creates the session (and merges the guest cart) before
serializing; `GET /orders/:orderId` calls `persistMockDatabase()` immediately
after `transitionOrderForScenario()`.

Reason:
The durable mock database (ADR-012) must be a faithful mirror of module state
at every observable instant, or refresh-level E2E behavior diverges from the
in-page behavior.

Impact:
Fixed in `domain-handlers.ts`; covered by the order-recovery and checkout
refresh E2E scenarios.

### ADR-020 — Realtime synchronization over the Socket.IO transport

Context:
The realtime milestone requires NFT changes (and per-owner order changes) to
reach an open UI over the real `socket.io-client` path, with duplicate or older
events never regressing state, reconnects reconciling to REST truth, and
per-session isolation. The mock exposes that transport through an MSW WebSocket
interceptor (see `REALTIME-CONTRACTS.md`), so no event may be simulated from UI
code.

Decision:
The application connects a single global Socket.IO client (transport
`websocket`, path `/socket.io`, lazy-dynamic-imported so `engine.io-client`
never captures the browser `WebSocket` global before MSW has replaced it) and
announces itself per session (`session:hello` with the bearer token). One
top-level `RealtimeSync` observer subscribes to `nft.updated` and
`order.updated` and drives reconciliation:

- Events carry a monotonic `version` (NFT or order) plus an `eventId`.
  `shouldApplyRealtimeVersion` accepts only event versions strictly newer than
  the last accepted version for that resource; duplicates and older events are
  dropped before any cache activity.
- Accepted events never write the query cache directly. They invalidate the
  precise affected caches (`['nfts']`, `['quote']`, `['order', token, id]`) so
  TanStack Query refetches the authoritative REST state. A stale/duplicate
  event therefore cannot regress UI state, and a server that is not yet
  terminal cannot contradict the latest REST read.
- `order.updated` events are dropped when the payload does not belong to the
  current session, so private events from a previous user never reach the
  current session.
- On transport reconnect the affected queries are revalidated once so the UI
  converges to REST truth after gaps.

The mock side follows the same rules: mock control endpoints
(`POST /api/__mock/scenario`, `GET /orders/:orderId` transitions) broadcast
real envelopes through the hub, never touching the application's query cache.

Reason:
REST stays authoritative (critical rules) while sockets deliver freshness;
invalidation-delivered refetch preserves the `nft.version`/`order.version`
ordering contract without a parallel manual cache system.

Impact:
`nft.updated` refreshes catalog/detail/cart; a stale quote blocks confirmation
(RT-05); a pending order survives a disconnect and resolves once via
`order.updated` (RT-06/09/10); duplicate/stale events are ignored (RT-07/08);
logout/session changes tear down the old socket and route private events to the
right session only (RT-11). The 3 s order polling (ADR-018) remains as a
fallback for scenarios without an active socket. The mock scenario state is now
persisted in `sessionStorage` (consistent with ADR-012) so scenario-driven
flows survive full page reloads. The MSW socket link is scheme-aware
(`ws://${host}/*` on HTTP, `wss://${host}/*` on HTTPS): the public Vercel
deployment exposed that `socket.io-client` on HTTPS connects through `wss://`,
and without the matching scheme the WebSocket was not intercepted, reached the
real host, and failed the handshake (the SPA rewrite answered with the HTML
document).

### ADR-021 — Authentication milestone: session policy, registration, logout, and centralized expiration

Context:
The checkout/orders milestone introduced a minimal login bridge (ADR-014) to
protect `/checkout` and `/order/$orderId`. The authentication milestone completes
the full auth surface: registration, logout, session persistence, expiration
handling, user switching, and redirect/context preservation. The session
infrastructure (`features/auth/session.ts`, `onSessionChange` bus, `purgePrivateQueries`)
and realtime session-change bus already exist.

Decision:
- Registration page (`/register`) mirrors the login page UX: form, client-side
  validation (email, displayName ≥ 2, password ≥ 8), `POST /auth/register` via
  `authApi.register`, success stores token and navigates respecting `?redirect=`.
- Logout uses a dedicated `logout()` helper that calls `POST /auth/logout` in a
  `try/finally` block so local state is always cleared even if the server request
  fails. The helper invokes `clearSessionToken()` which purges all private
  TanStack Query caches (`cart`, `quote`, `order`, `session`, `profile`,
  `wallets`) and fires `onSessionChange`, triggering the realtime socket teardown.
- Session expiration (401) is centralized at the Axios interceptor boundary
  (`lib/axios/api-client.ts`). Any authenticated request that receives 401 sets a
  re-entrancy guard, calls `clearSessionToken()`, emits a global toast event
  ("Sua sessão expirou. Faça login novamente."), and redirects to
  `/login?redirect=<current internal path>`. This avoids duplicating 401 logic
  across feature hooks.
- The header and mobile bottom nav adapt to authenticated state: anonymous shows
  "Entrar"; authenticated shows an avatar button with a dropdown containing
  "Perfil" (navigates to `/profile` placeholder) and "Sair" (calls `logout()`).
- Query keys embed the token (`['session', token]`, `['order', token, id]`,
  `['cart', identity]`, `['quote', identity]`) so user data is isolated. The
  `onSessionChange` bus ensures the realtime layer tears down the old socket and
  creates a new one per session.
- Guest cart merge on login is handled by the mock (`mergeGuestCartIntoUser`)
  respecting availability and `maxPerOrder`.

Reason:
Centralized 401 handling satisfies the session-policy requirement without
scattering logic across hooks. The `try/finally` logout pattern guarantees local
state cleanup even under network failure. The header adapts minimally to the
Figma's authenticated composition while preserving all existing spacing,
typography, and navigation.

Impact:
- `src/features/auth/session.ts` gains `logout()` with `try/finally`.
- `src/lib/axios/api-client.ts` gains a response interceptor with a 401
  re-entrancy guard, toast emission, and redirect.
- `src/components/shared/site-header.tsx` and `mobile-bottom-nav.tsx` render
  authenticated affordances.
- `src/features/auth/pages/register-page.tsx` + Vitest (6) + Playwright
  `auth.spec.ts` (9 scenarios × desktop + mobile) cover AUTH-01..08.
- RT-11 session isolation still passes; realtime session-change bus unchanged.

### ADR-022 — Production build optimizations for Lighthouse mobile targets

Context:
The Lighthouse audit (defined in `scripts/lighthouse/audit.mjs`, v13.4.1)
required by README §10 requires Home and NFT Detail at ≥ 90 Performance. The
first mobile measurements scored 88/89. Lighthouse attributed the gap to
render-blocking CSS (~150 ms) and the LCP image being loaded with
`loading="lazy"` and without prioritization, both behind the single JS bundle.

Decision:
- The build step inlines the render-blocking stylesheet into the built
  `index.html` via `scripts/inline-css.mjs` (`npm run build` runs
  `vite build && node scripts/inline-css.mjs`).
- LCP candidates receive explicit prioritization without changing layout or
  behavior: the Home hero and NFT Detail gallery main image use
  `fetchPriority="high"`, and the first catalog grid row (the mobile LCP)
  renders with `loading="eager"` + `fetchPriority="high"` (a new `priority`
  prop on `NftCard`, applied for `index < 3`). Remaining grid images stay
  lazy.

Reason:
Inline CSS removes one round-trip/fetch for the critical stylesheet, and
prioritized eager LCP images start downloading without waiting for layout to
discover them — both directly address the Lighthouse findings. No feature,
asset, or visual behavior changes; the audit still loads the real artwork
PNGs, Roboto Mono woff2 fonts, and working flows.

Alternatives considered:
- Code splitting the vendor bundle: the app is a single route-driven bundle;
  splitting would be speculative optimization beyond the measured cause.
- A Vite plugin performing the inlining at transform time: ordering between
  emitted HTML and CSS is fragile; a post-build script is deterministic.
- Inlining eagerly-priority images globally: unnecessary for non-LCP images.

Impact:
- `package.json` `build` now also inlines CSS. The built `index.html` carries
  a `<style>` block; the deferred CSS file no longer ships for the app
  stylesheet.
- `NftCard` gains an optional `priority` prop (default lazy, unchanged for
  other usages); `catalog-grid.tsx` passes `priority={index < 3}`.
- After this change, mobile medians reached 91 (Home) and 90 (NFT Detail),
  with desktop at 99 and 95, meeting all README thresholds. Results are
  recorded in `README.md` §10, `docs/TEST-MATRIX.md` §15, and
  `reports/lighthouse/`.

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

### Figma Deviation — NFT Detail emerald name vs token row

Original:
The reference emerald NFT shows `ID do token: #842` and the name
`Emerald Ape #842`.

Implemented:
`Nft.tokenId` is a seeded presentation field; the Emerald NFT is seeded with
`842`, so the detail row renders `#842`, matching the reference. The seeded
`name` field still reads `Emerald Ape #042`, an inherited seed data mismatch
with the token row.

Reason:
The corrective task specified seeding the Emerald token id (842) without
changing the NFT name.

Impact:
The metadata row matches the Figma; the seeded name carries a different
embedded number until the seed name is updated.

### Figma Deviation — NFT Detail gallery thumbnails

Original:
The desktop reference shows a gallery with several distinct thumbnails.

Implemented:
Four thumbnails reuse the same single seed artwork (`nft.imageUrl`) because
the mock supplies one image per NFT.

Reason:
The seed provides a single asset per NFT and no additional per-NFT artwork
exists in the challenge assets.

Impact:
The thumbnail track behaves like the reference (selection, active state) but
shows identical source images.

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

Current known limitations:

- Realtime events are consumed by invalidating the affected REST caches
  (ADR-020), so the UI updates as fast as a refetch round-trip; the transport
  itself is the real Socket.IO-over-MSW path, and duplicate/older events are
  dropped by the version guard.
- The durable mock database uses `sessionStorage`, which is scoped per tab. A
  new tab starts from the seed state, so cross-tab carts do not converge (a
  mock transport limitation, noted in ADR-012). The active mock scenario is
  persisted in the same way (ADR-020).
- Order status advances through scenario-driven reads plus polling (ADR-018);
  the `order.updated` Socket.IO channel (ADR-020) delivers the same transitions
  when a live socket is open, and the poll remains as a fallback.
- Session-change cleanup is validated as a test-observability limitation, not
  a violation of the application behavior: on logout or session expiry the
  previous authenticated socket is correctly torn down and the next session
  reconnects isolated (RT-11). The current E2E validates that cleanup through
  the session-expiry flow (a fresh authenticated request rejected with 401)
  followed by a fresh isolated connection; it does not assert an observable
  intermediate zero-connection window after a simulated server disconnect.
- Login UI exists and is used by the checkout guard (ADR-014), but the
  remaining authentication surface (registration UI, password recovery) and the
  profile/wallets management pages are separate later milestones and remain not
  implemented. Guest→user cart merge is exercised through the API and the mock
  login handler.
