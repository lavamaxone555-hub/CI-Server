# RetailOS Staging / UAT Release Runbook

## Preconditions
- A non-production PostgreSQL instance is available.
- POSTGRES_INTEGRATION_URL points only to staging/UAT.
- POSTGRES_INTEGRATION_SSL matches the target database policy.
- Build artifact is produced by npm run verify.
- CI workflow has passed for the exact release commit.

## Deploy
1. Install exact lockfile dependencies with npm ci.
2. Run npm run verify.
3. Run database migrations against staging/UAT using the configured release process.
4. Start the production bundle with the target platform.
5. Confirm application health and release identity.

## UAT Execution
Execute UAT-01 through UAT-06 from UAT_CHECKLIST.md.
Record PASS/FAIL, timestamp, release commit and tester evidence for each case.

## Acceptance
Production acceptance requires all UAT cases PASS, no critical/high open defect, final server CI SUCCESS, live PostgreSQL integration PASS, and a clean/reviewed release commit.

## Safety
Never point integration or UAT variables at production.
