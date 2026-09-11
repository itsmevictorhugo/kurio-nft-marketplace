# REST API Contracts

## 1. Purpose

This document defines the REST resources required by the challenge.

The challenge README is authoritative.

Fields not explicitly required by the README should only be introduced when necessary for implementation and must remain minimal.

---

# 2. Transport

All REST communication must use Axios.

Conceptual flow:

```text
Feature
  ↓
TanStack Query
  ↓
API service
  ↓
Axios
  ↓
MSW handler
```

## 2.1 Headers

```text
Authorization: Bearer <token>   authenticated requests
X-Guest-Id: <guest-id>          guest cart identity before login
Idempotency-Key: <key>          order creation (POST /orders)
```

Requests carrying `Authorization` are treated as authenticated; cart and
quotation requests without it are treated as guest requests identified by
`X-Guest-Id`.

---

# 3. Session and Account

Required operations:

```text
POST   /auth/register
POST   /auth/login
GET    /auth/session
POST   /auth/logout
```

Required behavior:

- registration;
- login;
- session retrieval;
- logout;
- expiration;
- unauthorized response;
- session recovery.

Possible error classes:

```text
400 validation
401 unauthorized/session expired
409 conflict
5xx transient failure
```

---

# 4. NFTs

Required operations:

```text
GET /nfts
GET /nfts/:id
```

List request must support:

```text
search      free-text search
category    category filter
creator     creator filter
sort        name-asc | price-asc | price-desc
page        1-based page number
pageSize    page size (mock caps at 50)
minPrice    minimum price in ETH (decimal string, inclusive)
maxPrice    maximum price in ETH (decimal string, inclusive)
network     ethereum | polygon | solana
```

Query parameters must correspond to the URL search state.

NFT records carry `price` and `imageUrl` as presentation-relevant fields; the
mock seed supplies local artwork paths under `/assets/nft/`.

Presentation-only fields introduced for the NFT Detail reference composition:

```text
Nft.attributes      optional string[]; token metadata traits rendered in the
                    detail "Atributos" row (data-driven, seed-only).
Nft.contract        mock collection contract address, deterministic per
                    collection/creator, displayed truncated in the detail tab
                    (e.g. 0x7A42…19E8). Presentation-only; no real blockchain
                    behavior or on-chain state.
Nft.tokenId         presentation token identifier rendered as "ID do token"
                    (e.g. #842). Seeded per record; intentionally not derived
                    from the database id/UUID.

NftEdition.total          optional edition size (denominator of the X/Y
                          edition pill).
NftEdition.editionNumber  optional mint index (numerator of the X/Y edition
                          pill).
```

`available` and `maxPerOrder` remain the authoritative purchasing fields;
`total`/`editionNumber` are display-only and absent on open editions.

Required behaviors:

- success;
- empty result;
- failure;
- stale/out-of-order response;
- NFT not found;
- edition unavailable;
- quantity limits.

---

# 5. Favorites

Required operations:

```text
GET    /favorites
POST   /favorites
DELETE /favorites/:id
```

Required behavior:

- authenticated user only;
- persistence;
- optimistic UI with rollback;
- mutation failure recovery.

---

# 6. Cart

Required operations:

```text
GET    /cart
POST   /cart/items
PATCH  /cart/items/:id
DELETE /cart/items/:id
DELETE /cart
```

`DELETE /cart` removes every item from the requesting owner's cart.

Required behavior:

- add;
- quantity change;
- removal;
- availability limits;
- refresh persistence;
- guest/authenticated merge;
- price changes;
- availability changes.

---

# 7. Quotation

Required operations:

```text
POST /quote
```

The request body may carry an optional coupon code:

```text
{ "couponCode"?: string }
```

Required behavior:

- computes subtotal, discount, network fee and total from the current cart;
- validates the coupon at quote creation;
- invalid coupon → `coupon_invalid`;
- expired coupon → `coupon_expired`;
- unavailable cart item → `availability_conflict`.

The quotation is authoritative for final checkout values.

ETH values must be represented as decimal strings.

---

# 8. Orders

Required operations:

```text
POST /orders
GET  /orders/:id
```

Order creation must accept an idempotency key through the `Idempotency-Key`
header.

Required behavior:

```text
same key + same user + same request
→ same/recovered order

same key + same user + different request
→ conflict

same key used by another user
→ independent; never exposes another user's order
```

Before creating an order from a quote, the mock API revalidates the quote
against current state:

- price changes → `stale_quote`;
- unavailable items → `availability_conflict`;
- coupon no longer valid → `coupon_invalid`;
- coupon no longer valid because it expired → `coupon_expired`.

Idempotent recovery of an existing order returns the stored order without
re-applying scenario transitions.

Required states:

```text
pending
confirmed
rejected
```

Timeout recovery must be possible.

---

# 9. Profile

Required operations:

```text
GET   /profile
PATCH /profile
PATCH /profile/password
```

Required behavior:

- retrieve profile;
- update profile data;
- update avatar;
- change password;
- validation errors;
- persistence after refresh.

---

# 10. Wallets

Required operations:

```text
GET   /wallets
POST  /wallets
PATCH /wallets/:id
```

Required behavior:

- primary wallet;
- secondary wallet;
- registration;
- editing;
- validation errors.

Wallet connection remains simulated.

---

# 11. Error Model

The mock API must represent at least:

```text
validation error
invalid session
unauthorized
not found
conflict
availability conflict
transient failure
network failure
timeout
```

The frontend must not assume that all failures are HTTP 500.

---

# 12. Contracts and Types

Each implemented resource must have explicit TypeScript types.

Example:

```ts
type EthAmount = string;
```

Do not use `number` as the authoritative ETH amount representation.

When transport and domain representations differ, define explicit conversion.

---

# 13. Mock Requirements

Each endpoint must be backed by MSW.

The handlers must use the shared mock state rather than isolated hardcoded responses.

Scenarios must be deterministic and reusable by:

- development;
- demonstration;
- Playwright.

---

# 14. Contract Evolution

When implementation requires a field not defined by the README:

1. confirm that the field is necessary;
2. keep the field minimal;
3. avoid introducing product behavior;
4. document the decision in `ARCHITECTURE.md`;
5. update this document.

Do not silently introduce new product requirements.