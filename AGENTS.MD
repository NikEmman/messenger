# Rails 8 & React TDD Protocol

## Phase 1: RED (The Failure)

- **@TestWriter** creates the spec.
- **Verification:** Run `bundle exec rspec <file>` or `npm test <file>`.
- **Success Criteria:** The test MUST fail with a "Method missing" or "Element not found" error.

## Phase 2: GREEN (The Fix)

- **@Coder** writes the implementation.
- **Rails Rule:** Use modern Rails 8 syntax (e.g., `SolidCache` for caching logic).
- **React Rule:** Use Functional Components with React 18 hooks.
- **Verification:** `bundle exec rubocop -a --only [Cops]` followed by `bundle exec rspec`.

## Phase 3: REFACTOR (The Polish)

- **@Architect** checks for:
  1. **Rails:** Dry controllers, specialized Service Objects in `app/services`.
  2. **React:** Vanilla CSS and Prop Drilling avoidance.
