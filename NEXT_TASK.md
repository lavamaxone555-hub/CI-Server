# Next Autonomous Task

## Phase 5 — Production Database Infrastructure

## Verified Baseline
- Real PostgreSQL CI integration: VERIFIED
- Production migration set against CI PostgreSQL: VERIFIED
- Server-side GitHub Actions proof: VERIFIED PASS on c846f88
- Run ID: 33648416630

## Next Work
1. Continue production database hardening from the verified baseline.
2. Preserve migration idempotency and rollback guarantees.
3. Strengthen failure propagation and recovery verification where needed.
4. Run npm run verify and lint before every commit.
5. Push completed work and verify remote CI.

## Rule
Inspect -> Implement -> Test -> Typecheck -> Build -> Lint -> Commit -> Push -> Server CI -> Update Status.
