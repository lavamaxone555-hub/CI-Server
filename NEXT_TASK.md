# Next Autonomous Task

## Phase 5 — Production Database Infrastructure

Current work:
1. Provision a real PostgreSQL instance for integration/E2E testing.
2. Execute the production migration set against the real database.
3. Verify startup, health, readiness, failure propagation, and cleanup against a live PostgreSQL connection.
4. Add CI support for PostgreSQL-backed integration tests when the runner/service is available.
5. Run npm run verify and lint before every commit.
6. Push completed work and verify remote CI.

## Completed Phase 5 Work
- PostgreSQL configuration and SSL validation
- PostgreSQL pool boundary and connection probe
- Migration runner and migration safety checks
- Health and readiness checks
- Startup validation and production deployment configuration

## Rule
Inspect -> Implement -> Test -> Typecheck -> Build -> Lint -> Commit -> Push -> Server CI -> Update Status.
