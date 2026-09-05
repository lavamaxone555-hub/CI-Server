# UAT Checklist — Project-App

## UAT-01 POS Checkout
Complete a valid sale; confirm sale, payment and stock update are consistent.

## UAT-02 Insufficient Payment
Attempt payment below total; confirm rejection and no partial persistence.

## UAT-03 IMEI Workflow
Sell an IMEI-tracked item; confirm IMEI state changes only after successful persistence.

## UAT-04 Migration Atomicity
Run clean migrations, rerun with no pending work, then use an isolated failing migration fixture; confirm rollback and consistent history.

## UAT-05 Deployment Fail-Closed Gates
Individually omit or invalidate SSL, release identity/commit SHA, migration approval, health latency, release age, readiness age and evidence skew; confirm startup rejection.

## UAT-06 Health and Release Evidence
Use valid production-like gates; confirm healthy latency and fresh identity-bound evidence, then verify stale, future and skewed evidence are rejected.

## Exit Criteria
All scenarios PASS; no critical/high defect open; `npm run verify` PASS; final server CI SUCCESS; working tree clean.
