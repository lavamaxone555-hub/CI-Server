# CI / Runner

## Local quality gate
Run:

npm run verify

This runs tests, typecheck, and build in order and stops on the first failure.

## GitHub Actions
The workflow in .github/workflows/ci.yml runs on pushes, pull requests, and manual dispatch.

## Autonomous loop
Implementation decisions remain controlled by PROJECT_STATUS.md and NEXT_TASK.md. CI verifies quality; it does not invent or modify product requirements.
