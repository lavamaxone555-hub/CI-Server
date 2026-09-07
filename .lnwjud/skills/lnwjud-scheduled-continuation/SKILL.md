---
name: lnwjud-scheduled-continuation
version: 1.0
---

# Durable Continuation Protocol

Active Durable Goal: session-01

## Required state
- Scheduled Continuation: auto
- Wake claim: success
- Successor: prepared
- Execution: cloud
- Checkpoint: success
- Lease: renewed

## Rules
- Maintain one active durable goal.
- Resume from checkpoint.
- Do not report terminal completion before verified acceptance.
- Reconcile host receipts when native host tools are available.
- Never fabricate unavailable host tool results.
