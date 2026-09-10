# Realtime Contracts

## 1. Transport

Realtime behavior must use:

- Socket.IO;
- `socket.io-client`;
- MSW-compatible mock transport as required by the challenge.

The client must genuinely exercise `socket.io-client`.

Direct setter/callback/cache manipulation is not an acceptable replacement.

---

# 2. Event Envelope

Realtime events must contain:

- stable identity;
- affected resource;
- version.

Conceptual envelope:

```ts
interface RealtimeEvent<T> {
  eventId: string;
  resourceId: string;
  version: number;
  payload: T;
}
```

The exact payload must correspond to the affected resource.

---

# 3. nft.updated

Event:

```text
nft.updated
```

Purpose:

Synchronize NFT price and availability.

Affected surfaces include:

- catalog;
- NFT detail;
- cart.

The client must update the relevant application state without regressing newer data.

---

# 4. order.updated

Event:

```text
order.updated
```

Purpose:

Synchronize the state of a pending order.

Required states:

```text
pending
confirmed
rejected
```

Confirmed and rejected states are terminal.

---

# 5. Event Ordering

The client must tolerate:

- duplicate events;
- old events;
- out-of-order delivery.

Rules:

```text
newer version
→ apply

same version
→ ignore duplicate

older version
→ ignore
```

Never regress an already newer resource state.

---

# 6. Session Isolation

Realtime events from a previous session must not update the current user's private state.

On logout or user switching:

- unsubscribe previous session listeners;
- clean subscriptions;
- clear private state.

---

# 7. Reconnection

After reconnecting:

1. restore active subscriptions;
2. reconcile relevant resources with REST;
3. recover pending order state;
4. continue from the latest authoritative state.

REST is authoritative for reconciliation.

---

# 8. NFT Price/Availability Scenario

Required scenario:

```text
NFT in cart
    ↓
price/availability changes
    ↓
nft.updated
    ↓
catalog updates
    ↓
detail updates
    ↓
cart updates
    ↓
checkout detects stale quote
    ↓
confirmation blocked
    ↓
new quote
    ↓
user confirms again
```

---

# 9. Pending Order Scenario

Required scenario:

```text
order created
    ↓
pending
    ↓
connection interrupted
    ↓
reconnect or refresh
    ↓
pending order recovered
    ↓
order.updated
    ↓
confirmed/rejected
```

The recovery must not create another order.

---

# 10. Mocking

MSW must be used for the realtime simulation in a manner compatible with the Socket.IO protocol, as required by the challenge.

Document the chosen transport and limitations in `ARCHITECTURE.md`.

---

# 11. Testing

Realtime Playwright tests must exercise:

- `socket.io-client`;
- duplicate events;
- stale events;
- reconnection;
- pending order recovery;
- NFT price/availability updates.

Do not bypass the socket layer in tests.
