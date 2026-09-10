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
