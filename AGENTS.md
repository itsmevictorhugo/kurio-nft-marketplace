# AGENTS.md

## Project

This repository contains the frontend implementation of the NFT Marketplace technical challenge.

The implementation must strictly follow the challenge requirements.

## Source of Truth

Use the following sources in this order:

1. `README.md`
   - Functional requirements
   - Technical requirements
   - API requirements
   - Realtime requirements
   - Mocking requirements
   - Testing requirements
   - Accessibility requirements
   - Performance requirements
   - Delivery requirements

2. Figma frames supplied with the challenge
   - Visual identity
   - Layout
   - Composition
   - Typography
   - Colors
   - Spacing
   - Images
   - Desktop/mobile visual behavior

3. `seed-spec.md`
   - Operational interpretation of the requirements
   - Requirement identifiers
   - Implementation boundaries

4. `docs/ENGINEERING-GUIDELINES.md`
   - Engineering constraints

5. `docs/API-CONTRACTS.md`
   - REST contracts

6. `docs/REALTIME-CONTRACTS.md`
   - Socket.IO contracts

7. `docs/TEST-MATRIX.md`
   - Requirement-to-test traceability

8. `docs/DEFINITION-OF-DONE.md`
   - Completion criteria

9. `docs/ARCHITECTURE.md`
   - Architecture decisions and implementation rationale

If any lower-level document conflicts with `README.md` or the Figma, the higher-level source wins.

Do not silently invent or expand product requirements.

---

## Mandatory Stack

The following technologies are mandatory and must participate effectively in the implementation:

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

Do not satisfy this requirement merely by installing dependencies.

---

## Critical Rules

### REST

All REST communication must use Axios.

Do not use `fetch()` directly for application REST requests.

### Remote State

Remote/server state must use TanStack Query.

Do not create a parallel manual server-state system.

### Routing

Use TanStack Router for application routes and URL search parameters.

### Realtime

Realtime scenarios must use `socket.io-client`.

Do not simulate Socket.IO events by directly calling UI setters, feature callbacks, or test-only cache mutations.

### Mocking

MSW is the network mocking boundary.

Mock responses and business scenarios must not be embedded inside React components.

### Authentication

Private data must remain isolated by user/session.

Logout and user switching must clear private cached data and previous realtime subscriptions.

### Money

ETH amounts must preserve decimal precision.

Do not use JavaScript floating-point numbers as the authoritative representation of ETH monetary values.

### Orders

Order creation must preserve idempotency requirements.

Repeated attempts must not create duplicate orders.

### Realtime Ordering

Duplicate or older Socket.IO events must never regress application state.

### Scope

Do not implement pages or product functionality explicitly excluded by the challenge.

### Visual Fidelity

Do not replace the Figma design with a generic component-library appearance.

shadcn/ui components must be adapted to the supplied visual identity.

---

## Implementation Workflow

Before implementing a task:

1. Read the relevant section of `README.md`.
2. Read the relevant section of `seed-spec.md`.
3. Read the relevant engineering guidelines.
4. Read the relevant API/realtime contracts.
5. Inspect the current implementation.
6. Identify existing patterns before creating new abstractions.
7. Implement the smallest solution satisfying the requirement.
8. Add/update relevant MSW scenarios.
9. Add/update relevant tests.
10. Run validation commands.
11. Update documentation and traceability.
12. Review the final diff.

Do not perform unrelated refactors while implementing a task.

---

## Definition of Done

A task is not complete merely because the UI renders.

Before declaring a task complete, verify the applicable requirements in:

`docs/DEFINITION-OF-DONE.md`

At minimum, verify:

- implementation;
- required behavior;
- API integration;
- loading/error/empty states;
- responsive behavior;
- accessibility;
- tests;
- documentation;
- traceability.

---

## Git Workflow

Work incrementally.

Do not rewrite Git history.

Do not amend previous commits.

Do not force-push.

Each meaningful implementation milestone should result in a focused commit.

Before committing:

```bash
git status
git diff
```

Run the relevant validation commands.

Do not commit unrelated changes.

Commit messages should describe the completed milestone.

Examples:

```text
docs: establish project specification
feat: establish application foundation
feat: implement mock API domain
feat: implement catalog and NFT detail
feat: implement cart and checkout
feat: implement authentication flows
feat: implement realtime synchronization
test: add critical Playwright flows
perf: add Lighthouse audit configuration
docs: finalize delivery documentation
```

---

## Verification

Never claim a task is complete without verification.

Prefer:

```text
implementation
→ typecheck
→ lint
→ unit/integration tests where applicable
→ Playwright
→ visual verification where applicable
→ documentation
→ git diff
```

If a required verification could not be executed, explicitly report it.

---

## Ambiguity Rule

When behavior is ambiguous:

1. Check `README.md`.
2. Check the Figma.
3. Check `seed-spec.md`.
4. Check existing contracts.
5. Choose the smallest behavior necessary.
6. Document the decision in `docs/ARCHITECTURE.md`.

Do not invent product behavior.

---

## Agent Reporting

After completing a task, report:

### Completed

What was implemented.

### Requirements Covered

List the requirement IDs from `seed-spec.md`.

### Files Changed

List relevant files.

### Tests

List tests added or executed.

### Validation

List commands executed and their results.

### Documentation

List documentation updated.

### Known Limitations

Explicitly identify anything not completed.

### Git

Report the commit hash if a commit was created.

Never report a task as fully complete while known required work remains.
