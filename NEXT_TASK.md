# Next Autonomous Task

## Phase 4 — Production Hardening

1. Introduce a persistence adapter boundary suitable for replacing in-memory storage.
2. Add integration tests around inventory refresh and failure/retry behavior.
3. Keep npm run verify green before every commit.
4. Commit only completed, tested units.

## CI Activation
When an authorized Git remote is available:
1. Add origin.
2. Push main and feature branches.
3. Verify the first GitHub Actions run.
4. Record the actual server-side result.

## Completion Rule
Never mark server-side CI active without a real successful remote run.
