# Engineering Guidelines

## 1. Purpose

These guidelines define how the NFT Marketplace challenge should be implemented.

They do not introduce product requirements.

The `README.md` and supplied Figma remain authoritative.

---

## 2. General Principles

### KISS

Prefer the simplest architecture that satisfies the requirements.

Avoid:

- speculative abstractions;
- unnecessary design patterns;
- premature optimization;
- duplicate state systems;
- generic frameworks built only for theoretical reuse.

### Explicitness

Prefer code that clearly communicates:

- domain responsibility;
- data flow;
- state transitions;
- error handling;
- side effects.

### Feature Ownership

Domain-specific code belongs to its feature.

Suggested structure:

```text
src/
├── app/
├── components/
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
├── lib/
├── mocks/
├── types/
└── styles/
```

Do not create abstractions before there is a demonstrated need.

---

## 3. Data Flow

Preferred REST flow:

```text
React component
      ↓
feature hook
      ↓
TanStack Query
      ↓
service/API function
      ↓
Axios
      ↓
REST
      ↓
MSW
```

The component should not own REST implementation details.

---

## 4. TanStack Query

Use TanStack Query for server state.

Query keys must distinguish relevant parameters and authenticated users.

Examples of concepts that must be isolated:

- catalog query parameters;
- NFT identifier;
- authenticated user;
- cart;
- favorites;
- order.

Mutations must define appropriate cache invalidation or updates.

Avoid broad invalidation when a precise update is possible.

---

## 5. Optimistic Updates

At least one required interaction must use optimistic updates with rollback.

Preferred interaction:

```text
favorite toggle
```

The optimistic update must:

1. update the UI;
2. execute the mutation;
3. preserve the result on success;
4. restore the previous state on failure;
5. communicate the failure accessibly.

---

## 6. Axios

Create a centralized Axios configuration.

Responsibilities may include:

- base URL;
- request configuration;
- response normalization;
- authentication/session handling;
- error normalization.

Do not place business logic in Axios interceptors unless necessary for transport/session concerns.

---

## 7. TypeScript

Avoid `any`.

Use explicit domain and transport types.

Distinguish where necessary between:

- API DTO;
- domain model;
- UI model.

Validate external input at boundaries.

Do not assume that API data is valid merely because TypeScript types exist.

---

## 8. Monetary Values

ETH values are strings.

Example:

```ts
type EthAmount = string;
```

Never use floating-point arithmetic as the authoritative calculation mechanism for ETH values.

All calculations must preserve the required precision.

The API quotation remains authoritative for checkout.

---

## 9. URL State

Catalog search, filters, sorting and pagination belong in URL search parameters.

The URL must be:

- refresh-safe;
- history-safe;
- directly navigable.

Changing filters must reset pagination.

Do not maintain a second conflicting representation of the same catalog state.

---

## 10. Error Handling

Represent meaningful application states explicitly:

```text
loading
empty
success
error
updating
```

Errors should be recoverable where the requirement calls for recovery.

Do not swallow errors merely to keep the UI rendering.

Do not show success when the underlying operation failed.

---

## 11. Authentication and Privacy

Private application data must be scoped to the authenticated user.

On logout or user switching:

- clear private query state;
- remove previous realtime subscriptions;
- reset private UI state;
- prevent previous-user events from modifying current-user state.

Do not persist passwords in plaintext.

---

## 12. MSW

MSW is the network boundary.

Components must not contain:

```text
mock response
mock business rule
mock API branch
```

Mock scenarios must be deterministic and reproducible.

The mock state must remain coherent across:

- authentication;
- NFTs;
- favorites;
- cart;
- profile;
- wallets;
- orders.

Provide a reset mechanism.

---

## 13. Realtime

Socket.IO events must enter the application through `socket.io-client`.

Conceptually:

```text
Mock Socket transport
        ↓
socket.io-client
        ↓
event handler
        ↓
TanStack Query/cache
        ↓
UI
```

Do not directly mutate UI state from tests to simulate realtime behavior.

---

## 14. Realtime Ordering

Every relevant event has a version.

The client must reject:

- duplicates;
- stale versions.

A newer version must not be replaced by an older event.

Subscriptions must be cleaned up when their lifecycle ends.

After reconnection, reconcile active resources through REST.

---

## 15. UI Components

Use shadcn/ui as the component foundation where applicable.

Customize components to match the Figma.

Do not introduce a second visual system unnecessarily.

Shared components should only be created when they are genuinely reused.

---

## 16. Responsive Design

Required verification widths:

```text
390px
768px
1440px
```

Mobile composition must follow the mobile Figma frames.

Do not assume that desktop can simply be scaled down.

Avoid horizontal overflow.

---

## 17. Accessibility

Every interactive feature should be usable with:

- keyboard;
- visible focus;
- semantic elements;
- labels;
- accessible error messages.

Dialogs and drawers require appropriate focus handling.

Realtime and mutation feedback must be accessible.

Do not communicate state exclusively through color.

Respect reduced-motion preferences.

---

## 18. Performance

Do not sacrifice functionality solely to improve Lighthouse.

Use:

- appropriate image sizing;
- lazy loading where appropriate;
- stable layout dimensions;
- efficient rendering;
- code splitting when justified.

Required skeletons must preserve content dimensions.

---

## 19. Testing

Prefer behavior-driven tests.

Tests should observe:

- URL;
- visible UI;
- user interaction;
- API outcomes;
- error states;
- recovery.

Avoid testing implementation details when observable behavior is sufficient.

Each test must start from isolated deterministic state.

---

## 20. Scope Control

Before adding functionality, ask:

1. Is it required by README?
2. Is it required to reproduce the Figma?
3. Is it required to make another explicit requirement work?

If all answers are no, do not implement it during this challenge unless explicitly documented as necessary.

---

## 21. Documentation

When an implementation decision cannot be directly derived from README/Figma:

- make the smallest reasonable decision;
- record it in `ARCHITECTURE.md`.

Do not silently change requirements.

---

## 22. Time Constraint

This challenge is being executed under a strict approximately three-day deadline.

Prioritize:

1. eliminatory requirements;
2. complete critical flows;
3. mandatory technology;
4. major scoring areas;
5. testing;
6. accessibility;
7. performance;
8. documentation polish.

Do not sacrifice a critical requirement for cosmetic refactoring.
