# NFT Marketplace — Seed Spec v1.0

## 1. Source of Truth

This project is a frontend technical challenge.

The authoritative sources are:

1. `README.md` — functional, technical, testing and delivery requirements.
2. Figma frames supplied with the challenge — visual identity, composition and responsive layout.

Do not invent product functionality that is not supported by either source.

When README and Figma do not specify a behavior:

1. choose the smallest behavior necessary to satisfy the explicit requirements;
2. preserve visual consistency with the Figma;
3. document the decision in `ARCHITECTURE.md`.

Never expand the product scope without justification.

---

## 2. Product Scope

Implement the NFT Marketplace flows:

- discovery;
- NFT browsing;
- NFT detail;
- favorites;
- cart;
- checkout;
- order confirmation;
- authentication;
- collector profile;
- wallets.

Required screens:

- Home
- NFT Detail
- NFT Cart
- Payment
- Order Confirmation
- Login
- Registration
- Collector Profile
- Wallets

Desktop and mobile layouts supplied by the Figma must be respected.

Profile, Wallets and Order Confirmation must also work responsively on mobile even when no dedicated mobile frame exists.

Out of scope:

- editorial pages;
- support;
- activity;
- offers;
- downloads;
- real blockchain integration;
- real wallet extensions;
- real payment gateways.

Out-of-scope actions must not falsely appear to have completed a real operation.

---

## 3. Mandatory Technology

The implementation must effectively use:

- React
- TypeScript
- TanStack Router
- TanStack Query
- Axios
- REST APIs
- Socket.IO
- Tailwind CSS
- shadcn/ui
- MSW
- Playwright
- Lighthouse

Do not install a technology merely to satisfy the dependency list.

Each mandatory technology must participate in the actual solution.

REST requests must use Axios.

Remote server state must use TanStack Query.

Routing and URL search parameters must use TanStack Router.

Realtime behavior must use `socket.io-client`.

Network mocking must use MSW.

E2E and visual regression must use Playwright.

Performance and quality auditing must use Lighthouse.

---

## 4. Visual Source of Truth

The Figma defines:

- typography;
- colors;
- spacing;
- hierarchy;
- proportions;
- imagery;
- card composition;
- navigation;
- page composition;
- desktop layout;
- mobile layout.

Preserve the visual identity of the supplied frames.

Do not replace the design with a generic Tailwind/shadcn theme.

shadcn/ui components may be customized to reproduce the Figma.

When a state is not visually represented in Figma, derive its visual treatment from the existing design language.

---

## 5. Responsive Requirements

The application must work at:

- 390px;
- 768px;
- 1440px.

Mobile is not simply a scaled desktop layout.

Use the supplied mobile frames as the source of truth for mobile composition.

Pay particular attention to:

- navigation;
- filters;
- catalog grid;
- NFT detail;
- forms;
- cart;
- checkout;
- footer/content density;
- bottom navigation where represented.

Avoid horizontal overflow.

---

## 6. Application Routes

Use TanStack Router.

Required conceptual routes:

- `/`
- `/nft/$nftId`
- `/cart`
- `/checkout`
- `/order/$orderId`
- `/login`
- `/register`
- `/profile`
- `/wallets`

Private flows must require authentication.

Direct access and refresh must work for every required route.

Unknown routes must have coherent handling.

---

## 7. Catalog

The Home/catalog flow must support:

- highlights;
- NFT catalog;
- search;
- combined filters;
- sorting;
- pagination;
- navigation to NFT detail.

Search, filters, sorting and pagination must be represented in the URL.

Requirements:

- refresh preserves the query state;
- browser history restores previous query states;
- filters are combinable;
- changing filters resets pagination;
- API requests reflect URL parameters;
- empty results are handled;
- API failures are handled;
- obsolete responses must not overwrite newer results.

---

## 8. NFT Detail

The detail flow must support:

- direct access;
- gallery;
- NFT information;
- edition;
- quantity;
- favorites;
- purchase/add-to-cart behavior.

Handle:

- NFT not found;
- unavailable edition;
- quantity limit;
- availability changes.

Favorites require authentication and must persist for the authenticated user.

---

## 9. Cart

The cart must support:

- adding items;
- changing quantities;
- removing items;
- availability limits;
- coupons;
- coupon removal;
- subtotal;
- discount;
- network fee;
- total.

The cart must survive refresh.

Visitor cart contents must survive authentication and be preserved/merged appropriately.

Prices and availability received through realtime events must update the cart.

ETH values must be represented as decimal strings and calculated without floating-point monetary precision errors.

Quantities are integers.

The API quotation is authoritative for final purchase values.

---

## 10. Checkout

Checkout must:

1. collect required collector information;
2. allow wallet selection;
3. allow network selection;
4. simulate wallet connection;
5. support connection refusal;
6. support disconnection;
7. allow review;
8. revalidate purchase data;
9. require confirmation;
10. create the order idempotently.

Before final confirmation, revalidate:

- price;
- availability;
- coupon;
- fees;
- total.

If any relevant value changes:

- inform the user;
- refresh the quotation;
- prevent confirmation using stale data;
- require renewed confirmation.

Never confirm an order solely because the user clicked the button.

---

## 11. Orders

Order creation must use an idempotency key.

Same key + same request:

- return/recover the same order.

Same key + different request:

- return a conflict.

The application must prevent duplicate purchases caused by:

- repeated clicks;
- repeated submissions;
- timeout followed by retry.

Required states:

- pending;
- confirmed;
- rejected.

Confirmed and rejected orders are terminal.

Pending orders must be recoverable after:

- timeout;
- refresh;
- reconnect.

The confirmation screen is shown only after the simulated order is actually confirmed.

The receipt must preserve the original order snapshot.

Later NFT/catalog changes must not change receipt values.

After confirmation, remove only the purchased quantities from the cart.

Preserve cart items after failures.

---

## 12. Authentication

Required:

- registration;
- login;
- logout;
- session retrieval;
- session persistence;
- session expiration;
- recovery during navigation;
- recovery during checkout;
- user switching.

Private data must be isolated between users.

On logout or user switching:

- clear private TanStack Query cache;
- remove previous session subscriptions;
- prevent previous-user realtime events from affecting the new session.

Passwords must never be stored in plaintext.

Use fictional credentials.

---

## 13. Profile

Support:

- profile retrieval;
- profile data editing;
- avatar editing;
- password change.

Validate client-side and server-returned errors.

Successful changes must persist after refresh.

---

## 14. Wallets

Support:

- wallet listing;
- primary wallet;
- secondary wallet;
- wallet registration;
- wallet editing;
- validation errors.

Wallet connection/payment behavior remains simulated.

No real blockchain or wallet extension integration is allowed.

---

## 15. REST Architecture

Use:

UI
→ feature hooks
→ service/API layer
→ Axios
→ REST
→ MSW

Components must not contain mock business responses.

Define typed contracts for:

- session/account;
- NFTs;
- favorites;
- cart;
- quotation;
- orders;
- profile;
- wallets.

Represent at least:

- validation error;
- invalid session;
- unauthorized;
- not found;
- conflict;
- availability conflict;
- transient failure.

---

## 16. MSW

MSW operates at the network boundary.

Mocks must maintain consistent state across:

- users;
- sessions;
- NFTs;
- favorites;
- carts;
- profiles;
- wallets;
- orders.

The mock layer must support deterministic scenarios.

Required scenarios include:

- default success;
- empty results;
- variable latency;
- out-of-order responses;
- connection failure;
- HTTP 4xx;
- HTTP 5xx;
- expired session;
- registration conflict;
- validation conflict;
- invalid coupon;
- expired coupon;
- price changed;
- edition unavailable;
- order timeout;
- confirmed payment;
- rejected payment.

Scenarios must be reusable by development, demonstration and Playwright.

A reset mechanism must restore a known state.

---

## 17. Realtime

Use `socket.io-client`.

Minimum events:

- `nft.updated`
- `order.updated`

Events must contain:

- stable identity;
- affected resource;
- version.

The client must:

- ignore duplicates;
- ignore stale versions;
- never regress state;
- reconcile after reconnection;
- clean up listeners;
- isolate events by session/user.

Do not simulate realtime by directly calling UI setters or query-cache setters from test code.

The event must travel through the Socket.IO client.

---

## 18. Critical NFT Realtime Scenario

Required flow:

1. NFT exists in cart.
2. NFT price or availability changes.
3. `nft.updated` is received.
4. Catalog updates.
5. NFT detail updates.
6. Cart updates.
7. Checkout detects stale quotation.
8. Confirmation is blocked.
9. New quotation is obtained.
10. User confirms again.

---

## 19. Critical Order Realtime Scenario

Required flow:

1. Order is created.
2. Order enters pending state.
3. Connection is interrupted.
4. Application reconnects or refreshes.
5. Pending order is recovered.
6. No duplicate order is created.
7. `order.updated` resolves the order.
8. Confirmed/rejected state becomes terminal.

---

## 20. Optimistic Update

At least one interaction must use optimistic UI.

Preferred candidate:

favorite toggle.

Flow:

1. user toggles favorite;
2. UI updates optimistically;
3. mutation executes;
4. success preserves state;
5. failure rolls back state;
6. user receives accessible feedback.

---

## 21. UI States

Data-dependent components must support:

- loading;
- empty;
- error;
- success;
- background updating.

Required skeleton/shimmer:

- catalog;
- NFT detail;
- cart summary.

Skeleton dimensions should preserve layout geometry.

Respect `prefers-reduced-motion`.

---

## 22. Accessibility

Required:

- keyboard navigation;
- visible focus;
- semantic HTML;
- associated labels;
- associated field errors;
- meaningful image alternatives;
- sufficient contrast;
- state communication that does not depend only on color;
- accessible mutation feedback;
- accessible realtime feedback;
- dialog focus management;
- drawer focus management;
- no unintended horizontal overflow;
- content remains usable when zoomed.

---

## 23. Playwright

E2E coverage must include:

1. search/filter/sort/pagination/history;
2. direct NFT access/not found;
3. registration/login/session/logout/user switching;
4. favorites and mutation failure/recovery;
5. cart quantity/removal/coupon/refresh/login persistence;
6. complete purchase;
7. payment failure/repeated click/timeout/idempotent recovery;
8. profile/avatar/password/wallet validation;
9. realtime price/availability during checkout;
10. duplicate/stale events/reconnect/pending order recovery;
11. keyboard/focus/form validation;
12. slow loading/error/retry recovery.

Main flows must execute in:

- Chromium;
- desktop;
- mobile.

Each test starts from isolated deterministic state.

Use controlled time and deterministic network conditions where required.

Produce HTML report and traces for failures.

---

## 24. Visual Regression

Create versioned Playwright baselines for:

- Home;
- NFT Detail;
- Cart;
- Payment.

At minimum:

- desktop;
- mobile.

Data must be deterministic.

---

## 25. Lighthouse

Audit:

- Home;
- NFT Detail.

Profiles:

- mobile;
- desktop.

Perform three measurements per page/profile.

Report median:

- Performance >= 90;
- Accessibility >= 95;
- Best Practices >= 95;
- SEO >= 90.

Record:

- LCP;
- CLS;
- TBT.

Use the actual application build, images, fonts and functionality.

Do not simplify the application exclusively to improve Lighthouse.

---

## 26. Documentation

Required final documentation:

- README.md
- ARCHITECTURE.md
- REST/API contracts
- realtime contracts
- session policy
- cart state strategy
- cache strategy
- REST/Socket.IO reconciliation
- limitations
- UX decisions
- Figma deviations

README must explain:

- setup;
- environment variables;
- fictional credentials;
- scenario selection;
- scenario reset;
- development;
- build;
- preview;
- typecheck;
- lint;
- Playwright;
- Lighthouse;
- failure reproduction.

---

## 27. Delivery

Required:

- source code;
- lockfile;
- assets;
- mocks;
- fixtures;
- tests;
- audit configuration;
- public deployment.

The published application must correspond to the delivered code.

Direct route access and refresh must work in production.

The project must run from a clean checkout without private services or production backend.

---

## 28. Non-Negotiable Constraints

The following are prohibited:

- real blockchain integrations;
- real payment gateway;
- real wallet extension dependency;
- fake success directly from UI;
- mock responses embedded in components;
- direct UI manipulation to simulate Socket.IO;
- cross-user private data leakage;
- bypassing Axios for REST;
- bypassing TanStack Query for remote state;
- inventing pages outside scope;
- implementing unsupported functionality.

---

## 29. Implementation Priority

P0 — Elimination risk:

- mandatory stack;
- functional purchase flow;
- MSW;
- authentication;
- private-data isolation;
- Socket.IO;
- order simulation;
- deployment.

P1 — Major score:

- Figma fidelity;
- responsive behavior;
- catalog;
- cart;
- checkout;
- realtime;
- Playwright.

P2 — Final quality:

- accessibility;
- Lighthouse;
- visual regression;
- documentation;
- polish.

Never sacrifice a P0 requirement for P2 polish.

---

## 30. Definition of Completion

A feature is complete only when:

- required behavior works;
- required API contract exists;
- MSW scenario exists;
- loading/empty/error/success states exist where applicable;
- Figma layout is respected;
- mobile behavior works;
- accessibility requirements are satisfied;
- relevant Playwright coverage exists;
- cache invalidation/reconciliation is correct;
- documentation/traceability is updated.

The implementation is not considered complete merely because the happy-path UI renders.
